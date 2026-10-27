export type LeadPayload = {
  name: string;
  email: string;
  source: string;
  need?: string;
  message?: string;
  business?: string;
  city?: string;
  budget?: string;
  websiteUrl?: string;
  score?: number | string;
  timestamp?: string;
  [key: string]: unknown;
};

const EMAIL = "hello@senaitechnology.com";
const CC = "sgmotley@gmail.com";

const env = (key: string) => {
  try {
    return typeof process !== "undefined" ? process.env?.[key] : undefined;
  } catch {
    return undefined;
  }
};

const jsonHeaders = { "Content-Type": "application/json", Accept: "application/json" };

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: jsonHeaders, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
}

type NotionProp = { type?: string; name?: string };

function notionValue(type: string, lead: LeadPayload, key: string) {
  const raw = lead[key];
  const text = raw == null ? "" : String(raw);
  if (type === "title") return { title: [{ text: { content: (lead.name || "New lead").slice(0, 200) } }] };
  if (type === "email") return { email: lead.email };
  if (type === "url") return lead.websiteUrl && String(lead.websiteUrl).startsWith("http") ? { url: String(lead.websiteUrl) } : undefined;
  if (type === "number" && (key === "score" || /score/i.test(key))) {
    const n = Number(lead.score);
    return Number.isFinite(n) ? { number: n } : undefined;
  }
  if (type === "select") return { select: { name: (lead.source || "website").slice(0, 80) } };
  if (type === "rich_text") {
    const blob = [lead.need, lead.message, lead.business, lead.city, lead.budget, lead.websiteUrl, lead.score]
      .filter((v) => v != null && String(v).trim())
      .join(" · ");
    const pick =
      /source/i.test(key) ? lead.source :
      /need|message|note|project/i.test(key) ? (lead.need || lead.message || blob) :
      /city/i.test(key) ? lead.city :
      /budget/i.test(key) ? lead.budget :
      /business|company/i.test(key) ? lead.business :
      blob;
    if (!pick) return undefined;
    return { rich_text: [{ text: { content: String(pick).slice(0, 1900) } }] };
  }
  return undefined;
}

async function insertNotion(lead: LeadPayload) {
  const key = env("NOTION_API_KEY");
  const db = env("NOTION_LEADS_DB_ID");
  if (!key || !db) return;
  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
  };
  const schemaRes = await fetch(`https://api.notion.com/v1/databases/${db}`, { headers });
  const properties: Record<string, unknown> = {};
  if (schemaRes.ok) {
    const schema = (await schemaRes.json()) as { properties?: Record<string, NotionProp> };
    for (const [name, def] of Object.entries(schema.properties || {})) {
      const type = def.type || "";
      const value = notionValue(type, lead, name);
      if (value) properties[name] = value;
    }
  }
  if (!Object.values(properties).some((p) => p && typeof p === "object" && "title" in (p as object))) {
    properties.Name = { title: [{ text: { content: (lead.name || "New lead").slice(0, 200) } }] };
  }
  const page = {
    parent: { database_id: db },
    properties,
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: JSON.stringify(lead).slice(0, 1900) } }],
        },
      },
    ],
  };
  const res = await fetch("https://api.notion.com/v1/pages", { method: "POST", headers, body: JSON.stringify(page) });
  if (!res.ok) {
    await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        parent: { database_id: db },
        properties: { Name: { title: [{ text: { content: (lead.name || "New lead").slice(0, 200) } }] } },
        children: page.children,
      }),
    });
  }
}

async function formsubmitBackup(lead: LeadPayload) {
  await postJson(`https://formsubmit.co/ajax/${EMAIL}`, {
    ...lead,
    _cc: CC,
    _subject: `New Senai Technology lead — ${lead.source}`,
    _template: "table",
    _captcha: "false",
  });
}

export async function notifyLead(raw: LeadPayload): Promise<void> {
  const lead: LeadPayload = {
    ...raw,
    timestamp: raw.timestamp || new Date().toISOString(),
    source: raw.source || "unknown",
  };
  console.log("[Lead]", JSON.stringify(lead));

  const hooks = [env("LEAD_WEBHOOK_URL"), env("CHAT_LEAD_WEBHOOK_URL")].filter(
    (u, i, a): u is string => Boolean(u) && a.indexOf(u) === i,
  );

  const jobs: Promise<unknown>[] = hooks.map((url) =>
    postJson(url, lead).catch((err) => console.error("[Lead] webhook failed", url, err)),
  );

  if (env("NOTION_API_KEY") && env("NOTION_LEADS_DB_ID")) {
    jobs.push(insertNotion(lead).catch((err) => console.error("[Lead] Notion failed", err)));
  }

  if (hooks.length === 0) {
    jobs.push(formsubmitBackup(lead).catch((err) => console.error("[Lead] formsubmit failed", err)));
  }

  await Promise.allSettled(jobs);
}
