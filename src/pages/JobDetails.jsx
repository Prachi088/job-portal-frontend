import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getJobById, applyForJob } from '../services/api'
import toast from 'react-hot-toast'

export default function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true)
      try {
        const res = await getJobById(id)
        setJob(res?.data || null)
      } catch (err) {
        console.error('Job fetch error:', err)
        setJob(null)
      }
      setLoading(false)
    }

    if (id) fetchJob()
  }, [id])

  const handleApply = async () => {
    if (!job || !user) return
    setApplying(true)
    try {
      await applyForJob({ userId: user.id, jobId: job.id })
      setApplied(true)
      toast.success('Application submitted successfully!')
    } catch (err) {
      console.error('Apply error:', err)
      toast.error('Unable to submit application. Try again.')
    }
    setApplying(false)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', background: 'var(--bg)', padding: 'clamp(24px, 5vw, 40px)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            border: '1px solid var(--border)',
            borderRadius: '999px',
            padding: '10px 16px',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          ← Back to jobs
        </button>

        {loading ? (
          <div style={{ padding: 28, borderRadius: 20, background: 'var(--bg-surface)', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)' }}>
            Loading job details…
          </div>
        ) : !job ? (
          <div style={{ padding: 28, borderRadius: 20, background: 'var(--bg-surface)', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Job not found</p>
            <p style={{ color: 'var(--text-muted)' }}>Please return to the job list and try another role.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 24 }}>
            <section style={{ padding: 28, borderRadius: 24, background: 'var(--bg-surface)', boxShadow: '0 22px 56px rgba(15, 23, 42, 0.08)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, color: 'var(--primary)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {job.type || 'Job Opportunity'}
                  </p>
                  <h1 style={{ margin: '12px 0 8px', fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3vw, 2.7rem)', lineHeight: 1.05, color: 'var(--text-primary)' }}>
                    {job.title || 'Untitled role'}
                  </h1>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8 }}>
                    {job.company || 'Unknown company'} · {job.location || 'Location not specified'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
                  {job.salary && (
                    <span style={{ borderRadius: 18, padding: '8px 14px', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>
                      {job.salary}
                    </span>
                  )}
                  <button
                    onClick={handleApply}
                    disabled={applying || applied}
                    style={{
                      minWidth: 160,
                      border: 'none',
                      borderRadius: 14,
                      padding: '12px 18px',
                      background: applied ? 'var(--success-bg)' : 'var(--primary)',
                      color: applied ? 'var(--success)' : '#fff',
                      fontWeight: 700,
                      cursor: applying || applied ? 'default' : 'pointer',
                      opacity: applying ? 0.7 : 1,
                    }}
                  >
                    {applying ? 'Applying…' : applied ? '✓ Applied' : 'Apply now'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18, fontSize: 13, color: 'var(--text-muted)' }}>
                {job.location && <span style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 16 }}>{job.location}</span>}
                {job.salary && <span style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 16 }}>{job.salary}</span>}
                {job.type && <span style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 16 }}>{job.type}</span>}
              </div>
            </section>

            <section style={{ padding: 28, borderRadius: 24, background: 'var(--bg-surface)', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.05)' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Job description</h2>
              <p style={{ marginTop: 18, color: 'var(--text-secondary)', lineHeight: 1.9, whiteSpace: 'pre-wrap', fontSize: 15 }}>
                {job.description || 'No description provided.'}
              </p>
            </section>

            {job.requirements && (
              <section style={{ padding: 28, borderRadius: 24, background: 'var(--bg-surface)', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.05)' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Requirements</h2>
                <p style={{ marginTop: 18, color: 'var(--text-secondary)', lineHeight: 1.9, whiteSpace: 'pre-wrap', fontSize: 15 }}>
                  {job.requirements}
                </p>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
