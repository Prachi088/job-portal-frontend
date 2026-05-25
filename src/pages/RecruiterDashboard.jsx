import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getJobsByRecruiter, createJob, deleteJob, getApplicationsByJob, updateApplicationStatus } from '../services/api'

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  APPLIED:  { bg: '#EEF2FF', text: '#4F46E5', border: 'rgba(79,70,229,0.25)',  label: 'Applied'  },
  ACCEPTED: { bg: '#ECFDF5', text: '#059669', border: 'rgba(5,150,105,0.25)',   label: 'Accepted' },
  REJECTED: { bg: '#FEF2F2', text: '#DC2626', border: 'rgba(220,38,38,0.25)',   label: 'Rejected' },
  REVIEWED: { bg: '#FFFBEB', text: '#D97706', border: 'rgba(217,119,6,0.25)',   label: 'Reviewed' },
}
const getStatusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.APPLIED

// ── Component ──────────────────────────────────────────────────────────────────

export default function RecruiterDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const recruiterId = user?.id

  // FIX #3: detect when the session has no resolvable numeric ID
  const idMissing = !recruiterId || recruiterId === 'null' || recruiterId === 'undefined'

  // ── State ──────────────────────────────────────────────────────────────────
  const [jobs, setJobs]                   = useState([])
  const [appCountMap, setAppCountMap]     = useState({})   // jobId → count
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [submitting, setSubmitting]       = useState(false)
  const [deletingJobId, setDeletingJobId] = useState(null)
  const [success, setSuccess]             = useState(false)
  const [error, setError]                 = useState('')
  const [fetchError, setFetchError]       = useState('')   // FIX #2: surface API errors
  const [form, setForm]                   = useState({
    title: '', description: '', location: '', company: '', salary: '', type: ''
  })

  // Modal state
  const [showModal, setShowModal]             = useState(false)
  const [selectedJob, setSelectedJob]         = useState(null)
  const [modalApps, setModalApps]             = useState([])
  const [modalLoading, setModalLoading]       = useState(false)
  const [updatingAppId, setUpdatingAppId]     = useState(null)

  // ── Fetch ONLY this recruiter's jobs ───────────────────────────────────────
  // Removed: getAllJobs() fallback, localStorage caching, mergeJobs logic.
  // We only call getJobsByRecruiter — no other jobs will ever appear.
  const fetchJobs = useCallback(async () => {
    if (idMissing) { setLoading(false); return }
    setLoading(true)
    setFetchError('')
    try {
      const res = await getJobsByRecruiter(recruiterId)
      const myJobs = Array.isArray(res.data) ? res.data : []
      setJobs(myJobs)

      const counts = {}
      await Promise.allSettled(
        myJobs.map(async (job) => {
          try {
            const appsRes = await getApplicationsByJob(job.id)
            counts[job.id] = Array.isArray(appsRes.data) ? appsRes.data.length : 0
          } catch {
            counts[job.id] = 0
          }
        })
      )
      setAppCountMap(counts)
    } catch (err) {
      console.error('[RecruiterDashboard] fetchJobs error:', err)
      const status = err.response?.status
      if (status === 401 || status === 403) {
        setFetchError('Session expired or unauthorized. Please sign in again.')
      } else if (status !== 404) {
        setFetchError('Could not load your jobs. Check your connection and try again.')
      }
      toast.error('Could not load your jobs.')
    }
    setLoading(false)
  }, [recruiterId, idMissing])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  // ── Post Job ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!recruiterId) {
      const msg = 'Please sign in again as a recruiter.'
      setError(msg); toast.error(msg); return
    }
    setSubmitting(true)
    try {
      const payload = { ...form, recruiterId }
      const res = await createJob(payload)
      // FIX #5: If the backend returns a non-object (e.g. a plain string error),
      // do NOT create a fake local job. Instead re-fetch so the list stays
      // in sync with what is actually persisted.
      if (!res.data || typeof res.data !== 'object') {
        await fetchJobs()
      } else {
        const created = { ...payload, ...res.data, recruiterId }
        setJobs((prev) => [created, ...prev])
        setAppCountMap((prev) => ({ ...prev, [created.id]: 0 }))
      }
      setSuccess(true)
      toast.success('Job posted!')
      setForm({ title: '', description: '', location: '', company: '', salary: '', type: '' })
      setShowForm(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Could not post job.'
      setError(msg); toast.error(msg)
    }
    setSubmitting(false)
  }

  // ── Delete Job ─────────────────────────────────────────────────────────────
  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return
    setDeletingJobId(job.id)
    try {
      if (job.id && !String(job.id).startsWith('local-')) await deleteJob(job.id)
      setJobs((prev) => prev.filter((j) => j.id !== job.id))
      setAppCountMap((prev) => { const m = { ...prev }; delete m[job.id]; return m })
      toast.success('Job deleted!')
    } catch {
      toast.error('Could not delete job.')
    }
    setDeletingJobId(null)
  }

  // ── Open modal: fetch full applicant details for selected job ──────────────
  const handleViewApplications = async (job) => {
    setSelectedJob(job)
    setModalApps([])
    setShowModal(true)
    setModalLoading(true)
    try {
      const res = await getApplicationsByJob(job.id)
      // API returns enriched objects: { id, jobId, userId, status, user: { name, email, phone, skills, ... } }
      setModalApps(Array.isArray(res.data) ? res.data : [])
    } catch {
      toast.error('Could not load applications.')
    }
    setModalLoading(false)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedJob(null)
    setModalApps([])
  }

  // ── Accept / Reject application ────────────────────────────────────────────
  const handleUpdateStatus = async (appId, status) => {
    setUpdatingAppId(appId)
    try {
      await updateApplicationStatus(appId, status)
      // Reflect change immediately in modal without refetching
      setModalApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status } : a))
      )
      // Re-fetch counts so the job card count stays accurate
      if (selectedJob) {
        const appsRes = await getApplicationsByJob(selectedJob.id)
        setAppCountMap((prev) => ({
          ...prev,
          [selectedJob.id]: Array.isArray(appsRes.data) ? appsRes.data.length : prev[selectedJob.id],
        }))
      }
      toast.success(`Application ${status.toLowerCase()}!`)
    } catch {
      toast.error('Could not update status.')
    }
    setUpdatingAppId(null)
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalApps = Object.values(appCountMap).reduce((s, c) => s + c, 0)

  // ── Render ─────────────────────────────────────────────────────────────────

  // FIX #3: surface auth issue instead of showing misleading empty state
  if (idMissing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Session Issue</h2>
          <p className="text-gray-500 text-sm">
            Your user ID could not be resolved from the current session.
            Please sign out and sign back in to continue.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-deep-teal-600 to-deep-teal-700 text-white py-8 sm:py-10 md:py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Recruiter Dashboard</h1>
            <p className="text-deep-teal-100 mt-1 text-sm sm:text-base">
              Manage your job postings and review applicants
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError('') }}
            className="bg-white text-deep-teal-600 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-deep-teal-50 transition shadow text-sm sm:text-base whitespace-nowrap"
          >
            {showForm ? 'Cancel' : '+ Post New Job'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-4 py-6 sm:py-8">

        {/* Alerts */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Job posted successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}
        {/* FIX #2: show API fetch errors prominently instead of silent empty state */}
        {fetchError && (
          <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {fetchError}
            <button onClick={fetchJobs} className="ml-auto underline font-medium hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* Post Job Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-deep-teal-100 p-4 sm:p-6 mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6">Post a New Job</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text" placeholder="e.g. Java Developer"
                  className="w-full px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition text-sm"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text" placeholder="e.g. TechCorp"
                  className="w-full px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition text-sm"
                  value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text" placeholder="e.g. Indore"
                  className="w-full px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition text-sm"
                  value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                <input
                  type="text" placeholder="e.g. 5 LPA"
                  className="w-full px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition text-sm"
                  value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select
                  className="w-full px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition text-sm bg-white"
                  value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Describe the job role, requirements..."
                  rows={4}
                  className="w-full px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition resize-none text-sm"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit" disabled={submitting}
                  className="w-full bg-deep-teal-600 hover:bg-deep-teal-700 text-white font-semibold py-2 sm:py-3 rounded-xl transition disabled:opacity-50 text-sm"
                >
                  {submitting ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats — counts derived from recruiter's own data only */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-deep-teal-200 shadow-sm">
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Jobs Posted</p>
            <p className="text-2xl sm:text-3xl font-bold text-deep-teal-600 mt-2">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-deep-teal-200 shadow-sm">
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Active Listings</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-deep-teal-200 shadow-sm col-span-2 md:col-span-1">
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Applications</p>
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-2">
              {loading ? '—' : totalApps}
            </p>
          </div>
        </div>

        {/* Job List */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Job Postings</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-deep-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium">No jobs posted yet</p>
            <p className="text-sm mt-1">Click "+ Post New Job" to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => {
              const count = appCountMap[job.id] ?? 0
              return (
                <div key={job.id} className="bg-white rounded-2xl border border-deep-teal-100 shadow-sm p-5 sm:p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                        {job.type && (
                          <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full">
                            {job.type}
                          </span>
                        )}
                      </div>
                      <p className="text-deep-teal-600 font-medium text-sm">{job.company}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {job.location && <span className="text-sm text-gray-500">📍 {job.location}</span>}
                        {job.salary   && <span className="text-sm text-gray-500">💰 {job.salary}</span>}
                      </div>
                      {job.description && (
                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">{job.description}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="bg-green-50 text-green-600 text-xs font-medium px-3 py-1 rounded-full border border-green-200">
                        Active
                      </span>

                      {/* Applications count — click to open modal */}
                      <button
                        onClick={() => handleViewApplications(job)}
                        className="text-deep-teal-600 hover:text-deep-teal-700 text-sm font-semibold underline underline-offset-2 transition"
                      >
                        {count} application{count !== 1 ? 's' : ''} →
                      </button>

                      <button
                        onClick={() => handleDeleteJob(job)}
                        disabled={deletingJobId === job.id}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-40 transition"
                      >
                        {deletingJobId === job.id ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Deleting…
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Applications Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">

            {/* Modal header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-start gap-4 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Applicants for{' '}
                  <span className="text-deep-teal-600">{selectedJob?.title}</span>
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  {selectedJob?.company} · {selectedJob?.location}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-5 sm:p-6">
              {modalLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-deep-teal-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : modalApps.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-medium">No applications yet</p>
                  <p className="text-sm mt-1">Applications will show here once students apply</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modalApps.map((app) => {
                    const st = getStatusStyle(app.status)
                    const isUpdating = updatingAppId === app.id
                    return (
                      <div
                        key={app.id}
                        className="border border-gray-200 rounded-2xl p-4 sm:p-5 hover:border-deep-teal-200 transition"
                      >
                        {/* Top row: avatar + name + status badge */}
                        <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm shrink-0"
                              style={{ background: st.bg, color: st.text }}
                            >
                              {(app.user?.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <button
                                onClick={() => navigate(`/profile?userId=${app.user?.id}`)}
                                className="font-semibold text-deep-teal-600 hover:text-deep-teal-700 hover:underline text-left text-sm sm:text-base"
                              >
                                {app.user?.name || 'Unknown'}
                              </button>
                              <p className="text-gray-400 text-xs mt-0.5">{app.user?.email}</p>
                            </div>
                          </div>
                          <span
                            className="text-xs font-semibold px-3 py-1 rounded-full border shrink-0"
                            style={{ background: st.bg, color: st.text, borderColor: st.border }}
                          >
                            {st.label}
                          </span>
                        </div>

                        {/* Applicant details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-gray-500 mb-4 pl-1">
                          {app.user?.phone      && <p>📞 {app.user.phone}</p>}
                          {app.user?.skills     && <p className="sm:col-span-2">🛠️ {app.user.skills}</p>}
                          {app.user?.experience && <p className="sm:col-span-2 whitespace-pre-line">💼 {app.user.experience}</p>}
                          {app.user?.education  && <p className="sm:col-span-2">🎓 {app.user.education}</p>}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                          {app.user?.resumeFileName && (
                            <button
                              onClick={() => navigate(`/profile?userId=${app.user?.id}`)}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-deep-teal-50 text-deep-teal-600 rounded-lg hover:bg-deep-teal-100 transition"
                            >
                              📄 View Resume
                            </button>
                          )}
                          {app.status !== 'ACCEPTED' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                            >
                              {isUpdating ? '...' : '✓ Accept'}
                            </button>
                          )}
                          {app.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                            >
                              {isUpdating ? '...' : '✗ Reject'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal footer summary */}
            {!modalLoading && modalApps.length > 0 && (
              <div className="px-5 sm:px-6 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
                <p className="text-xs text-gray-400">
                  {modalApps.length} applicant{modalApps.length !== 1 ? 's' : ''} ·{' '}
                  {modalApps.filter((a) => a.status === 'ACCEPTED').length} accepted ·{' '}
                  {modalApps.filter((a) => a.status === 'REJECTED').length} rejected
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}