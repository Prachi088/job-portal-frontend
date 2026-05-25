import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobs, searchJobs, applyForJob, getAllEvents, registerForEvent, getMyApplications } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

/* ── Skeleton card component ────────────────────────── */
function SkeletonCard() {
  return (
    <div className="skeleton-card bg-white p-4 sm:p-6 rounded-2xl border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div className="flex gap-4 flex-1 w-full">
          <div className="skeleton skeleton-avatar w-12 h-12 flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="skeleton skeleton-title w-3/5" />
            <div className="skeleton skeleton-text w-2/5" />
            <div className="flex gap-3 mt-3">
              <div className="skeleton skeleton-text w-24" />
              <div className="skeleton skeleton-text w-20" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-1 flex-shrink-0">
          <div className="skeleton skeleton-btn w-16 h-9" />
          <div className="skeleton skeleton-btn w-24 h-9" />
        </div>
      </div>
    </div>
  )
}

function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

/* ── Company / organizer avatar ─────────────────────── */
const AVATAR_COLORS = [
  { bg: '#EEF2FF', text: '#4F46E5' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#ECFDF5', text: '#059669' },
  { bg: '#F3EFFB', text: '#6B4CAB' },
  { bg: '#FEF3C7', text: '#A07030' },
]

function getColorForStr(str = '') {
  const idx = (str.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

/* ── Save / Bookmark icon ────────────────────────────── */
function BookmarkIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function TabIcon({ name }) {
  if (name === 'jobs') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    )
  }

  if (name === 'events') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  }

  return null
}

/* ─────────────────────────────────────────────────────── */
export default function JobListings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('jobs')
  const [jobs, setJobs] = useState([])
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showSaved, setShowSaved] = useState(false)
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [applying, setApplying] = useState(null)
  const [applied, setApplied] = useState([])
  const [registeredEvents, setRegisteredEvents] = useState([])
  const [savedJobs, setSavedJobs] = useState([])
  const [savedEvents, setSavedEvents] = useState([])

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true)
    try {
      const res = await getJobs()
      setJobs(res?.data || [])
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setJobs([])
    }
    setLoadingJobs(false)
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true)
    try {
      const res = await getAllEvents()
      setEvents(res?.data || [])
    } catch (err) {
      console.error('Error fetching events:', err)
      setEvents([])
    }
    setLoadingEvents(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'jobs') fetchJobs()
    else fetchEvents()
  }, [activeTab, fetchJobs, fetchEvents])

  useEffect(() => {
    setSavedJobs(JSON.parse(localStorage.getItem('savedJobs') || '[]'))
    setSavedEvents(JSON.parse(localStorage.getItem('savedEvents') || '[]'))
  }, [])

  // Fetch user's existing applications on component mount
  useEffect(() => {
    const fetchUserApplications = async () => {
      try {
        const res = await getMyApplications(user?.id)
        if (res?.data) {
          const appliedJobIds = res.data.map(app => app.jobId)
          setApplied(appliedJobIds)
        }
      } catch (err) {
        console.error('Error fetching user applications:', err)
      }
    }
    if (user?.id) fetchUserApplications()
  }, [user?.id])

  useEffect(() => { localStorage.setItem('savedJobs', JSON.stringify(savedJobs)) }, [savedJobs])
  useEffect(() => { localStorage.setItem('savedEvents', JSON.stringify(savedEvents)) }, [savedEvents])

  const handleSearch = async (e) => {
    const val = e.target.value
    setSearch(val)
    try {
      if (!val.trim()) {
        activeTab === 'jobs' ? fetchJobs() : fetchEvents()
      } else if (activeTab === 'jobs') {
        const res = await searchJobs(val)
        setJobs(res?.data || [])
      } else {
        const allRes = await getAllEvents()
        setEvents((allRes.data || []).filter(ev =>
          [ev.title, ev.description].some(f =>
            String(f || '').toLowerCase().includes(val.toLowerCase())
          )
        ))
      }
    } catch (err) {
      console.error('Search error:', err)
    }
  }

  const handleApply = async (jobId) => {
    if (!jobId || applied.includes(jobId)) return
    setApplying(jobId)
    try {
      await applyForJob({ userId: user?.id, jobId })
      setApplied(prev => [...prev, jobId])
      toast.success('Application submitted!')
    } catch (err) {
      console.error('Apply error:', err)
      toast.error('Failed to apply')
    }
    setApplying(null)
  }

  const handleRegisterForEvent = async (eventId) => {
    if (!eventId) return
    setApplying(eventId)
    try {
      await registerForEvent(eventId, user?.id)
      setRegisteredEvents(prev => [...prev, eventId])
      toast.success('Registered for event!')
    } catch (err) {
      console.error('Registration error:', err)
      toast.error('Failed to register for event')
    }
    setApplying(null)
  }

  const handleToggleSaveJob = (jobId) => {
    setSavedJobs(prev => {
      const updated = prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
      toast.success(updated.includes(jobId) ? 'Saved to your list' : 'Removed from saved jobs')
      return updated
    })
  }

  const handleToggleSaveEvent = (eventId) => {
    setSavedEvents(prev => {
      const updated = prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
      toast.success(updated.includes(eventId) ? 'Event saved' : 'Removed saved event')
      return updated
    })
  }

  const clearFilters = () => { setLocationFilter('all'); setTypeFilter('all'); setShowSaved(false) }

  const locationOptions = useMemo(() =>
    [...new Set([...jobs, ...events].map(i => i.location).filter(Boolean))],
    [jobs, events]
  )
  const jobTypes = useMemo(() =>
    [...new Set(jobs.map(j => j.type).filter(Boolean))],
    [jobs]
  )

  const filteredJobs = useMemo(() => jobs.filter(job => {
    const matchSearch = [job.title, job.company, job.location, job.salary, job.description]
      .some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
    return matchSearch
      && (locationFilter === 'all' || job.location === locationFilter)
      && (typeFilter === 'all' || job.type === typeFilter)
      && (!showSaved || savedJobs.includes(job.id))
  }), [jobs, search, locationFilter, typeFilter, showSaved, savedJobs])

  const filteredEvents = useMemo(() => events.filter(ev => {
    const matchSearch = [ev.title, ev.organizer, ev.location, ev.description]
      .some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
    return matchSearch
      && (locationFilter === 'all' || ev.location === locationFilter)
      && (!showSaved || savedEvents.includes(ev.id))
  }), [events, search, locationFilter, showSaved, savedEvents])

  const isLoading = activeTab === 'jobs' ? loadingJobs : loadingEvents
  const isEmpty   = activeTab === 'jobs' ? filteredJobs.length === 0 : filteredEvents.length === 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(145deg, #1E1B4B 0%, #4F46E5 45%, #6366F1 100%)',
        color: '#fff',
        padding: 'clamp(32px, 8vw, 64px) clamp(16px, 5vw, 32px) clamp(24px, 6vw, 48px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* subtle glow */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 50% at 50% 110%, rgba(217,119,6,0.24) 0%, transparent 70%)', pointerEvents:'none' }} />

        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.7rem, 5vw, 2.8rem)', fontWeight:500, marginBottom:10, letterSpacing:'-0.5px', position:'relative' }}>
          Find Your Dream {activeTab === 'jobs' ? 'Job' : 'Event'}
        </h1>
        <p style={{ color:'rgba(255,255,255,0.72)', fontSize:'clamp(13px, 1.8vw, 15px)', marginBottom:24, position:'relative' }}>
          {activeTab === 'jobs'
            ? 'Explore curated opportunities from the SATI alumni network'
            : 'Discover career events and networking opportunities'}
        </p>

        {/* Tab switcher */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:24, position:'relative' }}>
          <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:14, padding:4, display:'flex', gap:4, backdropFilter:'blur(6px)' }}>
            {['jobs', 'events'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding:'8px 24px',
                  borderRadius:10,
                  border:'none',
                  fontFamily:'var(--font-body)',
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer',
                  transition:'all 0.2s',
                  background: activeTab === tab ? '#fff' : 'transparent',
                  color: activeTab === tab ? 'var(--primary)' : 'rgba(255,255,255,0.85)',
                  boxShadow: activeTab === tab ? '0 2px 12px rgba(28,36,34,0.15)' : 'none',
                  textTransform:'capitalize',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <TabIcon name={tab} />
                {tab === 'jobs' ? 'Jobs' : 'Events'}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ maxWidth:560, margin:'0 auto', position:'relative' }}>
          <svg
            style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', zIndex:1 }}
            width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder={`Search ${activeTab}…`}
            value={search}
            onChange={handleSearch}
            style={{
              width:'100%',
              padding:'14px 18px 14px 46px',
              borderRadius:'var(--r-lg)',
              border:'1.5px solid rgba(255,255,255,0.2)',
              background:'rgba(255,255,255,0.97)',
              fontSize:14,
              outline:'none',
              boxShadow:'var(--shadow-xl)',
              fontFamily:'var(--font-body)',
              color:'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'clamp(16px, 4vw, 28px) clamp(14px, 4vw, 24px)' }}>

        {/* Toolbar */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, flex:1 }}>
            {/* Location filter */}
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">📍 All locations</option>
              {locationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>

            {/* Job type filter */}
            {activeTab === 'jobs' && (
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">🏷 All types</option>
                {jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}

            {/* Saved toggle */}
            <button
              onClick={() => setShowSaved(p => !p)}
              style={{
                ...selectStyle,
                background: showSaved ? 'var(--primary-dim)' : 'var(--bg-surface)',
                color: showSaved ? 'var(--primary)' : 'var(--text-secondary)',
                border: showSaved ? '1px solid rgba(79,70,229,0.3)' : '1px solid var(--border)',
                fontWeight: showSaved ? 600 : 400,
                cursor:'pointer',
              }}
            >
              <BookmarkIcon filled={showSaved} /> {showSaved ? 'Saved only' : 'Show saved'}
            </button>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>
              <strong style={{ color:'var(--primary)' }}>
                {activeTab === 'jobs' ? filteredJobs.length : filteredEvents.length}
              </strong> {activeTab} found
            </span>
            <button onClick={clearFilters} style={resetBtnStyle}>
              Reset
            </button>
          </div>
        </div>

        {/* ── List ── */}
        {isLoading ? (
          <SkeletonList count={4} />
        ) : isEmpty ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin:'0 auto 16px', opacity:0.35, display:'block' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p style={{ fontSize:16, fontFamily:'var(--font-display)', color:'var(--text-secondary)', marginBottom:6 }}>
              No {activeTab} found
            </p>
            <p style={{ fontSize:13 }}>Try adjusting your search or filters</p>
            <button onClick={clearFilters} style={{ ...resetBtnStyle, marginTop:16 }}>
              Clear filters
            </button>
          </div>
        ) : activeTab === 'jobs' ? (
          <div className="space-y-3">
            {filteredJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={savedJobs.includes(job.id)}
                isApplied={applied.includes(job.id)}
                isApplying={applying === job.id}
                onApply={() => handleApply(job.id)}
                onToggleSave={() => handleToggleSaveJob(job.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map(ev => (
              <EventCard
                key={ev.id}
                event={ev}
                isSaved={savedEvents.includes(ev.id)}
                isRegistered={registeredEvents.includes(ev.id)}
                isRegistering={applying === ev.id}
                onRegister={() => handleRegisterForEvent(ev.id)}
                onToggleSave={() => handleToggleSaveEvent(ev.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Job Card ──────────────────────────────────────────── */
function JobCard({ job, isSaved, isApplied, isApplying, onApply, onToggleSave }) {
  const navigate = useNavigate()
  const colors = getColorForStr(job.company)
  return (
    <div
      style={{
        ...cardStyle,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      className="job-list-card"
      onClick={() => navigate(`/jobs/${job.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/jobs/${job.id}`) }}
      role="button"
      tabIndex={0}
    >
      <div style={{ display:'flex', gap:14, flex:1, minWidth:0 }}>
        {/* Avatar */}
        <div style={{ width:46, height:46, borderRadius:12, background:colors.bg, color:colors.text, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:18, fontWeight:500, flexShrink:0 }}>
          {(job.company || '?').charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(14px, 2vw, 16px)', fontWeight:500, color:'var(--text-primary)', marginBottom:2, letterSpacing:'-0.2px' }}>
            {job.title || 'No Title'}
          </h3>
          <p style={{ fontSize:13, color:'var(--primary)', fontWeight:500, marginBottom:8 }}>
            {job.company || 'Unknown'}
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, fontSize:12.5, color:'var(--text-muted)' }}>
            {job.location && (
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {job.location}
              </span>
            )}
            {job.salary && (
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                {job.salary}
              </span>
            )}
            {job.type && (
              <span style={{ background:'var(--primary-dim)', color:'var(--primary)', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                {job.type}
              </span>
            )}
          </div>
          {job.description && (
            <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:8, lineHeight:1.75, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden', textOverflow:'ellipsis', minHeight: 'calc(3 * 1.75em)' }}>
              {job.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }} className="card-actions">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave() }}
          title={isSaved ? 'Remove from saved' : 'Save job'}
          style={{
            background: isSaved ? 'var(--accent-light)' : 'var(--bg-subtle)',
            color: isSaved ? 'var(--accent)' : 'var(--text-muted)',
            border: `1px solid ${isSaved ? 'rgba(217,119,6,0.3)' : 'var(--border)'}`,
            borderRadius:'var(--r-md)',
            padding:'8px 10px',
            cursor:'pointer',
            transition:'all 0.15s',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
          }}
        >
          <BookmarkIcon filled={isSaved} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onApply() }}
          disabled={isApplied || isApplying}
          style={{
            background: isApplied ? 'var(--success-bg)' : 'var(--primary)',
            color: isApplied ? 'var(--success)' : '#fff',
            border: isApplied ? '1px solid var(--success-border)' : 'none',
            borderRadius:'var(--r-md)',
            padding:'9px 18px',
            fontSize:13,
            fontWeight:600,
            cursor: isApplied ? 'default' : 'pointer',
            fontFamily:'var(--font-body)',
            whiteSpace:'nowrap',
            transition:'all 0.18s',
            opacity: isApplying ? 0.6 : 1,
          }}
        >
          {isApplying ? 'Applying…' : isApplied ? '✓ Applied' : 'Apply Now'}
        </button>
      </div>
    </div>
  )
}

/* ── Event Card ─────────────────────────────────────────── */
function EventCard({ event, isSaved, isRegistered, isRegistering, onRegister, onToggleSave }) {
  const colors = getColorForStr(event.organizer)
  const dateObj = event.eventDate ? new Date(event.eventDate) : null
  return (
    <div style={cardStyle} className="job-list-card">
      <div style={{ display:'flex', gap:14, flex:1, minWidth:0 }}>
        {/* Date badge */}
        <div style={{ width:46, height:46, borderRadius:12, background:colors.bg, color:colors.text, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'var(--font-display)' }}>
          {dateObj ? (
            <>
              <span style={{ fontSize:11, fontWeight:600, lineHeight:1 }}>
                {dateObj.toLocaleString('default', { month:'short' }).toUpperCase()}
              </span>
              <span style={{ fontSize:18, fontWeight:700, lineHeight:1 }}>
                {dateObj.getDate()}
              </span>
            </>
          ) : '📅'}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(14px, 2vw, 16px)', fontWeight:500, color:'var(--text-primary)', marginBottom:2, letterSpacing:'-0.2px' }}>
            {event.title || 'No Title'}
          </h3>
          <p style={{ fontSize:13, color:'var(--primary)', fontWeight:500, marginBottom:8 }}>
            {event.organizer || 'Unknown organizer'}
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, fontSize:12.5, color:'var(--text-muted)' }}>
            {event.location && (
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {event.location}
              </span>
            )}
            {dateObj && (
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {dateObj.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })}
              </span>
            )}
          </div>
          {event.description && (
            <p style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:8, lineHeight:1.6, WebkitLineClamp:2, display:'-webkit-box', WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }} className="card-actions">
        <button
          onClick={onToggleSave}
          title={isSaved ? 'Remove from saved' : 'Save event'}
          style={{
            background: isSaved ? 'var(--accent-light)' : 'var(--bg-subtle)',
            color: isSaved ? 'var(--accent)' : 'var(--text-muted)',
            border: `1px solid ${isSaved ? 'rgba(217,119,6,0.3)' : 'var(--border)'}`,
            borderRadius:'var(--r-md)', padding:'8px 10px', cursor:'pointer',
            transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center',
          }}
        >
          <BookmarkIcon filled={isSaved} />
        </button>

        <button
          onClick={onRegister}
          disabled={isRegistered || isRegistering}
          style={{
            background: isRegistered ? 'var(--success-bg)' : 'var(--primary)',
            color: isRegistered ? 'var(--success)' : '#fff',
            border: isRegistered ? '1px solid var(--success-border)' : 'none',
            borderRadius:'var(--r-md)', padding:'9px 18px', fontSize:13, fontWeight:600,
            cursor: isRegistered ? 'default' : 'pointer', fontFamily:'var(--font-body)',
            whiteSpace:'nowrap', transition:'all 0.18s', opacity: isRegistering ? 0.6 : 1,
          }}
        >
          {isRegistering ? 'Registering…' : isRegistered ? '✓ Registered' : 'Register'}
        </button>
      </div>
    </div>
  )
}

/* ── Shared styles ────────────────────────────────────── */
const cardStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  padding: 'clamp(14px, 3vw, 22px) clamp(14px, 3vw, 22px)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  transition: 'all 0.2s',
  boxShadow: 'var(--shadow-sm)',
  flexWrap: 'wrap',
}

const selectStyle = {
  padding: '8px 14px',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  fontSize: 13,
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  appearance: 'none',
  WebkitAppearance: 'none',
}

const resetBtnStyle = {
  padding: '8px 14px',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  fontSize: 12.5,
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
  transition: 'all 0.15s',
  fontWeight: 500,
}