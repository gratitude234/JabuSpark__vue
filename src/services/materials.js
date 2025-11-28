// src/services/materials.js
import api from "../api";

export async function getMaterials(courseId) {
  const res = await api.get("/materials.php", {
    params: { course_id: courseId },
  });
  return res.data.materials || [];
}

// For later (course rep console)
export async function uploadMaterial(courseId, file, title = "") {
  const formData = new FormData();
  formData.append("course_id", courseId);
  formData.append("file", file);
  if (title) formData.append("title", title);

  const res = await api.post("/materials.php", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.material;
}
