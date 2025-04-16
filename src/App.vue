<!-- src/App.vue -->

<template>
  <div id="app">
    <nav>
      <ul>
        <!-- Siempre visible -->
        <li v-if="!isLoggedIn"><router-link to="/">Inicio</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/recover-password">Recuperar Contraseña</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/register">Registrarse</router-link></li>

        <!-- Visible solo si el usuario está logueado -->
        <li v-if="isLoggedIn"><router-link to="/profile">Perfil</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/dashboard">Dashboard</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/user-list">Lista de Usuarios</router-link></li>

        <!-- Botón de logout -->
        <li v-if="isLoggedIn"><a href="#" @click.prevent="logout">Cerrar Sesión</a></li>
      </ul>
    </nav>
    <router-view/>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      isLoggedIn: false, // Estado de autenticación
    };
  },
  created() {
    // Verifica si el usuario está logueado basado en la presencia del token
    const token = localStorage.getItem("token");
    this.isLoggedIn = !!token; // Si hay un token, el usuario está logueado
    console.log('App creado, isLoggedIn:', this.isLoggedIn);
  },
  methods: {
    logout() {
      // Elimina el token y redirige al inicio
      localStorage.removeItem("token");
      this.isLoggedIn = false;
      this.$router.push("/");
      console.log('Usuario ha cerrado sesión');
    },
  },
};
</script>

<style>
nav ul {
  list-style-type: none;
  display: flex;
  gap: 10px;
}
nav ul li {
  display: inline;
}
</style>
