<template>
  <section class="card card--materials materials-card">
    <div class="card-header">
      <div class="card-header-main">
        <h2>Course materials</h2>
        <p class="card-sub">
          Notes, slides and past questions uploaded for this course.
        </p>
        <p v-if="lastUpdated" class="card-sub-secondary">
          Last updated <strong>{{ lastUpdated }}</strong>
        </p>
      </div>

      <div class="card-header-right">
        <span class="badge">
          {{ materials.length }} file{{ materials.length === 1 ? "" : "s" }}
        </span>

        <span
          v-if="!loadingMaterials && materials.length"
          class="materials-stats-pill"
        >
          <span v-if="pdfCount">
            {{ pdfCount }} PDF{{ pdfCount === 1 ? "" : "s" }}
          </span>
          <span v-if="slideCount">
            <span v-if="pdfCount"> • </span>{{ slideCount }} slide{{ slideCount === 1 ? "" : "s" }}
          </span>
        </span>

        <!-- Upload button for admin / lecturer / course_rep -->
        <button
          v-if="canUpload"
          type="button"
          class="pill-btn pill-btn--solid"
          @click="openUpload"
        >
          + Upload
        </button>
      </div>
    </div>

    <!-- Inline upload panel -->
    <div v-if="showUpload" class="upload-panel">
      <div class="upload-row">
        <label class="upload-label">Title (optional)</label>
        <input
          v-model="uploadTitle"
          type="text"
          class="upload-input"
          placeholder="e.g. Week 3 – Amino Acids summary"
        />
      </div>

      <div class="upload-row">
        <label class="upload-label">File</label>
        <input
          type="file"
          @change="onFileChange"
          class="upload-input upload-input--file"
        />
      </div>

      <div class="upload-actions">
        <button
          type="button"
          class="pill-btn materials-cancel-btn"
          @click="closeUpload"
          :disabled="uploading"
        >
          Cancel
        </button>
        <button
          type="button"
          class="primary-btn"
          @click="handleUpload"
          :disabled="uploading"
        >
          {{ uploading ? "Uploading..." : "Upload" }}
        </button>
      </div>

      <p v-if="uploadError" class="error-text">{{ uploadError }}</p>
      <p v-if="uploadSuccess" class="success-text">{{ uploadSuccess }}</p>
    </div>

    <!-- Loading / empty states -->
    <div v-if="loadingMaterials" class="materials-skeleton" aria-live="polite">
      <div v-for="n in 3" :key="n" class="materials-skeleton-row">
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line skeleton-line--meta"></div>
      </div>
    </div>

    <div v-else-if="!materials.length" class="empty-text materials-empty">
      <div class="materials-empty-icon">📂</div>
      <div class="materials-empty-text">
        <p class="materials-empty-title">
          No materials have been uploaded yet.
        </p>
        <p class="materials-empty-body">
          When your course rep or lecturer uploads notes, past questions or
          slides, they'll appear here.
        </p>
        <span v-if="!canUpload" class="hint">
          Only admins, course reps and lecturers can upload materials.
        </span>
        <button
          v-else
          type="button"
          class="pill-btn pill-btn--solid materials-empty-cta"
          @click="openUpload"
        >
          + Upload the first material
        </button>
      </div>
    </div>

    <!-- Materials list -->
    <ul v-else class="materials-list">
      <li
        v-for="m in materials"
        :key="m.id"
        class="materials-item"
      >
        <div class="materials-info">
          <div class="materials-title">
            <span class="file-pill">{{ fileIcon(m.file_url) }}</span>
            <span class="materials-title-text" :title="m.title">
              {{ m.title }}
            </span>
          </div>
          <div class="materials-meta">
            <span v-if="props.course?.code" class="materials-meta-chip">
              {{ props.course.code }}
            </span>
            <span class="dot">
              {{ formatDate(m.created_at) }}
            </span>
            <span class="dot">
              <span class="materials-type-chip">
                {{ fileTypeLabel(m.file_url) }}
              </span>
            </span>
          </div>
        </div>

        <!-- Actions: Open + Drill -->
        <div class="materials-actions">
          <a
            class="pill-btn materials-open-btn"
            :href="fileUrl(m.file_url)"
            target="_blank"
            rel="noopener noreferrer"
            :title="`Open ${m.title}`"
          >
            <span>Open</span>
            <span class="materials-open-icon">↗</span>
          </a>

          <button
            type="button"
            class="pill-btn materials-drill-btn"
            @click="startDrillForMaterial(m)"
          >
            Drill this material
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { getMaterials, uploadMaterial } from "../services/materials";

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
  course: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["toast", "start-drill"]);

const materials = ref([]);
const loadingMaterials = ref(false);

// CURRENT USER + UPLOAD STATE
const currentUser = ref(null);
const canUpload = computed(
  () =>
    currentUser.value &&
    ["admin", "lecturer", "course_rep"].includes(currentUser.value.role)
);

const showUpload = ref(false);
const uploadTitle = ref("");
const uploadFile = ref(null);
const uploading = ref(false);
const uploadError = ref("");
const uploadSuccess = ref("");

// --- Derived UI state ---
const lastUpdated = computed(() => {
  if (!materials.value.length) return null;
  const withDates = materials.value.filter((m) => m.created_at);
  if (!withDates.length) return null;

  const latest = [...withDates].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )[0];

  return latest ? formatDate(latest.created_at) : null;
});

const pdfCount = computed(
  () =>
    materials.value.filter(
      (m) => getExtension(m.file_url) === "pdf"
    ).length
);

const slideCount = computed(
  () =>
    materials.value.filter((m) =>
      ["ppt", "pptx"].includes(getExtension(m.file_url))
    ).length
);

function showToast(message, type = "success") {
  emit("toast", { message, type });
}

// helpers
function fileUrl(relativePath) {
  // TODO: if you move to env vars, import from a config
  return `https://jabumarket.com.ng/api/${relativePath}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getExtension(path) {
  if (!path) return "";
  const parts = path.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function fileTypeLabel(path) {
  const ext = getExtension(path);
  if (!ext) return "File";
  if (["pdf"].includes(ext)) return "PDF";
  if (["ppt", "pptx"].includes(ext)) return "Slides";
  if (["doc", "docx"].includes(ext)) return "Document";
  if (["jpg", "jpeg", "png"].includes(ext)) return "Image";
  return ext.toUpperCase();
}

function fileIcon(path) {
  const ext = getExtension(path);
  if (["pdf"].includes(ext)) return "📄";
  if (["ppt", "pptx"].includes(ext)) return "📊";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["jpg", "jpeg", "png"].includes(ext)) return "🖼️";
  return "📁";
}

function initUser() {
  try {
    const raw = localStorage.getItem("jabuspark_user");
    if (raw) currentUser.value = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
  }
}

async function loadMaterials() {
  try {
    loadingMaterials.value = true;
    materials.value = await getMaterials(props.courseId);
  } catch (e) {
    console.error("Failed to load materials", e);
    showToast("Could not load materials. Please try again.", "error");
  } finally {
    loadingMaterials.value = false;
  }
}

// --- DRILL HANDLER ---
function startDrillForMaterial(material) {
  emit("start-drill", material);
}

// --- UPLOAD HANDLERS ---
function onFileChange(event) {
  const files = event.target.files;
  uploadFile.value = files && files[0] ? files[0] : null;
}

function openUpload() {
  showUpload.value = true;
  uploadError.value = "";
  uploadSuccess.value = "";
}

function closeUpload() {
  showUpload.value = false;
  uploadTitle.value = "";
  uploadFile.value = null;
  uploadError.value = "";
  uploadSuccess.value = "";
}

async function handleUpload() {
  uploadError.value = "";
  uploadSuccess.value = "";

  if (!uploadFile.value) {
    uploadError.value = "Please choose a file.";
    return;
  }

  const title = uploadTitle.value.trim() || uploadFile.value.name;

  try {
    uploading.value = true;
    await uploadMaterial({
      courseId: props.courseId,
      file: uploadFile.value,
      title,
    });

    uploadSuccess.value = "Material uploaded successfully.";
    showToast("Material uploaded successfully.", "success");
    await loadMaterials(); // refresh list
    uploadTitle.value = "";
    uploadFile.value = null;
  } catch (e) {
    console.error("Upload failed", e);
    uploadError.value = "Upload failed. Please try again.";
    showToast("Upload failed. Please try again.", "error");
  } finally {
    uploading.value = false;
  }
}

onMounted(() => {
  initUser();
  loadMaterials();
});

watch(
  () => props.courseId,
  () => {
    loadMaterials();
  }
);
</script>

<style scoped>
.materials-card {
  position: relative;
}

/* header tweaks */
.card-header-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.card-sub-secondary {
  margin-top: 0.15rem;
  font-size: 0.78rem;
  color: #9ca3af;
}

.card-sub-secondary strong {
  font-weight: 600;
  color: #4b5563;
}

.materials-stats-pill {
  font-size: 0.7rem;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  border: 1px dashed #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
}

/* upload */
.upload-input--file {
  cursor: pointer;
}

.materials-cancel-btn {
  min-width: 80px;
}

/* skeleton loader */
.materials-skeleton {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.materials-skeleton-row {
  padding: 0.5rem 0;
  border-top: 1px solid #f3f4f6;
}

.materials-skeleton-row:first-of-type {
  border-top: none;
}

.skeleton-line {
  border-radius: 999px;
  background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6);
  background-size: 200% 100%;
  animation: materials-shimmer 1.2s ease-in-out infinite;
}

.skeleton-line--title {
  height: 0.8rem;
  width: 70%;
  margin-bottom: 0.35rem;
}

.skeleton-line--meta {
  height: 0.6rem;
  width: 40%;
}

@keyframes materials-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* empty state */
.materials-empty {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.materials-empty-icon {
  font-size: 1.4rem;
  line-height: 1;
}

.materials-empty-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.materials-empty-title {
  font-weight: 600;
  color: #111827;
}

.materials-empty-body {
  font-size: 0.85rem;
  color: #6b7280;
}

.materials-empty-cta {
  margin-top: 0.35rem;
}

/* list */
.materials-title-text {
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.materials-meta-chip {
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.7rem;
}

.materials-type-chip {
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.7rem;
}

/* actions */
.materials-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.materials-open-btn {
  gap: 0.25rem;
  font-weight: 500;
}

.materials-open-icon {
  font-size: 0.85rem;
}

.materials-drill-btn {
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px dashed #e5e7eb;
  background: #f9fafb;
}

/* mobile tweaks */
@media (max-width: 640px) {
  .materials-title-text {
    max-width: 100%;
  }
}

@media (min-width: 640px) {
  .materials-actions {
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
  }
}
</style>
