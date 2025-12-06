<template>
  <section class="card card--materials materials-card">
    <div class="card-header materials-header">
      <div class="card-header-main">
        <h2 class="materials-title-main">Course materials</h2>
        <p class="card-sub">
          Notes, slides and past questions uploaded for this course.
        </p>
        <p v-if="lastUpdated" class="card-sub-secondary">
          Last updated <strong>{{ lastUpdated }}</strong>
        </p>
      </div>

      <div class="card-header-right materials-header-right">
        <div class="materials-header-stats">
          <span class="badge materials-count-badge">
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
        </div>

        <!-- Upload button for admin / lecturer / course_rep -->
        <button
          v-if="canUpload"
          type="button"
          class="pill-btn pill-btn--solid materials-upload-btn"
          @click="openUpload"
        >
          + Upload
        </button>
      </div>
    </div>

    <!-- Inline upload panel -->
    <div v-if="showUpload" class="upload-panel">
      <div class="upload-panel-header">
        <div class="upload-icon">⬆️</div>
        <div>
          <p class="upload-title">Upload a new material</p>
          <p class="upload-sub">
            PDFs, slides, docs or images. Keep file names clear and descriptive.
          </p>
        </div>
      </div>

      <div class="upload-grid">
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
            accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"
          />
          <p v-if="uploadFile" class="upload-file-name">
            Selected: <span>{{ uploadFile.name }}</span>
          </p>
          <p class="upload-hint">
            Max size depends on your network. If upload fails, try a smaller file.
          </p>
        </div>
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
          class="primary-btn upload-primary-btn"
          @click="handleUpload"
          :disabled="uploading"
        >
          {{ uploading ? "Uploading..." : "Upload material" }}
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
      <div class="materials-empty-icon-wrapper">
        <div class="materials-empty-icon">📂</div>
      </div>
      <div class="materials-empty-text">
        <p class="materials-empty-title">
          No materials have been uploaded yet.
        </p>
        <p class="materials-empty-body">
          Once your course rep or lecturer uploads notes, past questions or
          slides, they'll appear here automatically.
        </p>
        <span v-if="!canUpload" class="hint materials-empty-hint">
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
            <div class="materials-title-block">
              <span class="materials-title-text" :title="m.title">
                {{ m.title }}
              </span>
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
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* header tweaks */
.materials-header {
  align-items: flex-start;
}

.card-header-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.materials-title-main {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
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

.materials-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

.materials-header-stats {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.materials-count-badge {
  font-weight: 500;
}

.materials-stats-pill {
  font-size: 0.7rem;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  border: 1px dashed #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
}

.materials-upload-btn {
  font-size: 0.8rem;
  padding-inline: 0.8rem;
}

/* upload */
.upload-panel {
  margin-top: 0.35rem;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background: radial-gradient(circle at top left, #eff6ff 0, #f9fafb 45%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.upload-panel-header {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.upload-icon {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  font-size: 1.1rem;
}

.upload-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.upload-sub {
  font-size: 0.78rem;
  color: #6b7280;
}

.upload-grid {
  display: grid;
  gap: 0.65rem;
}

.upload-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.upload-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: #4b5563;
}

.upload-input {
  border-radius: 0.55rem;
  border: 1px solid #e5e7eb;
  padding: 0.45rem 0.6rem;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
  background-color: #f9fafb;
}

.upload-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.15);
  background-color: #ffffff;
}

.upload-input--file {
  cursor: pointer;
  padding-block: 0.35rem;
}

.upload-file-name {
  font-size: 0.78rem;
  color: #4b5563;
}

.upload-file-name span {
  font-weight: 500;
}

.upload-hint {
  font-size: 0.7rem;
  color: #9ca3af;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.materials-cancel-btn {
  min-width: 80px;
}

.upload-primary-btn {
  min-width: 130px;
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
  gap: 0.9rem;
  align-items: flex-start;
  padding: 0.7rem 0.2rem 0.1rem;
}

.materials-empty-icon-wrapper {
  padding-top: 0.2rem;
}

.materials-empty-icon {
  font-size: 1.7rem;
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

.materials-empty-hint {
  font-size: 0.78rem;
  color: #9ca3af;
}

.materials-empty-cta {
  margin-top: 0.35rem;
}

/* list */
.materials-list {
  margin-top: 0.35rem;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #f3f4f6;
}

.materials-item {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.12s ease, transform 0.12s ease, box-shadow 0.12s ease;
}

.materials-item:hover {
  background-color: #f9fafb;
  transform: translateY(-1px);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.materials-info {
  display: flex;
  flex: 1;
  min-width: 0;
}

.materials-title {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
}

.file-pill {
  width: 2rem;
  height: 2rem;
  border-radius: 0.9rem;
  background: #eef2ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.materials-title-block {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.materials-title-text {
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
  font-weight: 500;
  color: #111827;
}

.materials-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
  font-size: 0.78rem;
  color: #6b7280;
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

.dot {
  position: relative;
  padding-left: 0.6rem;
}

.dot::before {
  content: "•";
  position: absolute;
  left: 0.15rem;
  color: #d1d5db;
}

/* actions */
.materials-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
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
  .materials-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .materials-header-right {
    align-items: flex-start;
  }

  .materials-title-text {
    max-width: 100%;
  }

  .materials-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .materials-actions {
    flex-direction: row;
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (min-width: 640px) {
  .materials-actions {
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 0.35rem;
  }
}
</style>
