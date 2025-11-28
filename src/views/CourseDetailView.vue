<!-- src/views/CourseDetailView.vue -->
<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <nav class="text-xs text-muted flex items-center gap-1">
      <RouterLink to="/courses" class="hover:text-brand">My Courses</RouterLink>
      <span>/</span>
      <span v-if="course" class="text-slate-500">{{ course.code || "Course" }}</span>
      <span v-else>Course</span>
    </nav>

    <!-- Heading -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-brand-dark">
          <span v-if="course">{{ course.title }}</span>
          <span v-else>Loading course…</span>
        </h1>
        <p v-if="course" class="mt-1 text-sm text-muted">
          <span v-if="course.code">{{ course.code }}</span>
          <span v-if="course.level" class="ml-2 text-slate-400">
            • {{ course.level }} level
          </span>
        </p>
      </div>

      <div class="text-right text-[11px] sm:text-xs text-slate-400">
        <div class="font-semibold text-brand-dark text-xs uppercase tracking-wide">
          Study hub
        </div>
        <div>Materials, AI help & quick drills</div>
      </div>
    </header>

    <!-- Status / error -->
    <p v-if="loading" class="text-xs text-muted">
      Loading course…
    </p>
    <p v-if="error" class="text-xs text-danger">
      {{ error }}
    </p>

    <!-- Main layout -->
    <div
      v-if="!loading"
      class="grid lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-5 lg:gap-6"
    >
      <!-- Left: materials + quick drill -->
      <div class="space-y-5">
        <!-- Course materials card -->
        <section
          class="bg-surface border border-slate-200 rounded-2xl shadow-sm px-5 py-4 sm:px-6 sm:py-5 flex flex-col gap-4"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold text-brand-dark">
                Course materials
              </h2>
              <p class="text-xs text-muted mt-0.5">
                Notes, slides and past questions uploaded for this course.
              </p>
            </div>

            <div class="text-[11px] text-slate-500">
              <span class="font-semibold text-brand-dark">
                {{ materials.length }}
              </span>
              <span class="ml-1">
                file{{ materials.length === 1 ? "" : "s" }}
              </span>
            </div>
          </div>

          <!-- If we have materials -->
          <div v-if="materials.length" class="space-y-2">
            <div
              v-for="m in materials"
              :key="m.id"
              class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm"
            >
              <div class="flex items-center gap-3 min-w-0">
                <!-- File badge -->
                <div
                  class="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center text-[11px] font-semibold text-brand-dark shrink-0"
                >
                  PDF
                </div>

                <div class="min-w-0">
                  <p class="font-medium text-brand-dark truncate">
                    {{ m.title || "Course material" }}
                  </p>
                  <p class="text-[11px] text-muted mt-0.5">
                    {{ formatDate(m.created_at) }}
                  </p>
                </div>
              </div>

              <a
                :href="fileUrl(m.file_url)"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center rounded-full border border-brand/30 bg-brand text-white px-3 py-1.5 text-[11px] font-semibold hover:bg-indigo-600 hover:border-indigo-600 transition whitespace-nowrap"
              >
                Open
              </a>
            </div>
          </div>

          <!-- No materials -->
          <div
            v-else
            class="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-muted"
          >
            No materials have been uploaded yet. When your course rep or lecturer
            uploads notes, past questions or slides, they’ll appear here.
          </div>
        </section>

        <!-- Quick drill placeholder -->
        <section
          class="bg-surface border border-slate-200 rounded-2xl shadow-sm px-5 py-4 sm:px-6 sm:py-5"
        >
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-semibold text-brand-dark">
              Quick drill (coming soon)
            </h2>
            <span
              class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 uppercase tracking-wide"
            >
              Coming soon
            </span>
          </div>
          <p class="text-xs text-muted">
            Soon you’ll be able to generate quick practice questions for this
            course powered by AI and past questions.
          </p>
        </section>
      </div>

      <!-- Right: Ask Jabuspark -->
      <aside
        class="bg-surface border border-slate-200 rounded-2xl shadow-sm px-5 py-4 sm:px-6 sm:py-5 flex flex-col gap-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-brand-dark">
              Ask Jabuspark
            </h2>
            <p class="text-xs text-muted mt-0.5">
              Ask any question about this course. Jabuspark will explain it like
              a tutor.
            </p>
          </div>
          <div
            class="rounded-full border border-slate-300 px-2 py-1 text-[10px] text-slate-500 uppercase tracking-wide"
          >
            AI assistant
          </div>
        </div>

        <div
          class="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] text-muted"
        >
          <p class="font-medium text-slate-600 mb-1">Try:</p>
          <ul class="space-y-0.5 list-disc list-inside">
            <li>“Explain strict liability in simple terms with an example.”</li>
            <li>“Give me a 7-day study plan for this course.”</li>
          </ul>
        </div>

        <form
          @submit.prevent="sendQuestion"
          class="space-y-2 mt-1"
        >
          <textarea
            v-model="question"
            rows="3"
            class="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
            placeholder="Ask Jabuspark anything about this course…"
          ></textarea>

          <div class="flex items-center justify-between">
            <p v-if="aiError" class="text-[11px] text-danger">
              {{ aiError }}
            </p>
            <p v-else-if="aiReply" class="text-[11px] text-muted truncate">
              {{ aiReply }}
            </p>
            <span v-else class="text-[11px] text-slate-400">
              AI chat is a simple placeholder for now.
            </span>

            <button
              type="submit"
              :disabled="sending || !question.trim()"
              class="inline-flex items-center rounded-full bg-brand text-white text-[11px] font-semibold px-4 py-1.5 shadow-sm hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {{ sending ? "Thinking…" : "Send" }}
            </button>
          </div>
        </form>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getCourse } from "../services/courses";
import { getMaterials } from "../services/materials";
// later: import { askJabuspark } from "../services/aiChat";

const route = useRoute();
const router = useRouter();
const courseId = Number(route.params.id);

const loading = ref(true);
const error = ref("");
const course = ref(null);
const materials = ref([]);

const question = ref("");
const sending = ref(false);
const aiReply = ref("");
const aiError = ref("");

// Base URL for files coming from API (relative paths like "uploads/materials/..")
const FILE_BASE_URL = "https://jabuspark.com.ng/api/";

function fileUrl(path) {
  if (!path) return "#";
  // ensure no leading slash duplication
  if (path.startsWith("/")) {
    return FILE_BASE_URL + path.slice(1);
  }
  return FILE_BASE_URL + path;
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

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [courseRes, mats] = await Promise.all([
      getCourse(courseId),
      getMaterials(courseId),
    ]);
    course.value = courseRes;
    materials.value = mats || [];
  } catch (e) {
    console.error(e);
    if (e.response?.status === 401) {
      router.push("/login");
    } else {
      error.value = "Failed to load course.";
    }
  } finally {
    loading.value = false;
  }
}

// Placeholder AI handler for now
async function sendQuestion() {
  if (!question.value.trim()) return;
  sending.value = true;
  aiError.value = "";
  aiReply.value = "";
  try {
    // later: real API call with courseId + question
    // const res = await askJabuspark({ courseId, message: question.value });
    // aiReply.value = res.answer;
    aiReply.value = "This is where Jabuspark’s AI answer will appear.";
    question.value = "";
  } catch (e) {
    console.error(e);
    aiError.value = "Could not send question right now.";
  } finally {
    sending.value = false;
  }
}

onMounted(() => {
  const token = localStorage.getItem("jabuspark_token");
  if (!token) {
    router.push("/login");
    return;
  }
  if (!courseId) {
    error.value = "Invalid course.";
    loading.value = false;
    return;
  }
  loadData();
});
</script>
