import { useState, useEffect, useCallback } from 'react'
import { getJobs, searchJobs, applyForJob, getAllEvents, registerForEvent } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function JobListings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('jobs')
  const [jobs, setJobs] = useState([])
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(null)
  const [applied, setApplied] = useState([])
  const [registeredEvents, setRegisteredEvents] = useState([])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getJobs()
      setJobs(res?.data || [])
    } catch (err) {
      console.error("Error fetching jobs:", err)
      setJobs([])
    }
    setLoading(false)
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAllEvents()
      setEvents(res?.data || [])
    } catch (err) {
      console.error("Error fetching events:", err)
      setEvents([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs()
    } else {
      fetchEvents()
    }
  }, [activeTab, fetchJobs, fetchEvents])

  const handleSearch = async (e) => {
    const val = e.target.value
    setSearch(val)
    try {
      if (!val.trim()) {
        if (activeTab === 'jobs') {
          fetchJobs()
        } else {
          fetchEvents()
        }
      } else {
        if (activeTab === 'jobs') {
          const res = await searchJobs(val)
          setJobs(res?.data || [])
        } else {
          // For events, filter locally since we don't have search API yet
          const allEvents = await getAllEvents()
          const filteredEvents = allEvents.data.filter(event =>
            event.title.toLowerCase().includes(val.toLowerCase()) ||
            event.description.toLowerCase().includes(val.toLowerCase())
          )
          setEvents(filteredEvents)
        }
      }
    } catch (err) {
      console.error("Search error:", err)
      if (activeTab === 'jobs') setJobs([])
    }
  }

  const handleApply = async (jobId) => {
    if (!jobId) return
    setApplying(jobId)
    try {
      const userId = user?.id
      await applyForJob({ userId, jobId })
      setApplied(prev => [...prev, jobId])
    } catch (err) {
      console.error("Apply error:", err)
      alert("Failed to apply")
    }
    setApplying(null)
  }

  const handleRegisterForEvent = async (eventId) => {
    if (!eventId) return
    setApplying(eventId)
    try {
      const userId = user?.id
      await registerForEvent(eventId, userId)
      setRegisteredEvents(prev => [...prev, eventId])
    } catch (err) {
      console.error("Registration error:", err)
      alert("Failed to register for event")
    }
    setApplying(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-r from-deep-teal-600 to-deep-teal-700 text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Find Your Dream Job</h1>
        <p className="text-deep-teal-100 mb-8 text-lg">Explore hundreds of opportunities and career events</p>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 rounded-xl p-1 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'jobs'
                  ? 'bg-white text-deep-teal-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'events'
                  ? 'bg-white text-deep-teal-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Events
            </button>
          </div>
        </div>

        <div className="relative max-w-lg mx-auto">
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={handleSearch}
            className="w-full pl-12 pr-5 py-4 rounded-xl text-gray-800 outline-none shadow-lg text-lg"
          />
        </div>
      </div>

      {/* Jobs/Events */}
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-lg font-semibold mb-4">
          {activeTab === 'jobs' ? `${jobs.length} Jobs Available` : `${events.length} Events Available`}
        </h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-deep-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (activeTab === 'jobs' ? jobs.length === 0 : events.length === 0) ? (
          <div className="text-center py-10 text-gray-500">
            No {activeTab} found
          </div>
        ) : activeTab === 'jobs' ? (
          <div className="space-y-4">
            {jobs.map((job) => {
              if (!job) return null
              return (
                <div
                  key={job.id}
                  className="bg-white p-6 rounded-2xl shadow-md border-deep-teal-100 border hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-800 mb-1">{job.title || "No Title"}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-deep-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-deep-teal-600 font-medium">{job.company || "Unknown"}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location || "-"}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          {job.salary || "-"}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={applying === job.id || applied.includes(job.id)}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
                        applied.includes(job.id)
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-deep-teal-600 hover:bg-deep-teal-700 text-white'
                      }`}
                    >
                      {applying === job.id ? 'Applying...' : applied.includes(job.id) ? '✓ Applied' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              if (!event) return null
              return (
                <div
                  key={event.id}
                  className="bg-white p-6 rounded-2xl shadow-md border-deep-teal-100 border hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-800 mb-1">{event.title || "No Title"}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-deep-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m0 0l-2-2m2 2l2-2m6-6v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 012 2z" />
                        </svg>
                        <p className="text-deep-teal-600 font-medium">{event.organizer || "Unknown"}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location || "-"}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m0 0l-2-2m2 2l2-2m6-6v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 012 2z" />
                          </svg>
                          {new Date(event.eventDate).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                      {event.requirements && (
                        <p className="text-gray-500 text-sm"><strong>Requirements:</strong> {event.requirements}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleRegisterForEvent(event.id)}
                      disabled={applying === event.id || registeredEvents.includes(event.id)}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
                        registeredEvents.includes(event.id)
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-deep-teal-600 hover:bg-deep-teal-700 text-white'
                      }`}
                    >
                      {applying === event.id ? 'Registering...' : registeredEvents.includes(event.id) ? '✓ Registered' : 'Register'}
                    </button>
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