// src/services/questions.js
import api from "./api";

// Student: get random drill questions for a course
export async function getQuickDrill(courseId, limit = 10) {
  const res = await api.get("/questions.php", {
    params: { course_id: courseId, limit },
  });
  return res.data;
}

// Admin / course_rep: list questions for a course
export async function adminListQuestions(courseId) {
  const res = await api.get("/admin/questions.php", {
    params: { course_id: courseId },
  });
  return res.data;
}

// Admin / course_rep: create a question
export async function adminCreateQuestion(payload) {
  // payload must contain course_id, question_text, options, correct_option
  const res = await api.post("/admin/questions.php", payload);
  return res.data;
}

// Student: get (or lazily generate + cache) explanation for one question
export async function getQuestionExplanation(questionId) {
  const res = await api.post("/question_explanation.php", {
    question_id: questionId,
  });
  // Expected response: { question_id, explanation, cached }
  return res.data;
}
