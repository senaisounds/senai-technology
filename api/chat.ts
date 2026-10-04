import { openai } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";

const SYSTEM_PROMPT = `You are a friendly AI assistant for Senai Technology, a creative technology studio based in Briarcliff Manor, NY with Addis Ababa roots (operating under Slotted LLC).

About Senai Technology:
- We build AI-powered websites, mobile apps (iOS & Android), brand identity, video/motion, AI tools (chatbots, booking assistants, automations), and interactive experiences
- Our first offer is AI-built websites for clients in the US (New York) and Ethiopia (Addis Ababa)
- We've shipped OpenSlot, a mobile app for event & performance bookings (available on the App Store)
- We work on marketing sites, web apps, e-commerce, prototypes, identity design, motion design, 3D, social content, and event installations

Your role:
- Answer visitor questions about what we do, our services, and how we work together
- Keep responses short (2-3 sentences), friendly, and conversational
- When visitors express interest, collect their name, email, and what they need
- Guide interested visitors toward booking a discovery call
- If asked about pricing or details not mentioned on the site, say you don't have that information and suggest booking a call to discuss their specific needs
- Stay on topic - if asked about unrelated things, politely redirect to how we can help with their creative technology needs

Contact: hello@senaitechnology.com`;

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "AI_NOT_CONFIGURED",
        message:
          "The AI chat is not fully set up yet. Please email us at hello@senaitechnology.com or use the contact form below!",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();
    const { messages, capturedLead } = body as {
      messages: CoreMessage[];
      capturedLead?: { name: string; email: string; need: string };
    };

    if (capturedLead) {
      const webhookUrl = process.env.CHAT_LEAD_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: "chat_assistant",
              timestamp: new Date().toISOString(),
              ...capturedLead,
            }),
          });
        } catch (err) {
          console.error("[Chat] Failed to send lead to webhook:", err);
        }
      }
      console.log("[Chat] Lead captured:", JSON.stringify(capturedLead));
    }

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      messages,
      maxTokens: 300,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[Chat] Error:", error);
    return new Response(
      JSON.stringify({
        error: "CHAT_ERROR",
        message: "Something went wrong. Please try again or email us directly.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
