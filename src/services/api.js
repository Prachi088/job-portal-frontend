import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers = req.headers || {};
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // Only wipe the token and redirect to /login on auth failures for requests
    // that have NOT opted out via skipAuthRedirect. Connection/notification
    // endpoints all use skipAuthRedirect: true so a token expiry there shows
    // a graceful error rather than kicking the user out unexpectedly.
    if ((status === 401 || status === 403) && !error.config?.skipAuthRedirect) {
      localStorage.removeItem('token');
      localStorage.removeItem('name');
      localStorage.removeItem('role');
      localStorage.removeItem('id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser    = (data) => API.post('/auth/login', data);

// ── Jobs ──────────────────────────────────────────────────────────────────────
// Fetches from /jobs (not /api/jobs) matching JobController's @RequestMapping.
export const getJobs = () => API.get('/jobs');

export const getJobsByRecruiter = async (recruiterId) => {
  const config = { skipAuthRedirect: true };
  try {
    return await API.get(`/jobs/recruiter/${recruiterId}`, config);
  } catch (error) {
    const status = error.response?.status;
    if (status === 404 || status === 405) {
      return API.get(`/api/jobs/recruiter/${recruiterId}`, config);
    }
    throw error;
  }
};

export const createJob = async (data) => {
  const config = { skipAuthRedirect: true };
  try {
    return await API.post('/jobs', data, config);
  } catch (error) {
    const status = error.response?.status;
    if (status === 404 || status === 405) {
      return API.post('/api/jobs', data, config);
    }
    throw error;
  }
};

export const deleteJob   = (id)    => API.delete(`/jobs/${id}`);
export const searchJobs  = (title) => API.get(`/jobs/search?title=${encodeURIComponent(title)}`);
export const getJobById  = (id)    => API.get(`/jobs/${id}`);

// ── Applications ──────────────────────────────────────────────────────────────
export const applyForJob             = (data)           => API.post('/api/applications', data);
export const getMyApplications       = (userId)         => API.get(`/api/applications/user/${userId}`);
export const getAllApplications       = ()               => API.get('/api/applications');
export const getApplicationsByJob    = (jobId)          => API.get(`/api/applications/job/${jobId}`);
export const updateApplicationStatus = (id, status)     =>
  API.put(`/api/applications/${id}/status`, { status });

// ── AI Chat ───────────────────────────────────────────────────────────────────
// ChatController is at /chat (not /api/chat). The Bearer token is sent
// automatically by the request interceptor.
export const sendMessage = (message) => API.post('/chat', { message });

// ── User profile ──────────────────────────────────────────────────────────────
export const getUserById       = (id)       => API.get(`/api/users/${id}`);
export const updateUserProfile = (id, data) => API.put(`/api/users/${id}/profile`, data);

export const uploadResume = (id, file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return API.post(`/api/users/${id}/resume`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const downloadResume = (id) =>
  API.get(`/api/users/${id}/resume`, { responseType: 'blob' });

// ── Events ────────────────────────────────────────────────────────────────────
export const createEvent              = (data)                    => API.post('/api/events', data);
export const getAllEvents              = ()                        => API.get('/api/events');
export const getEventsByRecruiter     = (recruiterId)             => API.get(`/api/events/recruiter/${recruiterId}`);
export const getEventById             = (id)                      => API.get(`/api/events/${id}`);
export const deleteEvent              = (id)                      => API.delete(`/api/events/${id}`);
export const registerForEvent         = (eventId, userId)         => API.post(`/api/events/${eventId}/register`, { userId });
export const getEventApplications     = (eventId)                 => API.get(`/api/events/${eventId}/applications`);
export const getUserEventApplications = (userId)                  => API.get(`/api/events/user/${userId}/applications`);
export const updateEventApplicationStatus = (applicationId, status) =>
  API.put(`/api/events/applications/${applicationId}/status`, { status });

// ── Connections ───────────────────────────────────────────────────────────────

// List every user for the Connect / Discover page (public endpoint — no auth needed)
export const getAllUsers = () => API.get('/api/connections/users/all');

// Send a connection request.
// IMPORTANT: the Spring controller expects { senderId: Long, receiverId: Long }.
// We coerce both IDs to numbers here so JSON serialisation produces integers,
// not strings — otherwise Spring's @RequestBody Map<String, Long> will fail to
// deserialise the values and return a 400.
export const sendConnectionRequest = (senderId, receiverId) =>
  API.post(
    '/api/connections/request',
    { senderId: Number(senderId), receiverId: Number(receiverId) },
    { skipAuthRedirect: true }
  );

// Incoming pending requests for the logged-in user (Notifications page).
// skipAuthRedirect: true — a 401 here must NOT wipe the token and send the
// user to /login; the caller handles the error gracefully.
export const getConnectionRequests = (userId) =>
  API.get(`/api/connections/requests/${userId}`, { skipAuthRedirect: true });

// Outgoing pending requests sent BY the logged-in user (ConnectPage badge sync).
// Falls back gracefully if the backend hasn't been deployed yet.
export const getSentRequests = (userId) =>
  API.get(`/api/connections/requests/sent/${userId}`, { skipAuthRedirect: true });

// Accept or reject a connection request.
export const updateConnectionRequest = (id, status) =>
  API.put(`/api/connections/request/${id}`, { status }, { skipAuthRedirect: true });

// Get all accepted connections for a user (Connections page + chat eligibility).
// skipAuthRedirect: true so a brief token hiccup doesn't log the user out
// while browsing their connections list.
export const getConnections = (userId) =>
  API.get(`/api/connections/${userId}`, { skipAuthRedirect: true });

// ── Messages ──────────────────────────────────────────────────────────────────
// sendMsg posts to /api/messages (the Message entity endpoint).
// sendMessage (above) posts to /chat (the Groq AI endpoint).
// Both names are exported so existing callers don't need updating.
export const sendMsg = (data) => API.post('/api/messages', data);
export const getConversation  = (user1, user2) => API.get(`/api/messages/conversation/${user1}/${user2}`);
export const markMessagesRead = (senderId, receiverId) => API.put(`/api/messages/read/${senderId}/${receiverId}`);
export const getUnreadCount   = (userId) => API.get(`/api/messages/unread/${userId}`);