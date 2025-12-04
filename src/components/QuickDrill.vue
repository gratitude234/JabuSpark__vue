<!-- src/components/QuickDrill.vue -->
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

    <!-- Sticky header: progress + mini-map (FULLSCREEN ONLY) -->
    <div
      v-if="questions.length && !drillLoading && mode === 'fullscreen'"
      class="quick-sticky-header"
    >
      <!-- Progress -->
      <div class="progress-row quick-progress-row">
        <div class="quick-progress-main">
          <span class="progress-label">
            Progress: {{ answeredCount }} / {{ totalQuestions }}
            <span v-if="showResults">
              • Score: {{ score }} / {{ totalQuestions }}
            </span>
          </span>
          <span class="progress-hint" v-if="!showResults && !isInstantMode">
            Tap an option to answer — you can change answers before submitting.
          </span>
          <span class="progress-hint" v-else-if="!showResults && isInstantMode">
            Tap an option to answer — you’ll see correct/incorrect instantly.
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

      <!-- Question mini-map -->
      <div class="question-nav-row">
        <button
          v-for="(q, index) in questions"
          :key="q.id"
          type="button"
          class="question-nav-dot"
          :class="questionNavClass(q)"
          @click="scrollToQuestion(index)"
        >
          {{ index + 1 }}
        </button>
      </div>

      <!-- Timer (fullscreen mode only) -->
      <div class="timer-row">
        <span class="timer-label">Time</span>
        <span class="timer-value">
          {{ formattedTime }}
        </span>
        <span class="timer-hint">
          (Keyboard: A–D / 1–4, Enter to submit)
        </span>
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

    <!-- Questions + footer -->
    <div
      v-if="questions.length && !drillLoading"
      class="drill-body"
    >
      <!-- 🔄 Explanations loading indicator (after submit, end-mode) -->
      <div
        v-if="showResults && explanationsLoading && !isInstantMode"
        class="spinner-area explanations-spinner"
      >
        <div class="spinner"></div>
        <p class="empty-text">Generating explanations…</p>
      </div>

      <ol class="question-list">
        <li
          v-for="(q, index) in questions"
          :key="q.id"
          class="question-item"
          :ref="el => setQuestionRef(el, index)"
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

          <!-- 🧠 Explanations:
               - END MODE: show after submit (showResults)
               - INSTANT MODE: show as soon as explanation is fetched -->
          <p
            v-if="(isInstantMode || showResults) && q.explanation"
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
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import { useRouter } from "vue-router";
import { getQuickDrill, getQuestionExplanation } from "../services/questions";
import { completeDrill } from "../services/drills"; // ✅ save completed drills to backend

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
  // 🔑 NEW: how to show feedback
  feedbackMode: {
    type: String,
    default: "end",
    validator: (v) => v === "instant" || v === "end",
  },
});

const emit = defineEmits(["toast", "completed", "progress"]);

const router = useRouter();

const isInstantMode = computed(() => props.feedbackMode === "instant");

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

// NEW: per-question result for instant mode: { [id]: 'correct' | 'incorrect' }
const questionResults = ref({});

// Last drill (localStorage)
const lastDrill = ref(null);

// For question scrolling
const questionRefs = ref([]);

// Explanations loading (used for END mode bulk fetch)
const explanationsLoading = ref(false);

// Timer
const timerSeconds = ref(0);
const timerRunning = ref(false);
let timerId = null;

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

// ✅ score is always computable (used in both modes)
const score = computed(() => {
  if (!questions.value.length) return 0;
  let correct = 0;
  for (const q of questions.value) {
    const ans = userAnswers.value[q.id];
    if (ans && ans === q.correct_option) correct++;
  }
  return correct;
});

// First unanswered question index (for keyboard shortcuts + external progress)
const currentQuestionIndex = computed(() => {
  if (!questions.value.length) return -1;
  const idx = questions.value.findIndex((q) => !userAnswers.value[q.id]);
  return idx === -1 ? questions.value.length - 1 : idx;
});

// 🔃 Emit progress to parent (QuickDrillView)
function emitProgress(state = "active") {
  if (!questions.value.length) {
    emit("progress", {
      current: 0,
      total: 0,
      state,
    });
    return;
  }

  emit("progress", {
    current: currentQuestionIndex.value + 1,
    total: questions.value.length,
    state,
  });
}

// Timer formatted mm:ss
const formattedTime = computed(() => {
  const total = timerSeconds.value;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

function startTimerIfFullscreen() {
  if (props.mode !== "fullscreen") return;
  stopTimer();
  timerSeconds.value = 0;
  timerRunning.value = true;

  if (typeof window === "undefined") return;

  timerId = window.setInterval(() => {
    timerSeconds.value++;
  }, 1000);
}

function stopTimer() {
  timerRunning.value = false;
  if (timerId !== null && typeof window !== "undefined") {
    window.clearInterval(timerId);
    timerId = null;
  }
}

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
    questionRefs.value = [];
    explanationsLoading.value = false;
    questionResults.value = {};
    stopTimer();
    timerSeconds.value = 0;

    const data = await getQuickDrill(props.courseId, drillSize.value);
    if (!Array.isArray(data) || data.length === 0) {
      drillError.value = "No questions available for this course yet.";
      emitProgress("idle");
      return;
    }
    questions.value = data;

    // Start timer for fullscreen drills
    startTimerIfFullscreen();

    // Emit initial progress: at question 1 of N
    emitProgress("active");

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
    emitProgress("error");
  } finally {
    drillLoading.value = false;
  }
}

async function selectAnswer(questionId, optionKey) {
  // END MODE: don’t allow changing after results are shown
  if (!isInstantMode.value && showResults.value) return;

  userAnswers.value = {
    ...userAnswers.value,
    [questionId]: optionKey,
  };

  const q = questions.value.find((x) => x.id === questionId);

  if (q && isInstantMode.value) {
    // ✅ Mark this question immediately as correct / incorrect
    const result = optionKey === q.correct_option ? "correct" : "incorrect";
    questionResults.value = {
      ...questionResults.value,
      [questionId]: result,
    };

    // 🔍 Fetch explanation for THIS question only (instant explanations)
    try {
      if (!q.explanation || !q.explanation.trim()) {
        const data = await getQuestionExplanation(q.id);
        q.explanation = data.explanation;
      }
    } catch (e) {
      console.error("Failed to load explanation", e);
      showToast("Could not load explanation for this question.", "error");
    }
  }

  // Update parent progress
  emitProgress("active");
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

  // Show results so the score + end-mode styling becomes visible
  showResults.value = true;
  stopTimer();

  const total = totalQuestions.value;
  const correct = score.value;

  // Mark as completed for external progress bar
  emitProgress("completed");

  // Try to persist on backend for dashboard & stats
  try {
    await completeDrill({
      course_id: props.courseId,
      num_questions: total,
      num_correct: correct,
      title: "Quick drill",
      drill_size: drillSize.value,
      duration_seconds: timerSeconds.value,
    });

    showToast("Drill completed!", "success");
  } catch (e) {
    console.error("Failed to save drill", e);
    // User still sees their result; we just warn about sync
    showToast("Drill completed, but could not sync to dashboard.", "error");
  }

  // Always keep lightweight local history for this course
  saveLastDrill();

  // Let parent (QuickDrillView) know we just completed a drill
  emit("completed", {
    courseId: props.courseId,
    score: correct,
    total,
    drillSize: drillSize.value,
    date: new Date().toISOString(),
  });

  // 🔁 Explanations behaviour:
  // - END MODE: bulk-load all missing explanations
  // - INSTANT MODE: we already fetched some per question, so we only fill the rest
  const pending = questions.value.filter(
    (q) => !q.explanation || !q.explanation.trim()
  );

  if (!pending.length) return;

  try {
    if (!isInstantMode.value) {
      // 🚨 Show loading indicator only in end mode
      explanationsLoading.value = true;
    }

    await Promise.all(
      pending.map(async (q) => {
        const data = await getQuestionExplanation(q.id);
        q.explanation = data.explanation;
      })
    );
  } catch (e) {
    console.error("Failed to fetch explanations", e);
    showToast("Some explanations could not be loaded.", "error");
  } finally {
    explanationsLoading.value = false;
  }
}

function resetDrill() {
  questions.value = [];
  userAnswers.value = {};
  showResults.value = false;
  drillError.value = null;
  questionRefs.value = [];
  explanationsLoading.value = false;
  questionResults.value = {};
  stopTimer();
  timerSeconds.value = 0;
  emitProgress("idle");
}

// class helper for options
function optionClass(q, opt) {
  const selected = userAnswers.value[q.id];

  // INSTANT MODE: use per-question result if available
  if (isInstantMode.value) {
    const result = questionResults.value[q.id]; // 'correct' | 'incorrect' | undefined

    // Before answer is marked, just highlight selected
    if (!result) {
      return {
        selected: selected === opt,
      };
    }

    const isCorrectOption = opt === q.correct_option;
    const isSelected = selected === opt;

    return {
      correct: isCorrectOption,
      incorrect: !isCorrectOption && isSelected,
      selected: isSelected,
    };
  }

  // END MODE: old behaviour (only after submit)
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

// mini-map styles for each question dot
function questionNavClass(q) {
  const selected = userAnswers.value[q.id];
  const classes = {};

  if (selected) {
    classes["question-nav-dot--answered"] = true;
  }

  const result = questionResults.value[q.id];

  // INSTANT MODE: color code as soon as result is known
  if (isInstantMode.value && result) {
    if (result === "correct") {
      classes["question-nav-dot--correct"] = true;
    } else if (result === "incorrect") {
      classes["question-nav-dot--incorrect"] = true;
    }
    return classes;
  }

  // END MODE: color code only after submit
  if (showResults.value) {
    if (selected === q.correct_option) {
      classes["question-nav-dot--correct"] = true;
    } else if (selected) {
      classes["question-nav-dot--incorrect"] = true;
    }
  }

  return classes;
}

// Keep a ref to each question DOM node for scrolling
function setQuestionRef(el, index) {
  if (el) {
    questionRefs.value[index] = el;
  }
}

function scrollToQuestion(index) {
  const el = questionRefs.value[index];
  if (!el || typeof window === "undefined") return;

  el.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// Keyboard shortcuts (fullscreen mode only)
function handleKeydown(e) {
  if (props.mode !== "fullscreen") return;
  if (!questions.value.length || drillLoading.value) return;

  const target = e.target;
  const tag = target?.tagName;
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target?.isContentEditable
  ) {
    return;
  }

  const key = e.key;
  let opt = null;

  // Map keys to options
  if (key === "1" || key.toLowerCase() === "a") opt = "A";
  else if (key === "2" || key.toLowerCase() === "b") opt = "B";
  else if (key === "3" || key.toLowerCase() === "c") opt = "C";
  else if (key === "4" || key.toLowerCase() === "d") opt = "D";

  if (opt) {
    e.preventDefault();
    const idx = currentQuestionIndex.value;
    if (idx === -1) return;
    const q = questions.value[idx];
    if (!q) return;
    selectAnswer(q.id, opt);
    return;
  }

  if (key === "Enter") {
    if (!showResults.value && answeredCount.value) {
      e.preventDefault();
      submitDrill();
    }
  }
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

  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeydown);
  }

  // Initial idle progress for parent
  emitProgress("idle");
});

onBeforeUnmount(() => {
  stopTimer();
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeydown);
  }
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

/* STICKY HEADER (progress + mini-map + timer) */
.quick-sticky-header {
  position: sticky;
  top: -0.75rem; /* keeps it near top inside card */
  z-index: 5;
  padding-top: 0.6rem;
  padding-bottom: 0.5rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.97),
    rgba(255, 255, 255, 0.9)
  );
  backdrop-filter: blur(8px);
}

/* PROGRESS */
.quick-progress-row {
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

/* QUESTION MINI-MAP */
.question-nav-row {
  margin-top: 0.45rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.question-nav-dot {
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 0.78rem;
  font-weight: 500;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.12s ease,
    box-shadow 0.15s ease;
}

.question-nav-dot:hover {
  background: #eef2ff;
  border-color: #c7d2fe;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
}

/* answered before submit */
.question-nav-dot--answered {
  background: #eef2ff;
  border-color: #4f46e5;
  color: #312e81;
}

/* after submit: correct / incorrect */
.question-nav-dot--correct {
  background: #ecfdf3;
  border-color: #16a34a;
  color: #166534;
}

.question-nav-dot--incorrect {
  background: #fef2f2;
  border-color: #dc2626;
  color: #b91c1c;
}

/* TIMER */
.timer-row {
  margin-top: 0.45rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
}

.timer-label {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: #9ca3af;
}

.timer-value {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: #0f172a;
  color: #f9fafb;
  font-variant-numeric: tabular-nums;
}

.timer-hint {
  color: #9ca3af;
  font-size: 0.72rem;
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

/* EXPLANATIONS SPINNER */
.explanations-spinner {
  margin-bottom: 0.5rem;
}

/* QUESTIONS */
.drill-body {
  margin-top: 0.75rem;
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

  .question-nav-row {
    overflow-x: auto;
    padding-bottom: 0.1rem;
  }

  .question-nav-row::-webkit-scrollbar {
    height: 4px;
  }

  .question-nav-row::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: #e5e7eb;
  }

  /* Make footer feel more "sticky" on small screens */
  .drill-footer {
    position: sticky;
    bottom: -1rem;
    background: linear-gradient(
      to top,
      rgba(249, 250, 251, 0.98),
      rgba(249, 250, 251, 0.9)
    );
    backdrop-filter: blur(8px);
    padding-bottom: 0.35rem;
  }
}
</style>
