import { useState, useRef, useEffect } from "react";

type ChatState = "chat" | "lead-capture";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

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
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let accumulatedContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                accumulatedContent += parsed.choices[0].delta.content;
              } else if (parsed.content) {
                accumulatedContent += parsed.content;
              } else if (typeof parsed === "string") {
                accumulatedContent += parsed;
              }
            } catch {
              accumulatedContent += data;
            }
          } else if (line.startsWith("0:")) {
            const content = line.slice(3, -1);
            accumulatedContent += content;
          }
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id ? { ...msg, content: accumulatedContent } : msg
          )
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          capturedLead: leadData,
        }),
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

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

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
                <div className="chat-header-status">AI Assistant · Usually replies instantly</div>
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
                      Hi! I'm here to help you learn about Senai Technology. What would you like to know?
                      <br />
                      <em>(We build AI websites, mobile apps, brands, and more!)</em>
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
                {error && (
                  <div className="chat-error">
                    <p>
                      {error.includes("AI_NOT_CONFIGURED") || error.includes("not fully set up") ? (
                        <>
                          The chat isn't fully set up yet. Please{" "}
                          <a href="#contact" onClick={toggleChat}>
                            use our contact form
                          </a>{" "}
                          or email{" "}
                          <a href="mailto:hello@senaitechnology.com">hello@senaitechnology.com</a>!
                        </>
                      ) : (
                        error
                      )}
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-footer">
                <button
                  className="chat-lead-btn"
                  onClick={() => setChatState("lead-capture")}
                  type="button"
                >
                  I'm ready to start a project →
                </button>
                <form onSubmit={handleSendMessage} className="chat-form">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about our services..."
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
                    We've received your info and will reach out within 2 business days. Check your email
                    ({leadData.email}) for our reply.
                  </p>
                  <a href="#contact" className="btn btn-primary" onClick={toggleChat}>
                    Book a discovery call
                  </a>
                </div>
              ) : (
                <>
                  <div className="chat-lead-header">
                    <button
                      className="chat-lead-back"
                      onClick={() => setChatState("chat")}
                      type="button"
                      aria-label="Back to chat"
                    >
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
                    <p className="chat-lead-note">
                      We'll reply within 2 business days and help you schedule a discovery call.
                    </p>
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
