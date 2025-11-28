import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "../views/DashboardView.vue";
import CoursesView from "../views/CoursesView.vue";
import CourseDetailView from "../views/CourseDetailView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import AdminCoursesView from "../views/AdminCoursesView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", name: "dashboard", component: DashboardView },
    { path: "/courses", name: "courses", component: CoursesView },
    { path: "/courses/:id", name: "course-detail", component: CourseDetailView },
    { path: "/login", name: "login", component: LoginView },
    { path: "/register", name: "register", component: RegisterView },

    // NEW: admin course management
    { path: "/admin/courses", name: "admin-courses", component: AdminCoursesView },
  ],
});

export default router;
