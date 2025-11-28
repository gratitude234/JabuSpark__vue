<template>
  <section
    class="border border-slate-200 rounded-xl bg-slate-50/80 px-4 py-4 flex flex-col gap-3"
  >
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-semibold text-brand-dark">
          Ask Jabuspark
        </h2>
        <p class="text-[11px] text-muted mt-0.5">
          Ask any question about this course. Jabuspark will explain it like a tutor.
        </p>
      </div>
      <span
        class="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-muted"
      >
        AI assistant
      </span>
    </div>

    <!-- Chat window -->
    <div
      class="rounded-lg border border-slate-200 bg-white px-3 py-2 max-h-72 overflow-y-auto space-y-3 text-xs"
    >
      <p v-if="messages.length === 0" class="text-[11px] text-muted">
        Try: “Explain strict liability in simple terms with an example.” or
        “Give me a 7-day study plan for this course.”
      </p>

      <div
        v-for="(m, index) in messages"
        :key="index"
        class="flex"
        :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[80%] px-3 py-2 rounded-2xl"
          :class="
            m.role === 'user'
              ? 'bg-brand text-surface rounded-br-sm'
              : 'bg-slate-100 text-slate-900 rounded-bl-sm'
          "
        >
          <p class="whitespace-pre-line">
            {{ m.content }}
          </p>
        </div>
      </div>

      <div v-if="loading" class="text-[11px] text-muted">
        Jabuspark is thinking…
      </div>
    </div>

    <!-- Input -->
    <form @submit.prevent="sendMessage" class="flex items-center gap-2">
      <input
        v-model="input"
        type="text"
        placeholder="Ask Jabuspark anything about this course…"
        class="flex-1 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
      />
      <button
        type="submit"
        :disabled="!input.trim() || loading"
        class="inline-flex items-center rounded-full bg-brand text-surface text-xs font-semibold px-3 py-2 shadow-md hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        Send
      </button>
    </form>

    <p v-if="error" class="text-[11px] text-danger">
      {{ error }}
    </p>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { askJabuspark } from "../services/ai";

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
});

const messages = ref([]);
const input = ref("");
const loading = ref(false);
const error = ref("");

async function sendMessage() {
  const text = input.value.trim();
  if (!text || loading.value) return;

  messages.value.push({ role: "user", content: text });
  input.value = "";
  error.value = "";
  loading.value = true;

  try {
    const data = await askJabuspark(props.courseId, text);
    const reply =
      data?.reply || "Sorry, I couldn't generate an answer. Please try again.";

    messages.value.push({ role: "assistant", content: reply });
  } catch (e) {
    console.error(e);
    error.value =
      e.response?.data?.message ||
      "Something went wrong talking to Jabuspark. Try again.";
  } finally {
    loading.value = false;
  }
}
</script>
