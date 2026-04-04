import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import JobListings from './pages/JobListings'
import RecruiterDashboard from './pages/RecruiterDashboard'
import MyApplications from './pages/MyApplications'
import ProtectedRoute from './components/ProtectedRoute'
import ChatBox from "./components/ChatBox"

function App() {

  useEffect(() => {
    const keepAlive = setInterval(() => {
      fetch('https://job-portal-2ilb.onrender.com/health')
    }, 840000) // ping every 14 mins to keep Render awake
    return () => clearInterval(keepAlive)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobListings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter"
          element={
            <ProtectedRoute>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-applications"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatBox />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}
export default App