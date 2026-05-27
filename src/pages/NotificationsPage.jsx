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

// Custom event key used to signal ConnectPage / ConnectionsPage to refresh
// their state after a request is accepted or rejected here.
const CONNECTION_UPDATED_EVENT = "connectionStateUpdated";

export default function NotificationsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [processing, setProcessing] = useState(new Set());
  const pollRef                     = useRef(null);
  // Track whether the initial load has completed so background polls
  // never flip loading back to true (which caused the skeleton to flicker
  // on every 5-second tick).
  const initialLoadDone             = useRef(false);

  // ── Fetch pending requests ─────────────────────────────────────────────────
  const fetchRequests = useCallback(async (isRetry = false) => {
    try {
      const res = await getConnectionRequests(user.id);
      setRequests(res.data || []);
    } catch (err) {
      if (err.response?.status === 429 && !isRetry) {
        // Rate limited — wait 2 s then retry once without touching loading state.
        setTimeout(() => fetchRequests(true), 2000);
        return;
      }
      console.error(err);
      if (!initialLoadDone.current) toast.error("Failed to load notifications");
    } finally {
      // Only set loading false once — on the very first call.
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setLoading(false);
      }
    }
  }, [user.id]);

  useEffect(() => {
    setLoading(true);
    initialLoadDone.current = false;
    fetchRequests();

    // Poll every 5 s so new incoming requests appear without a page reload.
    pollRef.current = setInterval(() => fetchRequests(), 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchRequests]);

  // ── Accept / Reject ────────────────────────────────────────────────────────
  const handleUpdate = async (req, status) => {
    const { id, senderId } = req;
    setProcessing(prev => new Set([...prev, id]));
    try {
      await updateConnectionRequest(id, status);

      // Optimistically remove from list immediately.
      setRequests(prev => prev.filter(r => r.id !== id));

      if (status === "ACCEPTED") {
        // 1. Clear the SENDER's cached "pending from me" so ConnectPage shows
        //    them as "Connected" the next time they visit.
        //    We can't key into their localStorage directly, but we CAN clear our
        //    own cached state and fire a cross-page event so ConnectPage re-syncs.
        localStorage.removeItem(`sentRequests_${user.id}`);

        // 2. Fire a custom DOM event so ConnectPage and ConnectionsPage
        //    immediately re-fetch without waiting for their next poll/nav.
        //    The event carries the senderId so pages can do targeted refreshes.
        window.dispatchEvent(
          new CustomEvent(CONNECTION_UPDATED_EVENT, {
            detail: { type: "ACCEPTED", senderId, receiverId: user.id },
          })
        );

        toast.success("Connection accepted!");
      } else {
        // For rejections, still notify ConnectPage so the sender's button
        // reverts from "⏳ Requested" to "Connect".
        window.dispatchEvent(
          new CustomEvent(CONNECTION_UPDATED_EVENT, {
            detail: { type: "REJECTED", senderId, receiverId: user.id },
          })
        );
        toast.success("Request rejected");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update request");
      // Re-fetch on failure so the list is consistent with server state.
      fetchRequests();
    }
    setProcessing(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(145deg, #1E1B4B 0%, #4F46E5 100%)", color: "#fff", padding: "clamp(28px,6vw,52px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <button
            onClick={() => navigate("/connect")}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "7px 14px", color: "#fff", cursor: "pointer", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}
          >
            ← Back to Connect
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 500 }}>
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

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(16px,4vw,28px) clamp(14px,4vw,24px)" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", height: 90 }} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--text-muted)" }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
              style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 6 }}>No pending requests</p>
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
                  style={{ background: "var(--bg-surface)", borderRadius: 16, padding: "clamp(14px,3vw,20px)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: avatarColor.bg, color: avatarColor.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                    {(req.senderName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
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
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleUpdate(req, "ACCEPTED")}
                      disabled={isProcessing}
                      style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: isProcessing ? "default" : "pointer", opacity: isProcessing ? 0.6 : 1 }}
                    >
                      {isProcessing ? "..." : "Accept"}
                    </button>
                    <button
                      onClick={() => handleUpdate(req, "REJECTED")}
                      disabled={isProcessing}
                      style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: isProcessing ? "default" : "pointer", opacity: isProcessing ? 0.6 : 1 }}
                    >
                      {isProcessing ? "..." : "Reject"}
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