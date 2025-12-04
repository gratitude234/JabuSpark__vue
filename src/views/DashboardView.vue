<template>
  <main class="relative min-h-screen bg-slate-50">
    <!-- Top loading bar -->
    <div
      v-if="loading"
      class="pointer-events-none fixed inset-x-0 top-0 z-30 h-0.5 bg-indigo-500/80"
    >
      <div class="h-full w-1/3 animate-[pulse_1.2s_ease-in-out_infinite]" />
    </div>

    <section class="mx-auto max-w-6xl px-4 py-6 sm:py-8 lg:py-10">
      <!-- Error banner -->
      <div
        v-if="error"
        class="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-800"
      >
        <div class="space-y-1">
          <p class="font-semibold">
            Couldn&apos;t load your dashboard
          </p>
          <p class="text-[11px] leading-snug">
            {{ error }} Please check your connection and try again.
          </p>
        </div>
        <button
          type="button"
          class="rounded-full border border-red-200 bg-white/60 px-3 py-1 text-[11px] font-medium text-red-700 shadow-sm transition hover:bg-white"
          @click="loadDashboard"
        >
          Retry
        </button>
      </div>

      <!-- Top header -->
      <header
        class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/60 pb-4"
      >
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-2">
            <p
              class="inline-flex items-center gap-1 rounded-full bg-slate-900 text-[10px] font-semibold uppercase tracking-wide text-slate-50 px-2.5 py-1"
            >
              <span class="text-[11px]">📚</span>
              Dashboard
            </p>
            <span
              v-if="meta.semester || meta.week"
              class="text-[11px] rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600"
            >
              <span v-if="meta.semester">
                {{ meta.semester }}
              </span>
              <span v-if="meta.semester && meta.week">·</span>
              <span v-if="meta.week">
                Week {{ meta.week }}
              </span>
            </span>
          </div>

          <h1 class="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Good {{ timeOfDay }}, {{ displayName }}
          </h1>
          <p class="max-w-xl text-sm text-slate-600">
            Jump into a 5–10 question quick drill, keep your streak alive, and stay ready for
            upcoming assessments.
          </p>
        </div>

        <div
          class="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 text-xs text-slate-700 shadow-sm ring-1 ring-slate-200/70"
        >
          <span
            class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700"
          >
            {{ initials }}
          </span>
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-slate-900">
              {{ displayName }}
            </span>
            <span class="text-[11px] text-slate-500">
              {{ roleLabel }}
              <span v-if="level">· {{ level }}</span>
            </span>
          </div>
        </div>
      </header>

      <!-- Two-column layout -->
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:gap-8">
        <!-- LEFT: Focus column -->
        <div class="space-y-6">
          <!-- Hero card -->
          <section
            class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-800 to-sky-500 p-6 text-white shadow-lg transition-all duration-500 ease-out transform"
            :class="loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'"
            aria-labelledby="hero-heading"
          >
            <!-- soft glow -->
            <div class="pointer-events-none absolute inset-0 opacity-40">
              <div
                class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-400 blur-3xl"
              />
              <div
                class="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sky-400 blur-3xl"
              />
            </div>

            <div
              class="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
            >
              <div class="space-y-4">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-indigo-100">
                    Primary action
                  </p>
                  <h2
                    id="hero-heading"
                    class="mt-1 text-2xl font-semibold sm:text-3xl"
                  >
                    Ready for a quick drill, {{ displayName }}?
                  </h2>
                  <p class="mt-2 max-w-md text-sm text-indigo-100/90">
                    Short, focused drills help you build a daily study habit. Keep your streak alive
                    and track your progress in minutes, not hours.
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-3 text-xs">
                  <span
                    class="inline-flex items-center gap-2 rounded-full bg-indigo-500/40 px-3 py-1 font-medium"
                  >
                    <span
                      class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold"
                    >
                      🔥
                    </span>
                    <span>
                      Streak:
                      <strong>{{ streak.current }} days</strong>
                      <span class="opacity-80">
                        · Longest {{ streak.longest }} days
                      </span>
                    </span>
                  </span>

                  <span
                    class="inline-flex items-center gap-2 rounded-full bg-sky-500/40 px-3 py-1 font-medium"
                  >
                    <span
                      class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold"
                    >
                      🎯
                    </span>
                    <span>
                      This week:
                      <strong>{{ weeklyDrills.current }}/{{ weeklyDrills.target }}</strong>
                      drills
                    </span>
                  </span>
                </div>

                <div class="flex flex-wrap gap-3">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
                    @click="startQuickDrill"
                  >
                    <span
                      class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[11px]"
                    >
                      ▶
                    </span>
                    Start quick drill
                  </button>

                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-100/70 bg-indigo-500/30 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
                    @click="hasRecentDrills ? continueLastSession() : goToCourses()"
                  >
                    <span
                      class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[11px]"
                    >
                      ↺
                    </span>
                    <span>
                      {{ hasRecentDrills ? "Continue last session" : "Go to my courses" }}
                    </span>
                  </button>
                </div>
              </div>

              <!-- Hero side mini-summary -->
              <div
                class="w-full max-w-xs rounded-2xl bg-white/10 p-4 text-xs backdrop-blur-md shadow-inner"
              >
                <p class="text-[11px] font-semibold uppercase tracking-wide text-indigo-100">
                  Today&apos;s snapshot
                </p>
                <div class="mt-3 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-indigo-50">Average score</span>
                    <span class="text-sm font-semibold text-white">
                      {{ averageScore }}%
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-indigo-50">Courses this semester</span>
                    <span class="font-semibold text-white">
                      {{ coursesCount }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-indigo-50">Questions available</span>
                    <span class="font-semibold text-white">
                      {{ practiceQuestionsCount }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Today card -->
          <section
            class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-all duration-500 ease-out transform"
            :class="loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 delay-75'"
            aria-labelledby="today-heading"
          >
            <header class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2
                  id="today-heading"
                  class="text-sm font-semibold text-slate-900"
                >
                  Today at a glance
                </h2>
                <p class="mt-1 text-xs text-slate-500">
                  This week&apos;s drills, your next assessment, and your latest activity.
                </p>
              </div>
              <p class="text-xs text-slate-500">
                Week goal:
                <span class="font-semibold text-slate-800">
                  {{ weeklyDrills.current }}/{{ weeklyDrills.target }} drills
                </span>
              </p>
            </header>

            <!-- Simple responsive grid (no horizontal scroll) -->
            <div class="mt-4 grid gap-4 xs:grid-cols-2 sm:grid-cols-3">
              <!-- Weekly drills -->
              <div class="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 text-xs shadow-sm">
                <p class="text-xs font-semibold text-slate-700">
                  This week’s drills
                </p>
                <p class="text-xs text-slate-500">
                  Keep hitting small drills to maintain your streak.
                </p>

                <div class="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full bg-indigo-500 transition-all duration-300"
                    :style="{ width: weeklyProgress + '%' }"
                  />
                </div>

                <p class="mt-1 text-[11px] text-slate-500">
                  {{ weeklyDrills.current }} of {{ weeklyDrills.target }} drills completed.
                </p>
              </div>

              <!-- Next assessment -->
              <div class="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 text-xs shadow-sm">
                <p class="text-xs font-semibold text-slate-700">
                  Next assessment
                </p>

                <div v-if="nextAssessment" class="space-y-1">
                  <p class="text-xs font-semibold text-slate-900">
                    {{ nextAssessment.courseCode }} · {{ nextAssessment.title }}
                  </p>
                  <p class="text-[11px] text-slate-500">
                    {{ nextAssessment.date }} · {{ nextAssessment.time }} · {{ nextAssessment.type }}
                  </p>
                  <span
                    class="inline-flex w-fit items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700"
                  >
                    {{ nextAssessment.daysLeft }} days left
                  </span>
                </div>
                <p v-else class="text-[11px] text-slate-500">
                  No assessments added yet. You&apos;ll see the next one here.
                </p>
              </div>

              <!-- Last activity -->
              <div class="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 text-xs shadow-sm">
                <p class="text-xs font-semibold text-slate-700">
                  Last activity
                </p>

                <div v-if="lastDrill" class="space-y-1">
                  <p class="text-xs font-semibold text-slate-900">
                    {{ lastDrill.courseTitle }}
                  </p>
                  <p class="text-[11px] text-slate-500">
                    {{ lastDrill.score }}% ·
                    {{ lastDrill.correct }}/{{ lastDrill.total }} correct
                  </p>
                  <p class="text-[11px] text-slate-500">
                    {{ formatDateTime(lastDrill.date) }}
                  </p>
                </div>
                <p v-else class="text-[11px] text-slate-500">
                  No drills yet. Start a quick drill to see your progress here.
                </p>
              </div>
            </div>
          </section>

          <!-- Quick actions -->
          <section
            class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-all duration-500 ease-out transform"
            :class="loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 delay-100'"
            aria-labelledby="quick-actions-heading"
          >
            <header class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2
                  id="quick-actions-heading"
                  class="text-sm font-semibold text-slate-900"
                >
                  Quick actions
                </h2>
                <p class="mt-1 text-xs text-slate-500">
                  Jump straight into the next best thing to do.
                </p>
              </div>
            </header>

            <div class="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <!-- Quick drill -->
              <button
                type="button"
                class="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                @click="startQuickDrill"
              >
                <div class="flex items-start gap-2">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-[12px] font-semibold text-indigo-700"
                  >
                    QD
                  </div>
                  <div class="space-y-1">
                    <p class="text-[12px] font-semibold text-slate-900">
                      Quick drill
                    </p>
                    <p class="text-[11px] text-slate-500">
                      5–10 questions from your active courses.
                    </p>
                  </div>
                </div>
              </button>

              <!-- Review last drill -->
              <button
                type="button"
                class="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                @click="reviewLastDrill"
              >
                <div class="flex items-start gap-2">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-[12px] font-semibold text-emerald-700"
                  >
                    RL
                  </div>
                  <div class="space-y-1">
                    <p class="text-[12px] font-semibold text-slate-900">
                      Review last drill
                    </p>
                    <p class="text-[11px] text-slate-500">
                      Revisit missed questions while they&apos;re fresh.
                    </p>
                  </div>
                </div>
              </button>

              <!-- Open materials -->
              <button
                type="button"
                class="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                @click="openMaterials"
              >
                <div class="flex items-start gap-2">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-[12px] font-semibold text-sky-700"
                  >
                    OM
                  </div>
                  <div class="space-y-1">
                    <p class="text-[12px] font-semibold text-slate-900">
                      Open materials
                    </p>
                    <p class="text-[11px] text-slate-500">
                      PDFs and notes for your registered courses.
                    </p>
                  </div>
                </div>
              </button>

              <!-- Manage courses -->
              <button
                type="button"
                class="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                @click="manageCourses"
              >
                <div class="flex items-start gap-2">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-[12px] font-semibold text-amber-700"
                  >
                    MC
                  </div>
                  <div class="space-y-1">
                    <p class="text-[12px] font-semibold text-slate-900">
                      Manage courses
                    </p>
                    <p class="text-[11px] text-slate-500">
                      Enrol, remove, or focus on specific courses.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </section>
        </div>

        <!-- RIGHT: Overview column -->
        <div class="space-y-6">
          <!-- Study overview stats -->
          <section
            class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-all duration-500 ease-out transform"
            :class="loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 delay-75'"
            aria-labelledby="overview-heading"
          >
            <header class="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="overview-heading"
                class="text-sm font-semibold text-slate-900"
              >
                Study overview
              </h2>
              <p class="text-xs text-slate-500">
                Snapshot for this semester.
              </p>
            </header>

            <!-- Simple responsive grid -->
            <div class="mt-4 grid gap-3 xs:grid-cols-2 sm:grid-cols-3">
              <div
                class="flex flex-col gap-1 rounded-xl bg-indigo-50 p-3 text-xs shadow-sm"
              >
                <p class="text-[11px] font-medium text-indigo-700">
                  Courses this semester
                </p>
                <p class="mt-1 text-lg font-semibold text-slate-900">
                  {{ coursesCount }}
                </p>
                <p class="text-[11px] text-slate-500">
                  From your current enrolment.
                </p>
              </div>

              <div
                class="flex flex-col gap-1 rounded-xl bg-sky-50 p-3 text-xs shadow-sm"
              >
                <p class="text-[11px] font-medium text-sky-700">
                  Practice questions
                </p>
                <p class="mt-1 text-lg font-semibold text-slate-900">
                  {{ practiceQuestionsCount }}
                </p>
                <p class="text-[11px] text-slate-500">
                  Available across all your courses.
                </p>
              </div>

              <div
                class="flex flex-col gap-1 rounded-xl bg-emerald-50 p-3 text-xs shadow-sm"
              >
                <p class="text-[11px] font-medium text-emerald-700">
                  Average drill score
                </p>
                <p class="mt-1 text-lg font-semibold text-slate-900">
                  {{ averageScore }}%
                </p>
                <p class="text-[11px] text-slate-500">
                  Based on your recent sessions.
                </p>
              </div>
            </div>
          </section>

          <!-- Upcoming assessments -->
          <section
            class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-all duration-500 ease-out transform"
            :class="loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 delay-100'"
            aria-labelledby="upcoming-heading"
          >
            <header class="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="upcoming-heading"
                class="text-sm font-semibold text-slate-900"
              >
                Upcoming assessments
              </h2>
              <p class="text-xs text-slate-500">
                The next few tests, quizzes, and exams.
              </p>
            </header>

            <div class="mt-4">
              <div
                v-if="!upcomingAssessments.length"
                class="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-xs"
              >
                <p
                  class="text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                >
                  Nothing scheduled yet
                </p>
                <p class="mt-1 text-[12px] font-medium text-slate-900">
                  Once your course reps or department add assessments, you&apos;ll see them here.
                </p>
                <p class="mt-1 text-[11px] text-slate-500">
                  Use this time to strengthen your weak areas with quick drills.
                </p>
              </div>

              <ul v-else class="space-y-2 text-xs">
                <li
                  v-for="item in upcomingAssessments"
                  :key="item.id"
                  class="flex items-start justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/60"
                >
                  <div>
                    <p class="text-[12px] font-semibold text-slate-900">
                      {{ item.courseCode }} · {{ item.title }}
                    </p>
                    <p class="mt-0.5 text-[11px] text-slate-500">
                      {{ item.date }} · {{ item.time }} · {{ item.type }}
                    </p>
                  </div>
                  <span
                    class="mt-0.5 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700"
                  >
                    {{ item.daysLeft }} days left
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <!-- Recent drills -->
          <section
            class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-all duration-500 ease-out transform"
            :class="loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 delay-150'"
            aria-labelledby="recent-heading"
          >
            <header class="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="recent-heading"
                class="text-sm font-semibold text-slate-900"
              >
                Recent drills
              </h2>
              <p class="text-xs text-slate-500">
                Latest practice sessions and scores.
              </p>
            </header>

            <div class="mt-4 text-xs">
              <div
                v-if="!recentDrills.length"
                class="flex flex-col items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p
                    class="text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                  >
                    No drills yet
                  </p>
                  <p class="mt-1 text-[12px] font-medium text-slate-900">
                    Start your first quick drill to unlock your stats.
                  </p>
                  <p class="mt-1 text-[11px] text-slate-500">
                    Your completed drills will appear here with scores and question breakdown.
                  </p>
                </div>
                <button
                  type="button"
                  class="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:mt-0"
                  @click="startQuickDrill"
                >
                  <span
                    class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px]"
                  >
                    ▶
                  </span>
                  Start your first drill
                </button>
              </div>

              <ul
                v-else
                class="space-y-2"
              >
                <li
                  v-for="drill in recentDrills"
                  :key="drill.id"
                  class="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/60"
                >
                  <div class="flex flex-1 items-start gap-3">
                    <div
                      class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold uppercase text-indigo-700"
                    >
                      {{ drill.courseCode.slice(0, 3) }}
                    </div>
                    <div class="flex-1 space-y-1">
                      <p class="text-[12px] font-semibold text-slate-900">
                        {{ drill.courseCode }} · {{ drill.courseTitle }}
                      </p>
                      <p class="text-[11px] text-slate-500">
                        {{ drill.correct }}/{{ drill.total }} correct ·
                        {{ drill.score }}% ·
                        {{ formatDateTime(drill.date) }}
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-col items-end gap-1">
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                      :class="drill.score >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                    >
                      {{ drill.score >= 70 ? 'On track' : 'Needs revision' }}
                    </span>

                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                      @click="reviewDrill(drill.id)"
                    >
                      Review
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getDashboardSummary } from "../services/dashboard";

const props = defineProps({
  userName: {
    type: String,
    default: "Gratitude",
  },
  role: {
    type: String,
    default: "Student",
  },
});

const router = useRouter();

const loaded = ref(false);
const loading = ref(false);
const error = ref("");

// Raw data from backend
const user = ref(null);
const stats = ref({
  courses: 0,
  questions: 0,
  avg_score: null,
});

// optional meta block (for future: level, semester, etc.)
const meta = ref({
  week: null,
  semester: null,
  level: "",
  targetDrillsThisWeek: 10,
  completedDrillsThisWeek: 0,
});

// Streak info from API
const streak = ref({
  current: 0,
  longest: 0,
  this_week: 0,
  week_goal: 10,
});

// What the UI expects
const level = ref("Student");
const weeklyDrills = ref({
  current: 0,
  target: 10,
});
const coursesCount = ref(0);
const practiceQuestionsCount = ref(0);
const averageScore = ref(0);

const nextAssessment = ref(null);
const upcomingAssessments = ref([]);
const recentDrills = ref([]);

// ---------- COMPUTED ----------

const displayName = computed(() => {
  return user.value?.name || props.userName || "Student";
});

const roleLabel = computed(() => {
  return user.value?.role || props.role || "Student";
});

const initials = computed(() => {
  const name = displayName.value.trim();
  if (!name) return "JP";
  const parts = name.split(/\s+/);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase();
});

const timeOfDay = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
});

const weeklyProgress = computed(() => {
  const done = weeklyDrills.value.current || 0;
  const target = weeklyDrills.value.target || 1;
  const raw = Math.round((done / target) * 100);
  return Math.max(0, Math.min(raw, 100));
});

const hasRecentDrills = computed(() => recentDrills.value.length > 0);
const lastDrill = computed(() =>
  recentDrills.value.length ? recentDrills.value[0] : null
);

// ---------- HELPERS ----------

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------- API / DATA LOAD ----------

async function loadDashboard() {
  const token = localStorage.getItem("jabuspark_token");
  if (!token) {
    router.push("/login");
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const data = await getDashboardSummary();

    // User
    user.value = data.user || null;

    // Stats
    if (data.stats) {
      stats.value = data.stats;
    }

    const s = stats.value || {};
    coursesCount.value = Number(s.courses) || 0;
    practiceQuestionsCount.value = Number(s.questions) || 0;
    averageScore.value =
      s.avg_score !== null && s.avg_score !== undefined
        ? Number(s.avg_score)
        : 0;

    // Meta / level (optional, only if backend sends it)
    if (data.meta) {
      meta.value = {
        ...meta.value,
        ...data.meta,
      };
    }

    if (meta.value.level) {
      level.value = meta.value.level;
    }

    // default weekly drills from meta if present
    if (meta.value.completedDrillsThisWeek != null) {
      weeklyDrills.value.current = meta.value.completedDrillsThisWeek;
    }
    if (meta.value.targetDrillsThisWeek != null) {
      weeklyDrills.value.target = meta.value.targetDrillsThisWeek;
    }

    // Streak from backend
    if (data.streak) {
      streak.value = {
        ...streak.value,
        ...data.streak,
      };

      if (typeof data.streak.this_week === "number") {
        weeklyDrills.value.current = data.streak.this_week;
      }
      if (typeof data.streak.week_goal === "number") {
        weeklyDrills.value.target = data.streak.week_goal;
      }
    }

    // Upcoming assessments
    const exams = Array.isArray(data.upcoming_exams) ? data.upcoming_exams : [];
    upcomingAssessments.value = exams.map((e, index) => ({
      id: e.id ?? index,
      courseCode: e.course_code || e.courseCode || "COURSE",
      title: e.title || "Assessment",
      date: e.date || "",
      time: e.time || "",
      type: e.type || "",
      daysLeft: e.daysLeft ?? e.days_left ?? "",
    }));
    nextAssessment.value = upcomingAssessments.value[0] || null;

    // Recent drills
    const drillsRaw = Array.isArray(data.recent_drills)
      ? data.recent_drills
      : [];

    recentDrills.value = drillsRaw.map((d, index) => {
      const total = d.num_questions ?? d.numQuestions ?? 0;
      const correct = d.num_correct ?? d.numCorrect ?? 0;
      let score =
        typeof d.score === "number" ? d.score : Number(d.score ?? NaN);

      if (!Number.isFinite(score) && total > 0) {
        score = Math.round((correct / total) * 100);
      }

      return {
        id: d.id ?? index,
        courseCode: d.course_code || d.courseCode || "COURSE",
        courseTitle:
          d.course_title || d.courseTitle || d.title || "Drill session",
        score: score || 0,
        correct,
        total,
        date: d.created_at || d.date,
        courseId: d.course_id || d.courseId,
      };
    });
  } catch (err) {
    console.error(err);
    error.value = "Could not load dashboard.";
    if (err?.response?.status === 401) {
      router.push("/login");
    }
  } finally {
    loading.value = false;
    requestAnimationFrame(() => {
      loaded.value = true;
    });
  }
}

// ---------- NAVIGATION / ACTIONS ----------

function startQuickDrill() {
  router.push({ name: "quick-drill" });
}

function continueLastSession() {
  if (!lastDrill.value) {
    goToCourses();
    return;
  }
  reviewDrill(lastDrill.value.id);
}

function goToCourses() {
  router.push("/courses");
}

function openMaterials() {
  router.push({ name: "courses", query: { tab: "materials" } });
}

function manageCourses() {
  router.push({ name: "courses", query: { tab: "manage" } });
}

function reviewLastDrill() {
  if (!lastDrill.value) {
    startQuickDrill();
    return;
  }
  reviewDrill(lastDrill.value.id);
}

function reviewDrill(drillId) {
  if (!drillId) return;
  const drill = recentDrills.value.find((d) => d.id === drillId);
  const courseId = drill?.courseId;
  if (courseId) {
    router.push({
      name: "course-detail",
      params: { id: courseId },
      query: { drillId },
    });
  } else {
    router.push({ name: "quick-drill", query: { drillId } });
  }
}

// ---------- LIFECYCLE ----------

onMounted(() => {
  loadDashboard();
});
</script>
