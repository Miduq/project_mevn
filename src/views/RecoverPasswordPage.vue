<!-- src/components/PasswordRecoveryRequest.vue -->

<template>
    <div class="container mt-5">
        <h2 class="text-center">Recuperar Contraseña</h2>
        <form @submit.prevent="sendRecoveryEmail">
            <div class="form-group">
                <label>Correo Electrónico</label>
                <input type="email" class="form-control" v-model="email" required placeholder="Introduce tu correo electrónico" />
            </div>
            <button type="submit" class="btn btn-primary btn-block">Enviar Enlace de Recuperación</button>
        </form>

        <!-- Mensajes de error o éxito -->
        <div v-if="errorMessage" class="alert alert-danger mt-3">
            {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="alert alert-success mt-3">
            {{ successMessage }}
        </div>
    </div>
</template>

<script>
import apiClient from '../../services/apiService'; // Ajusta la ruta según tu estructura de carpetas

export default {
    name: "RecoverPasswordPage",
    data() {
        return {
            email: '',
            errorMessage: '',
            successMessage: ''
        };
    },
    methods: {
        async sendRecoveryEmail() {
            this.errorMessage = '';
            this.successMessage = '';

            // Validación básica del correo
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.email)) {
                this.errorMessage = 'Por favor, introduce un correo electrónico válido.';
                return;
            }

            try {
                const response = await apiClient.post('/auth/recover-password', {
                    email: this.email
                });

                if (response.data.success) {
                    this.successMessage = response.data.message;
                } else {
                    this.errorMessage = response.data.message;
                }
            } catch (error) {
                console.error(error);
                this.errorMessage = error.response?.data?.message || 'Error al enviar el enlace de recuperación.';
            }
        }
    }
};
</script>

<style scoped>
/* Puedes agregar estilos personalizados aquí */
</style>
