// src/services/drills.js
import api from "./api";

/**
 * (Optional) Start a drill session on the backend.
 * Endpoint: /drills/start.php
 *
 * Expects backend to return something like:
 *  { drill_id, title, questions: [...] }
 */
export async function startDrill(courseId, numQuestions) {
  const res = await api.post("/drills/start.php", {
    course_id: courseId,
    num_questions: numQuestions,
  });

  // Unwrap { success, data } if json_response wraps like that
  return res.data?.data ?? res.data;
}

/**
 * (Optional) Submit answers for a drill session.
 * Endpoint: /drills/submit.php
 *
 * Expects backend to return something like:
 *  { num_correct, num_questions, score }
 */
export async function submitDrill(drillId, answers) {
  const res = await api.post("/drills/submit.php", {
    drill_id: drillId,
    answers,
  });

  // Unwrap { success, data } if needed
  return res.data?.data ?? res.data;
}

/**
 * Save a completed quick drill to jp_drills.
 *
 * Used by QuickDrill.vue after the user clicks
 * "Submit & see score".
 *
 * Endpoint: /drills/complete.php
 *
 * Payload shape:
 *  {
 *    course_id: number,
 *    num_questions: number,
 *    num_correct: number,
 *    title?: string,               // e.g. "Quick drill"
 *    drill_size?: number,          // usually same as num_questions
 *    duration_seconds?: number     // timer value (optional)
 *  }
 *
 * Returns the inserted drill row (or whatever the backend sends).
 */
export async function completeDrill(payload) {
  const res = await api.post("/drills/complete.php", payload);

  // Unwrap { success, data } if your json_response helper wraps like that
  return res.data?.data ?? res.data;
}
