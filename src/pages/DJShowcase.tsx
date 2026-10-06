import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePrefersReducedMotion } from "../lib/hooks";
import "../styles/dj-showcase.css";

const ARTIST_NAME = "NORA FLUX";
const ARTIST_BIO = "Electronic music producer and DJ pushing the boundaries of hypnotic techno and ambient soundscapes.";
const LATEST_RELEASE = {
  title: "Crystalline Frequencies",
  type: "Album",
  year: "2026",
  artwork: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
};

const TRACKS = [
  { title: "Pulse Horizon", duration: "6:24", plays: "142K" },
  { title: "Echo Chamber", duration: "7:18", plays: "98K" },
  { title: "Synthetic Dreams", duration: "5:47", plays: "156K" },
  { title: "Void Resonance", duration: "8:12", plays: "87K" },
];

const TOUR_DATES = [
  { date: "Mar 15, 2026", venue: "Output Brooklyn", city: "New York, NY", ticketUrl: "#" },
  { date: "Mar 22, 2026", venue: "Fabric", city: "London, UK", ticketUrl: "#" },
  { date: "Apr 5, 2026", venue: "Berghain", city: "Berlin, DE", ticketUrl: "#" },
  { date: "Apr 12, 2026", venue: "Concrete", city: "Paris, FR", ticketUrl: "#" },
  { date: "Apr 28, 2026", venue: "Smart Bar", city: "Chicago, IL", ticketUrl: "#" },
];

const GALLERY_ITEMS = [
  { type: "gradient", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { type: "gradient", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { type: "gradient", gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { type: "gradient", gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { type: "gradient", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { type: "gradient", gradient: "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)" },
];

const SOCIAL_LINKS = [
  { name: "SoundCloud", url: "#", icon: "♪" },
  { name: "Spotify", url: "#", icon: "▶" },
  { name: "Instagram", url: "#", icon: "◉" },
  { name: "Twitter", url: "#", icon: "𝕏" },
];

export function DJShowcase() {
  const reduced = usePrefersReducedMotion();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [formState, setFormState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    document.title = `${ARTIST_NAME} — Electronic Music Producer & DJ`;
  }, []);

  const handleBookingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState("sending");
    setTimeout(() => setFormState("sent"), 1500);
  };

  return (
    <div className="dj-showcase">
      <div className="grain" aria-hidden />
      
      {/* Navigation */}
      <nav className="dj-nav">
        <div className="dj-nav-inner">
          <div className="dj-logo">{ARTIST_NAME}</div>
          <div className="dj-nav-links">
            <a href="#music">Music</a>
            <a href="#tour">Tour</a>
            <a href="#gallery">Gallery</a>
            <a href="#epk">EPK</a>
            <a href="#booking">Booking</a>
          </div>
        </div>
      </nav>

      {/* Hero with beat visualization */}
      <Hero reduced={reduced} />

      {/* Latest Release */}
      <section id="music" className="dj-section release-section">
        <div className="dj-container">
          <h2 className="dj-section-title">Latest Release</h2>
          <div className="release-card">
            <div className="release-artwork" style={{ background: LATEST_RELEASE.artwork }}>
              <div className="release-overlay" />
            </div>
            <div className="release-info">
              <span className="release-type">{LATEST_RELEASE.type}</span>
              <h3 className="release-title">{LATEST_RELEASE.title}</h3>
              <span className="release-year">{LATEST_RELEASE.year}</span>
              <p className="release-desc">
                A journey through pulsing bass lines and ethereal melodies. Recorded live in one take,
                capturing the raw energy of the underground.
              </p>
              <div className="release-actions">
                <a href="#" className="dj-btn dj-btn-primary">Listen Now</a>
                <a href="#" className="dj-btn dj-btn-ghost">Add to Library</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Track Player */}
      <section className="dj-section player-section">
        <div className="dj-container">
          <h3 className="player-label">Featured Tracks</h3>
          <div className="player">
            <div className="player-visualizer">
              <Visualizer isPlaying={isPlaying} reduced={reduced} />
            </div>
            <div className="tracklist">
              {TRACKS.map((track, i) => (
                <button
                  key={i}
                  className={`track-item ${currentTrack === i ? "active" : ""}`}
                  onClick={() => {
                    setCurrentTrack(i);
                    setIsPlaying(true);
                  }}
                >
                  <span className="track-number">{String(i + 1).padStart(2, "0")}</span>
                  <span className="track-title">{track.title}</span>
                  <span className="track-plays">{track.plays}</span>
                  <span className="track-duration">{track.duration}</span>
                </button>
              ))}
            </div>
            <div className="player-controls">
              <button className="player-prev" aria-label="Previous track">⏮</button>
              <button
                className="player-play"
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button className="player-next" aria-label="Next track">⏭</button>
              <div className="player-progress">
                <div className="player-progress-bar" style={{ width: "34%" }} />
              </div>
              <span className="player-time">2:24 / 6:24</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tour Dates */}
      <section id="tour" className="dj-section tour-section">
        <div className="dj-container">
          <h2 className="dj-section-title">Upcoming Shows</h2>
          <div className="tour-list">
            {TOUR_DATES.map((show, i) => (
              <div key={i} className="tour-item" style={{ ["--i" as string]: i }}>
                <div className="tour-date">{show.date}</div>
                <div className="tour-venue">
                  <div className="tour-venue-name">{show.venue}</div>
                  <div className="tour-city">{show.city}</div>
                </div>
                <a href={show.ticketUrl} className="tour-tickets">Tickets</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="dj-section gallery-section">
        <div className="dj-container">
          <h2 className="dj-section-title">Gallery</h2>
          <div className="gallery-grid">
            {GALLERY_ITEMS.map((item, i) => (
              <div
                key={i}
                className="gallery-item"
                style={{ background: item.gradient }}
              >
                <div className="gallery-overlay" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EPK Section */}
      <section id="epk" className="dj-section epk-section">
        <div className="dj-container">
          <h2 className="dj-section-title">Electronic Press Kit</h2>
          <div className="epk-content">
            <div className="epk-bio">
              <h3>About</h3>
              <p>
                {ARTIST_NAME} is an electronic music producer and DJ based between Berlin and New York,
                known for crafting hypnotic soundscapes that blur the lines between techno, ambient, and
                experimental electronica.
              </p>
              <p>
                With releases on leading underground labels and performances at renowned venues worldwide,
                {ARTIST_NAME} has established a reputation for immersive live sets that transport audiences
                through carefully constructed sonic journeys.
              </p>
            </div>
            <div className="epk-stats">
              <div className="epk-stat">
                <div className="epk-stat-value">2.4M+</div>
                <div className="epk-stat-label">Monthly Listeners</div>
              </div>
              <div className="epk-stat">
                <div className="epk-stat-value">48</div>
                <div className="epk-stat-label">Countries Toured</div>
              </div>
              <div className="epk-stat">
                <div className="epk-stat-value">3</div>
                <div className="epk-stat-label">Studio Albums</div>
              </div>
            </div>
            <div className="epk-downloads">
              <a href="#" className="epk-download">Download Full EPK (PDF)</a>
              <a href="#" className="epk-download">Download Press Photos</a>
              <a href="#" className="epk-download">Download Rider</a>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section id="booking" className="dj-section booking-section">
        <div className="dj-container dj-container-narrow">
          <h2 className="dj-section-title">Booking Inquiries</h2>
          <p className="booking-intro">
            For booking, collaborations, or press inquiries, please fill out the form below.
            We respond within 48 hours.
          </p>
          <form className="booking-form" onSubmit={handleBookingSubmit}>
            <div className="form-row">
              <label>
                <span>Name</span>
                <input type="text" name="name" required placeholder="Your name" />
              </label>
              <label>
                <span>Email</span>
                <input type="email" name="email" required placeholder="your@email.com" />
              </label>
            </div>
            <label>
              <span>Venue / Organization</span>
              <input type="text" name="venue" required placeholder="Venue or company name" />
            </label>
            <label>
              <span>Inquiry Type</span>
              <select name="type" required>
                <option value="">Select...</option>
                <option value="booking">Booking Request</option>
                <option value="collab">Collaboration</option>
                <option value="press">Press / Interview</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              <span>Message</span>
              <textarea name="message" rows={5} required placeholder="Tell us about your inquiry..." />
            </label>
            <button
              type="submit"
              className={`dj-btn dj-btn-submit ${formState === "sent" ? "is-sent" : ""}`}
              disabled={formState === "sending"}
            >
              {formState === "sending" ? "Sending..." : formState === "sent" ? "Sent ✓" : "Send Inquiry"}
            </button>
            {formState === "sent" && (
              <p className="form-success">Thanks! We'll get back to you within 48 hours.</p>
            )}
          </form>
        </div>
      </section>

      {/* Social Links */}
      <section className="dj-section social-section">
        <div className="dj-container">
          <h3 className="social-label">Follow</h3>
          <div className="social-links">
            {SOCIAL_LINKS.map((link) => (
              <a key={link.name} href={link.url} className="social-link">
                <span className="social-icon">{link.icon}</span>
                <span>{link.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Senai Technology Banner */}
      <div className="senai-banner">
        <div className="senai-banner-inner">
          <div className="senai-banner-text">
            <span className="senai-banner-label">Built by</span>
            <span className="senai-banner-brand">Senai Technology</span>
          </div>
          <div className="senai-banner-actions">
            <Link to="/" className="senai-banner-link">See the studio</Link>
            <Link to="/#contact" className="senai-banner-cta">Start your project →</Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="dj-footer">
        <div className="dj-footer-inner">
          <div className="dj-footer-brand">{ARTIST_NAME}</div>
          <div className="dj-footer-links">
            {SOCIAL_LINKS.map((link) => (
              <a key={link.name} href={link.url}>{link.name}</a>
            ))}
          </div>
          <p className="dj-footer-copy">
            © 2026 {ARTIST_NAME}. This is a concept showcase created by Senai Technology.
            Not a real artist. All content is fictional.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Hero({ reduced }: { reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduced) {
      setReady(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let animationId: number;

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      
      ctx.clearRect(0, 0, w, h);
      
      // Beat-synced circles
      const time = frame * 0.02;
      const numCircles = 12;
      
      for (let i = 0; i < numCircles; i++) {
        const angle = (i / numCircles) * Math.PI * 2;
        const radius = 100 + Math.sin(time + i * 0.5) * 40;
        const x = w / 2 + Math.cos(angle) * radius;
        const y = h / 2 + Math.sin(angle) * radius;
        const size = 20 + Math.sin(time * 2 + i) * 10;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `rgba(102, 126, 234, ${0.6 + Math.sin(time + i) * 0.4})`);
        gradient.addColorStop(1, "rgba(102, 126, 234, 0)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      frame++;
      animationId = requestAnimationFrame(animate);
    };

    setTimeout(() => setReady(true), 100);
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  return (
    <section className={`dj-hero ${ready ? "is-ready" : ""}`}>
      <canvas ref={canvasRef} className="dj-hero-canvas" aria-hidden />
      <div className="dj-hero-content">
        <h1 className="dj-hero-title">
          <span className="dj-hero-name">{ARTIST_NAME}</span>
          <span className="dj-hero-tagline">Electronic Music Producer & DJ</span>
        </h1>
        <p className="dj-hero-bio">{ARTIST_BIO}</p>
        <div className="dj-hero-actions">
          <a href="#music" className="dj-btn dj-btn-primary">Latest Release</a>
          <a href="#tour" className="dj-btn dj-btn-ghost">Tour Dates</a>
        </div>
      </div>
      <a href="#music" className="dj-scroll-cue" aria-label="Scroll to content">
        <span />
      </a>
    </section>
  );
}

function Visualizer({ isPlaying, reduced }: { isPlaying: boolean; reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced || !isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    let frame = 0;
    let animationId: number;

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      
      ctx.clearRect(0, 0, w, h);
      
      const bars = 32;
      const barWidth = w / bars;
      
      for (let i = 0; i < bars; i++) {
        const height = (Math.random() * 0.6 + 0.4) * h * (0.3 + Math.sin(frame * 0.1 + i * 0.3) * 0.7);
        const x = i * barWidth;
        
        const gradient = ctx.createLinearGradient(0, h, 0, h - height);
        gradient.addColorStop(0, "rgba(102, 126, 234, 0.6)");
        gradient.addColorStop(1, "rgba(245, 87, 108, 0.8)");
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, h - height, barWidth - 2, height);
      }
      
      frame++;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="visualizer-canvas"
      style={{ opacity: isPlaying ? 1 : 0.3 }}
      aria-hidden
    />
  );
}
