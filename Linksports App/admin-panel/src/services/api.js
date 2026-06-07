import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token if exists
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me')
};

export const userService = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateStatus: (userId, status) => api.put(`/admin/users/${userId}/status`, { status }),
  verifyUser: (userId) => api.put(`/admin/users/${userId}/verify`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`)
};

export const statsService = {
  getDashboardStats: () => api.get('/admin/stats')
};

export default api;
