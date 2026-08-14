import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to auto-authenticate if 401 occurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post('http://127.0.0.1:8000/api/login', {
          phone: '9840000000',
          password: 'password',
        });
        if (res.data && res.data.token) {
          localStorage.setItem('token', res.data.token);
          originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
          return api(originalRequest);
        }
      } catch (loginErr) {
        console.error('Auto login failed:', loginErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
