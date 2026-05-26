import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getConnectionRequests } from "../services/api";
import toast from "react-hot-toast";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const drawerRef = useRef(null);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  // Fetch pending connection requests count
  useEffect(() => {
    if (!user?.id) return;
    const fetchPending = async () => {
      try {
        const res = await getConnectionRequests(user.id);
        setPendingCount((res.data || []).length);
      } catch {}
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close drawer on ESC key
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const studentLinks = [
    { to: "/jobs",            label: "Browse Jobs" },
    { to: "/my-applications", label: "Applications" },
    { to: "/connect",         label: "Connect" },
    { to: "/profile",         label: "Profile" },
  ];

  const recruiterLinks = [
    { to: "/recruiter", label: "Dashboard" },
    { to: "/events",    label: "Events" },
    { to: "/connect",   label: "Connect" },
    { to: "/profile",   label: "Profile" },
  ];

  const navLinks = user?.role === "RECRUITER" ? recruiterLinks : studentLinks;

  return (
    <>
      <nav style={styles.nav}>
        {/* ── Logo ── */}
        <div
          style={styles.logo}
          onClick={() => navigate(user?.role === "RECRUITER" ? "/recruiter" : "/jobs")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(user?.role === "RECRUITER" ? "/recruiter" : "/jobs")}
        >
          <div style={styles.logoMark}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <span style={styles.logoText}>
            Alumni<span style={styles.logoAccent}>Portal</span>
          </span>
        </div>

        {/* ── Desktop centre links ── */}
        <div className="nav-desktop-links" style={styles.links}>
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              active={isActive(to)}
              label={label}
              badge={to === "/connect" && pendingCount > 0 ? pendingCount : 0}
            />
          ))}
        </div>

        {/* ── Desktop right ── */}
        <div className="nav-desktop-user" style={styles.userArea}>
          {/* Connections icon */}
          <button
            onClick={() => navigate("/connected")}
            title="My Connections"
            style={{
              ...styles.iconBtn,
              background: isActive("/connected") ? "var(--primary-dim)" : "none",
              color: isActive("/connected") ? "var(--primary)" : "var(--text-muted)",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </button>

          {/* Notifications icon */}
          <button
            onClick={() => navigate("/notifications")}
            title="Connection Requests"
            style={{ ...styles.iconBtn, position: "relative", color: isActive("/notifications") ? "var(--primary)" : "var(--text-muted)", background: isActive("/notifications") ? "var(--primary-dim)" : "none" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {pendingCount > 0 && (
              <span style={{ position: "absolute", top: 2, right: 2, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>

          <div style={styles.divider} />
          <div style={styles.avatar}>{user?.name?.charAt(0).toUpperCase() || "U"}</div>
          <span style={styles.userName}>{user?.name?.split(" ")[0] || "User"}</span>
          <button onClick={handleLogout} style={styles.logoutBtn} className="nav-logout-btn">
            Sign out
          </button>
        </div>

        {/* ── Mobile: avatar + hamburger ── */}
        <div className="nav-mobile-right" style={styles.mobileRight}>
          {/* Mobile notification badge */}
          <button
            onClick={() => navigate("/notifications")}
            style={{ ...styles.iconBtn, position: "relative" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {pendingCount > 0 && (
              <span style={{ position: "absolute", top: 0, right: 0, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
          <div style={styles.avatar}>{user?.name?.charAt(0).toUpperCase() || "U"}</div>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            style={styles.hamburger}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <span style={{ ...styles.hLine, transform: mobileOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ ...styles.hLine, opacity: mobileOpen ? 0 : 1, transform: mobileOpen ? "scaleX(0)" : "none" }} />
            <span style={{ ...styles.hLine, transform: mobileOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileOpen && (
        <div style={styles.overlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* ── Mobile Drawer ── */}
      <div
        ref={drawerRef}
        style={{
          ...styles.drawer,
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          visibility: mobileOpen ? "visible" : "hidden",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div style={styles.drawerHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ ...styles.avatar, width: 40, height: 40, fontSize: 15 }}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <div style={styles.drawerName}>{user?.name || "User"}</div>
              <div style={styles.drawerRole}>{user?.role === "RECRUITER" ? "Recruiter" : "Job Seeker"}</div>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} style={styles.drawerClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Drawer nav links */}
        <div style={styles.drawerLinks}>
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              style={{
                ...styles.drawerLink,
                background: isActive(to) ? "var(--primary-dim)" : "transparent",
                color: isActive(to) ? "var(--primary)" : "var(--text-primary)",
                fontWeight: isActive(to) ? 600 : 400,
                borderLeft: isActive(to) ? "3px solid var(--primary)" : "3px solid transparent",
              }}
            >
              {drawerLinkIcon(to)}
              {label}
              {to === "/connect" && pendingCount > 0 && (
                <span style={{ marginLeft: "auto", background: "#EF4444", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}

          {/* Connections link in drawer */}
          <Link
            to="/connected"
            onClick={() => setMobileOpen(false)}
            style={{
              ...styles.drawerLink,
              background: isActive("/connected") ? "var(--primary-dim)" : "transparent",
              color: isActive("/connected") ? "var(--primary)" : "var(--text-primary)",
              fontWeight: isActive("/connected") ? 600 : 400,
              borderLeft: isActive("/connected") ? "3px solid var(--primary)" : "3px solid transparent",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            My Connections
          </Link>
        </div>

        {/* Drawer footer */}
        <div style={styles.drawerFooter}>
          <button onClick={handleLogout} style={styles.drawerLogout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

function drawerLinkIcon(to) {
  const icons = {
    "/jobs":            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    "/my-applications": <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>,
    "/profile":         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    "/recruiter":       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    "/events":          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    "/connect":         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  };
  return icons[to] || null;
}

function NavLink({ to, active, label, badge = 0 }) {
  return (
    <Link
      to={to}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "13.5px",
        fontWeight: active ? "600" : "500",
        color: active ? "var(--primary)" : "var(--text-secondary)",
        textDecoration: "none",
        padding: "6px 13px",
        borderRadius: "var(--r-md)",
        background: active ? "var(--primary-dim)" : "transparent",
        transition: "all 0.15s",
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--primary)";
          e.currentTarget.style.background = "var(--primary-dim)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--text-secondary)";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {label}
      {badge > 0 && (
        <span style={{ background: "#EF4444", color: "#fff", borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 700, lineHeight: 1.4 }}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

const styles = {
  nav: {
    background: "rgba(250,250,248,0.94)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderBottom: "1px solid var(--border)",
    padding: "0 clamp(14px, 4vw, 28px)",
    minHeight: "62px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 999,
    gap: 12,
  },
  logo: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0, textDecoration: "none" },
  logoMark: { width: "clamp(28px, 5vw, 34px)", height: "clamp(28px, 5vw, 34px)", background: "var(--primary)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 },
  logoText: { fontFamily: "var(--font-display)", fontSize: "clamp(13px, 2.5vw, 17px)", fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.3px", whiteSpace: "nowrap" },
  logoAccent: { color: "var(--primary)" },
  links: { display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", width: 34, height: 34, borderRadius: "var(--r-md)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", transition: "all 0.15s", flexShrink: 0 },
  divider: { width: 1, height: 20, background: "var(--border)", margin: "0 4px" },
  userArea: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  avatar: { width: 32, height: 32, background: "var(--primary-dim)", border: "1.5px solid rgba(79,70,229,0.25)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "12px", flexShrink: 0 },
  userName: { fontSize: "13.5px", fontWeight: "500", color: "var(--text-primary)", letterSpacing: "0.01em", whiteSpace: "nowrap" },
  logoutBtn: { background: "none", border: "1px solid var(--border)", color: "var(--error)", padding: "5px 12px", borderRadius: "var(--r-md)", fontSize: "12.5px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s", letterSpacing: "0.01em", whiteSpace: "nowrap" },
  mobileRight: { display: "none", alignItems: "center", gap: 8, flexShrink: 0 },
  hamburger: { background: "none", border: "1px solid var(--border)", borderRadius: "var(--r-md)", width: 40, height: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", padding: 0, flexShrink: 0 },
  hLine: { display: "block", width: 18, height: 2, background: "var(--text-primary)", borderRadius: 2, transition: "transform 0.22s ease, opacity 0.22s ease", transformOrigin: "center" },
  overlay: { position: "fixed", inset: 0, background: "rgba(28,36,34,0.45)", zIndex: 1098, backdropFilter: "blur(2px)" },
  drawer: { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(300px, 85vw)", background: "var(--bg-surface)", zIndex: 1099, boxShadow: "-8px 0 40px rgba(28,36,34,0.18)", display: "flex", flexDirection: "column", transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.28s", overflowY: "auto" },
  drawerHeader: { padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-subtle)" },
  drawerName: { fontSize: 15, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.2px" },
  drawerRole: { fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, fontWeight: 500 },
  drawerClose: { background: "var(--bg-muted)", border: "none", borderRadius: "var(--r-md)", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)", flexShrink: 0 },
  drawerLinks: { flex: 1, padding: "12px 12px", display: "flex", flexDirection: "column", gap: 2 },
  drawerLink: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--r-md)", fontSize: 14.5, textDecoration: "none", transition: "all 0.15s", letterSpacing: "0.01em", paddingLeft: 14 },
  drawerFooter: { padding: "12px 12px 20px", borderTop: "1px solid var(--border)" },
  drawerLogout: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px", background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "var(--r-md)", color: "var(--error)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s" },
};