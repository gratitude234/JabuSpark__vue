// src/services/questions.js
import api from "./api";

// Student: get drill questions for a course (optionally for one material)
export async function getQuickDrill(courseId, numQuestions, materialId = null) {
  const params = {
    course_id: courseId,
  };

  // Only send num_questions when we actually want to limit
  // 5, 10, 20 → send the number
  // "all" / null / undefined → send nothing = full bank
  if (typeof numQuestions === "number" && numQuestions > 0) {
    params.num_questions = numQuestions;
  }

  // NEW: material-specific drill
  if (materialId && Number(materialId) > 0) {
    params.material_id = materialId;
  }

  const res = await api.get("/questions/list.php", { params });

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
