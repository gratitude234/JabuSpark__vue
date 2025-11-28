// src/services/ai.js
import api from "../api";

export async function askJabuspark(courseId, message) {
  const res = await api.post("/ai_chat.php", {
    course_id: courseId,
    message,
  });
  return res.data; // { reply: "..." }
}
