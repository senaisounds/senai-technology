import { useMemo, useState, type FormEvent } from "react";
import { lazy, Suspense } from "react";
import { Floorplan } from "./Floorplan";
import {
  DIASPORA_CITIES,
  FLOORS,
  STATUS_HEX,
  STATUS_LABEL,
  floorStatus,
  formatMoney,
  passSerial,
  splitMilestone,
  unitsOnFloor,
  type Currency,
  type DiasporaCity,
  type Project,
  type Unit,
  type VaultLead,
} from "./data";
import { addisClock } from "./data";

const TowerCanvas = lazy(() => import("./TowerCanvas").then((m) => ({ default: m.TowerCanvas })));

export function TowerTab({
  project,
  floor,
  setFloor,
  unit,
  setUnit,
  mobile,
  reduced,
  onReserve,
}: {
  project: Project;
  floor: number;
  setFloor: (n: number) => void;
  unit: Unit;
  setUnit: (u: Unit) => void;
  mobile: boolean;
  reduced: boolean;
  onReserve: (lead: VaultLead) => void;
}) {
  const [open, setOpen] = useState(false);
  const units = useMemo(() => unitsOnFloor(floor), [floor]);

  return (
    <div className="rx-tower">
      <div className="rx-tower-stage">
        <div className="rx-tower-hud">
          <p>01 · 3D Pre-Sale Tower</p>
          <p>Drag to orbit · tap a floor</p>
        </div>
        <Suspense fallback={<div className="rx-gl-ph" aria-hidden />}>
          <TowerCanvas
            floor={floor}
            mobile={mobile}
            reduced={reduced}
            active
            onSelect={(n) => {
              setFloor(n);
              const next = unitsOnFloor(n)[0];
              if (next) setUnit(next);
            }}
          />
        </Suspense>
        <ol className="rx-floors" aria-label="Floors">
          {Array.from({ length: FLOORS }, (_, i) => {
            const n = FLOORS - i;
            const st = floorStatus(n);
            return (
              <li key={n}>
                <button
                  type="button"
                  className={n === floor ? "on" : ""}
                  style={{ ["--st" as string]: STATUS_HEX[st] }}
                  onClick={() => {
                    setFloor(n);
                    const next = unitsOnFloor(n)[0];
                    if (next) setUnit(next);
                  }}
                >
                  F{String(n).padStart(2, "0")}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <aside className="rx-inspect" aria-labelledby="rx-inspect-title">
        <p className="rx-kicker">Live unit & floorplan inspector</p>
        <h2 id="rx-inspect-title">
          Floor {String(floor).padStart(2, "0")}
          <em> · {units.length} residences</em>
        </h2>
        <ul className="rx-units">
          {units.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className={u.id === unit.id ? "on" : ""}
                onClick={() => setUnit(u)}
              >
                <span className="rx-dot" style={{ background: STATUS_HEX[u.status] }} />
                <strong>
                  {u.code} · {u.name}
                </strong>
                <em>
                  {u.sqm} m² · {STATUS_LABEL[u.status]}
                </em>
              </button>
            </li>
          ))}
        </ul>

        <div className="rx-unit-card" style={{ ["--st" as string]: STATUS_HEX[unit.status] }}>
          <div className="rx-unit-top">
            <p>
              {unit.code} · {unit.beds}BR / {unit.baths}BA
            </p>
            <span className={`rx-st is-${unit.status}`}>{STATUS_LABEL[unit.status]}</span>
          </div>
          <h3>{unit.name}</h3>
          <p className="rx-terrace">{unit.terrace}</p>
          <p className="rx-price">
            <b>{formatMoney(unit.usd, project.currency)}</b>
            <span>{project.currency === "USD" ? "Diaspora USD" : "Local ETB"}</span>
          </p>
          <p className="rx-dual">
            Dual ask · {formatMoney(unit.usd, "USD")} · {formatMoney(unit.usd, "ETB")}
          </p>
          <Floorplan kind={unit.plan} accent={STATUS_HEX[unit.status]} />
          <ol className="rx-miles">
            {splitMilestone(unit.usd, project.currency).map((m) => (
              <li key={m.en}>
                <b>{m.pct}%</b>
                <span>{m.en}</span>
                <em>{m.amount}</em>
                <small>{project.currency === "USD" ? m.railUsd : m.railEtb}</small>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="rx-reserve"
            disabled={unit.status !== "available"}
            onClick={() => setOpen(true)}
          >
            {unit.status === "available" ? "Reserve unit / issue VIP diaspora pass" : `${STATUS_LABEL[unit.status]} — not releasable`}
          </button>
        </div>
      </aside>

      {open && (
        <ReserveModal
          project={project}
          unit={unit}
          currency={project.currency}
          onClose={() => setOpen(false)}
          onIssue={(lead) => {
            onReserve(lead);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ReserveModal({
  project,
  unit,
  currency,
  onClose,
  onIssue,
}: {
  project: Project;
  unit: Unit;
  currency: Currency;
  onClose: () => void;
  onIssue: (lead: VaultLead) => void;
}) {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [city, setCity] = useState<DiasporaCity>("Washington, DC");
  const [issued, setIssued] = useState<VaultLead | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const serial = passSerial(`${name}|${unit.id}|${city}`);
    const lead: VaultLead = {
      id: serial,
      name: name.trim() || "Guest buyer",
      city,
      unit: unit.code,
      tag: city === "Addis Ababa" ? "Local" : "Diaspora",
      preference: `${unit.beds}BR · ${unit.name}`,
      budget: formatMoney(unit.usd, currency),
      status: "VIP pass issued",
      locked: true,
      ts: addisClock(),
    };
    setIssued(lead);
    onIssue(lead);
  };

  return (
    <div className="rx-modal" role="dialog" aria-modal="true" aria-labelledby="rx-pass-title">
      <button type="button" className="rx-modal-scrim" aria-label="Close" onClick={onClose} />
      <div className="rx-pass">
        {!issued ? (
          <>
            <p className="rx-kicker">VIP diaspora buyer pass</p>
            <h2 id="rx-pass-title">Hold {unit.code}</h2>
            <p>
              {project.name} · {project.developer}. Public crown stays with the developer; Senai Technology issues the
              pass and locks the lead.
            </p>
            <form onSubmit={submit}>
              <label>
                <span>Buyer name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </label>
              <label>
                <span>WhatsApp / Telegram</span>
                <input value={handle} onChange={(e) => setHandle(e.target.value)} required placeholder="@ or +251…" />
              </label>
              <label>
                <span>Diaspora city</span>
                <select value={city} onChange={(e) => setCity(e.target.value as DiasporaCity)}>
                  {DIASPORA_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="rx-reserve">
                Cut the pass
              </button>
            </form>
          </>
        ) : (
          <div className="rx-pass-card">
            <p className="rx-kicker">{issued.id}</p>
            <h2 id="rx-pass-title">{project.name}</h2>
            <p className="rx-pass-unit">
              {unit.code} · {unit.name} · {unit.sqm} m²
            </p>
            <dl>
              <div>
                <dt>Buyer</dt>
                <dd>{issued.name}</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>{issued.city}</dd>
              </div>
              <div>
                <dt>Rail</dt>
                <dd>{currency === "USD" ? "30/40/30 · Stripe / USD Wire" : "Chapa / bank milestone"}</dd>
              </div>
              <div>
                <dt>Ask</dt>
                <dd>{formatMoney(unit.usd, currency)}</dd>
              </div>
            </dl>
            <p className="rx-pass-stamp">Issued by Senai Technology · Slotted LLC · for {project.developer}</p>
            <button type="button" className="rx-reserve" onClick={onClose}>
              Lock into lead vault
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
