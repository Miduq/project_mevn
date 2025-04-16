// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '../views/LoginPage.vue';
import RecoverPassPage from '../views/RecoverPasswordPage.vue';
import RegisterUserPage from '../views/RegisterUserPage.vue';
import ResetPasswordPage from '../views/ResetPasswordPage.vue';
import DashboardPage from '../views/DashboardPage.vue';
import ValidateEmailPage from '../views/ValidateEmailPage.vue';
import ProfilePage from '../views/ProfilePage.vue';
import UserListPage from '../views/UserListPage.vue';
import EditUserPage from '../views/EditUserPage.vue';
import NotFoundPage from '../views/NotFoundPage.vue';

const routes = [
  {
    path: '/',
    name: 'LoginPage',
    component: LoginPage,
  },
  {
    path: '/login',
    redirect: '/', // Redirigir '/login' a '/'
  },
  {
    path: '/recover-password',
    name: 'RecoverPassPage',
    component: RecoverPassPage,
  },
  {
    path: '/reset-password',
    name: 'ResetPassPage',
    component: ResetPasswordPage,
  },
  {
    path: '/register',
    name: 'RegisterUserPage',
    component: RegisterUserPage,
  },
  {
    path: '/dashboard',
    name: 'DashboardPage',
    component: DashboardPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/validate-email',
    name: 'ValidateEmailPage',
    component: ValidateEmailPage,
  },
  {
    path: '/profile',
    name: 'ProfilePage',
    component: ProfilePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/user-list',
    name: 'UserListPage',
    component: UserListPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-user/:id',
    name: 'EditUserPage',
    component: EditUserPage,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-user',
    redirect: '/',
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundPage,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// Guard para proteger rutas que requieren autenticación
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const token = localStorage.getItem('token');
  console.log(`Guard: requiresAuth=${requiresAuth}, token=${token}`);


  if (requiresAuth && !token) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
