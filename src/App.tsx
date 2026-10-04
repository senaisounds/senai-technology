import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useInView, useIsMobile, useMagnetic, usePrefersReducedMotion, useSectionProgress } from "./lib/hooks";
import { createHero, type Hero as HeroGL } from "./lib/heroGL";
import { ALSO, COLORS, CONTACT_EMAIL, INCLUDED, PROCESS, PROJECT_TYPES, TIERS, WORK, type WorkItem } from "./content";
import { DitherIcon } from "./components/DitherIcon";
import { DitherArt } from "./components/DitherArt";


const SECTIONS = [
  { id: "offer", label: "Offer" },
  { id: "process", label: "Process" },
  { id: "work", label: "Work" },
  { id: "studio", label: "Studio" },
];

export function App() {
  const reduced = usePrefersReducedMotion();
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.11, anchors: { offset: -20 } });
    return () => lenis.destroy();
  }, [reduced]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <ScrollBar />
      <Nav />
      <main id="main">
        <Hero reduced={reduced} />
        <Ticker />
        <Offer reduced={reduced} onPick={setProjectType} />
        <Process />
        <Work />
        <Studio reduced={reduced} />
        <Contact reduced={reduced} projectType={projectType} setProjectType={setProjectType} />
      </main>
      <Footer />
      <div className="grain" aria-hidden />
    </>
  );
}

/* ---------------------------------------------------------------- shared bits */

/** Label that rolls up to a duplicate on hover. */
function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span className="roll-a">{children}</span>
      <span className="roll-b" aria-hidden>{children}</span>
    </span>
  );
}

function Btn({ href, children, variant = "primary", onClick }: { href: string; children: string; variant?: "primary" | "ghost"; onClick?: () => void }) {
  const ref = useMagnetic<HTMLAnchorElement>(0.2);
  return (
    <a ref={ref} href={href} className={`btn btn-${variant}`} onClick={onClick}>
      <Roll>{children}</Roll>
      <span className="btn-arrow" aria-hidden>
        <span>→</span>
        <span>→</span>
      </span>
    </a>
  );
}

function Label({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="label">
      <span className="label-n">{n}</span>
      <span className="label-line" aria-hidden />
      {children}
    </p>
  );
}

const fmt = (tz: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
const NYC = fmt("America/New_York");
const ADD = fmt("Africa/Addis_Ababa");

function Clocks({ className = "" }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  const t = (f: Intl.DateTimeFormat) => {
    const [h, m] = f.format(now).split(":");
    return (
      <>
        {h}
        <span className="blink">:</span>
        {m}
      </>
    );
  };
  return (
    <p className={`clocks ${className}`}>
      <span><b>NYC</b> <time>{t(NYC)}</time></span>
      <span className="clocks-sep" aria-hidden>⇄</span>
      <span><b>ADD</b> <time>{t(ADD)}</time></span>
    </p>
  );
}

function ScrollBar() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      ref.current?.style.setProperty("transform", `scaleX(${max > 0 ? window.scrollY / max : 0})`);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return <div className="scrollbar" ref={ref} aria-hidden />;
}

/* ---------------------------------------------------------------- nav */

function Nav() {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const links = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const els = [...SECTIONS.map((s) => s.id), "contact"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const lightEls = new Set<Element>();
    const band = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.isIntersecting ? lightEls.add(e.target) : lightEls.delete(e.target);
        setLight(lightEls.size > 0);
      },
      { rootMargin: "-30px 0px -94% 0px" },
    );
    document.querySelectorAll("[data-nav='light']").forEach((el) => band.observe(el));
    const top = () => window.scrollY < window.innerHeight * 0.5 && setActive(null);
    window.addEventListener("scroll", top, { passive: true });
    return () => {
      io.disconnect();
      band.disconnect();
      window.removeEventListener("scroll", top);
    };
  }, []);

  useLayoutEffect(() => {
    const el = active ? links.current[active] : null;
    setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
  }, [active]);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <header className={`nav ${open ? "is-open" : ""} ${light && !open ? "nav-light" : ""}`}>
      <a href="#top" className="logo" onClick={() => setOpen(false)}>
        <span className="logo-dot" aria-hidden />
        <span className="logo-word">Senai</span>{" "}
        <span className="logo-thin">Technology</span>
      </a>
      <nav aria-label="Primary" className="nav-links">
        <span
          className="nav-pill"
          aria-hidden
          style={pill ? { transform: `translateX(${pill.x}px)`, width: pill.w, opacity: 1 } : { opacity: 0 }}
        />
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            ref={(el) => {
              links.current[s.id] = el;
            }}
            className={active === s.id ? "on" : ""}
            aria-current={active === s.id ? "true" : undefined}
          >
            {s.label}
          </a>
        ))}
      </nav>
      <div className="nav-right">
        <a href="#contact" className="nav-cta">
          <Roll>Start a project</Roll>
        </a>
        <button
          className="nav-menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr">{open ? "Close menu" : "Open menu"}</span>
          <span className="burger" aria-hidden />
        </button>
      </div>
      <div id="mobile-menu" className="menu-sheet" hidden={!open}>
        <nav aria-label="Mobile">
          {[...SECTIONS, { id: "contact", label: "Contact" }].map((s, i) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setOpen(false)} style={{ ["--i" as string]: i }}>
              <span className="menu-n">0{i + 1}</span>
              {s.label}
            </a>
          ))}
          <a href="#contact" className="menu-cta" onClick={() => setOpen(false)}>Start a project →</a>
        </nav>
        <Clocks />
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- hero */

const BOOT = ["Booting WebGL", "Compiling shaders", "Rendering first frame", "Scene live"];

function Hero({ reduced }: { reduced: boolean }) {
  const [ref, inView] = useInView<HTMLElement>("0px");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hero = useRef<HeroGL | null>(null);
  const mobile = useIsMobile();
  const [boot, setBoot] = useState(0.08);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const init = () => {
      if (cancelled) return;
      const fail = () => {
        if (cancelled) return;
        setFailed(true);
        setBoot(1);
      };
      const h = createHero(canvas, { colors: COLORS, mobile, reduced, onProgress: (p) => !cancelled && setBoot(p), onFail: fail });
      if (!h) {
        fail();
        return;
      }
      hero.current = h;
      h.start();
    };
    // keep shader compilation off the critical path so the headline paints first
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const id = ric ? ric(init, { timeout: 700 }) : window.setTimeout(init, 200);
    return () => {
      cancelled = true;
      if (!ric) clearTimeout(id);
      hero.current?.destroy();
      hero.current = null;
    };
  }, [mobile, reduced]);

  useEffect(() => {
    if (!hero.current) return;
    if (inView && !document.hidden) hero.current.start();
    else hero.current.stop();
  }, [inView, boot]);

  useEffect(() => {
    const vis = () => (document.hidden ? hero.current?.stop() : inView && hero.current?.start());
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [inView]);

  useEffect(() => {
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = ref.current;
        if (el) hero.current?.scroll(window.scrollY / el.offsetHeight);
      });
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [ref]);

  const onPointer = (e: React.PointerEvent, active: boolean) => {
    const r = ref.current!.getBoundingClientRect();
    hero.current?.pointer(e.clientX - r.left, e.clientY - r.top, active);
  };

  const stage = boot >= 1 ? 3 : boot >= 0.7 ? 2 : boot >= 0.3 ? 1 : 0;
  const live = boot >= 1;

  return (
    <section
      id="top"
      ref={ref}
      className={`hero ${failed ? "hero-fallback" : ""} ${live ? "is-live" : ""}`}
      onPointerMove={(e) => onPointer(e, true)}
      onPointerDown={(e) => onPointer(e, true)}
      onPointerLeave={(e) => onPointer(e, false)}
      aria-labelledby="hero-title"
    >
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden />
      <div className="hero-grid" aria-hidden />
      <div className="hero-inner">
        <p className="hero-kicker">
          <span className="ge" lang="am">ሰናይ</span>
          Creative technology studio · New York ⇄ Addis Ababa
        </p>
        <h1 id="hero-title" className="hero-title">
          <span className="line"><span>Websites</span></span>
          <span className="line"><span>with a <em>pulse.</em></span></span>
        </h1>
        <p className="hero-sub">
          We design and build AI-accelerated websites with motion, polish and a point of view: the craft of a
          high-end studio, at the speed of AI.
        </p>
        <div className="hero-actions">
          <Btn href="#contact">Start a project</Btn>
          <Btn href="#work" variant="ghost">See the work</Btn>
        </div>
      </div>
      <Clocks className="hero-clocks" />
      <div className="hud" aria-hidden>
        <div className="hud-row">
          <span>Scene 01</span>
          <span>Liquid / dither</span>
        </div>
        <div className="hud-bar">
          <span style={{ transform: `scaleX(${boot})` }} />
        </div>
        <div className="hud-row hud-status">
          <span className="hud-dot" />
          <span>{failed ? "Static fallback" : live ? (mobile ? "Drag to focus the lens" : "Move to focus the lens") : BOOT[stage]}</span>
          <span className="hud-pct">{String(Math.round(boot * 100)).padStart(3, "0")}%</span>
        </div>
      </div>
      <a href="#offer" className="scroll-cue" aria-label="Scroll to the offer">
        <span />
      </a>
    </section>
  );
}

/* ---------------------------------------------------------------- ticker */

function Ticker() {
  const words = ["AI-built websites", "WebGL & 3D", "Motion design", "Brand identity", "Mobile apps", "AI visuals", "Booking assistants", "Event experiences"];
  const row = (k: string) =>
    words.map((w, i) => (
      <span key={k + i}>
        {w}
        <i aria-hidden />
      </span>
    ));
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- offer */

function Offer({ reduced, onPick }: { reduced: boolean; onPick: (t: string) => void }) {
  return (
    <section id="offer" className="section offer" aria-labelledby="offer-title">
      <div className="section-head">
        <div data-reveal>
          <Label n="01">The offer</Label>
          <h2 id="offer-title" className="h2">
            AI-built websites, <em>studio-grade.</em>
          </h2>
        </div>
        <p data-reveal className="section-lede" style={{ ["--d" as string]: "0.1s" }}>
          Our first offer is the one you’re scrolling through: premium, animated websites designed and built
          with AI-accelerated workflows, then finished by hand. Three ways in, each scoped and quoted per project.
        </p>
      </div>

      <p className="swipe-hint" aria-hidden>Swipe for all three →</p>
      <div className="tiers">
        {TIERS.map((t, i) => (
          <TierCard key={t.id} tier={t} i={i} reduced={reduced} onPick={onPick} />
        ))}
      </div>

      <div data-reveal className="included">
        <h3 className="included-title">Every site includes</h3>
        <ul className="included-grid">
          {INCLUDED.map((it) => (
            <IncludedItem key={it.title} {...it} reduced={reduced} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function TierCard({ tier, i, reduced, onPick }: { tier: (typeof TIERS)[number]; i: number; reduced: boolean; onPick: (t: string) => void }) {
  const [ref, inView] = useInView<HTMLElement>("-10% 0px", true);
  const [play, setPlay] = useState(0);
  useEffect(() => {
    if (inView) setPlay((p) => p || 1);
  }, [inView]);
  return (
    <article
      data-reveal
      ref={ref}
      className={`tier ${tier.flagship ? "tier-flagship" : ""}`}
      onPointerEnter={() => play && setPlay((p) => p + 1)}
    >
      <div className="tier-top">
        <DitherIcon name={tier.icon} play={play} reduced={reduced} className="tier-icon" />
        <span className="tier-n">0{i + 1}</span>
      </div>
      {tier.flagship && <span className="tier-flag">Flagship</span>}
      <h3 className="tier-name">{tier.name}</h3>
      <p className="tier-tag">{tier.tagline}</p>
      <p className="tier-fit"><span>Good for</span> {tier.fit}</p>
      <ul className="tier-list">
        {tier.includes.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <div className="tier-foot">
        <span className="tier-price">Quoted per project</span>
        <a href="#contact" className="tier-link" onClick={() => onPick(tier.id)}>
          <Roll>{`Start with ${tier.name}`}</Roll>
          <span aria-hidden>→</span>
        </a>
      </div>
    </article>
  );
}

function IncludedItem({ icon, title, body, reduced }: { icon: string; title: string; body: string; reduced: boolean }) {
  const [ref, inView] = useInView<HTMLLIElement>("-10% 0px", true);
  const [play, setPlay] = useState(0);
  useEffect(() => {
    if (inView) setPlay((p) => p || 1);
  }, [inView]);
  return (
    <li ref={ref} onPointerEnter={() => play && setPlay((p) => p + 1)}>
      <DitherIcon name={icon} play={play} reduced={reduced} />
      <div>
        <h4>{title}</h4>
        <p>{body}</p>
      </div>
    </li>
  );
}

/* ---------------------------------------------------------------- process */

function Process() {
  const [fill, setFill] = useState(0);
  const ref = useSectionProgress<HTMLElement>((p) => setFill(Math.round(Math.min(Math.max((p - 0.18) / 0.42, 0), 1) * 100) / 100));
  return (
    <section
      id="process"
      ref={ref}
      className="section process"
      aria-labelledby="process-title"
      data-nav="light"
      style={{ ["--fill" as string]: fill }}
    >
      <div className="section-head">
        <div data-reveal>
          <Label n="02">Process</Label>
          <h2 id="process-title" className="h2">
            From brief to live, <em>in four beats.</em>
          </h2>
        </div>
        <p data-reveal className="section-lede">
          Short loops, early motion, no mystery. You see a moving version of your site early and shape it with us.
        </p>
      </div>
      <ol className="steps">
        <span className="steps-rail" aria-hidden>
          <span />
        </span>
        {PROCESS.map((s, i) => (
          <li key={s.n} className={fill >= i / 4 + 0.02 ? "on" : ""}>
            <span className="step-node" aria-hidden />
            <span className="step-n">{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------------------------------------------------------- work */

function Work() {
  return (
    <section id="work" className="section work" aria-labelledby="work-title">
      <div className="section-head">
        <div data-reveal>
          <Label n="03">Work</Label>
          <h2 id="work-title" className="h2">
            Selected work, <em>and open slots for yours.</em>
          </h2>
        </div>
        <p data-reveal className="section-lede">
          Two real projects, plus concept placeholders that show the kind of site we’d build next. The
          placeholders are clearly marked; they aren’t client work.
        </p>
      </div>
      <div className="stack">
        {WORK.map((w, i) => (
          <WorkCard key={w.title} item={w} i={i} total={WORK.length} />
        ))}
      </div>
    </section>
  );
}

function WorkCard({ item, i, total }: { item: WorkItem; i: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  const placeholder = item.status === "placeholder";
  const external = item.href?.startsWith("http");
  const badge = placeholder ? "Placeholder · concept" : item.status === "live" ? "Live · this site" : "Shipped · App Store";
  return (
    <article
      className={`card ${placeholder ? "card-placeholder" : ""}`}
      style={{ ["--i" as string]: i, ["--bg" as string]: item.tone.bg, ["--mid" as string]: item.tone.mid, ["--high" as string]: item.tone.high }}
    >
      <div className="card-inner">
        <div className="card-meta">
          <div className="card-top">
            <span className={`badge ${placeholder ? "badge-ph" : "badge-real"}`}>{badge}</span>
            <span className="card-count">{String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
          </div>
          <div>
            <p className="card-kind">{item.kind} · {item.year}</p>
            <h3 className="card-title">{item.title}</h3>
            <p className="card-blurb">{item.blurb}</p>
            {item.href && (
              <a
                className="card-link"
                href={item.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <Roll>{item.linkLabel || "Visit"}</Roll>
                <span aria-hidden>{external ? "↗" : "↑"}</span>
              </a>
            )}
            {placeholder && <p className="card-slot">This slot is open. <a href="#contact">Your project here →</a></p>}
          </div>
        </div>
        <div className="card-art" ref={ref} onPointerMove={onMove}>
          <div className="card-smooth" aria-hidden />
          <DitherArt kind={item.art} mid={item.tone.mid} high={item.tone.high} />
          {placeholder && <span className="card-stamp" aria-hidden>Placeholder</span>}
        </div>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- studio */

function Studio({ reduced }: { reduced: boolean }) {
  return (
    <section id="studio" className="section studio" aria-labelledby="studio-title">
      <div className="studio-grid">
        <div data-reveal>
          <Label n="04">Studio</Label>
          <h2 id="studio-title" className="h2 studio-statement">
            Rhythm in the motion. <em>Texture in the pixels.</em>
          </h2>
          <p className="studio-body">
            Senai Technology is the creative technology company of Senai Motley: Ethiopian-American, working
            between New York and Addis Ababa. Music and art sit at the centre of how we build, so every site gets
            a beat, a texture and a point of view, not a template.
          </p>
          <div className="studio-mark" aria-hidden>
            <span className="ge" lang="am">ሰናይ</span>
            <span className="studio-mark-cap">Senai, in Ge’ez script</span>
          </div>
        </div>
        <div data-reveal style={{ ["--d" as string]: "0.1s" }}>
          <h3 className="also-title">Also from the studio</h3>
          <ul className="also">
            {ALSO.map((a) => (
              <AlsoRow key={a.title} {...a} reduced={reduced} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function AlsoRow({ icon, title, body, reduced }: { icon: string; title: string; body: string; reduced: boolean }) {
  const [ref, inView] = useInView<HTMLLIElement>("-10% 0px", true);
  const [play, setPlay] = useState(0);
  useEffect(() => {
    if (inView) setPlay((p) => p || 1);
  }, [inView]);
  return (
    <li ref={ref} onPointerEnter={() => play && setPlay((p) => p + 1)}>
      <DitherIcon name={icon} play={play} reduced={reduced} className="also-icon" />
      <h4>{title}</h4>
      <p>{body}</p>
    </li>
  );
}

/* ---------------------------------------------------------------- contact */

function Contact({ reduced, projectType, setProjectType }: { reduced: boolean; projectType: string; setProjectType: (t: string) => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [who, setWho] = useState("");
  const [copied, setCopied] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const project = String(data.get("project") || "").trim();
    // TODO(Senai): no backend yet, so this opens the visitor's mail client.
    // Swap for a form service / serverless endpoint and the real inbox before launch.
    const subject = `New project enquiry: ${projectType} (${name || "Senai Technology site"})`;
    const body = `Name: ${name}\nEmail: ${email}\nProject type: ${projectType}\n\nProject:\n${project}`;
    setWho(name || "friend");
    setState("sending");
    window.setTimeout(
      () => {
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setState("sent");
      },
      reduced ? 0 : 750,
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  };

  return (
    <section id="contact" className="contact" aria-labelledby="contact-title" data-nav="light">
      <div className="contact-inner">
        <div data-reveal className="contact-copy">
          <Label n="05">Contact</Label>
          <h2 id="contact-title" className="contact-title">
            Let’s make something <em>with a pulse.</em>
          </h2>
          <p className="contact-lede">
            Tell us what you’re dreaming up: a site, an app, a brand, a film, an AI assistant or something that
            doesn’t have a name yet. We reply within two business days.
          </p>
          <div className="contact-email">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <button type="button" className={`copy ${copied ? "is-copied" : ""}`} onClick={copy}>
              <span className="copy-roll">
                <span className="copy-a">Copy</span>
                <span className="copy-b" aria-hidden>Copied ✓</span>
              </span>
              <span className="sr" role="status">{copied ? "Email address copied" : ""}</span>
            </button>
          </div>
        </div>

        <form data-reveal className="form" onSubmit={onSubmit} aria-label="Project enquiry">
          <fieldset className="chips">
            <legend>What are we making?</legend>
            {PROJECT_TYPES.map((t) => (
              <label key={t} className={`chip ${projectType === t ? "on" : ""}`}>
                <input type="radio" name="type" value={t} checked={projectType === t} onChange={() => setProjectType(t)} />
                {t}
              </label>
            ))}
          </fieldset>
          <div className="form-row">
            <label>
              <span>Name</span>
              <input name="name" autoComplete="name" required placeholder="Your name" />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
            </label>
          </div>
          <label>
            <span>Project</span>
            <textarea name="project" rows={4} required placeholder="What should we build together?" />
          </label>
          <button type="submit" className={`submit is-${state}`} disabled={state === "sending"}>
            <span className="submit-fill" aria-hidden />
            <span className="submit-label">
              {state === "sending" ? "Preparing your email…" : state === "sent" ? "Ready in your mail app ✓" : "Send it"}
            </span>
            <span className="submit-arrow" aria-hidden>→</span>
          </button>
          <p className="form-note" role="status">
            {state === "sent"
              ? `Thanks, ${who}. Your mail app should open with the message ready to send.`
              : "Submitting opens your email app with everything filled in."}
          </p>
        </form>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- footer */

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <p className="footer-cta">
          Got an idea? <a href="#contact">Start a project →</a>
        </p>
        <Clocks />
      </div>
      <div className="footer-word" aria-hidden>
        Senai<span>Technology</span>
      </div>
      <div className="footer-row">
        <p>© 2026 Senai Technology, a Slotted LLC company</p>
        <p>New York ⇄ Addis Ababa</p>
        <p><a href="#top">Back to top ↑</a></p>
      </div>
    </footer>
  );
}
