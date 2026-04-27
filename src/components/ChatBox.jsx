import React, { useState, useRef, useEffect } from "react";
import { sendMessage } from "../services/api";

const ChatBox = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your AI career assistant. How can I help you today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);

  // Listen for navbar button click to open chat
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-chatbox", handler);
    return () => window.removeEventListener("open-chatbox", handler);
  }, []);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // ✅ SCROLL TRAP FIX — prevent wheel/touch events from bubbling to Lenis
  useEffect(() => {
    const el = chatBodyRef.current;
    if (!el) return;

    const stopPropagation = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const atTop = scrollTop === 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight;

      // Only block if scrolling beyond bounds would propagate
      if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
        e.preventDefault();
      }
      e.stopPropagation();
    };

    el.addEventListener("wheel", stopPropagation, { passive: false });
    el.addEventListener("touchmove", stopPropagation, { passive: false });

    return () => {
      el.removeEventListener("wheel", stopPropagation);
      el.removeEventListener("touchmove", stopPropagation);
    };
  }, [open]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendMessage(input);
      setMessages((prev) => [...prev, { text: res.data.reply, sender: "bot" }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: "Something went wrong. Please try again.", sender: "bot" },
      ]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={styles.fab}
        aria-label="Open AI chat"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={styles.window}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.statusDot} />
              <div>
                <div style={styles.headerTitle}>Career Assistant</div>
                <div style={styles.headerSub}>Online · Powered by AI</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={styles.closeBtn}
              aria-label="Close chat"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            ref={chatBodyRef}
            style={styles.body}
            data-lenis-prevent  /* Hint to Lenis to not capture scroll here */
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.msg,
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  background: msg.sender === "user" ? "var(--primary)" : "var(--bg-surface)",
                  color: msg.sender === "user" ? "#fff" : "var(--text-primary)",
                  border: msg.sender === "user" ? "none" : "1px solid var(--border)",
                  borderBottomRightRadius: msg.sender === "user" ? 4 : 14,
                  borderBottomLeftRadius: msg.sender === "bot" ? 4 : 14,
                }}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <div style={{ ...styles.msg, alignSelf: "flex-start", background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <TypingDots />
              </div>
            )}
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about jobs, careers, interviews…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={styles.input}
            />
            <button onClick={handleSend} style={styles.sendBtn} aria-label="Send">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6, height: 6,
            borderRadius: "50%",
            background: "var(--text-xmuted)",
            animation: "typingBounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  fab: {
    position: "fixed",
    bottom: 28, right: 28,
    width: 52, height: 52,
    background: "var(--primary)",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(61,122,111,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    zIndex: 9999,
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  window: {
    position: "fixed",
    bottom: 92, right: 28,
    width: 340,
    background: "var(--bg-surface)",
    borderRadius: "var(--r-xl)",
    boxShadow: "var(--shadow-xl)",
    border: "1px solid var(--border)",
    zIndex: 9998,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 8, height: 8,
    background: "#A8E6C8",
    borderRadius: "50%",
    boxShadow: "0 0 0 2px rgba(168,230,200,0.3)",
  },
  headerTitle: {
    color: "#fff",
    fontFamily: "var(--font-display)",
    fontWeight: 500,
    fontSize: 14,
  },
  headerSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "none",
    borderRadius: 7,
    width: 28, height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
    transition: "background 0.15s",
  },
  body: {
    height: 260,
    overflowY: "auto",
    overscrollBehavior: "contain", /* ✅ key fix */
    padding: "14px 14px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 9,
    background: "var(--bg-subtle)",
  },
  msg: {
    maxWidth: "82%",
    padding: "9px 13px",
    borderRadius: 14,
    fontSize: 13,
    lineHeight: 1.55,
    wordBreak: "break-word",
  },
  inputRow: {
    display: "flex",
    borderTop: "1px solid var(--border)",
    padding: "10px 12px",
    gap: 8,
    background: "var(--bg-surface)",
  },
  input: {
    flex: 1,
    border: "1.5px solid var(--border)",
    borderRadius: "var(--r-md)",
    padding: "8px 12px",
    fontSize: 13,
    outline: "none",
    fontFamily: "var(--font-body)",
    background: "var(--bg-subtle)",
    color: "var(--text-primary)",
    transition: "border-color 0.15s",
  },
  sendBtn: {
    background: "var(--primary)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--r-md)",
    width: 36, height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.15s",
  },
};

export default ChatBox;