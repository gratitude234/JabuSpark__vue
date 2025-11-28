<template>
  <div class="page">
    <!-- Heading -->
    <div class="page-header">
      <h1 class="page-title">Department courses</h1>
      <p class="page-sub">
        As an admin you can define which courses belong to each department and level.
        Students will see these automatically on their “My Courses” page.
      </p>
    </div>

    <div class="admin-card">
      <!-- Filters row -->
      <section class="filters-row">
        <div class="field">
          <label>Department</label>
          <select v-model="selectedDeptId" @change="loadCourses" class="field-input">
            <option value="">Select department</option>
            <option
              v-for="dept in departments"
              :key="dept.id"
              :value="dept.id"
            >
              {{ dept.name }}
            </option>
          </select>
        </div>

        <div class="field">
          <label>Level (optional)</label>
          <select v-model.number="selectedLevel" @change="loadCourses" class="field-input">
            <option :value="0">All levels</option>
            <option v-for="lvl in levelOptions" :key="lvl" :value="lvl">
              {{ lvl }} level
            </option>
          </select>
        </div>
      </section>

      <!-- Error -->
      <p v-if="error" class="error-text">{{ error }}</p>

      <!-- Add course form -->
      <section class="add-card" :class="{ 'add-card--disabled': !selectedDeptId }">
        <div class="add-card-header">
          <h2>Add course</h2>
          <p class="hint">
            First pick a department (and level). Then add courses for that cohort.
          </p>
        </div>

        <form class="add-form" @submit.prevent="handleCreate">
          <div class="field">
            <label>Course title</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="e.g. Contract Law I"
              class="field-input"
              :disabled="!selectedDeptId || saving"
              required
            />
          </div>

          <div class="field-row">
            <div class="field">
              <label>Code</label>
              <input
                v-model="form.code"
                type="text"
                placeholder="e.g. LAW 201"
                class="field-input"
                :disabled="!selectedDeptId || saving"
                required
              />
            </div>
            <div class="field">
              <label>Level</label>
              <select
                v-model.number="form.level"
                class="field-input"
                :disabled="!selectedDeptId || saving"
              >
                <option :value="0">Use filter level ({{ selectedLevelLabel }})</option>
                <option v-for="lvl in levelOptions" :key="lvl" :value="lvl">
                  {{ lvl }} level
                </option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            class="primary-btn"
            :disabled="!selectedDeptId || saving"
          >
            {{ saving ? "Saving..." : "Add course" }}
          </button>
        </form>
      </section>

      <!-- Courses list -->
      <section class="list-card">
        <div class="list-header">
          <h2>Courses in this department</h2>
          <span v-if="courses.length" class="badge">
            {{ courses.length }} course{{ courses.length === 1 ? "" : "s" }}
          </span>
        </div>

        <div v-if="!selectedDeptId" class="empty-text">
          Select a department to see its courses.
        </div>

        <div v-else-if="loading" class="empty-text">
          Loading courses…
        </div>

        <div v-else-if="!courses.length" class="empty-text">
          No courses defined yet for this combination.
          Use the form above to add the first one.
        </div>

        <ul v-else class="course-list">
          <li v-for="course in courses" :key="course.id" class="course-row">
            <div class="course-main">
              <div class="course-title">{{ course.title }}</div>
              <div class="course-meta">
                <span v-if="course.code">{{ course.code }}</span>
                <span v-if="course.level" class="dot">
                  {{ course.level }} level
                </span>
                <span v-if="course.department_name" class="dot">
                  {{ course.department_name }}
                </span>
              </div>
            </div>
            <!-- In future we can add a delete/edit button here -->
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { fetchDepartments } from "../services/auth";
import { adminListCourses, adminCreateCourse } from "../services/admin";

const departments = ref([]);
const selectedDeptId = ref("");
const selectedLevel = ref(0);

const loading = ref(false);
const saving = ref(false);
const error = ref("");

const courses = ref([]);

const form = ref({
  title: "",
  code: "",
  level: 0,
});

// You can adjust these level options to match JABU
const levelOptions = [100, 200, 300, 400, 500, 600];

const selectedLevelLabel = computed(() => {
  return selectedLevel.value ? `${selectedLevel.value} level` : "all levels";
});

// ---------- data loading ----------
async function loadDepartments() {
  error.value = "";
  try {
    departments.value = await fetchDepartments();
  } catch (e) {
    console.error(e);
    error.value = "Failed to load departments.";
  }
}

async function loadCourses() {
  if (!selectedDeptId.value) {
    courses.value = [];
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const data = await adminListCourses({
      department_id: selectedDeptId.value,
      level: selectedLevel.value || undefined,
    });
    courses.value = data;
  } catch (e) {
    console.error(e);
    error.value =
      e.response?.data?.message || "Failed to load courses for this department.";
  } finally {
    loading.value = false;
  }
}

// ---------- create course ----------
async function handleCreate() {
  if (!selectedDeptId.value) return;

  saving.value = true;
  error.value = "";

  try {
    const payload = {
      department_id: Number(selectedDeptId.value),
      title: form.value.title.trim(),
      code: form.value.code.trim(),
      level:
        form.value.level && form.value.level !== 0
          ? form.value.level
          : selectedLevel.value || null,
    };

    const newCourse = await adminCreateCourse(payload);

    // Put new course at the top of the list
    courses.value.unshift(newCourse);

    // Reset just title/code (keep level)
    form.value.title = "";
    form.value.code = "";
  } catch (e) {
    console.error(e);
    error.value = e.response?.data?.message || "Could not create course.";
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadDepartments();
});
</script>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 3rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #111827;
}

.page-sub {
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.admin-card {
  background: #ffffff;
  border-radius: 1.25rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.field {
  flex: 1 1 180px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.field label {
  font-weight: 600;
  color: #374151;
}

.field-input {
  border-radius: 999px;
  border: 1px solid #d1d5db;
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
  outline: none;
}

.field-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.15);
}

.field-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.add-card {
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 1rem 1.25rem;
}

.add-card--disabled {
  opacity: 0.6;
}

.add-card-header h2 {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.hint {
  font-size: 0.8rem;
  color: #6b7280;
}

.add-form {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.primary-btn {
  align-self: flex-start;
  border-radius: 999px;
  border: none;
  padding: 0.55rem 1.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffffff;
  background: #4f46e5;
  cursor: pointer;
  transition: background 0.15s ease;
}

.primary-btn:hover {
  background: #4338ca;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.list-card {
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  padding: 1rem 1.25rem;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.list-header h2 {
  font-size: 0.95rem;
  font-weight: 600;
}

.badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
}

.empty-text {
  font-size: 0.85rem;
  color: #6b7280;
}

.course-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
}

.course-row {
  padding: 0.55rem 0;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-row:first-of-type {
  border-top: none;
}

.course-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.course-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.course-meta {
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.dot::before {
  content: "• ";
  color: #d1d5db;
}

.error-text {
  font-size: 0.8rem;
  color: #dc2626;
}
</style>
