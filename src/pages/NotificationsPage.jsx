import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getConnectionRequests,
  updateConnectionRequest,
  getNotifications,
  markAllNotificationsRead,
  markOneNotificationRead,
} from "../services/api";
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

function timeAgo(dt) {
  if (!dt) return "";
  const diff = Date.now() - new Date(dt).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

const CONNECTION_UPDATED_EVENT = "connectionStateUpdated";

// ── Tab IDs ───────────────────────────────────────────────────────────────────
const TAB_REQUESTS = "requests";
const TAB_ACTIVITY = "activity";

export default function NotificationsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [tab, setTab]               = useState(TAB_REQUESTS);
  const [requests, setRequests]     = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingReq, setLoadingReq] = useState(true);
  const [loadingNot, setLoadingNot] = useState(true);
  const [processing, setProcessing] = useState(new Set());
  const [backendWaking, setBackendWaking] = useState(false);
  const pollRef                     = useRef(null);
  const notPollRef                  = useRef(null);
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
      if (!err.response) setBackendWaking(true);
      console.error("fetchRequests error:", err);
      if (!initialLoadDone.current) toast.error("Failed to load notifications");
    } finally {
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setLoadingReq(false);
      }
    }
  }, [user?.id]);

  // ── Fetch activity notifications ──────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getNotifications(user.id);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("fetchNotifications error:", err);
    } finally {
      setLoadingNot(false);
    }
  }, [user?.id]);

  // ── Mount: initial load + polling ─────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    setLoadingReq(true);
    setLoadingNot(true);
    initialLoadDone.current = false;
    fetchRequests();
    fetchNotifications();
    pollRef.current    = setInterval(() => fetchRequests(), 5000);
    notPollRef.current = setInterval(() => fetchNotifications(), 10000);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(notPollRef.current);
    };
  }, [user?.id, fetchRequests, fetchNotifications]);

  // ── Mark activity notifications as read when switching to that tab ─────────
  useEffect(() => {
    if (tab === TAB_ACTIVITY && user?.id) {
      const unread = notifications.filter(n => !n.isRead);
      if (unread.length > 0) {
        markAllNotificationsRead(user.id)
          .then(() => {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          })
          .catch(console.error);
      }
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Accept / Reject ───────────────────────────────────────────────────────
  const handleUpdate = useCallback(async (req, status) => {
    if (!user?.id) return;
    const { id, senderId } = req;
    setProcessing(prev => new Set([...prev, id]));
    const waitToast = toast.loading(status === "ACCEPTED" ? "Accepting…" : "Rejecting…");

    try {
      await updateConnectionRequest(id, status);
      toast.dismiss(waitToast);
      setRequests(prev => prev.filter(r => r.id !== id));

      if (status === "ACCEPTED") {
        localStorage.removeItem(`sentRequests_${user.id}`);
        window.dispatchEvent(new CustomEvent(CONNECTION_UPDATED_EVENT, {
          detail: { type: "ACCEPTED", senderId, receiverId: user.id },
        }));
        toast.success("Connection accepted! You can now message them.", { duration: 4000 });
      } else {
        window.dispatchEvent(new CustomEvent(CONNECTION_UPDATED_EVENT, {
          detail: { type: "REJECTED", senderId, receiverId: user.id },
        }));
        toast.success("Request rejected");
      }

      // Refresh activity notifications after action
      fetchNotifications();
    } catch (err) {
      toast.dismiss(waitToast);
      const statusCode = err.response?.status;
      if (!err.response) {
        toast.error("Server is waking up. Please wait 30 seconds and try again.", { duration: 6000 });
      } else if (statusCode === 401 || statusCode === 403) {
        toast.error("Could not verify your session. Please refresh the page.", { duration: 5000 });
        fetchRequests();
      } else {
        toast.error(`Failed to update request (${statusCode || "unknown error"}). Try again.`);
        fetchRequests();
      }
    }
    setProcessing(prev => { const s = new Set(prev); s.delete(id); return s; });
  }, [user?.id, fetchRequests, fetchNotifications]);

  const unreadActivityCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(145deg, #1E1B4B 0%, #4F46E5 100%)",
        color: "#fff",
        padding: "clamp(28px,6vw,52px) clamp(16px,4vw,32px) 0",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <button
            onClick={() => navigate("/connect")}
            style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8, padding: "7px 14px", color: "#fff",
              cursor: "pointer", fontSize: 13, marginBottom: 16,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ← Back to Connect
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 500 }}>
                Notifications
              </h1>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                {tab === TAB_REQUESTS
                  ? (loadingReq ? "Loading..." : `${requests.length} pending request${requests.length !== 1 ? "s" : ""}`)
                  : `Activity & updates`}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0 }}>
            {[
              { id: TAB_REQUESTS, label: "Connection Requests", badge: requests.length },
              { id: TAB_ACTIVITY, label: "Activity", badge: unreadActivityCount },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "10px 18px", border: "none", background: "transparent",
                  color: tab === t.id ? "#fff" : "rgba(255,255,255,0.55)",
                  fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
                  cursor: "pointer", whiteSpace: "nowrap",
                  borderBottom: tab === t.id ? "2px solid #fff" : "2px solid transparent",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 7,
                }}
              >
                {t.label}
                {t.badge > 0 && (
                  <span style={{
                    background: t.id === TAB_REQUESTS ? "#EF4444" : "rgba(255,255,255,0.3)",
                    color: "#fff", borderRadius: 20,
                    padding: "1px 7px", fontSize: 11, fontWeight: 700,
                  }}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Backend waking banner */}
      {backendWaking && (
        <div style={{ background: "#FEF3C7", borderBottom: "1px solid #FCD34D", padding: "10px 24px", textAlign: "center", fontSize: 13, color: "#92400E" }}>
          ⏳ Server is starting up (free tier). Requests will load in ~30 seconds…
        </div>
      )}

      {/* Body */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(16px,4vw,28px) clamp(14px,4vw,24px)" }}>

        {/* ── Connection Requests Tab ── */}
        {tab === TAB_REQUESTS && (
          loadingReq ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", height: 90 }} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--text-muted)" }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }}>
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
                  <div key={req.id} style={{
                    background: "var(--bg-surface)", borderRadius: 16,
                    padding: "clamp(14px,3vw,20px)", border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)", display: "flex",
                    alignItems: "center", gap: 14, flexWrap: "wrap",
                  }}>
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
                      <div style={{ fontSize: 11, color: "var(--text-xmuted)" }}>Wants to connect with you</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleUpdate(req, "ACCEPTED")}
                        disabled={isProcessing}
                        style={{ padding: "9px 20px", minHeight: 44, borderRadius: 10, border: "none", background: "#4F46E5", color: "#fff", fontSize: 13, fontWeight: 600, cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.6 : 1, transition: "opacity 0.2s" }}
                      >
                        {isProcessing ? "…" : "Accept"}
                      </button>
                      <button
                        onClick={() => handleUpdate(req, "REJECTED")}
                        disabled={isProcessing}
                        style={{ padding: "9px 16px", minHeight: 44, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.6 : 1, transition: "opacity 0.2s" }}
                      >
                        {isProcessing ? "…" : "Reject"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── Activity Tab ── */}
        {tab === TAB_ACTIVITY && (
          loadingNot ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 20, border: "1px solid var(--border)", height: 72 }} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--text-muted)" }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4l3 3"/>
              </svg>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 6 }}>No activity yet</p>
              <p style={{ fontSize: 13 }}>Updates about your connection requests will appear here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {notifications.map(n => {
                const isRejected = n.type === "CONNECTION_REJECTED";
                const isAccepted = n.type === "CONNECTION_ACCEPTED";
                return (
                  <div key={n.id} style={{
                    background: n.isRead ? "var(--bg-surface)" : "var(--primary-dim, #EEF2FF)",
                    borderRadius: 14, padding: "14px 18px",
                    border: n.isRead ? "1px solid var(--border)" : "1px solid rgba(79,70,229,0.2)",
                    display: "flex", alignItems: "center", gap: 14,
                    transition: "background 0.2s",
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                      background: isAccepted ? "#ECFDF5" : isRejected ? "#FEF2F2" : "var(--bg-subtle)",
                      color: isAccepted ? "#059669" : isRejected ? "#EF4444" : "var(--text-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isAccepted ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : isRejected ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                      )}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: n.isRead ? 400 : 600, lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!n.isRead && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}