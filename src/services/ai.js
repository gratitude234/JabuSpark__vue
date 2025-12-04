// src/services/ai.js
import apiClient from "./client"; // same axios instance you use for other API calls

export async function askJabuspark({ courseId, courseCode, courseTitle, question }) {
  const { data } = await apiClient.post("/ai_chat.php", {
    courseId,
    courseCode,
    courseTitle,
    question,
  });
  return data;
}
