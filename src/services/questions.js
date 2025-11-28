import api from "../api";

export async function getQuestions(courseId) {
  const res = await api.get(`/questions/list.php?course_id=${courseId}`);
  return res.data;
}

export async function createQuestion(payload) {
  const res = await api.post("/questions/create.php", payload);
  return res.data;
}
