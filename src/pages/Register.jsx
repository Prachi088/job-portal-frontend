import { useState } from 'react'
import { registerUser, uploadResume, loginUser } from '../services/api'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' })
  const [resume, setResume] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const userData = await registerUser(form)
      const userId = userData.data.id

      // Upload resume if student and resume is provided
      if (form.role === 'STUDENT' && resume) {
        await uploadResume(userId, resume)
      }

      // Auto-login after registration
      const res = await loginUser({ email: form.email, password: form.password })
      login({
        token: res.data.token,
        name: res.data.name,
        role: res.data.role,
        id: res.data.id,
      })

      if (String(res.data.role).toUpperCase().replace(/^ROLE_/, '') === 'RECRUITER') {
        navigate('/recruiter')
      } else {
        navigate('/jobs')
      }

    } catch (err) {
      setError(err.response?.data || 'Registration failed. Email may already exist!')
    }
    setLoading(false)
  }

  const handleResumeChange = (e) => {
    const file = e.target.files[0]
    if (file && file.size > 5 * 1024 * 1024) {
      setError('Resume file size must be less than 5MB')
      return
    }
    setResume(file)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-teal-50 to-deep-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7">

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-deep-teal-600 text-white rounded-3xl mb-4 shadow-lg">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium text-gray-800 mb-1">Create Account</h1>
          <p className="text-gray-600 text-sm">Join the SATI Alumni Portal</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 focus:border-transparent transition"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 focus:border-transparent transition"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-teal-500 focus:border-transparent transition"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'STUDENT' })}
                className={`py-3 px-3 rounded-xl border-2 font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
                  form.role === 'STUDENT'
                    ? 'border-deep-teal-600 bg-deep-teal-50 text-deep-teal-700 shadow-md'
                    : 'border-gray-300 text-gray-600 hover:border-deep-teal-400 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Job Seeker
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'RECRUITER' })}
                className={`py-3 px-3 rounded-xl border-2 font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
                  form.role === 'RECRUITER'
                    ? 'border-deep-teal-600 bg-deep-teal-50 text-deep-teal-700 shadow-md'
                    : 'border-gray-300 text-gray-600 hover:border-deep-teal-400 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Recruiter
              </button>
            </div>
          </div>

          {/* Resume Upload for Students */}
          {form.role === 'STUDENT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume (Optional)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-deep-teal-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="resume-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-deep-teal-600 hover:text-deep-teal-500 focus-within:outline-none">
                      <span>Upload your resume</span>
                      <input id="resume-upload" name="resume" type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 5MB</p>
                  {resume && (
                    <p className="text-sm text-green-600 font-medium">Selected: {resume.name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-deep-teal-600 hover:bg-deep-teal-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg text-sm"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-5 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-deep-teal-600 font-semibold hover:underline hover:text-deep-teal-700 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
