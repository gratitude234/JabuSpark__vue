<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <RouterLink to="/admin/courses" class="back-link">
        ← Back to courses
      </RouterLink>

      <h1 class="page-title">
        {{ course?.title || "Manage questions" }}
      </h1>
      <p class="page-sub">
        <span v-if="course?.code">{{ course.code }}</span>
        <span v-if="course?.level"> • {{ course.level }} level</span>
      </p>
    </div>

    <div class="layout">
      <!-- LEFT: Question form -->
      <section class="card">
        <div class="card-header">
          <div>
            <h2>Add new question</h2>
            <p class="card-sub">
              Create MCQs for this course. Students will see them in “Quick drill”.
            </p>
          </div>
        </div>

        <div v-if="formError" class="alert alert-error">{{ formError }}</div>
        <div v-if="formSuccess" class="alert alert-success">{{ formSuccess }}</div>

        <form class="form" @submit.prevent="handleSubmit">
          <label class="field">
            <span class="label">Question</span>
            <textarea
              v-model="form.question_text"
              rows="3"
              class="input textarea"
              placeholder="Type the question stem here…"
              required
            ></textarea>
          </label>

          <div class="options-grid">
            <label class="field">
              <span class="label">Option A</span>
              <input
                v-model="form.option_a"
                type="text"
                class="input"
                required
              />
            </label>

            <label class="field">
              <span class="label">Option B</span>
              <input
                v-model="form.option_b"
                type="text"
                class="input"
                required
              />
            </label>

            <label class="field">
              <span class="label">Option C</span>
              <input
                v-model="form.option_c"
                type="text"
                class="input"
                required
              />
            </label>

            <label class="field">
              <span class="label">Option D</span>
              <input
                v-model="form.option_d"
                type="text"
                class="input"
                required
              />
            </label>
          </div>

          <div class="field-row">
            <label class="field">
              <span class="label">Correct option</span>
              <select v-model="form.correct_option" class="input" required>
                <option disabled value="">Select correct option</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </label>
          </div>

          <label class="field">
            <span class="label">Explanation (optional)</span>
            <textarea
              v-model="form.explanation"
              rows="2"
              class="input textarea"
              placeholder="Short explanation to show after answering."
            ></textarea>
          </label>

          <button type="submit" class="primary-btn" :disabled="submitting">
            <span v-if="submitting">Saving…</span>
            <span v-else>Save question</span>
          </button>
        </form>
      </section>

      <!-- RIGHT: Existing questions -->
      <section class="card">
        <div class="card-header">
          <div>
            <h2>Question bank</h2>
            <p class="card-sub">
              {{ questions.length }} question{{ questions.length === 1 ? "" : "s" }}
              currently saved for this course.
            </p>
          </div>
        </div>

        <div v-if="loadingQuestions" class="empty-text">
          Loading questions…
        </div>

        <div v-else-if="!questions.length" class="empty-text">
          No questions saved yet. Add your first question on the left.
        </div>

        <ul v-else class="question-list">
          <li
            v-for="(q, index) in questions"
            :key="q.id"
            class="question-item"
          >
            <div class="question-head">
              <span class="question-number">Q{{ index + 1 }}</span>
              <span class="question-text">{{ q.question_text }}</span>
            </div>

            <div class="question-options">
              <span :class="['opt', q.correct_option === 'A' ? 'opt-correct' : '']">
                A. {{ q.option_a }}
              </span>
              <span :class="['opt', q.correct_option === 'B' ? 'opt-correct' : '']">
                B. {{ q.option_b }}
              </span>
              <span :class="['opt', q.correct_option === 'C' ? 'opt-correct' : '']">
                C. {{ q.option_c }}
              </span>
              <span :class="['opt', q.correct_option === 'D' ? 'opt-correct' : '']">
                D. {{ q.option_d }}
              </span>
            </div>

            <p v-if="q.explanation" class="question-explanation">
              <strong>Explanation:</strong> {{ q.explanation }}
            </p>

            <p class="question-meta">
              Saved on {{ formatDate(q.created_at) }}
            </p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { getCourse } from "../services/courses";
import {
  adminListQuestions,
  adminCreateQuestion,
} from "../services/questions";

const route = useRoute();
const courseId = Number(route.params.id);

const course = ref(null);
const questions = ref([]);

const loadingCourse = ref(false);
const loadingQuestions = ref(false);

const form = ref({
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "",
  explanation: "",
});

const submitting = ref(false);
const formError = ref("");
const formSuccess = ref("");

// helpers
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function loadCourse() {
  try {
    loadingCourse.value = true;
    course.value = await getCourse(courseId);
  } catch (err) {
    console.error(err);
  } finally {
    loadingCourse.value = false;
  }
}

async function loadQuestions() {
  try {
    loadingQuestions.value = true;
    questions.value = await adminListQuestions(courseId);
  } catch (err) {
    console.error(err);
  } finally {
    loadingQuestions.value = false;
  }
}

function resetForm() {
  form.value = {
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "",
    explanation: "",
  };
}

async function handleSubmit() {
  formError.value = "";
  formSuccess.value = "";

  if (!form.value.correct_option) {
    formError.value = "Select the correct option.";
    return;
  }

  try {
    submitting.value = true;

    const payload = {
      ...form.value,
      course_id: courseId,
    };

    const created = await adminCreateQuestion(payload);
    // prepend to list
    questions.value = [created, ...questions.value];

    formSuccess.value = "Question saved.";
    resetForm();
  } catch (err) {
    console.error(err);
    formError.value =
      "Could not save question. Please check your connection and try again.";
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadCourse();
  loadQuestions();
});
</script>

<style scoped>
.page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 3rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.back-link {
  font-size: 0.8rem;
  color: #6366f1;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  font-size: 1.7rem;
  font-weight: 700;
  color: #111827;
  margin-top: 0.4rem;
}

.page-sub {
  margin-top: 0.1rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1.2fr);
  gap: 1.5rem;
}

.card {
  background: #ffffff;
  border-radius: 1.25rem;
  border: 1px solid #e5e7eb;
  padding: 1.25rem 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.card-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.card-sub {
  font-size: 0.85rem;
  color: #6b7280;
}

.empty-text {
  font-size: 0.85rem;
  color: #6b7280;
}

/* form */
.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #4b5563;
}

.input {
  border-radius: 0.9rem;
  border: 1px solid #d1d5db;
  padding: 0.55rem 0.75rem;
  font-size: 0.85rem;
  width: 100%;
}

.textarea {
  resize: vertical;
  min-height: 70px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

/* alerts */
.alert {
  font-size: 0.8rem;
  padding: 0.45rem 0.75rem;
  border-radius: 0.8rem;
  margin-bottom: 0.5rem;
}

.alert-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #ecfdf3;
  color: #166534;
  border: 1px solid #bbf7d0;
}

/* button */
.primary-btn {
  border-radius: 999px;
  border: none;
  padding: 0.55rem 1.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffffff;
  background: #4f46e5;
  cursor: pointer;
  align-self: flex-start;
}

.primary-btn[disabled] {
  opacity: 0.7;
  cursor: default;
}

/* question list */
.question-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.question-item {
  border-top: 1px solid #f3f4f6;
  padding-top: 0.6rem;
}

.question-item:first-of-type {
  border-top: none;
}

.question-head {
  display: flex;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #111827;
  margin-bottom: 0.35rem;
}

.question-number {
  font-weight: 600;
  color: #4b5563;
}

.question-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem 0.6rem;
  font-size: 0.8rem;
  color: #4b5563;
}

.opt {
  padding: 0.15rem 0.35rem;
  border-radius: 999px;
}

.opt-correct {
  background: #ecfdf3;
  color: #166534;
}

.question-explanation {
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: #4b5563;
}

.question-meta {
  margin-top: 0.2rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* responsive */
@media (max-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .options-grid,
  .question-options {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
