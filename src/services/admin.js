// src/services/admin.js
import api from "./api";

// List courses for a department (and optional level)
export async function adminListCourses({ department_id, level } = {}) {
  const res = await api.get("/admin/courses/list.php", {
    params: {
      department_id,
      level,
    },
  });
  return res.data;  // This returns the list of courses for the specified department and level
}

// Create a new course for a department
export async function adminCreateCourse(payload) {
  const res = await api.post("/admin/courses/create.php", payload);
  return res.data;
}
