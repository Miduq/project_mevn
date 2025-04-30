<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <router-link class="navbar-brand" to="/home">Plataforma MEVN</router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
          <li class="nav-item" v-if="!isLoggedIn">
            <router-link class="nav-link" :class="{ active: $route.name === 'LoginPage' }" to="/login"
              >Login</router-link
            >
          </li>
          <li class="nav-item" v-if="!isLoggedIn">
            <router-link class="nav-link" :class="{ active: $route.name === 'RegisterUserPage' }" to="/register"
              >Registro</router-link
            >
          </li>

          <li class="nav-item" v-if="isLoggedIn">
            <router-link class="nav-link" :class="{ active: $route.name === 'HomePage' }" to="/home">Home</router-link>
          </li>
          <li class="nav-item" v-if="isLoggedIn">
            <router-link class="nav-link" :class="{ active: $route.name === 'ProfilePage' }" to="/profile"
              >Perfil</router-link
            >
          </li>

          <li class="nav-item" v-if="isLoggedIn && userRole === 2">
            <router-link class="nav-link" :class="{ active: $route.name === 'SubjectManagement' }" to="/subjects"
              >Asignaturas</router-link
            >
          </li>
          <li class="nav-item" v-if="isLoggedIn && userRole === 2">
            <router-link class="nav-link" :class="{ active: $route.name === 'UserListPage' }" to="/user-list"
              >Alumnos</router-link
            >
          </li>

          <li class="nav-item" v-if="isLoggedIn">
            <router-link class="nav-link position-relative" :class="{ active: $route.name === 'ChatPage' }" to="/chat">
              Chat
              <span
                v-if="hasUnread"
                class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
                title="Nuevos mensajes de chat"
              >
                <span class="visually-hidden">Nuevos mensajes</span>
              </span>
            </router-link>
          </li>

          <li class="nav-item" v-if="isLoggedIn">
            <a href="#" class="nav-link" @click.prevent="logoutAndRedirect" title="Cerrar Sesión">
              <i class="bi bi-box-arrow-right"></i>
              <span class="d-none d-lg-inline ms-1">Salir</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useSocket } from '@/composables/useSocket';

// Definir las props que recibe el componente
const props = defineProps({
  isLoggedIn: {
    type: Boolean,
    required: true,
  },
  userRole: {
    type: Number,
    default: null,
  },
});

// Composables para manejar la autenticación y el socket
const { unreadSenders } = useSocket(); // Obtenemos el Set global (readonly)
const hasUnread = computed(() => unreadSenders.value.size > 0); // True si el Set no está vacío

const { logoutAndRedirect } = useAuth();
</script>

<style scoped>
/* Estilos del Navbar */
.navbar {
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.nav-link {
  cursor: pointer;
}
/* Estilos para el punto rojo de notificación */
.nav-link span.position-absolute {
  width: 10px;
  height: 10px;
  font-size: 0;
  padding: 0.3rem !important;
  /* Ajusta top/start si es necesario para tu tamaño de fuente/navbar */
  top: 15% !important;
  left: 90% !important;
}
/* Estilo para enlace activo */
.nav-link.router-link-active,
.nav-link.router-link-exact-active {
  font-weight: bold;
  color: #fff !important;
}
/* Importar iconos de Bootstrap si los usas */
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css');
</style>
