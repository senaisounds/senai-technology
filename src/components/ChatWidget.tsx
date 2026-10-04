import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";

type ChatState = "chat" | "lead-capture";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatState, setChatState] = useState<ChatState>("chat");
  const [leadData, setLeadData] = useState({ name: "", email: "", need: "" });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    onError: (err) => {
      console.error("[ChatWidget] Error:", err);
    },
  });

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages,
            {
              role: "user",
              content: `I'd like to start a project. My name is ${leadData.name}, email is ${leadData.email}, and I need: ${leadData.need}`,
            },
          ],
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
    if (!isOpen && messages.length === 0) {
      setTimeout(() => {
        const welcomeMessage = {
          id: "welcome",
          role: "assistant" as const,
          content:
            "Hi! I'm here to help you learn about Senai Technology. What would you like to know? (We build AI websites, mobile apps, brands, and more!)",
        };
        messages.push(welcomeMessage);
      }, 100);
    }
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
                {isLoading && (
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
                      The chat isn't fully set up yet. Please{" "}
                      <a href="#contact">use our contact form</a> or email{" "}
                      <a href="mailto:hello@senaitechnology.com">hello@senaitechnology.com</a>!
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
                <form onSubmit={handleSubmit} className="chat-form">
                  <input
                    value={input}
                    onChange={handleInputChange}
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
