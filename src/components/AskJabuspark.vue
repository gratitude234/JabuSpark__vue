<!-- src/components/AskJabuspark.vue -->
<template>
  <section class="card ask-card">
    <!-- HEADER -->
    <div class="card-header ask-header">
      <div class="card-header-main">
        <h2 class="ask-title">Ask Jabuspark</h2>
        <p class="card-sub ask-sub">
          Ask any question about this course and Jabuspark will explain it
          like a tutor sitting beside you.
        </p>

        <p v-if="course?.code" class="ask-meta">
          Focused on
          <strong>{{ course.code }}</strong>
          <span v-if="course?.title"> • {{ course.title }}</span>
        </p>
      </div>

      <div class="ask-header-right">
        <span class="pill pill--ai">
          <span class="pill-dot"></span>
          AI assistant
        </span>
      </div>
    </div>

    <!-- EXAMPLES / SUGGESTIONS -->
    <div class="examples">
      <p class="examples-label">Not sure what to ask?</p>
      <ul>
        <li>“Explain this topic in simple terms with an example.”</li>
        <li>“Give me a 7-day study plan for this course.”</li>
      </ul>

      <div class="suggestion-chips">
        <button
          v-for="(s, index) in quickSuggestions"
          :key="index"
          type="button"
          class="suggestion-chip"
          @click="useSuggestion(s)"
        >
          {{ s }}
        </button>
      </div>
    </div>

    <!-- CHAT FORM -->
    <form class="chat-form" @submit.prevent="handleAsk">
      <div class="textarea-shell" :class="{ 'textarea-shell--loading': aiLoading }">
        <textarea
          ref="textareaRef"
          v-model="question"
          rows="3"
          class="textarea ask-textarea"
          :placeholder="`Ask Jabuspark anything about ${
            course?.code || 'this course'
          }…`"
          :maxlength="400"
          :disabled="aiLoading"
          @keydown.enter.ctrl.prevent="handleAsk"
          @keydown.meta.enter.prevent="handleAsk"
        ></textarea>

        <div v-if="aiLoading" class="textarea-overlay">
          <span class="dot-bounce" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          <span class="textarea-overlay-text">Jabuspark is thinking…</span>
        </div>
      </div>

      <div class="chat-form-footer">
        <p class="chat-hint">
          Tip: Mention the exact topic or week (e.g. “Week 3 – cardiac cycle”)
          and what you’re struggling with to get a sharper answer.
          <span class="chat-hint-shortcut">Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to send</span>
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

    <!-- ERROR -->
    <p v-if="aiError" class="error-text ask-error">
      {{ aiError }}
    </p>

    <!-- ANSWER -->
    <div v-if="aiAnswer" class="ai-answer">
      <div class="ai-answer-header">
        <div class="ai-answer-header-left">
          <p class="ai-answer-label">Jabuspark</p>
          <span v-if="aiCached" class="ai-answer-badge">
            From Jabuspark memory
          </span>
        </div>

        <div class="ai-answer-header-right">
          <button
            type="button"
            class="ai-copy-btn"
            @click="copyAnswer"
          >
            Copy answer
          </button>

          <button
            v-if="canJumpBackToDrill"
            type="button"
            class="ai-back-btn"
            @click="$emit('back-to-drill')"
          >
            ← Back to drill question
          </button>
        </div>
      </div>

      <p
        class="ai-answer-text"
        v-html="formattedAiAnswer"
      ></p>

      <p v-if="aiCached" class="ai-answer-footnote">
        This explanation was reused from a previous student question for this course
        to save time and API usage.
      </p>
    </div>

    <!-- FOOTNOTE -->
    <p class="muted ask-footnote">
      Powered by AI (Gemini). Always double-check important topics with
      your lecturer and official materials.
    </p>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
  course: {
    type: Object,
    default: null,
  },
  // Prefill from parent (e.g. QuickDrill)
  initialQuestion: {
    type: String,
    default: "",
  },
  // 🔹 When this changes, auto-send the current initialQuestion
  autoAskToken: {
    type: Number,
    default: 0,
  },
  // 🔹 If true, show "Back to drill question" button
  canJumpBackToDrill: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["toast", "back-to-drill"]);

const question = ref("");
const aiLoading = ref(false);
const aiError = ref("");
const aiAnswer = ref("");
const aiCached = ref(false); // came from cache?
const textareaRef = ref(null);

const quickSuggestions = [
  "Summarise this topic in bullet points.",
  "Give me a 7-day study plan for this course.",
  "Explain this topic like I’m in secondary school.",
  "Give me 5 exam-style questions with answers."
];

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

// 🔹 Auto-send when autoAskToken changes
watch(
  () => props.autoAskToken,
  async (newVal, oldVal) => {
    if (!newVal || newVal === oldVal) return;
    const q = (props.initialQuestion || "").trim();
    if (!q) return;

    question.value = q;
    await handleAsk();
  }
);

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

  // 6. Bullet lists: - item / * item / + item
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
    await navigator.clipboard.writeText(aiAnswer.value);
    showToast("Answer copied to clipboard.", "success");
  } catch {
    showToast("Could not copy answer.", "error");
  }
}

function useSuggestion(text) {
  question.value = text;
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus();
    }
  });
}

// --- ASK JABUSPARK (GEMINI) HANDLER ---
async function handleAsk() {
  aiError.value = "";
  aiAnswer.value = "";
  aiCached.value = false;

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

    aiCached.value = !!(data && data.cached);

    if (aiCached.value) {
      showToast("Loaded from Jabuspark memory.", "success");
    } else {
      showToast("Answer ready.", "success");
    }
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
  overflow: hidden;
}

/* subtle glow at top */
.ask-card::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.25;
  background: radial-gradient(
    circle at top right,
    rgba(59, 130, 246, 0.25),
    transparent 55%
  );
  pointer-events: none;
}

/* keep inner content on top of glow */
.ask-card > * {
  position: relative;
}

/* header */
.ask-header {
  align-items: flex-start;
}

.card-header-main {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ask-title {
  font-size: 1.05rem;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.ask-sub {
  font-size: 0.8rem;
  color: #6b7280;
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

/* AI pill */
.pill--ai {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: linear-gradient(135deg, #eef2ff, #ecfeff);
  color: #4338ca;
  border-color: #e0e7ff;
  padding-inline: 0.7rem;
  box-shadow: 0 10px 30px rgba(79, 70, 229, 0.18);
}

.pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25);
}

/* examples */
.examples {
  margin-top: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 0.75rem;
  background: #f9fafb;
  border: 1px dashed #e5e7eb;
}

.examples-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
}

.examples ul {
  margin-top: 0.25rem;
}

.examples li {
  position: relative;
  padding-left: 0.9rem;
  margin-bottom: 0.25rem;
  font-size: 0.78rem;
  color: #4b5563;
}

.examples li::before {
  content: "•";
  position: absolute;
  left: 0;
  top: 0.12rem;
  font-size: 0.7rem;
  color: #9ca3af;
}

/* suggestion chips */
.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.4rem;
}

.suggestion-chip {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0.2rem 0.7rem;
  font-size: 0.7rem;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  white-space: nowrap;
  max-width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease;
}

.suggestion-chip:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.16);
  transform: translateY(-1px);
}

/* form */
.chat-form {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
}

.textarea-shell {
  position: relative;
}

.textarea-shell--loading .ask-textarea {
  opacity: 0.7;
}

.ask-textarea {
  resize: vertical;
  min-height: 110px;
}

/* overlay when loading */
.textarea-overlay {
  position: absolute;
  inset: 0.45rem 0.5rem;
  border-radius: 0.7rem;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.03),
    rgba(37, 99, 235, 0.03)
  );
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding-inline: 0.75rem;
  pointer-events: none;
}

.textarea-overlay-text {
  font-size: 0.75rem;
  color: #6b7280;
}

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

.chat-hint-shortcut {
  display: inline-block;
  margin-left: 0.35rem;
  font-size: 0.7rem;
  color: #6b7280;
}

.chat-hint-shortcut kbd {
  display: inline-block;
  padding: 0.05rem 0.25rem;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  font-size: 0.68rem;
  background: #f9fafb;
}

.char-counter {
  font-size: 0.75rem;
  color: #6b7280;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ask-submit-btn {
  margin-top: 0.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  margin-top: 0.85rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.9rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #2563eb;
  animation: fade-in-up 0.2s ease-out;
}

.ai-answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
  gap: 0.5rem;
}

.ai-answer-header-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.ai-answer-header-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.ai-answer-label {
  font-weight: 600;
  font-size: 0.82rem;
  color: #4b5563;
}

/* badge for cached answers */
.ai-answer-badge {
  font-size: 0.7rem;
  padding: 0.16rem 0.55rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #ecfdf3, #e0f2fe);
  border: 1px solid #bbf7d0;
  color: #166534;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.ai-answer-badge::before {
  content: "⏱";
  font-size: 0.75rem;
}

.ai-answer-text {
  font-size: 0.8rem;
  color: #374151;
  line-height: 1.5;
}

.ai-answer-footnote {
  margin-top: 0.35rem;
  font-size: 0.72rem;
  color: #6b7280;
}

/* buttons in answer header */
.ai-copy-btn,
.ai-back-btn {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0.2rem 0.75rem;
  font-size: 0.7rem;
  background: #ffffff;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease;
}

.ai-copy-btn {
  color: #4b5563;
}

.ai-back-btn {
  color: #2563eb;
  background: #f9fafb;
}

.ai-copy-btn:hover,
.ai-back-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

/* error */
.ask-error {
  margin-top: 0.45rem;
}

/* footer note */
.ask-footnote {
  margin-top: 0.6rem;
  font-size: 0.72rem;
}

/* animations */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

  .ai-answer-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .ai-answer-header-right {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .suggestion-chip {
    max-width: 100%;
  }
}
</style>
