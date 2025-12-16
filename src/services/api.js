// src/services/api.js
import axios from "axios";

// Base URL for your API (Truehost / cPanel)
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://jabumarket.com.ng/api";


const api = axios.create({
  baseURL, // e.g. https://jabumarket.com.ng/api
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jabuspark_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: basic response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can do global 401 handling here later if you want
    return Promise.reject(error);
  }
);

export default api;
