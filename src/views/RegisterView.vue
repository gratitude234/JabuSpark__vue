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
        Create your Jabuspark account
      </h1>
      <p class="mt-1 text-xs sm:text-sm text-slate-500">
        Join your department’s study hub. Your courses and materials will be
        organised automatically by department and level.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <!-- Full name -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-slate-700">
            Full name
          </label>
          <input
            v-model="fullName"
            type="text"
            required
            class="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            placeholder="Olanibi ADETOLUWANI Gratitude"
          />
        </div>

        <!-- Email -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-slate-700">
            School email
          </label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            placeholder="you@jabu.edu.ng"
          />
        </div>

        <!-- Department -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-slate-700">
            Department
          </label>
          <select
            v-model="departmentId"
            required
            class="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
          >
            <option disabled value="">Select department</option>
            <option
              v-for="dept in departments"
              :key="dept.id"
              :value="dept.id"
            >
              {{ dept.name }}
            </option>
          </select>

          <p class="mt-1 text-[10px] text-slate-400">
            Loaded departments: {{ departments.length }}
          </p>
          <!-- Show the REAL reason if it failed -->
          <p v-if="deptError" class="mt-1 text-[10px] text-rose-600">
            {{ deptError }}
          </p>
        </div>

        <!-- Level -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-slate-700">
            Level
          </label>
          <select
            v-model="level"
            required
            class="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
          >
            <option disabled value="">Select level</option>
            <option v-for="lvl in levels" :key="lvl" :value="lvl">
              {{ lvl }} level
            </option>
          </select>
        </div>

        <!-- Password -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-slate-700">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            class="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            placeholder="••••••••"
          />
        </div>

        <!-- Confirm password -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-slate-700">
            Confirm password
          </label>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            class="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            placeholder="••••••••"
          />
        </div>

        <!-- Form-level error (submission) -->
        <p v-if="error" class="text-xs text-rose-600">
          {{ error }}
        </p>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-brand text-white text-sm font-semibold py-2.5 shadow-md hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          <span v-if="loading">Creating account...</span>
          <span v-else>Create account</span>
        </button>
      </form>

      <p class="mt-4 text-[11px] text-slate-500 text-center">
        Already have an account?
        <RouterLink
          to="/login"
          class="font-semibold text-brand hover:underline hover:text-indigo-600"
        >
          Log in instead
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const fullName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const departmentId = ref("");
const level = ref("");

const departments = ref([]);
const levels = ref(["100", "200", "300", "400", "500"]);

const loading = ref(false);
const error = ref("");      // submit error
const deptError = ref("");  // department load error

onMounted(async () => {
  try {
    const res = await api.get("/departments/list.php");
    console.log("Departments raw response:", res.data);

    let list = [];

    if (Array.isArray(res.data)) {
      list = res.data;
    } else if (Array.isArray(res.data.departments)) {
      list = res.data.departments;
    } else if (Array.isArray(res.data.data)) {
      list = res.data.data;
    }

    departments.value = list.map((d) => ({
      id: d.id ?? d.department_id ?? d.code ?? d.slug ?? d.ID,
      name: d.name ?? d.department_name ?? d.title ?? d.label,
    }));

    console.log("Parsed departments:", departments.value);
  } catch (e) {
    console.error("Failed to load departments", e);

    const status = e.response?.status;
    const backendMsg =
      e.response?.data?.message ||
      e.response?.data?.error ||
      e.response?.data?.detail ||
      "";

    if (status || backendMsg) {
      deptError.value = `Could not load departments${
        status ? ` (HTTP ${status})` : ""
      }${backendMsg ? `: ${backendMsg}` : ""}`;
    } else {
      deptError.value = `Could not load departments: ${
        e.message || "Network / CORS error"
      }`;
    }
  }
});

async function handleSubmit() {
  error.value = "";

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  loading.value = true;

  try {
    await api.post("/auth/register.php", {
      name: fullName.value,
      email: email.value,
      password: password.value,
      department_id: departmentId.value,
      level: level.value,
    });

    router.push("/login");
  } catch (e) {
    console.error(e);
    error.value =
      e.response?.data?.message ||
      e.response?.data?.error ||
      "Registration failed. Please check your details.";
  } finally {
    loading.value = false;
  }
}
</script>
