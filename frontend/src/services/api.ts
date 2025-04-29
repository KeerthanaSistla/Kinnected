import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('kinnected_user');
      localStorage.removeItem('kinnected_isLoggedIn');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getUserRelations = async (userId: string) => {
  const response = await api.get(`/api/connections/relations/${userId}`);
  return response.data;
};

export default api;
