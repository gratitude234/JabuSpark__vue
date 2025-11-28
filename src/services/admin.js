// src/services/admin.js
import api from "./api";

// List courses for a department (and optional level)
export async function adminListCourses({ department_id, level } = {}) {
  const res = await api.get("/admin/courses.php", {
    params: {
      department_id,
      level,
    },
  });
  return res.data;
}

// Create a new course for a department
export async function adminCreateCourse(payload) {
  const res = await api.post("/admin/courses.php", payload);
  return res.data;
}
