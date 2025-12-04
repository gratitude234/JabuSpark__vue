<!-- src/views/CourseDetailView.vue -->
<template>
  <div class="page page--course-detail">
    <!-- Toast -->
    <div
      v-if="toast.visible"
      :class="['toast', `toast--${toast.type}`]"
    >
      {{ toast.message }}
    </div>

    <!-- Header -->
    <header class="page-header">
      <RouterLink to="/courses" class="back-link">
        ← Back to courses
      </RouterLink>

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
      <!-- LEFT COLUMN: Materials + Drill -->
      <div class="left-column">
        <CourseMaterials
          :course-id="courseId"
          :course="course"
          @toast="handleToast"
        />

        <!-- Quick drill controls card -->
        <section class="card card--drill-controls">
          <div class="card-header">
            <div>
              <h2>Quick drill for this course</h2>
              <p class="card-sub">
                Short MCQs to quickly test yourself on
                {{ course?.code || "this course" }}.
              </p>
            </div>

            <div class="card-header-right">
              <button
                type="button"
                class="pill-btn pill-btn--solid"
                @click="toggleInlineQuickDrill"
              >
                {{ showInlineQuickDrill ? "Hide drill" : "Start quick drill" }}
              </button>

              <button
                type="button"
                class="pill-btn"
                @click="openFullDrillPage"
              >
                Full drill page
              </button>
            </div>
          </div>

          <p class="hint">
            Use the inline drill for quick revision. Open the full page when you
            want a more focused session.
          </p>
        </section>

        <!-- Inline quick drill (collapsible) -->
        <transition name="fade-slide">
          <QuickDrill
            v-if="showInlineQuickDrill"
            :course-id="courseId"
            @toast="handleToast"
          />
        </transition>
      </div>

      <!-- RIGHT COLUMN: Ask Jabuspark -->
      <aside class="right-column">
        <AskJabuspark
          :course-id="courseId"
          :course="course"
          @toast="handleToast"
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
          :class="{ 'mobile-tab--active': activeMobileTab === 'drill' }"
          @click="setActiveTab('drill')"
        >
          Quick drill
        </button>
        <button
          type="button"
          class="mobile-tab"
          :class="{ 'mobile-tab--active': activeMobileTab === 'ai' }"
          @click="setActiveTab('ai')"
        >
          Ask Jabuspark
        </button>
      </div>

      <div class="mobile-tab-content">
        <CourseMaterials
          v-if="activeMobileTab === 'materials'"
          :course-id="courseId"
          :course="course"
          @toast="handleToast"
        />

        <!-- On mobile, drill is always visible inside its tab -->
        <div
          v-else-if="activeMobileTab === 'drill'"
          class="space-y-2"
        >
          <QuickDrill
            :course-id="courseId"
            @toast="handleToast"
          />
        </div>

        <AskJabuspark
          v-else
          :course-id="courseId"
          :course="course"
          @toast="handleToast"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getCourse } from "../services/courses";

import CourseMaterials from "../components/CourseMaterials.vue";
import QuickDrill from "../components/QuickDrill.vue";
import AskJabuspark from "../components/AskJabuspark.vue";

const route = useRoute();
const router = useRouter();
const courseId = Number(route.params.id);

const course = ref(null);
const loadingCourse = ref(false);

// Toast state
const toast = ref({
  visible: false,
  message: "",
  type: "success", // 'success' | 'error'
});

// --- Mobile tab state ---
const isMobile = ref(false);
const activeMobileTab = ref("materials"); // 'materials' | 'drill' | 'ai'

// Inline drill toggle (desktop)
const showInlineQuickDrill = ref(false);

function setActiveTab(tab) {
  activeMobileTab.value = tab;
}

function updateIsMobile() {
  if (typeof window === "undefined") return;
  isMobile.value = window.innerWidth <= 640;
}

function handleToast(payload) {
  const { message, type = "success" } =
    typeof payload === "string"
      ? { message: payload, type: "success" }
      : payload || {};

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
  showInlineQuickDrill.value = !showInlineQuickDrill.value;
}

function openFullDrillPage() {
  // If course is not yet loaded, fall back to courseId only
  const c = course.value || {};
  router.push({
    path: "/quick-drill",
    query: {
      courseId: String(c.id || courseId),
      courseCode: c.code || "",
      courseTitle: c.title || "",
    },
  });
}

onMounted(() => {
  loadCourse();
  updateIsMobile();
  window.addEventListener("resize", updateIsMobile);
});

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", updateIsMobile);
  }
});
</script>

<!-- Shared “workspace” styles – slightly elevated, more polished look -->
<style>
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

/* Materials list */
.materials-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
}

.materials-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-top: 1px solid #f3f4f6;
}

.materials-item:first-of-type {
  border-top: none;
}

.materials-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.materials-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.file-pill {
  font-size: 0.9rem;
}

.materials-meta {
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.dot::before {
  content: "• ";
  color: #d1d5db;
}

.pill-btn {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0.3rem 0.9rem;
  font-size: 0.8rem;
  color: #4f46e5;
  background: #f9fafb;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.pill-btn:hover {
  background: #eef2ff;
  border-color: #c7d2fe;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

/* Solid version for Upload / main actions */
.pill-btn--solid {
  background: #4f46e5;
  color: #ffffff;
  border-color: #4f46e5;
}

.pill-btn--solid:hover {
  background: #4338ca;
  border-color: #4338ca;
}

/* Upload panel */
.upload-panel {
  margin-top: 0.75rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.9rem;
  background: #f9fafb;
  border: 1px dashed #e5e7eb;
}

.upload-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.upload-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #4b5563;
}

.upload-input {
  font-size: 0.8rem;
  padding: 0.4rem 0.6rem;
  border-radius: 0.55rem;
  border: 1px solid #d1d5db;
  background: #ffffff;
}

.upload-input:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 1px;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.error-text {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #b91c1c;
}

.success-text {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #15803d;
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

.drill-size-switch {
  display: flex;
  gap: 0.3rem;
}

.size-pill {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0.16rem 0.55rem;
  font-size: 0.72rem;
  background: #f9fafb;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.size-pill--active {
  background: #4f46e5;
  color: #ffffff;
  border-color: #4f46e5;
  box-shadow: 0 10px 26px rgba(79, 70, 229, 0.4);
}

.spinner-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0;
}

.spinner {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2px solid #e5e7eb;
  border-top-color: #4f46e5;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Progress */
.progress-row {
  margin-top: 0.25rem;
  margin-bottom: 0.4rem;
}

.progress-label {
  display: block;
  font-size: 0.78rem;
  color: #4b5563;
  margin-bottom: 0.2rem;
}

.progress-bar {
  width: 100%;
  height: 0.35rem;
  border-radius: 999px;
  background: #f3f4f6;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(to right, #4f46e5, #6366f1);
  transition: width 0.2s ease-out;
}

.question-list {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.question-item {
  padding: 0.65rem 0;
  border-top: 1px solid #f3f4f6;
}

.question-item:first-of-type {
  border-top: none;
}

.question-text {
  display: flex;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #111827;
  margin-bottom: 0.45rem;
}

.question-number {
  font-weight: 600;
  color: #4b5563;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.4rem;
}

.option-pill {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 0.3rem 0.7rem;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.option-pill:hover {
  background: #eef2ff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.option-pill .opt-label {
  font-weight: 600;
  color: #4b5563;
}

.option-pill .opt-text {
  color: #111827;
}

/* Selected before submit */
.option-pill.selected {
  border-color: #4f46e5;
  background: #eef2ff;
}

/* After submit */
.option-pill.correct {
  border-color: #16a34a;
  background: #ecfdf3;
}

.option-pill.incorrect {
  border-color: #dc2626;
  background: #fef2f2;
}

.explanation-text {
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: #4b5563;
}

.drill-footer {
  margin-top: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.score-pill {
  font-size: 0.85rem;
  padding: 0.25rem 0.8rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #111827;
}

.drill-actions-inline {
  margin-top: 0.6rem;
}

/* Buttons (for drill) */
.btn {
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.btn-primary {
  background: #4f46e5;
  color: #ffffff;
  border-color: #4f46e5;
}

.btn-primary:hover {
  background: #4338ca;
  border-color: #4338ca;
  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.45);
  transform: translateY(-1px);
}

.btn-outline {
  background: #ffffff;
  color: #4f46e5;
  border-color: #e5e7eb;
}

.btn-outline:hover {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.btn-ghost {
  background: transparent;
  color: #4b5563;
  border-color: transparent;
}

.btn-ghost:hover {
  background: #f3f4f6;
}

/* Alerts */
.alert {
  font-size: 0.8rem;
  padding: 0.45rem 0.75rem;
  border-radius: 0.8rem;
  margin-bottom: 0.45rem;
}

.alert-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

/* Ask Jabuspark styles */
.examples {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #4b5563;
}

.examples-label {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.examples ul {
  padding-left: 1.1rem;
}

.chat-form {
  margin-top: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.textarea {
  width: 100%;
  border-radius: 0.9rem;
  border: 1px solid #d1d5db;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  resize: vertical;
  min-height: 80px;
}

.textarea:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.primary-btn {
  border-radius: 999px;
  border: none;
  padding: 0.5rem 1.3rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffffff;
  background: #4f46e5;
  cursor: pointer;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.primary-btn:hover {
  background: #4338ca;
  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.45);
  transform: translateY(-1px);
}

.primary-btn-full {
  width: 100%;
}

.ai-answer {
  margin-top: 0.75rem;
  padding: 0.6rem 0.8rem;
  border-radius: 0.9rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 0.83rem;
  color: #111827;
}

.ai-answer-label {
  font-weight: 600;
  margin-bottom: 0.2rem;
  color: #4b5563;
}

.ai-answer-text {
  line-height: 1.5;
}

.muted {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #9ca3af;
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

  /* Materials list: stack text + button */
  .materials-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .materials-item .pill-btn {
    width: 100%;
    text-align: center;
    margin-top: 0.4rem;
  }

  /* Upload inputs full-width and comfy */
  .upload-input {
    font-size: 0.85rem;
    padding: 0.45rem 0.6rem;
  }

  .upload-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .upload-actions .pill-btn,
  .upload-actions .primary-btn {
    width: 100%;
    justify-content: center;
  }

  /* Quick drill MCQs: one option per row */
  .options-grid {
    grid-template-columns: 1fr;
  }

  .option-pill {
    width: 100%;
  }

  .drill-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .drill-footer .actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .drill-footer .btn {
    width: 100%;
    justify-content: center;
  }

  /* Primary buttons and pills become full-width where it makes sense */
  .btn,
  .primary-btn,
  .primary-btn-full {
    width: 100%;
    justify-content: center;
  }

  /* Ask Jabuspark: nicer to read on small screen */
  .chat-form {
    margin-top: 0.7rem;
    gap: 0.45rem;
  }

  .textarea {
    min-height: 90px;
    font-size: 0.85rem;
  }

  .ai-answer {
    max-height: 260px;
    overflow-y: auto;
  }
}
</style>
