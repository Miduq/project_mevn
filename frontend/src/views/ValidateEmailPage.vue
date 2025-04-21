<template>
  <div class="container mt-5">
    <h2>Validación de Correo</h2>
    <p>{{ message }}</p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ValidateEmailPage",
  data() {
    return {
      message: "Validando tu correo, por favor espera...",
    };
  },
  async created() {
    const token = this.$route.query.token;

    try {
      const response = await axios.get(
        `http://localhost:3000/auth/validate-email?token=${token}`
      );
      this.message = response.data.message;
    } catch (error) {
      console.error("Error al validar el correo:", error);
      this.message =
        "Error al validar el correo. Por favor, contacta con soporte.";
    }
  },
};
</script>
