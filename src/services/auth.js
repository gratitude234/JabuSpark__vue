// src/services/auth.js
import api from "./api";

const TOKEN_KEY = "jabuspark_token";
const USER_KEY = "jabuspark_user";

/**
 * Get the saved auth token from localStorage
 * Used by other services (theory, drills, etc.) to send Authorization header.
 */
export function getAuthToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

/**
 * (Optional) Get the current user object from localStorage
 * Useful anywhere you need quick access to the logged-in user.
 */
export function getCurrentUser() {
  if (typeof localStorage === "undefined") return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Failed to parse stored user", e);
    return null;
  }
}

/**
 * Login a user with email + password
 * Saves token + user to localStorage and notifies the app shell.
 */
export async function login(email, password) {
  const res = await api.post("/auth/login.php", { email, password });
  const { token, user } = res.data;

  // Save token + user for later
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Let App.vue know the user changed
  window.dispatchEvent(new CustomEvent("jabuspark:user-updated"));

  return user;
}

/**
 * Logout: clear token + user and notify shell
 */
export function logout() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  window.dispatchEvent(new CustomEvent("jabuspark:user-updated"));
}

/**
 * Fetch departments for the registration form and admin page
 * GET /departments/list.php  →  { departments: [{ id, name, faculty?, code? }, ...] }
 */
export async function fetchDepartments() {
  const res = await api.get("/departments/list.php");
  // both RegisterView and AdminCoursesView expect an array of departments
  return res.data.departments || [];
}

/**
 * Register a new student account
 * POST /auth/register.php
 * body: { name, email, password, department_id, level }
 */
export async function registerStudent(payload) {
  const res = await api.post("/auth/register.php", payload);

  // Optional: if API returns token + user, auto-login after registration
  if (res.data?.token && res.data?.user && typeof localStorage !== "undefined") {
    localStorage.setItem(TOKEN_KEY, res.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    window.dispatchEvent(new CustomEvent("jabuspark:user-updated"));
  }

  return res.data;
}
