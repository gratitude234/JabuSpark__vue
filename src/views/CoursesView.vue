<template>
  <div class="space-y-6">
    <!-- Page heading -->
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-brand-dark">
        My Courses
      </h1>
      <p class="mt-1 text-sm text-muted">
        These are the courses linked to your Jabuspark account this semester.
      </p>
    </div>

    <!-- Main card -->
    <div
      class="bg-surface/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4"
    >
      <!-- Info strip -->
      <section
        class="border border-slate-200 rounded-xl bg-slate-50/70 px-4 py-3 text-[11px] text-muted"
      >
        Courses usually sync from your department or course rep. If something looks
        wrong, talk to your rep or lecturer.
      </section>

      <!-- Course list -->
      <section>
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-brand-dark">
            Your courses
          </h2>
          <span v-if="courses.length" class="text-[11px] text-muted">
            {{ courses.length }} course{{ courses.length === 1 ? "" : "s" }}
          </span>
        </div>

        <!-- Has courses -->
        <div v-if="courses.length" class="space-y-2">
          <RouterLink
            v-for="course in courses"
            :key="course.id"
            :to="`/courses/${course.id}`"
            class="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm hover:border-brand/50 hover:shadow-sm transition group"
          >
            <div class="flex flex-col gap-0.5">
              <span
                class="font-semibold text-brand-dark group-hover:text-brand transition"
              >
                {{ course.title }}
              </span>
              <div class="flex items-center gap-2 text-[11px] text-muted">
                <span v-if="course.code">
                  {{ course.code }}
                </span>
                <span v-if="course.level" class="flex items-center gap-1">
                  <span class="h-1 w-1 rounded-full bg-slate-300"></span>
                  {{ course.level }} level
                </span>
                <span v-if="course.department" class="flex items-center gap-1">
                  <span class="h-1 w-1 rounded-full bg-slate-300"></span>
                  {{ course.department }}
                </span>
              </div>
            </div>

            <span
              class="inline-flex items-center text-[11px] text-brand bg-brand-soft/70 px-2 py-1 rounded-full group-hover:bg-brand-soft group-hover:text-brand-dark"
            >
              Open course
            </span>
          </RouterLink>
        </div>

        <!-- No courses -->
        <p v-else class="mt-2 text-xs text-muted">
          No courses are attached to your account yet. Your department or course rep
          will usually handle this.
        </p>
      </section>
    </div>

    <p v-if="loading" class="text-xs text-muted">
      Loading your courses…
    </p>
    <p v-if="error" class="text-xs text-danger">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getCourses } from "../services/courses";

const router = useRouter();
const courses = ref([]);
const loading = ref(false);
const error = ref("");

async function loadCourses() {
  loading.value = true;
  error.value = "";
  try {
    courses.value = await getCourses();
  } catch (e) {
    console.error(e);
    if (e.response?.status === 401) {
      router.push("/login");
    } else {
      error.value = "Failed to load courses";
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const token = localStorage.getItem("jabuspark_token");
  if (!token) {
    router.push("/login");
  } else {
    loadCourses();
  }
});
</script>
