import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      {/* Logo */}
      <div
        style={styles.logo}
        onClick={() => navigate(user?.role === "RECRUITER" ? "/recruiter" : "/jobs")}
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

      {/* Centre nav links */}
      <div style={styles.links}>
        {user?.role !== "RECRUITER" && (
          <>
            <NavLink to="/jobs" active={isActive("/jobs")} label="Browse Jobs" />
            <NavLink to="/my-applications" active={isActive("/my-applications")} label="Applications" />
            <NavLink to="/profile" active={isActive("/profile")} label="Profile" />
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-chatbox"))}
              style={{
                ...styles.chatBtn,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              AI Chat
            </button>
          </>
        )}

        {user?.role === "RECRUITER" && (
          <>
            <NavLink to="/recruiter" active={isActive("/recruiter")} label="Dashboard" />
            <NavLink to="/events" active={isActive("/events")} label="Events" />
            <NavLink to="/profile" active={isActive("/profile")} label="Profile" />
          </>
        )}
      </div>

      {/* Right — user + logout */}
      <div style={styles.userArea}>
        <div style={styles.avatar}>
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <span style={styles.userName}>{user?.name?.split(" ")[0] || "User"}</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Sign out
        </button>
      </div>
    </nav>
  );
}

function NavLink({ to, active, label }) {
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
    </Link>
  );
}

const styles = {
  nav: {
    background: "rgba(250,250,248,0.94)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderBottom: "1px solid var(--border)",
    padding: "0 28px",
    height: "62px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 999,
    gap: 20,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    flexShrink: 0,
    textDecoration: "none",
  },
  logoMark: {
    width: 34,
    height: 34,
    background: "var(--primary)",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "var(--font-display)",
    fontSize: 17,
    fontWeight: 500,
    color: "var(--text-primary)",
    letterSpacing: "-0.3px",
    whiteSpace: "nowrap",
  },
  logoAccent: {
    color: "var(--primary)",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    flex: 1,
    justifyContent: "center",
  },
  chatBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "var(--primary-dim)",
    color: "var(--primary)",
    border: "1.5px solid rgba(61,122,111,0.22)",
    padding: "6px 14px",
    borderRadius: "var(--r-md)",
    fontSize: "13.5px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.15s",
    letterSpacing: "0.01em",
  },
  chatBtnActive: {
    background: "var(--primary)",
    color: "#fff",
    borderColor: "transparent",
  },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    background: "var(--primary-dim)",
    border: "1.5px solid rgba(61,122,111,0.25)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--primary)",
    fontFamily: "var(--font-display)",
    fontWeight: "600",
    fontSize: "12px",
  },
  userName: {
    fontSize: "13.5px",
    fontWeight: "500",
    color: "var(--text-primary)",
    letterSpacing: "0.01em",
  },
  logoutBtn: {
    background: "none",
    border: "1px solid var(--border)",
    color: "var(--error)",
    padding: "5px 12px",
    borderRadius: "var(--r-md)",
    fontSize: "12.5px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.15s",
    letterSpacing: "0.01em",
  },
};