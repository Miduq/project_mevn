// src/router/index.js

import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "@/views/auth/LoginPage.vue";
import RecoverPassPage from "@/views/password-reset/RecoverPasswordPage.vue";
import RegisterUserPage from "@/views/auth/RegisterUserPage.vue";
import ResetPasswordPage from "@/views/password-reset/ResetPasswordPage.vue";
import DashboardPage from "@/views/dashboard/DashboardPage.vue";
import ValidateEmailPage from "../views/ValidateEmailPage.vue";
import ProfilePage from "@/views/users/ProfilePage.vue";
import UserListPage from "@/views/users/UserListPage.vue";
import SubjectManagementPage from "@/views/subjects/SubjectManagementPage.vue";
import NotFoundPage from "../views/NotFoundPage.vue";
import { jwtDecode } from "jwt-decode";

const routes = [
  {
    path: "/",
    name: "LoginPage",
    component: LoginPage,
  },
  {
    path: "/login",
    redirect: "/",
  },
  {
    path: "/recover-password",
    name: "RecoverPassPage",
    component: RecoverPassPage,
  },
  {
    path: "/reset-password",
    name: "ResetPassPage",
    component: ResetPasswordPage,
  },
  {
    path: "/register",
    name: "RegisterUserPage",
    component: RegisterUserPage,
  },
  {
    path: "/dashboard",
    name: "DashboardPage",
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/validate-email",
    name: "ValidateEmailPage",
    component: ValidateEmailPage,
  },
  {
    path: "/profile",
    name: "ProfilePage",
    component: ProfilePage,
    meta: { requiresAuth: true },
  },
  {
    path: "/user-list",
    name: "UserListPage",
    component: UserListPage,
    meta: { requiresAuth: true, requiredRole: 2 },
  },
  {
    path: "/edit-user",
    redirect: "/",
  },
  {
    path: "/subjects",
    name: "SubjectManagement",
    component: SubjectManagementPage,
    meta: { requiresAuth: true, requiredRole: 2 },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFoundPage,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Guard para proteger rutas que requieren autenticación
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiredRole = to.meta.requiredRole;
  const token = localStorage.getItem("token");
  console.log(`Guard: requiresAuth=${requiresAuth}, token=${token}`);

  if (requiresAuth && !token) {
    console.log(
      "Guard: Autenticación requerida, sin token. Redirigiendo a Login."
    );
    next({ name: "LoginPage" });
  } else if (requiredRole) {
    if (!token) {
      console.log("Guard: Rol requerido, sin token. Redirigiendo a Login.");
      next({ name: "LoginPage" });
    } else {
      try {
        const decodedToken = jwtDecode(token);
        console.log("Guard: CONTENIDO DEL TOKEN DECODIFICADO:", decodedToken);
        const userRole = decodedToken.role;
        console.log(
          `Guard: Chequeando rol. Requerido=${requiredRole}, Rol Usuario=${userRole}`
        );

        if (userRole === requiredRole) {
          console.log("Guard: Rol correcto. Acceso permitido.");
          next();
        } else {
          console.warn(
            `Guard: Rol incorrecto (${userRole} !== ${requiredRole}`
          );
          next({ name: "DashboardPage" });
        }
      } catch (error) {
        console.error("Guard: Error decodificando token:", error);
        localStorage.removeItem("token");
        window.dispatchEvent(
          new CustomEvent("auth-change", { detail: { isLoggedIn: false } })
        );
        next({ name: "LoginPage" });
      }
    }
  } else {
    console.log("Guard: Acceso permitido (no requiere rol específico).");
    next();
  }
});

export default router;
