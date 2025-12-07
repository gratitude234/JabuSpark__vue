<!-- src/layouts/MainShell.vue -->
<template>
  <div class="min-h-screen bg-slate-50">
    <!-- TOP NAVBAR -->
    <header class="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <!-- LEFT: Brand -->
        <RouterLink to="/dashboard" class="flex items-center gap-3">
          <!-- LOGO -->
          <img
            :src="Logo"
            alt="Jabuspark Logo"
            class="h-10 w-auto object-contain"
          />

          <div class="hidden sm:block leading-tight">
            <p class="text-sm font-semibold text-slate-900">Jabuspark</p>
            <p class="text-[11px] text-slate-500">Study hub for uni students</p>
          </div>
        </RouterLink>

        <!-- CENTER: Main nav (desktop) -->
        <nav class="hidden md:flex items-center gap-2">
          <!-- Active routes -->
          <RouterLink
            v-for="item in primaryNav"
            :key="item.to"
            :to="item.to"
            class="px-4 py-2 text-sm font-medium rounded-full border transition
                   hover:border-indigo-200 hover:bg-indigo-50"
            :class="isActive(item)
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'text-slate-600'"
          >
            {{ item.label }}
          </RouterLink>

          <!-- Planner disabled pill -->
          <button
            type="button"
            disabled
            class="px-4 py-2 text-sm font-medium rounded-full border border-dashed border-slate-200 text-slate-400 cursor-default"
          >
            Planner (soon)
          </button>
        </nav>

        <!-- RIGHT: actions + profile -->
        <div class="flex items-center gap-2">
          <!-- Profile pill (desktop) -->
          <div
            class="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
          >
            <div class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold">
              {{ initials }}
            </div>
            <div class="leading-tight">
              <p class="font-medium text-slate-900 truncate max-w-[120px]">
                {{ user?.name || "Student" }}
              </p>
              <p class="text-[11px] text-slate-500 capitalize">
                {{ user?.role || "student" }}
              </p>
            </div>
          </div>

          <!-- Mobile menu toggle (for top nav links) -->
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 md:hidden"
            @click="mobileOpen = !mobileOpen"
          >
            <span v-if="!mobileOpen">☰</span>
            <span v-else>✕</span>
          </button>
        </div>
      </div>

      <!-- MOBILE TOP NAV (slide-down) -->
      <Transition name="fade-slide">
        <nav
          v-if="mobileOpen"
          class="border-t border-slate-100 bg-white md:hidden"
        >
          <div class="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            <RouterLink
              v-for="item in primaryNav"
              :key="item.to"
              :to="item.to"
              class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition"
              :class="isActive(item)
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'"
              @click="mobileOpen = false"
            >
              <span>{{ item.label }}</span>
              <span v-if="isActive(item)" class="text-[11px] opacity-80">
                Current
              </span>
            </RouterLink>

            <!-- Planner disabled row -->
            <div
              class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium bg-slate-50 text-slate-400 border border-dashed border-slate-200"
            >
              <span>Planner (soon)</span>
              <span class="text-[11px]">Coming</span>
            </div>
          </div>
        </nav>
      </Transition>
    </header>

    <!-- PAGE CONTENT -->
    <main class="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
      <!-- pb-20 so content doesn't sit under the bottom nav on mobile -->
      <slot />
    </main>

    <!-- BOTTOM NAV (mobile only) -->
    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-around px-4 py-2.5 text-xs">
        <!-- Home -->
        <RouterLink
          :to="'/dashboard'"
          class="flex flex-col items-center gap-0.5 px-2"
          :class="route.path.startsWith('/dashboard') ? 'text-indigo-600' : 'text-slate-500'"
        >
          <span class="text-lg">🏠</span>
          <span class="font-medium">Home</span>
        </RouterLink>

        <!-- Courses -->
        <RouterLink
          :to="'/courses'"
          class="flex flex-col items-center gap-0.5 px-2"
          :class="route.path.startsWith('/courses') ? 'text-indigo-600' : 'text-slate-500'"
        >
          <span class="text-lg">📚</span>
          <span class="font-medium">Courses</span>
        </RouterLink>

        <!-- Planner (non-clickable, soon) -->
        <button
          type="button"
          disabled
          class="flex flex-col items-center gap-0.5 px-2 text-slate-400"
        >
          <span class="text-lg">🗓</span>
          <span class="font-medium">
            Planner
            <span class="text-[9px] ml-0.5 opacity-70">(soon)</span>
          </span>
        </button>
      </div>
    </nav>

    <!-- PWA Install banner -->
    <PwaInstallBanner />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute, RouterLink } from "vue-router";

// ✅ IMPORT LOGO
import Logo from "../assets/logo.jpg";

// ✅ IMPORT PWA INSTALL BANNER
import PwaInstallBanner from "../components/PwaInstallBanner.vue";

const route = useRoute();
const mobileOpen = ref(false);

// Load user from localStorage
const user = computed(() => {
  const stored = localStorage.getItem("jabuspark_user");
  return stored ? JSON.parse(stored) : { name: "Student", role: "student" };
});

const initials = computed(() => {
  if (!user.value?.name) return "S";
  return user.value.name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

// Top nav: only actual routes
const primaryNav = [
  { label: "Dashboard", to: "/dashboard", key: "dashboard" },
  { label: "Courses", to: "/courses", key: "courses" },
];

const isActive = (item) => {
  return route.path.startsWith(item.to);
};
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.18s ease-out;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
