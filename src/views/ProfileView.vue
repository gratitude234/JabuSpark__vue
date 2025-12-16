<template>
  <main class="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 space-y-4">
    <h1 class="text-xl font-semibold text-slate-900">Profile</h1>

    <section class="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
      <p class="text-sm text-slate-600">
        <span class="font-medium text-slate-900">Name:</span> {{ user.name }}
      </p>
      <p class="text-sm text-slate-600">
        <span class="font-medium text-slate-900">Role:</span> {{ user.role }}
      </p>
    </section>

    <button
      class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-100"
      @click="logout"
    >
      Logout
    </button>
  </main>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const user = computed(() => {
  const stored = localStorage.getItem("jabuspark_user");
  if (!stored) return { name: "Student", role: "student" };
  try { return JSON.parse(stored); } catch { return { name: "Student", role: "student" }; }
});

function logout() {
  localStorage.removeItem("jabuspark_user");
  localStorage.removeItem("jabuspark_token"); // remove if you use it
  router.replace("/login");
}
</script>
