import { useState, useEffect } from 'react'
import { getMyApplications, getJobs } from '../services/api'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'  // ✅ added

export default function MyApplications() {
  const { user } = useAuth()  // ✅ get real logged-in user
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [appsRes, jobsRes] = await Promise.all([
        getMyApplications(user?.id),  // ✅ real userId, not hardcoded 1
        getJobs()
      ])
      setApplications(appsRes.data)
      setJobs(jobsRes.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const getJob = (jobId) => jobs.find(j => j.id === jobId)

  const statusColor = (status) => {
    switch (status) {
      case 'APPLIED': return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'ACCEPTED': return 'bg-green-50 text-green-600 border-green-200'
      case 'REJECTED': return 'bg-red-50 text-red-600 border-red-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-blue-100 mt-1">Track all your job applications</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm">Total Applied</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{applications.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm">Accepted</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {applications.filter(a => a.status === 'ACCEPTED').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">
              {applications.filter(a => a.status === 'APPLIED').length}
            </p>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No applications yet</p>
            <p className="text-sm mt-1">Start applying for jobs!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => {
              const job = getJob(app.jobId)
              return (
                <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-lg">
                          {job?.company?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{job?.title}</h3>
                        <p className="text-blue-600 font-medium">{job?.company}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-sm text-gray-500">📍 {job?.location}</span>
                          <span className="text-sm text-gray-500">💰 {job?.salary}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusColor(app.status)}`}>
                      {app.status}
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