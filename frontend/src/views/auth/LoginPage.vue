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
import AuthService from '@/services/auth/AuthService';

export default {
    name: "LoginPage",
    data() {
        return {
            username: '',
            password: '',
            errorMessage: ''
        };
    },
    // methods dentro de export default { ... }
    methods: {
        async loginUser() {
            try {
                const data = await AuthService.login(this.username, this.password);
                console.log('Respuesta del servicio completa:', data);
                if (data.success) {
                    console.log('Inicio de sesión exitoso.');
                    this.$router.push('/dashboard');
                } else {
                    console.log('Error en el inicio de sesión:', data.message);
                    this.errorMessage = data.message || 'Credenciales incorrectas o error desconocido.';
                }
            } catch (error) {
                if (error.response && error.response.data && error.response.data.message) {
                    this.errorMessage = error.response.data.message;
                    console.error('Error en la solicitud de login (catch):', error.response.data.message);
                } else {
                    this.errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
                    console.error('Error en la solicitud de login (catch):', error);
                }
            }
        }
    }
};
</script>
