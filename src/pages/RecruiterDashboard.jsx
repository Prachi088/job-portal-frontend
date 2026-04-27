import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobs, createJob, getAllApplications, getApplicationsByJob } from '../services/api'

export default function RecruiterDashboard() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [selectedJobApplications, setSelectedJobApplications] = useState([])
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', location: '', company: '', salary: ''
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [jobsRes, appsRes] = await Promise.all([
        getJobs(),
        getAllApplications()
      ])
      setJobs(jobsRes.data)
      setApplications(appsRes.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createJob(form)
      setSuccess(true)
      setForm({ title: '', description: '', location: '', company: '', salary: '' })
      setShowForm(false)
      fetchData()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { console.error(err) }
    setSubmitting(false)
  }

  const handleViewApplications = async (job) => {
    try {
      const response = await getApplicationsByJob(job.id)
      setSelectedJobApplications(response.data)
      setSelectedJob(job)
      setShowApplicationsModal(true)
    } catch (err) {
      console.error('Error fetching applications:', err)
    }
  }

  const handleViewApplicantProfile = (userId) => {
    // Navigate to profile page with userId parameter for viewing other users' profiles
    navigate(`/profile?userId=${userId}`)
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-50 text-blue-600 border border-blue-200'
      case 'REVIEWED':
        return 'bg-yellow-50 text-yellow-600 border border-yellow-200'
      case 'ACCEPTED':
        return 'bg-green-50 text-green-600 border border-green-200'
      default:
        return 'bg-red-50 text-red-600 border border-red-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-deep-teal-600 to-deep-teal-700 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
            <p className="text-deep-teal-100 mt-1">Manage your job postings</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-white text-deep-teal-600 font-semibold px-6 py-3 rounded-xl hover:bg-deep-teal-50 transition shadow"
          >
            {showForm ? 'Cancel' : '+ Post New Job'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Job posted successfully!
          </div>
        )}

        {/* Post Job Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-deep-teal-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Post a New Job</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Java Developer"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  placeholder="e.g. TechCorp"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Indore"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                <input
                  type="text"
                  placeholder="e.g. 5 LPA"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Describe the job role, requirements..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-deep-teal-600 hover:bg-deep-teal-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-deep-teal-200 shadow-sm">
            <p className="text-gray-500 text-sm">Total Jobs Posted</p>
            <p className="text-3xl font-bold text-deep-teal-600 mt-1">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-deep-teal-200 shadow-sm">
            <p className="text-gray-500 text-sm">Active Listings</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{jobs.length}</p>
          </div>
          <div
             className="bg-white rounded-2xl p-5 border border-deep-teal-200 shadow-sm"
          >
            <p className="text-gray-500 text-sm">Total Applications</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{applications.length}</p>
          </div>
        </div>

        {/* Job List */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Job Postings</h2>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-deep-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No jobs posted yet</p>
            <p className="text-sm mt-1">Click "Post New Job" to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl border border-deep-teal-100 shadow-sm p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                    <p className="text-deep-teal-600 font-medium">{job.company}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm text-gray-500">📍 {job.location}</span>
                      <span className="text-sm text-gray-500">💰 {job.salary}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">{job.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-green-50 text-green-600 text-xs font-medium px-3 py-1 rounded-full border border-green-200">
                      Active
                    </span>
                    <button
                      onClick={() => handleViewApplications(job)}
                      className="text-deep-teal-600 hover:text-deep-teal-700 text-sm font-medium underline"
                    >
               {applications.filter(a => a.jobId === job.id).length} applications                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Applications Modal */}
      {showApplicationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">
                  {selectedJob ? `Applications for ${selectedJob.title}` : 'All Applications'}
                </h3>
                <button
                  onClick={() => {
                    setShowApplicationsModal(false)
                    setSelectedJob(null)
                    setSelectedJobApplications([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedJobApplications.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-lg font-medium">No applications yet</p>
                  <p className="text-sm mt-1">Applications will appear here once students apply</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedJobApplications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <button
                              onClick={() => handleViewApplicantProfile(app.user?.id)}
                              className="text-lg font-semibold text-deep-teal-600 hover:text-deep-teal-700 hover:underline text-left"
                            >
                              {app.user?.name || 'Unknown User'}
                            </button>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusClass(app.status)}`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{app.user?.email}</p>
                          {app.user?.phone && <p className="text-gray-500 text-sm">📞 {app.user.phone}</p>}
                          {app.user?.skills && <p className="text-gray-500 text-sm">🛠️ {app.user.skills}</p>}
                          {app.user?.experience && <p className="text-gray-500 text-sm">💼 {app.user.experience}</p>}
                          {app.user?.education && <p className="text-gray-500 text-sm">🎓 {app.user.education}</p>}
                        </div>
                        {app.user?.resumeFileName && (
                          <button className="bg-deep-teal-50 text-deep-teal-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-deep-teal-100 transition">
                            📄 View Resume
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}