// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";

import DashboardView from "../views/DashboardView.vue";
import CoursesView from "../views/CoursesView.vue";
import CourseDetailView from "../views/CourseDetailView.vue";
import PracticeView from "../views/PracticeView.vue";
import ProfileView from "../views/ProfileView.vue";

import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";

import AdminCoursesView from "../views/AdminCoursesView.vue";
import AdminCourseQuestionsView from "../views/AdminCourseQuestionsView.vue";

function getUserRole() {
  const stored = localStorage.getItem("jabuspark_user");
  if (!stored) return "student";
  try {
    const u = JSON.parse(stored);
    return String(u?.role || "student").toLowerCase();
  } catch {
    return "student";
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },

    // Student core
    { path: "/dashboard", name: "dashboard", component: DashboardView, meta: { requiresAuth: true } },
    { path: "/courses", name: "courses", component: CoursesView, meta: { requiresAuth: true } },
    { path: "/courses/:id", name: "course-detail", component: CourseDetailView, meta: { requiresAuth: true } },

    // Step 4 routes
    { path: "/practice", name: "practice", component: PracticeView, meta: { requiresAuth: true } },
    { path: "/profile", name: "profile", component: ProfileView, meta: { requiresAuth: true } },

    // Auth
    { path: "/login", name: "login", component: LoginView, meta: { guestOnly: true } },
    { path: "/register", name: "register", component: RegisterView, meta: { guestOnly: true } },

    // Admin (role-gated)
    {
      path: "/admin/courses",
      name: "admin-courses",
      component: AdminCoursesView,
      meta: { requiresAuth: true, requiresRole: "admin" },
    },
    {
      path: "/admin/courses/:id/questions",
      name: "admin-course-questions",
      component: AdminCourseQuestionsView,
      meta: { requiresAuth: true, requiresRole: "admin" },
    },

    { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
  ],
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("jabuspark_token");

  if (to.meta.requiresAuth && !token) {
    return next({ name: "login", query: { redirect: to.fullPath } });
  }

  if (to.meta.guestOnly && token) {
    return next({ name: "dashboard" });
  }

  if (to.meta.requiresRole) {
    const role = getUserRole();
    if (role !== String(to.meta.requiresRole).toLowerCase()) {
      return next({ name: "dashboard" });
    }
  }

  next();
});

export default router;
