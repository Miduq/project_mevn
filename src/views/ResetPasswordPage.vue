<template>
    <div class="container mt-5">
        <h2 class="text-center">Cambiar Contraseña</h2>
        <form @submit.prevent="updatePassword">
            <div class="form-group">
                <label>Nueva Contraseña</label>
                <input type="password" class="form-control" v-model="password" required autocomplete="new-password"
                    placeholder="Introduce tu nueva contraseña" />
            </div>
            <div class="form-group">
                <label>Repetir Contraseña</label>
                <input type="password" class="form-control" v-model="confirmPassword" required
                    autocomplete="new-password" placeholder="Repite tu nueva contraseña" />
            </div>
            <button type="submit" class="btn btn-primary btn-block">Actualizar Contraseña</button>
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
    name: 'ResetPassPage',
    data() {
        return {
            password: '',
            confirmPassword: '',
            errorMessage: '',
            successMessage: ''
        };
    },
    methods: {
        async updatePassword() {
            this.errorMessage = '';
            this.successMessage = '';

            if (this.password !== this.confirmPassword) {
                this.errorMessage = 'Las contraseñas no coinciden.';
                return;
            }

            // Obtener token de la URL
            const token = this.$route.query.token;
            if (!token) {
                this.errorMessage = 'Token no encontrado en la URL.';
                return;
            }

            try {
                const response = await apiClient.post('http://localhost:3000/auth/reset-password', {
                    token,
                    newPassword: this.password
                });

                if (response.data.success) {
                    this.successMessage = response.data.message;
                    // Redirigir al Login tras un breve lapso
                    setTimeout(() => {
                        this.$router.push('/login');
                    }, 2000);
                } else {
                    this.errorMessage = response.data.message;
                }
            } catch (error) {
                console.error(error);
                this.errorMessage = 'Error al actualizar la contraseña.';
            }
        }
    }
};
</script>