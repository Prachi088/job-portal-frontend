import axios from 'axios';

const API = axios.create({
    baseURL: 'https://job-portal-backend-ey3y.onrender.com'
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

API.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getJobs = () => API.get('/jobs');
export const createJob = (data) => API.post('/jobs', data);
export const searchJobs = (title) => API.get('/jobs/search', { params: { title } });
export const applyForJob = (data) => API.post('/applications', data);
export const getMyApplications = (userId) => {
    if (!userId) throw new Error('userId is required');
    return API.get(`/applications/user/${userId}`);
};
export const sendMessage = (message) => API.post('/chat', { message });