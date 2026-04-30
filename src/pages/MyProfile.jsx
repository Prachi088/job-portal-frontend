import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getUserById, updateUserProfile, uploadResume, downloadResume } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function MyProfile() {
  const [searchParams] = useSearchParams()
  const { user: authUser } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', skills: '', experience: '', education: '',
    company: '', currentRole: '', linkedinUrl: '', website: ''
  })

  const userId = searchParams.get('userId') || authUser?.id || localStorage.getItem('id')
  const userRole = user?.role || authUser?.role || localStorage.getItem('role')
  const isViewingOtherProfile = searchParams.get('userId') !== null

  const syncProfileState = (profile) => {
    setUser(profile)
    setForm({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || '',
      skills: profile.skills || '',
      experience: profile.experience || '',
      education: profile.education || '',
      company: profile.company || '',
      currentRole: profile.currentRole || '',
      linkedinUrl: profile.linkedinUrl || '',
      website: profile.website || ''
    })
  }

  const loadUserProfile = async (id) => {
    const response = await getUserById(id)
    return response.data
  }

  const refreshUserProfile = async () => {
    if (!userId) {
      setError('Unable to load profile because no user is signed in.')
      setLoading(false)
      return
    }

    setError('')
    try {
      const profile = await loadUserProfile(userId)
      syncProfileState(profile)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err.response?.data?.message || err.response?.data || 'Failed to load profile information.')
    }
    setLoading(false)
  }

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('Unable to load profile because no user is signed in.')
        setLoading(false)
        return
      }

      setError('')
      try {
        const profile = await loadUserProfile(userId)
        syncProfileState(profile)
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError(err.response?.data?.message || err.response?.data || 'Failed to load profile information.')
      }
      setLoading(false)
    }

    fetchProfile()
  }, [userId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userId) {
      setError('Unable to save profile because no user is signed in.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await updateUserProfile(userId, form)
      setSuccess(true)
      setEditing(false)
      await refreshUserProfile()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err.response?.data?.message || err.response?.data || 'Failed to update profile.')
    }
    setSubmitting(false)
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError('')
    try {
      await uploadResume(userId, file)
      setSuccess(true)
      await refreshUserProfile()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error uploading resume:', err)
      setError(err.response?.data?.message || err.response?.data || 'Failed to upload resume.')
    }
  }

  const handleResumeDownload = async () => {
    try {
      const response = await downloadResume(userId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', user.resumeFileName || 'resume.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Error downloading resume:', err)
      setError(err.response?.data?.message || err.response?.data || 'Failed to download resume.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-deep-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-deep-teal-600 to-deep-teal-700 text-white py-8 sm:py-10 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{isViewingOtherProfile ? `${user?.name}'s Profile` : 'My Profile'}</h1>
          <p className="text-deep-teal-100 mt-1 text-sm sm:text-base">{isViewingOtherProfile ? 'View profile information' : 'Manage your professional information'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-4 py-6 sm:py-8">

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Profile updated successfully!
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-deep-teal-100 p-6">

          {/* Basic Info */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
              {!isViewingOtherProfile && (
                <button
                  onClick={() => {
                    setEditing(!editing)
                    setError('')
                  }}
                  className="text-deep-teal-600 hover:text-deep-teal-700 font-medium underline"
                >
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-800 font-medium">{user?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-800">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-800 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          {!isViewingOtherProfile && editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Edit Profile Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Enter your address"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    placeholder="e.g. Java, React, Python"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition resize-none"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    placeholder="Describe your work experience"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition resize-none"
                    value={form.education}
                    onChange={(e) => setForm({ ...form, education: e.target.value })}
                    placeholder="Describe your educational background"
                  />
                </div>

                {/* Recruiter specific fields */}
                {userRole === 'RECRUITER' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="Your company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                        value={form.currentRole}
                        onChange={(e) => setForm({ ...form, currentRole: e.target.value })}
                        placeholder="Your current position"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                      <input
                        type="url"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                        value={form.linkedinUrl}
                        onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 transition"
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-deep-teal-600 hover:bg-deep-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setError('')
                    setForm({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                      address: user?.address || '',
                      skills: user?.skills || '',
                      experience: user?.experience || '',
                      education: user?.education || '',
                      company: user?.company || '',
                      currentRole: user?.currentRole || '',
                      linkedinUrl: user?.linkedinUrl || '',
                      website: user?.website || ''
                    })
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Display Profile */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user?.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-800">{user.phone}</p>
                  </div>
                )}
                {user?.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <p className="text-gray-800">{user.address}</p>
                  </div>
                )}
                {user?.skills && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                    <p className="text-gray-800">{user.skills}</p>
                  </div>
                )}
                {user?.experience && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                    <p className="text-gray-800 whitespace-pre-line">{user.experience}</p>
                  </div>
                )}
                {user?.education && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                    <p className="text-gray-800 whitespace-pre-line">{user.education}</p>
                  </div>
                )}

                {/* Recruiter specific display */}
                {userRole === 'RECRUITER' && (
                  <>
                    {user?.company && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <p className="text-gray-800">{user.company}</p>
                      </div>
                    )}
                    {user?.currentRole && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                        <p className="text-gray-800">{user.currentRole}</p>
                      </div>
                    )}
                    {user?.linkedinUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                        <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-deep-teal-600 hover:underline">
                          {user.linkedinUrl}
                        </a>
                      </div>
                    )}
                    {user?.website && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-deep-teal-600 hover:underline">
                          {user.website}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Resume Section - Only for students */}
          {userRole === 'STUDENT' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resume</h3>
              {user?.resumeFileName ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-gray-700">{user.resumeFileName}</span>
                  </div>
                  <button
                    onClick={handleResumeDownload}
                    className="bg-deep-teal-50 text-deep-teal-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-deep-teal-100 transition"
                  >
                    Download
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-3">{isViewingOtherProfile ? 'No resume uploaded' : 'No resume uploaded yet'}</p>
                  {!isViewingOtherProfile && (
                    <label className="cursor-pointer bg-deep-teal-50 text-deep-teal-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-deep-teal-100 transition inline-block">
                      Upload Resume
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
              {!isViewingOtherProfile && editing && user?.resumeFileName && (
                <div className="mt-4">
                  <label className="cursor-pointer bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition inline-block">
                    Update Resume
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
