// src/services/drills.js
import api from "./api";

export async function startDrill(courseId, numQuestions) {
  const res = await api.post("/drills/start.php", {
    course_id: courseId,
    num_questions: numQuestions,
  });
  return res.data; // { drill_id, title, questions: [...] }
}

export async function submitDrill(drillId, answers) {
  const res = await api.post("/drills/submit.php", {
    drill_id: drillId,
    answers,
  });
  return res.data; // { num_correct, num_questions, score }
}
