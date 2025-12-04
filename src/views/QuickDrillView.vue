<!-- src/views/QuickDrillView.vue -->
<template>
  <div class="page page--quick-drill">
    <!-- Simple toast using the same pattern as your other views -->
    <div
      v-if="toast.visible"
      :class="['toast', `toast--${toast.type}`]"
    >
      {{ toast.message }}
    </div>

    <header class="page-header page-header--quick-drill">
      <div class="header-left">
        <button class="back-link" type="button" @click="goBack">
          ← Back
        </button>

        <div class="header-text">
          <h1 class="page-title">Quick drill</h1>
          <p class="page-sub">
            <span>Fast MCQ session from {{ headerCourseLabel }}</span>
            <span v-if="headerCourseMeta">
              {{ headerCourseMeta }}
            </span>
          </p>

          <div class="mode-row">
            <span class="mode-pill">Exam workspace</span>
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

    <main class="page-main quick-drill-page-main">
      <div class="quick-drill-inner">
        <!-- If no course chosen yet: show info + course picker -->
        <template v-if="!courseId">
          <StateBlock
            title="Pick a course first"
            message="Start a quick drill from a specific course so we know where to pull questions from."
            tone="info"
          />

          <section class="card course-picker-card">
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
              </div>

              <p v-else class="empty-text">
                No courses found yet. Try adding courses first from your courses page.
              </p>
            </div>
          </section>
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

              <div class="stats-row" v-if="hasLastDrill">
                <div class="stat-pill">
                  <span class="stat-label">Last score</span>
                  <span class="stat-value">
                    {{ lastDrill.score }} / {{ lastDrill.total }}
                    <span v-if="lastDrillPercent !== null">
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

          <QuickDrillCard
            :course-id="courseId"
            mode="fullscreen"
            @toast="handleToast"
            @completed="handleDrillCompleted"
          />
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

// Last drill summary for this course (from localStorage or @completed)
const lastDrill = ref(null);

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
    }
  }
);
</script>

<style scoped>
.page--quick-drill .page-main {
  padding-bottom: 2.5rem;
}

/* Sticky exam-style header */
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
  margin-bottom: 0.6rem;
  padding-bottom: 0.85rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.header-left {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-right {
  display: flex;
  align-items: center;
}

/* Mode pills under title */
.mode-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.15rem;
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

/* Exam-like background behind the main content */
.quick-drill-page-main {
  background:
    radial-gradient(circle at top, rgba(79, 70, 229, 0.08), transparent 55%),
    radial-gradient(circle at bottom, rgba(14, 165, 233, 0.05), transparent 55%);
}

/* Inner shell that centers the card stack */
.quick-drill-inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 0.75rem 0 2.5rem;
}

/* Summary card */
.quick-summary-card {
  padding-top: 1.15rem;
  padding-bottom: 1.1rem;
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
  padding: 0.45rem 0.7rem;
  font-size: 0.85rem;
  background: #ffffff;
}

.select-input:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
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

/* Small screens */
@media (max-width: 640px) {
  .page-header--quick-drill {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
  }

  .header-left {
    flex-direction: column;
  }

  .header-right {
    justify-content: flex-start;
  }

  .mode-row {
    margin-top: 0.1rem;
  }

  .stats-row {
    flex-direction: column;
    align-items: stretch;
  }

  .stat-pill {
    width: 100%;
  }

  .quick-drill-inner {
    padding-bottom: 2rem;
  }
}
</style>
