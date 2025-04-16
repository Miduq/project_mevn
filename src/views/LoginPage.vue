<template>
    <!-- Creación del formulario -->
    <div class="container mt-5">
        <div class="justify-content-center">
            <div class="col-md-6">
                <h2 class="text-center">Iniciar Sesión</h2>
                <form @submit.prevent="loginUser">
                    <div class="form-group">
                        <label for="username">Nombre de usuario</label>
                        <input type="text" class="form-control" id="username" v-model="username"
                            placeholder="Introduce tu nombre de usuario" required autocomplete="username" />
                    </div>
                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <input type="password" class="form-control" id="password" v-model="password"
                            placeholder="Introduce tu contraseña" required autocomplete="current-password" />
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Acceder</button>
                </form>
                <!-- Mensaje de error si las credenciales son incorrectas -->
                <div v-if="errorMessage" class="alert alert-danger mt-3">
                    {{ errorMessage }}
                </div>
                <!-- Enlaces para recuperar contraseña y registrarse -->
                <div class="mt-3 text-center">
                    <router-link to="/recover-password">¿Olvidaste tu contraseña?</router-link> |
                    <router-link to="/register">Regístrate</router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
// Importa la función 'login' desde apiService.js
import { login } from '../../services/apiService';

export default {
    name: "LoginPage",
    data() {
        return {
            username: '',
            password: '',
            errorMessage: ''
        };
    },
    methods: {
        async loginUser() {
            try {
                console.log('Intentando iniciar sesión con:', this.username, this.password);
                const response = await login(this.username, this.password);
                console.log('Respuesta del servidor completa:', response);
                console.log('Datos de la respuesta:', response.data);

                if (response.data.success) {
                    console.log('Inicio de sesión exitoso. Token recibido:', response.data.token);
                    localStorage.setItem('token', response.data.token);
                    // Emitir evento de login exitoso
                    window.dispatchEvent(new Event('login'));

                    this.$router.push('/dashboard');
                } else {
                    console.log('Error en el inicio de sesión:', response.data.message);
                    this.errorMessage = response.data.message;
                }
            } catch (error) {
                if (error.response && error.response.data && error.response.data.message) {
                    this.errorMessage = error.response.data.message;
                    console.error('Error en la solicitud de login:', error.response.data.message);
                } else {
                    this.errorMessage = 'Error al iniciar sesión. Intenta de nuevo.';
                    console.error('Error en la solicitud de login:', error);
                }
            }
        }
    }
};
</script>

<style scoped>
/* Puedes agregar estilos personalizados aquí */
</style>
