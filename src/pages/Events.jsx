import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  createEvent,
  getEventsByRecruiter,
  getEventApplications,
  updateEventApplicationStatus,
  deleteEvent,           // FIX #6: was never imported — events couldn't be deleted
} from '../services/api'

export default function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [selectedEventApplications, setSelectedEventApplications] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingEventId, setDeletingEventId] = useState(null)  // FIX #6: delete state
  const [success, setSuccess] = useState(false)
  const [fetchError, setFetchError] = useState('')              // FIX #2: track API errors
  const [form, setForm] = useState({
    title: '', description: '', location: '', eventDate: '', organizer: '', requirements: ''
  })

  const recruiterId = user?.id

  // ── FIX #3: Detect when recruiter ID is missing vs. genuine empty list ──────
  // A null/undefined recruiterId means auth state is broken (JWT missing `id`
  // claim and no stored id). We surface this rather than silently showing
  // "No events created yet", which is completely misleading.
  const idMissing = !recruiterId || recruiterId === 'null' || recruiterId === 'undefined'

  const fetchEvents = useCallback(async () => {
    if (idMissing) {
      setLoading(false)
      return
    }
    setLoading(true)
    setFetchError('')
    try {
      const response = await getEventsByRecruiter(recruiterId)
      setEvents(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Error fetching events:', err)
      // FIX #2: previously only console.error'd — user saw empty state with no clue why
      const status = err.response?.status
      if (status === 401 || status === 403) {
        setFetchError('Session expired or unauthorized. Please sign in again.')
      } else if (status === 404) {
        // 404 on a list endpoint typically means "no records" — treat as empty
        setEvents([])
      } else {
        setFetchError('Could not load your events. Check your connection and try again.')
      }
      toast.error('Failed to load events.')
    }
    setLoading(false)
  }, [recruiterId, idMissing])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (idMissing) {
      toast.error('Please sign in again as a recruiter.')
      return
    }
    setSubmitting(true)
    try {
      const eventData = {
        ...form,
        recruiterId,
        eventDate: new Date(form.eventDate).toISOString()
      }
      await createEvent(eventData)
      setSuccess(true)
      setForm({ title: '', description: '', location: '', eventDate: '', organizer: '', requirements: '' })
      setShowForm(false)
      fetchEvents()
      toast.success('Event created successfully!')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error creating event:', err)
      const msg = err.response?.data?.message || err.response?.data || 'Could not create event.'
      toast.error(msg)
    }
    setSubmitting(false)
  }

  // ── FIX #6: Delete event handler (was completely missing) ───────────────────
  const handleDeleteEvent = async (event) => {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    setDeletingEventId(event.id)
    try {
      await deleteEvent(event.id)
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
      toast.success('Event deleted.')
    } catch (err) {
      console.error('Error deleting event:', err)
      toast.error('Could not delete event.')
    }
    setDeletingEventId(null)
  }

  const handleViewApplications = async (event) => {
    try {
      const response = await getEventApplications(event.id)
      setSelectedEventApplications(Array.isArray(response.data) ? response.data : [])
      setSelectedEvent(event)
      setShowApplicationsModal(true)
    } catch (err) {
      console.error('Error fetching event applications:', err)
      toast.error('Could not load registrations.')
    }
  }

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      await updateEventApplicationStatus(applicationId, status)
      if (selectedEvent) {
        const response = await getEventApplications(selectedEvent.id)
        setSelectedEventApplications(Array.isArray(response.data) ? response.data : [])
      }
      toast.success(`Status updated to ${status.toLowerCase()}.`)
    } catch (err) {
      console.error('Error updating application status:', err)
      toast.error('Could not update status.')
    }
  }

  // ── FIX #3: Render a clear auth-error state when ID is missing ──────────────
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
            Please sign out and sign back in to fix this.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-deep-teal-600 to-deep-teal-700 text-white py-8 sm:py-10 md:py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Events Management</h1>
            <p className="text-deep-teal-100 mt-1 text-sm sm:text-base">Create and manage career events</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-white text-deep-teal-600 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-deep-teal-50 transition shadow text-sm sm:text-base whitespace-nowrap"
          >
            {showForm ? 'Cancel' : '+ Create Event'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-4 py-6 sm:py-8">

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Event created successfully!
          </div>
        )}

        {/* FIX #2: Show API fetch error instead of silent empty state */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {fetchError}
            <button
              onClick={fetchEvents}
              className="ml-auto underline font-medium hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Create Event Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-deep-teal-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Create New Event</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Tech Career Fair 2024"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Conference Hall, Tech Park"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
                <input
                  type="text"
                  placeholder="e.g. TechCorp HR Team"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                  value={form.organizer}
                  onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Describe the event, what students can expect..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                <textarea
                  placeholder="Any prerequisites or requirements for attendees..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition resize-none"
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-deep-teal-600 hover:bg-deep-teal-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Creating Event...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Events</h2>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-deep-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : events.length === 0 && !fetchError ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No events created yet</p>
            <p className="text-sm mt-1">Click "Create Event" to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl border border-deep-teal-100 shadow-sm p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                    <p className="text-deep-teal-600 font-medium">{event.organizer}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm text-gray-500">📍 {event.location}</span>
                      <span className="text-sm text-gray-500">📅 {new Date(event.eventDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">{event.description}</p>
                    {event.requirements && (
                      <p className="text-gray-500 text-sm mt-1">
                        <strong>Requirements:</strong> {event.requirements}
                      </p>
                    )}
                  </div>
                  {/* FIX #6: Added delete button alongside view registrations */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="bg-green-50 text-green-600 text-xs font-medium px-3 py-1 rounded-full border border-green-200">
                      Active
                    </span>
                    <button
                      onClick={() => handleViewApplications(event)}
                      className="text-deep-teal-600 hover:text-deep-teal-700 text-sm font-medium underline"
                    >
                      View Registrations
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event)}
                      disabled={deletingEventId === event.id}
                      className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-40 transition"
                    >
                      {deletingEventId === event.id ? (
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Applications Modal */}
      {showApplicationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">
                  Registrations for {selectedEvent?.title}
                </h3>
                <button
                  onClick={() => {
                    setShowApplicationsModal(false)
                    setSelectedEvent(null)
                    setSelectedEventApplications([])
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
              {selectedEventApplications.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-lg font-medium">No registrations yet</p>
                  <p className="text-sm mt-1">Registrations will appear here once students sign up</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedEventApplications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">{app.user?.name || 'Unknown User'}</h4>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              app.status === 'REGISTERED' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                              app.status === 'ATTENDED' ? 'bg-green-50 text-green-600 border border-green-200' :
                              'bg-red-50 text-red-600 border border-red-200'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{app.user?.email}</p>
                          {app.user?.phone && <p className="text-gray-500 text-sm">📞 {app.user.phone}</p>}
                          {app.user?.skills && <p className="text-gray-500 text-sm">🛠️ {app.user.skills}</p>}
                          <p className="text-gray-500 text-sm">📅 Registered: {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          {app.status !== 'ATTENDED' && (
                            <button
                              onClick={() => handleUpdateApplicationStatus(app.id, 'ATTENDED')}
                              className="bg-green-50 text-green-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition"
                            >
                              Mark Attended
                            </button>
                          )}
                          {app.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleUpdateApplicationStatus(app.id, 'CANCELLED')}
                              className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
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