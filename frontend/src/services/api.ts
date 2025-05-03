
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

// New API calls for user settings/profile
export const getUserProfile = async (username?: string) => {
  const url = username ? `/api/users/profile/${username}` : '/api/users/profile';
  const response = await api.get(url);
  return response.data;
};

export const updateUserProfile = async (profileData: any) => {
  const response = await api.put('/api/users/profile', profileData);
  return response.data;
};

export const deleteUserAccount = async () => {
  const response = await api.delete('/api/users/account');
  return response.data;
};

export default api;
