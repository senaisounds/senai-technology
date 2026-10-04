import { Suspense, lazy, useEffect, useReducer, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { motion } from "motion/react";
import { useInView, useIsMobile, usePrefersReducedMotion } from "./lib/hooks";
import { SERVICES, WORK, CONTACT_EMAIL, type WorkItem } from "./content";
import { PALETTES, SERVICE_COLORS } from "./palette";
import { createFluid } from "./lib/fluid";
import { CheckPage } from "./components/CheckPage";

const HeroScene = lazy(() => import("./components/HeroScene").then((m) => ({ default: m.HeroScene })));
const ServicesScene = lazy(() => import("./components/ServicesScene").then((m) => ({ default: m.ServicesScene })));
const AirScene = lazy(() => import("./components/AirScene").then((m) => ({ default: m.AirScene })));

const reveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
};

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/check" element={<CheckPage />} />
    </Routes>
  );
}

function HomePage() {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.12, anchors: true });
    return () => lenis.destroy();
  }, [reduced]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Hero reduced={reduced} />
        <Marquee />
        <Services reduced={reduced} />
        <Air reduced={reduced} />
        <Work />
        <Paint reduced={reduced} />
      </main>
      <Footer />
      <div className="grain" aria-hidden />
    </>
  );
}

function Nav() {
  return (
    <header className="nav">
      <a href="#top" className="logo" aria-label="Senai Technology home">
        <span className="logo-dot" />
        Senai<span className="thin">Technology</span>
      </a>
      <nav aria-label="Primary">
        <a href="#services">Services</a>
        <a href="#work">Work</a>
        <a href="#contact" className="nav-cta">Start a project</a>
      </nav>
    </header>
  );
}

function Hero({ reduced }: { reduced: boolean }) {
  const [ref, inView] = useInView<HTMLElement>("0px");
  const [accent, next] = useReducer((s: number) => (s + 1) % PALETTES.length, 0);
  const mobile = useIsMobile();
  const color = PALETTES[accent].accent;
  return (
    <section
      id="top"
      ref={ref}
      className="hero"
      style={{ ["--accent" as string]: color }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a,button")) return;
        next();
      }}
    >
      <div className="hero-canvas">
        <Suspense fallback={null}>
          <HeroScene accentIndex={accent} eventSource={ref} active={inView} reduced={reduced} mobile={mobile} />
        </Suspense>
      </div>
      <div className="hero-copy">
        <p className="kicker">
          <span className="pill">Play with us</span> Creative technology studio · Briarcliff Manor, NY ⇄ Addis Ababa
        </p>
        <h1 className="display">
          Senai Technology<span className="accent-dot">.</span>
          <span className="display-sub">We build what’s next: AI, apps, brand, motion.</span>
        </h1>
        <div className="hero-actions">
          <a href="#contact" className="btn btn-primary">Start a project <span aria-hidden>→</span></a>
          <a href="/check" className="btn btn-ghost">Check your website</a>
        </div>
        <p className="hint" aria-hidden>
          <span>Move to shove · Click to recolour</span>
          <span className="swatch" style={{ background: color }} /> {PALETTES[accent].name}
        </p>
      </div>
    </section>
  );
}

function Marquee() {
  const words = ["AI websites", "Mobile apps", "Brand identity", "AI visuals", "Motion", "Chatbots", "Booking assistants", "Automations", "Event experiences"];
  const row = words.map((w, i) => (
    <span key={i}>
      {w}
      <i aria-hidden>✺</i>
    </span>
  ));
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}

function Services({ reduced }: { reduced: boolean }) {
  const [ref, inView] = useInView<HTMLElement>("100px");
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const mobile = useIsMobile();
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(Math.max(-r.top / Math.max(total, 1), 0), 1);
      const raw = Math.min(Math.max(p * 6 - 0.5, 0), 5);
      const i = Math.floor(raw);
      const f = raw - i;
      // hold each shape, then morph in the middle of the scroll step
      const eased = f < 0.35 ? 0 : f > 0.75 ? 1 : (f - 0.35) / 0.4;
      progress.current = i + eased;
      setActive(Math.round(raw));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
  return (
    <section id="services" ref={ref} className="services" style={{ ["--svc" as string]: SERVICE_COLORS[active] }}>
      <div className="services-sticky">
        <Suspense fallback={null}>
          <ServicesScene progress={progress} active={inView} reduced={reduced} mobile={mobile} />
        </Suspense>
        <div className="services-head">
          <p className="kicker"><span className="pill">What we make</span> Six ways in</p>
          <ol className="services-index" aria-hidden>
            {SERVICES.map((s, i) => (
              <li key={s.n} className={i === active ? "on" : ""}>{s.n}</li>
            ))}
          </ol>
        </div>
      </div>
      <div className="services-steps">
        {SERVICES.map((s, i) => (
          <article key={s.n} className={`svc ${i === active ? "is-active" : ""}`} style={{ ["--c" as string]: SERVICE_COLORS[i] }}>
            <span className="svc-n">{s.n} / 06</span>
            <h2 className="svc-title">{s.title}</h2>
            <p className="svc-body">{s.body}</p>
            <ul className="svc-tags">
              {s.tags.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function Air({ reduced }: { reduced: boolean }) {
  const [ref, inView] = useInView<HTMLElement>("100px");
  return (
    <section ref={ref} className="air" aria-labelledby="air-title">
      <div className="air-canvas">
        <Suspense fallback={null}>
          <AirScene active={inView} reduced={reduced} />
        </Suspense>
      </div>
      <div className="air-caption">
        <h2 id="air-title" className="kicker"><span className="pill">Air has a surface</span></h2>
        <p>Run your cursor across it. We sweat the small, touchable details — the kind of interaction people remember.</p>
      </div>
    </section>
  );
}

function Tile({ item, i }: { item: WorkItem; i: number }) {
  const ref = useRef<HTMLElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
  };
  const onEnter = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const id = performance.now();
    setRipples((rs) => [...rs.slice(-3), { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    window.setTimeout(() => setRipples((rs) => rs.filter((q) => q.id !== id)), 1200);
  };
  const onLeave = () => {
    const el = ref.current!;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  const Inner = (
    <>
      <div className={`tile-art ${item.art}`} aria-hidden>
        <span className="tile-glyph">{item.title.split(" ")[0]}</span>
      </div>
      {ripples.map((r) => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} aria-hidden />
      ))}
      <div className="tile-meta">
        <span className={`badge ${item.label === "Concept" ? "badge-concept" : "badge-live"}`}>
          {item.label === "Concept" ? "Concept · placeholder" : "Past project · App Store"}
        </span>
        <h3>{item.title}</h3>
        <p className="tile-kind">{item.kind}</p>
        <p className="tile-blurb">{item.blurb}</p>
        {item.href && <span className="tile-link">openslot.me ↗</span>}
      </div>
    </>
  );
  return (
    <motion.article
      ref={ref}
      className={`tile ${i === 0 ? "tile-feature" : ""}`}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      {...reveal}
      transition={{ ...reveal.transition, delay: i * 0.08 }}
    >
      {item.href ? (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className="tile-inner">{Inner}</a>
      ) : (
        <div className="tile-inner">{Inner}</div>
      )}
    </motion.article>
  );
}

function Work() {
  return (
    <section id="work" className="work">
      <motion.div className="section-head" {...reveal}>
        <p className="kicker"><span className="pill">Selected work</span> One shipped, more on the way</p>
        <h2 className="display-md">Things we’ve made <em>&amp; things we’d love to.</em></h2>
      </motion.div>
      <div className="work-grid">
        {WORK.map((w, i) => <Tile key={w.title} item={w} i={i} />)}
      </div>
    </section>
  );
}

function Paint({ reduced }: { reduced: boolean }) {
  const [ref, inView] = useInView<HTMLElement>("0px");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fluid = useRef<ReturnType<typeof createFluid>>(null);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    if (reduced || !canvasRef.current) return;
    fluid.current = createFluid(canvasRef.current, 1.5);
    return () => {
      fluid.current?.destroy();
      fluid.current = null;
    };
  }, [reduced]);
  useEffect(() => {
    if (inView) fluid.current?.start();
    else fluid.current?.stop();
  }, [inView]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const project = String(data.get("project") || "").trim();
    // TODO(Senai): no backend yet — this opens the visitor's mail client.
    // Swap for a form service / serverless endpoint and the real inbox before launch.
    const subject = `New project enquiry — ${name || "Senai Technology site"}`;
    const body = `Name: ${name}\nEmail: ${email}\n\nProject:\n${project}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(name || "friend");
  };

  return (
    <section id="contact" ref={ref} className={`paint ${reduced ? "paint-static" : ""}`}>
      <canvas ref={canvasRef} className="paint-canvas" aria-hidden />
      <div className="paint-inner">
        <motion.div className="paint-copy" {...reveal}>
          <p className="kicker"><span className="pill">Paint with us</span> Drag ink across the page</p>
          <h2 className="display-lg">Start a<br />project.</h2>
          <p className="lede">
            Tell us what you’re dreaming up — a site, an app, a brand, a film, an AI assistant or something that doesn’t have a name yet.
            We reply within two business days.
          </p>
          <p className="small">
            Or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <span className="todo" title="Placeholder address — replace before launch">TODO: placeholder inbox</span>
          </p>
        </motion.div>
        <motion.form className="form" onSubmit={onSubmit} {...reveal} aria-label="Project enquiry">
          <label>
            <span>Name</span>
            <input name="name" autoComplete="name" required placeholder="Your name" />
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
          </label>
          <label>
            <span>Project</span>
            <textarea name="project" rows={4} required placeholder="What should we build together?" />
          </label>
          <button type="submit" className="btn btn-primary btn-block">Send it <span aria-hidden>→</span></button>
          <p className="form-note" role="status">
            {sent
              ? `Thanks, ${sent} — your mail app should open with the message ready to send.`
              : "No backend yet: submitting opens your email app (mailto)."}
          </p>
        </motion.form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-big" aria-hidden>Senai Technology</div>
      <div className="footer-row">
        <p>© 2026 Senai Technology, a Slotted LLC company</p>
        <p>Briarcliff Manor, New York · Addis Ababa roots</p>
        <p><a href="#top">Back to top ↑</a></p>
      </div>
    </footer>
  );
}
