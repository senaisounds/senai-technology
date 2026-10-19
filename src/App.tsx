import { lazy, Suspense, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { ChatWidget } from "./components/ChatWidget";
import { CONTACT_EMAIL, TIERS, WORK, FAQ, PROCESS } from "./content";

const CheckPage = lazy(() => import("./components/CheckPage").then((m) => ({ default: m.CheckPage })));

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/check" element={<Suspense fallback={null}><CheckPage /></Suspense>} />
    </Routes>
  );
}

function HomePage() {
  const [selectedPlan, setSelectedPlan] = useState(1); // Studio is index 1

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      
      <nav className="nav" aria-label="Primary navigation">
        <Link to="/check">Check</Link>
        <a href="#work">Work</a>
        <a href="#contact">Contact</a>
      </nav>

      <main id="main">
        <Hero />
        <div data-reveal><Work /></div>
        <div data-reveal><Pricing selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} /></div>
        <div data-reveal><About /></div>
        <div data-reveal><Process /></div>
        <div data-reveal><Faq /></div>
        <div data-reveal><Contact /></div>
      </main>

      <Footer />
      <ChatWidget />
    </>
  );
}

/* ---------------------------------------------------------------- Hero */

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-bg">
        <img 
          src="/images/long-island-city-new-york-may-2015.jpg" 
          alt="New York skyline" 
          width="1920"
          height="960"
        />
      </div>
      <div className="hero-grid">
        <h1 id="hero-title" className="hero-title">
          <span className="hero-line-1">SENAI</span>
          <span className="hero-line-2">
            <span className="ge" lang="am">ሰናይ</span>
          </span>
        </h1>
        <div className="hero-middle">
          <p className="hero-tagline">
            Creative technology studio. AI-built websites with music, art, and motion. 
            New York ⇄ Addis Ababa.
          </p>
          <a href="#contact" className="hero-cta">
            Start a project →
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Work */

function Work() {
  const realWork = WORK.filter(w => w.status !== "placeholder");
  
  return (
    <section id="work" className="work" aria-labelledby="work-heading">
      <h2 className="work-heading" id="work-heading">Recent: </h2>
      <span className="work-names">
        {realWork[0].title}
      </span>
      <p className="work-meta">
        {realWork.length} projects · 2024–2026
      </p>
    </section>
  );
}

/* ---------------------------------------------------------------- Pricing */

function Pricing({ selectedPlan, onSelectPlan }: { selectedPlan: number; onSelectPlan: (i: number) => void }) {
  const tier = TIERS[selectedPlan];
  
  return (
    <section id="pricing" className="pricing" aria-labelledby="pricing-heading">
      <div className="pricing-plans">
        {TIERS.map((t, i) => (
          <button
            key={t.id}
            className={`pricing-plan ${selectedPlan === i ? "active" : ""}`}
            onClick={() => onSelectPlan(i)}
            aria-pressed={selectedPlan === i}
          >
            {t.name}
          </button>
        ))}
      </div>
      
      <div className="pricing-stage">
        <div>
          <div className="pricing-amount">Quoted</div>
          <div className="pricing-period">per project</div>
        </div>
        <p className="pricing-details">
          {tier.tagline} Good for: {tier.fit}.
        </p>
        <a href="#contact" className="pricing-action">
          Start with {tier.name}
        </a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- About */

function About() {
  return (
    <section id="about" className="section section-tight" aria-labelledby="about-heading">
      <h2 id="about-heading" className="process-heading" style={{ marginBottom: "2rem" }}>
        About the studio
      </h2>
      <p style={{ fontSize: "var(--step-lead)", lineHeight: 1.4, maxWidth: "50ch", marginBottom: "3rem" }}>
        Senai Technology is the creative technology company of Senai Motley: Ethiopian-American DJ and builder 
        working between New York and Addis Ababa. Music and art sit at the center of how we build, 
        so every site gets a beat, a texture and a point of view — not a template.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", maxWidth: "60rem" }}>
        <article className="about-card" style={{ margin: "0" }}>
          <div className="about-photo">
            <span>Founder portrait<br/>(placeholder)</span>
          </div>
          <h3 className="about-name">Senai Motley</h3>
          <p className="about-role">Founder · Design and Code</p>
          <p className="about-bio">
            Ethiopian-American. Building AI-accelerated websites with motion and craft.
          </p>
        </article>
        <article className="about-card" style={{ margin: "0" }}>
          <div className="about-photo">
            <span>Studio workspace<br/>(placeholder)</span>
          </div>
          <h3 className="about-name">The Studio</h3>
          <p className="about-role">Creative Technology</p>
          <p className="about-bio">
            A Slotted LLC company. New York ⇄ Addis Ababa. Websites, apps, brand, AI tools.
          </p>
        </article>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Process */

function Process() {
  const images = [
    "https://picsum.photos/id/172/1600/1000",
    "https://picsum.photos/id/552/1600/1000",
    "https://picsum.photos/id/269/1600/1000"
  ];
  
  return (
    <section id="process" className="process section" aria-labelledby="process-heading">
      <div className="process-column">
        <h2 id="process-heading" className="process-heading">
          How does a project work?
        </h2>
        
        {PROCESS.map((step, i) => (
          <div key={step.n} className="process-step">
            <p>
              <strong>{step.title}</strong> {step.body}
            </p>
            {i < 3 && (
              <img 
                src={images[i]} 
                alt="Fog and quiet" 
                className="process-visual"
                loading="lazy"
                width="1600"
                height="1000"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- FAQ */

function Faq() {
  return (
    <section id="faq" className="faq section" aria-labelledby="faq-heading">
      <div className="faq-grid">
        <h2 id="faq-heading" className="faq-title">
          Questions
        </h2>
        
        {FAQ.map((item, i) => (
          <article key={i} className="faq-item">
            <h3 className="faq-question">{item.q}</h3>
            <p className="faq-answer">{item.a}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Contact */

function Contact() {
  return (
    <section id="contact" className="contact" aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="sr">Contact</h2>
      
      <div className="contact-row">
        <a href="https://maps.google.com/?q=New+York,NY">
          New York
        </a>
      </div>
      
      <div className="contact-row">
        <a href="https://maps.google.com/?q=Addis+Ababa">
          Addis Ababa
        </a>
      </div>
      
      <div className="contact-row">
        Mon–Fri 9AM–6PM
      </div>
      
      <div className="contact-row">
        <a href={`mailto:${CONTACT_EMAIL}`}>
          Contact us
        </a>
      </div>
      
      <div className="contact-row contact-action">
        <span>Let's work</span>
        <span className="contact-action-circle">→</span>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Footer */

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-wordmark">
        <span>SENAI</span>
        <br />
        <span className="ge" lang="am">ሰናይ</span>
      </div>
      
      <div className="footer-meta">
        <span>© 2026 Senai Technology</span>
        <span>A Slotted LLC company</span>
        <span>New York ⇄ Addis Ababa</span>
      </div>
      
      <p className="footer-credit">
        Images: "Long Island City New York May 2015 panorama 3" by King of Hearts, CC BY-SA 3.0, via Wikimedia Commons.
        Fog photographs from Unsplash via picsum.photos.
        Typography: Panchang and Switzer via Fontshare.
        Ge'ez: Noto Sans Ethiopic (Google Fonts).
      </p>
    </footer>
  );
}
