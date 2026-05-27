import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getConversation, sendMsg, markMessagesRead } from "../services/api";
import toast from "react-hot-toast";

const AVATAR_COLORS = [
  { bg: "#EEF2FF", text: "#4F46E5" },
  { bg: "#FEF3C7", text: "#D97706" },
  { bg: "#ECFDF5", text: "#059669" },
  { bg: "#F3EFFB", text: "#6B4CAB" },
  { bg: "#D2EBF8", text: "#1A6B9A" },
];
function getAvatarColor(name = "") {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function formatTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

export default function ChatPage() {
  const { user } = useAuth();
  const { otherId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const otherName = location.state?.name || "User";
  const avatarColor = getAvatarColor(otherName);

  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);
  const pollRef                   = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await getConversation(user.id, otherId);
      setMessages(res.data || []);
      // mark as read
      await markMessagesRead(otherId, user.id);
    } catch (err) {
      console.error(err);
    }
  }, [user.id, otherId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchMessages();
      setLoading(false);
    };
    init();

    // Poll every 3 seconds for new messages
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    // Optimistic update
    const optimistic = {
      id: `opt-${Date.now()}`,
      senderId: Number(user.id),
      receiverId: Number(otherId),
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await sendMsg({ senderId: Number(user.id), receiverId: Number(otherId), content });
      await fetchMessages();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(content);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const date = formatDate(msg.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      {/* Chat header */}
      <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", padding: "12px clamp(14px,4vw,24px)", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--shadow-sm)" }}>
        <button onClick={() => navigate("/connected")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", alignItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
        </button>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: avatarColor.bg, color: avatarColor.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
          {otherName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{otherName}</div>
          <div style={{ fontSize: 11, color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
            Active now
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "clamp(12px,3vw,20px) clamp(14px,4vw,24px)", display: "flex", flexDirection: "column", gap: 4 }}
        data-lenis-prevent
      >
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--text-muted)", fontSize: 14 }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--text-muted)", gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: avatarColor.bg, color: avatarColor.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700 }}>
              {otherName.charAt(0).toUpperCase()}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", fontWeight: 500 }}>{otherName}</p>
            <p style={{ fontSize: 13 }}>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              {/* Date divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 8px" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{date}</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {msgs.map((msg, i) => {
                const isMe = String(msg.senderId) === String(user.id);
                const showAvatar = !isMe && (i === 0 || String(msgs[i-1]?.senderId) !== String(msg.senderId));
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 3, alignItems: "flex-end", gap: 6 }}>
                    {/* Other's avatar */}
                    {!isMe && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: showAvatar ? avatarColor.bg : "transparent", color: avatarColor.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {showAvatar ? otherName.charAt(0).toUpperCase() : ""}
                      </div>
                    )}

                    <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{
                        padding: "9px 14px",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isMe ? "var(--primary)" : "var(--bg-surface)",
                        color: isMe ? "#fff" : "var(--text-primary)",
                        border: isMe ? "none" : "1px solid var(--border)",
                        fontSize: 14,
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-xmuted)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        {formatTime(msg.createdAt)}
                        {isMe && (
                          <span style={{ color: msg.isRead ? "var(--primary)" : "var(--text-xmuted)" }}>
                            {msg.isRead ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)", padding: "clamp(10px,2vw,14px) clamp(14px,4vw,24px)", display: "flex", gap: 10, alignItems: "center" }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={`Message ${otherName}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          style={{ flex: 1, padding: "11px 16px", border: "1.5px solid var(--border)", borderRadius: 24, fontSize: 14, background: "var(--bg-subtle)", color: "var(--text-primary)", outline: "none", fontFamily: "var(--font-body)", transition: "border-color 0.15s" }}
          onFocus={e => e.target.style.borderColor = "var(--primary)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: input.trim() ? "var(--primary)" : "var(--bg-subtle)", color: input.trim() ? "#fff" : "var(--text-muted)", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
