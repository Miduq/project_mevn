<template>
  <div class="container mt-5">
    <h2 class="text-center">Cambiar Contraseña</h2>
    <form @submit.prevent="updatePassword">
      <div class="form-group">
        <label>Nueva Contraseña</label>
        <input
          type="password"
          class="form-control"
          v-model="password"
          required
          autocomplete="new-password"
          placeholder="Introduce tu nueva contraseña"
        />
      </div>
      <div class="form-group">
        <label>Repetir Contraseña</label>
        <input
          type="password"
          class="form-control"
          v-model="confirmPassword"
          required
          autocomplete="new-password"
          placeholder="Repite tu nueva contraseña"
        />
      </div>
      <button type="submit" class="btn btn-primary btn-block">
        Actualizar Contraseña
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
  name: "ResetPasswordPage",
  data() {
    return {
      password: "",
      confirmPassword: "",
      errorMessage: "",
      successMessage: "",
      token: null, // Guardaremos el token aquí
    };
  },
  created() {
    // Obtener el token del PARÁMETRO DE RUTA
    this.token = this.$route.params.token;
    if (!this.token) {
      this.errorMessage = "Token no encontrado o inválido en la URL.";
      console.error("No se encontró el token en los parámetros de la ruta.");
      this.$router.push("/");
    }
  },
  methods: {
    async updatePassword() {
      this.errorMessage = "";
      this.successMessage = "";

      if (this.password !== this.confirmPassword) {
        this.errorMessage = "Las contraseñas no coinciden.";
        return;
      }
      if (!this.password) {
        this.errorMessage = "La contraseña no puede estar vacía.";
        return;
      }
      if (!this.token) {
        this.errorMessage = "Token de reseteo inválido o no proporcionado.";
        return; // Salir si no hay token
      }

      try {
        const payload = { password: this.password };
        const data = await AuthService.resetPassword(this.token, payload);

        if (data.success) {
          this.successMessage =
            data.message || "Contraseña actualizada correctamente.";
          this.password = ""; // Limpiar
          this.confirmPassword = "";
          // Redirigir al Login tras un breve lapso de tiempo
          setTimeout(() => {
            this.$router.push("/");
          }, 3000); // Espera 3 segundos
        } else {
          this.errorMessage =
            data.message ||
            "Error al actualizar la contraseña (respuesta no exitosa).";
        }
      } catch (error) {
        console.error("Error en componente reset password:", error);
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error al actualizar la contraseña o token inválido/expirado.";
      }
    },
  },
};
</script>
