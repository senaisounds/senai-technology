import { useState } from "react";
import { motion } from "motion/react";
import "./CheckPage.css";

const reveal = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
};

interface CheckResult {
  score: number;
  performance: {
    score: number;
    hasPageSpeed: boolean;
    mobileScore?: number;
  };
  seo: {
    score: number;
    checks: {
      https: boolean;
      title: boolean;
      metaDescription: boolean;
      hasHeadings: boolean;
      mobileViewport: boolean;
      ogTags: boolean;
      structuredData: boolean;
      robotsTxt: boolean;
      sitemap: boolean;
    };
  };
  aiSearch: {
    score: number;
    checks: {
      hasTextContent: boolean;
      hasStructuredData: boolean;
      hasLlmsTxt: boolean;
    };
  };
  url: string;
}

type Stage = "input" | "loading" | "results" | "no-website" | "lead-form";

export function CheckPage() {
  const [stage, setStage] = useState<Stage>("input");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStage("loading");

    try {
      const response = await fetch("/api/check-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to check website");
      }

      const data = await response.json();
      setResult(data);
      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("input");
    }
  };

  const handleNoWebsite = () => {
    setStage("no-website");
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName,
          email: leadEmail,
          websiteUrl: stage === "no-website" ? undefined : result?.url,
          score: stage === "no-website" ? undefined : result?.score,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit");
      }

      setLeadSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "var(--blue)";
    if (score >= 60) return "var(--yellow)";
    return "var(--red)";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Great";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs work";
  };

  return (
    <div className="check-page">
      <nav className="check-nav">
        <a href="/" className="logo" aria-label="Senai Technology home">
          <span className="logo-dot" />
          Senai<span className="thin">Technology</span>
        </a>
        <a href="/#contact" className="btn btn-ghost btn-sm">
          Start a project
        </a>
      </nav>

      <main className="check-main">
        {stage === "input" && (
          <motion.div className="check-intro" {...reveal}>
            <p className="kicker">
              <span className="pill">Free check</span> See how your website scores
            </p>
            <h1 className="display-md">
              Website + AI&#8209;search check<span className="accent-dot">.</span>
            </h1>
            <p className="lede">
              Get a clear 0–100 score covering speed, mobile performance, SEO basics, and
              AI-search readiness. Built for small businesses in New York and Addis Ababa.
            </p>

            <form className="check-form" onSubmit={handleCheck}>
              <div className="form-group">
                <label htmlFor="url">
                  <span>Your website URL</span>
                  <span className="required">Required</span>
                </label>
                <input
                  id="url"
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="example.com or https://example.com"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="business">Business name (optional)</label>
                  <input
                    id="business"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your business name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">City (optional)</label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York or Addis Ababa"
                  />
                </div>
              </div>

              {error && <p className="error">{error}</p>}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg">
                  Check my website <span aria-hidden>→</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleNoWebsite}
                >
                  I don't have a website yet
                </button>
              </div>
            </form>

            <p className="check-note">
              This check typically takes 15–30 seconds. We analyze speed, mobile
              performance, SEO, and AI-search readiness.
            </p>
          </motion.div>
        )}

        {stage === "loading" && (
          <motion.div className="check-loading" {...reveal}>
            <div className="loader" />
            <h2>Checking your website...</h2>
            <p>
              We're analyzing{" "}
              <strong>{websiteUrl.replace(/^https?:\/\//, "")}</strong> for speed,
              SEO, and AI-search readiness.
            </p>
            <p className="muted">This usually takes 15–30 seconds</p>
          </motion.div>
        )}

        {stage === "results" && result && (
          <motion.div className="check-results" {...reveal}>
            <div className="results-header">
              <div className="score-badge" style={{ ["--score-color" as string]: getScoreColor(result.score) }}>
                <div className="score-number">{result.score}</div>
                <div className="score-label">{getScoreLabel(result.score)}</div>
              </div>
              <div>
                <p className="kicker">
                  <span className="pill">Your score</span>
                </p>
                <h2 className="display-md">
                  {businessName || "Your website"} scored {result.score} / 100
                  <span className="accent-dot">.</span>
                </h2>
                <p className="result-url">{result.url.replace(/^https?:\/\//, "")}</p>
              </div>
            </div>

            <div className="results-sections">
              {result.performance.hasPageSpeed && (
                <div className="result-section">
                  <div className="section-header">
                    <h3>Performance & Mobile</h3>
                    <div className="section-score" style={{ color: getScoreColor(result.performance.score) }}>
                      {result.performance.score}/100
                    </div>
                  </div>
                  <p className="section-desc">
                    Based on Google PageSpeed Insights mobile performance test.
                  </p>
                  <ul className="check-list">
                    <li className="check-item pass">
                      Mobile performance: <strong>{result.performance.mobileScore}/100</strong>
                    </li>
                  </ul>
                </div>
              )}

              {!result.performance.hasPageSpeed && (
                <div className="result-section">
                  <div className="section-header">
                    <h3>Performance & Mobile</h3>
                    <div className="section-score muted">Not tested</div>
                  </div>
                  <p className="section-desc">
                    PageSpeed check temporarily unavailable. Core score is based on SEO and AI-search readiness.
                  </p>
                </div>
              )}

              <div className="result-section">
                <div className="section-header">
                  <h3>SEO Basics</h3>
                  <div className="section-score" style={{ color: getScoreColor(result.seo.score) }}>
                    {result.seo.score}/100
                  </div>
                </div>
                <p className="section-desc">
                  Essential on-page SEO elements that help search engines understand your site.
                </p>
                <ul className="check-list">
                  <li className={result.seo.checks.https ? "check-item pass" : "check-item fail"}>
                    {result.seo.checks.https ? "✓" : "✗"} HTTPS (secure connection)
                  </li>
                  <li className={result.seo.checks.title ? "check-item pass" : "check-item fail"}>
                    {result.seo.checks.title ? "✓" : "✗"} Page title
                  </li>
                  <li className={result.seo.checks.metaDescription ? "check-item pass" : "check-item fail"}>
                    {result.seo.checks.metaDescription ? "✓" : "✗"} Meta description
                  </li>
                  <li className={result.seo.checks.hasHeadings ? "check-item pass" : "check-item fail"}>
                    {result.seo.checks.hasHeadings ? "✓" : "✗"} Heading tags (H1)
                  </li>
                  <li className={result.seo.checks.mobileViewport ? "check-item pass" : "check-item fail"}>
                    {result.seo.checks.mobileViewport ? "✓" : "✗"} Mobile viewport
                  </li>
                  <li className={result.seo.checks.ogTags ? "check-item pass" : "check-item fail"}>
                    {result.seo.checks.ogTags ? "✓" : "✗"} Open Graph tags (social sharing)
                  </li>
                  <li className={result.seo.checks.structuredData ? "check-item pass" : "check-item fail"}>
                    {result.seo.checks.structuredData ? "✓" : "✗"} Structured data
                  </li>
                  <li className={result.seo.checks.robotsTxt ? "check-item pass" : "check-item fail"}>
                    {result.seo.checks.robotsTxt ? "✓" : "✗"} robots.txt
                  </li>
                  <li className={result.seo.checks.sitemap ? "check-item pass" : "check-item fail"}>
                    {result.seo.checks.sitemap ? "✓" : "✗"} Sitemap
                  </li>
                </ul>
              </div>

              <div className="result-section">
                <div className="section-header">
                  <h3>AI-Search Readiness</h3>
                  <div className="section-score" style={{ color: getScoreColor(result.aiSearch.score) }}>
                    {result.aiSearch.score}/100
                  </div>
                </div>
                <p className="section-desc">
                  Can AI assistants (ChatGPT, Perplexity, Gemini) find and understand your business?
                </p>
                <ul className="check-list">
                  <li className={result.aiSearch.checks.hasTextContent ? "check-item pass" : "check-item fail"}>
                    {result.aiSearch.checks.hasTextContent ? "✓" : "✗"} Real text content (not just images)
                  </li>
                  <li className={result.aiSearch.checks.hasStructuredData ? "check-item pass" : "check-item fail"}>
                    {result.aiSearch.checks.hasStructuredData ? "✓" : "✗"} Structured data (schema.org)
                  </li>
                  <li className={result.aiSearch.checks.hasLlmsTxt ? "check-item pass" : "check-item fail"}>
                    {result.aiSearch.checks.hasLlmsTxt ? "✓" : "✗"} llms.txt file (AI instruction file)
                  </li>
                </ul>
              </div>
            </div>

            <div className="cta-section">
              <h3>Want to improve your score?</h3>
              <p>
                Get a free 30-minute consultation. We'll walk through your results and show
                you exactly what to fix — or build you a new site that scores 90+.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setStage("lead-form")}
              >
                Get free consultation <span aria-hidden>→</span>
              </button>
            </div>
          </motion.div>
        )}

        {stage === "no-website" && (
          <motion.div className="no-website" {...reveal}>
            <p className="kicker">
              <span className="pill">No website yet</span>
            </p>
            <h2 className="display-md">
              You're not alone<span className="accent-dot">.</span>
            </h2>
            <p className="lede">
              40% of small businesses still don't have a website. Here's what you're
              missing:
            </p>

            <div className="missing-list">
              <div className="missing-item">
                <div className="missing-icon">🔍</div>
                <h4>Search visibility</h4>
                <p>
                  Customers search "best [your service] near me" every day. Without a
                  website, they'll find your competitors instead.
                </p>
              </div>
              <div className="missing-item">
                <div className="missing-icon">🤖</div>
                <h4>AI assistant discovery</h4>
                <p>
                  ChatGPT, Perplexity, and Google's AI now answer questions like "find me
                  a plumber in Brooklyn" with websites, not just phone numbers.
                </p>
              </div>
              <div className="missing-item">
                <div className="missing-icon">📱</div>
                <h4>24/7 storefront</h4>
                <p>
                  A website works when you're closed, showing your services, prices, and
                  booking options while you sleep.
                </p>
              </div>
              <div className="missing-item">
                <div className="missing-icon">💼</div>
                <h4>Professional credibility</h4>
                <p>
                  83% of customers check a business's website before visiting. No website
                  = less trust.
                </p>
              </div>
            </div>

            <div className="cta-section">
              <h3>Let's fix that</h3>
              <p>
                We build fast, beautiful websites for small businesses starting at $2,500.
                Get a free consultation and see exactly what your site could look like.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setStage("lead-form")}
              >
                Get free consultation <span aria-hidden>→</span>
              </button>
            </div>
          </motion.div>
        )}

        {stage === "lead-form" && !leadSubmitted && (
          <motion.div className="lead-form-wrapper" {...reveal}>
            <p className="kicker">
              <span className="pill">Almost there</span>
            </p>
            <h2 className="display-md">
              Book your free consultation<span className="accent-dot">.</span>
            </h2>
            <p className="lede">
              We'll reply within two business days with times and a clear plan.
            </p>

            <form className="check-form" onSubmit={handleLeadSubmit}>
              <div className="form-group">
                <label htmlFor="lead-name">
                  <span>Your name</span>
                  <span className="required">Required</span>
                </label>
                <input
                  id="lead-name"
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lead-email">
                  <span>Email</span>
                  <span className="required">Required</span>
                </label>
                <input
                  id="lead-email"
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="you@business.com"
                  required
                />
              </div>

              {error && <p className="error">{error}</p>}

              <button type="submit" className="btn btn-primary btn-lg btn-block">
                Send it <span aria-hidden>→</span>
              </button>
            </form>
          </motion.div>
        )}

        {stage === "lead-form" && leadSubmitted && (
          <motion.div className="lead-success" {...reveal}>
            <div className="success-icon">✓</div>
            <h2 className="display-md">
              Thanks, {leadName}<span className="accent-dot">!</span>
            </h2>
            <p className="lede">
              We'll email you at <strong>{leadEmail}</strong> within two business days
              with times and next steps.
            </p>
            <a href="/" className="btn btn-ghost">
              Back to home
            </a>
          </motion.div>
        )}
      </main>

      <footer className="check-footer">
        <p>© 2026 Senai Technology · <a href="/">Back to home</a></p>
      </footer>
    </div>
  );
}
