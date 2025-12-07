// src/services/theory.js
import { getAuthToken } from "./auth"; // or inline like you did in AskJabuspark

export async function markTheoryAnswer(payload) {
  // payload: { course_id, course_code, course_title, question, answer }
  const token = getAuthToken ? getAuthToken() : localStorage.getItem("jabuspark_token");

  const res = await fetch("https://jabumarket.com.ng/api/theory_mark.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      "Theory marking failed.";
    throw new Error(msg);
  }

  return data;
}
