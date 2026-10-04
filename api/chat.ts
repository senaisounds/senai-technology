import { openai } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";

const SYSTEM_PROMPT = `You are a friendly AI assistant for Senai Technology, a creative technology studio between New York and Addis Ababa (operating under Slotted LLC).

About Senai Technology:
- We design and build premium, animated, AI-accelerated websites — "Websites with a pulse"
- We offer three tiers: Launch (one sharp page), Studio (multi-page with real identity), and Signature (fully animated showcase with custom 3D/WebGL)
- We also do mobile apps (iOS & Android), brand identity & AI visuals, video & motion, AI tools for businesses, and interactive experiences
- We've shipped OpenSlot, a mobile app for event & performance bookings (available on the App Store)
- Our process: Brief → Direction (moving prototype) → Build (AI-accelerated, hand-tuned) → Launch

Your role:
- Answer visitor questions about what we do, our website tiers, and how we work together
- Keep responses short (2-3 sentences), friendly, and conversational
- When visitors express interest, collect their name, email, and what they need
- Guide interested visitors toward booking a discovery call
- The tiers are available but specific pricing is discussed during discovery calls — suggest booking if they ask about cost
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
