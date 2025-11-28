<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="space-y-1">
      <h1 class="text-2xl sm:text-3xl font-bold text-brand-dark">
        Hey, {{ user?.name || "there" }}
      </h1>
      <p class="text-sm text-muted">
        Here’s your Jabuspark semester overview – courses, drills and progress.
      </p>
    </header>

    <!-- Main card -->
    <section
      class="bg-surface/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4"
    >
      <!-- Top strip -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="text-xs text-muted">
          <p class="font-semibold text-slate-700">Logged in as</p>
          <p>{{ user?.name }}</p>
          <p class="text-[11px] text-muted">{{ user?.email }}</p>
        </div>

        <div
          class="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] text-emerald-700"
        >
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          Keep your streak by doing a quick drill today.
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid gap-3 sm:grid-cols-3 mt-2">
        <!-- Courses -->
        <div
          class="rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3 flex flex-col justify-between"
        >
          <div class="space-y-1">
            <p class="text-[11px] font-medium text-indigo-700 uppercase tracking-wide">
              Courses this semester
            </p>
            <p class="text-xs text-indigo-800">
              synced from your department
            </p>
          </div>
          <p class="mt-2 text-3xl font-bold text-indigo-900">
            {{ stats.courses }}
          </p>
        </div>

        <!-- Practice questions -->
        <div
          class="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex flex-col justify-between"
        >
          <div class="space-y-1">
            <p class="text-[11px] font-medium text-emerald-700 uppercase tracking-wide">
              Practice questions
            </p>
            <p class="text-xs text-emerald-800">
              available across your courses
            </p>
          </div>
          <p class="mt-2 text-3xl font-bold text-emerald-900">
            {{ stats.questions }}
          </p>
        </div>

        <!-- Average score -->
        <div
          class="rounded-2xl bg-pink-50 border border-pink-100 px-4 py-3 flex flex-col justify-between"
        >
          <div class="space-y-1">
            <p class="text-[11px] font-medium text-pink-700 uppercase tracking-wide">
              Average drill score
            </p>
            <p class="text-xs text-pink-800">
              based on recent attempts
            </p>
          </div>
          <p class="mt-2 text-3xl font-bold text-pink-900">
            <span v-if="stats.avg_score !== null">
              {{ stats.avg_score }}%
            </span>
            <span v-else>—</span>
          </p>
        </div>
      </div>

      <!-- Continue + CTA -->
      <div
        class="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-200 pt-3"
      >
        <div>
          <h2 class="text-sm font-semibold text-brand-dark">
            Continue studying
          </h2>
          <p class="text-xs text-muted mt-0.5">
            Jump into your courses to start a new drill or review materials.
          </p>
        </div>

        <button
          @click="goToCourses"
          class="inline-flex items-center rounded-full bg-brand text-surface text-xs sm:text-sm font-semibold px-4 py-2 shadow-md hover:bg-indigo-600 transition"
        >
          Go to My Courses
        </button>
      </div>

      <!-- Recent drills -->
      <div class="border-t border-slate-200 pt-3">
        <h3 class="text-sm font-semibold text-brand-dark">
          Recent drills
        </h3>

        <div v-if="recentDrills.length" class="mt-2 space-y-1.5 text-xs">
          <div
            v-for="d in recentDrills"
            :key="d.id"
            class="flex items-center justify-between gap-2"
          >
            <div class="flex flex-col">
              <span class="font-medium text-slate-800">
                {{ d.course_title }}
              </span>
              <span class="text-muted">
                {{ d.num_correct }}/{{ d.num_questions }} correct •
                {{ d.score }}% • {{ formatDate(d.created_at) }}
              </span>
            </div>
          </div>
        </div>

        <p v-else class="mt-1 text-xs text-muted">
          You haven’t taken any drills yet. Open a course and start a quick drill to
          see your progress here.
        </p>
      </div>

      <!-- Logout -->
      <div class="flex justify-end pt-2">
        <button
          @click="logout"
          class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </section>

    <!-- Loading / error state -->
    <p v-if="loading" class="text-xs text-muted">
      Loading your dashboard…
    </p>
    <p v-if="error" class="text-xs text-danger">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getDashboardSummary } from "../services/dashboard";

const router = useRouter();

const loading = ref(true);
const error = ref("");
const user = ref(null);
const stats = ref({
  courses: 0,
  questions: 0,
  avg_score: null,
});
const recentDrills = ref([]);

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString();
}

async function loadDashboard() {
  try {
    const data = await getDashboardSummary();
    user.value = data.user;
    stats.value = data.stats;
    recentDrills.value = data.recent_drills || [];
  } catch (e) {
    console.error(e);
    if (e.response?.status === 401) {
      router.push("/login");
    } else {
      error.value = "Failed to load dashboard.";
    }
  } finally {
    loading.value = false;
  }
}

function logout() {
  localStorage.removeItem("jabuspark_token");
  router.push("/login");
}

function goToCourses() {
  router.push("/courses");
}

onMounted(() => {
  const token = localStorage.getItem("jabuspark_token");
  if (!token) {
    router.push("/login");
  } else {
    loadDashboard();
  }
});
</script>
