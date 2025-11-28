// src/services/adminCourses.js
import api from './api';

export function fetchDepartments() {
  return api.get('/departments/list.php')
    .then(res => res.data.departments);
}

export function adminCreateCourse(payload) {
  // payload: { department_id, code, title, level }
  return api.post('/courses/admin_create.php', payload)
    .then(res => res.data);
}

export function adminListCourses(filters = {}) {
  // filters: { department_id?, level? }
  const params = {};

  if (filters.department_id) params.department_id = filters.department_id;
  if (filters.level) params.level = filters.level;

  return api.get('/courses/admin_list.php', { params })
    .then(res => res.data.courses);
}
