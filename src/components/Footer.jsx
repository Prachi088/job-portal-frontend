import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const GithubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// FIX: Helper that scrolls to top in a way that works with Lenis.
// Lenis overrides native window.scrollTo, so we must use the Lenis
// instance directly when it's active, and fall back to the native API
// for pages where Lenis hasn't initialised yet.
function scrollToTop() {
  // Lenis attaches itself to window.__lenis__ in some setups; here the
  // app stores it in the module-level `lenisInstance` variable inside
  // App.jsx and also ticks via gsap. We reach it through the global
  // gsap ticker object is not accessible here, so we use the documented
  // Lenis approach: dispatch a custom event that App.jsx can handle,
  // OR — the simplest reliable approach — call lenis.scrollTo(0) via
  // the globally exposed instance if available, otherwise fall back.
  const lenis = window.__lenis__;
  if (lenis && typeof lenis.scrollTo === "function") {
    lenis.scrollTo(0, { immediate: true });
  } else {
    // Fallback for pages without Lenis (login, register, about)
    window.scrollTo({ top: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
}

export default function Footer() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const hidden = ["/about", "/login", "/register"].includes(location.pathname);
  if (hidden) return null;

  const navLinks = [
    { label: "Browse Jobs",   path: "/jobs" },
    { label: "Events",        path: "/events" },
    { label: "My Applications", path: "/my-applications" },
    { label: "Recruiter Hub", path: "/recruiter" },
    { label: "About",         path: "/about" },
  ];

  const socialLinks = [
    { label: "GitHub",   href: "https://github.com/Prachi088",   icon: <GithubIcon />,   hoverColor: "var(--text-primary)" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/prachi-rajput-023985280",  icon: <LinkedinIcon />, hoverColor: "#0A66C2" },
  ];

  // FIX: Navigate then immediately scroll to top, accounting for Lenis.
  const handleNavClick = (path) => {
    navigate(path);
    // Use setTimeout(0) to let React Router finish the navigation and
    // mount the new page before we reset the scroll position.
    setTimeout(scrollToTop, 0);
  };

  return (
    <footer style={s.footer}>
      <div style={s.inner}>
        <div style={s.grid} className="footer-grid">

          {/* Brand column */}
          <div style={s.brandCol}>
            <div style={s.brandRow}>
              <div style={s.logoBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div>
                <div style={s.logoName}>Alumni Portal</div>
                <div style={s.logoSub}>SATI · Vidisha, Madhya Pradesh</div>
              </div>
            </div>
            <p style={s.desc}>
              A professional network for Samrat Ashok Technological Institute graduates and current students — to connect, grow, and give back to the community.
            </p>
            <a
              href="https://www.satiengg.in/"
              target="_blank"
              rel="noopener noreferrer"
              style={s.collegeLink}
            >
              satiengg.in ↗
            </a>
          </div>

          {/* Navigation */}
          <div style={s.linksCol}>
            <h4 style={s.colHead}>Navigation</h4>
            <ul style={s.linkList}>
              {navLinks.map(({ label, path }) => (
                <li key={label}>
                  <button
                    className="footer-nav-link"
                    onClick={() => handleNavClick(path)}
                    style={{
                      ...s.navLink,
                      color: location.pathname === path ? "var(--primary)" : "var(--text-muted)",
                      fontWeight: location.pathname === path ? "600" : "400",
                    }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Social + contact */}
          <div style={s.socialCol}>
            <h4 style={s.colHead}>Connect</h4>
            <div style={s.socialList}>
              {socialLinks.map(({ label, href, icon, hoverColor }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link"
                  style={s.socialLink}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = hoverColor;
                    e.currentTarget.style.background = "var(--bg-subtle)";
                    e.currentTarget.style.borderColor = "var(--border-strong)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.background = "var(--bg-surface)";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                  aria-label={label}
                >
                  {icon}
                  <span>{label}</span>
                </a>
              ))}
            </div>
            <div style={s.contactNote}>
              <p style={s.contactLabel}>Get in touch</p>
              <a href="mailto:alumni@sati.ac.in" style={s.emailLink}>
                alumni@sati.ac.in
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={s.bottomBar}>
          <span>© {new Date().getFullYear()} SATI Alumni Portal · Built with React &amp; Spring Boot</span>
          <span>Made with care for the SATI community</span>
        </div>
      </div>
    </footer>
  );
}

const s = {
  footer: {
    background: "var(--bg-surface)",
    borderTop: "1px solid var(--border)",
    marginTop: "auto",
    width: "100%",
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "clamp(32px, 8vw, 52px) clamp(16px, 5vw, 28px) 0",
  },
  grid: {
    display: "grid",
    gap: "clamp(24px, 6vw, 52px)",
    paddingBottom: "clamp(24px, 6vw, 44px)",
  },
  brandCol: { display: "flex", flexDirection: "column", gap: 0 },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "clamp(8px, 2vw, 11px)",
    marginBottom: "clamp(12px, 3vw, 16px)",
  },
  logoBox: {
    width: "clamp(28px, 5vw, 34px)",
    height: "clamp(28px, 5vw, 34px)",
    background: "var(--primary)",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
  },
  logoName: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(13px, 2vw, 14.5px)",
    fontWeight: 500,
    color: "var(--text-primary)",
    lineHeight: 1.2,
    letterSpacing: "-0.2px",
  },
  logoSub: {
    fontSize: 11.5, color: "var(--text-muted)",
    lineHeight: 1.4, marginTop: 1,
  },
  desc: {
    fontSize: "clamp(12px, 1.8vw, 13px)",
    color: "var(--text-muted)",
    lineHeight: 1.85,
    maxWidth: "100%",
    marginBottom: "clamp(12px, 3vw, 16px)",
  },
  collegeLink: {
    fontSize: 12.5,
    color: "var(--primary)",
    textDecoration: "none",
    fontWeight: 600,
    letterSpacing: "0.02em",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  linksCol: {},
  colHead: {
    fontFamily: "var(--font-body)",
    fontSize: "clamp(9px, 1.5vw, 10px)",
    fontWeight: 700,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: "clamp(12px, 3vw, 16px)",
  },
  linkList: {
    listStyle: "none",
    padding: 0, margin: 0,
    display: "flex", flexDirection: "column", gap: 1,
  },
  navLink: {
    background: "none",
    border: "none",
    fontFamily: "var(--font-body)",
    fontSize: 13.5,
    cursor: "pointer",
    textAlign: "left",
    padding: "6px 0",
    transition: "color 0.18s, padding-left 0.18s",
    lineHeight: 1.4,
  },
  socialCol: {},
  socialList: {
    display: "flex",
    flexDirection: "column",
    gap: "clamp(6px, 1.5vw, 7px)",
    marginBottom: "clamp(16px, 4vw, 24px)",
  },
  socialLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: "var(--text-muted)",
    textDecoration: "none",
    fontWeight: 500,
    padding: "7px 12px",
    borderRadius: "var(--r-md)",
    border: "1px solid var(--border)",
    background: "var(--bg-surface)",
    transition: "all 0.18s",
    width: "fit-content",
    minWidth: 110,
    fontFamily: "var(--font-body)",
  },
  contactNote: {
    borderTop: "1px solid var(--border-light)",
    paddingTop: "clamp(12px, 3vw, 16px)",
  },
  contactLabel: {
    fontSize: 11,
    color: "var(--text-xmuted)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: 5,
  },
  emailLink: {
    fontSize: 13,
    color: "var(--primary)",
    textDecoration: "none",
    fontWeight: 600,
    transition: "opacity 0.2s",
  },
  bottomBar: {
    borderTop: "1px solid var(--border-light)",
    padding: "clamp(12px, 4vw, 22px) 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "clamp(8px, 2vw, 12px)",
    fontSize: "clamp(11px, 1.8vw, 12px)",
    color: "var(--text-xmuted)",
    fontFamily: "var(--font-body)",
  },
};
