<!-- src/App.vue -->

<template>
  <div id="app">
    <Navbar :isLoggedIn="isLoggedIn" :userRole="userRole" @logout="logout" />

    <router-view />
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue';
import AuthService from '@/services/auth/AuthService';

export default {
  name: 'App',
  components: {
    Navbar,
  },
  data() {
    return {
      // Estado inicial basado en el token al cargar
      isLoggedIn: !!localStorage.getItem('token'),
      currentUser: null, // Inicializa como null hasta que se cargue el usuario
      isFetchingUser: false,
      authChangeListener: null,
    };
  },
  computed: {
    userRole() {
      return this.currentUser?.rol;
    },
  },
  methods: {
    // Método para obtener los datos del usuario actual desde el backend
    async fetchCurrentUser() {
      if (this.isLoggedIn && !this.currentUser && !this.isFetchingUser) {
        this.isFetchingUser = true;
        try {
          console.log('App.vue: Obteniendo datos del usuario actual...');
          const userData = await AuthService.getMe(); // Asume que devuelve el objeto usuario
          this.currentUser = userData.user || userData;
          console.log('App.vue: Datos del usuario actual guardados:', this.currentUser);
        } catch (error) {
          console.error('App.vue: Error al obtener datos del usuario:', error);
        } finally {
          this.isFetchingUser = false; // Desmarcar al finalizar (éxito o error)
        }
      } else if (!this.isLoggedIn) {
        this.currentUser = null;
      } else {
        console.log('App.vue: fetchCurrentUser omitido (ya fetching, no logueado, o ya hay datos).');
      }
    },

    // Método para manejar cambios de autenticación
    handleAuthChange(loggedInStatus) {
      console.log('App.vue: Estado de login cambiado a:', loggedInStatus);
      if (this.isLoggedIn !== loggedInStatus) {
        this.isLoggedIn = loggedInStatus;
        if (loggedInStatus) {
          console.log('App.vue: Logged in, obteniendo datos del usuario...');
          this.fetchCurrentUser(); // Obtiene datos si se loguea
        } else {
          console.log('App.vue: Logged out, limpiando datos del usuario...');
          this.currentUser = null; // Limpia datos si hace logout
        }
      } else {
        console.log('App.vue: Estado de login no cambió, no se hace nada extra.');
      }
    },

    logout() {
      AuthService.logout();
      this.$router.replace('/');
      console.log('App.vue: Solicitado logout y redirigido a /');
    },
  },
  watch: {
    isLoggedIn(newVal, oldVal) {
      if (newVal === true) {
        this.fetchCurrentUser();
      } else if (newVal === false) {
        this.currentUser = null;
      }
    },
  },
  mounted() {
    this.authChangeListener = (event) => {
      this.handleAuthChange(event.detail.isLoggedIn);
    };
    window.addEventListener('auth-change', this.authChangeListener);
    console.log('App.vue mounted, auth listener añadido.');

    // Intenta cargar datos del usuario al inicio si está logueado
    console.log('App.vue mounted: Intentando fetch inicial de usuario si está logueado.');
    this.fetchCurrentUser();
  },
  beforeUnmount() {
    window.removeEventListener('auth-change', this.authChangeListener);
    console.log('App.vue unmounted, auth listener quitado.');
  },
};
</script>

<style></style>
