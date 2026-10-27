import { useState, useRef, useEffect } from "react";

type ChatState = "chat" | "lead-capture";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function assistantTextFromJson(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  if (typeof d.reply === "string" && d.reply.trim()) return d.reply;
  if (typeof d.message === "string" && d.message.trim()) return d.message;
  if (typeof d.content === "string" && d.content.trim()) return d.content;
  return "";
}

function consumeStreamLine(line: string, acc: string): string {
  const trimmed = line.trim();
  if (!trimmed || trimmed === "data: [DONE]" || trimmed === "[DONE]") return acc;
  if (trimmed.startsWith("data: ")) {
    const data = trimmed.slice(6);
    if (data === "[DONE]") return acc;
    try {
      const parsed = JSON.parse(data) as Record<string, unknown>;
      const choice = (parsed.choices as { delta?: { content?: string } }[] | undefined)?.[0];
      if (choice?.delta?.content) return acc + choice.delta.content;
      if (typeof parsed.content === "string") return acc + parsed.content;
      if (typeof parsed.reply === "string") return acc + parsed.reply;
      if (typeof parsed.text === "string") return acc + parsed.text;
      if (typeof parsed === "string") return acc + parsed;
    } catch {
      return acc + data;
    }
    return acc;
  }
  if (/^[0-9a-z]:/.test(trimmed)) {
    const payload = trimmed.slice(trimmed.indexOf(":") + 1);
    try {
      const parsed = JSON.parse(payload);
      if (typeof parsed === "string") return acc + parsed;
      if (parsed && typeof parsed === "object" && typeof (parsed as { text?: string }).text === "string") {
        return acc + (parsed as { text: string }).text;
      }
    } catch {
      return acc + payload.replace(/^"|"$/g, "");
    }
    return acc;
  }
  return acc + (acc && !acc.endsWith("\n") && trimmed ? (trimmed.startsWith("{") ? acc : trimmed) : trimmed);
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatState, setChatState] = useState<ChatState>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadData, setLeadData] = useState({ name: "", email: "", need: "" });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const writeAssistant = (id: string, content: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, content } : msg)));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    const assistantMessage: Message = { id: `${Date.now()}-a`, role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortControllerRef.current.signal,
      });

      const ct = (response.headers.get("content-type") || "").toLowerCase();

      if (ct.includes("application/json")) {
        const data: unknown = await response.json().catch(() => ({}));
        const text = assistantTextFromJson(data);
        if (text) {
          writeAssistant(assistantMessage.id, text);
        } else {
          writeAssistant(
            assistantMessage.id,
            "Senai Technology — New York ⇄ Addis. Starter $2,500, Growth $4,800, Signature $8,500, Care $150/mo. Email hello@senaitechnology.com or play /lab.",
          );
        }
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let accumulated = "";
      let rawMode = ct.includes("text/plain") || ct.includes("text/event-stream") === false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        const looksSse = chunk.includes("data:") || /^[0-9a-z]:/m.test(chunk);
        if (rawMode && !looksSse) {
          accumulated += chunk;
        } else {
          rawMode = false;
          for (const line of chunk.split(/\r?\n/)) {
            if (!line.trim()) continue;
            const next = consumeStreamLine(line, accumulated);
            accumulated = next === accumulated && !line.startsWith("data:") && !/^[0-9a-z]:/.test(line.trim())
              ? accumulated + line
              : next;
          }
        }
        writeAssistant(assistantMessage.id, accumulated);
      }

      if (!accumulated.trim()) {
        writeAssistant(
          assistantMessage.id,
          "Senai Technology builds sites with a pulse — Starter $2,500, Growth $4,800, Signature $8,500. Ask about /lab, /check, or email hello@senaitechnology.com.",
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      writeAssistant(
        assistantMessage.id,
        "The studio concierge is still here — write hello@senaitechnology.com or tell me what you want to build (Starter $2,500 / Growth $4,800 / Signature $8,500).",
      );
      setError(err instanceof Error ? err.message : null);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...leadData, source: "chat_assistant" }),
      });
      void fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], capturedLead: leadData }),
      });
      setLeadSubmitted(true);
      setTimeout(() => {
        setChatState("chat");
        setLeadSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error("[ChatWidget] Failed to submit lead:", err);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        className="chat-toggle"
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-content">
              <span className="chat-header-dot" />
              <div>
                <div className="chat-header-title">Senai Technology</div>
                <div className="chat-header-status">Studio concierge · Usually replies instantly</div>
              </div>
            </div>
            <button className="chat-close" onClick={toggleChat} aria-label="Close chat">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 5L5 15M5 5l10 10" />
              </svg>
            </button>
          </div>

          {chatState === "chat" ? (
            <>
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-welcome">
                    <div className="chat-welcome-avatar">
                      <span className="chat-welcome-dot" />
                    </div>
                    <p>
                      Hi — Senai Technology, New York ⇄ Addis. Ask about Starter $2,500, Growth $4,800, Signature $8,500, /lab, or /check.
                      <br />
                      <em>The concierge always answers, even without an API key.</em>
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-message chat-message-${msg.role}`}>
                    <div className="chat-message-content">{msg.content}</div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.content === "" && (
                  <div className="chat-message chat-message-assistant">
                    <div className="chat-message-content chat-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
                {error && !messages.some((m) => m.role === "assistant" && m.content) && (
                  <div className="chat-error">
                    <p>
                      Write <a href="mailto:hello@senaitechnology.com">hello@senaitechnology.com</a> or use the{" "}
                      <a href="/#contact" onClick={toggleChat}>contact form</a>.
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-footer">
                <button className="chat-lead-btn" onClick={() => setChatState("lead-capture")} type="button">
                  I'm ready to start a project →
                </button>
                <form onSubmit={handleSendMessage} className="chat-form">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about tiers, /lab, timelines…"
                    disabled={isLoading}
                    className="chat-input"
                  />
                  <button type="submit" disabled={isLoading || !input.trim()} className="chat-send">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="chat-lead-form">
              {leadSubmitted ? (
                <div className="chat-lead-success">
                  <div className="chat-lead-success-icon">✓</div>
                  <h3>Thanks, {leadData.name}!</h3>
                  <p>
                    We received your info and will reach out within 1 business day at {leadData.email}.
                  </p>
                  <a href="/#contact" className="btn btn-primary" onClick={toggleChat}>
                    Book a discovery call
                  </a>
                </div>
              ) : (
                <>
                  <div className="chat-lead-header">
                    <button className="chat-lead-back" onClick={() => setChatState("chat")} type="button" aria-label="Back to chat">
                      ←
                    </button>
                    <h3>Start a project</h3>
                  </div>
                  <form onSubmit={handleLeadSubmit}>
                    <label>
                      <span>Your name</span>
                      <input
                        value={leadData.name}
                        onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                        placeholder="Your name"
                        required
                      />
                    </label>
                    <label>
                      <span>Email</span>
                      <input
                        type="email"
                        value={leadData.email}
                        onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                        placeholder="you@company.com"
                        required
                      />
                    </label>
                    <label>
                      <span>What do you need?</span>
                      <textarea
                        value={leadData.need}
                        onChange={(e) => setLeadData({ ...leadData, need: e.target.value })}
                        placeholder="Tell us about your project..."
                        rows={3}
                        required
                      />
                    </label>
                    <button type="submit" className="btn btn-primary btn-block">
                      Submit & book a call →
                    </button>
                    <p className="chat-lead-note">We’ll reply within 1 business day and help you schedule a discovery call.</p>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
