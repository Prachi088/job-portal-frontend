import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getConversation, sendMsg, markMessagesRead, deleteConversation, removeConnection, getUserPresence } from "../services/api";
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

function formatDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return timeStr;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;
  const dateStr = d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  return `${dateStr}, ${timeStr}`;
}

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return "Offline";
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "Last seen just now";
  if (mins < 60)  return `Last seen ${mins} minute${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `Last seen ${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days === 1) return "Last seen yesterday";
  return `Last seen ${days} days ago`;
}

// ── Confirmation Modal ──────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: "var(--bg-surface)", borderRadius: 16, padding: "28px 24px",
        maxWidth: 360, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        border: "1px solid var(--border)",
      }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
          {title}
        </h3>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: danger ? "#EF4444" : "var(--primary)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Three-dot dropdown menu ─────────────────────────────────────────────────
function HeaderMenu({ onDeleteChat, onRemoveConnection, onViewProfile }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = [
    {
      label: "View Profile",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      ),
      action: () => { setOpen(false); onViewProfile(); },
      danger: false,
    },
    {
      label: "Delete Chat",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
        </svg>
      ),
      action: () => { setOpen(false); onDeleteChat(); },
      danger: true,
    },
    {
      label: "Remove Connection",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/>
        </svg>
      ),
      action: () => { setOpen(false); onRemoveConnection(); },
      danger: true,
    },
  ];

  return (
    <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 36, height: 36, borderRadius: "50%", border: "none",
          background: open ? "var(--bg-subtle)" : "transparent",
          color: "var(--text-muted)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
        aria-label="Chat options"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5"  r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
          minWidth: 190, zIndex: 200, overflow: "hidden",
          animation: "fadeSlideDown 0.12s ease",
        }}>
          <style>{`
            @keyframes fadeSlideDown {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              style={{
                width: "100%", padding: "11px 16px", border: "none",
                background: "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 13, fontWeight: 500, textAlign: "left",
                color: item.danger ? "#EF4444" : "var(--text-primary)",
                borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ChatPage ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user } = useAuth();
  const { otherId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const otherName   = location.state?.name || "User";
  const avatarColor = getAvatarColor(otherName);

  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [presence, setPresence]   = useState(null);
  const [modal, setModal]         = useState(null);

  const bottomRef            = useRef(null);
  const inputRef             = useRef(null);
  const pollRef              = useRef(null);
  const presRef              = useRef(null);
  const messagesContainerRef = useRef(null);
  // FIX #2: track whether user is near bottom so poll doesn't yank them up
  const isNearBottom         = useRef(true);

  // FIX #2: update isNearBottom on scroll
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await getConversation(user.id, otherId);
      setMessages(res.data || []);
      await markMessagesRead(otherId, user.id);
    } catch (err) {
      console.error(err);
    }
  }, [user.id, otherId]);

  const fetchPresence = useCallback(async () => {
    try {
      const res = await getUserPresence(otherId);
      setPresence(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [otherId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchMessages(), fetchPresence()]);
      setLoading(false);
      // FIX: instant scroll on first load (no smooth, avoids flash)
      setTimeout(() => scrollToBottom("instant"), 0);
    };
    init();

    pollRef.current = setInterval(fetchMessages, 3000);
    presRef.current = setInterval(fetchPresence, 30_000);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(presRef.current);
    };
  }, [fetchMessages, fetchPresence, scrollToBottom]);

  // FIX #2: only scroll to bottom on new messages if user is already near bottom
  useEffect(() => {
    if (loading) return;
    if (isNearBottom.current) {
      scrollToBottom("smooth");
    }
  }, [messages, loading, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    const optimistic = {
      id: `opt-${Date.now()}`,
      senderId: Number(user.id),
      receiverId: Number(otherId),
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    // always scroll to bottom when user sends
    isNearBottom.current = true;
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

  const handleDeleteChat = async () => {
    setModal(null);
    try {
      await deleteConversation(user.id, otherId);
      setMessages([]);
      toast.success("Chat cleared");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete chat");
    }
  };

  const handleRemoveConnection = async () => {
    setModal(null);
    try {
      await removeConnection(user.id, otherId);
      toast.success(`${otherName} removed from connections`);
      navigate("/connected");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove connection");
    }
  };

  const grouped = messages.reduce((acc, msg) => {
    const date = formatDate(msg.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    // FIX #3: use dvh instead of vh for correct mobile height (accounts for browser chrome)
    <div style={{ height: "calc(100dvh - 62px)", minHeight: 0, display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        padding: "10px clamp(14px,4vw,24px)",
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "var(--shadow-sm)",
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate("/connected")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", alignItems: "center", flexShrink: 0, minWidth: 44, minHeight: 44, justifyContent: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
        </button>

        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: avatarColor.bg, color: avatarColor.text,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700,
          }}>
            {otherName.charAt(0).toUpperCase()}
          </div>
          {presence?.isOnline && (
            <span style={{
              position: "absolute", bottom: 1, right: 1,
              width: 10, height: 10, borderRadius: "50%",
              background: "var(--success)",
              border: "2px solid var(--bg-surface)",
            }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600,
            color: "var(--text-primary)", whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {otherName}
          </div>

          {presence === null ? null : presence.isOnline ? (
            <div style={{ fontSize: 11, color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
              Active now
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {formatLastSeen(presence.lastSeenAt)}
            </div>
          )}
        </div>

        <HeaderMenu
          onViewProfile={() => navigate(`/profile?userId=${otherId}`)}
          onDeleteChat={() => setModal("deleteChat")}
          onRemoveConnection={() => setModal("removeConnection")}
        />
      </div>

      {/* ── Messages ── */}
      {/* FIX #1: data-lenis-prevent="true" + explicit overscroll-behavior to stop Lenis interference */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        data-lenis-prevent
        data-lenis-prevent="true"
        style={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",   // FIX #1: stops Lenis/body scroll bleed
          padding: "clamp(12px,3vw,20px) clamp(14px,4vw,24px)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          // FIX: explicit min-height:0 so flex child can actually shrink and scroll
          minHeight: 0,
        }}
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 8px" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{date}</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {msgs.map((msg, i) => {
                const isMe = String(msg.senderId) === String(user.id);
                const showAvatar = !isMe && (i === 0 || String(msgs[i - 1]?.senderId) !== String(msg.senderId));
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 3, alignItems: "flex-end", gap: 6 }}>
                    {!isMe && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: showAvatar ? avatarColor.bg : "transparent", color: avatarColor.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {showAvatar ? otherName.charAt(0).toUpperCase() : ""}
                      </div>
                    )}
                    <div style={{ maxWidth: "min(65%, 280px)", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{
                        padding: "9px 14px",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isMe ? "var(--primary)" : "var(--bg-surface)",
                        color: isMe ? "#fff" : "var(--text-primary)",
                        border: isMe ? "none" : "1px solid var(--border)",
                        fontSize: 14, lineHeight: 1.5, wordBreak: "break-word",
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

      {/* ── Input ── */}
      <div style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
        padding: "clamp(10px,2vw,14px) clamp(14px,4vw,24px)",
        paddingBottom: "max(clamp(10px,2vw,14px), env(safe-area-inset-bottom, 10px))",
        display: "flex", gap: 10, alignItems: "center",
        flexShrink: 0,
      }}>
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

      {/* ── Modals ── */}
      {modal === "deleteChat" && (
        <ConfirmModal
          title="Delete Chat"
          message={`This will permanently clear all messages with ${otherName}. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteChat}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "removeConnection" && (
        <ConfirmModal
          title="Remove Connection"
          message={`Remove ${otherName} from your connections? They won't appear in your connections list anymore.`}
          confirmLabel="Remove"
          danger
          onConfirm={handleRemoveConnection}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}