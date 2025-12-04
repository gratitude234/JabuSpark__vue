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

    <div class="page-header">
      <button class="back-link" @click="goBack">← Back</button>

      <div>
        <h1 class="page-title">Quick drill</h1>
        <p class="page-sub">
          Fast MCQ session from {{ headerCourseLabel }}.
        </p>
      </div>
    </div>

    <main class="page-main">
      <div class="max-w-3xl mx-auto space-y-4">
        <StateBlock
          v-if="!courseId"
          title="Pick a course first"
          message="Start a quick drill from a specific course so we know where to pull questions from."
          tone="info"
        />

        <QuickDrillCard
          v-else
          :course-id="Number(courseId)"
          mode="fullscreen"
          @toast="handleToast"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import QuickDrillCard from "../components/QuickDrill.vue";
import StateBlock from "../components/ui/StateBlock.vue";

const route = useRoute();
const router = useRouter();

const courseId = computed(() => route.query.courseId || null);
const courseCode = computed(() => route.query.courseCode || "");
const courseTitle = computed(() => route.query.courseTitle || "");

const headerCourseLabel = computed(() => {
  if (courseCode.value && courseTitle.value) {
    return `${courseCode.value} – ${courseTitle.value}`;
  }
  if (courseCode.value) return courseCode.value;
  if (courseTitle.value) return courseTitle.value;
  return "your courses";
});

const toast = ref({
  visible: false,
  type: "success",
  message: "",
});

function handleToast(payload) {
  toast.value = {
    visible: true,
    type: payload.type || "success",
    message: payload.message || "",
  };

  window.clearTimeout(handleToast._timer);
  handleToast._timer = window.setTimeout(() => {
    toast.value.visible = false;
  }, 2600);
}

function goBack() {
  router.back();
}
</script>
