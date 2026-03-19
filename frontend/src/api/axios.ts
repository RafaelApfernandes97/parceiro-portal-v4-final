import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/activate');
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('mc_token');
      localStorage.removeItem('mc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
