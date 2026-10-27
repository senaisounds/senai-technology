import { useEffect } from "react";
import { Link } from "react-router-dom";
import { HeroGenerator } from "./lab/HeroGenerator";
import { MotionScrubber } from "./lab/MotionScrubber";
import { StudioPass } from "./lab/StudioPass";
import { PulseSequencer } from "./lab/PulseSequencer";
import "../styles/lab.css";

const JUMP = [
  { href: "#exp-hero", n: "01", label: "Hero" },
  { href: "#exp-motion", n: "02", label: "Motion" },
  { href: "#exp-pass", n: "03", label: "Pass" },
  { href: "#exp-seq", n: "04", label: "Pulse" },
];

export function LabPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Lab — Live Hero Generator · Senai Technology";
    document.documentElement.classList.add("is-lab");
    return () => {
      document.title = prev;
      document.documentElement.classList.remove("is-lab");
    };
  }, []);

  return (
    <div className="lab">
      <a className="skip" href="#lab-main">Skip to lab</a>
      <header className="lab-nav">
        <Link to="/" className="logo">
          <span className="logo-dot" aria-hidden />
          <span className="logo-word">Senai</span>
          <span className="logo-thin">Lab</span>
        </Link>
        <nav aria-label="Experiments">
          {JUMP.map((j) => (
            <a key={j.href} href={j.href}>
              <b>{j.n}</b> {j.label}
            </a>
          ))}
        </nav>
        <div className="lab-nav-right">
          <Link to="/check" className="lab-nav-ghost">Check</Link>
          <Link to="/#contact" className="lab-nav-cta">Start a project</Link>
        </div>
      </header>

      <main id="lab-main">
        <section className="lab-intro">
          <p className="lab-kicker"><span>SNY—LAB</span> Zero onboarding · instant play</p>
          <h1>The tools, <em>live.</em></h1>
          <p className="lab-lede">
            Four experiments drawn from the newest Atelier UI, Motion2Code, Ticket Tear, Ascension, and Coolors notes —
            built as real, SEO-readable DOM over WebGL, SVG, paper physics, and Web Audio. Space cycles palettes.
          </p>
          <ol className="lab-index">
            {JUMP.map((j) => (
              <li key={j.href}>
                <a href={j.href}>
                  <span>{j.n}</span>
                  {j.label}
                </a>
              </li>
            ))}
          </ol>
        </section>
        <HeroGenerator />
        <MotionScrubber />
        <StudioPass />
        <PulseSequencer />
      </main>

      <footer className="lab-foot">
        <p>© 2026 Senai Technology · New York ⇄ Addis Ababa</p>
        <p>
          <Link to="/">Home</Link>
          <Link to="/check">Website check</Link>
          <Link to="/work/dj">NORA FLUX</Link>
          <a href="mailto:hello@senaitechnology.com">hello@senaitechnology.com</a>
        </p>
      </footer>
    </div>
  );
}

export default LabPage;
