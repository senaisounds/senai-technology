import { useState } from "react";
import { AM, EN } from "./copy";
import { CHAIR_METRICS, WORK_ORDERS, type Project } from "./data";

type View = "chair" | "resident";
type PhoneScreen = "home" | "meter" | "receipt" | "issue" | "pay";
type Lang = "en" | "am";

export function PropDeskTab({ project }: { project: Project }) {
  const [view, setView] = useState<View>("chair");
  const [lang, setLang] = useState<Lang>("en");
  const [screen, setScreen] = useState<PhoneScreen>("home");
  const [scan, setScan] = useState(0);
  const [paid, setPaid] = useState(false);
  const [ticket, setTicket] = useState("");
  const t = lang === "am" ? AM : EN;

  return (
    <div className="rx-os">
      <header className="rx-os-head">
        <div>
          <p className="rx-kicker">03 · Prop Desk Building OS</p>
          <h2>
            After handover, {project.name} <em>runs itself.</em>
          </h2>
          <p>
            <a href="https://propdesk.et" target="_blank" rel="noopener noreferrer">
              propdesk.et
            </a>{" "}
            · @etpropdeskbot · the developer keeps the public chair; Senai Technology operates the OS.
          </p>
        </div>
        <div className="rx-switch" role="tablist" aria-label="Prop Desk view">
          <button type="button" role="tab" aria-selected={view === "chair"} className={view === "chair" ? "on" : ""} onClick={() => setView("chair")}>
            Chair command
          </button>
          <button type="button" role="tab" aria-selected={view === "resident"} className={view === "resident" ? "on" : ""} onClick={() => setView("resident")}>
            Resident · Telegram
          </button>
        </div>
      </header>

      {view === "chair" ? (
        <div className="rx-chair">
          <article className="rx-stat">
            <p>Monthly dues</p>
            <b>{CHAIR_METRICS.collection}%</b>
            <span>collected · {CHAIR_METRICS.occupied}/{CHAIR_METRICS.units} units posted</span>
          </article>
          <article className="rx-stat">
            <p>Bank slip · OCR</p>
            <b>12A</b>
            <span>4,200 ETB confirmed · Chapa / slip</span>
          </article>
          <article className="rx-stat">
            <p>Meter auto-bill</p>
            <b>ETB {(CHAIR_METRICS.waterBill + CHAIR_METRICS.powerBill).toLocaleString("en-US")}</b>
            <span>Water {CHAIR_METRICS.waterBill} · Electric {CHAIR_METRICS.powerBill}</span>
          </article>
          <article className="rx-stat">
            <p>Generator fuel</p>
            <b>{CHAIR_METRICS.generatorPct}%</b>
            <span>Pump {CHAIR_METRICS.pumpPsi} bar · live</span>
          </article>
          <section className="rx-orders">
            <h3>Work orders · ETA</h3>
            <ul>
              {WORK_ORDERS.map((w) => (
                <li key={w.id} className={`is-${w.tone}`}>
                  <strong>
                    {w.id} · {w.unit}
                  </strong>
                  <span>{w.issue}</span>
                  <em>{w.eta}</em>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <div className="rx-resident">
          <div className="rx-phone" data-screen={screen}>
            <div className="rx-phone-bar">
              <span>9:41</span>
              <span>{lang === "am" ? "አማ" : "EN"}</span>
            </div>
            {screen === "home" && (
              <div className={`rx-phone-home ${lang}`}>
                <div className="rx-phone-brand">
                  <span className="rx-logo" aria-hidden />
                  <strong>Prop Desk</strong>
                  <em>propdesk.et</em>
                </div>
                <p className="rx-phone-lede">{t.lede}</p>
                <div className="rx-feed">
                  <article>
                    <b>Chair</b>
                    <p>Unit 12A dues slip · 4,200 ETB confirmed</p>
                  </article>
                  <article>
                    <b>Homeowner</b>
                    <p>Opened ticket · pump room leak</p>
                  </article>
                  <article>
                    <b>Staff</b>
                    <p>Lift 2 — on site, ETA 20 min</p>
                  </article>
                </div>
                <p className="rx-phone-note">Chairs run billing and maintenance from the desk app.</p>
              </div>
            )}
            {screen === "meter" && (
              <div className="rx-phone-tool">
                <h3>{t.meter}</h3>
                <div className="rx-viewfinder">
                  <span style={{ transform: `scaleX(${scan || 0.12})` }} />
                </div>
                <p>{scan >= 1 ? "Water 186 m³ · Electric 420 kWh · posted to 12A" : "Align the analog dial. OCR reads water + electric."}</p>
                <button
                  type="button"
                  onClick={() => {
                    setScan(0);
                    const start = performance.now();
                    const step = (now: number) => {
                      const p = Math.min(1, (now - start) / 900);
                      setScan(p);
                      if (p < 1) requestAnimationFrame(step);
                    };
                    requestAnimationFrame(step);
                  }}
                >
                  Scan meter
                </button>
              </div>
            )}
            {screen === "receipt" && (
              <div className="rx-phone-tool">
                <h3>{t.receipt}</h3>
                <dl className="rx-slip">
                  <div>
                    <dt>Unit</dt>
                    <dd>12A</dd>
                  </div>
                  <div>
                    <dt>Dues</dt>
                    <dd>4,200 ETB</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>Confirmed</dd>
                  </div>
                  <div>
                    <dt>Rail</dt>
                    <dd>Bank slip · OCR</dd>
                  </div>
                </dl>
              </div>
            )}
            {screen === "issue" && (
              <div className="rx-phone-tool">
                <h3>{t.report}</h3>
                <textarea value={ticket} onChange={(e) => setTicket(e.target.value)} placeholder="Pump room leak…" rows={4} />
                <p>{ticket.trim() ? `Ticket opened · ${ticket.trim()} · staff ETA 20 min` : "Describe the issue. Chair + staff see it live."}</p>
              </div>
            )}
            {screen === "pay" && (
              <div className="rx-phone-tool">
                <h3>{t.pay}</h3>
                <p>Instant Chapa or slip. 12A · 4,200 ETB.</p>
                <button type="button" onClick={() => setPaid(true)}>
                  {paid ? t.payOk : "Pay with Chapa"}
                </button>
              </div>
            )}
            <nav className="rx-phone-nav" aria-label="Resident tools">
              {(
                [
                  ["home", lang === "am" ? "ቤት" : "Desk"],
                  ["meter", t.meter],
                  ["receipt", t.receipt],
                  ["issue", t.report],
                  ["pay", t.pay],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" className={screen === id ? "on" : ""} onClick={() => setScreen(id)}>
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <aside className="rx-tg">
            <div className="rx-tg-head">
              <button type="button" className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
                EN
              </button>
              <button type="button" className={lang === "am" ? "on" : ""} onClick={() => setLang("am")}>
                አማ
              </button>
              <span>@etpropdeskbot</span>
            </div>
            <div className="rx-tg-thread">
              <p className="is-bot">{t.botIntro}</p>
              <p className="is-me">{lang === "am" ? AM.pay : "Pay 12A dues"}</p>
              <p className="is-bot">{t.payOk}</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
