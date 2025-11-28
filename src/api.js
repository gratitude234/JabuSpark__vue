import axios from "axios";

const api = axios.create({
  baseURL: "https://jabumarket.com.ng/api",
});

// attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jabuspark_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
