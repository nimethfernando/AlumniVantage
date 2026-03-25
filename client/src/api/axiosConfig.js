// src/api/axiosConfig.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

// Intercept POST/PUT/DELETE requests to attach the CSRF token
api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
    try {
      const response = await axios.get(`${BASE_URL}/api/csrf-token`, {
        withCredentials: true
      });
      config.headers['CSRF-Token'] = response.data.csrfToken;
    } catch (error) {
      console.error("Failed to fetch CSRF token", error);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;