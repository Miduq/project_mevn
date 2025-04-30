<!-- src/App.vue -->

<template>
  <div id="app">
    <Navbar :isLoggedIn="isLoggedIn" :userRole="userRole" />
    <main class="container mt-3">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import AuthService from '@/services/auth/AuthService';
import { useSocket } from '@/composables/useSocket';
import Navbar from '@/components/Navbar.vue';
import { useAuth } from '@/composables/useAuth';

// Estado de Autenticación Reactivo
const isLoggedIn = ref(!!localStorage.getItem('token'));
const currentUser = ref(null); // Guarda el objeto { id, name, rol, ... }
const isFetchingUser = ref(false);

// Socket Connection
const { connect: connectSocket, disconnect: disconnectSocket } = useSocket();

// Función para Cargar Usuario
const fetchCurrentUser = async () => {
  if (isFetchingUser.value) return; // Evitar llamadas concurrentes
  if (isLoggedIn.value && !currentUser.value) {
    // Solo si logueado y sin datos
    isFetchingUser.value = true;
    try {
      const response = await AuthService.getMe();
      if (response.success && response.user) {
        currentUser.value = response.user;
      } else {
        if (isLoggedIn.value) AuthService.logout(); // Forzar logout si falla getMe estando logueado
      }
    } catch (error) {
      console.error('App(setup): Catch fetching user data:', error);
      if (isLoggedIn.value) AuthService.logout(); // Forzar logout en error
    } finally {
      isFetchingUser.value = false;
    }
  } else if (!isLoggedIn.value) {
    currentUser.value = null; // Limpiar si no está logueado
  }
};

// Manejador evento
const handleAuthChange = (event) => {
  const loggedInStatus = event.detail.isLoggedIn;
  isLoggedIn.value = loggedInStatus; // Actualiza el ref local
};

// Registrar/Eliminar Listener Global
onMounted(() => {
  window.addEventListener('auth-change', handleAuthChange);
});

onUnmounted(() => {
  window.removeEventListener('auth-change', handleAuthChange);
});

// Watcher para conectar/desconectar socket y cargar datos
watch(
  isLoggedIn,
  (newIsLoggedIn) => {
    if (newIsLoggedIn) {
      // Login
      fetchCurrentUser(); // Intenta cargar datos si no los tiene
      connectSocket(); // Conecta el socket
    } else {
      // Logout
      currentUser.value = null;
      disconnectSocket();
    }
  },
  { immediate: true }
);
// --- Computed para pasar el rol a Navbar ---
const userRole = computed(() => currentUser.value?.rol);
</script>

<style></style>
