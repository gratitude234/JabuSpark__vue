<!-- src/views/CourseDetailView.vue -->
<template>
  <div class="page page--course-detail">
    <!-- Toast -->
    <div v-if="toast.visible" :class="['toast', `toast--${toast.type}`]">
      {{ toast.message }}
    </div>

    <!-- Header -->
    <header class="page-header">
      <RouterLink to="/courses" class="back-link"> ← Back to courses </RouterLink>

      <h1 class="page-title">
        {{ course?.title || (loadingCourse ? "Loading course…" : "Course workspace") }}
      </h1>

      <p class="page-sub">
        <span v-if="course?.code">{{ course.code }}</span>
        <span v-if="course?.level">{{ course.level }} level</span>
        <span v-if="!loadingCourse">Study workspace</span>
      </p>
    </header>

    <!-- DESKTOP / TABLET LAYOUT -->
    <div class="layout" v-if="!isMobile">
      <!-- LEFT COLUMN: Materials + Practice -->
      <div class="left-column">
        <!-- MATERIALS (labeled) -->
        <div class="section-head">
          <p class="section-kicker">Materials</p>
        </div>

        <CourseMaterials
          :course-id="courseId"
          :course="course"
          @toast="handleToast"
          @start-drill="handleStartDrillFromMaterial"
        />

        <!-- PRACTICE (labeled) -->
        <div class="section-head section-head--spaced">
          <p class="section-kicker">Practice</p>
        </div>

        <!-- Quick drill controls card -->
        <section class="card card--drill-controls">
          <div class="card-header">
            <div>
              <h2>Quick drill</h2>
              <p class="card-sub">
                <span v-if="activeDrillMaterial">
                  Short MCQs based on <strong>{{ activeDrillMaterial.title }}</strong>.
                </span>
                <span v-else>
                  Short MCQs to quickly test yourself on {{ course?.code || "this course" }}.
                </span>
              </p>
            </div>

            <div class="card-header-right">
              <!-- Primary CTA -->
              <button type="button" class="pill-btn pill-btn--solid" @click="toggleInlineQuickDrill">
                {{ showInlineQuickDrill ? "Hide drill" : "Start quick drill" }}
              </button>
            </div>
          </div>

          <p class="hint">
            Use the quick drill whenever you want fast, exam-style practice
            <span v-if="activeDrillMaterial">
              for <strong>{{ activeDrillMaterial.title }}</strong>.
            </span>
            <span v-else> for this course. </span>
          </p>
        </section>

        <!-- Inline quick drill (collapsible) -->
        <transition name="fade-slide">
          <QuickDrill
            v-if="showInlineQuickDrill"
            ref="quickDrillRef"
            :course-id="courseId"
            :material-id="activeDrillMaterial?.id || null"
            :material-title="activeDrillMaterial?.title || ''"
            @toast="handleToast"
            @ask-ai="handleAskFromDrill"
            @completed="handleDrillCompleted"
          />
        </transition>
      </div>

      <!-- RIGHT COLUMN: Ask AI (labeled) -->
      <aside class="right-column">
        <div class="section-head">
          <p class="section-kicker">Ask AI</p>
        </div>

        <AskJabuspark
          :course-id="courseId"
          :course="course"
          :initial-question="askInitialQuestion"
          :auto-ask-token="askAutoToken"
          :can-jump-back-to-drill="lastDrillQuestionIndex !== null"
          @toast="handleToast"
          @back-to-drill="handleBackToDrill"
        />
      </aside>
    </div>

    <!-- MOBILE LAYOUT WITH TABS -->
    <div class="mobile-tabs-layout" v-else>
      <div class="mobile-tab-bar">
        <button
          type="button"
          class="mobile-tab"
          :class="{ 'mobile-tab--active': activeMobileTab === 'materials' }"
          @click="setActiveTab('materials')"
        >
          Materials
        </button>

        <button
          type="button"
          class="mobile-tab"
          :class="{ 'mobile-tab--active': activeMobileTab === 'practice' }"
          @click="setActiveTab('practice')"
        >
          Practice
        </button>

        <button
          type="button"
          class="mobile-tab"
          :class="{ 'mobile-tab--active': activeMobileTab === 'ai' }"
          @click="setActiveTab('ai')"
        >
          Ask AI
        </button>
      </div>

      <div class="mobile-tab-content">
        <CourseMaterials
          v-if="activeMobileTab === 'materials'"
          :course-id="courseId"
          :course="course"
          @toast="handleToast"
          @start-drill="handleStartDrillFromMaterial"
        />

        <!-- On mobile, drill is always visible inside its tab -->
        <div v-else-if="activeMobileTab === 'practice'" class="space-y-2">
          <QuickDrill
            ref="quickDrillRef"
            :course-id="courseId"
            :material-id="activeDrillMaterial?.id || null"
            :material-title="activeDrillMaterial?.title || ''"
            @toast="handleToast"
            @ask-ai="handleAskFromDrill"
            @completed="handleDrillCompleted"
          />
        </div>

        <AskJabuspark
          v-else
          :course-id="courseId"
          :course="course"
          :initial-question="askInitialQuestion"
          :auto-ask-token="askAutoToken"
          :can-jump-back-to-drill="lastDrillQuestionIndex !== null"
          @toast="handleToast"
          @back-to-drill="handleBackToDrill"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { getCourse } from "../services/courses";

import CourseMaterials from "../components/CourseMaterials.vue";
import QuickDrill from "../components/QuickDrill.vue";
import AskJabuspark from "../components/AskJabuspark.vue";

const route = useRoute();
const courseId = Number(route.params.id);

const course = ref(null);
const loadingCourse = ref(false);

// Toast state
const toast = ref({
  visible: false,
  message: "",
  type: "success", // 'success' | 'error'
});

// --- Mobile / layout state ---
const isMobile = ref(false);
const activeMobileTab = ref("materials"); // 'materials' | 'practice' | 'ai'

// Inline drill toggle (desktop)
const showInlineQuickDrill = ref(false);

// Active drill context: null = whole course, { id, title, ... } = material-based
const activeDrillMaterial = ref(null);

// Ref to QuickDrill to be able to scroll back to a question
const quickDrillRef = ref(null);

// For passing a prefilled question into AskJabuspark
const askInitialQuestion = ref("");

// 🔹 Token to trigger auto-send in AskJabuspark
const askAutoToken = ref(0);

// 🔹 Remember which drill question we came from
const lastDrillQuestionIndex = ref(null);

// ---------- HELPERS & STATE ----------
function setActiveTab(tab) {
  activeMobileTab.value = tab;
}

function updateIsMobile() {
  if (typeof window === "undefined") return;
  isMobile.value = window.innerWidth <= 640;
}

function handleToast(payload) {
  const { message, type = "success" } =
    typeof payload === "string" ? { message: payload, type: "success" } : payload || {};

  if (!message) return;

  toast.value = { visible: true, message, type };

  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
}

async function loadCourse() {
  try {
    loadingCourse.value = true;
    course.value = await getCourse(courseId);
  } catch (e) {
    console.error("Failed to load course", e);
    handleToast({
      message: "Could not load course details.",
      type: "error",
    });
  } finally {
    loadingCourse.value = false;
  }
}

function toggleInlineQuickDrill() {
  const next = !showInlineQuickDrill.value;
  showInlineQuickDrill.value = next;

  // If user manually opens the drill from the header,
  // reset to whole-course drill (not tied to a specific material)
  if (next) {
    activeDrillMaterial.value = null;
  }
}

/**
 * When a material card wants to start a drill:
 *  - material: object from CourseMaterials (at least { id, title })
 */
function handleStartDrillFromMaterial(material) {
  activeDrillMaterial.value = material || null;

  if (isMobile.value) {
    activeMobileTab.value = "practice";
  } else {
    showInlineQuickDrill.value = true;
    // Scroll the drill card into view
    nextTick(() => {
      const el = document.querySelector(".quick-drill-card");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  handleToast({
    message: `Quick drill started for ${material?.title || course.value?.code || "this course"}.`,
    type: "success",
  });
}

/**
 * When QuickDrill emits "ask-ai":
 *  - payload.prompt: text we want to ask
 *  - payload.questionIndex: index of question in the drill
 */
function handleAskFromDrill(payload) {
  const prompt = (payload?.prompt || "").trim();

  askInitialQuestion.value = prompt;
  lastDrillQuestionIndex.value =
    typeof payload?.questionIndex === "number" ? payload.questionIndex : null;

  // 1) Move UI to Ask Jabuspark
  if (isMobile.value) {
    activeMobileTab.value = "ai";
  } else if (typeof window !== "undefined") {
    requestAnimationFrame(() => {
      const el = document.querySelector(".ask-card");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // 2) Trigger auto-send in AskJabuspark
  askAutoToken.value++;
}

/**
 * ✅ Step 6: When drill finishes → save progress (front-end MVP fallback).
 * QuickDrill should emit:
 *   @completed="{ score, total, correct, courseId, materialId, materialTitle }"
 */
function handleDrillCompleted(payload) {
  // NOTE: Backend may not support this yet → localStorage fallback.
  // This powers Dashboard "last score" even when API returns empty.
  try {
    const total = Number(payload?.total || 0);
    const correct = Number(payload?.correct || 0);
    const score =
      typeof payload?.score === "number"
        ? payload.score
        : total > 0
        ? Math.round((correct / total) * 100)
        : 0;

    const attempt = {
      id: `local-${Date.now()}`,
      courseId,
      courseCode: course.value?.code || "",
      courseTitle: course.value?.title || "",
      materialId: payload?.materialId ?? activeDrillMaterial.value?.id ?? null,
      materialTitle: payload?.materialTitle ?? activeDrillMaterial.value?.title ?? "",
      total,
      correct,
      score,
      date: new Date().toISOString(),
      source: "localStorage-fallback",
    };

    localStorage.setItem("jabuspark_last_attempt", JSON.stringify(attempt));

    const raw = localStorage.getItem("jabuspark_drill_history");
    const arr = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(arr) ? arr : [];
    next.unshift(attempt);
    localStorage.setItem("jabuspark_drill_history", JSON.stringify(next.slice(0, 50)));
  } catch (e) {
    console.warn("Could not persist drill attempt", e);
  }

  handleToast({ message: "Progress saved. Nice work ✅", type: "success" });
}

/**
 * Handle "Back to drill question" from AskJabuspark
 */
function handleBackToDrill() {
  const idx = lastDrillQuestionIndex.value;

  if (isMobile.value) {
    activeMobileTab.value = "practice";
  } else {
    showInlineQuickDrill.value = true;
  }

  if (idx == null) return;

  // Wait for QuickDrill to be rendered, then ask it to scroll
  nextTick(() => {
    const inst = quickDrillRef.value;
    if (inst && typeof inst.scrollToQuestionFromOutside === "function") {
      inst.scrollToQuestionFromOutside(idx);
    }
  });
}

// 👀 Keep the drill tab / inline drill in sync with query (?tab=drill|practice, ?drillId=...)
// Note: drillId may represent a specific material drill; for now we just open the drill.
watch(
  () => [route.query.drillId, route.query.tab, isMobile.value],
  ([drillId, tab]) => {
    const hasDrillId = drillId !== undefined && drillId !== null && drillId !== "";
    const wantsPractice = tab === "drill" || tab === "practice" || hasDrillId;

    if (isMobile.value) {
      if (wantsPractice) {
        activeMobileTab.value = "practice";
      } else if (tab === "ai") {
        activeMobileTab.value = "ai";
      } else {
        activeMobileTab.value = "materials";
      }
    } else {
      if (wantsPractice) {
        showInlineQuickDrill.value = true;
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  // ✅ remember last opened course so /practice can "Continue"
  try {
    localStorage.setItem("jabuspark_last_course_id", String(courseId));
  } catch (e) {
    // ignore storage errors (private mode etc.)
  }

  loadCourse();
  updateIsMobile();
  if (typeof window !== "undefined") {
    window.addEventListener("resize", updateIsMobile);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", updateIsMobile);
  }
});
</script>

<style>
/* === NEW: Small section labels (safe additions) === */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.15rem;
}

.section-head--spaced {
  margin-top: 0.9rem;
}

.section-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b; /* slate-500-ish */
}

/* ---------------- Existing styles (kept) ---------------- */
.page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 3rem;
  position: relative;
}

.page--course-detail {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* Toast */
.toast {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  padding: 0.65rem 1.1rem;
  border-radius: 0.9rem;
  font-size: 0.8rem;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
  z-index: 50;
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  backdrop-filter: blur(12px);
  background-color: rgba(248, 250, 252, 0.95);
  border: 1px solid transparent;
  animation: toast-in 0.22s ease-out;
}

.toast::before {
  content: "";
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.toast--success {
  background-color: #ecfdf3;
  color: #166534;
  border-color: #bbf7d0;
}

.toast--success::before {
  background: #16a34a;
}

.toast--error {
  background-color: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.toast--error::before {
  background: #dc2626;
}

@keyframes toast-in {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Header */
.page-header {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.back-link {
  align-self: flex-start;
  font-size: 0.78rem;
  color: #4f46e5;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.18rem 0.75rem;
  border-radius: 999px;
  background: #eef2ff;
  border: 1px solid #e0e7ff;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.back-link:hover {
  background: #e0e7ff;
  border-color: #c7d2fe;
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.28);
  transform: translateY(-1px);
}

.back-link:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #020617;
  margin-top: 0.35rem;
  letter-spacing: -0.03em;
}

.page-sub {
  margin-top: 0.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.page-sub span {
  display: inline-flex;
  align-items: center;
  padding: 0.16rem 0.6rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* Layout */
.layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 1.5rem;
  align-items: flex-start;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Shared card surface */
.card {
  background: #ffffff;
  border-radius: 1.25rem;
  border: 1px solid #e5e7eb;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.04);
  transition:
    box-shadow 0.18s ease,
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.card:hover {
  border-color: #d1d5db;
  box-shadow: 0 22px 55px rgba(15, 23, 42, 0.06);
  transform: translateY(-2px);
}

/* extra spacing for drill controls card */
.card--drill-controls {
  margin-top: 0.75rem;
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

.card--materials {
  padding-bottom: 1rem;
}

.card-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
}

.badge-muted {
  background: #f3f4f6;
  color: #6b7280;
}

.pill {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  color: #4b5563;
  background: #f9fafb;
}

.empty-text {
  font-size: 0.85rem;
  color: #6b7280;
}

.hint {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* QUICK DRILL (card itself is inside QuickDrill component) */
.quick-drill-card {
  margin-top: 0.5rem;
}

.quick-header {
  align-items: flex-start;
}

.quick-header-left {
  flex: 1;
}

.quick-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

.last-drill-chip {
  margin-top: 0.35rem;
  font-size: 0.78rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #f3f4ff;
  color: #4338ca;
  display: inline-block;
}

/* Mobile tabs (hidden by default, enabled in mobile media query) */
.mobile-tabs-layout {
  display: none;
}

.mobile-tab-bar {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: #f3f4f6;
}

.mobile-tab {
  flex: 1;
  border-radius: 999px;
  border: none;
  background: transparent;
  font-size: 0.8rem;
  padding: 0.4rem 0.2rem;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.mobile-tab--active {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.mobile-tab-content {
  margin-top: 0.2rem;
}

/* Fade/slide transition for inline drill */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Responsive */
/* Tablet breakpoint */
@media (max-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .toast {
    right: 1rem;
    left: 1rem;
    bottom: 1rem;
    text-align: left;
  }

  .quick-header-right {
    align-items: flex-start;
  }
}

/* Extra tuning for small phones */
@media (max-width: 640px) {
  .page {
    padding: 1.25rem 1rem 2.25rem;
  }

  .page-header {
    margin-bottom: 1.1rem;
  }

  .page-title {
    font-size: 1.35rem;
    line-height: 1.2;
  }

  .page-sub {
    font-size: 0.8rem;
  }

  .card {
    padding: 1rem 1rem 1.1rem;
    border-radius: 1rem;
  }

  /* On small screens, hide the desktop grid and show tabs layout */
  .layout {
    display: none;
  }

  .mobile-tabs-layout {
    display: block;
  }

  .mobile-tab-bar {
    position: sticky;
    top: 0.5rem;
    z-index: 10;
    backdrop-filter: blur(12px);
    background-color: rgba(243, 244, 246, 0.92);
  }

  /* Stack card headers nicely */
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 0.6rem;
  }

  .card-header-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
