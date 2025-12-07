<template>
  <section class="card theory-card">
    <!-- HEADER -->
    <div class="card-header theory-header">
      <div class="theory-header-main">
        <h2 class="theory-title">Theory practice</h2>
        <p class="card-sub theory-sub">
          Write a full theory answer and let Jabuspark grade you like an
          examiner. You’ll get a score, strengths, weaknesses, and a model
          answer.
        </p>

        <p v-if="course?.code" class="theory-meta">
          Focused on
          <strong>{{ course.code }}</strong>
          <span v-if="course?.title"> • {{ course.title }}</span>
        </p>
      </div>

      <div class="theory-header-right">
        <span class="pill theory-pill">
          <span class="pill-dot"></span>
          Essay / theory
        </span>
        <span class="theory-badge">Beta</span>
      </div>
    </div>

    <!-- QUESTION + ANSWER INPUTS -->
    <div class="theory-body">
      <div class="theory-inputs">
        <!-- Question -->
        <div class="theory-field">
          <label class="theory-label">
            Theory question
            <span class="theory-label-optional">(type or paste the question)</span>
          </label>
          <textarea
            v-model="question"
            class="textarea theory-textarea theory-textarea--question"
            rows="2"
            :maxlength="QUESTION_MAX"
            :disabled="aiLoading"
            placeholder="e.g. Discuss the stages of the cardiac cycle and explain how they are regulated."
          ></textarea>
          <div class="theory-field-footer">
            <p class="theory-hint">
              You can paste a past question or write your own. Jabuspark will
              use this exact question to grade your answer.
            </p>
            <span class="char-counter">
              {{ questionLength }}/{{ QUESTION_MAX }}
            </span>
          </div>
        </div>

        <!-- Answer -->
        <div class="theory-field">
          <label class="theory-label">
            Your answer
            <span class="theory-label-optional">(write like you’re in the exam)</span>
          </label>
          <div class="textarea-shell" :class="{ 'textarea-shell--loading': aiLoading }">
            <textarea
              v-model="answer"
              ref="answerRef"
              class="textarea theory-textarea theory-textarea--answer"
              rows="7"
              :maxlength="ANSWER_MAX"
              :disabled="aiLoading"
              placeholder="Write your full answer here. Use paragraphs, headings or numbering just like you would in the exam…"
            ></textarea>

            <div v-if="aiLoading" class="textarea-overlay">
              <span class="dot-bounce" aria-hidden="true">
                <span></span><span></span><span></span>
              </span>
              <span class="textarea-overlay-text">Jabuspark is marking your answer…</span>
            </div>
          </div>

          <div class="theory-field-footer">
            <p class="theory-hint">
              Aim for at least 2–3 solid paragraphs. Jabuspark needs enough
              content to grade you properly.
            </p>
            <span class="char-counter">
              {{ answerLength }}/{{ ANSWER_MAX }}
            </span>
          </div>
        </div>
      </div>

      <!-- ACTIONS -->
      <div class="theory-actions">
        <button
          type="button"
          class="primary-btn theory-primary-btn"
          @click="handleMark"
          :disabled="!canMark || aiLoading"
          :aria-busy="aiLoading"
        >
          <span v-if="aiLoading" class="dot-bounce" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          <span>{{ aiLoading ? "Marking your answer…" : "Mark my answer" }}</span>
        </button>

        <button
          type="button"
          class="btn btn-ghost theory-clear-btn"
          @click="resetForm"
          :disabled="aiLoading || (!questionLength && !answerLength)"
        >
          Clear
        </button>

        <p class="theory-warning">
          Theory feedback is AI-assisted and may not be perfect. Always compare
          with your lecturer’s marking guide.
        </p>
      </div>
    </div>

    <!-- ERROR -->
    <p v-if="aiError" class="error-text theory-error">
      {{ aiError }}
    </p>

    <!-- RESULT -->
    <div v-if="result" class="theory-result">
      <header class="theory-result-header">
        <div class="theory-score-block">
          <p class="theory-score-label">Your score</p>
          <div class="theory-score-main">
            <span class="theory-score-value">
              {{ result.score ?? "—" }}
              <span v-if="typeof result.score === 'number'">%</span>
            </span>
            <span
              v-if="result.grade"
              class="theory-grade-pill"
              :class="gradeClass"
            >
              {{ result.grade }}
            </span>
          </div>
          <p v-if="result.level" class="theory-score-sub">
            Performance level: <strong>{{ result.level }}</strong>
          </p>
          <p v-else-if="result.summary" class="theory-score-sub">
            {{ result.summary }}
          </p>
        </div>

        <div class="theory-result-meta">
          <p class="theory-result-meta-line">
            <span class="meta-label">Marked for:</span>
            <span class="meta-value">
              {{ course?.code || "This course" }}
            </span>
          </p>
          <p v-if="course?.title" class="theory-result-meta-line">
            <span class="meta-label">Course title:</span>
            <span class="meta-value">{{ course.title }}</span>
          </p>
          <p class="theory-result-meta-line">
            <span class="meta-label">Marked at:</span>
            <span class="meta-value">{{ formattedMarkedAt }}</span>
          </p>
        </div>
      </header>

      <div class="theory-result-grid">
        <!-- Strengths -->
        <div v-if="hasStrengths" class="theory-chip-card theory-chip-card--good">
          <h3 class="theory-chip-title">What you did well</h3>
          <ul class="theory-chip-list">
            <li
              v-for="(item, idx) in normalisedStrengths"
              :key="'s-' + idx"
              class="theory-chip-item"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Weaknesses -->
        <div v-if="hasWeaknesses" class="theory-chip-card theory-chip-card--bad">
          <h3 class="theory-chip-title">What to improve</h3>
          <ul class="theory-chip-list">
            <li
              v-for="(item, idx) in normalisedWeaknesses"
              :key="'w-' + idx"
              class="theory-chip-item"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Tips -->
        <div v-if="hasTips" class="theory-chip-card theory-chip-card--tips">
          <h3 class="theory-chip-title">Exam tips for next time</h3>
          <ul class="theory-chip-list">
            <li
              v-for="(item, idx) in normalisedTips"
              :key="'t-' + idx"
              class="theory-chip-item"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Model answer -->
      <div v-if="result.model_answer" class="theory-model-answer">
        <button
          type="button"
          class="theory-model-toggle"
          @click="modelOpen = !modelOpen"
        >
          <span>{{ modelOpen ? "Hide model answer" : "Show model answer" }}</span>
          <span class="theory-model-toggle-icon">{{ modelOpen ? "▴" : "▾" }}</span>
        </button>

        <div v-if="modelOpen" class="theory-model-body">
          <p
            class="theory-model-text"
            v-html="formattedModelAnswer"
          ></p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";
import { markTheoryAnswer } from "../services/theory"; // you'll create this

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
  course: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["toast"]);

const QUESTION_MAX = 300;
const ANSWER_MAX = 3000;

const question = ref("");
const answer = ref("");
const aiLoading = ref(false);
const aiError = ref("");
const result = ref(null);
const markedAt = ref(null);
const modelOpen = ref(false);
const answerRef = ref(null);

function showToast(message, type = "success") {
  emit("toast", { message, type });
}

const questionLength = computed(() => question.value.trim().length);
const answerLength = computed(() => answer.value.trim().length);

const canMark = computed(() => {
  // Require both fields, and a minimum answer length for quality
  return questionLength.value >= 10 && answerLength.value >= 40;
});

const formattedMarkedAt = computed(() => {
  if (!markedAt.value) return "Just now";
  const d = new Date(markedAt.value);
  if (Number.isNaN(d.getTime())) return markedAt.value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Grade colour
const gradeClass = computed(() => {
  const g = (result.value?.grade || "").toUpperCase();
  if (!g) return "";
  if (["A", "A+", "B+"].includes(g)) return "theory-grade-pill--high";
  if (["B", "C"].includes(g)) return "theory-grade-pill--mid";
  return "theory-grade-pill--low";
});

// Helpers to normalise list fields coming from backend
function normaliseToList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  // Split by line or bullet
  return String(value)
    .split(/\r?\n|•|-/)
    .map((v) => v.trim())
    .filter(Boolean);
}

const normalisedStrengths = computed(() =>
  normaliseToList(result.value?.strengths)
);
const normalisedWeaknesses = computed(() =>
  normaliseToList(result.value?.weaknesses || result.value?.weak_points)
);
const normalisedTips = computed(() =>
  normaliseToList(result.value?.tips || result.value?.recommendations)
);

const hasStrengths = computed(() => normalisedStrengths.value.length > 0);
const hasWeaknesses = computed(() => normalisedWeaknesses.value.length > 0);
const hasTips = computed(() => normalisedTips.value.length > 0);

// --- very small markdown → HTML for model answer ---
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(raw) {
  if (!raw) return "";
  let text = String(raw);

  text = escapeHtml(text);

  // headings
  text = text.replace(/^###\s+(.+)$/gm, "<strong>$1</strong><br />");
  text = text.replace(/^##\s+(.+)$/gm, "<strong>$1</strong><br />");
  text = text.replace(/^#\s+(.+)$/gm, "<strong>$1</strong><br />");

  // bold / italics
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  text = text.replace(/_([^_]+)_/g, "<em>$1</em>");

  // bullets / numbered lists
  text = text.replace(/^\s*[-*+]\s+(.+)$/gm, "• $1");
  text = text.replace(/^\s*(\d+)\.\s+(.+)$/gm, "$1) $2");

  // line breaks
  text = text.replace(/\n/g, "<br />");

  return text;
}

const formattedModelAnswer = computed(() =>
  renderMarkdown(result.value?.model_answer || "")
);

// --- actions ---
function resetForm() {
  question.value = "";
  answer.value = "";
  aiError.value = "";
  result.value = null;
  modelOpen.value = false;
}

async function handleMark() {
  aiError.value = "";
  modelOpen.value = false;

  const q = question.value.trim();
  const a = answer.value.trim();

  if (!q || !a) {
    aiError.value = "Type both a question and your full answer first.";
    showToast("Type both a question and your answer first.", "error");
    if (!a && answerRef.value) {
      answerRef.value.focus();
    }
    return;
  }

  if (a.length < 40) {
    aiError.value = "Write a bit more so Jabuspark can grade you properly.";
    showToast("Write a longer answer before marking.", "error");
    if (answerRef.value) {
      answerRef.value.focus();
    }
    return;
  }

  aiLoading.value = true;

  try {
    const payload = {
      course_id: props.courseId,
      course_code: props.course?.code || null,
      course_title: props.course?.title || null,
      question: q,
      answer: a,
    };

    const data = await markTheoryAnswer(payload);

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response from theory marker.");
    }

    // allow backend to return result nested or flat
    result.value = data.result || data;
    markedAt.value = new Date().toISOString();

    showToast("Theory answer graded.", "success");
  } catch (err) {
    console.error("Theory marking failed", err);
    aiError.value =
      err?.message ||
      "Could not mark your answer. Please check your connection and try again.";
    showToast("Could not mark your answer.", "error");
  } finally {
    aiLoading.value = false;
  }
}
</script>

<style scoped>
.theory-card {
  position: relative;
  overflow: hidden;
}

/* soft glow */
.theory-card::before {
  content: "";
  position: absolute;
  inset: -40px;
  opacity: 0.22;
  background: radial-gradient(
    circle at top left,
    rgba(79, 70, 229, 0.2),
    transparent 55%
  );
  pointer-events: none;
}

.theory-card > * {
  position: relative;
}

/* header */
.theory-header {
  align-items: flex-start;
}

.theory-header-main {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.theory-title {
  font-size: 1.02rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  color: #0f172a;
}

.theory-sub {
  font-size: 0.8rem;
  color: #6b7280;
}

.theory-meta {
  margin-top: 0.1rem;
  font-size: 0.78rem;
  color: #9ca3af;
}

.theory-meta strong {
  font-weight: 600;
  color: #4b5563;
}

.theory-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
}

/* pill */
.theory-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
  color: #4338ca;
  border-color: #e0e7ff;
  padding-inline: 0.7rem;
  box-shadow: 0 10px 25px rgba(79, 70, 229, 0.18);
  font-size: 0.7rem;
}

.pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25);
}

.theory-badge {
  font-size: 0.68rem;
  padding: 0.16rem 0.45rem;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fed7aa;
}

/* body layout */
.theory-body {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.theory-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.theory-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.theory-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4b5563;
  display: inline-flex;
  gap: 0.3rem;
  align-items: baseline;
}

.theory-label-optional {
  font-weight: 400;
  font-size: 0.74rem;
  color: #9ca3af;
}

.theory-textarea {
  font-size: 0.84rem;
}

.theory-textarea--question {
  min-height: 60px;
  resize: vertical;
}

.theory-textarea--answer {
  min-height: 150px;
  resize: vertical;
}

/* textarea loading shell */
.textarea-shell {
  position: relative;
}

.textarea-shell--loading .theory-textarea {
  opacity: 0.75;
}

.textarea-overlay {
  position: absolute;
  inset: 0.45rem 0.5rem;
  border-radius: 0.7rem;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.03),
    rgba(37, 99, 235, 0.04)
  );
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding-inline: 0.75rem;
  pointer-events: none;
}

.textarea-overlay-text {
  font-size: 0.75rem;
  color: #6b7280;
}

.theory-field-footer {
  margin-top: 0.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.theory-hint {
  font-size: 0.74rem;
  color: #9ca3af;
}

.char-counter {
  font-size: 0.74rem;
  color: #6b7280;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* actions */
.theory-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.theory-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.theory-clear-btn {
  font-size: 0.78rem;
}

.theory-warning {
  font-size: 0.72rem;
  color: #9ca3af;
}

/* loading dots */
.dot-bounce {
  display: inline-flex;
  gap: 0.2rem;
}

.dot-bounce span {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  animation: theory-bounce 0.8s infinite alternate;
}

.dot-bounce span:nth-child(2) {
  animation-delay: 0.12s;
}
.dot-bounce span:nth-child(3) {
  animation-delay: 0.24s;
}

@keyframes theory-bounce {
  from {
    transform: translateY(0);
    opacity: 0.6;
  }
  to {
    transform: translateY(-4px);
    opacity: 1;
  }
}

/* error */
.theory-error {
  margin-top: 0.4rem;
}

/* result */
.theory-result {
  margin-top: 0.9rem;
  padding: 0.8rem 0.85rem 0.1rem;
  border-radius: 0.95rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #4f46e5;
  animation: theory-fade-in 0.18s ease-out;
}

@keyframes theory-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.theory-result-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.theory-score-block {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.theory-score-label {
  font-size: 0.78rem;
  color: #6b7280;
}

.theory-score-main {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.theory-score-value {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: #111827;
}

.theory-grade-pill {
  padding: 0.14rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  border: 1px solid transparent;
}

.theory-grade-pill--high {
  background: #ecfdf3;
  color: #166534;
  border-color: #bbf7d0;
}

.theory-grade-pill--mid {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.theory-grade-pill--low {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.theory-score-sub {
  font-size: 0.78rem;
  color: #4b5563;
}

.theory-score-sub strong {
  font-weight: 600;
}

.theory-result-meta {
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.theory-result-meta-line {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.meta-label {
  font-weight: 500;
  color: #4b5563;
}

.meta-value {
  color: #111827;
}

/* result grid */
.theory-result-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.theory-chip-card {
  border-radius: 0.8rem;
  padding: 0.5rem 0.65rem;
  font-size: 0.8rem;
}

.theory-chip-card--good {
  background: #ecfdf3;
  border: 1px solid #bbf7d0;
}

.theory-chip-card--bad {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.theory-chip-card--tips {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.theory-chip-title {
  font-size: 0.78rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #111827;
}

.theory-chip-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.theory-chip-item {
  position: relative;
  padding-left: 0.9rem;
  line-height: 1.4;
}

.theory-chip-item::before {
  content: "•";
  position: absolute;
  left: 0.2rem;
  top: 0.02rem;
  font-size: 0.7rem;
}

/* model answer */
.theory-model-answer {
  margin-top: 0.1rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #e5e7eb;
}

.theory-model-toggle {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0.2rem 0.7rem;
  font-size: 0.75rem;
  background: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease;
}

.theory-model-toggle:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.theory-model-toggle-icon {
  font-size: 0.7rem;
}

.theory-model-body {
  margin-top: 0.4rem;
  padding: 0.55rem 0.6rem;
  border-radius: 0.7rem;
  background: #f9fafb;
  border: 1px dashed #e5e7eb;
}

.theory-model-text {
  font-size: 0.8rem;
  color: #374151;
  line-height: 1.5;
}

/* mobile */
@media (max-width: 640px) {
  .theory-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .theory-header-right {
    align-items: flex-start;
  }

  .theory-field-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .theory-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .theory-primary-btn,
  .theory-clear-btn {
    width: 100%;
    justify-content: center;
  }

  .theory-result-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* larger screens: 2 columns for result blocks */
@media (min-width: 768px) {
  .theory-result-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
