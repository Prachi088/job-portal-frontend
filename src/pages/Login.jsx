// ─────────────────────────────────────────────────────────────────────────────
// Login.jsx — corrected version
//
// KEY FIX: After a successful login, check localStorage for a saved redirect
// path (written by api.js when a 401 kicked the user out mid-session) and
// navigate there instead of always going to the role-based dashboard default.
//
// This is what makes the pending-action replay in NotificationsPage work:
//   user clicks Accept → token expired → interceptor saves /notifications as
//   redirectAfterLogin → user re-logs in → this component sends them back to
//   /notifications → NotificationsPage mounts and replays the Accept.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/api";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res  = await loginUser(form);
      const data = res.data;

      // Persist credentials via your AuthContext helper
      login(data);

      toast.success("Welcome back!");

      // ── FIX: Honour the saved redirect path ────────────────────────────
      // api.js writes redirectAfterLogin = window.location.pathname whenever
      // a 401/403 forces the user to /login mid-session. We read it here,
      // consume it (remove), and navigate there so the user lands exactly
      // where they were — most importantly /notifications, which triggers the
      // pending-action replay in NotificationsPage.
      //
      // If nothing was saved (normal login flow), fall back to the
      // role-based dashboard.
      const savedRedirect = localStorage.getItem("redirectAfterLogin");
      localStorage.removeItem("redirectAfterLogin"); // consume — don't reuse

      const defaultPath =
        data.role === "RECRUITER" ? "/recruiter" : "/jobs";

      navigate(savedRedirect || defaultPath, { replace: true });
      // ────────────────────────────────────────────────────────────────────
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Login failed";
      toast.error(typeof msg === "string" ? msg : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "var(--bg-surface)", borderRadius: 20, padding: "clamp(28px,6vw,48px)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6, textAlign: "center" }}>
          Sign in
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", marginBottom: 32 }}>
          Welcome back to the SATI portal
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--border)", fontSize: 14, background: "var(--bg-subtle)", color: "var(--text-primary)", outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--border)", fontSize: 14, background: "var(--bg-subtle)", color: "var(--text-primary)", outline: "none" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 8, padding: "12px 0", borderRadius: 10, border: "none", background: loading ? "var(--primary-muted)" : "var(--primary)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", transition: "background 0.2s" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}