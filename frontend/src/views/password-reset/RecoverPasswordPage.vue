<!-- src/views/password-reset/RecoverPasswordPage.vue -->

<template>
  <div class="container mt-5">
    <h2 class="text-center">Recuperar Contraseña</h2>
    <form @submit.prevent="sendRecoveryEmail">
      <div class="form-group">
        <label>Correo Electrónico</label>
        <input
          type="email"
          class="form-control"
          v-model="email"
          required
          placeholder="Introduce tu correo electrónico"
        />
      </div>
      <button type="submit" class="btn btn-primary btn-block">
        Enviar Enlace de Recuperación
      </button>
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
import AuthService from "@/services/auth/AuthService";

export default {
  name: "RecoverPasswordPage",
  data() {
    return {
      email: "",
      errorMessage: "",
      successMessage: "",
    };
  },
  methods: {
    async sendRecoveryEmail() {
      this.errorMessage = "";
      this.successMessage = "";

      // Validación básica del correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.errorMessage =
          "Por favor, introduce un correo electrónico válido.";
        return;
      }

      try {
        const data = await AuthService.recoverPassword(this.email);

        if (data.success) {
          this.successMessage =
            data.message || "Si el email existe, recibirás instrucciones.";
          this.email = ""; // Limpiar campo
        } else {
          this.errorMessage =
            data.message ||
            "Error al solicitar la recuperación (respuesta no exitosa).";
        }
      } catch (error) {
        console.error("Error en componente recover password:", error);
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error al enviar el enlace de recuperación.";
      }
    },
  },
};
</script>
