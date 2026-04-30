import React, { useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Toaster } from "react-hot-toast";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import JobListings from "./pages/JobListings";
import Events from "./pages/Events";
import MyApplications from "./pages/MyApplications";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import MyProfile from "./pages/MyProfile";

// Shared pages
import { Connected, Requests, MyJobs, MyEvents } from "./pages/Sharedpages_";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatBox from "./components/ChatBox";

gsap.registerPlugin(ScrollTrigger);

// ─── Lenis ─────────────────────────────────────────────
let lenisInstance = null;

function createLenis() {
  if (lenisInstance) return lenisInstance;

  const lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    // ✅ Tell Lenis to ignore elements with data-lenis-prevent attribute
    prevent: (node) => node.hasAttribute("data-lenis-prevent"),
  });

  const handler = (time) => lenis.raf(time * 1000);
  lenis._rafHandler = handler;
  gsap.ticker.add(handler);
  lenis.on("scroll", ScrollTrigger.update);

  lenisInstance = lenis;
  return lenis;
}

// ─── Background ────────────────────────────────────────
function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 18 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#3D7A6F";
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas className="particle-canvas" ref={canvasRef} />;
}

// ─── Scroll bar ────────────────────────────────────────
function ScrollProgressBar() {
  const barRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      if (!lenisInstance || !barRef.current) return;
      barRef.current.style.transform = `scaleX(${lenisInstance.progress || 0})`;
    }, 16);
    return () => clearInterval(id);
  }, []);

  return <div ref={barRef} className="scroll-progress-bar" />;
}

// ─── Animated Page ─────────────────────────────────────
function AnimatedPage({ children }) {
  const ref = useRef(null);
  const loc = useLocation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    window.scrollTo(0, 0);
    ScrollTrigger.refresh();

    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
      );
    }, ref);

    return () => ctx.revert();
  }, [loc.pathname]);

  return <div ref={ref}>{children}</div>;
}

// ─── Layout ────────────────────────────────────────────
function Layout() {
  const location = useLocation();
  const hideNav = ["/login", "/register", "/about"].includes(location.pathname);

  useEffect(() => {
    createLenis();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <ParticleBackground />
      <ScrollProgressBar />
      <Toaster position="top-right" />

      {!hideNav && <Navbar />}

      <div style={{ flex: 1 }}>
        <AnimatedPage>
          <Routes>
            <Route path="/" element={<Navigate to="/about" replace />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/jobs" element={<ProtectedRoute><JobListings /></ProtectedRoute>} />
            <Route path="/my-applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
            <Route path="/chat" element={<Navigate to="/jobs" replace />} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />

            <Route path="/recruiter" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
            <Route path="/connected" element={<ProtectedRoute><Connected /></ProtectedRoute>} />
            <Route path="/my-jobs" element={<ProtectedRoute><MyJobs /></ProtectedRoute>} />
            <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/about" replace />} />
          </Routes>
        </AnimatedPage>
      </div>

      <Footer />

      {/* ChatBox floating widget — visible on all protected pages */}
      {!hideNav && (
        <ProtectedRoute>
          <ChatBox />
        </ProtectedRoute>
      )}
    </div>
  );
}

// ─── App Root ──────────────────────────────────────────
export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}