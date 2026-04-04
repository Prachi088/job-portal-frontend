 import { useState, useEffect } from 'react'
import { getJobs, searchJobs, applyForJob } from '../services/api'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function JobListings() {
  const { user } = useAuth()  // ✅ moved to top level - hooks rule fix
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(null)
  const [applied, setApplied] = useState([])

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res = await getJobs()
      setJobs(res?.data || [])
    } catch (err) {
      console.error("Error fetching jobs:", err)
      setJobs([])
    }
    setLoading(false)
  }

  const handleSearch = async (e) => {
    const val = e.target.value
    setSearch(val)
    try {
      if (!val.trim()) {
        fetchJobs()
      } else {
        const res = await searchJobs(val)
        setJobs(res?.data || [])
      }
    } catch (err) {
      console.error("Search error:", err)
      setJobs([])
    }
  }

  const handleApply = async (jobId) => {
    if (!jobId) return
    setApplying(jobId)
    try {
      const userId = user?.id  // ✅ using user from top-level hook, no hook inside function
      await applyForJob({ userId, jobId })
      setApplied(prev => [...prev, jobId])
    } catch (err) {
      console.error("Apply error:", err)
      alert("Failed to apply")
    }
    setApplying(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 text-center">
        <h1 className="text-3xl font-bold mb-2">
          Find Your Dream Job
        </h1>
        <p className="text-blue-100 mb-6">
          Explore hundreds of opportunities
        </p>
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={handleSearch}
          className="w-full max-w-lg px-5 py-3 rounded-xl text-gray-800 outline-none"
        />
      </div>

      {/* Jobs */}
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-lg font-semibold mb-4">
          {jobs.length} Jobs Available
        </h2>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No jobs found
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              if (!job) return null

              return (
                <div
                  key={job.id}
                  className="bg-white p-5 rounded-xl shadow-sm border flex justify-between items-center"
                >
                  {/* Job Info */}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {job.title || "No Title"}
                    </h3>
                    <p className="text-blue-600">
                      {job.company || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {job.location || "-"} • {job.salary || "-"}
                    </p>
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={applying === job.id || applied.includes(job.id)}
                    className={`px-4 py-2 rounded-lg text-sm transition ${
                      applied.includes(job.id)
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {applying === job.id
                      ? 'Applying...'
                      : applied.includes(job.id)
                      ? 'Applied'
                      : 'Apply'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}