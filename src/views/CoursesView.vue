<template>
  <div class="space-y-6">
    <!-- PAGE HEADER -->
    <PageHeader
      title="My Courses"
      subtitle="All the courses linked to your Jabuspark account for this semester."
      eyebrow="Courses"
    />

    <!-- LOADING STATE WITH SKELETONS -->
    <div v-if="loading" class="space-y-4">
      <StateBlock
        title="Loading your courses"
        message="Pulling your courses from your department. This usually takes just a moment."
        tone="muted"
      />

      <div class="mt-2 space-y-2 sm:space-y-3">
        <div
          v-for="n in 4"
          :key="n"
          class="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/60 px-3.5 py-3 sm:px-4 sm:py-3.5 animate-pulse"
        >
          <div class="h-9 w-9 rounded-xl bg-slate-200"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3.5 w-40 rounded bg-slate-200"></div>
            <div class="flex gap-2">
              <div class="h-2.5 w-16 rounded bg-slate-200"></div>
              <div class="h-2.5 w-20 rounded bg-slate-200"></div>
              <div class="h-2.5 w-24 rounded bg-slate-200 hidden sm:block"></div>
            </div>
          </div>
          <div class="hidden sm:block h-6 w-20 rounded-full bg-slate-200"></div>
        </div>
      </div>
    </div>

    <!-- ERROR STATE -->
    <StateBlock
      v-else-if="error"
      title="Could not load courses"
      :message="error"
      tone="danger"
    >
      <template #actions>
        <button
          class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
          @click="loadCourses"
        >
          Retry
        </button>
      </template>
    </StateBlock>

    <!-- MAIN CONTENT -->
    <PageSection v-else class="space-y-4">
      <!-- INFO CARD -->
      <StateBlock
        tone="info"
        title="How your courses sync"
        message="Courses usually sync from your department or course rep. If something looks wrong, talk to your rep or lecturer so they can update the master list."
      />

      <!-- CONTROLS: SEARCH + FILTERS -->
      <section class="space-y-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <!-- Search -->
          <div class="relative w-full sm:max-w-xs">
            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <svg
                class="h-4 w-4 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M11 5a6 6 0 1 1-4.243 1.757A5.964 5.964 0 0 1 11 5zm0-2a8 8 0 1 0 5.292 13.96l2.874 2.874a1 1 0 0 0 1.415-1.415l-2.874-2.874A8 8 0 0 0 11 3z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <input
              v-model="searchQuery"
              type="search"
              class="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
              placeholder="Search by course title or code…"
            />
          </div>

          <!-- Level filter chips -->
          <div
            v-if="levelOptions.length"
            class="flex flex-wrap gap-1.5 text-[11px]"
          >
            <button
              type="button"
              class="inline-flex items-center rounded-full border px-2.5 py-1 font-medium transition"
              :class="
                !activeLevel
                  ? 'border-brand/40 bg-brand-soft/70 text-brand-dark'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              "
              @click="activeLevel = null"
            >
              All levels
            </button>

            <button
              v-for="level in levelOptions"
              :key="level"
              type="button"
              class="inline-flex items-center rounded-full border px-2.5 py-1 font-medium transition"
              :class="
                activeLevel === String(level)
                  ? 'border-brand/40 bg-brand-soft/80 text-brand-dark'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              "
              @click="activeLevel = String(level)"
            >
              {{ level }} level
            </button>
          </div>
        </div>

        <!-- HEADER + COUNT -->
        <div class="flex items-center justify-between mt-1">
          <div>
            <h2 class="text-sm font-semibold text-brand-dark">
              Your courses
            </h2>
            <p class="mt-0.5 text-[11px] text-muted">
              Tap any course to view materials, drills, and more details.
            </p>
          </div>

          <div v-if="courses.length" class="text-right">
            <p class="text-[11px] font-medium text-slate-500">
              Showing
              <span class="text-brand-dark">{{ filteredCourses.length }}</span>
              of
              <span class="text-brand-dark">{{ courses.length }}</span>
              course{{ courses.length === 1 ? "" : "s" }}
            </p>
            <button
              v-if="showResetFilters"
              type="button"
              class="mt-1 text-[10px] font-medium text-brand hover:underline"
              @click="resetFilters"
            >
              Clear search & filters
            </button>
          </div>
        </div>

        <!-- COURSE LIST -->
        <div v-if="courses.length" class="mt-2 space-y-2.5 sm:space-y-3">
          <!-- When filters/search return results -->
          <template v-if="filteredCourses.length">
            <RouterLink
              v-for="course in filteredCourses"
              :key="course.id"
              :to="`/courses/${course.id}`"
              class="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:border-brand/60 hover:shadow-md hover:-translate-y-[1px] transition-all"
            >
              <!-- Left: tiny badge/initials -->
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-[10px] font-semibold uppercase tracking-wide text-brand-dark"
              >
                <span v-if="course.code">
                  {{ course.code.split(' ')[0] || course.code }}
                </span>
                <span v-else>
                  {{ (course.title || 'C')[0] }}
                </span>
              </div>

              <!-- Middle: main info -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p
                    class="truncate font-semibold text-brand-dark group-hover:text-brand transition"
                  >
                    {{ course.title }}
                  </p>

                  <span
                    v-if="course.level"
                    class="hidden sm:inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    {{ course.level }} level
                  </span>
                </div>

                <div class="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                  <span
                    v-if="course.code"
                    class="inline-flex items-center gap-1 rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    {{ course.code }}
                  </span>

                  <span
                    v-if="course.department"
                    class="inline-flex items-center gap-1 rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                    {{ course.department }}
                  </span>
                </div>
              </div>

              <!-- Right: CTA -->
              <div class="flex flex-col items-end gap-1">
                <span
                  class="inline-flex items-center rounded-full bg-brand-soft/80 px-2.5 py-1 text-[11px] font-medium text-brand group-hover:bg-brand-soft group-hover:text-brand-dark transition"
                >
                  Open course
                  <svg
                    class="ml-1 h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M8.5 6.75a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 1 0 1.06 1.06l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-8.5a.75.75 0 0 0-.75-.75h-8.5z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span class="hidden text-[10px] text-slate-400 sm:inline">
                  Materials & drills inside
                </span>
              </div>
            </RouterLink>
          </template>

          <!-- No matches for filters/search -->
          <div
            v-else
            class="mt-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-3.5 py-3 text-[11px] text-slate-500"
          >
            No courses match this search or filter.  
            <button
              type="button"
              class="ml-1 font-medium text-brand hover:underline"
              @click="resetFilters"
            >
              Reset filters
            </button>
            to see all your courses again.
          </div>
        </div>

        <!-- No courses at all -->
        <p
          v-else
          class="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-3 text-[11px] text-muted"
        >
          No courses are attached to your account yet. Your department or course rep
          will usually handle adding courses for you. If this stays empty, let your rep
          or lecturer know so they can link you to your courses.
        </p>
      </section>
    </PageSection>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import PageHeader from "../components/ui/PageHeader.vue";
import PageSection from "../components/ui/PageSection.vue";
import StateBlock from "../components/ui/StateBlock.vue";
import { getCourses } from "../services/courses";

const router = useRouter();
const courses = ref([]);
const loading = ref(false);
const error = ref("");

// UI state
const searchQuery = ref("");
const activeLevel = ref(null); // string | null

const levelOptions = computed(() => {
  const levels = new Set();
  for (const course of courses.value) {
    if (course.level) levels.add(course.level);
  }
  return Array.from(levels).sort();
});

const filteredCourses = computed(() => {
  let list = [...courses.value];

  // Search filter
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((course) => {
      const title = (course.title || "").toLowerCase();
      const code = (course.code || "").toLowerCase();
      return title.includes(q) || code.includes(q);
    });
  }

  // Level filter
  if (activeLevel.value) {
    list = list.filter(
      (course) => String(course.level) === String(activeLevel.value)
    );
  }

  return list;
});

const showResetFilters = computed(() => {
  return Boolean(searchQuery.value.trim() || activeLevel.value);
});

function resetFilters() {
  searchQuery.value = "";
  activeLevel.value = null;
}

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
      error.value = "Failed to load courses. Please try again in a bit.";
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
