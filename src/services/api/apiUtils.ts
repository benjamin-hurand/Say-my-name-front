// services/api/apiUtils.ts (or wherever your API instance is)
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// IMPORTANT: set headers per request type
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // If sending FormData, let the browser set the correct Content-Type (with boundary)
    if (config.data instanceof FormData) {
      delete (config.headers as any)['Content-Type'];
    } else {
      // default to JSON only when not FormData
      (config.headers as any)['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
