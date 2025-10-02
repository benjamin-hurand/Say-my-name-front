// services/api/apiUtils.ts
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const orgId = localStorage.getItem('orgId'); // <- récupère l'orga active
    if (orgId) config.headers['X-Org-Id'] = orgId;

    if (config.data instanceof FormData) {
      delete (config.headers as any)['Content-Type'];
    } else {
      (config.headers as any)['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
