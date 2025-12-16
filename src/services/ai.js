// src/services/ai.js
import api from "./api"; // use the same axios instance + token interceptor

export async function askJabuspark({ courseId, courseCode, courseTitle, question }) {
  const { data } = await api.post("/ai_chat.php", {
    courseId,
    courseCode,
    courseTitle,
    question,
  });
  return data;
}
