// src/services/dashboard.js
import api from "./api";

/**
 * Get the dashboard summary for the logged-in user.
 *
 * The PHP helper `json_response()` usually wraps the payload like:
 *   { success: true, data: { user, stats, recent_drills, ... } }
 *
 * This function unwraps that so the Vue component receives the plain object:
 *   { user, stats, recent_drills, ... }
 */
export async function getDashboardSummary() {
  const res = await api.get("/dashboard/summary.php");

  // If backend returns { success, data: {...} }, use .data;
  // otherwise fall back to the raw payload.
  const payload = res.data?.data ?? res.data;

  return payload; // { user, stats, recent_drills, ... }
}
