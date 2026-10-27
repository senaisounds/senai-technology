import type { Project } from "./data";

export function PartnershipTab({ project }: { project: Project }) {
  return (
    <div className="rx-deal">
      <header>
        <p className="rx-kicker">04 · Partnership models</p>
        <h2>
          {project.developer} wears the crown. <em>Senai + Prop Desk power the machine.</em>
        </h2>
        <p>
          The public developer brand stays on the tower, the brochure, and the WhatsApp line. Senai Technology runs the
          digital sales engine and diaspora gateway. Prop Desk becomes the building OS after handover.
        </p>
      </header>

      <ol className="rx-stack" aria-label="Stack">
        <li>
          <b>01</b>
          <div>
            <strong>Developer crown</strong>
            <p>{project.developer} · {project.name} · {project.location}</p>
          </div>
        </li>
        <li>
          <b>02</b>
          <div>
            <strong>Senai Technology</strong>
            <p>senaitechnology.com · 3D pre-sale, bilingual AI, diaspora 30/40/30, lead vault</p>
          </div>
        </li>
        <li>
          <b>03</b>
          <div>
            <strong>Prop Desk</strong>
            <p>propdesk.et · @etpropdeskbot · dues, OCR, meters, generator, tickets</p>
          </div>
        </li>
      </ol>

      <div className="rx-options">
        <article>
          <p className="rx-kicker">Option A</p>
          <h3>Turnkey commercial</h3>
          <p className="rx-ask">
            <b>$8,500</b>
            <span>Signature build</span>
          </p>
          <ul>
            <li>$350/mo managed AI & hosting retainer</li>
            <li>Per-unit Prop Desk OS license after handover</li>
            <li>Developer-branded sales world on this stack</li>
          </ul>
        </article>
        <article className="is-rec">
          <p className="rx-kicker">Option B · Recommended</p>
          <h3>Strategic co-venture</h3>
          <p className="rx-ask">
            <b>$2,500</b>
            <span>Mobilization setup</span>
          </p>
          <ul>
            <li>2.5% – 3.5% digital pre-sale commission on units reserved or sold through the funnel</li>
            <li>Prop Desk OS building deployment at handover</li>
            <li>Shared upside. Lower cash out. Same public crown.</li>
          </ul>
        </article>
      </div>
    </div>
  );
}
