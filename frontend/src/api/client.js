import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('novabuilder_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('novabuilder_token');
      localStorage.removeItem('novabuilder_user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default client;
