import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getConnectionRequests, updateConnectionRequest } from "../services/api";
import toast from "react-hot-toast";

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

const CONNECTION_UPDATED_EVENT = "connectionStateUpdated";

// Pre-flight check: decode JWT expiry without a library.
// We never trust this for auth decisions — the server validates the signature.
// This is only used to show a friendly message before making a doomed request.
function isTokenExpired() {
  const token = localStorage.getItem("token");
  if (!token) return true;
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    // payload.exp is in seconds; Date.now() is in milliseconds
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export default function NotificationsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [processing, setProcessing] = useState(new Set());
  const [backendWaking, setBackendWaking] = useState(false);
  const pollRef                     = useRef(null);
  const initialLoadDone             = useRef(false);

  // ── Fetch pending incoming requests ───────────────────────────────────────
  const fetchRequests = useCallback(async (isRetry = false) => {
    if (!user?.id) return;
    try {
      const res = await getConnectionRequests(user.id);
      setRequests(res.data || []);
      setBackendWaking(false);
    } catch (err) {
      if (err.response?.status === 429 && !isRetry) {
        setTimeout(() => fetchRequests(true), 2000);
        return;
      }
      // Network error with no response = backend is sleeping (Render free tier)
      if (!err.response) {
        setBackendWaking(true);
      }
      console.error("fetchRequests error:", err);
      if (!initialLoadDone.current) toast.error("Failed to load notifications");
    } finally {
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setLoading(false);
      }
    }
  }, [user?.id]);

  // ── Mount: initial load + 5-second poll ───────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    initialLoadDone.current = false;
    fetchRequests();
    pollRef.current = setInterval(() => fetchRequests(), 5000);
    return () => clearInterval(pollRef.current);
  }, [user?.id, fetchRequests]);

  // ── Accept / Reject ───────────────────────────────────────────────────────
  const handleUpdate = useCallback(async (req, status) => {
    if (!user?.id) return;

    // FIX: Pre-flight token expiry check.
    // If the token is already expired, show a friendly message and stop here.
    // This prevents a guaranteed 401 from the server and avoids the old
    // behaviour of catching that 401 and forcibly redirecting to /login.
    if (isTokenExpired()) {
      toast.error(
        "Your session has expired. Please refresh the page and log in again.",
        { duration: 5000 }
      );
      return;
    }

    const { id, senderId } = req;

    setProcessing(prev => new Set([...prev, id]));

    // Show "please wait" toast immediately in case backend is cold-starting
    const waitToast = toast.loading(
      status === "ACCEPTED" ? "Accepting…" : "Rejecting…"
    );

    try {
      await updateConnectionRequest(id, status);

      toast.dismiss(waitToast);
      setRequests(prev => prev.filter(r => r.id !== id));

      if (status === "ACCEPTED") {
        // Clear the sender's sent-requests cache so their ConnectPage
        // reflects the new connection state immediately on next load.
        localStorage.removeItem(`sentRequests_${user.id}`);

        // Notify ConnectionsPage (and any other listener) that a new
        // connection was just created so they can re-fetch without a reload.
        window.dispatchEvent(new CustomEvent(CONNECTION_UPDATED_EVENT, {
          detail: { type: "ACCEPTED", senderId, receiverId: user.id },
        }));
        toast.success("Connection accepted! You can now message them.", {
          duration: 4000,
        });
      } else {
        window.dispatchEvent(new CustomEvent(CONNECTION_UPDATED_EVENT, {
          detail: { type: "REJECTED", senderId, receiverId: user.id },
        }));
        toast.success("Request rejected");
      }
    } catch (err) {
      toast.dismiss(waitToast);
      console.error("handleUpdate error:", err);

      const statusCode = err.response?.status;

      if (!err.response) {
        // No response at all = backend cold start / network timeout
        toast.error(
          "Server is waking up (free tier). Please wait 30 seconds and try again.",
          { duration: 6000 }
        );
      } else if (statusCode === 401 || statusCode === 403) {
        // FIX: Do NOT redirect to /login here.
        // skipAuthRedirect: true is already set on updateConnectionRequest in
        // api.js, so the global interceptor won't fire. We just show a message
        // and let the user decide what to do next. Forcing a redirect was
        // causing the "session expired" logout loop even when the token was
        // valid, because any transient 401 (e.g. clock skew, cold-start race)
        // would kick the user out entirely.
        toast.error(
          "Could not verify your session. Please refresh the page and try again.",
          { duration: 5000 }
        );
        // Re-fetch so the list stays consistent (the request may or may not
        // have been processed before the error).
        fetchRequests();
      } else {
        toast.error(
          `Failed to update request (${statusCode || "unknown error"}). Try again.`
        );
        fetchRequests();
      }
    }

    setProcessing(prev => { const s = new Set(prev); s.delete(id); return s; });
  }, [user?.id, fetchRequests]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(145deg, #1E1B4B 0%, #4F46E5 100%)",
        color: "#fff",
        padding: "clamp(28px,6vw,52px) clamp(16px,4vw,32px)",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <button
            onClick={() => navigate("/connect")}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8, padding: "7px 14px", color: "#fff",
              cursor: "pointer", fontSize: 13, marginBottom: 16,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ← Back to Connect
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.4rem,4vw,2rem)",
                fontWeight: 500,
              }}>
                Connection Requests
              </h1>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                {loading
                  ? "Loading..."
                  : `${requests.length} pending request${requests.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backend waking up banner */}
      {backendWaking && (
        <div style={{
          background: "#FEF3C7",
          borderBottom: "1px solid #FCD34D",
          padding: "10px 24px",
          textAlign: "center",
          fontSize: 13,
          color: "#92400E",
        }}>
          ⏳ Server is starting up (free tier). Requests will load in ~30 seconds…
        </div>
      )}

      {/* Body */}
      <div style={{
        maxWidth: 760, margin: "0 auto",
        padding: "clamp(16px,4vw,28px) clamp(14px,4vw,24px)",
      }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: "var(--bg-surface)", borderRadius: 16,
                padding: 20, border: "1px solid var(--border)", height: 90,
              }} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--text-muted)" }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.2"
              style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 6 }}>
              No pending requests
            </p>
            <p style={{ fontSize: 13 }}>You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {requests.map(req => {
              const avatarColor  = getAvatarColor(req.senderName);
              const isProcessing = processing.has(req.id);
              return (
                <div
                  key={req.id}
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: 16,
                    padding: "clamp(14px,3vw,20px)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: avatarColor.bg, color: avatarColor.text,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {(req.senderName || "?").charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 15,
                      fontWeight: 600, color: "var(--text-primary)", marginBottom: 2,
                    }}>
                      {req.senderName}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                      {req.senderRole === "RECRUITER" ? "Alumni / Recruiter" : "Student"}
                      {req.senderSkills && ` · ${req.senderSkills.split(",").slice(0, 2).join(", ")}`}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-xmuted)" }}>
                      Wants to connect with you
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleUpdate(req, "ACCEPTED")}
                      disabled={isProcessing}
                      style={{
                        padding: "8px 20px", borderRadius: 10,
                        border: "none", background: "#4F46E5", color: "#fff",
                        fontSize: 13, fontWeight: 600,
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        opacity: isProcessing ? 0.6 : 1,
                        transition: "opacity 0.2s",
                      }}
                    >
                      {isProcessing ? "…" : "Accept"}
                    </button>
                    <button
                      onClick={() => handleUpdate(req, "REJECTED")}
                      disabled={isProcessing}
                      style={{
                        padding: "8px 16px", borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--bg-subtle)", color: "var(--text-muted)",
                        fontSize: 13, fontWeight: 600,
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        opacity: isProcessing ? 0.6 : 1,
                        transition: "opacity 0.2s",
                      }}
                    >
                      {isProcessing ? "…" : "Reject"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}