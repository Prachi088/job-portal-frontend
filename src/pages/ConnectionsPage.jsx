import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getConnections, getUnreadCount } from "../services/api";
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

function formatConnectedTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

const CONNECTION_UPDATED_EVENT = "connectionStateUpdated";

export default function ConnectionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [connections, setConnections] = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [unreadMap, setUnreadMap]     = useState({});

  const loadConnections = useCallback(async () => {
    try {
      const res = await getConnections(user.id);
      const data = res.data || [];
      setConnections(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    setLoading(true);
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    loadConnections();
  }, [location.pathname, loadConnections]);

  useEffect(() => {
    const handleConnectionUpdate = (e) => {
      if (e.detail?.type === "ACCEPTED") loadConnections();
    };
    window.addEventListener(CONNECTION_UPDATED_EVENT, handleConnectionUpdate);
    return () => window.removeEventListener(CONNECTION_UPDATED_EVENT, handleConnectionUpdate);
  }, [loadConnections]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(connections); return; }
    const q = search.toLowerCase();
    setFiltered(connections.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.skills?.toLowerCase().includes(q)
    ));
  }, [search, connections]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      {/* ── Top bar ── */}
      <div style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        padding: "16px clamp(16px,4vw,32px)",
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 1px 0 var(--border)",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            Messages
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
            {loading ? "Loading..." : `${connections.length} connection${connections.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <button
          onClick={() => navigate("/connect")}
          style={{
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: "var(--primary)", color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
          title="Find more people"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* ── Search bar ── */}
      <div style={{ padding: "10px clamp(12px,4vw,24px)", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 12,
              paddingTop: 9, paddingBottom: 9,
              border: "none", borderRadius: 10,
              fontSize: 13, background: "var(--bg-subtle)",
              color: "var(--text-primary)", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* ── Chat list ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          // Skeleton rows
          [1,2,3,4,5].map((i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px clamp(12px,4vw,24px)",
              borderBottom: "1px solid var(--border)",
            }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--bg-subtle)", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ height: 13, width: "40%", background: "var(--bg-subtle)", borderRadius: 6 }} />
                <div style={{ height: 11, width: "70%", background: "var(--bg-subtle)", borderRadius: 6 }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", color: "var(--text-muted)", gap: 12 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.3 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", fontWeight: 500 }}>
              {connections.length === 0 ? "No connections yet" : "No matches found"}
            </p>
            <p style={{ fontSize: 13 }}>
              {connections.length === 0 ? "Connect with alumni and students to start messaging" : "Try a different search term"}
            </p>
            {connections.length === 0 && (
              <button
                onClick={() => navigate("/connect")}
                style={{ marginTop: 8, padding: "10px 22px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Find People
              </button>
            )}
          </div>
        ) : (
          filtered.map((conn, i) => {
            const avatarColor = getAvatarColor(conn.name);
            const unread = unreadMap[String(conn.userId)] || 0;
            const subtitle = conn.role === "RECRUITER" ? "Alumni" : "Student";
            const meta = conn.company ? `${subtitle} · ${conn.company}` : subtitle;

            return (
              <div
                key={conn.connectionId}
                onClick={() => navigate(`/chat/${conn.userId}`, { state: { name: conn.name } })}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "13px clamp(12px,4vw,24px)",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  background: "var(--bg-surface)",
                  transition: "background 0.12s",
                  userSelect: "none",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-subtle)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-surface)"}
              >
                {/* Avatar */}
                <div style={{
                  width: 46, height: 46, borderRadius: "50%",
                  background: avatarColor.bg, color: avatarColor.text,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700,
                  flexShrink: 0, position: "relative",
                }}>
                  {(conn.name || "?").charAt(0).toUpperCase()}
                  {unread > 0 && (
                    <span style={{
                      position: "absolute", top: 0, right: 0,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "var(--primary)", color: "#fff",
                      fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid var(--bg-surface)",
                    }}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <span style={{
                      fontFamily: "var(--font-display)", fontSize: 14, fontWeight: unread > 0 ? 700 : 600,
                      color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {conn.name}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {formatConnectedTime(conn.connectedAt)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 12, color: "var(--text-muted)", marginTop: 2,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {meta}
                  </div>
                </div>

                {/* Chevron */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)", flexShrink: 0, opacity: 0.4 }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}