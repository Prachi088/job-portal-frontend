import { useState, useEffect } from 'react'
import { getJobs, createJob } from '../services/api'
import Navbar from '../components/Navbar'

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', location: '', company: '', salary: ''
  })

  useEffect(() => { fetchJobs() }, [])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res = await getJobs()
      setJobs(res.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createJob(form)
      setSuccess(true)
      setForm({ title: '', description: '', location: '', company: '', salary: '' })
      setShowForm(false)
      fetchJobs()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { console.error(err) }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
            <p className="text-blue-100 mt-1">Manage your job postings</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition shadow"
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Post a New Job</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Java Developer"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm">Total Jobs Posted</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm">Active Listings</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm">Total Applications</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">--</p>
          </div>
        </div>

        {/* Job List */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Job Postings</h2>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No jobs posted yet</p>
            <p className="text-sm mt-1">Click "Post New Job" to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                    <p className="text-blue-600 font-medium">{job.company}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm text-gray-500">📍 {job.location}</span>
                      <span className="text-sm text-gray-500">💰 {job.salary}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">{job.description}</p>
                  </div>
                  <span className="bg-green-50 text-green-600 text-xs font-medium px-3 py-1 rounded-full border border-green-200">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}