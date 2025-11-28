// src/services/dashboard.js
import api from "../api";

export async function getDashboardSummary() {
  const res = await api.get("/dashboard/summary.php");
  return res.data; // { user, stats, recent_drills }
}
