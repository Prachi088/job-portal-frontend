import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getConnections } from "../services/api";
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

export default function ConnectionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [connections, setConnections] = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");

  const loadConnections = async () => {
    setLoading(true);
    try {
      const res = await getConnections(user.id);
      setConnections(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load connections");
    }
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadConnections();
  }, [user.id]); // eslint-disable-line

  // Refetch on every navigation to this page (same-tab navigation supported)
  useEffect(() => {
    if (location.pathname !== "/connected") return;
    loadConnections();
  }, [location.pathname]); // eslint-disable-line

  useEffect(() => {
    if (!search.trim()) { setFiltered(connections); return; }
    const q = search.toLowerCase();
    setFiltered(connections.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.skills?.toLowerCase().includes(q)
    ));
  }, [search, connections]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(145deg, #1E1B4B 0%, #4F46E5 100%)", color: "#fff", padding: "clamp(28px,6vw,52px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 500, marginBottom: 6 }}>
            My Connections
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
            {loading ? "Loading..." : `${connections.length} connection${connections.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(16px,4vw,28px) clamp(14px,4vw,24px)" }}>

        {/* Search */}
        <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "clamp(12px,3vw,16px)", marginBottom: 24, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              placeholder="Search connections..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13, background: "var(--bg-subtle)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button
            onClick={() => navigate("/connect")}
            style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + Find More
          </button>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", height: 160 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--text-muted)" }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 6 }}>
              {connections.length === 0 ? "No connections yet" : "No matches found"}
            </p>
            <p style={{ fontSize: 13, marginBottom: 20 }}>
              {connections.length === 0 ? "Start building your network" : "Try a different search"}
            </p>
            {connections.length === 0 && (
              <button onClick={() => navigate("/connect")} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Find People to Connect
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 16 }}>
            {filtered.map(conn => {
              const avatarColor = getAvatarColor(conn.name);
              return (
                <div key={conn.connectionId} style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 12 }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: avatarColor.bg, color: avatarColor.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                      {(conn.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{conn.name}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: conn.role === "RECRUITER" ? "rgba(232,130,12,0.1)" : "rgba(79,70,229,0.1)", color: conn.role === "RECRUITER" ? "#C26B06" : "#4F46E5" }}>
                        {conn.role === "RECRUITER" ? "Alumni" : "Student"}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 4 }}>
                    {conn.company && <span>🏢 {conn.company}</span>}
                    {conn.skills && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                        {conn.skills.split(",").slice(0,3).map((s,i) => (
                          <span key={i} style={{ padding: "2px 8px", background: "var(--bg-subtle)", borderRadius: 20, fontSize: 11, border: "1px solid var(--border)" }}>
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/chat/${conn.userId}`, { state: { name: conn.name } })}
                    style={{ marginTop: "auto", padding: "9px 0", borderRadius: 10, border: "1px solid var(--primary)", background: "transparent", color: "var(--primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--primary)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--primary)"; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Message
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}