<!-- src/views/LoginView.vue -->
<template>
  <div class="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-10">
    <div
      class="w-full max-w-md bg-white rounded-3xl shadow-lg border border-slate-100 px-6 sm:px-8 py-8 sm:py-10"
    >
      <!-- Brand row -->
      <div class="flex items-center gap-3 mb-6">
        <div
          class="h-10 w-10 rounded-full bg-gradient-to-tr from-brand via-indigo-500 to-sky-400 flex items-center justify-center text-white font-semibold text-lg"
        >
          J
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-900">Jabuspark</p>
          <p class="text-[11px] text-slate-500">
            AI-powered study hub for uni students
          </p>
        </div>
      </div>

      <h1 class="text-xl sm:text-2xl font-bold text-slate-900">
        Log in to your Jabuspark
      </h1>
      <p class="mt-1 text-xs sm:text-sm text-slate-500">
        Use the same email you’ll use across your courses.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <!-- Email -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-slate-700">
            Email
          </label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            placeholder="you@example.com"
          />
        </div>

        <!-- Password -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-slate-700">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            placeholder="••••••••"
          />
        </div>

        <!-- Error -->
        <p v-if="error" class="text-xs text-rose-600">
          {{ error }}
        </p>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-brand text-white text-sm font-semibold py-2.5 shadow-md hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          <span v-if="loading">Logging in...</span>
          <span v-else>Continue</span>
        </button>
      </form>

      <!-- Link to sign up -->
      <p class="mt-4 text-[11px] text-slate-600 text-center">
        Don’t have an account yet?
        <RouterLink
          to="/register"
          class="font-semibold text-brand hover:underline hover:text-indigo-600"
        >
          Create one
        </RouterLink>
      </p>

      <p class="mt-2 text-[11px] text-slate-500 text-center">
        Jabuspark is in early beta for JABU students. Other schools coming soon.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { login } from "../services/auth";

const router = useRouter();

const email = ref(""); // no default teststudent
const password = ref("");
const loading = ref(false);
const error = ref("");

async function handleSubmit() {
  loading.value = true;
  error.value = "";

  try {
    await login(email.value, password.value);
    await router.push("/dashboard");
  } catch (e) {
    console.error(e);
    error.value =
      e.response?.data?.message || "Login failed. Please check your details.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* brand color used in Tailwind classes via @apply or global config;
   if you're not using Tailwind, you can keep this empty. */
</style>
