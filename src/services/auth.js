// src/services/auth.js
import api from "./api";

const TOKEN_KEY = "jabuspark_token";
const USER_KEY = "jabuspark_user";

function normalizeUser(user) {
  const safe = user && typeof user === "object" ? user : {};
  return {
    ...safe,
    name: safe.name || safe.fullName || "Student",
    role: String(safe.role || "student").toLowerCase(),
  };
}

export function getAuthToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getCurrentUser() {
  if (typeof localStorage === "undefined") return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch (e) {
    console.warn("Failed to parse stored user", e);
    return null;
  }
}

export async function login(email, password) {
  const res = await api.post("/auth/login.php", { email, password });
  const token = res.data?.token || "";
  const user = normalizeUser(res.data?.user);

  if (typeof localStorage !== "undefined") {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Let app shell refresh user UI (MainShell listens)
  window.dispatchEvent(new CustomEvent("jabuspark:user-updated"));

  return user;
}

export function logout() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  window.dispatchEvent(new CustomEvent("jabuspark:user-updated"));
}

export async function fetchDepartments() {
  const res = await api.get("/departments/list.php");
  return Array.isArray(res.data) ? res.data : res.data?.departments || [];
}
