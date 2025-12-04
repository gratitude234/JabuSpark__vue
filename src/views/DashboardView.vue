<template>
  <div class="space-y-6">
    <PageHeader
      :title="headerTitle"
      :subtitle="headerSubtitle"
      eyebrow="Dashboard"
    >
      <template #extra>
        <div class="mt-3 rounded-2xl border border-slate-200 bg-white/80 shadow-sm">
          <div
            class="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
          >
            <div class="space-y-1">
              <p class="text-xs font-semibold text-slate-800">
                Your semester control room
              </p>
              <p class="text-[11px] text-muted">
                Keep drills, streak, and assessments aligned for the week.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 text-[11px]">
              <span
                v-if="meta.week || meta.semester || meta.level"
                class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700"
              >
                <span
                  class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-indigo-700 shadow-sm"
                >
                  S
                </span>
                <span class="flex items-center gap-1">
                  <span v-if="meta.week">Week {{ meta.week }}</span>
                  <span v-if="meta.week && (meta.semester || meta.level)" class="text-indigo-300">|</span>
                  <span v-if="meta.semester">{{ meta.semester }}</span>
                  <span v-if="meta.level && (meta.week || meta.semester)" class="text-indigo-300">|</span>
                  <span v-if="meta.level">{{ meta.level }} level</span>
                </span>
              </span>

              <span
                class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700"
              >
                <span
                  class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-emerald-700 shadow-sm"
                >
                  W
                </span>
                <span>{{ meta.completedDrillsThisWeek }}/{{ meta.targetDrillsThisWeek }} drills this week</span>
              </span>

              <button
                @click="startQuickDrill"
                class="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 font-semibold text-surface shadow-sm transition hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span class="text-[11px]">Start quick drill</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </PageHeader>

    <StateBlock
      v-if="loading"
      title="Loading dashboard"
      message="Fetching your stats, drills and streak."
      tone="muted"
    />

    <StateBlock
      v-else-if="error"
      title="Could not load your dashboard"
      :message="error"
      tone="danger"
    >
      <template #actions>
        <button
          class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          @click="loadDashboard"
        >
          Retry
        </button>
      </template>
    </StateBlock>

    <PageSection v-else class="space-y-5 pb-24 sm:pb-8">
      <div class="grid gap-3 lg:grid-cols-3">
        <div
          class="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 text-xs shadow-sm"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-[13px] font-semibold text-indigo-700 shadow-inner"
            >
              {{ userInitials }}
            </div>
            <div class="space-y-0.5">
              <p class="text-[11px] font-semibold text-slate-700">
                Logged in as
              </p>
              <p class="text-[13px] font-semibold text-slate-900 leading-tight">
                {{ user?.name || 'Student' }}
              </p>
              <p class="text-[11px] text-muted leading-tight">
                {{ user?.email }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-indigo-50 px-5 py-4 shadow-sm lg:col-span-2"
        >
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-emerald-200/20 blur-2xl"></div>
            <div class="absolute -left-10 -bottom-24 h-48 w-48 rounded-full bg-indigo-200/20 blur-2xl"></div>
          </div>

          <div class="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex flex-1 items-start gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-emerald-700 shadow-md"
              >
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3v6m0 0L8.5 6.5M12 9l3.5-2.5M12 21v-6m0 0 3.5 2.5M12 15l-3.5 2.5M5 12h6m8 0h-6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>

              <div class="flex-1 space-y-2 text-[11px]">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-semibold text-slate-900">
                      Study streak
                    </p>
                    <span
                      v-if="streak.maintainedToday"
                      class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                    >
                      Kept today
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                    >
                      Do a drill today
                    </span>
                  </div>

                  <div class="text-right">
                    <p class="text-base font-bold text-emerald-700 leading-tight">
                      {{ streak.current }} days
                    </p>
                    <p class="text-[11px] text-muted leading-tight">
                      Longest: {{ streak.longest }} days
                    </p>
                  </div>
                </div>

                <p class="text-[11px] text-slate-700">
                  {{ streakProgress.label }}
                </p>

                <div class="space-y-2">
                  <div class="flex items-center justify-between text-[10px] text-slate-600">
                    <span>Next milestone: {{ streakProgress.next }} days</span>
                    <span>{{ streakProgress.pct }}%</span>
                  </div>
                  <div class="h-2 rounded-full bg-white/80 shadow-inner overflow-hidden">
                    <div
                      class="h-full rounded-full bg-emerald-500 transition-all"
                      :style="{ width: streakProgress.pct + '%' }"
                    ></div>
                  </div>
                </div>

                <p class="text-[11px] text-slate-600">
                  Last drill: {{ lastDrillLabel }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="isNewUser"
        class="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-600 px-4 py-4 text-surface shadow-lg sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-start gap-3">
          <div
            class="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg font-semibold shadow-sm"
          >
            +
          </div>
          <div class="space-y-1 text-xs">
            <p class="text-[11px] font-semibold uppercase tracking-wide">
              Welcome to Jabuspark
            </p>
            <p class="text-[12px] font-semibold leading-snug">
              Kick off with one quick drill to start your streak.
            </p>
            <p class="text-[11px] text-indigo-100">
              We will track drills, scores, and assessments for you here.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap justify-end gap-2 sm:flex-nowrap">
          <button
            class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            @click="startQuickDrill"
          >
            <span class="text-sm">&gt;</span>
            Start first drill
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-full border border-white/70 px-3 py-1.5 text-[11px] font-semibold text-surface transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            @click="goToCourses"
          >
            Browse my courses
          </button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Courses this semester"
          caption="Synced from your department"
          :value="stats.courses"
          tone="indigo"
        />

        <StatCard
          title="Practice questions"
          caption="Available across your courses"
          :value="stats.questions"
          tone="emerald"
        />

        <StatCard
          title="Average drill score"
          caption="Last few attempts"
          :value="stats.avg_score !== null ? `${stats.avg_score}%` : '--'"
          tone="rose"
        />
      </div>

      <div
        v-if="scoreTrend.length"
        class="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 text-xs shadow-sm"
      >
        <div class="flex items-center justify-between gap-2">
          <div>
            <p class="text-sm font-semibold text-slate-900">
              Drill performance trend
            </p>
            <p class="text-[11px] text-muted">
              Last {{ scoreTrend.length }} sessions - higher bars mean better scores.
            </p>
          </div>
          <span
            class="hidden rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 sm:inline-flex"
          >
            Scores
          </span>
        </div>

        <div class="mt-3 flex h-24 items-end gap-3 sm:h-28">
          <div
            v-for="point in scoreTrend"
            :key="point.id"
            class="flex flex-1 min-w-[14px] flex-col items-center gap-1"
          >
            <div class="w-full max-w-[18px] rounded-full bg-slate-100">
              <div
                class="w-full rounded-full transition-all"
                :class="[
                  point.tone === 'high'
                    ? 'bg-emerald-500'
                    : point.tone === 'mid'
                      ? 'bg-amber-500'
                      : 'bg-rose-500',
                ]"
                :style="{ height: point.height + '%' }"
              ></div>
            </div>
            <span class="text-[10px] font-semibold text-slate-700">
              {{ point.score }}%
            </span>
            <span class="text-[9px] text-muted truncate max-w-[48px]">
              {{ point.label }}
            </span>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-brand-dark">
            Today at a glance
          </h3>
          <span class="text-[11px] text-muted">
            Quick view of drills, assessments, and last touch.
          </span>
        </div>

        <div class="grid gap-3 text-xs sm:grid-cols-3">
          <div
            class="flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3.5 py-3 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <p class="font-semibold text-slate-900">This week's drills</p>
              <span
                class="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
              >
                {{ meta.completedDrillsThisWeek }}/{{ meta.targetDrillsThisWeek }}
              </span>
            </div>
            <p class="text-[11px] text-muted">
              Hit your weekly target to keep your momentum.
            </p>
            <div class="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                class="h-full rounded-full bg-emerald-500 transition-all"
                :style="{ width: weeklyProgressPercent + '%' }"
              ></div>
            </div>
          </div>

          <div
            class="flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3.5 py-3 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <p class="font-semibold text-slate-900">Next assessment</p>
              <span
                v-if="nextExamSummary"
                class="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700"
              >
                {{ nextExamSummary.badge }}
              </span>
            </div>

            <div v-if="nextExamSummary" class="space-y-0.5">
              <p class="text-[12px] font-semibold text-slate-900">
                {{ nextExamSummary.title }}
              </p>
              <p class="text-[11px] text-muted">
                {{ nextExamSummary.meta }}
              </p>
            </div>
            <p v-else class="text-[11px] text-muted">
              No exams or tests added yet. You'll see the next one here.
            </p>
          </div>

          <div
            class="flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3.5 py-3 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <p class="font-semibold text-slate-900">Last activity</p>
              <span
                v-if="lastActivitySummary"
                class="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
              >
                {{ lastActivitySummary.time }}
              </span>
            </div>

            <div v-if="lastActivitySummary" class="space-y-0.5">
              <p class="text-[12px] font-semibold text-slate-900">
                {{ lastActivitySummary.title }}
              </p>
              <p class="text-[11px] text-muted">
                {{ lastActivitySummary.meta }}
              </p>
            </div>
            <p v-else class="text-[11px] text-muted">
              No drills yet. Start a quick drill to see your activity here.
            </p>
          </div>
        </div>
      </div>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-brand-dark">Quick actions</h3>
          <span class="text-[11px] text-muted">Jump back into the right task.</span>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <button
            class="quick-action group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="startQuickDrill"
          >
            <div class="flex items-start gap-2">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-[12px] font-semibold text-indigo-700"
              >
                QD
              </div>
              <div class="space-y-1">
                <div class="quick-action-title text-[12px] font-semibold text-slate-900">
                  Quick drill
                </div>
                <span class="quick-action-sub block text-[11px] text-muted">
                  5-10 random questions from active courses.
                </span>
              </div>
            </div>
          </button>

          <button
            class="quick-action group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="goToLastDrill"
          >
            <div class="flex items-start gap-2">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-[12px] font-semibold text-emerald-700"
              >
                RL
              </div>
              <div class="space-y-1">
                <div class="quick-action-title text-[12px] font-semibold text-slate-900">
                  Review last drill
                </div>
                <span class="quick-action-sub block text-[11px] text-muted">
                  Revisit missed answers while they are fresh.
                </span>
              </div>
            </div>
          </button>

          <button
            class="quick-action group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="goToMaterials"
          >
            <div class="flex items-start gap-2">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-[12px] font-semibold text-sky-700"
              >
                OM
              </div>
              <div class="space-y-1">
                <div class="quick-action-title text-[12px] font-semibold text-slate-900">
                  Open materials
                </div>
                <span class="quick-action-sub block text-[11px] text-muted">
                  PDFs and notes for registered courses.
                </span>
              </div>
            </div>
          </button>

          <button
            class="quick-action group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="goToCourses"
          >
            <div class="flex items-start gap-2">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-[12px] font-semibold text-amber-700"
              >
                MC
              </div>
              <div class="space-y-1">
                <div class="quick-action-title text-[12px] font-semibold text-slate-900">
                  Manage courses
                </div>
                <span class="quick-action-sub block text-[11px] text-muted">
                  Jump into course drills and materials.
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div
        v-if="recommendedAction"
        class="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-start gap-3">
          <div
            class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm"
          >
            ?
          </div>
          <div class="space-y-1">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
              Recommended next step
            </p>
            <p class="text-[12px] font-semibold text-slate-900">
              {{ recommendedAction.title }}
            </p>
            <p class="text-[11px] text-indigo-900/80">
              {{ recommendedAction.subtitle }}
            </p>
          </div>
        </div>

        <div class="flex flex-col items-end gap-1">
          <span
            v-if="recommendedAction.chip"
            :class="[
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
              recommendedAction.isLowScore
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            ]"
          >
            {{ recommendedAction.chip }}
          </span>

          <button
            class="mt-1 inline-flex items-center rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold text-surface shadow transition hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="reviewDrill(recommendedAction.drillId)"
          >
            Review now
          </button>
        </div>
      </div>

      <div
        class="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm sm:flex-row sm:items-center"
      >
        <div>
          <h2 class="text-sm font-semibold text-brand-dark">
            Continue studying
          </h2>
          <p class="mt-0.5 text-xs text-muted">
            Jump into your courses to start a new drill or review materials.
          </p>
        </div>

        <button
          @click="goToCourses"
          class="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-surface shadow-md transition hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:text-sm"
        >
          Go to My Courses
        </button>
      </div>

      <div
        v-if="focusCourses.length"
        class="space-y-2 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-brand-dark">
            Focus courses
          </h3>
          <span class="text-[11px] font-semibold text-amber-700">
            Lowest averages
          </span>
        </div>
        <p class="text-xs text-muted">
          These courses have the lowest average drill scores from your recent activity.
        </p>

        <div class="mt-2 grid gap-3 text-xs sm:grid-cols-3">
          <div
            v-for="course in focusCourses"
            :key="course.courseCode + course.courseTitle"
            class="flex h-full flex-col gap-2 rounded-xl border border-amber-200 bg-white/90 px-3 py-3 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  {{ course.courseCode || 'Course' }}
                </p>
                <p class="text-[12px] font-semibold text-slate-900">
                  {{ course.courseTitle }}
                </p>
              </div>
              <span
                class="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
              >
                {{ course.avgScore }}% avg
              </span>
            </div>

            <p class="text-[11px] text-muted">
              {{ course.count }} drill{{ course.count > 1 ? 's' : '' }} taken
              <span v-if="course.lastDrillAt">
                - Last: {{ formatDate(course.lastDrillAt.toISOString()) }}
              </span>
            </p>

            <div class="mt-1">
              <div class="mb-1 flex items-center justify-between text-[10px] text-muted">
                <span>Mastery</span>
                <span>{{ course.avgScore }}%</span>
              </div>
              <div class="h-2 rounded-full bg-amber-50">
                <div
                  class="h-full rounded-full bg-amber-500 transition-all"
                  :style="{ width: Math.min(Math.max(course.avgScore || 0, 0), 100) + '%' }"
                ></div>
              </div>
            </div>

            <button
              class="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-surface shadow transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
              @click="goToCourseFocus(course.courseCode)"
            >
              Focus on this course
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm lg:col-span-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-brand-dark">
              Recent drills
            </h3>
            <span class="text-[11px] text-muted">
              Latest attempts and scores
            </span>
          </div>

          <div v-if="recentDrills.length" class="mt-3 space-y-2 text-xs">
            <div
              v-for="d in recentDrills"
              :key="d.id"
              class="group relative overflow-hidden rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow-md"
            >
              <div class="flex items-start gap-3">
                <div
                  class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold uppercase text-indigo-700"
                >
                  {{ d.course_code ? d.course_code.slice(0, 3) : "DR" }}
                </div>

                <div class="flex-1 space-y-1">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        v-if="d.course_code"
                        class="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700"
                      >
                        {{ d.course_code }}
                      </span>
                      <span class="text-[12px] font-semibold text-slate-900">
                        {{ d.course_title || "Drill session" }}
                      </span>
                    </div>

                    <span
                      :class="[
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        d.score >= 70
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      ]"
                    >
                      {{ d.score >= 70 ? "On track" : "Needs revision" }}
                    </span>
                  </div>

                  <p class="text-[11px] text-muted">
                    {{ d.num_correct }}/{{ d.num_questions }} correct -
                    {{ d.score }}% -
                    {{ formatDate(d.created_at) }}
                  </p>

                  <div class="mt-1">
                    <div class="mb-1 flex items-center justify-between text-[10px] text-muted">
                      <span>Score</span>
                      <span>{{ d.score }}%</span>
                    </div>
                    <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full transition-all"
                        :class="d.score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'"
                        :style="{ width: Math.min(Math.max(d.score || 0, 0), 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col items-end gap-1">
                  <button
                    class="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-brand transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    @click="reviewDrill(d.id)"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="mt-3 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex items-start gap-3">
              <div
                class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
              >
                !
              </div>
              <div class="space-y-1">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                  No drills yet
                </p>
                <p class="text-[12px] font-semibold text-slate-900">
                  Start a 5-10 question quick drill to unlock your first stats.
                </p>
                <p class="text-[11px] text-muted">
                  Your recent drills, scores and progress will show up here as soon as you
                  complete a session.
                </p>
              </div>
            </div>

            <button
              class="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold text-surface shadow transition hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              @click="startQuickDrill"
            >
              Start quick drill
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-brand-dark">
              Upcoming assessments
            </h3>
            <span class="text-[11px] text-muted">What is ahead</span>
          </div>
          <div class="mt-2">
            <div
              v-if="!upcomingExams.length"
              class="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3"
            >
              <div
                class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
              >
                CAL
              </div>
              <div class="space-y-1">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                  No assessments yet
                </p>
                <p class="text-[12px] font-semibold text-slate-900">
                  Exam and test dates will appear here once they are added.
                </p>
                <p class="text-[11px] text-muted">
                  Your department or course rep can add upcoming tests so you can plan revision early.
                </p>
              </div>
            </div>

            <ul v-else class="mt-2 space-y-2">
              <li
                v-for="exam in upcomingExams"
                :key="exam.id"
                class="flex items-start justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
              >
                <div>
                  <p class="text-[12px] font-semibold text-slate-900">
                    {{ exam.course_code }} - {{ exam.title }}
                  </p>
                  <p class="text-[11px] text-muted">
                    {{ exam.date }} - {{ exam.type }}
                  </p>
                </div>
                <span class="text-[11px] font-semibold text-indigo-600">
                  {{ exam.daysLeft }}d
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        v-if="activityTimeline.length"
        class="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm"
      >
        <h3 class="text-sm font-semibold text-brand-dark">
          Activity timeline
        </h3>

        <div class="mt-3 space-y-4 text-xs">
          <div
            v-for="section in activityTimeline"
            :key="section.label"
            class="space-y-2"
          >
            <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {{ section.label }}
            </p>

            <div class="relative pl-5">
              <div class="absolute left-1 top-0 bottom-0 w-px bg-slate-200"></div>

              <div class="space-y-2">
                <div
                  v-for="item in section.items"
                  :key="item.id"
                  class="relative flex items-start gap-3"
                >
                  <div class="flex flex-col items-center">
                    <div
                      class="h-3 w-3 rounded-full border-2 border-white"
                      :class="item.statusTone === 'good'
                        ? 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]'
                        : 'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.35)]'"
                    ></div>
                  </div>

                  <div
                    class="flex-1 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <p class="text-[12px] font-semibold text-slate-900">
                        {{ item.courseTitle }}
                      </p>
                      <span class="text-[10px] text-muted">
                        {{ formatTimeShort(item.timestamp) }}
                      </span>
                    </div>
                    <p class="mt-0.5 text-[11px] text-muted">
                      {{ item.numCorrect }}/{{ item.numQuestions }} correct -
                      {{ item.score }}% -
                      {{ item.statusLabel }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <button
          @click="logout"
          class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          Logout
        </button>
      </div>

      <div class="fixed inset-x-0 bottom-0 z-30 sm:hidden">
        <div class="mx-auto max-w-3xl px-3 pb-4">
          <div
            class="flex items-center justify-between gap-3 rounded-2xl bg-slate-900/95 px-4 py-3 text-surface shadow-xl backdrop-blur"
          >
            <div class="text-[11px] leading-tight">
              <p class="font-semibold">
                Need a quick revision?
              </p>
              <p class="text-[10px] text-slate-300">
                Start a 5-10 question drill from your active courses.
              </p>
            </div>

            <button
              @click="startQuickDrill"
              class="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold text-surface shadow transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Start drill
            </button>
          </div>
        </div>
      </div>
    </PageSection>
  </div>
</template>

<script setup>

import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import PageHeader from "../components/ui/PageHeader.vue";
import PageSection from "../components/ui/PageSection.vue";
import StatCard from "../components/ui/StatCard.vue";
import StateBlock from "../components/ui/StateBlock.vue";
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

// Semester meta + weekly goals (can be overridden by API)
const meta = ref({
  week: null,
  semester: null,
  level: null,
  targetDrillsThisWeek: 10,
  completedDrillsThisWeek: 0,
});

// Streak info (can also be overridden by API)
const streak = ref({
  current: 0,
  longest: 0,
  maintainedToday: false,
});

// Upcoming assessments (for now mocked / or filled from API)
const upcomingExams = ref([]);

// ========== HELPERS ==========

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initialsFromName(name) {
  if (!name) return "JP";
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "JP";
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase();
}

// ========== COMPUTEDS ==========

// Smart header
const headerTitle = computed(() => {
  const name = user.value?.name || "there";
  const hour = new Date().getHours();

  let prefix = "Hey";
  if (hour < 12) prefix = "Good morning";
  else if (hour < 17) prefix = "Good afternoon";
  else prefix = "Good evening";

  return `${prefix}, ${name}`;
});

const headerSubtitle = computed(() => {
  if (!recentDrills.value.length) {
    return "Start with a 5-10 question quick drill and build your streak.";
  }

  if (streak.value.current >= 7) {
    return "Your study streak is on fire. Keep the momentum going this week.";
  }

  return "Stay on top of this semester with smart drills and quick revision.";
});

// User initials
const userInitials = computed(() => initialsFromName(user.value?.name));

// Last drill label
const lastDrillLabel = computed(() => {
  const list = recentDrills.value;
  if (!list || !list.length) return "No drills yet";
  const last = list[0];
  return formatDate(last?.created_at);
});

// New user flag
const isNewUser = computed(() => {
  const noDrills = !recentDrills.value || recentDrills.value.length === 0;
  const noStreak = !streak.value.current;
  const noWeeklyProgress = !meta.value.completedDrillsThisWeek;

  return noDrills && noStreak && noWeeklyProgress;
});

// Today-at-a-glance
const weeklyProgressPercent = computed(() => {
  const done = meta.value.completedDrillsThisWeek || 0;
  const target = meta.value.targetDrillsThisWeek || 1;

  let pct = Math.round((done / target) * 100);
  if (pct > 130) pct = 130;
  if (pct < 0) pct = 0;

  return pct;
});

const nextExamSummary = computed(() => {
  if (!upcomingExams.value.length) return null;
  const e = upcomingExams.value[0];

  return {
    title: `${e.course_code} - ${e.title}`,
    meta: `${e.date} - ${e.type}`,
    badge: `${e.daysLeft}d left`,
  };
});

const lastActivitySummary = computed(() => {
  if (!recentDrills.value.length) return null;
  const d = recentDrills.value[0];

  return {
    title: d.course_title || "Last drill",
    meta: `${d.num_correct}/${d.num_questions} correct - ${d.score}%`,
    time: formatDate(d.created_at),
  };
});

// Streak progress
const streakProgress = computed(() => {
  const current = streak.value.current || 0;

  // Milestones
  let next = 7;
  if (current >= 7 && current < 30) next = 30;
  else if (current >= 30 && current < 90) next = 90;
  else if (current >= 90) next = current + 10;

  let pct = Math.round((current / next) * 100);
  if (pct > 100) pct = 100;
  if (pct < 0) pct = 0;

  let label =
    "Keep answering at least one quick drill each day to grow your streak.";

  if (current === 0) {
    label = "Do one quick drill today to start your streak.";
  } else if (current > 0 && current < 3) {
    label = "Nice start. Keep it up for the next few days.";
  } else if (current >= 3 && current < 7) {
    label = "You're close to a 7-day streak badge. Don't stop now.";
  } else if (current >= 7 && current < 30) {
    label = "Strong streak. Aim for a 30-day run this month.";
  } else if (current >= 30 && current < 90) {
    label = "Elite focus. You're building a serious habit.";
  } else if (current >= 90) {
    label = "God-mode consistency. Protect this streak at all costs.";
  }

  return { next, pct, label };
});

// Recommended next action
const recommendedAction = computed(() => {
  const drills = recentDrills.value;
  if (!drills || !drills.length) return null;

  const windowSize = 5;
  const slice = drills.slice(0, windowSize);
  if (!slice.length) return null;

  const worst = [...slice].sort((a, b) => {
    const sa = typeof a.score === "number" ? a.score : 0;
    const sb = typeof b.score === "number" ? b.score : 0;
    return sa - sb;
  })[0];

  if (!worst) return null;

  const score = typeof worst.score === "number" ? worst.score : 0;
  const isLowScore = score < 70;
  const courseCode = worst.course_code || "";
  const courseTitle = worst.course_title || "this course";

  const title = `You scored ${score}% in ${courseCode || courseTitle}.`;

  const subtitle = isLowScore
    ? "Review the questions you missed now while it's still fresh."
    : "Do a quick review to lock in what you already know.";

  const chip = isLowScore ? "Needs revision" : "On track";

  return {
    drillId: worst.id,
    title,
    subtitle,
    chip,
    isLowScore,
  };
});
// Score trend mini chart
const scoreTrend = computed(() => {
  const drills = recentDrills.value;
  if (!drills || !drills.length) return [];

  // Take last up to 7 drills, oldest on the left
  const slice = drills.slice(0, 7).slice().reverse();

  return slice.map((d, index) => {
    const rawScore = typeof d.score === "number" ? d.score : 0;
    const score = Math.min(Math.max(rawScore, 0), 100);
    const height = Math.max(score, 8);

    let tone = "low";
    if (score >= 70) tone = "high";
    else if (score >= 50) tone = "mid";

    return {
      id: d.id ?? index,
      score,
      height,
      tone,
      label: d.course_code || `Drill ${slice.length - index}`,
    };
  });
});

// Focus courses (weakest averages)
const focusCourses = computed(() => {
  const drills = recentDrills.value;
  if (!drills || !drills.length) return [];

  const byCourse = new Map();

  drills.forEach((d) => {
    const code = d.course_code || "Unknown";
    const title = d.course_title || "Course";
    const key = `${code}||${title}`;

    const score = typeof d.score === "number" ? d.score : 0;
    const createdAt =
      d.created_at && !Number.isNaN(new Date(d.created_at).getTime())
        ? new Date(d.created_at)
        : null;

    if (!byCourse.has(key)) {
      byCourse.set(key, {
        courseCode: code,
        courseTitle: title,
        count: 0,
        totalScore: 0,
        lastDrillAt: null,
      });
    }

    const entry = byCourse.get(key);
    entry.count += 1;
    entry.totalScore += score;

    if (
      createdAt &&
      (!entry.lastDrillAt || createdAt > entry.lastDrillAt)
    ) {
      entry.lastDrillAt = createdAt;
    }

    byCourse.set(key, entry);
  });

  let list = Array.from(byCourse.values()).map((entry) => {
    const avgScore = entry.count
      ? Math.round(entry.totalScore / entry.count)
      : 0;
    return {
      ...entry,
      avgScore,
    };
  });

  list = list.filter((entry) => entry.count >= 1);
  list.sort((a, b) => a.avgScore - b.avgScore);

  return list.slice(0, 3);
});

// Activity timeline
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const activityTimeline = computed(() => {
  const drills = recentDrills.value;
  if (!drills || !drills.length) return [];

  const now = new Date();
  const todayStart = startOfDay(now);

  const sectionsMap = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Older: [],
  };

  drills.forEach((d) => {
    if (!d.created_at) return;
    const dt = new Date(d.created_at);
    if (Number.isNaN(dt.getTime())) return;

    const drillDay = startOfDay(dt);
    const diffMs = todayStart.getTime() - drillDay.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let bucket = "Older";
    if (diffDays === 0) bucket = "Today";
    else if (diffDays === 1) bucket = "Yesterday";
    else if (diffDays <= 7) bucket = "This week";

    const score = typeof d.score === "number" ? d.score : 0;
    const isGood = score >= 70;

    sectionsMap[bucket].push({
      id: d.id,
      courseCode: d.course_code,
      courseTitle: d.course_title || "Drill session",
      score,
      numCorrect: d.num_correct,
      numQuestions: d.num_questions,
      timestamp: dt,
      statusLabel: isGood ? "On track" : "Needs revision",
      statusTone: isGood ? "good" : "warn",
    });
  });

  const orderedLabels = ["Today", "Yesterday", "This week", "Older"];

  return orderedLabels
    .map((label) => ({
      label,
      items: sectionsMap[label],
    }))
    .filter((section) => section.items.length > 0);
});

function formatTimeShort(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ========== API / DATA LOAD ==========

async function loadDashboard() {
  loading.value = true;
  error.value = "";
  try {
    const data = await getDashboardSummary();

    user.value = data.user || null;
    stats.value = data.stats || stats.value;
    recentDrills.value = data.recent_drills || [];

    // Optional: meta from API
    if (data.meta) {
      meta.value = {
        ...meta.value,
        ...data.meta,
      };
    }

    // Optional: streak from API
    if (data.streak) {
      streak.value = {
        ...streak.value,
        ...data.streak,
      };
    } else {
      // Fallback streak estimation (very rough)
      const last = recentDrills.value[0];
      if (last?.created_at) {
        const today = new Date();
        const lastDate = new Date(last.created_at);
        const sameDay =
          lastDate.getFullYear() === today.getFullYear() &&
          lastDate.getMonth() === today.getMonth() &&
          lastDate.getDate() === today.getDate();

        streak.value.maintainedToday = sameDay;
      }
    }

    // Fallback: estimate completedDrillsThisWeek from recent drills
    if (!meta.value.completedDrillsThisWeek) {
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);

      meta.value.completedDrillsThisWeek = recentDrills.value.filter((d) => {
        const dt = new Date(d.created_at);
        if (Number.isNaN(dt.getTime())) return false;
        return dt >= weekAgo && dt <= now;
      }).length;
    }

    // Upcoming exams (mock or from API)
    if (Array.isArray(data.upcoming_exams)) {
      upcomingExams.value = data.upcoming_exams;
    } else {
      // Simple mock; you can remove when backend is ready
      upcomingExams.value = [
        {
          id: 1,
          course_code: "CSC 201",
          title: "Mid-semester test",
          date: "12 Mar, 9:00am",
          type: "Test",
          daysLeft: 5,
        },
        {
          id: 2,
          course_code: "MTH 203",
          title: "Quiz on Calculus",
          date: "15 Mar, 2:00pm",
          type: "Quiz",
          daysLeft: 8,
        },
      ];
    }
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

// ========== ACTIONS / NAVIGATION ==========

function logout() {
  localStorage.removeItem("jabuspark_token");
  router.push("/login");
}

function goToCourses() {
  router.push("/courses");
}

function goToCourseFocus(courseCode) {
  if (!courseCode) {
    router.push("/courses");
    return;
  }
  router.push({
    path: "/courses",
    query: { focus: courseCode },
  });
}

function startQuickDrill() {
  router.push({ name: "quick-drill" });
}

function goToLastDrill() {
  const last = recentDrills.value[0];
  if (!last) {
    goToCourses();
    return;
  }
  const courseId = last.course_id || last.courseId;
  if (courseId) {
    router.push({
      name: "course-detail",
      params: { id: courseId },
      query: { drillId: last.id },
    });
    return;
  }
  router.push({ name: "quick-drill" });
}

function goToMaterials() {
  router.push({ name: "courses" });
}

function reviewDrill(drillId) {
  if (!drillId) return;
  const drill = recentDrills.value.find((d) => d.id === drillId);
  const courseId = drill?.course_id || drill?.courseId;
  if (courseId) {
    router.push({
      name: "course-detail",
      params: { id: courseId },
      query: { drillId },
    });
    return;
  }
  router.push({ name: "quick-drill" });
}

// ========== LIFECYCLE ==========

onMounted(() => {
  const token = localStorage.getItem("jabuspark_token");
  if (!token) {
    router.push("/login");
  } else {
    loadDashboard();
  }
});
</script>
