import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { notifyLead, type LeadPayload } from "../lib/leads.ts";

export const config = { runtime: "edge" };

const SYSTEM_PROMPT = `You are the Smart Studio Concierge for Senai Technology — a creative technology studio between New York and Addis Ababa (Slotted LLC), founded by Senai Motley.

Offer (quoted per project; these are the current investment bands):
- Starter / Launch — $2,500: one sharp long-scroll page, mobile-first, contact form, search + social setup.
- Growth / Studio — $4,800: multi-page site with real identity, art-directed imagery, analytics, easy content updates.
- Signature — $8,500: fully animated showcase with custom WebGL/3D, scroll storytelling, performance tuning.
- Care Plan — $150/mo: ongoing polish, updates, and watchful hosting after launch.
Timelines: 2–6 weeks depending on tier and content. Reply within 1–2 business days.

Also: mobile apps, brand + AI visuals, video/motion, AI tools, interactive experiences. Payments: Stripe (US) and Chapa (Ethiopia).

Live on the site:
- Homepage + contact: https://senaitechnology.com/#contact
- Free website grader: https://senaitechnology.com/check
- NORA FLUX DJ Signature showcase: https://senaitechnology.com/work/dj
- /lab playground: Live WebGL Hero Generator, Motion Timeline, Studio Pass tear, 16-step Ethio-electronic sequencer
Email: hello@senaitechnology.com. Bilingual English and Amharic.

Keep replies short (2–4 sentences), warm, specific. Never invent empty answers. If they want to start, ask name, email, and what they need, then point to the contact form.`;

const ETHIOPIC = /[\u1200-\u137F]/;

type ChatMsg = { role?: string; content?: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function lastUser(messages: ChatMsg[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user" && messages[i]?.content) return String(messages[i].content);
  }
  return "";
}

function concierge(text: string): string {
  const q = text.toLowerCase();
  const am = ETHIOPIC.test(text);

  if (!q.trim()) {
    return am
      ? "Selam — Senai Technology, New York x Addis Ababa. Starter $2,500, Growth $4,800, Signature $8,500, /lab, or hello@senaitechnology.com."
      : "Hey — Senai Technology here, New York ⇄ Addis Ababa. Ask about Starter ($2,500), Growth ($4,800), Signature ($8,500), the Care Plan ($150/mo), /lab, /check, or just say what you want to build.";
  }

  if (/care\s*plan|retainer|monthly|hosting|maintain/.test(q)) {
    return "The Care Plan is $150/mo after launch: updates, watchful hosting, and small motion/copy tweaks so the site keeps a pulse. We can fold it into any tier. Write hello@senaitechnology.com or drop a note in the contact form and we will confirm what care should cover for you.";
  }

  if (/price|pricing|cost|how much|quote|budget|\$|starter|growth|launch|studio|signature|tier/.test(q)) {
    return "Three website bands, quoted after a short brief: Starter / Launch $2,500 (one sharp page), Growth / Studio $4,800 (multi-page with a real identity), Signature $8,500 (custom WebGL, the /work/dj energy). Care Plan is $150/mo. Timelines run 2–6 weeks. Tell me the shape of the project and I will point you.";
  }

  if (/how long|timeline|weeks|turnaround|fast|deadline/.test(q)) {
    return "Most sites land in 2–6 weeks: Starter on the quick end, Signature when the motion and WebGL need real finishing. You see a moving prototype early (Direction), then we build and launch. Share a date and we will say if it is honest.";
  }

  if (/amharic|amhara|addis|ethiopia|bilingual|ge.?ez|ethiopic/.test(q) || am) {
    return am
      ? "Awo — English + Amharic. Studio sits between New York and Addis Ababa; Ethiopia clients pay in birr via Chapa. What should we build? hello@senaitechnology.com or /lab."
      : "Yes — we work in English and Amharic, between New York and Addis Ababa. Ethiopia clients pay in birr through Chapa. The Ge'ez Senai mark is on the homepage hero and in /lab. What should we build?";
  }

  if (/\bdj\b|nora|flux|showcase|\/work/.test(q)) {
    return "NORA FLUX at /work/dj is a live Signature-tier sample: opt-in sound, audio-reactive WebGL, peel-open dates. Fictional artist, real craft. If you want that energy for a real act or brand, Signature ($8,500, about 4–6 weeks) is the lane.";
  }

  if (/\blab\b|playground|shader|sequencer|ticket|hero generator|dither|webgl/.test(q)) {
    return "The Lab at /lab is four instant experiments: a live WebGL hero + dither generator (Space cycles palettes), a 6-second motion timeline you can scrub, a holographic studio pass you can tear, and a 16-step Tizita sequencer. No onboarding — just play, then steal the feeling for a client site.";
  }

  if (/check|grade|score|seo|pagespeed|audit|llms/.test(q)) {
    return "Run the free grader at /check — speed (when PageSpeed is available), search basics, and AI-search readiness including llms.txt. No account. Paste a URL or say you do not have a site yet and we will recommend a tier.";
  }

  if (/contact|email|hello@|book|call|start|hire|project|brief/.test(q)) {
    return "Write hello@senaitechnology.com or use the homepage contact form — we reply within one business day. If you are ready now, tap I'm ready to start a project here and leave your name, email, and need.";
  }

  if (/app|ios|android|mobile|openslot/.test(q)) {
    return "We ship mobile too — OpenSlot is our own iOS booking app. Web is the main offer (Starter $2,500 / Growth $4,800 / Signature $8,500), and an app can sit beside a site. Tell me iOS, Android, or both.";
  }

  if (/brand|logo|visual|video|motion|film|ai tool|chatbot|assistant/.test(q)) {
    return "Beyond websites: brand + art-directed AI visuals, video and motion, and AI tools (assistants, booking, quiet automations). Often they ride along with Growth or Signature. What should the first surface be — a site, a film, or a tool?";
  }

  return "Senai Technology builds AI-accelerated sites with a pulse — Starter $2,500, Growth $4,800, Signature $8,500, Care $150/mo, usually 2–6 weeks, New York ⇄ Addis. Play /lab, score a URL at /check, or email hello@senaitechnology.com. What are you trying to make?";
}

async function addisReply(userText: string) {
  const key = process.env.ADDIS_AI_API_KEY || process.env.ADDIS_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.addisassistant.com/api/v1/chat_generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      prompt: `${SYSTEM_PROMPT}\n\nVisitor:\n${userText}`,
      target_language: "am",
      generation_config: { temperature: 0.7, maxOutputTokens: 400 },
    }),
  });
  if (!res.ok) throw new Error(`Addis ${res.status}`);
  const data = (await res.json()) as { response_text?: string; text?: string };
  const text = (data.response_text || data.text || "").trim();
  return text || null;
}

export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as {
      messages?: ChatMsg[];
      capturedLead?: { name: string; email: string; need: string };
    };
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (body.capturedLead?.email) {
      const lead: LeadPayload = {
        name: body.capturedLead.name || "Friend",
        email: body.capturedLead.email,
        need: body.capturedLead.need,
        message: body.capturedLead.need,
        source: "chat_assistant",
      };
      void notifyLead(lead);
      return json({
        ok: true,
        reply: `Thanks, ${lead.name}. We will write ${lead.email} within one business day. You can also reach us at hello@senaitechnology.com.`,
      });
    }

    const userText = lastUser(messages);
    const openaiKey = process.env.OPENAI_API_KEY;
    const addisKey = process.env.ADDIS_AI_API_KEY || process.env.ADDIS_API_KEY;

    if (ETHIOPIC.test(userText) && addisKey) {
      try {
        const am = await addisReply(userText);
        if (am) return json({ reply: am });
      } catch (err) {
        console.error("[Chat] Addis failed", err);
      }
    }

    if (openaiKey) {
      try {
        const result = streamText({
          model: openai("gpt-4o-mini"),
          system: SYSTEM_PROMPT,
          messages: messages.map((m) => ({
            role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
            content: String(m.content || ""),
          })),
          maxOutputTokens: 300,
          temperature: 0.7,
        });
        return result.toTextStreamResponse();
      } catch (err) {
        console.error("[Chat] OpenAI failed", err);
      }
    }

    return json({ reply: concierge(userText) });
  } catch (error) {
    console.error("[Chat] Error:", error);
    return json({ reply: concierge("") });
  }
}
