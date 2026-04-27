import { useState, useEffect } from 'react'
import { getMyApplications, getJobs } from '../services/api'
import { useAuth } from '../context/AuthContext'

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

  const statusColor = (status) => {
    switch (status) {
      case 'APPLIED':  return 'bg-deep-teal-50 text-deep-teal-600 border-deep-teal-200'
      case 'ACCEPTED': return 'bg-green-50 text-green-600 border-green-200'
      case 'REJECTED': return 'bg-red-50 text-red-600 border-red-200'
      default:         return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-deep-teal-600 to-deep-teal-700 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">My Applications</h1>
          <p className="text-deep-teal-100 text-lg">Track all your job applications</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-deep-teal-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8 text-deep-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 font-medium">Total Applied</p>
            </div>
            <p className="text-4xl font-bold text-deep-teal-600">{applications.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 font-medium">Accepted</p>
            </div>
            <p className="text-4xl font-bold text-green-600">
              {applications.filter(a => a.status === 'ACCEPTED').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 font-medium">Pending</p>
            </div>
            <p className="text-4xl font-bold text-indigo-600">
              {applications.filter(a => a.status === 'APPLIED').length}
            </p>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-deep-teal-600 border-t-transparent rounded-full animate-spin"></div>
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
                <div key={app.id} className="bg-white rounded-2xl border border-deep-teal-100 shadow-lg p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 flex-1">
                      <div className="w-14 h-14 bg-deep-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-deep-teal-600 font-bold text-xl">
                          {job?.company?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{job?.title || "Unknown Job"}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-deep-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <p className="text-deep-teal-600 font-medium">{job?.company || "-"}</p>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>📍 {job?.location || "-"}</span>
                          <span>💰 {job?.salary || "-"}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-4 py-2 rounded-full border ${statusColor(app.status)} shadow-sm`}>
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