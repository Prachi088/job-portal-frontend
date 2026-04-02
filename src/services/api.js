import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8080'
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getJobs = () => API.get('/jobs');
export const createJob = (data) => API.post('/jobs', data);
export const searchJobs = (title) => API.get(`/jobs/search?title=${title}`);
export const applyForJob = (data) => API.post('/applications', data);
export const getMyApplications = (userId) => API.get(`/applications/user/${userId}`);
export const sendMessage = (message) => {
  return API.post('/chat', { message });
};