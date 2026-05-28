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

      login(data);
      toast.success("Welcome back!");

      // FIX: Honour the saved redirect path written by api.js on 401 expiry.
      // Without this the user always lands on the dashboard and the pending
      // Accept action in NotificationsPage is never replayed.
      const savedRedirect = localStorage.getItem("redirectAfterLogin");
      localStorage.removeItem("redirectAfterLogin");

      const defaultPath = data.role === "RECRUITER" ? "/recruiter" : "/jobs";
      navigate(savedRedirect || defaultPath, { replace: true });

    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Login failed";
      toast.error(typeof msg === "string" ? msg : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F5F7FA",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          borderRadius: 20,
          padding: "clamp(28px,6vw,48px)",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.9rem",
            fontWeight: 700,
            color: "#1E1B4B",
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          Sign in
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#6B7280",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Welcome back to the SATI portal
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}
            >
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                padding: "11px 14px",
                borderRadius: 10,
                border: "1.5px solid #D1D5DB",
                fontSize: 14,
                background: "#F9FAFB",
                color: "#111827",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}
            >
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                padding: "11px 14px",
                borderRadius: 10,
                border: "1.5px solid #D1D5DB",
                fontSize: 14,
                background: "#F9FAFB",
                color: "#111827",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Submit button — explicit type="submit", no CSS variables */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "13px 0",
              borderRadius: 10,
              border: "none",
              background: loading ? "#818CF8" : "#4F46E5",
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              width: "100%",
              letterSpacing: "0.01em",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 13,
            color: "#6B7280",
          }}
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#4F46E5",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}