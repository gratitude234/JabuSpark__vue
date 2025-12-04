<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <!-- Soft gradient background -->
    <div
      class="pointer-events-none fixed inset-0 opacity-60"
      aria-hidden="true"
    >
      <div
        class="absolute -top-32 left-10 h-72 w-72 rounded-full blur-3xl bg-indigo-500/30"
      />
      <div
        class="absolute bottom-0 right-0 h-80 w-80 rounded-full blur-3xl bg-purple-500/30"
      />
    </div>

    <!-- Card -->
    <div
      class="relative z-10 mx-4 w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-indigo-900/40 backdrop-blur-xl sm:p-8"
    >
      <!-- Brand -->
      <div class="mb-6 flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-400 text-lg font-semibold text-white shadow-lg"
        >
          J
        </div>
        <div>
          <p class="text-sm font-semibold tracking-wide text-slate-200">
            Jabuspark
          </p>
          <p class="text-xs text-slate-400">
            Study hub for uni students
          </p>
        </div>
      </div>

      <!-- Toggle: Sign in / Create account -->
      <div class="mb-6 flex rounded-full bg-slate-800 p-1 text-xs font-medium">
        <button
          type="button"
          class="flex-1 rounded-full px-3 py-2 transition-all"
          :class="mode === 'login'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-400 hover:text-slate-100'"
          @click="switchMode('login')"
        >
          Sign in
        </button>
        <button
          type="button"
          class="flex-1 rounded-full px-3 py-2 transition-all"
          :class="mode === 'signup'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-400 hover:text-slate-100'"
          @click="switchMode('signup')"
        >
          Create account
        </button>
      </div>

      <!-- Heading -->
      <div class="mb-6 space-y-1">
        <h1 class="text-xl font-semibold text-slate-50">
          {{ mode === 'login' ? 'Welcome back 👋' : 'Join Jabuspark' }}
        </h1>
        <p class="text-xs text-slate-400 leading-snug">
          {{
            mode === 'login'
              ? 'Sign in to see your courses, drills, and planner.'
              : 'Create a free account to track your courses and revision.'
          }}
        </p>
      </div>

      <!-- Error / info -->
      <p
        v-if="error"
        class="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
      >
        {{ error }}
      </p>

      <p
        v-if="info && !error"
        class="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200"
      >
        {{ info }}
      </p>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Name (signup only) -->
        <div v-if="mode === 'signup'" class="space-y-1">
          <label class="text-xs font-medium text-slate-200">
            Full name
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="e.g. Jane Doe"
            class="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:bg-slate-900 focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <!-- Email -->
        <div class="space-y-1">
          <label class="text-xs font-medium text-slate-200">
            Email
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="you@example.com"
            class="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:bg-slate-900 focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <!-- Password -->
        <div class="space-y-1">
          <label class="flex items-center justify-between text-xs font-medium text-slate-200">
            <span>Password</span>
            <button
              v-if="mode === 'login'"
              type="button"
              class="text-[11px] font-normal text-indigo-300 hover:text-indigo-200"
            >
              Forgot?
            </button>
          </label>
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            required
            minlength="6"
            placeholder="••••••••"
            class="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:bg-slate-900 focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="button"
            class="mt-1 text-[11px] text-slate-400 hover:text-slate-200"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? 'Hide password' : 'Show password' }}
          </button>
        </div>

        <!-- Optional fields (you can remove if not ready in backend) -->
        <div v-if="mode === 'signup'" class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-medium text-slate-200">
              Department (optional)
            </label>
            <input
              v-model="form.department"
              type="text"
              placeholder="e.g. Computer Science"
              class="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:bg-slate-900 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium text-slate-200">
              Level (optional)
            </label>
            <input
              v-model="form.level"
              type="text"
              placeholder="e.g. 200"
              class="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:bg-slate-900 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="mt-2 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-400 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span v-if="!loading">
            {{ mode === 'login' ? 'Sign in to Jabuspark' : 'Create free account' }}
          </span>
          <span v-else class="flex items-center gap-2">
            <span
              class="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            Processing...
          </span>
        </button>
      </form>

      <!-- Tiny footer text -->
      <p class="mt-4 text-[10px] leading-relaxed text-slate-500">
        By continuing, you agree to keep your JABU login details safe and use
        Jabuspark only for academic purposes.
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// If you already have an axios client, use that instead:
import api from '@/api/client'; // adjust path to your axios instance

const router = useRouter();
const route = useRoute();

const mode = ref('login'); // 'login' | 'signup'
const loading = ref(false);
const error = ref('');
const info = ref('');
const showPassword = ref(false);

const form = reactive({
  name: '',
  email: '',
  password: '',
  department: '',
  level: '',
});

function resetMessages() {
  error.value = '';
  info.value = '';
}

function switchMode(nextMode) {
  if (mode.value === nextMode) return;
  mode.value = nextMode;
  resetMessages();
}

async function handleSubmit() {
  resetMessages();
  loading.value = true;

  try {
    if (mode.value === 'login') {
      // === LOGIN FLOW ===
      const res = await api.post('/auth/login.php', {
        email: form.email,
        password: form.password,
      });

      const { token, user, message } = res.data || {};

      if (!token || !user) {
        throw new Error(message || 'Invalid response from server.');
      }

      // Save auth
      localStorage.setItem('jabuspark_token', token);
      localStorage.setItem('jabuspark_user', JSON.stringify(user));

      // Optional small info
      info.value = 'Signed in successfully. Redirecting…';

      // Redirect (from ?redirect=, or default to dashboard)
      const redirect = route.query.redirect || '/dashboard';
      router.push(redirect);
    } else {
      // === SIGNUP FLOW ===
      const res = await api.post('/auth/signup.php', {
        name: form.name,
        email: form.email,
        password: form.password,
        department: form.department || null,
        level: form.level || null,
      });

      const { message } = res.data || {};
      info.value =
        message || 'Account created. You can now sign in with your details.';

      // After sign up, auto-switch to login mode
      mode.value = 'login';
    }
  } catch (err) {
    console.error(err);
    error.value =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>
