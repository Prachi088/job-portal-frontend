import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getUserById, updateUserProfile, uploadResume, downloadResume } from '../services/api'
import { useAuth } from '../context/AuthContext'

const AVATAR_COLORS = [
  { bg: "#EEF2FF", text: "#4F46E5" },
  { bg: "#FEF3C7", text: "#D97706" },
  { bg: "#ECFDF5", text: "#059669" },
  { bg: "#F3EFFB", text: "#6B4CAB" },
  { bg: "#D2EBF8", text: "#1A6B9A" },
]
function getAvatarColor(name = "") {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

function InfoSection({ title, icon, children }) {
  return (
    <div style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--primary-dim)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  )
}

function SkillBadge({ skill }) {
  return (
    <span style={{ padding: "5px 12px", background: "var(--primary-dim)", color: "var(--primary)", border: "1px solid rgba(79,70,229,0.2)", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {skill.trim()}
    </span>
  )
}

export default function MyProfile() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', skills: '',
    experience: '', education: '', company: '', currentRole: '',
    linkedinUrl: '', website: '', bio: '', projects: '', batch: ''
  })

  const rawId = searchParams.get('userId') || authUser?.id || localStorage.getItem('id')
  const userId = rawId && rawId !== 'null' && rawId !== 'undefined' ? rawId : null
  const viewedIdParam = searchParams.get('userId')
  const isViewingOtherProfile =
    viewedIdParam !== null &&
    viewedIdParam !== 'null' &&
    viewedIdParam !== String(authUser?.id)

  const userRole = user?.role ?? authUser?.role ?? localStorage.getItem('role')
  const avatarColor = getAvatarColor(user?.name || '')

  const syncProfileState = (profile) => {
    setUser(profile)
    setForm({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || '',
      skills: profile.skills || '',
      experience: profile.experience || '',
      education: profile.education || '',
      company: profile.company || '',
      currentRole: profile.currentRole || '',
      linkedinUrl: profile.linkedinUrl || '',
      website: profile.website || '',
      bio: profile.bio || '',
      projects: profile.projects || '',
      batch: profile.batch || '',
    })
  }

  const loadUserProfile = useCallback(async (id) => {
    const response = await getUserById(id)
    const payload = response.data
    if (payload && typeof payload === 'object' && !payload.name && !payload.email && payload.data) {
      return payload.data
    }
    return payload
  }, [])

  const refreshUserProfile = useCallback(async () => {
    if (!userId) { setError('Unable to load profile — no user signed in.'); setLoading(false); return }
    setError('')
    try {
      const profile = await loadUserProfile(userId)
      syncProfileState(profile)
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) setError('Session expired. Please log in again.')
      else if (status === 404) setError('Profile not found.')
      else setError(err.response?.data?.message || err.response?.data || 'Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }, [userId, loadUserProfile])

  useEffect(() => {
    if (!userId) { setError('Unable to load profile — no user signed in.'); setLoading(false); return }
    setLoading(true); setError(''); refreshUserProfile()
  }, [userId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userId) { setError('Unable to save profile — no user signed in.'); return }
    setSubmitting(true); setError('')
    try {
      await updateUserProfile(userId, {
        phone: form.phone, address: form.address, skills: form.skills,
        experience: form.experience, education: form.education,
        company: form.company, currentRole: form.currentRole,
        linkedinUrl: form.linkedinUrl, website: form.website,
        bio: form.bio, projects: form.projects, batch: form.batch,
      })
      setSuccess(true); setEditing(false)
      await refreshUserProfile()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to update profile.')
    }
    setSubmitting(false)
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setError('')
    try {
      await uploadResume(userId, file); setSuccess(true)
      await refreshUserProfile()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { setError(err.response?.data || 'Failed to upload resume.') }
  }

  const handleResumeDownload = async () => {
    try {
      const response = await downloadResume(userId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url; link.setAttribute('download', user.resumeFileName || 'resume.pdf')
      document.body.appendChild(link); link.click(); link.remove()
    } catch (err) { setError(err.response?.data || 'Failed to download resume.') }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user && error) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "var(--bg-surface)", borderRadius: 20, padding: 40, maxWidth: 400, textAlign: "center", border: "1px solid var(--border)" }}>
          <p style={{ color: "var(--error)", marginBottom: 16 }}>{error}</p>
          <button onClick={() => { setError(''); setLoading(true); refreshUserProfile(); }}
            style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 600 }}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
    ...(userRole === 'STUDENT' ? [{ id: 'resume', label: 'Resume' }] : []),
  ]

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Hero header */}
      <div style={{ background: "linear-gradient(145deg, #1E1B4B 0%, #4F46E5 100%)", padding: "clamp(28px,6vw,52px) clamp(16px,4vw,32px) 0", position: "relative" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* Back button when viewing other profile */}
          {isViewingOtherProfile && (
            <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "7px 14px", color: "#fff", cursor: "pointer", fontSize: 13, marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 6 }}>
              ← Back
            </button>
          )}

          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap", paddingBottom: 0 }}>
            {/* Large avatar */}
            <div style={{ width: 88, height: 88, borderRadius: "50%", background: avatarColor.bg, color: avatarColor.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 700, border: "4px solid rgba(255,255,255,0.3)", flexShrink: 0 }}>
              {(user?.name || "?").charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingBottom: 20, color: "#fff" }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 700, margin: "0 0 4px" }}>
                {user?.name}
              </h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                {user?.currentRole && <span>💼 {user.currentRole}</span>}
                {user?.company && <span>🏢 {user.company}</span>}
                {user?.address && <span>📍 {user.address}</span>}
                {user?.batch && <span>🎓 Batch {user.batch}</span>}
                <span style={{ padding: "2px 10px", background: "rgba(255,255,255,0.15)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#fff" }}>
                  {userRole === "RECRUITER" ? "Alumni / Recruiter" : "Student"}
                </span>
              </div>
              {user?.bio && (
                <p style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 540 }}>
                  {user.bio}
                </p>
              )}
              {/* Social links */}
              <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                {user?.linkedinUrl && (
                  <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "rgba(255,255,255,0.12)", borderRadius: 20, color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 500 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                )}
                {user?.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "rgba(255,255,255,0.12)", borderRadius: 20, color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 500 }}>
                    🌐 Website
                  </a>
                )}
                {user?.email && (
                  <a href={`mailto:${user.email}`}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "rgba(255,255,255,0.12)", borderRadius: 20, color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 500 }}>
                    ✉️ {user.email}
                  </a>
                )}
                {user?.phone && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "rgba(255,255,255,0.12)", borderRadius: 20, color: "#fff", fontSize: 12 }}>
                    📞 {user.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            {!isViewingOtherProfile && (
              <button
                onClick={() => { setEditing(!editing); setError('') }}
                style={{ marginBottom: 20, padding: "9px 20px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.4)", background: editing ? "rgba(255,255,255,0.2)" : "transparent", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {editing ? "Cancel Edit" : "✏️ Edit Profile"}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginTop: 8, overflowX: "auto" }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 18px", border: "none", background: "transparent",
                  color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.55)",
                  fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 400,
                  cursor: "pointer", whiteSpace: "nowrap",
                  borderBottom: activeTab === tab.id ? "2px solid #fff" : "2px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px clamp(14px,4vw,24px)" }}>

        {/* Alerts */}
        {success && (
          <div style={{ background: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success)", padding: "12px 16px", borderRadius: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            ✓ Profile updated successfully!
          </div>
        )}
        {error && (
          <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error)", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Edit form */}
        {!isViewingOtherProfile && editing && (
          <div style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "clamp(16px,3vw,24px)", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, marginBottom: 20, color: "var(--text-primary)" }}>Edit Profile</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>

                {[
                  { label: "Phone", key: "phone", type: "tel", placeholder: "Your phone number" },
                  { label: "Address", key: "address", type: "text", placeholder: "Your city / address" },
                  { label: "Batch / Year", key: "batch", type: "text", placeholder: "e.g. 2022" },
                  { label: "LinkedIn URL", key: "linkedinUrl", type: "url", placeholder: "https://linkedin.com/in/..." },
                  { label: "Website", key: "website", type: "url", placeholder: "https://yourwebsite.com" },
                  ...(userRole === 'RECRUITER' ? [
                    { label: "Company", key: "company", type: "text", placeholder: "Your company" },
                    { label: "Current Role", key: "currentRole", type: "text", placeholder: "Your job title" },
                  ] : []),
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13, background: "var(--bg-subtle)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}

                {[
                  { label: "Skills (comma-separated)", key: "skills", placeholder: "React, Java, Python, SQL..." },
                  { label: "Bio / About", key: "bio", placeholder: "A short description about yourself..." },
                  { label: "Experience", key: "experience", placeholder: "Describe your work experience..." },
                  { label: "Education", key: "education", placeholder: "Your educational background..." },
                  { label: "Projects", key: "projects", placeholder: "Describe projects you've worked on..." },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
                    <textarea
                      rows={3}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13, background: "var(--bg-subtle)", color: "var(--text-primary)", outline: "none", resize: "vertical", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button type="submit" disabled={submitting}
                  style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => { setEditing(false); setError(''); syncProfileState(user) }}
                  style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid var(--border)", background: "none", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB CONTENT ── */}

        {/* Overview */}
        {activeTab === "overview" && (
          <div>
            {user?.bio && (
              <InfoSection title="About" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>}>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, margin: 0, whiteSpace: "pre-line" }}>{user.bio}</p>
              </InfoSection>
            )}

            {user?.skills && (
              <InfoSection title="Skills" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {user.skills.split(",").map((s, i) => <SkillBadge key={i} skill={s} />)}
                </div>
              </InfoSection>
            )}

            {(user?.company || user?.currentRole) && (
              <InfoSection title="Work" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}>
                <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  {user.currentRole && <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{user.currentRole}</p>}
                  {user.company && <p style={{ margin: 0 }}>@ {user.company}</p>}
                </div>
              </InfoSection>
            )}

            {!user?.bio && !user?.skills && !user?.company && !user?.currentRole && !user?.experience && !user?.education && (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 6 }}>
                  {isViewingOtherProfile ? "No profile information yet." : "Your profile looks empty."}
                </p>
                {!isViewingOtherProfile && (
                  <button onClick={() => setEditing(true)}
                    style={{ marginTop: 12, padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Complete Your Profile
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Experience */}
        {activeTab === "experience" && (
          <div>
            {user?.experience ? (
              <InfoSection title="Work Experience" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.9, margin: 0, whiteSpace: "pre-line" }}>{user.experience}</p>
              </InfoSection>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                <p>No experience information added yet.</p>
                {!isViewingOtherProfile && <button onClick={() => setEditing(true)} style={{ marginTop: 12, padding: "9px 20px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Add Experience</button>}
              </div>
            )}
            {user?.projects && (
              <InfoSection title="Projects" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>}>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.9, margin: 0, whiteSpace: "pre-line" }}>{user.projects}</p>
              </InfoSection>
            )}
          </div>
        )}

        {/* Education */}
        {activeTab === "education" && (
          <div>
            {user?.education ? (
              <InfoSection title="Education" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>}>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.9, margin: 0, whiteSpace: "pre-line" }}>{user.education}</p>
              </InfoSection>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                <p>No education information added yet.</p>
                {!isViewingOtherProfile && <button onClick={() => setEditing(true)} style={{ marginTop: 12, padding: "9px 20px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Add Education</button>}
              </div>
            )}
            {user?.batch && (
              <InfoSection title="Batch" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>Class of {user.batch}</p>
              </InfoSection>
            )}
          </div>
        )}

        {/* Skills */}
        {activeTab === "skills" && (
          <div>
            {user?.skills ? (
              <InfoSection title="Technical Skills" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {user.skills.split(",").map((s, i) => <SkillBadge key={i} skill={s} />)}
                </div>
              </InfoSection>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                <p>No skills added yet.</p>
                {!isViewingOtherProfile && <button onClick={() => setEditing(true)} style={{ marginTop: 12, padding: "9px 20px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Add Skills</button>}
              </div>
            )}
          </div>
        )}

        {/* Resume */}
        {activeTab === "resume" && userRole === "STUDENT" && (
          <InfoSection title="Resume" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}>
            {user?.resumeFileName ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--bg-subtle)", borderRadius: 10, border: "1px solid var(--border)", flex: 1, minWidth: 200 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{user.resumeFileName}</span>
                </div>
                <button onClick={handleResumeDownload}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  ⬇ Download
                </button>
                {!isViewingOtherProfile && (
                  <label style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "none", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Update
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} style={{ display: "none" }} />
                  </label>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 14 }}>
                  {isViewingOtherProfile ? "No resume uploaded." : "No resume uploaded yet."}
                </p>
                {!isViewingOtherProfile && (
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    ⬆ Upload Resume
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} style={{ display: "none" }} />
                  </label>
                )}
              </div>
            )}
          </InfoSection>
        )}
      </div>
    </div>
  )
}