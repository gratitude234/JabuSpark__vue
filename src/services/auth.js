// src/services/auth.js
import api from "./api";

/**
 * Login a user with email + password
 * Saves token + user to localStorage and notifies the app shell.
 */
export async function login(email, password) {
  const res = await api.post("/auth/login.php", { email, password });
  const { token, user } = res.data;

  // Save token + user for later
  localStorage.setItem("jabuspark_token", token);
  localStorage.setItem("jabuspark_user", JSON.stringify(user));

  // Let App.vue know the user changed
  window.dispatchEvent(new CustomEvent("jabuspark:user-updated"));

  return user;
}

/**
 * Logout: clear token + user and notify shell
 */
export function logout() {
  localStorage.removeItem("jabuspark_token");
  localStorage.removeItem("jabuspark_user");

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
  if (res.data?.token && res.data?.user) {
    localStorage.setItem("jabuspark_token", res.data.token);
    localStorage.setItem("jabuspark_user", JSON.stringify(res.data.user));
    window.dispatchEvent(new CustomEvent("jabuspark:user-updated"));
  }

  return res.data;
}
