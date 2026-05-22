import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: "application/json",
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("hr_token"); // ← ganti key
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Tambah interceptor 401 ───────────────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hr_token');
      localStorage.removeItem('hr_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;