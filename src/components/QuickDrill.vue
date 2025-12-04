<template>
  <section class="card quick-drill-card">
    <div class="card-header quick-header">
      <!-- LEFT: Title / tags / last drill -->
      <div class="quick-header-left">
        <h2 class="quick-title">
          Quick drill
        </h2>
        <p class="card-sub quick-sub">
          {{ drillSize }} fast MCQs to test your understanding of this course.
        </p>

        <div class="quick-tags">
          <span class="quick-tag">⚡ Auto-marked</span>
          <span class="quick-tag quick-tag--secondary">
            💡 Instant explanations
          </span>
        </div>

        <div v-if="lastDrill" class="last-drill-chip">
          <span class="last-drill-label">Last drill</span>
          <span class="last-drill-score">
            {{ lastDrill.score }}/{{ lastDrill.total }}
          </span>
          <span class="last-drill-meta">
            • {{ formatDate(lastDrill.date) }}
            • {{ lastDrill.drillSize }} Q
          </span>
        </div>

        <!-- Inline-only: link to full page -->
        <button
          v-if="mode === 'inline'"
          type="button"
          class="quick-link-full"
          @click="openFullDrillPage"
        >
          Open full drill page →
        </button>
      </div>

      <!-- RIGHT: size selector / meta -->
      <div class="quick-header-right">
        <div class="quick-header-right-top">
          <span class="badge quick-badge">Practice</span>
          <span class="quick-mini-meta" v-if="!drillLoading && !questions.length">
            Ready when you are
          </span>
          <span class="quick-mini-meta" v-else-if="questions.length && !showResults">
            In progress
          </span>
          <span class="quick-mini-meta" v-else-if="showResults">
            Completed
          </span>
        </div>

        <div
          class="drill-size-switch"
          role="group"
          aria-label="Choose number of questions"
        >
          <span class="drill-size-label">Drill length</span>
          <div class="drill-size-pills">
            <button
              v-for="size in drillSizeOptions"
              :key="size"
              type="button"
              class="size-pill"
              :class="{ 'size-pill--active': drillSize === size }"
              @click="setDrillSize(size)"
              :disabled="drillLoading"
              :aria-pressed="drillSize === size"
            >
              {{ size }} Q
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="drillError" class="alert alert-error quick-alert">
      {{ drillError }}
    </div>

    <!-- Progress -->
    <div
      v-if="questions.length && !drillLoading"
      class="progress-row quick-progress-row"
    >
      <div class="quick-progress-main">
        <span class="progress-label">
          Progress: {{ answeredCount }} / {{ totalQuestions }}
          <span v-if="showResults">
            • Score: {{ score }} / {{ totalQuestions }}
          </span>
        </span>
        <span class="progress-hint" v-if="!showResults">
          Tap an option to answer — you can change answers before submitting.
        </span>
        <span class="progress-hint" v-else>
          Scroll to review explanations for each question.
        </span>
      </div>

      <div class="progress-bar quick-progress-bar">
        <div
          class="progress-bar__fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
    </div>

    <!-- No questions yet -->
    <div
      v-if="!questions.length && !drillLoading"
      class="empty-text quick-empty"
    >
      <div class="quick-empty-icon">⚡</div>
      <div class="quick-empty-body">
        <p class="quick-empty-title">
          No questions loaded yet.
        </p>
        <p class="quick-empty-copy">
          Start a quick drill to generate fresh MCQs for this course based on your materials.
        </p>
        <div class="drill-actions-inline">
          <button
            class="btn btn-primary"
            @click="startQuickDrill"
            :disabled="drillLoading"
          >
            Start {{ drillSize }}-question drill
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="drillLoading" class="spinner-area quick-spinner-area">
      <div class="spinner"></div>
      <p class="empty-text">Loading questions…</p>
    </div>

    <!-- Questions -->
    <div
      v-if="questions.length && !drillLoading"
      class="drill-body"
    >
      <ol class="question-list">
        <li
          v-for="(q, index) in questions"
          :key="q.id"
          class="question-item"
        >
          <div class="question-text">
            <span class="question-number">
              Q{{ index + 1 }}.
            </span>
            <span class="question-copy">
              {{ q.question_text }}
            </span>
          </div>

          <div class="options-grid">
            <button
              v-for="opt in ['A', 'B', 'C', 'D']"
              :key="opt"
              type="button"
              class="option-pill"
              :class="optionClass(q, opt)"
              @click="selectAnswer(q.id, opt)"
            >
              <span class="opt-label">{{ opt }}.</span>
              <span class="opt-text">
                {{
                  opt === "A"
                    ? q.option_a
                    : opt === "B"
                    ? q.option_b
                    : opt === "C"
                    ? q.option_c
                    : q.option_d
                }}
              </span>
            </button>
          </div>

          <p
            v-if="showResults && q.explanation"
            class="explanation-text"
          >
            <span class="explanation-label">Why:</span>
            <span>{{ q.explanation }}</span>
          </p>
        </li>
      </ol>

      <footer class="drill-footer">
        <div v-if="showResults" class="score-pill">
          <span class="score-pill-label">You scored</span>
          <span class="score-pill-value">
            {{ score }} / {{ totalQuestions }}
          </span>
        </div>

        <div class="actions">
          <button
            v-if="!showResults"
            class="btn btn-primary"
            @click="submitDrill"
            :disabled="!answeredCount"
          >
            Submit &amp; see score
          </button>

          <button
            v-if="showResults"
            class="btn btn-outline"
            @click="startQuickDrill"
          >
            New drill
          </button>

          <button
            class="btn btn-ghost"
            @click="resetDrill"
          >
            Clear
          </button>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { getQuickDrill, getQuestionExplanation } from "../services/questions";

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
  // 'inline' (inside CourseDetail) or 'fullscreen' (QuickDrillView)
  mode: {
    type: String,
    default: "inline",
  },
});

const emit = defineEmits(["toast"]);

const router = useRouter();

function showToast(message, type = "success") {
  emit("toast", { message, type });
}

// QUICK DRILL STATE
const drillSizeOptions = [5, 10, 20];
const drillSize = ref(10);

const drillLoading = ref(false);
const drillError = ref(null);
const questions = ref([]);
const userAnswers = ref({});
const showResults = ref(false);

// Last drill (localStorage)
const lastDrill = ref(null);

const totalQuestions = computed(() => questions.value.length);

const answeredCount = computed(() => {
  if (!questions.value.length) return 0;
  let count = 0;
  for (const q of questions.value) {
    if (userAnswers.value[q.id]) count++;
  }
  return count;
});

const progressPercent = computed(() => {
  if (!totalQuestions.value) return 0;
  return Math.round((answeredCount.value / totalQuestions.value) * 100);
});

const score = computed(() => {
  if (!showResults.value || !questions.value.length) return 0;
  let correct = 0;
  for (const q of questions.value) {
    const ans = userAnswers.value[q.id];
    if (ans && ans === q.correct_option) correct++;
  }
  return correct;
});

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function setDrillSize(size) {
  drillSize.value = size;
}

async function startQuickDrill() {
  try {
    drillLoading.value = true;
    drillError.value = null;
    showResults.value = false;
    userAnswers.value = {};
    questions.value = [];

    const data = await getQuickDrill(props.courseId, drillSize.value);
    if (!Array.isArray(data) || data.length === 0) {
      drillError.value = "No questions available for this course yet.";
      return;
    }
    questions.value = data;

    // Scroll into view when drill starts (nice on mobile)
    if (typeof window !== "undefined") {
      await nextTick();
      const el = document.querySelector(".quick-drill-card");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  } catch (err) {
    console.error(err);
    drillError.value = "Could not load quick drill. Please try again.";
    showToast("Could not load quick drill.", "error");
  } finally {
    drillLoading.value = false;
  }
}

function selectAnswer(questionId, optionKey) {
  if (showResults.value) return; // lock after submit
  userAnswers.value = {
    ...userAnswers.value,
    [questionId]: optionKey,
  };
}

function saveLastDrill() {
  const record = {
    courseId: props.courseId,
    score: score.value,
    total: totalQuestions.value,
    drillSize: drillSize.value,
    date: new Date().toISOString(),
  };

  lastDrill.value = record;

  try {
    const key = "jabuspark_drill_history";
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((r) => r.courseId !== props.courseId);
    filtered.push(record);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to save drill history", e);
  }
}

function loadLastDrill() {
  try {
    const key = "jabuspark_drill_history";
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const arr = JSON.parse(raw);
    const found = arr.find((r) => r.courseId === props.courseId);
    if (found) lastDrill.value = found;
  } catch (e) {
    console.error("Failed to load drill history", e);
  }
}

async function submitDrill() {
  if (!questions.value.length) return;

  showResults.value = true;
  saveLastDrill();
  showToast("Drill completed!", "success");

  // Lazy-load explanations only for questions that don't have one yet
  const pending = questions.value.filter(
    (q) => !q.explanation || !q.explanation.trim()
  );

  if (!pending.length) return;

  try {
    await Promise.all(
      pending.map(async (q) => {
        const data = await getQuestionExplanation(q.id);
        q.explanation = data.explanation;
      })
    );
  } catch (e) {
    console.error("Failed to fetch explanations", e);
    showToast("Some explanations could not be loaded.", "error");
  }
}

function resetDrill() {
  questions.value = [];
  userAnswers.value = {};
  showResults.value = false;
  drillError.value = null;
}

// class helper for options
function optionClass(q, opt) {
  const selected = userAnswers.value[q.id];
  if (!showResults.value) {
    return {
      selected: selected === opt,
    };
  }
  const isCorrect = q.correct_option === opt;
  const isSelected = selected === opt;

  return {
    correct: isCorrect,
    incorrect: !isCorrect && isSelected,
    selected: isSelected,
  };
}

// inline-only: open full-screen drill view
function openFullDrillPage() {
  router.push({
    path: "/quick-drill",
    query: {
      courseId: String(props.courseId),
    },
  });
}

onMounted(() => {
  loadLastDrill();
});

watch(
  () => props.courseId,
  () => {
    loadLastDrill();
    resetDrill();
  }
);
</script>

<style scoped>
.quick-drill-card {
  position: relative;
  overflow: hidden;
}

.quick-drill-card::before {
  content: "";
  position: absolute;
  top: -48px;
  right: -80px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle at top, rgba(79, 70, 229, 0.08), transparent 70%);
  pointer-events: none;
}

/* HEADER LAYOUT */
.quick-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
}

.quick-header-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.quick-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.quick-sub {
  margin-top: 0.15rem;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.35rem;
}

.quick-tag {
  font-size: 0.7rem;
  padding: 0.12rem 0.55rem;
  border-radius: 999px;
  background: #f3f4ff;
  color: #4338ca;
}

.quick-tag--secondary {
  background: #ecfeff;
  color: #0891b2;
}

.last-drill-chip {
  margin-top: 0.35rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 0.75rem;
  color: #4b5563;
}

.last-drill-label {
  font-weight: 500;
  color: #374151;
}

.last-drill-score {
  font-weight: 600;
  color: #111827;
}

.last-drill-meta {
  color: #6b7280;
}

/* small link under last drill (inline mode) */
.quick-link-full {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: #4338ca;
  text-decoration: underline;
  text-underline-offset: 2px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.quick-link-full:hover {
  color: #312e81;
}

/* RIGHT HEADER */
.quick-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-width: 180px;
}

.quick-header-right-top {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.quick-badge {
  font-size: 0.7rem;
}

.quick-mini-meta {
  font-size: 0.7rem;
  color: #6b7280;
}

/* size switch */
.drill-size-switch {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.drill-size-label {
  font-size: 0.7rem;
  color: #6b7280;
}

.drill-size-pills {
  display: flex;
  gap: 0.25rem;
  padding: 0.15rem;
  border-radius: 999px;
  background: #f3f4f6;
}

.size-pill {
  min-width: 2.5rem;
  border-radius: 999px;
  border: none;
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.size-pill:hover:enabled {
  background: #e5e7eb;
}

.size-pill--active {
  background: #4f46e5;
  color: #f9fafb;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.06);
}

.size-pill:disabled {
  opacity: 0.7;
  cursor: default;
}

/* ALERT */
.quick-alert {
  margin-top: 0.5rem;
}

/* PROGRESS */
.quick-progress-row {
  margin-top: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.quick-progress-main {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.progress-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #111827;
}

.progress-hint {
  font-size: 0.75rem;
  color: #6b7280;
}

.quick-progress-bar {
  border-radius: 999px;
  overflow: hidden;
}

/* EMPTY STATE */
.quick-empty {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.quick-empty-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.quick-empty-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.quick-empty-title {
  font-weight: 600;
  color: #111827;
}

.quick-empty-copy {
  font-size: 0.85rem;
  color: #6b7280;
}

.quick-spinner-area {
  margin-top: 0.75rem;
}

/* QUESTIONS */
.drill-body {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.question-item {
  padding: 0.8rem 0.9rem;
  border-radius: 0.75rem;
  background: #f9fafb;
}

.question-text {
  display: flex;
  gap: 0.4rem;
  align-items: flex-start;
  margin-bottom: 0.45rem;
}

.question-number {
  font-weight: 600;
  font-size: 0.85rem;
  color: #4b5563;
}

.question-copy {
  font-size: 0.9rem;
  color: #111827;
}

.options-grid {
  display: grid;
  gap: 0.35rem;
}

.option-pill {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease,
    transform 0.1s ease;
}

.option-pill:hover {
  border-color: #4f46e5;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.option-pill .opt-label {
  font-weight: 600;
  color: #4b5563;
}

.option-pill .opt-text {
  color: #111827;
}

/* answer states */
.option-pill.selected {
  border-color: #4f46e5;
  background: #eef2ff;
}

.option-pill.correct {
  border-color: #16a34a;
  background: #ecfdf3;
}

.option-pill.incorrect {
  border-color: #dc2626;
  background: #fef2f2;
}

/* EXPLANATION */
.explanation-text {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  background: #f3f4f6;
  border-left: 3px solid #4f46e5;
  color: #374151;
  display: flex;
  gap: 0.25rem;
}

.explanation-label {
  font-weight: 600;
}

/* FOOTER */
.drill-footer {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e5e7eb;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.score-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: #ecfdf3;
  border: 1px solid #bbf7d0;
  font-size: 0.8rem;
  color: #166534;
}

.score-pill-label {
  font-weight: 500;
}

.score-pill-value {
  font-weight: 700;
}

/* MOBILE */
@media (max-width: 640px) {
  .quick-header {
    flex-direction: column;
    align-items: stretch;
  }

  .quick-header-right {
    align-items: flex-start;
  }

  .drill-size-switch {
    align-items: flex-start;
  }

  .quick-empty {
    align-items: center; 
  }

  .question-item {
    padding: 0.75rem 0.75rem;
  }
}
</style>
