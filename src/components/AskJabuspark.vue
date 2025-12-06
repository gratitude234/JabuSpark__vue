<template>
  <section class="card ask-card">
    <div class="card-header">
      <div class="card-header-main">
        <h2>Ask Jabuspark</h2>
        <p class="card-sub">
          Ask any question about this course. Jabuspark will explain it
          like a tutor.
        </p>
        <p v-if="course?.code" class="ask-meta">
          Focused on <strong>{{ course.code }}</strong>
          <span v-if="course?.title"> • {{ course.title }}</span>
        </p>
      </div>
      <div class="ask-header-right">
        <span class="pill pill--ai">AI assistant</span>
      </div>
    </div>

    <div class="examples">
      <p class="examples-label">Try asking:</p>
      <ul>
        <li>“Explain this topic in simple terms with an example.”</li>
        <li>“Give me a 7-day study plan for this course.”</li>
      </ul>
    </div>

    <form class="chat-form" @submit.prevent="handleAsk">
      <textarea
        v-model="question"
        rows="3"
        class="textarea"
        :placeholder="`Ask Jabuspark anything about ${
          course?.code || 'this course'
        }…`"
        :maxlength="400"
        :disabled="aiLoading"
        @keydown.enter.ctrl.prevent="handleAsk"
        @keydown.meta.enter.prevent="handleAsk"
      ></textarea>

      <div class="chat-form-footer">
        <p class="chat-hint">
          Tip: Mention the exact topic or week (e.g. “Week 3 – cardiac cycle”)
          to get a better answer.
        </p>
        <span class="char-counter">
          {{ questionLength }}/400
        </span>
      </div>

      <button
        type="submit"
        class="primary-btn primary-btn-full ask-submit-btn"
        :disabled="aiLoading || !questionLength"
        :aria-busy="aiLoading"
      >
        <span v-if="aiLoading" class="dot-bounce" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
        <span>{{ aiLoading ? "Thinking…" : "Send" }}</span>
      </button>
    </form>

    <p v-if="aiError" class="error-text">
      {{ aiError }}
    </p>

    <div v-if="aiAnswer" class="ai-answer">
      <div class="ai-answer-header">
        <p class="ai-answer-label">Jabuspark</p>
        <button
          type="button"
          class="ai-copy-btn"
          @click="copyAnswer"
        >
          Copy
        </button>
      </div>
      <p
        class="ai-answer-text"
        v-html="formattedAiAnswer"
      ></p>
    </div>

    <p class="muted">
      Powered by AI (Gemini). Always double-check important topics with
      your lecturer and official materials.
    </p>
  </section>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
  course: {
    type: Object,
    default: null,
  },
  // 🔹 New: allows QuickDrill / parent to prefill the question textarea
  initialQuestion: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["toast"]);

const question = ref("");

// Keep question in sync with initialQuestion from parent
watch(
  () => props.initialQuestion,
  (val) => {
    if (val && val.trim()) {
      question.value = val;
    }
  },
  { immediate: true }
);

// --- ASK JABUSPARK (GEMINI) STATE ---
const aiLoading = ref(false);
const aiError = ref("");
const aiAnswer = ref("");

// Escape HTML first so user content stays safe
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Very small markdown → HTML renderer
function renderMarkdown(raw) {
  if (!raw) return "";
  let text = String(raw);

  // 1. Escape any HTML
  text = escapeHtml(text);

  // 2. Headings: ###, ##, #
  text = text.replace(/^###\s+(.+)$/gm, "<strong>$1</strong><br />");
  text = text.replace(/^##\s+(.+)$/gm, "<strong>$1</strong><br />");
  text = text.replace(/^#\s+(.+)$/gm, "<strong>$1</strong><br />");

  // 3. Bold: **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // 4. Italic: *text* or _text_
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  text = text.replace(/_([^_]+)_/g, "<em>$1</em>");

  // 5. Inline code: `code`
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

  // 6. Bullet lists: - item / * item / + item  (keep them inline, just use •)
  text = text.replace(/^\s*[-*+]\s+(.+)$/gm, "• $1");

  // 7. Numbered lists: 1. item
  text = text.replace(/^\s*(\d+)\.\s+(.+)$/gm, "$1) $2");

  // 8. Line breaks
  text = text.replace(/\n/g, "<br />");

  return text;
}

const questionLength = computed(() => question.value.trim().length);

const formattedAiAnswer = computed(() => {
  return renderMarkdown(aiAnswer.value);
});

function showToast(message, type = "success") {
  emit("toast", { message, type });
}

function getAuthToken() {
  try {
    return localStorage.getItem("jabuspark_token") || "";
  } catch {
    return "";
  }
}

async function copyAnswer() {
  if (!aiAnswer.value) return;
  try {
    // Copy the original markdown text
    await navigator.clipboard.writeText(aiAnswer.value);
    showToast("Answer copied to clipboard.", "success");
  } catch {
    showToast("Could not copy answer.", "error");
  }
}

// --- ASK JABUSPARK (GEMINI) HANDLER ---
async function handleAsk() {
  aiError.value = "";
  aiAnswer.value = "";

  const q = question.value.trim();
  if (!q) {
    showToast("Type a question first.", "error");
    aiError.value = "Type a question first.";
    return;
  }

  aiLoading.value = true;
  try {
    const token = getAuthToken();

    const res = await fetch("https://jabumarket.com.ng/api/ai_chat.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        question: q,
        course_id: props.courseId,
        course_code: props.course?.code || null,
        course_title: props.course?.title || null,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        (data && (data.error || data.message)) ||
        "AI request failed. Please try again.";
      aiError.value = msg;
      showToast(msg, "error");
      return;
    }

    aiAnswer.value =
      (data && data.answer) ||
      "I couldn't generate an answer right now. Please try again.";
    showToast("Answer ready.", "success");
  } catch (err) {
    console.error(err);
    aiError.value = "Could not reach Jabuspark AI. Please try again.";
    showToast("Network error while calling AI.", "error");
  } finally {
    aiLoading.value = false;
  }
}
</script>

<style scoped>
.ask-card {
  position: relative;
}

/* header */
.card-header-main {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ask-meta {
  margin-top: 0.15rem;
  font-size: 0.78rem;
  color: #9ca3af;
}

.ask-meta strong {
  font-weight: 600;
  color: #4b5563;
}

.ask-header-right {
  display: flex;
  align-items: flex-start;
}

.pill--ai {
  background: #eef2ff;
  color: #4338ca;
  border-color: #e0e7ff;
}

/* examples */
.examples ul {
  margin-top: 0.25rem;
}

.examples li {
  position: relative;
  padding-left: 0.9rem;
  margin-bottom: 0.25rem;
}

.examples li::before {
  content: "•";
  position: absolute;
  left: 0;
  top: 0.12rem;
  font-size: 0.7rem;
  color: #9ca3af;
}

/* form */
.chat-form-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.chat-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  max-width: 70%;
}

.char-counter {
  font-size: 0.75rem;
  color: #6b7280;
}

.ask-submit-btn {
  margin-top: 0.4rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

/* loading dots */
.dot-bounce {
  display: inline-flex;
  gap: 0.2rem;
}

.dot-bounce span {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  animation: bounce 0.8s infinite alternate;
}

.dot-bounce span:nth-child(2) {
  animation-delay: 0.12s;
}
.dot-bounce span:nth-child(3) {
  animation-delay: 0.24s;
}

@keyframes bounce {
  from {
    transform: translateY(0);
    opacity: 0.6;
  }
  to {
    transform: translateY(-4px);
    opacity: 1;
  }
}

/* answer */
.ai-answer {
  margin-top: 0.75rem;
  animation: fade-in 0.18s ease-out;
}

.ai-answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.ai-copy-btn {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0.2rem 0.7rem;
  font-size: 0.7rem;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease;
}

.ai-copy-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

/* mobile */
@media (max-width: 640px) {
  .chat-form-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .chat-hint {
    max-width: 100%;
  }
}
</style>
