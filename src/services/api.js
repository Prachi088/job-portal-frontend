
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// ── Token getter ─────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');

// ── Token expiry helper ──────────────────────────────────────────────────────
export function isTokenExpired() {
  const token = localStorage.getItem('token');

  if (!token) return true;

  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    // FIXED
    const SKEW_MS = 30_000;

    return payload.exp * 1000 < Date.now() + SKEW_MS;

  } catch {
    return true;
  }
}

// ── Request interceptor ──────────────────────────────────────────────────────
API.interceptors.request.use((req) => {

  const token = getToken();

  if (token) {
    req.headers = req.headers || {};
    req.headers.Authorization = `Bearer ${token}`;
  }

  if (import.meta.env.DEV) {
    console.log(
      `[API] ${req.method?.toUpperCase()} ${req.url}`,
      token ? '✓ token present' : '✗ NO TOKEN'
    );
  }

  return req;
});

// ── Response interceptor ─────────────────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,

  (error) => {

    const status = error.response?.status;

    if (import.meta.env.DEV) {
      console.warn(
        `[API] ${status} error on ${error.config?.url}`,
        'skipAuthRedirect:',
        !!error.config?.skipAuthRedirect
      );
    }

    // FIXED
    // ONLY logout on 401
    if (
      status === 401 &&
      !error.config?.skipAuthRedirect
    ) {

      const currentPath =
        window.location.pathname + window.location.search;

      if (
        currentPath !== '/login' &&
        currentPath !== '/register'
      ) {
        localStorage.setItem(
          'redirectAfterLogin',
          currentPath
        );
      }

      localStorage.removeItem('token');
      localStorage.removeItem('name');
      localStorage.removeItem('role');
      localStorage.removeItem('id');

      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const registerUser = (data) =>
  API.post('/auth/register', data);

export const loginUser = (data) =>
  API.post('/auth/login', data);

// ── Jobs ─────────────────────────────────────────────────────────────────────
export const getJobs = () =>
  API.get('/jobs');

export const getJobsByRecruiter = async (recruiterId) => {

  const config = { skipAuthRedirect: true };

  try {
    return await API.get(
      `/jobs/recruiter/${recruiterId}`,
      config
    );

  } catch (error) {

    const status = error.response?.status;

    if (status === 404 || status === 405) {
      return API.get(
        `/api/jobs/recruiter/${recruiterId}`,
        config
      );
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

export const deleteJob = (id) =>
  API.delete(`/jobs/${id}`);

export const searchJobs = (title) =>
  API.get(`/jobs/search?title=${encodeURIComponent(title)}`);

export const getJobById = (id) =>
  API.get(`/jobs/${id}`);

// ── Applications ─────────────────────────────────────────────────────────────
export const applyForJob = (data) =>
  API.post('/api/applications', data);

export const getMyApplications = (userId) =>
  API.get(`/api/applications/user/${userId}`);

export const getAllApplications = () =>
  API.get('/api/applications');

export const getApplicationsByJob = (jobId) =>
  API.get(`/api/applications/job/${jobId}`);

export const updateApplicationStatus = (id, status) =>
  API.put(`/api/applications/${id}/status`, { status });

// ── AI Chat ──────────────────────────────────────────────────────────────────
export const sendMessage = (message) =>
  API.post('/chat', { message });

// ── User profile ─────────────────────────────────────────────────────────────
export const getUserById = (id) =>
  API.get(`/api/users/${id}`);

export const updateUserProfile = (id, data) =>
  API.put(`/api/users/${id}/profile`, data);

export const uploadResume = (id, file) => {

  const formData = new FormData();

  formData.append('resume', file);

  return API.post(
    `/api/users/${id}/resume`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};

export const downloadResume = (id) =>
  API.get(`/api/users/${id}/resume`, {
    responseType: 'blob',
  });

// ── Events ───────────────────────────────────────────────────────────────────
export const createEvent = (data) =>
  API.post('/api/events', data);

export const getAllEvents = () =>
  API.get('/api/events');

export const getEventsByRecruiter = (recruiterId) =>
  API.get(`/api/events/recruiter/${recruiterId}`);

export const getEventById = (id) =>
  API.get(`/api/events/${id}`);

export const deleteEvent = (id) =>
  API.delete(`/api/events/${id}`);

export const registerForEvent = (eventId, userId) =>
  API.post(`/api/events/${eventId}/register`, {
    userId,
  });

export const getEventApplications = (eventId) =>
  API.get(`/api/events/${eventId}/applications`);

export const getUserEventApplications = (userId) =>
  API.get(`/api/events/user/${userId}/applications`);

export const updateEventApplicationStatus = (
  applicationId,
  status
) =>
  API.put(
    `/api/events/applications/${applicationId}/status`,
    { status }
  );

// ── Connections ──────────────────────────────────────────────────────────────
export const getAllUsers = () =>
  API.get('/api/connections/users/all');

export const sendConnectionRequest = (
  senderId,
  receiverId
) =>
  API.post('/api/connections/request', {
    senderId: Number(senderId),
    receiverId: Number(receiverId),
  });

export const getConnectionRequests = (userId) =>
  API.get(
    `/api/connections/requests/${userId}`,
    { skipAuthRedirect: true }
  );

export const getSentRequests = (userId) =>
  API.get(
    `/api/connections/requests/sent/${userId}`,
    { skipAuthRedirect: true }
  );

export const updateConnectionRequest = (
  id,
  status
) =>
  API.put(
    `/api/connections/request/${id}`,
    { status },
    { skipAuthRedirect: true }
  );

export const getConnections = (userId) =>
  API.get(
    `/api/connections/${userId}`,
    { skipAuthRedirect: true }
  );

// ── Messages ─────────────────────────────────────────────────────────────────
export const sendMsg = (data) =>
  API.post('/api/messages', data);

export const getConversation = (user1, user2) =>
  API.get(
    `/api/messages/conversation/${user1}/${user2}`
  );

export const markMessagesRead = (
  senderId,
  receiverId
) =>
  API.put(
    `/api/messages/read/${senderId}/${receiverId}`
  );

export const getUnreadCount = (userId) =>
  API.get(`/api/messages/unread/${userId}`);

export default API;
