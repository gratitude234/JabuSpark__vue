// src/services/api.js
import axios from "axios";

// Change this to your real API base if needed
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://jabumarket.com.ng/api", // your cPanel API root
  withCredentials: false,
});

// Attach token automatically (same token you use for dashboard/courses)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jabuspark_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
