import { useState, useEffect } from 'react'
import { getMyApplications, getJobs } from '../services/api'
import { useAuth } from '../context/AuthContext'

/* ── Skeleton components ──────────────────────────────── */
function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton skeleton-avatar w-10 h-10" />
        <div className="skeleton skeleton-text w-24" />
      </div>
      <div className="skeleton skeleton-title w-16 h-8" />
    </div>
  )
}

function SkeletonAppCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start gap-4">
        <div className="skeleton skeleton-avatar w-14 h-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton skeleton-title w-2/5" />
          <div className="skeleton skeleton-text w-1/3" />
          <div className="flex gap-3 mt-2">
            <div className="skeleton skeleton-text w-20" />
            <div className="skeleton skeleton-text w-16" />
          </div>
        </div>
        <div className="skeleton skeleton-btn w-20 h-7 rounded-full" />
      </div>
    </div>
  )
}

/* ── Status badge config ───────────────────────────────── */
const STATUS_CONFIG = {
  APPLIED:  { bg: 'var(--primary-dim)',   text: 'var(--primary)',  border: 'rgba(79,70,229,0.25)', icon: '📋' },
  ACCEPTED: { bg: 'var(--success-bg)',    text: 'var(--success)',  border: 'var(--success-border)', icon: '✅' },
  REJECTED: { bg: 'var(--error-bg)',      text: 'var(--error)',    border: 'var(--error-border)',   icon: '✗' },
  default:  { bg: 'var(--bg-subtle)',     text: 'var(--text-muted)', border: 'var(--border)',       icon: '·' },
}

const COMPANY_COLORS = [
  { bg: '#EEF2FF', text: '#4F46E5' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#ECFDF5', text: '#059669' },
  { bg: '#F3EFFB', text: '#6B4CAB' },
  { bg: '#D2EBF8', text: '#1A6B9A' },
]

function getColor(str = '') {
  return COMPANY_COLORS[(str.charCodeAt(0) || 0) % COMPANY_COLORS.length]
}

/* ─────────────────────────────────────────────────────── */
export default function MyApplications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [appsRes, jobsRes] = await Promise.all([
          getMyApplications(user?.id),
          getJobs()
        ])
        setApplications(appsRes.data)
        setJobs(jobsRes.data)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    fetchData()
  }, [user?.id])

  const getJob = (jobId) => jobs.find(j => j.id === jobId)

  const counts = {
    total:    applications.length,
    accepted: applications.filter(a => a.status === 'ACCEPTED').length,
    pending:  applications.filter(a => a.status === 'APPLIED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── Page header ── */}
      <div style={{ background:'linear-gradient(145deg, #1E1B4B 0%, #4F46E5 100%)', color:'#fff', padding:'clamp(28px, 6vw, 52px) clamp(16px, 4vw, 32px)' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
            <div style={{ width:36, height:36, background:'rgba(255,255,255,0.15)', borderRadius:'var(--r-md)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
              </svg>
            </div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.5rem, 4vw, 2.2rem)', fontWeight:500, letterSpacing:'-0.5px' }}>
              My Applications
            </h1>
          </div>
          <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'clamp(13px, 2vw, 14.5px)' }}>
            Track the status of all your job applications
          </p>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'clamp(16px, 4vw, 28px) clamp(14px, 4vw, 24px)' }}>

        {/* ── Stat cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'clamp(8px, 2vw, 14px)', marginBottom:'clamp(20px, 4vw, 32px)' }}>
          {loading ? (
            [1,2,3,4].map(i => <SkeletonStatCard key={i} />)
          ) : (
            [
              { label:'Total Applied', value:counts.total,    color:'var(--primary)', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>, bg:'var(--primary-dim)', border:'rgba(79,70,229,0.2)' },
              { label:'Accepted',      value:counts.accepted, color:'var(--success)', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, bg:'var(--success-bg)', border:'var(--success-border)' },
              { label:'Pending',       value:counts.pending,  color:'#6B4CAB', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, bg:'#F3EFFB', border:'#CBBCE8' },
              { label:'Rejected',      value:counts.rejected, color:'var(--error)', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>, bg:'var(--error-bg)', border:'var(--error-border)' },
            ].map(({ label, value, color, icon, bg, border }) => (
              <div key={label} style={{ background:'var(--bg-surface)', borderRadius:'var(--r-lg)', padding:'clamp(14px, 2.5vw, 20px)', border:`1px solid ${border}`, boxShadow:'var(--shadow-sm)', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:34, height:34, background:bg, borderRadius:'var(--r-md)', display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>
                    {icon}
                  </div>
                  <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px' }}>
                    {label}
                  </span>
                </div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(24px, 4vw, 32px)', fontWeight:500, color, letterSpacing:'-1px' }}>
                  {value}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Applications list ── */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <SkeletonAppCard key={i} />)}
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 20px', color:'var(--text-muted)' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin:'0 auto 16px', display:'block', opacity:0.3 }}>
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
            </svg>
            <p style={{ fontFamily:'var(--font-display)', fontSize:17, color:'var(--text-secondary)', marginBottom:6 }}>
              No applications yet
            </p>
            <p style={{ fontSize:13 }}>Browse jobs and apply to get started</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {applications.map(app => {
              const job = getJob(app.jobId)
              const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.default
              const colors = getColor(job?.company)

              return (
                <div key={app.id} style={{
                  background:'var(--bg-surface)',
                  borderRadius:'var(--r-lg)',
                  border:'1px solid var(--border)',
                  padding:'clamp(14px, 3vw, 20px)',
                  display:'flex',
                  alignItems:'center',
                  gap:14,
                  boxShadow:'var(--shadow-sm)',
                  transition:'all 0.2s',
                  flexWrap:'wrap',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--primary-light)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  {/* Company avatar */}
                  <div style={{ width:46, height:46, borderRadius:12, background:colors.bg, color:colors.text, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:18, fontWeight:500, flexShrink:0 }}>
                    {(job?.company || '?').charAt(0).toUpperCase()}
                  </div>

                  {/* Job info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(14px, 2vw, 16px)', fontWeight:500, color:'var(--text-primary)', marginBottom:2, letterSpacing:'-0.2px' }}>
                      {job?.title || 'Unknown Job'}
                    </h3>
                    <p style={{ fontSize:13, color:'var(--primary)', fontWeight:500, marginBottom:6 }}>
                      {job?.company || '—'}
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:10, fontSize:12, color:'var(--text-muted)' }}>
                      {job?.location && (
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {job.location}
                        </span>
                      )}
                      {job?.salary && (
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                          {job.salary}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{ flexShrink:0 }}>
                    <span style={{
                      background: status.bg,
                      color: status.text,
                      border: `1px solid ${status.border}`,
                      padding:'5px 12px',
                      borderRadius:20,
                      fontSize:11.5,
                      fontWeight:700,
                      letterSpacing:'0.04em',
                      display:'inline-flex',
                      alignItems:'center',
                      gap:5,
                      whiteSpace:'nowrap',
                    }}>
                      {status.icon} {app.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}