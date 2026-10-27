import { notifyLead, type LeadPayload } from "../lib/leads";

export const config = { runtime: "edge" };

const rate = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX = 8;

function allow(ip: string) {
  const now = Date.now();
  const rec = rate.get(ip);
  if (!rec || now > rec.resetAt) {
    rate.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= MAX) return false;
  rec.count++;
  return true;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(ip)) return json({ error: "Too many requests" }, 429);

  try {
    const body = (await req.json()) as Partial<LeadPayload>;
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    if (!name || !email) return json({ error: "Name and email are required" }, 400);
    if (!EMAIL_OK.test(email)) return json({ error: "Invalid email format" }, 400);

    const source = String(body.source || "website-check-tool");
    const lead: LeadPayload = {
      name,
      email,
      source,
      need: body.need ? String(body.need) : undefined,
      message: body.message ? String(body.message) : body.need ? String(body.need) : undefined,
      business: body.business ? String(body.business) : undefined,
      city: body.city ? String(body.city) : undefined,
      budget: body.budget ? String(body.budget) : undefined,
      websiteUrl: body.websiteUrl ? String(body.websiteUrl) : undefined,
      score: body.score,
      timestamp: new Date().toISOString(),
    };

    await notifyLead(lead);
    return json({ success: true });
  } catch (err) {
    console.error("Submit lead error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
