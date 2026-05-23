import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";
const C = {
  pageBg:        "#FAFAFA",
  navBg:         "#FAFAFF",
  surface:       "#FFFFFF",
  surfaceAlt:    "#F5F5FF",
  primary:       "#4F46E5",
  primaryLight:  "#6366F1",
  accent:        "#E8820C",
  accentDark:    "#C26B06",
  success:       "#059669",
  danger:        "#DC2626",
  textPrimary:   "#0F0E2E",
  textSecondary: "#4B4B72",
  textMuted:     "#8B8BAE",
  border:        "rgba(79,70,229,0.14)",
  borderLight:   "rgba(79,70,229,0.08)",
};

const features = [
  { icon: "network",   title: "Professional Network",   desc: "Connect with accomplished SATI alumni across industries and geographies.", color: "rgba(79,70,229,0.07)",   iconColor: "#4F46E5" },
  { icon: "briefcase", title: "Career Opportunities",   desc: "Access exclusive job postings shared by our distinguished alumni network.", color: "rgba(232,130,12,0.07)", iconColor: "#D97706" },
  { icon: "calendar",  title: "Industry Events",        desc: "Discover networking events, webinars, and professional development opportunities.", color: "rgba(5,150,105,0.07)",  iconColor: "#059669" },
  { icon: "profile",   title: "Professional Profiles",  desc: "Showcase your academic background, career achievements, and professional expertise.", color: "rgba(79,70,229,0.07)",   iconColor: "#4F46E5" },
  { icon: "handshake", title: "Strategic Connections",  desc: "Build meaningful professional relationships within the SATI community.", color: "rgba(232,130,12,0.07)", iconColor: "#D97706" },
  { icon: "building",  title: "SATI Community",         desc: "An exclusive professional platform dedicated to SATI's academic excellence.", color: "rgba(5,150,105,0.07)",  iconColor: "#059669" },
];

const steps = [
  { num: "01", title: "Create Account",   desc: "Register with your institutional email and select your current status." },
  { num: "02", title: "Complete Profile", desc: "Build your professional profile with academic and career details." },
  { num: "03", title: "Expand Network",   desc: "Connect with fellow alumni and industry professionals." },
  { num: "04", title: "Engage & Grow",    desc: "Access opportunities, events, and continue your professional journey." },
];

function PremiumIcon({ name, size = 22, strokeWidth = 1.9 }) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth,
    strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
  };
  const icons = {
    network: (
      <svg {...common}>
        <circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="7" r="2.5" /><circle cx="12" cy="17" r="2.5" />
        <path d="M8.2 8.4 10.7 15" /><path d="M15.8 8.4 13.3 15" /><path d="M8.5 7h7" />
      </svg>
    ),
    briefcase: (
      <svg {...common}>
        <rect x="3" y="7" width="18" height="13" rx="2.5" />
        <path d="M9 7V5.2A2.2 2.2 0 0 1 11.2 3h1.6A2.2 2.2 0 0 1 15 5.2V7" />
        <path d="M3 12h18" /><path d="M12 11v2" />
      </svg>
    ),
    calendar: (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2.5" />
        <path d="M8 3v4" /><path d="M16 3v4" /><path d="M4 10h16" />
        <path d="M8 14h2" /><path d="M14 14h2" />
      </svg>
    ),
    profile: (
      <svg {...common}>
        <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
        <rect x="9" y="3" width="6" height="4" rx="1.4" />
        <path d="M8 14h8" /><path d="M8 17h5" />
      </svg>
    ),
    handshake: (
      <svg {...common}>
        <path d="m8.5 12.5 2.2-2.2a2 2 0 0 1 2.8 0l2 2" />
        <path d="m14.5 13.5 1.2 1.2a2 2 0 0 0 2.8 0l1.2-1.2" />
        <path d="m4.3 13.5 1.2 1.2a2 2 0 0 0 2.8 0l2.4-2.4" />
        <path d="M3 9.5 7 6l3 2" /><path d="M21 9.5 17 6l-3 2" />
      </svg>
    ),
    building: (
      <svg {...common}>
        <path d="M4 20h16" /><path d="M6 20V6.5L12 3l6 3.5V20" />
        <path d="M9 9h1" /><path d="M14 9h1" /><path d="M9 13h1" /><path d="M14 13h1" />
        <path d="M10 20v-3.5h4V20" />
      </svg>
    ),
    members: (
      <svg {...common}>
        <path d="M16 19v-1.5a4 4 0 0 0-8 0V19" /><circle cx="12" cy="9" r="3" />
        <path d="M4.5 18v-1a3 3 0 0 1 3-3" /><path d="M19.5 18v-1a3 3 0 0 0-3-3" />
      </svg>
    ),
    landmark: (
      <svg {...common}>
        <path d="M4 10h16" /><path d="M5 10 12 4l7 6" /><path d="M6 20h12" />
        <path d="M8 10v10" /><path d="M12 10v10" /><path d="M16 10v10" />
      </svg>
    ),
    check: (
      <svg {...common} width={size} height={size}><path d="M20 6 9 17l-5-5" /></svg>
    ),
    github: (
      <svg {...common}>
        <path d="M12 2.8a9.2 9.2 0 0 0-2.9 17.9c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.7-1.4-2.2-.2-4.5-1.1-4.5-4.8 0-1.1.4-1.9 1-2.6-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.5 9.5 0 0 1 4.9 0c1.8-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.6 1 2.6 0 3.7-2.3 4.6-4.5 4.8.4.3.7.9.7 1.8v2.8c0 .3.2.6.7.5A9.2 9.2 0 0 0 12 2.8Z" />
      </svg>
    ),
    linkedin: (
      <svg {...common}>
        <path d="M6.5 9.5V19" /><path d="M10.5 19v-5.2a4.3 4.3 0 0 1 8.5 0V19" />
        <path d="M14.8 13.8V19" /><circle cx="6.5" cy="5.5" r="1.7" />
      </svg>
    ),
    x: (
      <svg {...common}><path d="m4 4 16 16" /><path d="M20 4 4 20" /></svg>
    ),
    spark: (
      <svg {...common}>
        <path d="M12 3 9.8 9.8 3 12l6.8 2.2L12 21l2.2-6.8L21 12l-6.8-2.2L12 3Z" />
        <path d="M19 3v4" /><path d="M21 5h-4" />
      </svg>
    ),
    premium: (
      <svg {...common}>
        <path d="M6 5h12a2 2 0 0 1 2 2v11.5a2 2 0 0 1-2.9 1.8L12 17.2l-5.1 3.1A2 2 0 0 1 4 18.5V7a2 2 0 0 1 2-2Z" />
        <path d="M12 7.5v5" /><path d="M9.5 11.5h5" /><path d="M12 15.5l1.2 1.8" />
      </svg>
    ),
  };
  return icons[name] || icons.spark;
}

// Purely presentational card — no state so it's stable in the duplicated marquee
function FeatCard({ f }) {
  const ref = useRef(null);
  return (
    <div
      ref={ref}
      className="about-feat-card"
      style={{
        ...s.featCard,
        flexShrink: 0,
        width: 280,
      }}
      onMouseEnter={() => {
        if (ref.current) {
          ref.current.style.transform = "translateY(-6px)";
          ref.current.style.boxShadow = "0 12px 36px rgba(79,70,229,0.13)";
          ref.current.style.borderColor = C.primaryLight;
        }
      }}
      onMouseLeave={() => {
        if (ref.current) {
          ref.current.style.transform = "translateY(0)";
          ref.current.style.boxShadow = "0 2px 10px rgba(15,14,46,0.055)";
          ref.current.style.borderColor = C.border;
        }
      }}
    >
      <div style={{ ...s.featIconWrap, background: f.color, color: f.iconColor }}>
        <PremiumIcon name={f.icon} size={25} />
      </div>
      <h3 style={s.featTitle}>{f.title}</h3>
      <p style={s.featDesc}>{f.desc}</p>
    </div>
  );
}

export default function About() {
  const navigate = useNavigate();
  const [stats, setStats]       = useState({ users: null, jobs: null, events: null });
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredStep, setHoveredStep] = useState(null);
  const isLoggedIn = !!localStorage.getItem("id");

  const pageRef         = useRef(null);
  const heroRef         = useRef(null);
  const heroBadgeRef    = useRef(null);
  const heroTitleRef    = useRef(null);
  const heroSubRef      = useRef(null);
  const heroBtnsRef     = useRef(null);
  const trustBarRef     = useRef(null);
  const blob1Ref        = useRef(null);
  const blob2Ref        = useRef(null);
  const statsRef        = useRef(null);
  const featSectionRef  = useRef(null);
  const featTrackRef    = useRef(null);
  const stepsSectionRef = useRef(null);
  const audSectionRef   = useRef(null);
  const ctaSectionRef   = useRef(null);
  const navRef          = useRef(null);
  const marqueeRef      = useRef(null);

  // ── fetch stats ──────────────────────────────────────────────────────────
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

  // ── Animate stat counters once API data arrives ───────────────────────────
  useEffect(() => {
    if (!statsRef.current) return;
    if (stats.users === null || stats.jobs === null || stats.events === null) return;

    statsRef.current.querySelectorAll(".about-stat-num").forEach(el => {
      const target = parseInt(el.getAttribute("data-target"), 10);
      if (isNaN(target)) return;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: () => { el.textContent = `${Math.floor(obj.val)}+`; },
      });
    });
  }, [stats]);

  // ── GSAP animations ───────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── hero ──
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .fromTo(heroBadgeRef.current,  { opacity: 0, y: -18, scale: 0.94 }, { opacity: 1, y: 0,   scale: 1,   duration: 0.6, delay: 0.1 })
        .fromTo(heroTitleRef.current,  { opacity: 0, y: 36,  skewY: 1.5  }, { opacity: 1, y: 0,   skewY: 0,   duration: 0.75 }, "-=0.3")
        .fromTo(heroSubRef.current,    { opacity: 0, y: 22               }, { opacity: 1, y: 0,               duration: 0.6  }, "-=0.4")
        .fromTo(heroBtnsRef.current,   { opacity: 0, y: 18               }, { opacity: 1, y: 0,               duration: 0.55 }, "-=0.35")
        .fromTo(trustBarRef.current,   { opacity: 0, y: 12               }, { opacity: 1, y: 0,               duration: 0.45 }, "-=0.3");

      // ── parallax blobs ──
      if (blob1Ref.current) {
        gsap.to(blob1Ref.current, { y: -80, ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.4 } });
      }
      if (blob2Ref.current) {
        gsap.to(blob2Ref.current, { y: -50, x: 30, ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.8 } });
      }

      // ── stats card fade-in (counter runs separately via stats useEffect) ──
      if (statsRef.current) {
        const statCards = statsRef.current.querySelectorAll(".about-stat-card");
        gsap.fromTo(statCards,
          { opacity: 0, y: 32, scale: 0.96 },
          { opacity: 1, y: 0,  scale: 1, stagger: 0.09, duration: 0.6, ease: "power2.out",
            scrollTrigger: { trigger: statsRef.current, start: "top 82%", toggleActions: "play none none none" } }
        );
      }

      // ── features: mount fade-in + infinite horizontal marquee ──
      if (featSectionRef.current && featTrackRef.current) {
        const cards = featSectionRef.current.querySelectorAll(".about-feat-card");
        const track = featTrackRef.current;

        gsap.fromTo(cards,
          { opacity: 0, y: 38, scale: 0.97 },
          {
            opacity: 1, y: 0, scale: 1,
            stagger: 0.06, duration: 0.65, ease: "power3.out",
            scrollTrigger: {
              trigger: featSectionRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );

        const title = featSectionRef.current.querySelector(".about-section-title");
        if (title) {
          gsap.fromTo(title,
            { opacity: 0, x: -28 },
            { opacity: 1, x: 0, duration: 0.65, ease: "power3.out",
              scrollTrigger: { trigger: title, start: "top 85%", toggleActions: "play none none none" } }
          );
        }

        requestAnimationFrame(() => {
          const halfW = track.scrollWidth / 2;
          const tween = gsap.to(track, {
            x: `-=${halfW}`,
            duration: 28,
            ease: "none",
            repeat: -1,
            modifiers: {
              x: gsap.utils.unitize(x => parseFloat(x) % halfW),
            },
          });
          marqueeRef.current = tween;
        });
      }

      // ── steps ──
      if (stepsSectionRef.current) {
        gsap.fromTo(stepsSectionRef.current.querySelectorAll(".about-step-card"),
          { opacity: 0, y: 36, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.65, ease: "back.out(1.2)",
            scrollTrigger: { trigger: stepsSectionRef.current, start: "top 80%", toggleActions: "play none none none" } }
        );
      }

      // ── audience ──
      if (audSectionRef.current) {
        audSectionRef.current.querySelectorAll(".about-aud-card").forEach((card, i) => {
          gsap.fromTo(card,
            { opacity: 0, x: i % 2 === 0 ? -40 : 40 },
            { opacity: 1, x: 0, duration: 0.7, ease: "power3.out",
              scrollTrigger: { trigger: card, start: "top 84%", toggleActions: "play none none none" } }
          );
        });
      }

      // ── CTA ──
      if (ctaSectionRef.current) {
        const box = ctaSectionRef.current.querySelector(".about-cta-box");
        if (box) {
          gsap.fromTo(box,
            { opacity: 0, scale: 0.95, y: 28 },
            { opacity: 1, scale: 1, y: 0, duration: 0.75, ease: "power3.out",
              scrollTrigger: { trigger: box, start: "top 84%", toggleActions: "play none none none" } }
          );
        }
      }

      // ── nav shadow on scroll ──
      if (navRef.current) {
        ScrollTrigger.create({
          start: "top -10",
          onUpdate: self => {
            if (navRef.current) {
              navRef.current.style.boxShadow = self.progress > 0
                ? "0 4px 20px rgba(79,70,229,0.09)" : "none";
            }
          },
        });
      }
    }, pageRef);

    return () => {
      ctx.revert();
      if (marqueeRef.current) marqueeRef.current.kill();
    };
  }, []);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div ref={pageRef} style={s.page}>

      {/* ── NAV ── */}
      <nav ref={navRef} style={s.nav}>
        <div style={s.navInner}>
          <div style={s.brand} onClick={() => navigate("/about")} role="button">
            <div style={s.brandBox}>SATI</div>
            <div>
              <div style={s.brandText}>Alumni Portal</div>
              <div style={s.brandSub}>SATI - Vidisha, MP</div>
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
                <button onClick={() => navigate("/login")} style={s.navPrimary}>Register</button>
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
                <button onClick={() => { navigate("/login"); setMenuOpen(false); }} style={s.drawerPrimary}>Register - it is free</button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="about-hero" style={s.hero}>
        <div ref={blob1Ref} className="about-blob" style={{ ...s.blob, top: -80, left: "5%",  background: "rgba(79,70,229,0.07)",  width: 420, height: 420 }} />
        <div ref={blob2Ref} className="about-blob" style={{ ...s.blob, top:  40, right: "3%", background: "rgba(232,130,12,0.06)", width: 320, height: 320 }} />
        <div className="about-blob" style={{ ...s.blob, bottom: -40, left: "30%", background: "rgba(5,150,105,0.045)", width: 280, height: 280 }} />

        <div style={s.heroInner}>
          <a ref={heroBadgeRef} href="https://www.satiengg.in/" target="_blank" rel="noopener noreferrer"
            className="about-hero-badge" style={{ ...s.heroBadge, opacity: 0 }}>
            SATI - Vidisha, MP
          </a>

          <h1 ref={heroTitleRef} style={{ ...s.heroTitle, opacity: 0 }}>
            Connecting SATI<br />
            <span style={s.heroAccent}>Students &amp; Alumni</span>
          </h1>

          <p ref={heroSubRef} style={{ ...s.heroSub, opacity: 0 }}>
            One platform to network, find jobs, discover events, and stay connected with the SATI community - wherever life takes you.
          </p>

          <div ref={heroBtnsRef} style={{ ...s.heroBtns, opacity: 0 }}>
            {isLoggedIn ? (
              <button onClick={() => navigate("/dashboard")} style={s.btnPrimary} className="about-btn-primary">
                Go to Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => navigate("/login")} style={s.btnPrimary} className="about-btn-primary">
                  Get Started - it is free
                </button>
                <button onClick={() => navigate("/login")} style={s.btnOutline} className="about-btn-outline">
                  Sign In
                </button>
              </>
            )}
          </div>

          <div ref={trustBarRef} style={{ ...s.trustBar, opacity: 0 }}>
            <span style={s.trustDot} />
            <span style={s.trustText}>Join {stats.users !== null ? `${stats.users}+` : "..."} members already connected</span>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={s.statsSection}>
        <div style={s.statsGrid}>
          {[
            { val: stats.users,  label: "Registered Members", icon: "members"   },
            { val: stats.jobs,   label: "Jobs Posted",         icon: "briefcase" },
            { val: stats.events, label: "Events Hosted",       icon: "calendar"  },
            { val: "60",         label: "Years of SATI",       icon: "landmark"  },
          ].map((st, i) => (
            <div key={i} className="about-stat-card" style={s.statCard}>
              <div style={s.statIcon}><PremiumIcon name={st.icon} size={23} /></div>
              <div
                className="about-stat-num"
                data-target={st.val !== null ? String(st.val) : undefined}
                style={s.statNum}
              >
                {st.val !== null ? `${st.val}+` : "..."}
              </div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES — infinite horizontal marquee ── */}
      <section ref={featSectionRef} className="about-section" style={s.section}>
        <div style={s.inner}>
          <div style={s.eyebrow}>What we offer</div>
          <h2 className="about-section-title" style={{ ...s.sectionTitle, opacity: 0 }}>
            Everything in one place
          </h2>
        </div>

        <div
          style={s.marqueeOuter}
          onMouseEnter={() => marqueeRef.current && marqueeRef.current.pause()}
          onMouseLeave={() => marqueeRef.current && marqueeRef.current.play()}
        >
          <div style={{ ...s.marqueeEdge, left: 0,  background: "linear-gradient(to right,  #FAFAFA 0%, transparent 100%)" }} />
          <div style={{ ...s.marqueeEdge, right: 0, background: "linear-gradient(to left,   #FAFAFA 0%, transparent 100%)" }} />

          <div ref={featTrackRef} style={s.marqueeTrack}>
            {[...features, ...features].map((f, i) => (
              <FeatCard key={i} f={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section ref={stepsSectionRef} className="about-section" style={{ ...s.section, background: C.surfaceAlt }}>
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
                    ? "0 12px 36px rgba(79,70,229,0.12)"
                    : "0 2px 10px rgba(15,14,46,0.05)",
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

      {/* ── WHO IT'S FOR ── */}
      <section ref={audSectionRef} className="about-section" style={s.section}>
        <div style={s.inner}>
          <div style={s.eyebrow}>Who it's for</div>
          <h2 style={s.sectionTitle}>Built for two audiences</h2>
          <div style={s.audienceGrid}>
            <div className="about-aud-card" style={{ ...s.audienceCard, borderTop: `3px solid ${C.primary}`, opacity: 0 }}>
              <div style={{ ...s.roleBadge, background: "rgba(79,70,229,0.09)", color: C.primary }}>Students</div>
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
                    <span style={{ ...s.check, color: C.primary }}><PremiumIcon name="check" size={14} strokeWidth={2.4} /></span>{t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="about-aud-card" style={{ ...s.audienceCard, borderTop: `3px solid ${C.accent}`, opacity: 0 }}>
              <div style={{ ...s.roleBadge, background: "rgba(232,130,12,0.1)", color: C.accentDark }}>Alumni</div>
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
                    <span style={{ ...s.check, color: C.accentDark }}><PremiumIcon name="check" size={14} strokeWidth={2.4} /></span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaSectionRef} style={s.ctaSection}>
        <div className="about-cta-box" style={{ ...s.ctaBox, opacity: 0 }}>
          <div style={{ ...s.blob, top: -60, right: -40, width: 260, height: 260, background: "rgba(255,255,255,0.08)", zIndex: 0 }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={s.ctaIcon}><PremiumIcon name="premium" size={30} /></div>
            <h2 style={s.ctaTitle}>
              {isLoggedIn ? "Welcome back! Ready to explore?" : "Ready to join the SATI network?"}
            </h2>
            <p style={s.ctaSub}>
              {isLoggedIn
                ? "Your dashboard and connections are waiting."
                : "Register for free. It takes less than a minute."}
            </p>
            <div className="about-cta-btns" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate(isLoggedIn ? "/dashboard" : "/login")} style={s.ctaBtn}>
                {isLoggedIn ? "Go to Dashboard" : "Create your account"}
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

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={s.inner}>
          <div className="about-footer-top" style={s.footerTop}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={s.brandBox}>SATI</div>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.textSecondary, fontFamily: "'Fraunces', Georgia, serif" }}>Alumni Portal</span>
              </div>
              <p style={s.footerDesc}>Samrat Ashok Technological Institute<br />Vidisha, Madhya Pradesh - 464001<br />Connecting generations of SATI engineers.</p>
              <a href="https://www.satiengg.in/" target="_blank" rel="noopener noreferrer" style={s.collegeLink}>Visit official website</a>
            </div>

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
                College Website
              </a>
            </div>

            <div style={s.footerLinks}>
              <span style={s.footerHead}>Connect</span>
              {[
                { label: "GitHub",   href: "https://github.com/",   icon: "github"   },
                { label: "LinkedIn", href: "https://linkedin.com/", icon: "linkedin" },
                { label: "Twitter",  href: "https://twitter.com/",  icon: "x"        },
              ].map(({ label, href, icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ ...s.footerLink, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: C.textMuted }}>
                  <span style={s.socialIcon}><PremiumIcon name={icon} size={15} /></span>{label}
                </a>
              ))}
            </div>
          </div>

          <div style={s.footerBottom}>Copyright {new Date().getFullYear()} SATI Alumni Portal - Built with React &amp; Spring Boot</div>
        </div>
      </footer>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        .about-ham { display: none !important; }
        @media (max-width: 640px) {
          .about-ham { display: flex !important; }
          .about-nav-links { display: none !important; }
        }

        .about-blob { display: none; }

        .about-hero { padding: 72px 24px 64px; }
        @media (max-width: 640px) {
          .about-hero { padding: 52px 20px 48px !important; }
          .about-hero-badge { font-size: 11px !important; padding: 6px 14px !important; }
        }

        .about-section { padding: 80px 24px; }
        @media (max-width: 640px) {
          .about-section { padding: 48px 16px !important; }
        }

        @media (max-width: 640px) {
          .about-cta-box { padding: 40px 20px !important; border-radius: 18px !important; }
          .about-cta-btns { flex-direction: column !important; align-items: stretch !important; }
          .about-cta-btns button { width: 100% !important; text-align: center !important; }
        }

        @media (max-width: 640px) {
          .about-footer-top { flex-direction: column !important; gap: 28px !important; }
        }

        @media (max-width: 480px) {
          .about-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        /* Feature cards */
        .about-feat-card {
          background: #FFFFFF;
          border: 1px solid rgba(79,70,229,0.14);
          border-radius: 18px;
          padding: 28px 22px;
          cursor: default;
          box-shadow: 0 2px 10px rgba(15,14,46,0.055);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          user-select: none;
        }

        .about-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(79,70,229,0.35) !important;
        }
        .about-btn-outline:hover {
          border-color: #6366F1 !important;
          background: rgba(79,70,229,0.06) !important;
        }

        .about-step-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease !important;
        }

        @keyframes aboutPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(5,150,105,0.2); }
          50%       { box-shadow: 0 0 0 6px rgba(5,150,105,0.08); }
        }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    background: "#FAFAFA",
    color: "#0F0E2E",
    fontFamily: "'DM Sans', -apple-system, sans-serif",
    minHeight: "100vh",
    colorScheme: "light",
    forcedColorAdjust: "none",
  },

  blob: {
    position: "absolute", borderRadius: "50%",
    filter: "blur(60px)", pointerEvents: "none",
  },

  // ── Nav ──
  nav: {
    background: "#FAFAFF",
    backdropFilter: "blur(20px) saturate(160%)",
    borderBottom: "1px solid rgba(79,70,229,0.14)",
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
    background: "linear-gradient(135deg, #4F46E5, #6366F1)",
    borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 12, color: "#fff", flexShrink: 0,
    boxShadow: "0 2px 10px rgba(79,70,229,0.28)",
    fontFamily: "'Fraunces', Georgia, serif",
  },
  brandText: { fontSize: 14, fontWeight: 700, fontFamily: "'Fraunces', Georgia, serif", color: "#0F0E2E", lineHeight: 1.2 },
  brandSub:  { fontSize: 11, color: "#8B8BAE", lineHeight: 1.3 },
  navLinks: { display: "flex", alignItems: "center", gap: 8 },
  navLink: {
    background: "none", border: "none", color: "#8B8BAE",
    fontSize: 14, cursor: "pointer", padding: "8px 14px",
    borderRadius: 8, transition: "all 0.2s ease", fontFamily: "'DM Sans', sans-serif",
  },
  navPrimary: {
    background: "linear-gradient(135deg, #4F46E5, #6366F1)",
    border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
    cursor: "pointer", padding: "9px 18px", borderRadius: 8,
    boxShadow: "0 3px 10px rgba(79,70,229,0.25)", transition: "all 0.2s ease",
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
    background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8,
  },
  hamLine: {
    display: "block", width: 20, height: 1.5,
    background: "#4B4B72", borderRadius: 2, transition: "all 0.3s ease",
    transformOrigin: "center",
  },
  drawer: {
    background: "#FFFFFF", borderTop: "1px solid rgba(79,70,229,0.08)",
    padding: "14px 24px 18px", display: "flex", flexDirection: "column", gap: 10,
  },
  drawerLink: {
    background: "none", border: "none", color: "#4B4B72",
    fontSize: 15, cursor: "pointer", padding: "10px 0", textAlign: "left",
    fontFamily: "'DM Sans', sans-serif",
  },
  drawerPrimary: {
    background: "linear-gradient(135deg, #4F46E5, #6366F1)",
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

  // ── Hero ──
  hero: {
    textAlign: "center", position: "relative", overflow: "hidden",
    background: "#FFFFFF", borderBottom: "1px solid rgba(79,70,229,0.08)",
  },
  heroInner: { maxWidth: 680, margin: "0 auto", position: "relative", zIndex: 1 },
  heroBadge: {
    display: "inline-block",
    background: "rgba(79,70,229,0.08)", color: "#4F46E5",
    border: "1px solid rgba(79,70,229,0.18)",
    padding: "7px 18px", borderRadius: 20, fontSize: 12, fontWeight: 700,
    marginBottom: 28, letterSpacing: "0.3px", textDecoration: "none",
    transition: "all 0.2s ease",
  },
  heroTitle: {
    fontSize: "clamp(28px, 7vw, 56px)", fontWeight: 800, lineHeight: 1.12,
    margin: "0 0 22px", color: "#0F0E2E",
    fontFamily: "'Fraunces', Georgia, serif", letterSpacing: "-0.025em",
  },
  heroAccent: {
    background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  heroSub: {
    fontSize: "clamp(14px, 2.5vw, 17px)", color: "#8B8BAE",
    lineHeight: 1.8, margin: "0 auto 40px", maxWidth: 520,
  },
  heroBtns: { display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" },
  btnPrimary: {
    background: "linear-gradient(135deg, #4F46E5, #6366F1)",
    border: "none", color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", padding: "13px 28px", borderRadius: 12,
    boxShadow: "0 4px 20px rgba(79,70,229,0.28)", transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  btnOutline: {
    background: "#FFFFFF", border: "1.5px solid rgba(79,70,229,0.14)",
    color: "#4F46E5", fontSize: 15, fontWeight: 600,
    cursor: "pointer", padding: "13px 28px", borderRadius: 12,
    transition: "all 0.2s ease", fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 2px 8px rgba(15,14,46,0.06)",
  },
  trustBar: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 28 },
  trustDot: {
    width: 8, height: 8, borderRadius: "50%", background: "#059669",
    display: "inline-block", animation: "aboutPulse 2s ease-in-out infinite",
  },
  trustText: { fontSize: 13, color: "#8B8BAE", fontWeight: 500 },

  // ── Stats ──
  statsSection: {
    background: "#FFFFFF",
    borderTop: "1px solid rgba(79,70,229,0.08)", borderBottom: "1px solid rgba(79,70,229,0.08)",
    padding: "48px 24px",
  },
  statsGrid: {
    maxWidth: 960, margin: "0 auto",
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16,
  },
  statCard: {
    background: "#FAFAFA", border: "1px solid rgba(79,70,229,0.14)",
    borderRadius: 16, padding: "24px 16px",
    textAlign: "center", transition: "all 0.25s ease",
  },
  statIcon: {
    width: 44, height: 44, margin: "0 auto 10px", borderRadius: 12,
    background: "rgba(79,70,229,0.08)", color: "#4F46E5",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  statNum: {
    fontSize: "clamp(24px, 5vw, 38px)", fontWeight: 800, color: "#4F46E5", marginBottom: 6,
    fontFamily: "'Fraunces', Georgia, serif",
  },
  statLabel: { fontSize: 12, color: "#8B8BAE", fontWeight: 500 },

  // ── Sections ──
  section: { padding: "80px 24px" },
  inner:   { maxWidth: 1100, margin: "0 auto" },
  eyebrow: {
    fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
    color: "#4F46E5", marginBottom: 12, opacity: 0.9,
    display: "flex", alignItems: "center", gap: 8,
  },
  sectionTitle: {
    fontSize: "clamp(20px, 5vw, 34px)", fontWeight: 800, color: "#0F0E2E",
    marginBottom: 40, lineHeight: 1.2,
    fontFamily: "'Fraunces', Georgia, serif",
  },

  // ── Feature marquee ──
  marqueeOuter: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    padding: "12px 0 20px",
    cursor: "grab",
  },
  marqueeEdge: {
    position: "absolute",
    top: 0, bottom: 0,
    width: 120,
    zIndex: 2,
    pointerEvents: "none",
  },
  marqueeTrack: {
    display: "flex",
    gap: 20,
    width: "max-content",
    willChange: "transform",
    paddingLeft: 24,
  },

  featCard: {
    flexShrink: 0,
    width: 280,
  },
  featIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  featTitle: {
    fontSize: 15, fontWeight: 700, color: "#0F0E2E", marginBottom: 8,
    fontFamily: "'Fraunces', Georgia, serif",
  },
  featDesc: { fontSize: 13.5, color: "#8B8BAE", lineHeight: 1.7 },

  // ── Steps ──
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, position: "relative" },
  stepCard: {
    background: "#FFFFFF", border: "1px solid rgba(79,70,229,0.14)",
    borderRadius: 18, padding: "28px 22px", position: "relative",
  },
  stepNum: {
    // ✅ CHANGED: was rgba(79,70,229,0.14) — now noticeably darker
    fontSize: 42, fontWeight: 800, color: "rgba(79,70,229,0.67)", marginBottom: 16, lineHeight: 1,
    fontFamily: "'Fraunces', Georgia, serif",
  },
  stepTitle: { fontSize: 15, fontWeight: 700, color: "#0F0E2E", marginBottom: 8, fontFamily: "'Fraunces', Georgia, serif" },
  stepDesc:  { fontSize: 13.5, color: "#8B8BAE", lineHeight: 1.7 },

  // ── Audience ──
  audienceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 24 },
  audienceCard: {
    background: "#FFFFFF", borderRadius: 18, padding: "28px 24px",
    transition: "all 0.2s ease",
    border: "1px solid rgba(79,70,229,0.14)",
    boxShadow: "0 2px 10px rgba(15,14,46,0.055)",
  },
  roleBadge: {
    display: "inline-block", padding: "5px 14px",
    borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 16,
  },
  audienceTitle: {
    fontSize: 18, fontWeight: 700, color: "#0F0E2E", marginBottom: 18,
    fontFamily: "'Fraunces', Georgia, serif",
  },
  list: { listStyle: "none", padding: 0, margin: 0 },
  listItem: {
    fontSize: 13.5, color: "#4B4B72",
    padding: "10px 0", borderBottom: "1px solid rgba(79,70,229,0.08)",
    display: "flex", alignItems: "center", gap: 12,
  },
  check: {
    width: 20, height: 20, borderRadius: 999,
    background: "rgba(79,70,229,0.08)",
    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },

  // ── CTA ──
  ctaSection: { padding: "0 24px 72px" },
  ctaIcon: {
    width: 58, height: 58, margin: "0 auto 18px", borderRadius: 16,
    background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.24)",
    color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
  },
  ctaBox: {
    maxWidth: 1100, margin: "0 auto",
    background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 50%, #6366F1 100%)",
    borderRadius: 24, padding: "64px 40px",
    textAlign: "center", boxShadow: "0 20px 60px rgba(79,70,229,0.25)",
    position: "relative", overflow: "hidden",
  },
  ctaTitle: {
    fontSize: "clamp(20px, 5vw, 32px)", fontWeight: 800, color: "#FFFFFF",
    marginBottom: 12, fontFamily: "'Fraunces', Georgia, serif",
  },
  ctaSub: { fontSize: "clamp(14px, 2vw, 16px)", color: "rgba(255,255,255,0.8)", marginBottom: 32 },
  ctaBtn: {
    background: "#FFFFFF", border: "none", color: "#4F46E5",
    fontSize: 15, fontWeight: 700, cursor: "pointer", padding: "13px 28px", borderRadius: 12,
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)", transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  ctaBtnGhost: {
    background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)",
    color: "#FFFFFF", fontSize: 15, fontWeight: 600, cursor: "pointer",
    padding: "13px 28px", borderRadius: 12, transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  },

  // ── Footer ──
  footer: {
    background: "#FFFFFF", borderTop: "1px solid rgba(79,70,229,0.08)", padding: "52px 24px 28px",
  },
  footerTop: {
    display: "flex", gap: 40, flexWrap: "wrap",
    marginBottom: 40, justifyContent: "space-between",
  },
  footerDesc: { fontSize: 13, color: "#8B8BAE", lineHeight: 1.85, marginTop: 12, maxWidth: 280 },
  footerLinks: { display: "flex", flexDirection: "column", gap: 6 },
  footerHead: {
    fontSize: 10, fontWeight: 700, letterSpacing: "1px",
    textTransform: "uppercase", color: "#4F46E5", marginBottom: 10,
  },
  footerLink: {
    background: "none", border: "none", color: "#8B8BAE",
    fontSize: 13, cursor: "pointer", textAlign: "left", padding: "3px 0",
    transition: "color 0.2s ease", fontFamily: "'DM Sans', sans-serif",
  },
  socialIcon: {
    width: 22, height: 22, borderRadius: 7,
    background: "rgba(79,70,229,0.08)", color: "#4F46E5",
    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  footerBottom: {
    borderTop: "1px solid rgba(79,70,229,0.08)", paddingTop: 22,
    fontSize: 12, color: "#8B8BAE",
  },
  collegeLink: {
    display: "inline-block", marginTop: 14, fontSize: 13, color: "#4F46E5",
    textDecoration: "none", borderBottom: "1px solid rgba(79,70,229,0.25)",
    paddingBottom: 2, transition: "all 0.2s ease",
  },
};