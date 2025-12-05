// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";

import DashboardView from "../views/DashboardView.vue";
import CoursesView from "../views/CoursesView.vue";
import CourseDetailView from "../views/CourseDetailView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import AdminCoursesView from "../views/AdminCoursesView.vue";
import AdminCourseQuestionsView from "../views/AdminCourseQuestionsView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Default – entry goes through guard
    { path: "/", redirect: "/dashboard" },

    // Student views (auth-only)
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/courses",
      name: "courses",
      component: CoursesView,
      meta: { requiresAuth: true },
    },
    {
      path: "/courses/:id",
      name: "course-detail",
      component: CourseDetailView,
      meta: { requiresAuth: true },
    },

    // Auth (guest-only)
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
      meta: { guestOnly: true },
    },

    // Admin courses list (auth-only; you can add admin meta later if needed)
    {
      path: "/admin/courses",
      name: "admin-courses",
      component: AdminCoursesView,
      meta: { requiresAuth: true },
    },

    // Admin question bank for a specific course (auth-only)
    {
      path: "/admin/courses/:id/questions",
      name: "admin-course-questions",
      component: AdminCourseQuestionsView,
      meta: { requiresAuth: true },
    },
  ],
});

// =========================
// Global auth / guest guard
// =========================
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("jabuspark_token");

  // 1) Protected pages → force login if no token
  if (to.meta.requiresAuth && !token) {
    return next({
      name: "login",
      query: { redirect: to.fullPath }, // so we can send them back after login
    });
  }

  // 2) Auth pages (login/register) → redirect logged-in users to dashboard
  if (to.meta.guestOnly && token) {
    return next({ name: "dashboard" });
  }

  // 3) Otherwise, continue
  next();
});

export default router;
