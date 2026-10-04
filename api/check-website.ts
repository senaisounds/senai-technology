import type { VercelRequest, VercelResponse } from "@vercel/node";

const TIMEOUT_MS = 25000;
const MAX_REDIRECTS = 3;

/**
 * Website Check API
 * 
 * Analyzes websites for performance, SEO, and AI-search readiness.
 * 
 * Overall Score Weighting:
 * - With PageSpeed Insights (PAGESPEED_API_KEY set):
 *   40% Performance + 35% SEO + 25% AI-search
 * - Without PageSpeed (no API key or unavailable):
 *   60% SEO + 40% AI-search (performance excluded)
 * 
 * Environment Variables:
 * - PAGESPEED_API_KEY (optional): Google PageSpeed Insights API key
 *   When not set, performance is returned as null and excluded from scoring.
 */

interface CheckResult {
  score: number;
  performance: {
    score: number;
    hasPageSpeed: boolean;
    pageSpeedScore?: number;
    mobileScore?: number;
  } | null;
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
  fetchedAt: string;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "manual",
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPageSpeed(
  url: string,
  apiKey?: string
): Promise<{ desktop?: number; mobile?: number } | null> {
  if (!apiKey) {
    return null;
  }
  try {
    const params = new URLSearchParams({
      url,
      category: "performance",
      strategy: "mobile",
      key: apiKey,
    });
    const response = await fetchWithTimeout(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      {},
      15000
    );
    if (!response.ok) return null;
    const data = await response.json();
    const mobileScore = data.lighthouseResult?.categories?.performance?.score;
    return {
      mobile: mobileScore !== undefined ? Math.round(mobileScore * 100) : undefined,
    };
  } catch {
    return null;
  }
}

async function checkWebsite(targetUrl: string, apiKey?: string): Promise<CheckResult> {
  const normalizedUrl = targetUrl.startsWith("http")
    ? targetUrl
    : `https://${targetUrl}`;
  const urlObj = new URL(normalizedUrl);
  const isHttps = urlObj.protocol === "https:";

  let finalUrl = normalizedUrl;
  let response: Response;
  let redirectCount = 0;

  response = await fetchWithTimeout(normalizedUrl);
  while (
    (response.status === 301 ||
      response.status === 302 ||
      response.status === 307 ||
      response.status === 308) &&
    redirectCount < MAX_REDIRECTS
  ) {
    const location = response.headers.get("location");
    if (!location) break;
    finalUrl = new URL(location, finalUrl).href;
    response = await fetchWithTimeout(finalUrl);
    redirectCount++;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const html = await response.text();

  const titleMatch = /<title[^>]*>(.*?)<\/title>/is.exec(html);
  const metaDescMatch =
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i.exec(html) ||
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i.exec(html);
  const viewportMatch = /<meta[^>]*name=["']viewport["']/i.test(html);
  const ogMatch = /<meta[^>]*property=["']og:/i.test(html);
  const structuredDataMatch =
    /<script[^>]*type=["']application\/ld\+json["']/i.test(html);
  const h1Match = /<h1[^>]*>/i.test(html);

  const textContent = html
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const hasSubstantialText = textContent.length > 300;

  let robotsTxtExists = false;
  try {
    const robotsUrl = `${urlObj.origin}/robots.txt`;
    const robotsRes = await fetchWithTimeout(robotsUrl, {}, 5000);
    robotsTxtExists = robotsRes.ok;
  } catch {
    robotsTxtExists = false;
  }

  let sitemapExists = false;
  try {
    const sitemapUrl = `${urlObj.origin}/sitemap.xml`;
    const sitemapRes = await fetchWithTimeout(sitemapUrl, {}, 5000);
    sitemapExists = sitemapRes.ok;
  } catch {
    sitemapExists = false;
  }

  let llmsTxtExists = false;
  try {
    const llmsUrl = `${urlObj.origin}/llms.txt`;
    const llmsRes = await fetchWithTimeout(llmsUrl, {}, 5000);
    llmsTxtExists = llmsRes.ok;
  } catch {
    llmsTxtExists = false;
  }

  const pageSpeedData = await fetchPageSpeed(finalUrl, apiKey);

  const seoChecks = {
    https: isHttps,
    title: !!titleMatch && titleMatch[1].trim().length > 0,
    metaDescription: !!metaDescMatch && metaDescMatch[1].trim().length > 10,
    hasHeadings: h1Match,
    mobileViewport: viewportMatch,
    ogTags: ogMatch,
    structuredData: structuredDataMatch,
    robotsTxt: robotsTxtExists,
    sitemap: sitemapExists,
  };

  const seoScore = Math.round(
    (Object.values(seoChecks).filter(Boolean).length / Object.keys(seoChecks).length) *
      100
  );

  const aiSearchChecks = {
    hasTextContent: hasSubstantialText,
    hasStructuredData: structuredDataMatch,
    hasLlmsTxt: llmsTxtExists,
  };

  const aiSearchScore = Math.round(
    (Object.values(aiSearchChecks).filter(Boolean).length /
      Object.keys(aiSearchChecks).length) *
      100
  );

  const pageSpeedData = await fetchPageSpeed(finalUrl, apiKey);

  let performance: CheckResult["performance"] = null;
  let overallScore: number;

  if (pageSpeedData && pageSpeedData.mobile !== undefined) {
    const performanceScore = pageSpeedData.mobile;
    performance = {
      score: performanceScore,
      hasPageSpeed: true,
      mobileScore: pageSpeedData.mobile,
    };
    overallScore = Math.round(performanceScore * 0.4 + seoScore * 0.35 + aiSearchScore * 0.25);
  } else {
    overallScore = Math.round(seoScore * 0.6 + aiSearchScore * 0.4);
  }

  return {
    score: overallScore,
    performance,
    seo: {
      score: seoScore,
      checks: seoChecks,
    },
    aiSearch: {
      score: aiSearchScore,
      checks: aiSearchChecks,
    },
    url: finalUrl,
    fetchedAt: new Date().toISOString(),
  };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  record.count++;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests, please try again later" });
  }

  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    const urlPattern = /^(?:https?:\/\/)?[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i;
    if (!urlPattern.test(url)) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const apiKey = process.env.PAGESPEED_API_KEY;
    const result = await checkWebsite(url, apiKey);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Check website error:", error);
    if (error instanceof Error && error.name === "AbortError") {
      return res.status(408).json({ error: "Request timeout" });
    }
    return res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
}
