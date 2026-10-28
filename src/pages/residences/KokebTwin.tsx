import { useState } from "react";

const FLOORS = ["B", "G", "M", "1", "2", "3", "4", "5", "6", "R"] as const;

function twinUrl(hash: string) {
  return `/kokeb-3d.html#${hash}`;
}

export function KokebTwin() {
  const [src, setSrc] = useState(twinUrl("q=high"));
  const [preset, setPreset] = useState("all");

  const go = (id: string, hash: string) => {
    setPreset(id);
    setSrc(twinUrl(hash));
  };

  return (
    <section className="rx-bim" aria-labelledby="rx-bim-title">
      <div className="rx-bim-bar">
        <div>
          <p className="rx-kicker">Measured DWG · ProDesk BIM twin</p>
          <h2 id="rx-bim-title">Kokeb Apartments · Megenagna</h2>
          <p>
            Interactive CAD/BIM digital twin from owner DWGs. Ten levels <b>B, G, M, 1–6, R</b> ·{" "}
            <b>194</b> tagged assets · <b>166</b> fixtures · <b>18</b> devices · clickable ProDesk
            spaces with measured m². Explode slider, sun time, Electrical / Sanitary / Meters layers.
          </p>
        </div>
        <a className="rx-bim-full" href="/kokeb-3d.html#q=high" target="_blank" rel="noopener noreferrer">
          Full Screen 3D Twin ↗
        </a>
      </div>
      <div className="rx-bim-presets" role="group" aria-label="Kokeb floor presets">
        <button type="button" className={preset === "all" ? "on" : ""} onClick={() => go("all", "q=high")}>
          All floors
        </button>
        <button type="button" className={preset === "exterior" ? "on" : ""} onClick={() => go("exterior", "q=high&view=exterior")}>
          Street
        </button>
        <button type="button" className={preset === "top" ? "on" : ""} onClick={() => go("top", "q=high&view=top")}>
          Top
        </button>
        {FLOORS.map((f) => (
          <button
            key={f}
            type="button"
            className={preset === f ? "on" : ""}
            onClick={() => go(f, `q=high&floor=${f}`)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="rx-bim-frame">
        <iframe key={src} title="Kokeb Apartments measured 3D BIM twin" src={src} allow="fullscreen" />
      </div>
    </section>
  );
}
