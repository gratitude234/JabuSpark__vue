<template>
  <div class="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10">
    <div
      class="w-full max-w-xl bg-surface/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8"
    >
      <!-- Heading -->
      <div class="mb-6 space-y-1">
        <h1 class="text-2xl sm:text-3xl font-bold text-brand-dark">
          Create your Jabuspark account
        </h1>
        <p class="text-sm text-muted">
          Join your department’s study hub. Your courses and materials will be
          organised automatically by department and level.
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">
            Full name
          </label>
          <input
            v-model="name"
            type="text"
            autocomplete="name"
            required
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">
            School email
          </label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>

        <!-- Department + Level -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">
              Department
            </label>

            <select
              v-model="departmentId"
              required
              class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="" disabled>Select department</option>
              <option
                v-for="dept in departments"
                :key="dept.id"
                :value="dept.id"
              >
                {{ dept.short_code }} — {{ dept.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">
              Level
            </label>
            <select
              v-model.number="level"
              required
              class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="" disabled>Select level</option>
              <option v-for="lvl in [100,200,300,400,500]" :key="lvl" :value="lvl">
                {{ lvl }} level
              </option>
            </select>
          </div>
        </div>

        <!-- Password -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
              class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">
              Confirm password
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
              class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
        </div>

        <!-- Error -->
        <p v-if="error" class="text-xs text-danger">
          {{ error }}
        </p>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="mt-2 inline-flex w-full items-center justify-center rounded-full bg-brand text-surface text-sm font-semibold px-4 py-2.5 shadow-md hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {{ loading ? "Creating account..." : "Create account" }}
        </button>
      </form>

      <!-- Footer -->
      <p class="mt-4 text-xs text-muted text-center">
        Already have an account?
        <RouterLink to="/login" class="text-brand font-medium hover:underline">
          Log in instead
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { registerStudent, fetchDepartments } from "../services/auth";

const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const departmentId = ref("");
const level = ref("");
const departments = ref([]);

const loading = ref(false);
const error = ref("");

async function loadDepartments() {
  try {
    const data = await fetchDepartments();
    departments.value = data;
  } catch (e) {
    // fallback: no departments
    console.error("Failed to load departments", e);
  }
}

async function handleSubmit() {
  error.value = "";

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  loading.value = true;
  try {
    await registerStudent({
      name: name.value,
      email: email.value,
      password: password.value,
      department_id: departmentId.value,
      level: level.value,
    });

    // On success, send them to login
    alert("Account created successfully. You can now log in.");
    router.push("/login");
  } catch (e) {
    console.error(e);
    error.value =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      "Could not create account. Please try again.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDepartments();
});
</script>
