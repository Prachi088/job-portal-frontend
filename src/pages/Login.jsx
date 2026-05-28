import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/api";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]             = useState({ email: "", password: "" });
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      // Persist credentials in AuthContext + localStorage
      login(data);
      toast.success("Welcome back!");

      // ── KEY FIX: redirect back to where the user was before token expiry ──
      // api.js writes redirectAfterLogin = window.location.pathname whenever
      // a 401 kicks the user out (e.g. while clicking Accept on a connection
      // request). Reading it here sends them back to /notifications so the
      // pending-action replay in NotificationsPage can run automatically.
      const savedRedirect = localStorage.getItem("redirectAfterLogin");
      localStorage.removeItem("redirectAfterLogin"); // consume — never reuse

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
        <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 32 }}>
          Welcome back to the SATI portal
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Email</label>
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

          {/* Password with eye toggle */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  padding: "11px 44px 11px 14px",
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
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "#9CA3AF",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
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
              width: "100%",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#6B7280" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}