import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";
// ── Design tokens (explicit light — immune to OS dark mode) ──────
const C = {
  pageBg:        "#F4F7F6",
  navBg:         "#F8FBFA",
  surface:       "#FFFFFF",
  surfaceAlt:    "#F0F5F4",
  primary:       "#0A6E6E",
  primaryLight:  "#14A0A0",
  accent:        "#E8820C",
  accentDark:    "#C26B06",
  success:       "#059669",
  danger:        "#DC2626",
  textPrimary:   "#0D1F1F",
  textSecondary: "#3D5454",
  textMuted:     "#7A9595",
  border:        "#D4E0E0",
  borderLight:   "#E8F0F0",
};

const features = [
  { icon: "👔", title: "Professional Network",  desc: "Connect with accomplished SATI alumni across industries and geographies.", color: "rgba(10,110,110,0.07)" },
  { icon: "📋", title: "Career Opportunities",  desc: "Access exclusive job postings shared by our distinguished alumni network.", color: "rgba(232,130,12,0.07)" },
  { icon: "📊", title: "Industry Events",       desc: "Discover networking events, webinars, and professional development opportunities.", color: "rgba(5,150,105,0.07)" },
  { icon: "📄", title: "Professional Profiles", desc: "Showcase your academic background, career achievements, and professional expertise.", color: "rgba(10,110,110,0.07)" },
  { icon: "🤝", title: "Strategic Connections", desc: "Build meaningful professional relationships within the SATI community.", color: "rgba(232,130,12,0.07)" },
  { icon: "🏢", title: "SATI Community",        desc: "An exclusive professional platform dedicated to SATI's academic excellence.", color: "rgba(5,150,105,0.07)" },
];

const steps = [
  { num: "01", title: "Create Account",   desc: "Register with your institutional email and select your current status." },
  { num: "02", title: "Complete Profile", desc: "Build your professional profile with academic and career details." },
  { num: "03", title: "Expand Network",   desc: "Connect with fellow alumni and industry professionals." },
  { num: "04", title: "Engage & Grow",   desc: "Access opportunities, events, and continue your professional journey." },
];

export default function About() {
  const navigate = useNavigate();
  const [stats, setStats]         = useState({ users: null, jobs: null, events: null });
  const [menuOpen, setMenuOpen]   = useState(false);
  const [hoveredFeat, setHoveredFeat] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);
const isLoggedIn = !!localStorage.getItem("id");
  // Refs for GSAP targets
  const pageRef       = useRef(null);
  const heroRef       = useRef(null);
  const heroBadgeRef  = useRef(null);
  const heroTitleRef  = useRef(null);
  const heroSubRef    = useRef(null);
  const heroBtnsRef   = useRef(null);
  const trustBarRef   = useRef(null);
  const blob1Ref      = useRef(null);
  const blob2Ref      = useRef(null);
  const statsRef      = useRef(null);
  const featSectionRef= useRef(null);
  const stepsSectionRef= useRef(null);
  const audSectionRef = useRef(null);
  const ctaSectionRef = useRef(null);
  const navRef        = useRef(null);

  // ── Fetch stats ───────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/users`).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/api/jobs`).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/api/events`).then(r => r.json()).catch(() => null),
    ]).then(([users, jobs, events]) => {
      setStats({
        users:  Array.isArray(users)  ? users.length  : "50",
        jobs:   Array.isArray(jobs)   ? jobs.length   : "20",
        events: Array.isArray(events) ? events.length : "10",
      });
    });
  }, []);

  // ── GSAP Animations ───────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Hero entrance sequence ──
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTl
        .fromTo(heroBadgeRef.current,
          { opacity: 0, y: -18, scale: 0.94 },
          { opacity: 1, y: 0,   scale: 1, duration: 0.6, delay: 0.1 })
        .fromTo(heroTitleRef.current,
          { opacity: 0, y: 36, skewY: 1.5 },
          { opacity: 1, y: 0,  skewY: 0, duration: 0.75 }, "-=0.3")
        .fromTo(heroSubRef.current,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.6 }, "-=0.4")
        .fromTo(heroBtnsRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.55 }, "-=0.35")
        .fromTo(trustBarRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45 }, "-=0.3");

      // ── Blob parallax on scroll ──
      if (blob1Ref.current) {
        gsap.to(blob1Ref.current, {
          y: -80,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.4,
          },
        });
      }
      if (blob2Ref.current) {
        gsap.to(blob2Ref.current, {
          y: -50,
          x: 30,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.8,
          },
        });
      }

      // ── Stats counter reveal ──
      if (statsRef.current) {
        const statCards = statsRef.current.querySelectorAll(".about-stat-card");
        gsap.fromTo(statCards,
          { opacity: 0, y: 32, scale: 0.96 },
          {
            opacity: 1, y: 0, scale: 1,
            stagger: 0.09, duration: 0.6, ease: "power2.out",
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 82%",
              toggleActions: "play none none none",
            },
          }
        );

        // Animate stat numbers counting up
        const nums = statsRef.current.querySelectorAll(".about-stat-num");
        nums.forEach(el => {
          const raw = el.getAttribute("data-target");
          if (!raw) return;
          const target = parseInt(raw, 10);
          if (isNaN(target)) return;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 1.6,
            ease: "power2.out",
            delay: 0.3,
            onUpdate: () => { el.textContent = `${Math.floor(obj.val)}+`; },
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 82%",
              toggleActions: "play none none none",
            },
          });
        });
      }

      // ── Feature cards stagger reveal ──
      if (featSectionRef.current) {
        const cards = featSectionRef.current.querySelectorAll(".about-feat-card");
        gsap.fromTo(cards,
          { opacity: 0, y: 38, scale: 0.97 },
          {
            opacity: 1, y: 0, scale: 1,
            stagger: 0.07, duration: 0.65, ease: "power3.out",
            scrollTrigger: {
              trigger: featSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );

        // Section title slide
        const title = featSectionRef.current.querySelector(".about-section-title");
        if (title) {
          gsap.fromTo(title,
            { opacity: 0, x: -28 },
            {
              opacity: 1, x: 0, duration: 0.65, ease: "power3.out",
              scrollTrigger: { trigger: title, start: "top 85%", toggleActions: "play none none none" },
            }
          );
        }
      }

      // ── Steps stagger ──
      if (stepsSectionRef.current) {
        const steps = stepsSectionRef.current.querySelectorAll(".about-step-card");
        gsap.fromTo(steps,
          { opacity: 0, y: 36, scale: 0.96 },
          {
            opacity: 1, y: 0, scale: 1,
            stagger: 0.1, duration: 0.65, ease: "back.out(1.2)",
            scrollTrigger: {
              trigger: stepsSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // ── Audience cards slide in from sides ──
      if (audSectionRef.current) {
        const cards = audSectionRef.current.querySelectorAll(".about-aud-card");
        cards.forEach((card, i) => {
          gsap.fromTo(card,
            { opacity: 0, x: i % 2 === 0 ? -40 : 40 },
            {
              opacity: 1, x: 0, duration: 0.7, ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 84%",
                toggleActions: "play none none none",
              },
            }
          );
        });
      }

      // ── CTA scale + fade ──
      if (ctaSectionRef.current) {
        const box = ctaSectionRef.current.querySelector(".about-cta-box");
        if (box) {
          gsap.fromTo(box,
            { opacity: 0, scale: 0.95, y: 28 },
            {
              opacity: 1, scale: 1, y: 0, duration: 0.75, ease: "power3.out",
              scrollTrigger: {
                trigger: box,
                start: "top 84%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      }

      // ── Nav scroll shadow ──
      if (navRef.current) {
        ScrollTrigger.create({
          start: "top -10",
          onUpdate: self => {
            if (navRef.current) {
              navRef.current.style.boxShadow = self.progress > 0
                ? "0 4px 20px rgba(10,110,110,0.09)"
                : "none";
            }
          },
        });
      }
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} style={s.page}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav ref={navRef} style={s.nav}>
        <div style={s.navInner}>
          <div style={s.brand} onClick={() => navigate("/about")} role="button">
            <div style={s.brandBox}>SATI</div>
            <div>
              <div style={s.brandText}>Alumni Portal</div>
              <div style={s.brandSub}>SATI · Vidisha, MP</div>
            </div>
          </div>

          <div style={s.navLinks} className="about-nav-links">
            {isLoggedIn ? (
              <>
                <button onClick={() => navigate("/dashboard")} style={s.navLink}>Dashboard</button>
                <button onClick={() => { localStorage.clear(); navigate("/about"); }} style={s.navDanger}>Sign Out</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("/login")} style={s.navLink}>Login</button>
                <button onClick={() => navigate("/login")} style={s.navPrimary}>Register →</button>
              </>
            )}
          </div>

          <button
            style={s.ham}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="about-ham"
          >
            <span style={{ ...s.hamLine, ...(menuOpen ? { transform: "translateY(7px) rotate(45deg)" } : {}) }} />
            <span style={{ ...s.hamLine, opacity: menuOpen ? 0 : 1 }} />
            <span style={{ ...s.hamLine, ...(menuOpen ? { transform: "translateY(-7px) rotate(-45deg)" } : {}) }} />
          </button>
        </div>

        {menuOpen && (
          <div style={s.drawer}>
            {isLoggedIn ? (
              <>
                <button onClick={() => { navigate("/dashboard"); setMenuOpen(false); }} style={s.drawerPrimary}>Dashboard</button>
                <button onClick={() => { localStorage.clear(); setMenuOpen(false); }} style={s.drawerDanger}>Sign Out</button>
              </>
            ) : (
              <>
                <button onClick={() => { navigate("/login"); setMenuOpen(false); }} style={s.drawerLink}>Login</button>
                <button onClick={() => { navigate("/login"); setMenuOpen(false); }} style={s.drawerPrimary}>Register — it's free</button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section ref={heroRef} style={s.hero}>
        {/* Decorative blobs — animated via GSAP parallax */}
        <div ref={blob1Ref} style={{ ...s.blob, top: -80, left: "5%",  background: "rgba(10,110,110,0.07)", width: 420, height: 420 }} />
        <div ref={blob2Ref} style={{ ...s.blob, top: 40,  right: "3%", background: "rgba(232,130,12,0.06)", width: 320, height: 320 }} />
        {/* Extra subtle blob */}
        <div style={{ ...s.blob, bottom: -40, left: "30%", background: "rgba(5,150,105,0.045)", width: 280, height: 280 }} />

        <div style={s.heroInner}>
          <a
            ref={heroBadgeRef}
            href="https://www.satiengg.in/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...s.heroBadge, opacity: 0 }}
          >
            🎓 Samrat Ashok Technological Institute · Vidisha, MP ↗
          </a>

          <h1 ref={heroTitleRef} style={{ ...s.heroTitle, opacity: 0 }}>
            Connecting SATI<br />
            <span style={s.heroAccent}>Students &amp; Alumni</span>
          </h1>

          <p ref={heroSubRef} style={{ ...s.heroSub, opacity: 0 }}>
            One platform to network, find jobs, discover events, and stay connected
            with the SATI community — wherever life takes you.
          </p>

          <div ref={heroBtnsRef} style={{ ...s.heroBtns, opacity: 0 }}>
            {isLoggedIn ? (
              <button onClick={() => navigate("/dashboard")} style={s.btnPrimary}>
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button onClick={() => navigate("/login")} style={s.btnPrimary}>
                  Get Started — it's free
                </button>
                <button onClick={() => navigate("/login")} style={s.btnOutline}>
                  Sign In
                </button>
              </>
            )}
          </div>

          <div ref={trustBarRef} style={{ ...s.trustBar, opacity: 0 }}>
            <span style={s.trustDot} />
            <span style={s.trustText}>Join {stats.users !== null ? `${stats.users}+` : "…"} members already connected</span>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section ref={statsRef} style={s.statsSection}>
        <div style={s.statsGrid}>
          {[
            { val: stats.users,  label: "Registered Members", icon: "👤" },
            { val: stats.jobs,   label: "Jobs Posted",         icon: "💼" },
            { val: stats.events, label: "Events Hosted",       icon: "📅" },
            { val: "60",         label: "Years of SATI",       icon: "🏛️" },
          ].map((st, i) => (
            <div key={i} className="about-stat-card" style={s.statCard}>
              <div style={s.statIcon}>{st.icon}</div>
              <div
                className="about-stat-num"
                data-target={st.val !== null ? String(st.val) : undefined}
                style={s.statNum}
              >
                {st.val !== null ? `${st.val}+` : "…"}
              </div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section ref={featSectionRef} style={s.section}>
        <div style={s.inner}>
          <div style={s.eyebrow}>What we offer</div>
          <h2 className="about-section-title" style={{ ...s.sectionTitle, opacity: 0 }}>Everything in one place</h2>
          <div style={s.featGrid}>
            {features.map((f, i) => (
              <div
                key={i}
                className="about-feat-card"
                style={{
                  ...s.featCard,
                  opacity: 0,
                  boxShadow: hoveredFeat === i
                    ? "0 12px 36px rgba(10,110,110,0.12)"
                    : "0 2px 10px rgba(13,31,31,0.055)",
                  transform: hoveredFeat === i ? "translateY(-5px)" : "translateY(0)",
                  borderColor: hoveredFeat === i ? C.primaryLight : C.border,
                }}
                onMouseEnter={() => setHoveredFeat(i)}
                onMouseLeave={() => setHoveredFeat(null)}
              >
                <div style={{ ...s.featIconWrap, background: f.color }}>
                  <span style={s.featIconEmoji}>{f.icon}</span>
                </div>
                <h3 style={s.featTitle}>{f.title}</h3>
                <p style={s.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section ref={stepsSectionRef} style={{ ...s.section, background: C.surfaceAlt }}>
        <div style={s.inner}>
          <div style={s.eyebrow}>How it works</div>
          <h2 style={s.sectionTitle}>Up and running in 4 steps</h2>
          <div style={s.stepsGrid}>
            {steps.map((step, i) => (
              <div
                key={i}
                className="about-step-card"
                style={{
                  ...s.stepCard,
                  opacity: 0,
                  transform: hoveredStep === i ? "translateY(-5px)" : "translateY(0)",
                  boxShadow: hoveredStep === i
                    ? "0 12px 36px rgba(10,110,110,0.12)"
                    : "0 2px 10px rgba(13,31,31,0.05)",
                  borderColor: hoveredStep === i ? C.primaryLight : C.border,
                }}
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div style={s.stepNum}>{step.num}</div>
                <h3 style={s.stepTitle}>{step.title}</h3>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUDIENCE ────────────────────────────────────────── */}
      <section ref={audSectionRef} style={s.section}>
        <div style={s.inner}>
          <div style={s.eyebrow}>Who it's for</div>
          <h2 style={s.sectionTitle}>Built for two audiences</h2>
          <div style={s.audienceGrid}>
            <div className="about-aud-card" style={{ ...s.audienceCard, borderTop: `3px solid ${C.primary}`, opacity: 0 }}>
              <div style={{ ...s.roleBadge, background: "rgba(10,110,110,0.09)", color: C.primary }}>
                📚 Students
              </div>
              <h3 style={s.audienceTitle}>Current SATI Students</h3>
              <ul style={s.list}>
                {[
                  "Browse jobs posted by alumni",
                  "Register for campus & alumni events",
                  "Send connection requests to alumni",
                  "Get mentorship and career guidance",
                  "Track your job applications",
                ].map((t, i) => (
                  <li key={i} style={s.listItem}>
                    <span style={{ ...s.check, color: C.primary }}>✓</span>{t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="about-aud-card" style={{ ...s.audienceCard, borderTop: `3px solid ${C.accent}`, opacity: 0 }}>
              <div style={{ ...s.roleBadge, background: "rgba(232,130,12,0.1)", color: C.accentDark }}>
                🎓 Alumni
              </div>
              <h3 style={s.audienceTitle}>SATI Graduates</h3>
              <ul style={s.list}>
                {[
                  "Post job openings at your company",
                  "Create and manage events",
                  "Connect with current students",
                  "Give back to the SATI community",
                  "Manage your professional profile",
                ].map((t, i) => (
                  <li key={i} style={s.listItem}>
                    <span style={{ ...s.check, color: C.accentDark }}>✓</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section ref={ctaSectionRef} style={s.ctaSection}>
        <div className="about-cta-box" style={{ ...s.ctaBox, opacity: 0 }}>
          <div style={{ ...s.blob, top: -60, right: -40, width: 260, height: 260, background: "rgba(255,255,255,0.08)", zIndex: 0 }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🚀</div>
            <h2 style={s.ctaTitle}>
              {isLoggedIn ? "Welcome back! Ready to explore?" : "Ready to join the SATI network?"}
            </h2>
            <p style={s.ctaSub}>
              {isLoggedIn
                ? "Your dashboard and connections are waiting."
                : "Register for free. It takes less than a minute."}
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate(isLoggedIn ? "/dashboard" : "/login")} style={s.ctaBtn}>
                {isLoggedIn ? "Go to Dashboard →" : "Create your account →"}
              </button>
              {!isLoggedIn && (
                <button onClick={() => navigate("/login")} style={s.ctaBtnGhost}>
                  Already have an account
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={s.footer}>
        <div style={s.inner}>
          <div style={s.footerTop}>
            {/* Brand + description */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={s.brandBox}>SATI</div>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.textSecondary, fontFamily: "'Syne', sans-serif" }}>Alumni Portal</span>
              </div>
              <p style={s.footerDesc}>
                Samrat Ashok Technological Institute<br />
                Vidisha, Madhya Pradesh — 464001<br />
                Connecting generations of SATI engineers.
              </p>
              <a href="https://www.satiengg.in/" target="_blank" rel="noopener noreferrer" style={s.collegeLink}>
                🌐 Visit official website →
              </a>
            </div>

            {/* Quick links */}
            <div style={s.footerLinks}>
              <span style={s.footerHead}>Quick links</span>
              {isLoggedIn
                ? <button onClick={() => navigate("/dashboard")} style={s.footerLink}>Dashboard</button>
                : <button onClick={() => navigate("/login")}     style={s.footerLink}>Login / Register</button>
              }
              <button onClick={() => navigate("/jobs")}   style={s.footerLink}>Jobs</button>
              <button onClick={() => navigate("/events")} style={s.footerLink}>Events</button>
              <a href="https://www.satiengg.in/" target="_blank" rel="noopener noreferrer"
                style={{ ...s.footerLink, textDecoration: "none", display: "block" }}>
                College Website ↗
              </a>
            </div>

            {/* Social links */}
            <div style={s.footerLinks}>
              <span style={s.footerHead}>Connect</span>
              {[
                { label: "GitHub",   href: "https://github.com/", icon: "🐙" },
                { label: "LinkedIn", href: "https://linkedin.com/", icon: "💼" },
                { label: "Twitter",  href: "https://twitter.com/", icon: "🐦" },
              ].map(({ label, href, icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ ...s.footerLink, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: C.textMuted }}>
                  <span>{icon}</span>{label}
                </a>
              ))}
            </div>
          </div>

          <div style={s.footerBottom}>
            © {new Date().getFullYear()} SATI Alumni Portal · Built with React &amp; Spring Boot
          </div>
        </div>
      </footer>

      {/* Responsive helper + pulse keyframe */}
      <style>{`
        .about-ham { display: none !important; }
        @media (max-width: 640px) {
          .about-ham { display: flex !important; }
          .about-nav-links { display: none !important; }
        }
        @keyframes aboutPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(5,150,105,0.2); }
          50%       { box-shadow: 0 0 0 6px rgba(5,150,105,0.08); }
        }
        .about-trust-dot {
          animation: aboutPulse 2s ease-in-out infinite;
        }
        .about-feat-card, .about-step-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease !important;
        }
        .about-nav-link-hover:hover {
          color: #0A6E6E !important;
          background: rgba(10,110,110,0.06) !important;
        }
        .about-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(10,110,110,0.35) !important;
        }
        .about-btn-outline:hover {
          border-color: #14A0A0 !important;
          background: rgba(10,110,110,0.04) !important;
        }
        .about-footer-link-hover:hover {
          color: #0A6E6E !important;
        }
      `}</style>
    </div>
  );
}

/* ── Styles ── */
const s = {
  page: {
    background: "#F4F7F6",
    color:      "#0D1F1F",
    fontFamily: "'DM Sans', -apple-system, sans-serif",
    minHeight:  "100vh",
    colorScheme: "light",
    forcedColorAdjust: "none",
  },

  blob: {
    position: "absolute", borderRadius: "50%",
    filter: "blur(60px)", pointerEvents: "none",
  },

  /* ── Nav ── */
  nav: {
    background:     "#F8FBFA",
    backdropFilter: "blur(20px) saturate(160%)",
    borderBottom:   "1px solid #D4E0E0",
    position: "sticky", top: 0, zIndex: 200,
    transition: "box-shadow 0.3s ease",
  },
  navInner: {
    maxWidth: 1100, margin: "0 auto", padding: "0 24px",
    height: 68, display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  brand: { display: "flex", alignItems: "center", gap: 11, cursor: "pointer" },
  brandBox: {
    width: 38, height: 38,
    background: "linear-gradient(135deg, #0A6E6E, #14A0A0)",
    borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 12, color: "#fff", flexShrink: 0,
    boxShadow: "0 2px 10px rgba(10,110,110,0.28)",
    fontFamily: "'Syne', sans-serif",
  },
  brandText: { fontSize: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: "#0D1F1F", lineHeight: 1.2 },
  brandSub:  { fontSize: 11, color: "#7A9595", lineHeight: 1.3 },
  navLinks: { display: "flex", alignItems: "center", gap: 8 },
  navLink: {
    background: "none", border: "none", color: "#7A9595",
    fontSize: 14, cursor: "pointer", padding: "8px 14px",
    borderRadius: 8, transition: "all 0.2s ease", fontFamily: "'DM Sans', sans-serif",
  },
  navPrimary: {
    background: "linear-gradient(135deg, #0A6E6E, #14A0A0)",
    border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
    cursor: "pointer", padding: "9px 18px", borderRadius: 8,
    boxShadow: "0 3px 10px rgba(10,110,110,0.25)", transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  navDanger: {
    background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)",
    color: "#DC2626", fontSize: 13, cursor: "pointer",
    padding: "8px 16px", borderRadius: 8, transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  ham: {
    display: "flex", flexDirection: "column", gap: 5,
    background: "none", border: "none", cursor: "pointer", padding: 6,
    borderRadius: 8,
  },
  hamLine: {
    display: "block", width: 20, height: 1.5,
    background: "#3D5454", borderRadius: 2, transition: "all 0.3s ease",
    transformOrigin: "center",
  },
  drawer: {
    background: "#FFFFFF", borderTop: "1px solid #E8F0F0",
    padding: "14px 24px 18px", display: "flex", flexDirection: "column", gap: 10,
  },
  drawerLink: {
    background: "none", border: "none", color: "#3D5454",
    fontSize: 15, cursor: "pointer", padding: "10px 0", textAlign: "left",
    fontFamily: "'DM Sans', sans-serif",
  },
  drawerPrimary: {
    background: "linear-gradient(135deg, #0A6E6E, #14A0A0)",
    border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
    cursor: "pointer", padding: "12px 20px", borderRadius: 8,
    textAlign: "center", fontFamily: "'DM Sans', sans-serif",
  },
  drawerDanger: {
    background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)",
    color: "#DC2626", fontSize: 14, cursor: "pointer",
    padding: "10px 0", borderRadius: 8, textAlign: "center",
    fontFamily: "'DM Sans', sans-serif",
  },

  /* ── Hero ── */
  hero: {
    padding: "100px 24px 80px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
    background: "#FFFFFF",
    borderBottom: "1px solid #E8F0F0",
  },
  heroInner: { maxWidth: 680, margin: "0 auto", position: "relative", zIndex: 1 },
  heroBadge: {
    display: "inline-block",
    background: "rgba(10,110,110,0.08)", color: "#0A6E6E",
    border: "1px solid rgba(10,110,110,0.18)",
    padding: "7px 18px", borderRadius: 20, fontSize: 12, fontWeight: 700,
    marginBottom: 28, letterSpacing: "0.3px", textDecoration: "none",
    transition: "all 0.2s ease",
  },
  heroTitle: {
    fontSize: "clamp(32px, 7vw, 56px)", fontWeight: 800, lineHeight: 1.12,
    margin: "0 0 22px", color: "#0D1F1F",
    fontFamily: "'Syne', sans-serif", letterSpacing: "-0.025em",
  },
  heroAccent: {
    background: "linear-gradient(135deg, #0A6E6E 0%, #14A0A0 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSub: {
    fontSize: "clamp(15px, 2.5vw, 17px)", color: "#7A9595",
    lineHeight: 1.8, margin: "0 auto 40px", maxWidth: 520,
  },
  heroBtns: { display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" },
  btnPrimary: {
    background: "linear-gradient(135deg, #0A6E6E, #14A0A0)",
    border: "none", color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", padding: "13px 30px", borderRadius: 12,
    boxShadow: "0 4px 20px rgba(10,110,110,0.28)", transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  btnOutline: {
    background: "#FFFFFF", border: "1.5px solid #D4E0E0",
    color: "#0A6E6E", fontSize: 15, fontWeight: 600,
    cursor: "pointer", padding: "13px 30px", borderRadius: 12,
    transition: "all 0.2s ease", fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 2px 8px rgba(13,31,31,0.06)",
  },
  trustBar: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 28,
  },
  trustDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#059669", display: "inline-block",
    animation: "aboutPulse 2s ease-in-out infinite",
  },
  trustText: { fontSize: 13, color: "#7A9595", fontWeight: 500 },

  /* ── Stats ── */
  statsSection: {
    background: "#FFFFFF",
    borderTop: "1px solid #E8F0F0", borderBottom: "1px solid #E8F0F0",
    padding: "48px 24px",
  },
  statsGrid: {
    maxWidth: 960, margin: "0 auto",
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16,
  },
  statCard: {
    background: "#F4F7F6",
    border: "1px solid #D4E0E0", borderRadius: 16, padding: "24px 20px",
    textAlign: "center", transition: "all 0.25s ease",
  },
  statIcon: { fontSize: 22, marginBottom: 8 },
  statNum: {
    fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 800,
    color: "#0A6E6E", marginBottom: 6,
    fontFamily: "'Syne', sans-serif",
  },
  statLabel: { fontSize: 13, color: "#7A9595", fontWeight: 500 },

  /* ── Sections ── */
  section: { padding: "80px 24px" },
  inner: { maxWidth: 1100, margin: "0 auto" },
  eyebrow: {
    fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
    color: "#0A6E6E", marginBottom: 12, opacity: 0.9,
    display: "flex", alignItems: "center", gap: 8,
  },
  sectionTitle: {
    fontSize: "clamp(22px, 5vw, 34px)", fontWeight: 800, color: "#0D1F1F",
    marginBottom: 48, lineHeight: 1.2,
    fontFamily: "'Syne', sans-serif",
  },

  /* ── Features ── */
  featGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 },
  featCard: {
    background: "#FFFFFF",
    border: "1px solid #D4E0E0", borderRadius: 18, padding: "28px 24px",
    cursor: "default",
  },
  featIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  featIconEmoji: { fontSize: 24 },
  featTitle: {
    fontSize: 15, fontWeight: 700, color: "#0D1F1F", marginBottom: 8,
    fontFamily: "'Syne', sans-serif",
  },
  featDesc: { fontSize: 13.5, color: "#7A9595", lineHeight: 1.7 },

  /* ── Steps ── */
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, position: "relative" },
  stepCard: {
    background: "#FFFFFF", border: "1px solid #D4E0E0",
    borderRadius: 18, padding: "28px 24px",
    position: "relative",
  },
  stepNum: {
    fontSize: 42, fontWeight: 800, color: "rgba(10,110,110,0.14)",
    marginBottom: 16, lineHeight: 1,
    fontFamily: "'Syne', sans-serif",
  },
  stepTitle: { fontSize: 15, fontWeight: 700, color: "#0D1F1F", marginBottom: 8, fontFamily: "'Syne', sans-serif" },
  stepDesc:  { fontSize: 13.5, color: "#7A9595", lineHeight: 1.7 },

  /* ── Audience ── */
  audienceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 24 },
  audienceCard: {
    background: "#FFFFFF", borderRadius: 18, padding: "30px 26px",
    transition: "all 0.2s ease",
    border: "1px solid #D4E0E0",
    boxShadow: "0 2px 10px rgba(13,31,31,0.055)",
  },
  roleBadge: {
    display: "inline-block", padding: "5px 14px",
    borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 16,
  },
  audienceTitle: {
    fontSize: 18, fontWeight: 700, color: "#0D1F1F", marginBottom: 18,
    fontFamily: "'Syne', sans-serif",
  },
  list: { listStyle: "none", padding: 0, margin: 0 },
  listItem: {
    fontSize: 13.5, color: "#3D5454",
    padding: "10px 0", borderBottom: "1px solid #E8F0F0",
    display: "flex", alignItems: "center", gap: 12,
  },
  check: { fontWeight: 700, fontSize: 14, flexShrink: 0 },

  /* ── CTA ── */
  ctaSection: { padding: "0 24px 72px" },
  ctaBox: {
    maxWidth: 1100, margin: "0 auto",
    background: "linear-gradient(135deg, #0A6E6E 0%, #0D8B8B 50%, #14A0A0 100%)",
    borderRadius: 24, padding: "64px 40px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(10,110,110,0.25)",
    position: "relative", overflow: "hidden",
  },
  ctaTitle: {
    fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 800, color: "#FFFFFF",
    marginBottom: 12, fontFamily: "'Syne', sans-serif",
  },
  ctaSub: { fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 36 },
  ctaBtn: {
    background: "#FFFFFF", border: "none",
    color: "#0A6E6E", fontSize: 15, fontWeight: 700,
    cursor: "pointer", padding: "13px 30px", borderRadius: 12,
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)", transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  ctaBtnGhost: {
    background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)",
    color: "#FFFFFF", fontSize: 15, fontWeight: 600,
    cursor: "pointer", padding: "13px 30px", borderRadius: 12,
    transition: "all 0.2s ease", fontFamily: "'DM Sans', sans-serif",
  },

  /* ── Footer ── */
  footer: {
    background: "#FFFFFF",
    borderTop: "1px solid #E8F0F0", padding: "52px 24px 28px",
  },
  footerTop: {
    display: "flex", gap: 48, flexWrap: "wrap",
    marginBottom: 40, justifyContent: "space-between",
  },
  footerDesc: { fontSize: 13, color: "#7A9595", lineHeight: 1.85, marginTop: 12, maxWidth: 280 },
  footerLinks: { display: "flex", flexDirection: "column", gap: 6 },
  footerHead: {
    fontSize: 10, fontWeight: 700, letterSpacing: "1px",
    textTransform: "uppercase", color: "#0A6E6E", marginBottom: 10,
  },
  footerLink: {
    background: "none", border: "none", color: "#7A9595",
    fontSize: 13, cursor: "pointer", textAlign: "left", padding: "3px 0",
    transition: "color 0.2s ease", fontFamily: "'DM Sans', sans-serif",
  },
  footerBottom: {
    borderTop: "1px solid #E8F0F0", paddingTop: 22,
    fontSize: 12, color: "#7A9595",
  },
  collegeLink: {
    display: "inline-block", marginTop: 14, fontSize: 13, color: "#0A6E6E",
    textDecoration: "none", borderBottom: "1px solid rgba(10,110,110,0.25)",
    paddingBottom: 2, transition: "all 0.2s ease",
  },
};