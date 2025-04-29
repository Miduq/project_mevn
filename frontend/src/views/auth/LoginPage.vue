<!-- frontend/src/views/LoginPage.vue -->

<template>
  <!-- Creación del formulario -->
  <div class="container mt-5">
    <div class="justify-content-center">
      <div class="col-md-6">
        <h2 class="text-center">Iniciar Sesión</h2>
        <form @submit.prevent="loginUser">
          <div class="form-group">
            <label for="username">Nombre de usuario</label>
            <input
              type="text"
              class="form-control"
              id="username"
              v-model="username"
              placeholder="Introduce tu nombre de usuario"
              required
              autocomplete="username"
            />
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              class="form-control"
              id="password"
              v-model="password"
              placeholder="Introduce tu contraseña"
              required
              autocomplete="current-password"
            />
          </div>
          <button type="submit" class="btn btn-primary btn-block">Acceder</button>
        </form>
        <div v-if="errorMessage" class="alert alert-danger mt-3">
          {{ errorMessage }}
        </div>
        <div class="mt-3 text-center">
          <router-link to="/recover-password">¿Olvidaste tu contraseña?</router-link>
          |
          <router-link to="/register">Regístrate</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AuthService from '@/services/auth/AuthService';
import { jwtDecode } from 'jwt-decode';

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
    };
  },
  methods: {
    async loginUser() {
      this.errorMessage = '';
      try {
        // Llama al servicio de login.
        const loginResult = await AuthService.login(this.username, this.password);
        console.log('Respuesta del servicio login:', loginResult);

        if (loginResult.success) {
          console.log('Inicio de sesión exitoso en el componente.');
          // Almacena el token en localStorage
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const decodedToken = jwtDecode(token);
              const userRole = decodedToken.rol;
              this.$router.push('/home');
            } catch (decodeError) {
              console.error('Error al decodificar token justo después del login:', decodeError);
              this.errorMessage = 'Error al procesar la sesión. Intenta de nuevo.';
              AuthService.logout(); // Forzar logout si el token recién guardado es inválido
            }
          } else {
            console.error('Login reportado como exitoso pero no se encontró token en localStorage.');
            this.errorMessage = 'Error de inicio de sesión inesperado (token no guardado).';
          }
        } else {
          // El servicio AuthService.login devolvió success: false
          console.log('Fallo de inicio de sesión reportado por el servicio:', loginResult.message);
          this.errorMessage = loginResult.message || 'Credenciales incorrectas o error desconocido.';
        }
      } catch (error) {
        // Error de red o error lanzado por AuthService.login
        if (error.response && error.response.data && error.response.data.message) {
          this.errorMessage = error.response.data.message;
          console.error('Error en la solicitud de login (catch - API):', this.errorMessage);
        } else {
          this.errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          console.error('Error en la solicitud de login (catch - General):', error);
        }
      }
    },
  },
};
</script>
