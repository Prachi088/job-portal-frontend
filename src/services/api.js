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
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('name');
      localStorage.removeItem('role');
      localStorage.removeItem('id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getJobs = () => API.get('/jobs');
export const createJob = (data) => API.post('/jobs', data);
export const searchJobs = (title) => API.get(`/jobs/search?title=${title}`);
export const getJobById = (id) => API.get(`/jobs/${id}`);
export const applyForJob = (data) => API.post('/api/applications', data);
export const getMyApplications = (userId) => API.get(`/api/applications/user/${userId}`);
export const getAllApplications = () => API.get('/api/applications');
export const getApplicationsByJob = (jobId) => API.get(`/api/applications/job/${jobId}`);
export const updateApplicationStatus = (id, status) => API.put(`/api/applications/${id}/status`, { status });

// ChatController.java is mapped to @RequestMapping("/chat") — NOT "/api/chat"
// The backend security config also needs this token-authenticated, so we
// send the Bearer token (handled automatically by the request interceptor above).
export const sendMessage = (message) => API.post('/chat', { message });

// User profile APIs
export const getUserById = (id) => API.get(`/api/users/${id}`);
export const updateUserProfile = (id, data) => API.put(`/api/users/${id}/profile`, data);
export const uploadResume = (id, file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return API.post(`/api/users/${id}/resume`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const downloadResume = (id) => API.get(`/api/users/${id}/resume`, { responseType: 'blob' });

// Event APIs
export const createEvent = (data) => API.post('/api/events', data);
export const getAllEvents = () => API.get('/api/events');
export const getEventsByRecruiter = (recruiterId) => API.get(`/api/events/recruiter/${recruiterId}`);
export const getEventById = (id) => API.get(`/api/events/${id}`);
export const deleteEvent = (id) => API.delete(`/api/events/${id}`);
export const registerForEvent = (eventId, userId) => API.post(`/api/events/${eventId}/register`, { userId });
export const getEventApplications = (eventId) => API.get(`/api/events/${eventId}/applications`);
export const getUserEventApplications = (userId) => API.get(`/api/events/user/${userId}/applications`);
export const updateEventApplicationStatus = (applicationId, status) => API.put(`/api/events/applications/${applicationId}/status`, { status });