import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getAllUsers,
  sendConnectionRequest,
  getConnectionRequests,
  getConnections,
} from "../services/api";
import toast from "react-hot-toast";

const ROLE_COLORS = {
  RECRUITER: { bg: "rgba(232,130,12,0.1)", text: "#C26B06", label: "Alumni/Recruiter" },
  STUDENT:   { bg: "rgba(79,70,229,0.1)",  text: "#4F46E5", label: "Student" },
};

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

export default function ConnectPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers]               = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState("ALL");
  const [skillFilter, setSkillFilter]   = useState("");
  const [sentRequests, setSentRequests] = useState(new Set());
  const [connected, setConnected]       = useState(new Set());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, reqRes, connRes] = await Promise.all([
          getAllUsers(),
          getConnectionRequests(user.id),
          getConnections(user.id),
        ]);

        // exclude self
        const others = (usersRes.data || []).filter(u => String(u.id) !== String(user.id));
        setUsers(others);
        setFiltered(others);

        // pending incoming requests count
        setPendingCount((reqRes.data || []).length);

        // already connected user IDs
        const connIds = new Set((connRes.data || []).map(c => String(c.userId)));
        setConnected(connIds);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load users");
      }
      setLoading(false);
    };
    fetchData();
  }, [user.id]);

  // filter whenever search/role/skill changes
  useEffect(() => {
    let result = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.company?.toLowerCase().includes(q) ||
        u.education?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "ALL") {
      result = result.filter(u => u.role === roleFilter);
    }
    if (skillFilter.trim()) {
      const q = skillFilter.toLowerCase();
      result = result.filter(u => u.skills?.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [search, roleFilter, skillFilter, users]);

  const handleConnect = async (receiverId) => {
    try {
      await sendConnectionRequest(user.id, receiverId);
      setSentRequests(prev => new Set([...prev, String(receiverId)]));
      toast.success("Connection request sent!");
    } catch (err) {
      const msg = err.response?.data;
      if (typeof msg === "string" && msg.includes("already")) {
        setSentRequests(prev => new Set([...prev, String(receiverId)]));
        toast("Request already sent");
      } else {
        toast.error("Failed to send request");
      }
    }
  };

  const getButtonState = (userId) => {
    const id = String(userId);
    if (connected.has(id)) return "connected";
    if (sentRequests.has(id)) return "sent";
    return "none";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(145deg, #1E1B4B 0%, #4F46E5 100%)", color: "#fff", padding: "clamp(28px,6vw,52px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 500, marginBottom: 6 }}>
                Connect with Alumni & Students
              </h1>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
                Build your professional network within the SATI community
              </p>
            </div>
            <button
              onClick={() => navigate("/notifications")}
              style={{ position: "relative", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "10px 18px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Notifications
              {pendingCount > 0 && (
                <span style={{ position: "absolute", top: -6, right: -6, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(16px,4vw,32px) clamp(14px,4vw,24px)" }}>

        {/* Filters */}
        <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: "clamp(14px,3vw,20px)", marginBottom: 24, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", display: "flex", flexWrap: "wrap", gap: 12 }}>
          {/* Search */}
          <div style={{ flex: "1 1 220px", position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              placeholder="Search by name, company, college..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13, background: "var(--bg-subtle)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ flex: "0 0 auto", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13, background: "var(--bg-subtle)", color: "var(--text-primary)", cursor: "pointer", outline: "none" }}
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="RECRUITER">Alumni / Recruiters</option>
          </select>

          {/* Skills filter */}
          <input
            placeholder="Filter by skill (e.g. React, Java...)"
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            style={{ flex: "1 1 180px", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13, background: "var(--bg-subtle)", color: "var(--text-primary)", outline: "none" }}
          />

          {/* Clear */}
          {(search || roleFilter !== "ALL" || skillFilter) && (
            <button
              onClick={() => { setSearch(""); setRoleFilter("ALL"); setSkillFilter(""); }}
              style={{ padding: "10px 16px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, background: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Results count */}
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          {loading ? "Loading..." : `${filtered.length} member${filtered.length !== 1 ? "s" : ""} found`}
        </p>

        {/* User cards grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", height: 180 }}>
                <div className="skeleton skeleton-avatar" style={{ width: 56, height: 56, borderRadius: "50%", marginBottom: 12 }} />
                <div className="skeleton skeleton-title" style={{ width: "60%", marginBottom: 8 }} />
                <div className="skeleton skeleton-text" style={{ width: "40%" }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--text-muted)" }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 6 }}>No members found</p>
            <p style={{ fontSize: 13 }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map(u => {
              const avatarColor = getAvatarColor(u.name);
              const roleConfig = ROLE_COLORS[u.role] || ROLE_COLORS.STUDENT;
              const btnState = getButtonState(u.id);

              return (
                <div key={u.id} style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 12 }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                >
                  {/* Avatar + name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: avatarColor.bg, color: avatarColor.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                      {(u.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{u.name}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: roleConfig.bg, color: roleConfig.text }}>
                        {roleConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: "var(--text-muted)" }}>
                    {u.company && (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                        {u.company}
                      </span>
                    )}
                    {u.currentRole && (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        {u.currentRole}
                      </span>
                    )}
                    {u.education && (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                        {u.education}
                      </span>
                    )}
                    {u.skills && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {u.skills.split(",").slice(0, 3).map((s, i) => (
                          <span key={i} style={{ padding: "2px 8px", background: "var(--bg-subtle)", borderRadius: 20, fontSize: 11, color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                            {s.trim()}
                          </span>
                        ))}
                        {u.skills.split(",").length > 3 && (
                          <span style={{ padding: "2px 8px", background: "var(--bg-subtle)", borderRadius: 20, fontSize: 11, color: "var(--text-muted)" }}>
                            +{u.skills.split(",").length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Connect button */}
                  <button
                    onClick={() => btnState === "none" && handleConnect(u.id)}
                    disabled={btnState !== "none"}
                    style={{
                      marginTop: "auto",
                      padding: "9px 0",
                      borderRadius: 10,
                      border: btnState === "connected" ? "1px solid var(--success-border)" : btnState === "sent" ? "1px solid var(--border)" : "none",
                      background: btnState === "connected" ? "var(--success-bg)" : btnState === "sent" ? "var(--bg-subtle)" : "var(--primary)",
                      color: btnState === "connected" ? "var(--success)" : btnState === "sent" ? "var(--text-muted)" : "#fff",
                      fontSize: 13, fontWeight: 600, cursor: btnState === "none" ? "pointer" : "default",
                      transition: "all 0.2s",
                    }}
                  >
                    {btnState === "connected" ? "✓ Connected" : btnState === "sent" ? "Request Sent" : "Connect"}
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