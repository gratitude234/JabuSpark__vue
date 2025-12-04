<!-- src/views/QuickDrillView.vue -->
<template>
  <div class="page page--quick-drill">
    <!-- Toast -->
    <div
      v-if="toast.visible"
      :class="['toast', `toast--${toast.type}`]"
    >
      {{ toast.message }}
    </div>

    <!-- Exam-style header -->
    <header class="page-header page-header--quick-drill">
      <div class="header-left">
        <button class="back-link back-link--ghost" type="button" @click="goBack">
          <span class="back-icon">←</span>
          <span class="back-text">Back</span>
        </button>

        <div class="header-text">
          <p class="eyebrow-label">Quick drill workspace</p>
          <h1 class="page-title">
            Quick drill
          </h1>

          <p class="page-sub">
            <span class="page-sub-main">
              Fast MCQ session from {{ headerCourseLabel }}
            </span>
            <span
              v-if="headerCourseMeta"
              class="page-sub-meta"
            >
              · {{ headerCourseMeta }}
            </span>
          </p>

          <div class="mode-row">
            <span class="mode-pill">
              Exam workspace
            </span>
            <span class="mode-pill mode-pill--soft">
              CBT-style quick drill
            </span>
          </div>
        </div>
      </div>

      <div v-if="courseId" class="header-right">
        <button
          type="button"
          class="pill-btn pill-btn--solid header-cta"
          @click="goToCourseWorkspace"
        >
          Open course workspace
        </button>
      </div>
    </header>

    <!-- Thin progress bar under header -->
    <div
      v-if="drillProgress.active && drillProgress.total"
      class="drill-progress-shell"
    >
      <div class="drill-progress-track">
        <div
          class="drill-progress-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <div class="drill-progress-meta">
        <span>Question {{ drillProgress.current }} of {{ drillProgress.total }}</span>
        <span>{{ progressPercent }}%</span>
      </div>
    </div>

    <main class="page-main quick-drill-page-main">
      <div class="quick-drill-inner">
        <!-- If no course chosen yet: show info + course picker -->
        <template v-if="!courseId">
          <div class="quick-grid">
            <div class="quick-grid-col quick-grid-col--intro">
              <StateBlock
                title="Pick a course to begin"
                message="Run focused MCQ sessions against a specific course so Jabuspark knows where to pull questions from."
                tone="info"
              />

              <section class="card info-card">
                <h2 class="info-card-title">How quick drill works</h2>
                <ul class="info-list">
                  <li>Choose one of your registered courses.</li>
                  <li>Jabuspark pulls random MCQs for that course.</li>
                  <li>Everything is timed and auto-marked like CBT.</li>
                  <li>Your best scores and last attempt are tracked.</li>
                </ul>
              </section>
            </div>

            <section class="card course-picker-card quick-grid-col quick-grid-col--picker">
              <div class="course-picker-header">
                <h2>Select a course to drill</h2>
                <p class="course-picker-sub">
                  Choose any of your registered courses to generate practice questions.
                </p>
              </div>

              <div v-if="loadingCoursesList" class="picker-loading">
                <div class="spinner"></div>
                <p class="picker-loading-text">Loading your courses…</p>
              </div>

              <div v-else>
                <p v-if="coursesError" class="error-text">
                  {{ coursesError }}
                </p>

                <div v-if="coursesList.length" class="picker-form">
                  <label for="course-select" class="field-label">
                    Course
                  </label>
                  <select
                    id="course-select"
                    class="select-input"
                    v-model="selectedCourseId"
                    @change="handleCourseSelect"
                  >
                    <option value="">Select a course</option>
                    <option
                      v-for="c in coursesList"
                      :key="c.id"
                      :value="c.id"
                    >
                      {{ c.code }} – {{ c.title }}
                    </option>
                  </select>

                  <p class="helper-text">
                    You can always switch course later from the header.
                  </p>
                </div>

                <p v-else class="empty-text">
                  No courses found yet. Try adding courses first from your courses page.
                </p>
              </div>
            </section>
          </div>
        </template>

        <!-- Course chosen: summary + drill card -->
        <template v-else>
          <section class="card quick-summary-card">
            <div class="quick-summary-main">
              <div class="course-meta-row">
                <span class="course-chip">
                  {{ headerCourseLabel }}
                </span>
                <span
                  v-if="headerCourseMeta"
                  class="drill-meta-chip"
                >
                  {{ headerCourseMeta }}
                </span>
              </div>

              <p class="summary-subtitle">
                Short, focused MCQ sessions to help you check your understanding for this course.
              </p>

              <div v-if="hasLastDrill" class="stats-row">
                <div class="stat-pill stat-pill--emphasis">
                  <span class="stat-label">Last score</span>
                  <span class="stat-value">
                    {{ lastDrill.score }} / {{ lastDrill.total }}
                    <span v-if="lastDrillPercent !== null" class="stat-percent">
                      ({{ lastDrillPercent }}%)
                    </span>
                  </span>
                </div>

                <div class="stat-pill">
                  <span class="stat-label">Drill size</span>
                  <span class="stat-value">
                    {{ lastDrill.drillSize }} questions
                  </span>
                </div>

                <div class="stat-pill">
                  <span class="stat-label">Last attempt</span>
                  <span class="stat-value">
                    {{ formatDate(lastDrill.date) }}
                  </span>
                </div>
              </div>

              <p v-else class="empty-text">
                You haven’t done a quick drill for this course yet. Start one below to see your stats here.
              </p>
            </div>
          </section>

          <section class="quick-drill-card-shell">
            <div class="quick-drill-card-header">
              <div>
                <h2 class="quick-drill-title">Start a quick drill</h2>
                <p class="quick-drill-sub">
                  Choose your drill settings below and begin. Your score will be saved to this course.
                </p>
              </div>

              <!-- Keyboard shortcut hints (desktop only) -->
              <ul class="shortcut-list">
                <li>
                  <span class="shortcut-key">← / →</span>
                  <span class="shortcut-label">Previous / next question</span>
                </li>
                <li>
                  <span class="shortcut-key">1 – 4</span>
                  <span class="shortcut-label">Select options</span>
                </li>
                <li>
                  <span class="shortcut-key">Enter</span>
                  <span class="shortcut-label">Submit / go next</span>
                </li>
              </ul>
            </div>

            <!-- Feedback mode toggle -->
            <section class="drill-mode-section">
              <div class="drill-mode-header">
                <h3 class="drill-mode-title">Feedback mode</h3>
                <p class="drill-mode-sub">
                  Choose how you want to see answers and explanations.
                </p>
              </div>

              <div class="drill-mode-toggle">
                <button
                  type="button"
                  class="mode-toggle-pill"
                  :class="{ 'mode-toggle-pill--active': feedbackMode === 'instant' }"
                  @click="feedbackMode = 'instant'"
                >
                  Instant feedback
                  <span class="mode-toggle-pill-hint">
                    Show result after each question
                  </span>
                </button>

                <button
                  type="button"
                  class="mode-toggle-pill"
                  :class="{ 'mode-toggle-pill--active': feedbackMode === 'end' }"
                  @click="feedbackMode = 'end'"
                >
                  End of drill
                  <span class="mode-toggle-pill-hint">
                    Mark everything at the end
                  </span>
                </button>
              </div>
            </section>

            <QuickDrillCard
              :course-id="courseId"
              mode="fullscreen"
              :feedback-mode="feedbackMode"
              @toast="handleToast"
              @progress="handleDrillProgress"
              @completed="handleDrillCompleted"
            />
          </section>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import QuickDrillCard from "../components/QuickDrill.vue";
import StateBlock from "../components/ui/StateBlock.vue";
import { getCourse, getCourses } from "../services/courses";

const route = useRoute();
const router = useRouter();

// courseId comes from query (?courseId=12)
const courseId = computed(() => {
  const id = route.query.courseId;
  return id ? Number(id) : null;
});

const course = ref(null);
const loadingCourse = ref(false);
const courseError = ref("");

// List of all courses (for picker)
const coursesList = ref([]);
const loadingCoursesList = ref(false);
const coursesError = ref("");
const selectedCourseId = ref("");

// Toast state
const toast = ref({
  visible: false,
  type: "success",
  message: "",
});

// Feedback mode for the drill: 'instant' or 'end'
const feedbackMode = ref("end");

// Last drill summary for this course (from localStorage or @completed)
const lastDrill = ref(null);

// Progress bar state (live during drill)
const drillProgress = ref({
  current: 0,
  total: 0,
  active: false,
});

const progressPercent = computed(() => {
  if (!drillProgress.value.total) return 0;
  const pct = Math.round(
    (drillProgress.value.current / drillProgress.value.total) * 100
  );
  return Number.isFinite(pct) ? pct : 0;
});

const headerCourseLabel = computed(() => {
  if (course.value?.code && course.value?.title) {
    return `${course.value.code} – ${course.value.title}`;
  }

  const code = route.query.courseCode;
  const title = route.query.courseTitle;

  if (code && title) return `${code} – ${title}`;
  if (code) return String(code);
  if (title) return String(title);

  return "your courses";
});

const headerCourseMeta = computed(() => {
  if (course.value?.level) {
    return `${course.value.level} level`;
  }
  return "";
});

const hasLastDrill = computed(
  () => !!lastDrill.value && !!lastDrill.value.total
);

const lastDrillPercent = computed(() => {
  if (!lastDrill.value || !lastDrill.value.total) return null;
  const pct = Math.round((lastDrill.value.score / lastDrill.value.total) * 100);
  return Number.isFinite(pct) ? pct : null;
});

function handleToast(payload) {
  const { message, type = "success" } =
    typeof payload === "string"
      ? { message: payload, type: "success" }
      : payload || {};

  if (!message) return;

  toast.value = {
    visible: true,
    type,
    message,
  };

  window.clearTimeout(handleToast._timer);
  handleToast._timer = window.setTimeout(() => {
    toast.value.visible = false;
  }, 2600);
}

function handleDrillProgress(payload) {
  if (!payload) return;
  const {
    current = 0,
    total = 0,
    state,
  } = payload;

  const isActive =
    state === "active" ||
    state === "in_progress" ||
    (current > 0 && current <= total);

  drillProgress.value = {
    current,
    total,
    active: isActive,
  };
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

async function loadCourse() {
  if (!courseId.value) {
    course.value = null;
    courseError.value = "";
    return;
  }

  try {
    loadingCourse.value = true;
    courseError.value = "";
    course.value = await getCourse(courseId.value);
  } catch (e) {
    console.error("Failed to load course", e);
    courseError.value = "Could not load course details.";
  } finally {
    loadingCourse.value = false;
  }
}

async function loadCoursesList() {
  try {
    loadingCoursesList.value = true;
    coursesError.value = "";
    const items = await getCourses();
    coursesList.value = Array.isArray(items) ? items : [];
  } catch (e) {
    console.error("Failed to load courses list", e);
    coursesError.value = "Could not load your courses.";
    coursesList.value = [];
  } finally {
    loadingCoursesList.value = false;
  }
}

function loadLastDrill() {
  if (!courseId.value) {
    lastDrill.value = null;
    return;
  }

  try {
    const key = "jabuspark_drill_history";
    const raw = localStorage.getItem(key);
    if (!raw) {
      lastDrill.value = null;
      return;
    }
    const arr = JSON.parse(raw);
    const found = arr.find(
      (r) => Number(r.courseId) === Number(courseId.value)
    );
    lastDrill.value = found || null;
  } catch (e) {
    console.error("Failed to load drill history", e);
    lastDrill.value = null;
  }
}

function handleDrillCompleted(payload) {
  if (!payload) return;
  // Payload shape: { courseId, score, total, drillSize, date }
  lastDrill.value = {
    courseId: payload.courseId,
    score: payload.score,
    total: payload.total,
    drillSize: payload.drillSize,
    date: payload.date || new Date().toISOString(),
  };

  // Hide live progress bar once completed
  drillProgress.value = {
    current: payload.total || 0,
    total: payload.total || 0,
    active: false,
  };
}

function handleCourseSelect() {
  if (!selectedCourseId.value) return;

  const idNum = Number(selectedCourseId.value);
  const c = coursesList.value.find((c) => Number(c.id) === idNum);

  const query = {
    courseId: String(idNum),
  };

  if (c) {
    if (c.code) query.courseCode = c.code;
    if (c.title) query.courseTitle = c.title;
  }

  router.push({
    path: "/quick-drill",
    query,
  });
}

function goBack() {
  const from = route.query.from;

  if (typeof from === "string" && from) {
    router.push(from);
    return;
  }

  if (courseId.value) {
    router.push({ path: `/courses/${courseId.value}` });
  } else {
    router.push({ path: "/courses" });
  }
}

function goToCourseWorkspace() {
  if (!courseId.value) return;
  router.push({ path: `/courses/${courseId.value}` });
}

onMounted(() => {
  if (courseId.value) {
    loadCourse();
    loadLastDrill();
  } else {
    loadCoursesList();
  }
});

watch(
  courseId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadCourse();
      loadLastDrill();
      // Reset progress when switching courses
      drillProgress.value = {
        current: 0,
        total: 0,
        active: false,
      };
    }
  }
);
</script>

<style scoped>
.page--quick-drill .page-main {
  padding-bottom: 2.5rem;
}

/* Exam-style header (sticky on desktop only) */
.page-header--quick-drill {
  position: sticky;
  top: 0;
  z-index: 20;
  background: linear-gradient(
    to bottom,
    rgba(248, 250, 252, 0.98),
    rgba(248, 250, 252, 0.92)
  );
  backdrop-filter: blur(14px);
  margin-bottom: 0.3rem;
  padding: 0.75rem 0.95rem 0.75rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0 0 1rem 1rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
}

.header-left {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.header-right {
  display: flex;
  align-items: center;
}

/* Back link */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.8rem;
  padding: 0.25rem 0.65rem;
  cursor: pointer;
}

.back-link--ghost {
  background: rgba(15, 23, 42, 0.03);
  border-color: rgba(148, 163, 184, 0.45);
}

.back-link--ghost:hover {
  background: rgba(15, 23, 42, 0.06);
}

.back-icon {
  font-size: 0.9rem;
}

.back-text {
  font-weight: 500;
}

/* Small eyebrow label above title */
.eyebrow-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #9ca3af;
}

.page-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
}

/* Sub line with course + meta */
.page-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  font-size: 0.82rem;
  color: #6b7280;
}

.page-sub-main {
  font-weight: 500;
  color: #4b5563;
}

.page-sub-meta {
  color: #9ca3af;
}

/* Mode pills under title */
.mode-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.2rem;
}

.mode-pill {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #0f172a;
  color: #f9fafb;
}

.mode-pill--soft {
  background: #f9fafb;
  color: #4b5563;
}

/* CTA button on header right reuses global .pill-btn styles */
.header-cta {
  font-size: 0.78rem;
}

/* Thin progress bar under header */
.drill-progress-shell {
  padding: 0.4rem 0.95rem 0.2rem;
  background: rgba(15, 23, 42, 0.02);
  backdrop-filter: blur(8px);
}

.drill-progress-track {
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.25);
}

.drill-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(to right, #4f46e5, #0ea5e9);
  transition: width 0.18s ease-out;
}

.drill-progress-meta {
  margin-top: 0.15rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #6b7280;
}

/* Exam-like background behind the main content */
.quick-drill-page-main {
  background:
    radial-gradient(circle at top, rgba(79, 70, 229, 0.07), transparent 55%),
    radial-gradient(circle at bottom, rgba(14, 165, 233, 0.04), transparent 55%);
}

/* Inner shell that centers the card stack */
.quick-drill-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0.9rem 0 2.5rem;
}

/* Grid layout when no course selected */
.quick-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 1rem;
  align-items: flex-start;
}

.quick-grid-col--intro {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

/* Info card under StateBlock */
.info-card {
  padding-top: 0.9rem;
  padding-bottom: 0.9rem;
}

.info-card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.35rem;
}

.info-list {
  list-style: disc;
  padding-left: 1.1rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.info-list li + li {
  margin-top: 0.2rem;
}

/* Summary card */
.quick-summary-card {
  padding-top: 1.1rem;
  padding-bottom: 1.05rem;
  margin-bottom: 0.75rem;
}

.course-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  margin-bottom: 0.4rem;
}

.course-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.7rem;
  border-radius: 999px;
  background: #eef2ff;
  border: 1px solid #e0e7ff;
  font-size: 0.8rem;
  font-weight: 500;
  color: #312e81;
}

.drill-meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.7rem;
  border-radius: 999px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 0.78rem;
  color: #4b5563;
}

.summary-subtitle {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.6rem;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.stat-pill {
  min-width: 0;
  flex: 0 0 auto;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat-pill--emphasis {
  background: #ecfdf5;
  border-color: #bbf7d0;
}

.stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
}

.stat-value {
  font-size: 0.83rem;
  font-weight: 600;
  color: #111827;
}

.stat-percent {
  margin-left: 0.15rem;
  font-weight: 500;
  color: #059669;
}

/* Course picker card */
.course-picker-card {
  margin-top: 0.25rem;
}

.course-picker-header h2 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.course-picker-sub {
  margin-top: 0.2rem;
  font-size: 0.82rem;
  color: #6b7280;
}

.picker-form {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: #4b5563;
}

.select-input {
  width: 100%;
  border-radius: 0.7rem;
  border: 1px solid #d1d5db;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  background: #ffffff;
}

.select-input:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.helper-text {
  font-size: 0.78rem;
  color: #9ca3af;
}

.picker-loading {
  margin-top: 0.6rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.picker-loading-text {
  font-size: 0.82rem;
  color: #6b7280;
}

/* Drill card shell + header */
.quick-drill-card-shell {
  margin-top: 0.35rem;
}

.quick-drill-card-header {
  margin-bottom: 0.4rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.6rem;
}

.quick-drill-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.quick-drill-sub {
  font-size: 0.82rem;
  color: #6b7280;
}

/* Keyboard shortcut hints */
.shortcut-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.shortcut-list li {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.18rem 0.45rem;
  border-radius: 999px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 0.75rem;
  color: #4b5563;
}

.shortcut-key {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  padding: 0.05rem 0.3rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  font-size: 0.72rem;
}

.shortcut-label {
  white-space: nowrap;
}

/* Feedback mode UI */
.drill-mode-section {
  margin-top: 0.6rem;
  margin-bottom: 0.75rem;
}

.drill-mode-header {
  margin-bottom: 0.35rem;
}

.drill-mode-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f172a;
}

.drill-mode-sub {
  font-size: 0.78rem;
  color: #6b7280;
}

.drill-mode-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
}

.mode-toggle-pill {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  padding: 0.45rem 0.65rem;
  font-size: 0.8rem;
  text-align: left;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  cursor: pointer;
}

.mode-toggle-pill--active {
  border-color: #4f46e5;
  background: linear-gradient(to right, #eef2ff, #e0f2fe);
}

.mode-toggle-pill-hint {
  font-size: 0.72rem;
  color: #6b7280;
}

/* Small screens */
@media (max-width: 640px) {
  .page-header--quick-drill {
    position: static;      /* turn OFF sticky on mobile */
    top: auto;
    box-shadow: none;
    backdrop-filter: none;
    flex-direction: column;
    align-items: stretch;
    gap: 0.55rem;
    padding: 0.65rem 0.9rem 0.75rem;
    border-radius: 0 0 0.9rem 0.9rem;
  }

  .header-left {
    gap: 0.5rem;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1rem;
  }

  .page-sub {
    font-size: 0.78rem;
  }

  .mode-row {
    margin-top: 0.15rem;
  }

  .mode-pill {
    font-size: 0.68rem;
    padding: 0.16rem 0.55rem;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
  }

  .header-cta {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .drill-progress-shell {
    padding: 0.35rem 0.9rem 0.2rem;
  }

  .quick-drill-inner {
    max-width: 100%;
    padding: 0.75rem 0.9rem 2rem;
  }

  .quick-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.75rem;
  }

  /* Show course picker first on mobile */
  .quick-grid-col--picker {
    order: 1;
  }

  .quick-grid-col--intro {
    order: 2;
  }

  .stats-row {
    flex-direction: column;
    align-items: stretch;
  }

  .stat-pill {
    width: 100%;
  }

  .quick-summary-card,
  .course-picker-card,
  .quick-drill-card-shell,
  .info-card {
    border-radius: 0.9rem;
  }

  .quick-summary-card,
  .course-picker-card {
    padding-top: 0.9rem;
    padding-bottom: 0.9rem;
  }

  .quick-drill-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  /* Shortcut hints are less relevant on phones */
  .shortcut-list {
    display: none;
  }

  .drill-mode-toggle {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
