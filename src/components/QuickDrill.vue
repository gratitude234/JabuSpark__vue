<template>
  <section class="card quick-drill-card">
    <div class="card-header quick-header">
      <!-- LEFT: Title / tags / last drill -->
      <div class="quick-header-left">
        <div class="quick-title-row">
          <h2 class="quick-title">
            <span class="quick-title-icon">⚡</span>
            <span>Quick drill</span>
          </h2>
          <span class="quick-title-pill" v-if="questions.length">
            {{ answeredCount }} / {{ totalQuestions }} answered
          </span>
        </div>

        <!-- 🔁 Updated subtitle: reacts to materialId + drillSize -->
        <p class="card-sub quick-sub">
          <!-- Material-specific drill -->
          <template v-if="materialId">
            <span v-if="drillSize === 'all'">
              All available MCQs linked to
              <strong>{{ materialTitle || "this material" }}</strong>.
            </span>
            <span v-else>
              {{ drillSize }} fast MCQs based on
              <strong>{{ materialTitle || "this material" }}</strong>.
            </span>
          </template>

          <!-- Course-level drill -->
          <template v-else>
            <span v-if="drillSize === 'all'">
              All available MCQs to test your understanding of this course.
            </span>
            <span v-else>
              {{ drillSize }} fast MCQs to test your understanding of this
              course.
            </span>
          </template>
        </p>

        <div class="quick-tags">
          <span class="quick-tag">📝 Exam-style MCQs</span>
          <span class="quick-tag">⚡ Auto-marked</span>
          <span class="quick-tag quick-tag--secondary">
            {{
              drillMode === "end"
                ? "💡 Explanations after submission"
                : "💡 Instant feedback & explanations"
            }}
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
      </div>

      <!-- RIGHT: status / metrics / size & mode -->
      <div class="quick-header-right">
        <div class="quick-header-right-top">
          <span class="badge quick-badge">Practice</span>

          <!-- Status -->
          <span class="quick-mini-meta" v-if="drillLoading">
            ⏳ Loading questions…
          </span>
          <span class="quick-mini-meta" v-else-if="!questions.length">
            ✅ Ready when you are
          </span>
          <span
            class="quick-mini-meta"
            v-else-if="questions.length && !showResults"
          >
            ▶️ In progress
          </span>
          <span class="quick-mini-meta" v-else-if="showResults">
            🎉 Completed
          </span>
        </div>

        <!-- CONTROL PANEL -->
        <div class="quick-control-panel">
          <!-- Quick metrics -->
          <div
            v-if="questions.length"
            class="quick-header-metrics quick-control-row"
          >
            <div class="metric-chip">
              <span class="metric-label">Answered</span>
              <span class="metric-value">
                {{ answeredCount }} / {{ totalQuestions }}
              </span>
            </div>
            <div class="metric-chip">
              <span class="metric-label">Time</span>
              <span class="metric-value">
                {{ formattedTimer }}
              </span>
            </div>
          </div>

          <!-- Progress bar -->
          <div
            v-if="questions.length"
            class="quick-progress quick-control-row"
          >
            <div class="quick-progress-track">
              <div
                class="quick-progress-fill"
                :style="{ width: progressPercent + '%' }"
              ></div>
            </div>
            <span class="quick-progress-label">
              {{ progressPercent }}% complete
            </span>
          </div>

          <!-- History hint -->
          <div
            v-if="hasAnsweredHistory"
            class="quick-history-hint quick-control-row"
          >
            <span class="quick-history-dot"></span>
            <span class="quick-history-text">
              We’ll avoid {{ answeredCountForCurrent }} questions you’ve already
              answered.
            </span>
            <button
              type="button"
              class="quick-history-reset-btn"
              @click="resetAnsweredHistoryForCurrent"
            >
              Reset history
            </button>
          </div>

          <!-- Feedback mode switch -->
          <div
            class="drill-mode-switch quick-control-row"
            role="group"
            aria-label="Choose feedback mode"
          >
            <div class="quick-control-row-head">
              <span class="drill-mode-label">Feedback mode</span>
              <span class="drill-mode-badge">
                {{ drillMode === "end" ? "Exam-style" : "Tutor-style" }}
              </span>
            </div>
            <div class="drill-mode-pills">
              <button
                type="button"
                class="mode-pill"
                :class="{ 'mode-pill--active': drillMode === 'end' }"
                @click="setDrillMode('end')"
                :disabled="isDrillLocked"
                :aria-pressed="drillMode === 'end'"
              >
                End mode
              </button>
              <button
                type="button"
                class="mode-pill"
                :class="{ 'mode-pill--active': drillMode === 'instant' }"
                @click="setDrillMode('instant')"
                :disabled="isDrillLocked"
                :aria-pressed="drillMode === 'instant'"
              >
                Instant mode
              </button>
            </div>
            <p class="drill-mode-hint">
              {{
                drillMode === "end"
                  ? "Answer all questions first, then see your score and explanations."
                  : "See if you’re right immediately and get a short explanation."
              }}
            </p>
            <p v-if="isDrillLocked" class="drill-mode-lock-hint">
              Settings are locked while this drill is in progress.
            </p>
          </div>

          <!-- Drill length -->
          <div
            class="drill-size-switch quick-control-row"
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
                :disabled="drillLoading || isDrillLocked"
                :aria-pressed="drillSize === size"
              >
                <span v-if="size === 'all'">All</span>
                <span v-else>{{ size }} Q</span>
              </button>
            </div>
            <p class="drill-size-hint">
              5 = quick • 10 = standard • 20 = deep • All = full bank
            </p>

            <!-- Inline end-drill shortcut for better UX -->
            <button
              v-if="isDrillLocked"
              type="button"
              class="quick-settings-end-link"
              @click="endDrillFromSettings"
            >
              End this drill to change settings
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="drillError" class="alert alert-error quick-alert">
      {{ drillError }}
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
          <span v-if="materialId">
            Start a quick drill to practice MCQs tied to
            <strong>{{ materialTitle || "this material" }}</strong>.
          </span>
          <span v-else>
            Start a quick drill to generate fresh MCQs for this course based on
            your materials.
          </span>
        </p>
        <p class="quick-empty-tip">
          Choose your <strong>feedback mode</strong> and
          <strong>drill length</strong> on the right, then start.
        </p>
        <div class="drill-actions-inline">
          <button
            class="btn btn-primary"
            @click="startQuickDrill"
            :disabled="drillLoading"
          >
            <span class="btn-icon">▶</span>
            <span v-if="drillSize === 'all'">
              Start full-question drill
            </span>
            <span v-else>
              Start {{ drillSize }}-question drill
            </span>
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
    <div v-if="questions.length && !drillLoading" class="drill-body">
      <!-- 🔄 Explanations loading indicator (after submit, END MODE bulk) -->
      <div
        v-if="showResults && explanationsLoading"
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
          :ref="(el) => setQuestionRef(el, index)"
        >
          <div class="question-header-row">
            <div class="question-text">
              <span class="question-number-pill">
                Q{{ index + 1 }}
              </span>
              <span class="question-copy">
                {{ q.question_text }}
              </span>
            </div>

            <button
              v-if="!showResults"
              type="button"
              class="question-jump"
              @click="scrollToQuestion(index)"
            >
              Jump to this question
            </button>
          </div>

          <div class="options-grid">
            <button
              v-for="opt in ['A', 'B', 'C', 'D']"
              :key="opt"
              type="button"
              class="option-pill"
              :class="optionClass(q, opt)"
              @click="selectAnswer(q.id, opt)"
              :disabled="isOptionDisabled(q)"
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

          <!-- Little interaction tip on the first question only -->
          <p v-if="index === 0" class="option-hint">
            <span v-if="isInstantMode">
              In Instant mode, your first answer is locked for each question —
              think before you tap.
            </span>
            <span v-else>
              Tip: tap an option to select it, tap again to clear your answer.
            </span>
          </p>

          <!-- Button to ask Jabuspark about this specific question -->
          <div class="question-ai-row">
            <button
              type="button"
              class="question-ask-ai"
              @click="askJabusparkAboutQuestion(q, index)"
            >
              💬 Ask Jabuspark to explain this question
            </button>
          </div>

          <!-- 🧠 Explanation block -->
          <div v-if="shouldShowExplanation(q)" class="explanation-wrapper">
            <!-- Per-question loading in INSTANT mode -->
            <div
              v-if="
                isInstantMode &&
                userAnswers[q.id] &&
                isExplanationLoadingForQuestion(q.id)
              "
              class="explanation-locked"
            >
              <span class="locked-icon">⏳</span>
              <span class="locked-text">
                Generating explanation…
              </span>
            </div>

            <!-- Unlocked explanation -->
            <div
              v-else-if="userAnswers[q.id] && q.explanation"
              class="explanation-card"
              :class="{
                'explanation-card--correct': isQuestionCorrect(q),
                'explanation-card--incorrect': !isQuestionCorrect(q),
              }"
            >
              <div class="explanation-header">
                <span class="explanation-pill">
                  <span class="explanation-dot"></span>
                  Explanation
                </span>

                <span
                  class="explanation-result"
                  :class="{
                    'explanation-result--correct': isQuestionCorrect(q),
                    'explanation-result--incorrect': !isQuestionCorrect(q),
                  }"
                >
                  {{
                    isQuestionCorrect(q)
                      ? "You were correct"
                      : "You were incorrect"
                  }}
                </span>
              </div>

              <p class="explanation-body">
                {{ q.explanation }}
              </p>

              <div class="explanation-meta">
                <span class="meta-label">Correct answer:</span>
                <span class="meta-value">{{ correctAnswerText(q) }}</span>
              </div>
            </div>

            <!-- Answered but explanation missing -->
            <div
              v-else-if="
                userAnswers[q.id] &&
                !q.explanation &&
                !explanationsLoading &&
                !isExplanationLoadingForQuestion(q.id)
              "
              class="explanation-locked explanation-locked--warning"
            >
              <span class="locked-icon">⚠️</span>
              <span class="locked-text">
                Explanation unavailable for this question. Try another drill.
              </span>
            </div>

            <!-- Locked explanation for unanswered questions after submit -->
            <div v-else-if="showResults" class="explanation-locked">
              <span class="locked-icon">🔒</span>
              <span class="locked-text">
                Explanation locked — this question wasn’t answered.
              </span>
            </div>
          </div>
        </li>
      </ol>

      <footer class="drill-footer">
        <div v-if="showResults" class="score-pill">
          <span class="score-pill-label">You scored</span>
          <span class="score-pill-value">
            {{ score }} / {{ totalQuestions }}
          </span>
        </div>

        <!-- 🔥 Post-drill encouragement -->
        <div v-if="showResults" class="post-drill-copy">
          <p class="post-drill-main">
            {{ postDrillMessage }}
          </p>
          <p class="post-drill-sub">
            Tip: scores improve fastest when you do 2–3 short drills
            back-to-back.
          </p>
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

          <!-- Encouraging CTA -->
          <button
            v-if="showResults"
            class="btn btn-primary"
            @click="startQuickDrill"
          >
            {{
              drillSize === "all"
                ? "Do another full drill"
                : `Do ${drillSize} more questions now`
            }}
          </button>

          <!-- 🔴 Explicit end button for active drills -->
          <button
            v-if="questions.length && !showResults"
            class="btn btn-ghost btn-danger"
            @click="endDrill"
          >
            End drill
          </button>

          <!-- Fallback clear (e.g. after results or no drill at all) -->
          <button v-else class="btn btn-ghost" @click="resetDrill">
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
import { getQuickDrill, getQuestionExplanation } from "../services/questions";
import { completeDrill } from "../services/drills";

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
  // NEW: material context
  materialId: {
    type: Number,
    default: null,
  },
  materialTitle: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["toast", "completed", "progress", "ask-ai"]);

function showToast(message, type = "success") {
  emit("toast", { message, type });
}

// QUICK DRILL STATE
const drillSizeOptions = [5, 10, 20, "all"];
const drillSize = ref(10); // 5 | 10 | 20 | "all"

// FEEDBACK MODE: "end" | "instant"
const DRILL_MODE_KEY = "jabuspark_quickdrill_mode";
const ACTIVE_DRILL_KEY = "jabuspark_active_drills";

// answered history (per course/material) so we don't repeat questions
const ANSWERED_QUESTIONS_KEY = "jabuspark_quickdrill_answered";
const answeredHistory = ref({}); // { "course:1" : [1,2,3], "course:1:material:5": [10,11] }

function answeredHistoryKey() {
  return props.materialId
    ? `course:${props.courseId}:material:${props.materialId}`
    : `course:${props.courseId}`;
}

function loadAnsweredHistory() {
  try {
    const raw = localStorage.getItem(ANSWERED_QUESTIONS_KEY);
    answeredHistory.value = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load answered history", e);
    answeredHistory.value = {};
  }
}

function saveAnsweredHistory() {
  try {
    localStorage.setItem(
      ANSWERED_QUESTIONS_KEY,
      JSON.stringify(answeredHistory.value)
    );
  } catch (e) {
    console.error("Failed to save answered history", e);
  }
}

function getAnsweredIdsForCurrent() {
  const key = answeredHistoryKey();
  return answeredHistory.value[key] || [];
}

function addAnsweredIdsForCurrent(ids) {
  if (!ids || !ids.length) return;
  const key = answeredHistoryKey();
  const existing = new Set(getAnsweredIdsForCurrent());
  ids.forEach((id) => existing.add(id));

  answeredHistory.value = {
    ...answeredHistory.value,
    [key]: Array.from(existing),
  };
  saveAnsweredHistory();
}

function resetAnsweredHistoryForCurrent() {
  const key = answeredHistoryKey();
  if (!answeredHistory.value[key]) return;

  let confirmed = true;
  if (typeof window !== "undefined") {
    confirmed = window.confirm(
      "Reset your question history for this drill? Already-seen questions may start appearing again."
    );
  }
  if (!confirmed) return;

  const copy = { ...answeredHistory.value };
  delete copy[key];
  answeredHistory.value = copy;
  saveAnsweredHistory();
  showToast(
    "Question history cleared. Future drills can reuse all questions.",
    "info"
  );
}

const answeredCountForCurrent = computed(() => {
  const key = answeredHistoryKey();
  return answeredHistory.value[key]?.length || 0;
});

const hasAnsweredHistory = computed(() => answeredCountForCurrent.value > 0);

const drillMode = ref("end");
const isInstantMode = computed(() => drillMode.value === "instant");

const drillLoading = ref(false);
const drillError = ref(null);
const questions = ref([]);
const userAnswers = ref({});
const showResults = ref(false);

// Last drill (localStorage)
const lastDrill = ref(null);

// For question scrolling
const questionRefs = ref([]);

// Explanations loading
const explanationsLoading = ref(false);
// Per-question explanation loading (INSTANT mode)
const perQuestionExplanationLoading = ref({});

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

const formattedTimer = computed(() => {
  const total = timerSeconds.value;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
});

const score = computed(() => {
  if (!questions.value.length) return 0;
  let correct = 0;
  for (const q of questions.value) {
    const ans = userAnswers.value[q.id];
    if (ans && ans === q.correct_option) correct++;
  }
  return correct;
});

// score % + personalised message
const scorePercent = computed(() => {
  if (!totalQuestions.value) return 0;
  return Math.round((score.value / totalQuestions.value) * 100);
});

const postDrillMessage = computed(() => {
  const p = scorePercent.value;

  if (p >= 80) {
    return "Great work — you’re almost exam-ready. One more quick round will lock this in.";
  }
  if (p >= 50) {
    return "Nice effort — another short drill now will help fix the weak spots.";
  }
  return "Don’t worry if this felt hard — doing another quick drill while it’s fresh will help a lot.";
});

// First unanswered question index (for external progress)
const currentQuestionIndex = computed(() => {
  if (!questions.value.length) return -1;
  const idx = questions.value.findIndex((q) => !userAnswers.value[q.id]);
  return idx === -1 ? questions.value.length - 1 : idx;
});

// 🔒 Is drill in progress (used to lock settings)
const isDrillLocked = computed(
  () => questions.value.length && !showResults.value
);

// 🔃 Emit progress to parent (dashboard / course view)
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

function startTimer() {
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
  if (isDrillLocked.value) return;
  drillSize.value = size;
}

function setDrillMode(mode) {
  if (isDrillLocked.value) return;
  if (mode !== "end" && mode !== "instant") return;
  drillMode.value = mode;
  try {
    localStorage.setItem(DRILL_MODE_KEY, mode);
  } catch (e) {
    console.error("Failed to save drill mode", e);
  }
}

function loadDrillModePreference() {
  try {
    const raw = localStorage.getItem(DRILL_MODE_KEY);
    if (raw === "instant" || raw === "end") {
      drillMode.value = raw;
    }
  } catch (e) {
    console.error("Failed to load drill mode", e);
  }
}

/* 🔐 ACTIVE DRILL SNAPSHOT (for resume) */
function saveActiveDrillSnapshot() {
  // If no drill or drill is finished, clear any saved state for this course/material combo
  if (!questions.value.length || showResults.value) {
    clearActiveDrillSnapshot();
    return;
  }

  const snapshot = {
    courseId: props.courseId,
    materialId: props.materialId || null,
    drillSize: drillSize.value,
    drillMode: drillMode.value,
    questions: questions.value,
    userAnswers: userAnswers.value,
    timerSeconds: timerSeconds.value,
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(ACTIVE_DRILL_KEY);
    const arr = raw ? JSON.parse(raw) : [];

    const filtered = arr.filter(
      (r) =>
        r.courseId !== props.courseId ||
        (r.materialId || null) !== (props.materialId || null)
    );
    filtered.push(snapshot);

    localStorage.setItem(ACTIVE_DRILL_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to save active drill snapshot", e);
  }
}

function clearActiveDrillSnapshot() {
  try {
    const raw = localStorage.getItem(ACTIVE_DRILL_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    const filtered = arr.filter(
      (r) =>
        r.courseId !== props.courseId ||
        (r.materialId || null) !== (props.materialId || null)
    );
    localStorage.setItem(ACTIVE_DRILL_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to clear active drill snapshot", e);
  }
}

function loadActiveDrillSnapshot() {
  try {
    const raw = localStorage.getItem(ACTIVE_DRILL_KEY);
    if (!raw) return false;

    const arr = JSON.parse(raw);
    const found = arr.find(
      (r) =>
        r.courseId === props.courseId &&
        (r.materialId || null) === (props.materialId || null)
    );
    if (!found) return false;

    // Restore core state
    drillSize.value = found.drillSize ?? drillSize.value;

    if (found.drillMode === "instant" || found.drillMode === "end") {
      drillMode.value = found.drillMode;
    }

    questions.value = found.questions || [];
    userAnswers.value = found.userAnswers || {};
    timerSeconds.value = found.timerSeconds || 0;
    showResults.value = false;

    // Reset transient stuff
    questionRefs.value = [];
    explanationsLoading.value = false;
    perQuestionExplanationLoading.value = {};

    if (questions.value.length) {
      startTimer();
      emitProgress("active");
      return true;
    }

    return false;
  } catch (e) {
    console.error("Failed to load active drill snapshot", e);
    return false;
  }
}

/* 👉 BUILDER: prompt for Ask Jabuspark */
function buildAiPromptForQuestion(q) {
  const chosen = userAnswers.value[q.id];

  const chosenText =
    chosen === "A"
      ? q.option_a
      : chosen === "B"
      ? q.option_b
      : chosen === "C"
      ? q.option_c
      : chosen === "D"
      ? q.option_d
      : null;

  const correctLabel = q.correct_option;
  const correctText =
    correctLabel === "A"
      ? q.option_a
      : correctLabel === "B"
      ? q.option_b
      : correctLabel === "C"
      ? q.option_c
      : q.option_d;

  const studentLine = chosen
    ? `I chose option ${chosen}: "${chosenText}".`
    : "I have not chosen any option yet.";

  return [
    "You are tutoring a university student preparing for an exam. Explain this multiple-choice question step by step:",
    "",
    `QUESTION: ${q.question_text}`,
    "",
    "OPTIONS:",
    `A. ${q.option_a}`,
    `B. ${q.option_b}`,
    `C. ${q.option_c}`,
    `D. ${q.option_d}`,
    "",
    studentLine,
    `The correct answer (based on the marking guide) is option ${correctLabel}: "${correctText}".`,
    "",
    "Please do ALL of the following in your answer:",
    "1. Start with a very short direct answer (1–2 sentences).",
    "2. Then give a clear, simple explanation in plain language.",
    "3. Explain WHY the correct option is correct.",
    "4. Briefly explain why each of the other options is wrong.",
    "5. End with 2–3 short exam tips or mnemonics for remembering this concept.",
  ].join("\n");
}

/* Trigger: ask Jabuspark about this question */
function askJabusparkAboutQuestion(q, index) {
  const prompt = buildAiPromptForQuestion(q);

  emit("ask-ai", {
    from: "quick-drill",
    courseId: props.courseId,
    materialId: props.materialId || null,
    questionId: q.id,
    questionIndex: index,
    prompt,
  });

  showToast("Opened Ask Jabuspark with this question context.", "info");
}

/* MAIN ACTIONS */
async function startQuickDrill() {
  try {
    drillLoading.value = true;
    drillError.value = null;
    showResults.value = false;
    userAnswers.value = {};
    questions.value = [];
    questionRefs.value = [];
    explanationsLoading.value = false;
    perQuestionExplanationLoading.value = {};
    stopTimer();
    timerSeconds.value = 0;

    const sizeParam = drillSize.value === "all" ? null : drillSize.value;
    const excludeIds = getAnsweredIdsForCurrent();

    const data = await getQuickDrill(
      props.courseId,
      sizeParam,
      props.materialId || null,
      excludeIds
    );

    if (!Array.isArray(data) || data.length === 0) {
      drillError.value = props.materialId
        ? "No new questions available for this material. You’ve answered everything for now."
        : "No new questions available for this course. You’ve answered everything for now.";
      emitProgress("idle");
      return;
    }

    // backend already handles LIMIT / random ordering
    questions.value = data;

    startTimer();
    emitProgress("active");

    // Save this drill as the current active snapshot
    saveActiveDrillSnapshot();

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
  // After submit, lock everything
  if (showResults.value) return;

  // INSTANT MODE: once answered, don't allow changes
  if (isInstantMode.value && userAnswers.value[questionId]) {
    return;
  }

  if (!isInstantMode.value) {
    // END MODE: can change or clear before submit
    const current = userAnswers.value[questionId];
    const newValue = current === optionKey ? null : optionKey;

    userAnswers.value = {
      ...userAnswers.value,
      [questionId]: newValue,
    };

    emitProgress("active");
    saveActiveDrillSnapshot();

    // If they cleared their answer, don't fetch explanation
    if (!newValue) return;
  } else {
    // INSTANT MODE: one-shot selection
    userAnswers.value = {
      ...userAnswers.value,
      [questionId]: optionKey,
    };

    emitProgress("active");
    saveActiveDrillSnapshot();
  }

  // INSTANT MODE: fetch explanation immediately for this question
  if (isInstantMode.value) {
    const q = questions.value.find((item) => item.id === questionId);
    if (!q) return;

    // Avoid refetching explanation on each change – reuse once loaded
    if (q.explanation && q.explanation.trim()) return;
    if (perQuestionExplanationLoading.value[questionId]) return;

    try {
      perQuestionExplanationLoading.value = {
        ...perQuestionExplanationLoading.value,
        [questionId]: true,
      };
      const data = await getQuestionExplanation(questionId);
      q.explanation = data.explanation;
    } catch (e) {
      console.error("Failed to fetch explanation for question", e);
      showToast("Could not load explanation for this question.", "error");
    } finally {
      const copy = { ...perQuestionExplanationLoading.value };
      delete copy[questionId];
      perQuestionExplanationLoading.value = copy;
    }
  }
}

function saveLastDrill() {
  const effectiveSize =
    drillSize.value === "all" ? totalQuestions.value : drillSize.value;

  const record = {
    courseId: props.courseId,
    // we keep last drill per course (not per material) for now
    score: score.value,
    total: totalQuestions.value,
    drillSize: effectiveSize,
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
    console.error("Failed to load last drill", e);
  }
}

function isQuestionCorrect(q) {
  const ans = userAnswers.value[q.id];
  return !!ans && ans === q.correct_option;
}

function correctAnswerText(q) {
  const label = q.correct_option;
  let text = "";
  if (label === "A") text = q.option_a;
  else if (label === "B") text = q.option_b;
  else if (label === "C") text = q.option_c;
  else if (label === "D") text = q.option_d;

  return `${label}. ${text}`;
}

async function submitDrill() {
  if (!questions.value.length) return;

  showResults.value = true;
  stopTimer();

  const total = totalQuestions.value;
  const correct = score.value;

  const drillSizeForStats =
    drillSize.value === "all" ? totalQuestions.value : drillSize.value;

  emitProgress("completed");

  // store all answered question IDs in history for this course/material
  const answeredIdsThisDrill = questions.value
    .filter((q) => userAnswers.value[q.id])
    .map((q) => q.id);
  addAnsweredIdsForCurrent(answeredIdsThisDrill);

  try {
    await completeDrill({
      course_id: props.courseId,
      num_questions: total,
      num_correct: correct,
      title: props.materialId
        ? `Quick drill • ${props.materialTitle || "Material"}`
        : "Quick drill",
      drill_size: drillSizeForStats,
      duration_seconds: timerSeconds.value,
      material_id: props.materialId || null,
    });

    showToast("Drill completed!", "success");
  } catch (e) {
    console.error("Failed to save drill", e);
    showToast("Drill completed, but could not sync to dashboard.", "error");
  }

  saveLastDrill();

  emit("completed", {
    courseId: props.courseId,
    materialId: props.materialId || null,
    score: correct,
    total,
    drillSize: drillSizeForStats,
    date: new Date().toISOString(),
  });

  const pending = questions.value.filter(
    (q) =>
      userAnswers.value[q.id] &&
      (!q.explanation || !q.explanation.trim())
  );

  // Drill is over; no longer an "active" session
  clearActiveDrillSnapshot();

  if (!pending.length) return;

  try {
    explanationsLoading.value = true;

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
  perQuestionExplanationLoading.value = {};
  stopTimer();
  timerSeconds.value = 0;
  emitProgress("idle");
  clearActiveDrillSnapshot();
}

// 🔴 Explicit end-drill handler so user can intentionally discard a session
function endDrill() {
  if (!questions.value.length) return;

  let confirmed = true;
  if (typeof window !== "undefined") {
    confirmed = window.confirm(
      "End this drill and clear your progress? You’ll be able to change your settings and start a new one."
    );
  }
  if (!confirmed) return;

  resetDrill();
  showToast(
    "Drill ended. You can change your settings and start a new one.",
    "info"
  );
}

// Inline end-drill shortcut from settings area
function endDrillFromSettings() {
  if (!questions.value.length) return;

  let confirmed = true;
  if (typeof window !== "undefined") {
    confirmed = window.confirm(
      "Ending this drill will clear your current answers so you can change your settings. Continue?"
    );
  }
  if (!confirmed) return;

  resetDrill();
  showToast(
    "Drill ended. Adjust your settings and start a new drill when you're ready.",
    "info"
  );
}

// answer button state
function optionClass(q, opt) {
  const selected = userAnswers.value[q.id];

  // INSTANT MODE: neutral until answered, then show correct/incorrect
  if (isInstantMode.value) {
    if (!selected) {
      return {};
    }

    const isCorrect = q.correct_option === opt;
    const isSelected = selected === opt;

    return {
      correct: isCorrect,
      incorrect: !isCorrect && isSelected,
      selected: isSelected,
    };
  }

  // END MODE: before submit, only highlight selected
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

// Disable options once answered in INSTANT mode
function isOptionDisabled(q) {
  if (!isInstantMode.value) return false;
  return !!userAnswers.value[q.id];
}

// DOM refs
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

function scrollToQuestionFromOutside(index) {
  scrollToQuestion(index);
}

function isExplanationLoadingForQuestion(id) {
  return !!perQuestionExplanationLoading.value[id];
}

// Decide if we should render the explanation block for this question
function shouldShowExplanation(q) {
  if (isInstantMode.value) {
    if (userAnswers.value[q.id]) return true;
    if (showResults.value) return true;
    return false;
  }
  return showResults.value;
}

onMounted(() => {
  loadDrillModePreference();
  loadLastDrill();
  loadAnsweredHistory();

  const restored = loadActiveDrillSnapshot();

  if (restored) {
    showToast(
      props.materialId
        ? "Resumed your last quick drill for this material."
        : "Resumed your last quick drill for this course.",
      "info"
    );
  } else {
    emitProgress("idle");
  }
});

onBeforeUnmount(() => {
  // Save where we stopped, if drill is still in progress
  saveActiveDrillSnapshot();
  stopTimer();
});

// When course changes, reset + reload last drill
watch(
  () => props.courseId,
  () => {
    loadLastDrill();
    resetDrill();
  }
);

// When material changes (e.g. clicking another "Drill this material"),
// clear current drill and idle; user can start a fresh one.
watch(
  () => props.materialId,
  () => {
    resetDrill();
    emitProgress("idle");
  }
);

// 👇 Expose for parent (CourseDetailView) to jump back to a specific question
defineExpose({
  scrollToQuestionFromOutside,
});
</script>

<style scoped>
.quick-drill-card {
  position: relative;
  overflow: hidden;
}

/* Soft glow in the corner */
.quick-drill-card::before {
  content: "";
  position: absolute;
  top: -48px;
  right: -80px;
  width: 220px;
  height: 220px;
  background: radial-gradient(
    circle at top,
    rgba(79, 70, 229, 0.08),
    transparent 70%
  );
  pointer-events: none;
}

/* HEADER LAYOUT */
.quick-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.75rem;
}

.quick-header-left {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

/* Title row */
.quick-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quick-title {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 1.15rem;
  font-weight: 650;
  color: #111827;
  letter-spacing: -0.02em;
}

.quick-title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 20%, #eef2ff, #e0f2fe);
  font-size: 0.95rem;
}

.quick-title-pill {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #f3f4ff;
  border: 1px solid #e0e7ff;
  font-size: 0.7rem;
  color: #4338ca;
}

.quick-sub {
  margin-top: 0.15rem;
  font-size: 0.85rem;
  color: #4b5563;
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

/* Last drill chip */
.last-drill-chip {
  margin-top: 0.45rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.7rem;
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

/* RIGHT HEADER */
.quick-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-width: 240px;
  max-width: 280px;
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

/* CONTROL PANEL */
.quick-control-panel {
  width: 100%;
  padding: 0.6rem 0.7rem;
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f9fafb, #eff6ff);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-control-row {
  border-radius: 0.6rem;
}

/* METRICS */
.quick-header-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}

.metric-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.05rem;
  padding: 0.25rem 0.6rem;
  border-radius: 0.75rem;
  background: #f3f4ff;
}

.metric-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.metric-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: #111827;
}

/* PROGRESS BAR */
.quick-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
}

.quick-progress-track {
  width: 100%;
  max-width: 160px;
  height: 0.4rem;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.quick-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #4f46e5, #0ea5e9);
  transition: width 0.2s ease-out;
}

.quick-progress-label {
  font-size: 0.7rem;
  color: #6b7280;
}

/* HISTORY HINT */
.quick-history-hint {
  margin-top: 0.15rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: #6b7280;
}

.quick-history-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: #22c55e;
}

.quick-history-text {
  white-space: nowrap;
}

.quick-history-reset-btn {
  border: none;
  background: transparent;
  font-size: 0.7rem;
  color: #4f46e5;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* MODE SWITCH */
.drill-mode-switch {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.quick-control-row-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drill-mode-label {
  font-size: 0.7rem;
  color: #6b7280;
}

.drill-mode-badge {
  font-size: 0.65rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
}

.drill-mode-pills {
  display: flex;
  gap: 0.25rem;
  padding: 0.15rem;
  border-radius: 999px;
  background: #eff6ff;
}

.mode-pill {
  border-radius: 999px;
  border: none;
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.08s ease;
}

.mode-pill:hover:enabled {
  background: #e0f2fe;
  transform: translateY(-0.5px);
}

.mode-pill--active {
  background: #0ea5e9;
  color: #f9fafb;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.06);
}

.mode-pill:disabled {
  opacity: 0.7;
  cursor: default;
}

.mode-pill:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}

.drill-mode-hint {
  margin-top: 0.1rem;
  font-size: 0.7rem;
  color: #9ca3af;
}

.drill-mode-lock-hint {
  margin-top: 0.1rem;
  font-size: 0.68rem;
  color: #9ca3af;
}

/* SIZE SWITCH */
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
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.08s ease;
}

.size-pill:hover:enabled {
  background: #e5e7eb;
  transform: translateY(-0.5px);
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

.size-pill:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.drill-size-hint {
  margin-top: 0.15rem;
  font-size: 0.7rem;
  color: #9ca3af;
}

/* Settings inline end-drill link */
.quick-settings-end-link {
  margin-top: 0.25rem;
  align-self: flex-end;
  border: none;
  background: transparent;
  font-size: 0.7rem;
  color: #ef4444;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 0;
}

.quick-settings-end-link:hover {
  color: #b91c1c;
}

/* ALERT */
.quick-alert {
  margin-top: 0.5rem;
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

.quick-empty-tip {
  margin-top: 0.15rem;
  font-size: 0.78rem;
  color: #4b5563;
}

.quick-spinner-area {
  margin-top: 0.75rem;
}

/* GENERIC SPINNER */
.spinner-area {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: center;
  font-size: 0.85rem;
  color: #6b7280;
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  border: 2px solid #e5e7eb;
  border-top-color: #4f46e5;
  animation: quick-drill-spin 0.6s linear infinite;
}

@keyframes quick-drill-spin {
  to {
    transform: rotate(360deg);
  }
}

/* EXPLANATIONS SPINNER */
.explanations-spinner {
  margin-bottom: 0.5rem;
}

/* QUESTIONS */
.drill-body {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.question-item {
  padding: 0.85rem 0.9rem;
  border-radius: 0.9rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.02);
}

.question-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.question-text {
  display: flex;
  gap: 0.4rem;
  align-items: flex-start;
}

.question-number-pill {
  font-weight: 600;
  font-size: 0.75rem;
  color: #4f46e5;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: #eef2ff;
}

.question-copy {
  font-size: 0.9rem;
  color: #111827;
}

.question-jump {
  border: none;
  background: transparent;
  font-size: 0.7rem;
  color: #4b5563;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.question-jump:hover {
  background: #e5e7eb;
  color: #111827;
}

/* Ask AI row */
.question-ai-row {
  margin-top: 0.45rem;
  display: flex;
  justify-content: flex-start;
}

.question-ask-ai {
  border-radius: 999px;
  border: 1px dashed #c7d2fe;
  padding: 0.25rem 0.7rem;
  font-size: 0.75rem;
  background: #eef2ff;
  color: #4338ca;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.08s ease;
}

.question-ask-ai:hover {
  background: #e0e7ff;
  border-color: #a5b4fc;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
  transform: translateY(-1px);
}

/* OPTIONS */
.options-grid {
  display: grid;
  gap: 0.35rem;
}

.option-pill {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease;
}

.option-pill:hover:not(:disabled) {
  border-color: #4f46e5;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.option-pill:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.option-pill:disabled {
  cursor: default;
  opacity: 0.9;
  transform: none;
  box-shadow: none;
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

/* Option interaction hint */
.option-hint {
  margin-top: 0.3rem;
  font-size: 0.75rem;
  color: #6b7280;
}

/* EXPLANATION UI */
.explanation-wrapper {
  margin-top: 0.6rem;
}

.explanation-card {
  border-radius: 0.9rem;
  padding: 0.65rem 0.8rem;
  background: radial-gradient(circle at top left, #eef2ff, #f9fafb);
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.05);
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  animation: explanation-fade-in 0.18s ease-out;
}

@keyframes explanation-fade-in {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.explanation-card--correct {
  border-color: #bbf7d0;
  background: linear-gradient(135deg, #ecfdf3, #f9fafb);
}

.explanation-card--incorrect {
  border-color: #fecaca;
  background: linear-gradient(135deg, #fef2f2, #f9fafb);
}

.explanation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.explanation-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.06);
  color: #4f46e5;
  font-size: 0.7rem;
  font-weight: 500;
}

.explanation-dot {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: #4f46e5;
}

.explanation-result {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
}

.explanation-result--correct {
  background: rgba(22, 163, 74, 0.08);
  color: #15803d;
}

.explanation-result--incorrect {
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
}

.explanation-body {
  color: #374151;
  line-height: 1.4;
}

.explanation-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.1rem;
  font-size: 0.75rem;
}

.meta-label {
  font-weight: 600;
  color: #4b5563;
}

.meta-value {
  color: #111827;
}

/* LOCKED / UNAVAILABLE STATES */
.explanation-locked {
  margin-top: 0.4rem;
  padding: 0.45rem 0.65rem;
  border-radius: 0.75rem;
  border: 1px dashed #e5e7eb;
  background: #f9fafb;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.explanation-locked--warning {
  border-style: solid;
  border-color: #fed7aa;
  background: #fffbeb;
  color: #92400e;
}

.locked-icon {
  font-size: 0.9rem;
}

/* FOOTER */
.drill-footer {
  margin-top: 0.6rem;
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

/* post-drill encouragement */
.post-drill-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-width: 360px;
  font-size: 0.8rem;
  color: #4b5563;
}

.post-drill-main {
  font-weight: 500;
  color: #111827;
}

.post-drill-sub {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Buttons */
.btn-icon {
  margin-right: 0.25rem;
}

/* 🔴 End drill styling */
.btn-danger {
  color: #b91c1c;
}

.btn-danger:hover {
  background: #fef2f2;
  color: #7f1d1d;
}

/* MOBILE */
@media (max-width: 640px) {
  .quick-header {
    flex-direction: column;
    align-items: stretch;
  }

  .quick-header-right {
    align-items: stretch;
    max-width: none;
  }

  .drill-mode-switch,
  .drill-size-switch,
  .quick-history-hint {
    align-items: flex-start;
  }

  .quick-header-metrics {
    justify-content: flex-start;
  }

  .quick-progress {
    align-items: flex-start;
  }

  .quick-empty {
    align-items: center;
  }

  .question-item {
    padding: 0.75rem 0.75rem;
  }

  .drill-footer {
    position: sticky;
    bottom: -0.5rem;
    background: linear-gradient(
      to top,
      rgba(249, 250, 251, 0.98),
      rgba(249, 250, 251, 0.9)
    );
    backdrop-filter: blur(8px);
    padding-bottom: 0.35rem;
  }
}

/* Larger screens: 2-column options */
@media (min-width: 768px) {
  .options-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
