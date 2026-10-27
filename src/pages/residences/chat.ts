import { availableThreeBed, formatMoney, type Project, UNITS } from "./data";

const ETHIOPIC = /[\u1200-\u137F]/;

export type ResidencesReply = {
  text: string;
  lang: "en" | "am";
  tags?: string[];
};

function projectLine(p: Project): string {
  return `${p.name} — ${p.location} — ${p.developer}`;
}

function listUnits(ids: string[], currency: Project["currency"]): string {
  return ids
    .map((id) => UNITS.find((u) => u.id === id))
    .filter((u): u is (typeof UNITS)[number] => Boolean(u))
    .map((u) => `${u.code} · ${u.name} · ${u.sqm} m² · ${formatMoney(u.usd, currency)} · ${u.status}`)
    .join(" · ");
}

export function residencesReply(raw: string, project: Project): ResidencesReply {
  const text = raw.trim();
  const q = text.toLowerCase();
  const am = ETHIOPIC.test(text) || /amharic|birr|etb/.test(q);
  const name = project.name;

  if (!text) {
    return am
      ? {
          lang: "am",
          text: `Selam — I am the sales concierge for ${name}. Ask 30/40/30 USD, Chapa birr, open floors, or a tour.`,
          tags: ["Greeting"],
        }
      : {
          lang: "en",
          text: `Welcome to ${projectLine(project)}. I can walk 30/40/30 diaspora USD, local ETB via Chapa, live floor inventory, or book a private / WhatsApp tour.`,
          tags: ["Greeting"],
        };
  }

  if (/30\s*\/\s*40\s*\/\s*30|milestone|diaspora usd|payment plan/.test(q)) {
    return {
      lang: am ? "am" : "en",
      text: am
        ? `${name}: diaspora plan is 30/40/30. 30% to reserve (Stripe / USD Wire via Slotted LLC), 40% at structure complete, 30% at keys. Local buyers use the same steps in birr via Chapa or an Ethiopian bank. Which unit?`
        : `Diaspora buyers lock ${name} with a 30 / 40 / 30 USD plan: 30% at reservation via Slotted LLC · Stripe / USD Wire, 40% when structure tops out, 30% at handover. Local buyers run the same milestones in ETB through Chapa or an Ethiopian bank slip. Example on 10A (168 m²): ${formatMoney(312000, "USD")} → $93,600 / $124,800 / $93,600.`,
      tags: ["Budget · USD milestone", "Diaspora"],
    };
  }

  if (/3-?bed|3br|three.bed|8–11|8-11|floors? 8|open floor/.test(q)) {
    const open = availableThreeBed([8, 11]);
    const line = open.map((u) => `${u.code} · ${u.sqm} m² · ${formatMoney(u.usd, project.currency)}`).join("; ");
    return {
      lang: am ? "am" : "en",
      text: am
        ? `Open 3-bedrooms on floors 8–11: ${line}. 9A is held. 12A sky penthouse is ${formatMoney(585000, project.currency)}. Which shall I show?`
        : `On floors 8–11 the open 3-bedrooms are ${line}. 9A is reserved. 8B (2BR) is also open if they want west light. Sky penthouse 12A is ${formatMoney(585000, project.currency)}. I can issue a VIP diaspora pass on any available unit.`,
      tags: ["Floor 8–11", "3BR"],
    };
  }

  if (ETHIOPIC.test(text) || /birr|etb|payment option|chapa|dollar/.test(q)) {
    return {
      lang: am || ETHIOPIC.test(text) ? "am" : "en",
      text: `Two rails. Diaspora USD 30/40/30 — Slotted LLC / Stripe / USD Wire. Local ETB — Chapa or bank milestone. Open now at ${name}: ${listUnits(["8A", "10A", "11A", "12A"], project.currency)}. Which floor?`,
      tags: ["Local ETB", "Diaspora USD"],
    };
  }

  if (/tour|walkthrough|whatsapp|video|visit|book/.test(q)) {
    return {
      lang: am ? "am" : "en",
      text: `I can hold a private Bole site walk or a WhatsApp / Telegram video walkthrough from DC, London, Frankfurt, Dubai or Addis. Leave a name and number — the public invite goes out as ${project.developer}, the lead locks in the Senai Technology vault until the first milestone clears.`,
      tags: ["Tour", "WhatsApp"],
    };
  }

  if (/penthouse|12a|sky/.test(q)) {
    return {
      lang: am ? "am" : "en",
      text: `12A Sky Penthouse — 4BR, 280 m², 360 terrace, pool and pergola. ${formatMoney(585000, project.currency)}, available. I can cut a VIP diaspora buyer pass from this chat.`,
      tags: ["Penthouse", "Floor 12"],
    };
  }

  if (/prop.?desk|building os|meter|dues|telegram|etpropdeskbot/.test(q)) {
    return {
      lang: am ? "am" : "en",
      text: `After handover the building runs on Prop Desk (propdesk.et · @etpropdeskbot): 96.4% dues collection, ETB slip OCR, water/electric meter billing, generator + pump telemetry, and bilingual resident chat. Open tab 03 to drive it.`,
      tags: ["Prop Desk"],
    };
  }

  if (/partner|commission|retainer|8,?500|2,?500|option|deal/.test(q)) {
    return {
      lang: am ? "am" : "en",
      text: `${project.developer} wears the public Developer crown. Senai Technology + Prop Desk power the stack. Option A is a $8,500 Signature build + $350/mo retainer. Option B (recommended) is $2,500 mobilization plus 2.5%–3.5% on units reserved through the funnel.`,
      tags: ["Partnership"],
    };
  }

  if (/reserve|vip|pass|hold|buyer/.test(q)) {
    return {
      lang: am ? "am" : "en",
      text: `I can issue a VIP Diaspora Buyer Pass on any available unit. I need a name, WhatsApp or Telegram, and a city — DC, London, Frankfurt, Dubai or Addis. Start with 10A, 8A, 11A or the 12A penthouse.`,
      tags: ["VIP pass"],
    };
  }

  return {
    lang: am ? "am" : "en",
    text: `${projectLine(project)} is a live pre-sale machine: 3D inventory, bilingual concierge, diaspora 30/40/30 and Prop Desk after handover. Open now: ${listUnits(["8A", "10A", "11A", "12A"], project.currency)}. Ask a floor, a payment rail, or say tour.`,
    tags: ["General"],
  };
}

export function classifyLead(text: string, reply: ResidencesReply): { tag: "Diaspora" | "Local"; preference: string; budget: string } {
  const q = text.toLowerCase();
  const local = reply.lang === "am" || /etb|birr|local|addis/.test(q) || ETHIOPIC.test(text);
  const ph = /penthouse|12a|sky/.test(q);
  const three = /3-?bed|3br|three/.test(q);
  return {
    tag: local ? "Local" : "Diaspora",
    preference: ph ? "Sky penthouse" : three ? "3BR · F08–F11" : reply.tags?.[0] || "General",
    budget: local ? "ETB milestone" : "USD 30/40/30",
  };
}
