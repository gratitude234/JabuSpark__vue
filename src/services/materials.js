// src/services/materials.js
import api from "./api";

// Get materials for a course
export async function getMaterials(courseId) {
  const res = await api.get("/materials.php", {
    params: { course_id: courseId },
  });
  return res.data;
}

// Upload a new material (admin / course rep)
export async function uploadMaterial({ courseId, file, title }) {
  const formData = new FormData();
  formData.append("course_id", courseId);
  formData.append("title", title || file.name);
  formData.append("file", file);

  const res = await api.post("/materials_upload.php", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data; // newly created material
}
