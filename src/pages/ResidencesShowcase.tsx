import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useIsMobile, usePrefersReducedMotion } from "../lib/hooks";
import { ConciergeTab } from "./residences/ConciergeTab";
import { AM, EN } from "./residences/copy";
import {
  DEFAULT_PROJECT,
  SEED_LEADS,
  TABS,
  UNITS,
  addisClock,
  parseProject,
  projectQuery,
  type Project,
  type TabId,
  type Unit,
  type VaultLead,
} from "./residences/data";
import { KokebTwin } from "./residences/KokebTwin";
import { PartnershipTab } from "./residences/PartnershipTab";
import { PropDeskTab } from "./residences/PropDeskTab";
import { TowerTab } from "./residences/TowerTab";
import "../styles/residences.css";

export type TwinMode = "concept" | "bim";

export function ResidencesShowcase() {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile(860);
  const [params, setParams] = useSearchParams();
  const project = useMemo(() => parseProject(params), [params]);
  const [tab, setTab] = useState<TabId>("tower");
  const [floor, setFloor] = useState(10);
  const [unit, setUnit] = useState<Unit>(() => UNITS.find((u) => u.id === "10A") ?? UNITS[0]);
  const [leads, setLeads] = useState<VaultLead[]>(SEED_LEADS);
  const [custom, setCustom] = useState(false);
  const [clock, setClock] = useState(() => addisClock());
  const model: TwinMode = params.get("model") === "bim" ? "bim" : "concept";

  const setModel = (next: TwinMode) => {
    const q = projectQuery(project);
    if (next === "bim") q.set("model", "bim");
    setParams(q, { replace: true });
    setTab("tower");
    setCustom(false);
  };

  useEffect(() => {
    document.title = `${project.name} — Residences · Senai Technology`;
    document.documentElement.classList.add("rx-world");
    return () => {
      document.documentElement.classList.remove("rx-world");
      document.title = "Senai Technology";
    };
  }, [project.name]);

  useEffect(() => {
    const id = window.setInterval(() => setClock(addisClock()), 15000);
    return () => window.clearInterval(id);
  }, []);

  const patch = (next: Partial<Project>) => {
    const merged = { ...project, ...next };
    const q = projectQuery(merged);
    if (model === "bim") q.set("model", "bim");
    setParams(q, { replace: true });
  };

  const addLead = (lead: VaultLead) => {
    setLeads((rows) => [lead, ...rows.filter((r) => r.id !== lead.id)].slice(0, 8));
  };

  return (
    <div className="rx">
      <a className="rx-skip" href="#rx-main">
        Skip to showcase
      </a>
      <header className="rx-hud">
        <Link className="rx-mark" to="/">
          <span className="rx-mark-dot" aria-hidden />
          <b>Senai</b>
          <em>Residences</em>
        </Link>
        <div className="rx-hud-mid">
          <p className="rx-proj">{project.name}</p>
          <p className="rx-loc">
            {project.location} · {project.developer}
          </p>
        </div>
        <div className="rx-hud-right">
          <span className="rx-clock">{clock}</span>
          <button type="button" className={`rx-pill ${custom ? "on" : ""}`} onClick={() => setCustom((v) => !v)} aria-expanded={custom}>
            Live customizer
          </button>
        </div>
      </header>

      {custom && (
        <div className="rx-drawer">
          <label>
            <span>Project name</span>
            <input value={project.name} onChange={(e) => patch({ name: e.target.value || DEFAULT_PROJECT.name })} />
          </label>
          <label>
            <span>Addis neighborhood</span>
            <input value={project.location} onChange={(e) => patch({ location: e.target.value || DEFAULT_PROJECT.location })} />
          </label>
          <label>
            <span>Developer name</span>
            <input value={project.developer} onChange={(e) => patch({ developer: e.target.value || DEFAULT_PROJECT.developer })} />
          </label>
          <fieldset>
            <legend>Currency</legend>
            <button type="button" aria-label="USD Diaspora" className={project.currency === "USD" ? "on" : ""} onClick={() => patch({ currency: "USD" })}>
              {EN.currencyDia}
            </button>
            <button type="button" aria-label="ETB Local" className={project.currency === "ETB" ? "on" : ""} onClick={() => patch({ currency: "ETB" })}>
              {AM.currencyLocal}
            </button>
          </fieldset>
        </div>
      )}

      <nav className="rx-tabs" aria-label="Showcase modes">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "on" : ""}
            onClick={() => {
              setTab(t.id);
              setCustom(false);
            }}
          >
            <b>{t.n}</b>
            <span>{mobile ? t.short : t.en}</span>
          </button>
        ))}
      </nav>

      <div className="rx-modes" role="group" aria-label="3D model mode">
        <p className="rx-kicker">3D mode</p>
        <div className="rx-mode-row">
          <button
            type="button"
            className={model === "concept" && tab === "tower" ? "on" : ""}
            aria-pressed={model === "concept"}
            onClick={() => setModel("concept")}
          >
            <b>Mode 1</b>
            <span>{mobile ? "Miami concept tower" : "Miami-in-Addis Concept Tower (3D)"}</span>
          </button>
          <button
            type="button"
            className={model === "bim" && tab === "tower" ? "on" : ""}
            aria-pressed={model === "bim"}
            onClick={() => setModel("bim")}
          >
            <b>Mode 2</b>
            <span>{mobile ? "Measured DWG BIM twin" : "Measured DWG & ProDesk BIM Twin (Interactive 3D)"}</span>
          </button>
        </div>
      </div>

      <main id="rx-main" className="rx-main">
        {tab === "tower" && model === "bim" && <KokebTwin />}
        {tab === "tower" && model === "concept" && (
          <TowerTab
            project={project}
            floor={floor}
            setFloor={setFloor}
            unit={unit}
            setUnit={setUnit}
            mobile={mobile}
            reduced={reduced}
            onReserve={addLead}
          />
        )}
        {tab === "agent" && <ConciergeTab project={project} leads={leads} onLead={addLead} />}
        {tab === "os" && <PropDeskTab project={project} />}
        {tab === "deal" && <PartnershipTab project={project} />}
      </main>

      <footer className="rx-foot">
        <p>
          Built by <Link to="/">Senai Technology</Link> · Prop Desk · Slotted LLC · New York ⇄ Addis Ababa
        </p>
        <p>
          <Link to="/work/dj">NORA FLUX</Link>
          <a href="/kokeb-3d.html#q=high">Kokeb 3D twin</a>
          <Link to="/lab">Lab</Link>
          <Link to="/#contact">Start a project</Link>
        </p>
      </footer>
    </div>
  );
}
