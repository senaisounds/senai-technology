import { useEffect, useRef, useState } from "react";
import { classifyLead, residencesReply } from "./chat";
import { AM, EN } from "./copy";
import { addisClock, type Project, type VaultLead } from "./data";

type Msg = { id: string; role: "user" | "assistant"; content: string; lang?: "en" | "am" };

const CHIPS = [
  { id: "mile", en: EN.mileChip, send: EN.mileChip },
  { id: "three", en: EN.threeChip, send: EN.threeChip },
  { id: "pay", en: AM.payChip, send: AM.payChip },
  { id: "tour", en: EN.tourChip, send: EN.tourChip },
] as const;

async function askApi(messages: { role: string; content: string }[], project: Project): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 1600);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "residences",
        project,
        messages,
      }),
      signal: ctrl.signal,
    });
    window.clearTimeout(t);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json")) {
      const data = (await res.json()) as { reply?: string };
      return data.reply?.trim() || null;
    }
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let acc = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });
    }
    const text = acc.replace(/data: \[DONE\]/g, "").replace(/^data: /gm, "").trim();
    return text || null;
  } catch {
    return null;
  }
}

export function ConciergeTab({
  project,
  leads,
  onLead,
}: {
  project: Project;
  leads: VaultLead[];
  onLead: (lead: VaultLead) => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      id: "hello",
      role: "assistant",
      content: residencesReply("", project).text,
      lang: "en",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const user: Msg = { id: `u-${Date.now()}`, role: "user", content: q };
    const local = residencesReply(q, project);
    const aid = `a-${Date.now()}`;
    setMsgs((m) => [...m, user, { id: aid, role: "assistant", content: local.text, lang: local.lang }]);
    setInput("");
    setBusy(true);
    const classified = classifyLead(q, local);
    onLead({
      id: `L-${Date.now().toString().slice(-6)}`,
      name: "Live inquiry",
      city: classified.tag === "Local" ? "Addis Ababa" : "Diaspora",
      unit: /12a/i.test(q) ? "12A" : /10a/i.test(q) ? "10A" : "—",
      tag: classified.tag,
      preference: classified.preference,
      budget: classified.budget,
      status: /tour|walkthrough|whatsapp/i.test(q) ? "Tour booked" : "Qualified",
      locked: true,
      ts: addisClock(),
    });
    const api = await askApi(
      [...msgs, user].map((m) => ({ role: m.role, content: m.content })),
      project,
    );
    if (api && local.lang !== "am" && !/starter \/ launch|nora flux|care plan is \$150/i.test(api)) {
      setMsgs((m) => m.map((row) => (row.id === aid ? { ...row, content: api } : row)));
    }
    setBusy(false);
  };

  return (
    <div className="rx-agent">
      <section className="rx-chat" aria-labelledby="rx-chat-title">
        <div className="rx-chat-head">
          <p className="rx-kicker">02 · AI Sales Agent · EN / አማ</p>
          <h2 id="rx-chat-title">24/7 bilingual concierge</h2>
          <p>
            Tuned for {project.name}. Instant real-estate answers in English and Amharic; also wired to{" "}
            <code>/api/chat</code>.
          </p>
        </div>
        <div className="rx-chips" role="list">
          {CHIPS.map((c) => (
            <button key={c.id} type="button" onClick={() => void send(c.send)} disabled={busy}>
              {c.en}
            </button>
          ))}
        </div>
        <div className="rx-thread" aria-live="polite">
          {msgs.map((m) => (
            <div key={m.id} className={`rx-bubble is-${m.role} ${m.lang === "am" ? "is-am" : ""}`}>
              {m.content}
            </div>
          ))}
          <div ref={end} />
        </div>
        <form
          className="rx-chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label>
            <span className="sr">Message</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask in English or Amharic…"
              disabled={busy}
            />
          </label>
          <button type="submit" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
      </section>

      <aside className="rx-vault" aria-labelledby="rx-vault-title">
        <p className="rx-kicker">Developer lead vault</p>
        <h2 id="rx-vault-title">Telemetry · locked until milestone</h2>
        <p>
          Diaspora and local inquiries are tagged by budget and floor, then held in Senai Technology’s database. The
          developer sees the crown; the vault stays with the studio until 30% clears.
        </p>
        <ul>
          {leads.map((l) => (
            <li key={l.id}>
              <div>
                <strong>{l.name}</strong>
                <span>
                  {l.city} · {l.unit}
                </span>
              </div>
              <p>
                {l.tag} · {l.preference}
              </p>
              <p className="rx-vault-meta">
                <em>{l.budget}</em>
                <b>{l.status}</b>
                <small>{l.locked ? "Locked" : "Open"} · {l.ts}</small>
              </p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
