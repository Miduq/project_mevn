<template>
  <nav>
    <ul>
      <li v-if="!isLoggedIn"><router-link to="/">Inicio</router-link></li>
      <li v-if="!isLoggedIn"><router-link to="/recover-password">Recuperar Contraseña</router-link></li>
      <li v-if="!isLoggedIn"><router-link to="/register">Registrarse</router-link></li>

      <li v-if="isLoggedIn"><router-link to="/profile">Perfil</router-link></li>
      <li v-if="isLoggedIn"><router-link to="/dashboard">Dashboard</router-link></li>

      <li v-if="isLoggedIn && userRole ===2"><router-link to="/user-list">Lista de usuarios</router-link></li>
      <li v-if="isLoggedIn"><a href="#" @click.prevent="handleLogout">Cerrar Sesión</a></li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: 'Navbar',
  props: {
    // Propiedad para recibir el estado de autenticación desde el padre (App.vue)
    isLoggedIn: {
      type: Boolean,
      required: true
    },
    userRole: {
      type: Number,
      default: null
    }
  },
  emits: ['logout'], // Declara el evento que este componente puede emitir
  methods: {
    handleLogout() {
      // Emite el evento 'logout' hacia el componente padre (App.vue)
      this.$emit('logout');
    }
  }
}
</script>

<style scoped>
/* Estilo para la barra de navegación */
nav ul {
  list-style-type: none;
  padding: 0; /* Añadido para resetear padding por defecto */
  margin: 0; /* Añadido para resetear margin por defecto */
  display: flex;
  gap: 15px; /* Ajustado el espacio */
  background-color: #f8f9fa; /* Un fondo ligero para la barra */
  padding: 10px 15px; /* Padding interior */
  border-radius: 5px; /* Bordes redondeados */
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Sombra sutil */
}

nav ul li {
  display: inline;
}

/* Estilo para los enlaces */
nav ul li a {
  text-decoration: none;
  color: #007bff;
  padding: 5px 0;
  transition: color 0.3s ease;
}

nav ul li a:hover,
nav ul li a.router-link-exact-active { /* Estilo para enlace activo */
  color: #0056b3;
  font-weight: bold;
}

/* Estilo específico para el enlace de logout */
nav ul li a[href="#"] {
    color: #dc3545; /* Color rojo para logout */
}
nav ul li a[href="#"]:hover {
    color: #c82333; /* Rojo más oscuro al pasar el ratón */
}
</style>