<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header-inner">
        <RouterLink to="/dashboard" class="brand">
          <span class="brand-mark">J</span>
          <span class="brand-text">
            <span class="brand-name">Jabuspark</span>
            <span class="brand-tagline">Study hub for uni students</span>
          </span>
        </RouterLink>

        <nav class="main-nav">
          <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
          <RouterLink to="/courses" class="nav-link">Courses</RouterLink>
          <span class="nav-link nav-link-disabled">Planner (soon)</span>
        </nav>

        <!-- Dynamic user chip -->
        <div class="user-chip" v-if="user">
          <div class="user-avatar">
            {{ initials }}
          </div>
          <div class="user-meta">
            <span class="user-name">
              {{ user.name || "Student" }}
            </span>
            <span class="user-role text-xs">
              {{ user.role || "Student" }}
            </span>
          </div>
        </div>

        <!-- If not logged in, show generic chip -->
        <div class="user-chip" v-else>
          <div class="user-avatar">J</div>
          <div class="user-meta">
            <span class="user-name">Guest</span>
            <span class="user-role">Not signed in</span>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { RouterLink, RouterView } from "vue-router";

const user = ref(null);

function loadUserFromStorage() {
  const raw = localStorage.getItem("jabuspark_user");
  user.value = raw ? JSON.parse(raw) : null;
}

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

function handleUserUpdated() {
  loadUserFromStorage();
}

onMounted(() => {
  loadUserFromStorage();
  window.addEventListener("jabuspark:user-updated", handleUserUpdated);
});

onBeforeUnmount(() => {
  window.removeEventListener("jabuspark:user-updated", handleUserUpdated);
});
</script>
