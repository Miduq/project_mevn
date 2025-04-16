<template>
  <div class="not-found">
    <h2>404 - Página No Encontrada</h2>
    <router-link to="/">Volver al Inicio</router-link>
  </div>
</template>

<script>
export default {
  name: 'NotFoundPage',
};
</script>

<style scoped>
.not-found {
  text-align: center;
  padding: 50px;
}
.not-found a {
  color: #007bff;
  text-decoration: none;
}
.not-found a:hover {
  text-decoration: underline;
}
</style>
