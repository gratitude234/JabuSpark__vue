// src/services/courses.js
import api from "../api";

// Get all courses for the logged-in student
export async function getCourses() {
  // IMPORTANT: point directly to list.php
  const res = await api.get("/courses/list.php");
  return res.data; // list.php already returns an array of courses
}

// Convenience helper: get a single course by ID
export async function getCourse(id) {
  const courses = await getCourses();
  const numId = Number(id);
  return courses.find((c) => Number(c.id) === numId) || null;
}

// (Optional) leave these for later when you implement admin/rep tools
export async function createCourse(payload) {
  const res = await api.post("/courses/create.php", payload);
  return res.data;
}

export async function deleteCourse(id) {
  const res = await api.delete(`/courses/delete.php?id=${id}`);
  return res.data;
}
