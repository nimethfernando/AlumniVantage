// src/api/axiosConfig.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true // Required to send cookies (like the JWT and CSRF session)
});

// Intercept POST/PUT/DELETE requests to attach the CSRF token
api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
    try {
      // Ask the backend for a fresh token
      const response = await axios.get('http://localhost:3000/api/csrf-token', {
        withCredentials: true
      });
      // Attach the token to the header exactly as defined in your swagger.json
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