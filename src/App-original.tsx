import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useInView, useIsMobile, useMagnetic, usePrefersReducedMotion, useSectionProgress } from "./lib/hooks";
import { createHero, type Hero as HeroGL } from "./lib/heroGL";
import { ALSO, COLORS, CONTACT_EMAIL, FAQ, INCLUDED, NAV, PAYMENTS, PROCESS, PROJECT_TYPES, TIERS, WORK, type CaseStudy } from "./content";
import { DitherIcon } from "./components/DitherIcon";
import { DitherArt } from "./components/DitherArt";
import { HeroPoster } from "./components/HeroPoster";
import { TierTexture } from "./components/TierTexture";
import { ChatWidget } from "./components/ChatWidget";

// the /check tool isn't needed on the homepage, so it stays off the critical path
const CheckPage = lazy(() => import("./components/CheckPage").then((m) => ({ default: m.CheckPage })));

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/check" element={<Suspense fallback={null}><CheckPage /></Suspense>} />
    </Routes>
  );
}

const ric = (cb: () => void, timeout: number) => {
  const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 200);
  return () => clearTimeout(id);
};

function HomePage() {
  const reduced = usePrefersReducedMotion();
  const [projectType, setProjectType] = useState(PROJECT_TYPES[1]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    // touch scrolling is native anyway, so smooth scroll (and its chunk) only loads for fine pointers
    if (reduced || !matchMedia("(pointer: fine)").matches) return;
    let lenis: { destroy(): void } | null = null;
    let dead = false;
    const cancel = ric(() => {
      Promise.all([import("lenis"), import("lenis/dist/lenis.css")]).then(([{ default: Lenis }]) => {
        if (!dead) lenis = new Lenis({ autoRaf: true, lerp: 0.11, anchors: { offset: -20 } });
      });
    }, 2000);
    return () => {
      dead = true;
      cancel();
      lenis?.destroy();
    };
  }, [reduced]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <ScrollBar />
      <Nav />
      <main id="main">
        <Hero reduced={reduced} />
        <Intro />
        <Work />
        <Pricing reduced={reduced} onPick={setProjectType} />
        <Process />
        <Studio />
        <Faq />
        <CheckBand />
        <Contact reduced={reduced} projectType={projectType} setProjectType={setProjectType} />
      </main>
      <Footer />
      <ChatWidget />
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

function Btn({ href, children, variant = "primary", onClick }: { href: string; children: string; variant?: "primary" | "ghost" | "ink"; onClick?: () => void }) {
  const ref = useMagnetic<HTMLAnchorElement>(0.2);
  const inner = (
    <>
      <Roll>{children}</Roll>
      <span className="btn-arrow" aria-hidden>
        <span>→</span>
        <span>→</span>
      </span>
    </>
  );
  const cls = `btn btn-${variant}`;
  return href.startsWith("/") ? (
    <Link ref={ref} to={href} className={cls} onClick={onClick}>{inner}</Link>
  ) : (
    <a ref={ref} href={href} className={cls} onClick={onClick}>{inner}</a>
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

function SectionHead({ n, label, id, title, lede }: { n: string; label: string; id: string; title: ReactNode; lede?: ReactNode }) {
  return (
    <div className="sec-head">
      <div data-reveal>
        <Label n={n}>{label}</Label>
        <h2 id={id} className="h2">{title}</h2>
      </div>
      {lede && (
        <p data-reveal className="lede" style={{ ["--d" as string]: "0.08s" }}>
          {lede}
        </p>
      )}
    </div>
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
    const els = [...NAV.map((s) => s.id), "contact"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
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
      <a href="#top" className="logo" onClick={() => setOpen(false)} aria-label="Senai Technology, back to top">
        <span className="logo-dot" aria-hidden />
        <span className="logo-word">Senai</span>
        <span className="logo-thin">Technology</span>
      </a>
      <nav aria-label="Primary" className="nav-links">
        <span
          className="nav-pill"
          aria-hidden
          style={pill ? { transform: `translateX(${pill.x}px)`, width: pill.w, opacity: 1 } : { opacity: 0 }}
        />
        {NAV.map((s) => (
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
        <Link to="/check" className="nav-check">
          <Roll>Free site check</Roll>
        </Link>
        <a href="#contact" className="nav-cta">
          <Roll>Start a project</Roll>
        </a>
        <button className="nav-menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
          <span className="sr">{open ? "Close menu" : "Open menu"}</span>
          <span className="burger" aria-hidden />
        </button>
      </div>
      <div id="mobile-menu" className="menu-sheet" hidden={!open}>
        <nav aria-label="Mobile">
          {[...NAV, { id: "contact", label: "Contact" }].map((s, i) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setOpen(false)} style={{ ["--i" as string]: i }}>
              <span className="menu-n">{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </a>
          ))}
        </nav>
        <div className="menu-foot">
          <a href="#contact" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
            <span>Start a project</span>
            <span className="btn-arrow" aria-hidden><span>→</span></span>
          </a>
          <Link to="/check" className="menu-check" onClick={() => setOpen(false)}>Free website check →</Link>
          <Clocks />
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- hero */

const BOOT = ["Waiting for the needle", "Compiling shaders", "Rendering first frame", "Now playing"];

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
    let cancelIdle = () => {};
    const init = () => {
      if (cancelled || hero.current) return;
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
    // Touch devices show the dithered poster until the first interaction, so shader compilation never competes with
    // first paint on a phone. Fine pointers start the shader in the first idle period.
    const events = ["pointerdown", "touchstart", "scroll", "keydown", "wheel"] as const;
    const wake = () => {
      events.forEach((e) => window.removeEventListener(e, wake));
      cancelIdle = ric(init, 300);
    };
    if (matchMedia("(pointer: coarse)").matches) events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    else cancelIdle = ric(init, 900);
    return () => {
      cancelled = true;
      cancelIdle();
      events.forEach((e) => window.removeEventListener(e, wake));
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

  const live = boot >= 1 && !failed;
  const stage = boot >= 1 ? 3 : boot >= 0.7 ? 2 : boot >= 0.3 ? 1 : 0;
  const status = failed ? "Still frame" : live ? (mobile ? "Drag to find ሰናይ" : "Move to find ሰናይ") : BOOT[stage];

  return (
    <section
      id="top"
      ref={ref}
      className={`hero ${live ? "is-live" : ""}`}
      onPointerMove={(e) => onPointer(e, true)}
      onPointerDown={(e) => onPointer(e, true)}
      onPointerLeave={(e) => onPointer(e, false)}
      aria-labelledby="hero-title"
    >
      <HeroPoster />
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden />
      <div className="hero-top">
        <p className="cat">SNY—001 <span>Side A</span></p>
        <Clocks />
      </div>
      <div className="hero-inner">
        <p className="hero-kicker">
          <span className="ge" lang="am">ሰናይ</span>
          <span>Creative technology studio · New York ⇄ Addis Ababa</span>
        </p>
        <h1 id="hero-title" className="hero-title">
          <span className="line"><span>Websites</span></span>
          <span className="line"><span>with a <em>pulse.</em></span></span>
        </h1>
        <div className="hero-row">
          <p className="hero-sub">
            AI-built, studio-grade websites with motion, polish and a point of view. The craft of a high-end studio, at
            the speed of AI.
          </p>
          <div className="hero-actions">
            <Btn href="#contact">Start a project</Btn>
            <Btn href="/check" variant="ghost">Score your site free</Btn>
          </div>
        </div>
      </div>
      <div className="hud" aria-hidden>
        <div className="hud-row">
          <span className="hud-dot" />
          <span>{status}</span>
          <span className="hud-pct">92 BPM</span>
        </div>
        <div className="hud-bar">
          <span style={{ transform: `scaleX(${failed ? 1 : boot})` }} />
        </div>
        <div className="hud-row hud-meta">
          <span>Liquid / dither</span>
          <span>WebGL2 · no libraries</span>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- intro */

function Intro() {
  return (
    <section className="intro paper" data-nav="light" aria-label="About the studio">
      <div className="intro-grid">
        <p data-reveal className="intro-statement">
          We make websites the way records get made: a strong idea, a rhythm you can feel, and hours of finishing by
          hand. <span className="intro-muted">AI does the heavy lifting so the craft gets the time.</span>
        </p>
        <ul data-reveal className="intro-facts" style={{ ["--d" as string]: "0.1s" }}>
          <li><span>Based</span> New York ⇄ Addis Ababa</li>
          <li><span>Offer</span> AI-built websites, three tiers</li>
          <li><span>Pricing</span> Quoted per project</li>
          <li><span>Payments</span> Stripe (US) · Chapa (Ethiopia)</li>
          <li><span>Reply</span> Within two business days</li>
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- work */

const statusLabel = (c: CaseStudy) => (c.status === "placeholder" ? "Placeholder · open slot" : c.status === "live" ? "Live" : "Shipped · App Store");

function Work() {
  const real = WORK.filter((w) => w.status !== "placeholder");
  const slots = WORK.filter((w) => w.status === "placeholder");
  return (
    <section id="work" className="sec work" aria-labelledby="work-title">
      <SectionHead
        n="01"
        label="Selected work"
        id="work-title"
        title={<>The tracklist, <em>so far.</em></>}
        lede="Two real projects, plus open slots for what we build next. Anything marked placeholder is a concept, not client work."
      />
      <ol className="tracklist" data-reveal>
        {WORK.map((w, i) => (
          <li key={w.slug} className={w.status === "placeholder" ? "is-slot" : ""}>
            <a href={`#case-${w.slug}`}>
              <span className="track-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="track-title">{w.title}</span>
              <span className="track-kind">{w.kind}</span>
              <span className="track-year">{w.year}</span>
              <span className={`badge ${w.status === "placeholder" ? "badge-ph" : "badge-real"}`}>{w.status === "placeholder" ? "Open slot" : statusLabel(w)}</span>
            </a>
          </li>
        ))}
      </ol>
      <div className="cases">
        {real.map((c, i) => (
          <CaseStudyBlock key={c.slug} c={c} i={i} />
        ))}
      </div>
      <div className="slots">
        <h3 className="slots-title" data-reveal>Open slots</h3>
        <ul className="slots-grid">
          {slots.map((c, i) => (
            <li key={c.slug} id={`case-${c.slug}`} className="slot" data-reveal style={{ ["--d" as string]: `${i * 0.07}s`, ["--bg" as string]: c.tone.bg }}>
              <div className="slot-art">
                <DitherArt kind={c.art} mid={c.tone.mid} high={c.tone.high} />
                <span className="stamp">Placeholder image</span>
              </div>
              <span className="badge badge-ph">Placeholder · concept</span>
              <h4>{c.title}</h4>
              <p>{c.summary}</p>
              <a href="#contact" className="draw">Your project here <span className="nudge" aria-hidden>→</span></a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CaseStudyBlock({ c, i }: { c: CaseStudy; i: number }) {
  const external = c.href?.startsWith("http");
  return (
    <article id={`case-${c.slug}`} className="case" style={{ ["--bg" as string]: c.tone.bg }} aria-labelledby={`case-${c.slug}-title`}>
      <div className="case-art" data-reveal>
        {c.images?.length ? (
          <img src={c.images[0].src} alt={c.images[0].alt} width={c.images[0].width} height={c.images[0].height} loading="lazy" decoding="async" />
        ) : (
          <DitherArt kind={c.art} mid={c.tone.mid} high={c.tone.high} />
        )}
        <span className="case-n" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
      </div>
      <div className="case-body" data-reveal style={{ ["--d" as string]: "0.08s" }}>
        <div className="case-top">
          <span className="badge badge-real">{statusLabel(c)}</span>
          <span className="case-kind">{c.kind} · {c.year}</span>
        </div>
        <h3 id={`case-${c.slug}-title`} className="case-title">{c.title}</h3>
        <p className="case-summary">{c.summary}</p>
        <dl className="case-meta">
          <div><dt>Role</dt><dd>{c.role.join(", ")}</dd></div>
          <div><dt>Scope</dt><dd>{c.services.join(", ")}</dd></div>
        </dl>
        <div className="case-notes">
          {c.brief && <p><span>Brief</span>{c.brief}</p>}
          {c.approach && <p><span>Approach</span>{c.approach}</p>}
          {c.outcome && <p><span>Outcome</span>{c.outcome}</p>}
        </div>
        {c.href && (
          <a className="case-link" href={c.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            <Roll>{c.linkLabel || "Visit"}</Roll>
            <span aria-hidden>{external ? "↗" : "↑"}</span>
          </a>
        )}
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- pricing */

function Pricing({ reduced, onPick }: { reduced: boolean; onPick: (t: string) => void }) {
  return (
    <section id="pricing" className="sec paper pricing" data-nav="light" aria-labelledby="pricing-title">
      <SectionHead
        n="02"
        label="Pricing"
        id="pricing-title"
        title={<>Three ways in. <em>Studio is the sweet spot.</em></>}
        lede="Premium, animated websites designed and built with AI-accelerated workflows, then finished by hand. Each is scoped and quoted per project."
      />
      <div className="tiers">
        {TIERS.map((t, i) => (
          <TierCard key={t.id} tier={t} i={i} reduced={reduced} onPick={onPick} />
        ))}
      </div>
      <div className="pricing-more">
        <div data-reveal className="included">
          <h3 className="h4">Every site includes</h3>
          <ol>
            {INCLUDED.map((it, i) => (
              <li key={it.title}>
                <span className="inc-n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h4>{it.title}</h4>
                  <p>{it.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div data-reveal className="pay" style={{ ["--d" as string]: "0.08s" }}>
          <h3 className="h4">Paying is local</h3>
          <ul>
            {PAYMENTS.map((p) => (
              <li key={p.via}>
                <span className="pay-via">{p.via}</span>
                <span className="pay-region">{p.region}</span>
                <p>{p.body}</p>
              </li>
            ))}
          </ul>
          <p className="pay-note">Payment details arrive with your quote. Not sure which tier? <a href="#faq" className="draw">Read the FAQ</a> or <Link to="/check" className="draw">check your current site</Link>.</p>
        </div>
      </div>
      <div className="beyond" data-reveal>
        <h3 className="h4">Beyond websites</h3>
        <ul>
          {ALSO.map((a) => (
            <li key={a.title}>
              <h4>{a.title}</h4>
              <p>{a.body}</p>
            </li>
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
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--tx", `${e.clientX - r.left}px`);
    el.style.setProperty("--ty", `${e.clientY - r.top}px`);
  };
  const listId = `tier-${tier.name.toLowerCase()}-list`;
  return (
    <article
      data-reveal
      ref={ref}
      className={`tier ${tier.recommended ? "tier-rec" : ""}`}
      style={{ ["--d" as string]: `${i * 0.07}s` }}
      onPointerEnter={(e) => {
        onMove(e);
        if (play) setPlay((p) => p + 1);
      }}
      onPointerMove={onMove}
      aria-label={`${tier.name}${tier.recommended ? ", recommended" : ""}`}
    >
      <TierTexture tier={i} />
      <div className="tier-top">
        <DitherIcon name={tier.icon} play={play} reduced={reduced} className="tier-icon" />
        <span className="tier-badges">
          {tier.recommended && <span className="tier-flag tier-flag-rec">Recommended</span>}
          {tier.flagship && <span className="tier-flag">Flagship</span>}
          <span className="tier-n">0{i + 1}</span>
        </span>
      </div>
      <div className="tier-head">
        <h3 className="tier-name">{tier.name}</h3>
        <p className="tier-tag">{tier.tagline}</p>
        <p className="tier-fit"><span>Good for</span> {tier.fit}</p>
      </div>
      <div className="tier-body">
        <p className="tier-list-title" id={listId}>What’s included</p>
        {tier.inherits && (
          <p className="tier-inherits">
            <span aria-hidden>↳</span> Everything in {tier.inherits}, plus
          </p>
        )}
        <ul className="tier-list" aria-labelledby={listId}>
          {tier.includes.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      <div className="tier-foot">
        <p className="tier-price">
          Quoted per project <span>Reply within 2 business days</span>
        </p>
        <a href="#contact" className={`tier-cta ${tier.recommended ? "tier-cta-primary" : ""}`} onClick={() => onPick(tier.id)}>
          <Roll>{`Start with ${tier.name}`}</Roll>
          <span className="nudge" aria-hidden>→</span>
        </a>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- process */

function Process() {
  const [fill, setFill] = useState(0);
  const ref = useSectionProgress<HTMLElement>((p) => setFill(Math.round(Math.min(Math.max((p - 0.15) / 0.45, 0), 1) * 100) / 100));
  return (
    <section id="process" ref={ref} className="sec process" aria-labelledby="process-title" style={{ ["--fill" as string]: fill }}>
      <SectionHead
        n="03"
        label="Process"
        id="process-title"
        title={<>From brief to live, <em>in four beats.</em></>}
        lede="Short loops, early motion, no mystery. You see a moving version of your site early and shape it with us."
      />
      <ol className="beats">
        <span className="beats-rail" aria-hidden><span /></span>
        {PROCESS.map((s, i) => (
          <li key={s.n} className={fill >= i / 4 + 0.02 ? "on" : ""}>
            <span className="beat-bar" aria-hidden>
              {[0, 1, 2, 3].map((k) => <i key={k} className={k === i ? "acc" : ""} />)}
            </span>
            <span className="beat-n">{s.n} / 04</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------------------------------------------------------- studio */

function Studio() {
  return (
    <section id="studio" className="sec paper studio" data-nav="light" aria-labelledby="studio-title">
      <div className="studio-grid">
        <div className="studio-mark" data-reveal aria-hidden>
          <span className="ge" lang="am">ሰናይ</span>
          <span className="studio-mark-cap">Senai, in Ge’ez script</span>
        </div>
        <div className="studio-copy" data-reveal style={{ ["--d" as string]: "0.08s" }}>
          <Label n="04">Studio</Label>
          <h2 id="studio-title" className="h2">Rhythm in the motion. <em>Texture in the pixels.</em></h2>
          <p className="studio-body">
            Senai Technology is the creative technology company of Senai Motley: Ethiopian-American, working between
            New York and Addis Ababa. Music and art sit at the centre of how we build, so every site gets a beat, a
            texture and a point of view, not a template.
          </p>
          <figure className="founder">
            <div className="founder-photo" role="img" aria-label="Placeholder for a founder portrait">
              <span>Placeholder · founder portrait</span>
            </div>
            <figcaption>
              <b>Senai Motley</b>
              <span>Founder · design and code</span>
              <span>A Slotted LLC company</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- faq */

function Faq() {
  return (
    <section id="faq" className="sec paper faq" data-nav="light" aria-labelledby="faq-title">
      <div className="faq-grid">
        <div data-reveal>
          <Label n="05">FAQ</Label>
          <h2 id="faq-title" className="h2">Questions, <em>answered.</em></h2>
          <p className="lede">Anything else? The assistant in the corner knows the studio, or write to <a className="draw" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
        </div>
        <div className="faq-list" data-reveal style={{ ["--d" as string]: "0.08s" }}>
          {FAQ.map((f, i) => (
            <details key={f.q} name="faq" open={i === 0}>
              <summary>
                <span className="faq-n">{String(i + 1).padStart(2, "0")}</span>
                <span className="faq-q">{f.q}</span>
                <span className="faq-x" aria-hidden />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- website check band */

function CheckBand() {
  const navigate = useNavigate();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = String(new FormData(e.currentTarget).get("url") || "").trim();
    navigate(url ? `/check?url=${encodeURIComponent(url)}` : "/check");
    window.scrollTo(0, 0);
  };
  return (
    <section className="check-band" aria-labelledby="check-band-title">
      <div data-reveal className="check-band-copy">
        <p className="label"><span className="label-n">Free</span><span className="label-line" aria-hidden />Website check</p>
        <h2 id="check-band-title" className="h2">How does your site <em>score?</em></h2>
        <p>Speed, search and AI-search readiness, in under a minute. No sign-up.</p>
      </div>
      <form data-reveal className="check-band-form" onSubmit={onSubmit} style={{ ["--d" as string]: "0.08s" }}>
        <label>
          <span className="sr">Your website address</span>
          <input name="url" type="text" inputMode="url" autoComplete="url" placeholder="yourbusiness.com" />
        </label>
        <button type="submit" className="btn btn-ink">
          <Roll>Check it</Roll>
          <span className="btn-arrow" aria-hidden><span>→</span><span>→</span></span>
        </button>
        <Link to="/check" className="check-band-alt draw">No website yet? Start here</Link>
      </form>
    </section>
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
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <div className="contact-inner">
        <div data-reveal className="contact-copy">
          <Label n="06">Contact</Label>
          <h2 id="contact-title" className="contact-title">
            Let’s make something <em>with a pulse.</em>
          </h2>
          <p className="lede">
            Tell us what you’re dreaming up: a site, an app, a brand, a film, an AI assistant or something that doesn’t
            have a name yet. We reply within two business days.
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
          <ol className="contact-next">
            <li><span>01</span>You send a few lines about the project.</li>
            <li><span>02</span>We reply within two business days and set up a short brief call.</li>
            <li><span>03</span>You get a scope, a timeline and a quote.</li>
          </ol>
        </div>

        <form data-reveal className="form" onSubmit={onSubmit} aria-label="Project enquiry" style={{ ["--d" as string]: "0.08s" }}>
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
      <div className="footer-cols">
        <div className="footer-col">
          <h2 className="footer-h">Index</h2>
          <ul>
            {[...NAV, { id: "contact", label: "Contact" }].map((s) => (
              <li key={s.id}><a href={`#${s.id}`} className="draw">{s.label}</a></li>
            ))}
          </ul>
        </div>
        <div className="footer-col">
          <h2 className="footer-h">Tools</h2>
          <ul>
            <li><Link to="/check" className="draw">Free website check</Link></li>
            <li><a href="/llms.txt" className="draw">llms.txt</a></li>
            <li><a href="https://openslot.me" className="draw" target="_blank" rel="noopener noreferrer">OpenSlot ↗</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h2 className="footer-h">Contact</h2>
          <ul>
            <li><a href={`mailto:${CONTACT_EMAIL}`} className="draw">{CONTACT_EMAIL}</a></li>
            <li>New York ⇄ Addis Ababa</li>
            <li><Clocks /></li>
          </ul>
        </div>
        <div className="footer-col footer-colophon">
          <h2 className="footer-h">Liner notes</h2>
          <p>
            Set in Cormorant Garamond, Instrument Sans and Geist Mono, with Noto Sans Ethiopic for ሰናይ. Hero rendered in
            raw WebGL2 through an ordered dither. Built AI-accelerated, finished by hand.
          </p>
        </div>
      </div>
      <div className="footer-word" aria-hidden>
        <span>Senai</span>
        <span className="ge" lang="am">ሰናይ</span>
      </div>
      <div className="footer-row">
        <p>© 2026 Senai Technology, a Slotted LLC company</p>
        <p>Payments via Stripe (US) and Chapa (Ethiopia)</p>
        <p><a href="#top" className="draw">Back to top <span className="nudge nudge-up" aria-hidden>↑</span></a></p>
      </div>
    </footer>
  );
}
