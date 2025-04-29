<!-- frontend/src/views/ErrorPage.vue -->

<template>
  <div class="error-page-container container text-center mt-5 pt-5">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
        <i class="bi bi-exclamation-triangle-fill text-danger display-1 mb-3"></i>

        <h1 class="display-5 fw-bold">¡Oops! Algo salió mal</h1>
        <p class="lead text-secondary mb-4">
          Lo sentimos, ha ocurrido un error inesperado mientras procesábamos tu solicitud. Puedes intentar volver al
          inicio.
        </p>
        <router-link to="/home" class="btn btn-primary btn-lg">
          <i class="bi bi-house-door"></i> Ir a la Página Principal
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.error-page-container {
  min-height: 60vh; /* Para centrar verticalmente un poco */
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.display-1 {
  /* Icono más grande */
  font-size: 5rem;
}
</style>
