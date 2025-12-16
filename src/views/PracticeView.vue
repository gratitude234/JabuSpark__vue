<template>
  <main class="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 space-y-4">
    <h1 class="text-xl font-semibold text-slate-900">Practice</h1>

    <section class="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <p class="text-sm text-slate-600">
        Jump back into a drill quickly. We’ll take you to your last opened course.
      </p>

      <button
        class="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        @click="continuePractice"
      >
        Continue Practice
      </button>

      <RouterLink to="/courses" class="block text-sm font-medium text-indigo-600 hover:underline">
        Or pick a course
      </RouterLink>
    </section>
  </main>
</template>

<script setup>
import { useRouter, RouterLink } from "vue-router";

const router = useRouter();

function continuePractice() {
  const last = localStorage.getItem("jabuspark_last_course_id");
  if (last) return router.push(`/courses/${last}`);
  router.push("/courses");
}
</script>
