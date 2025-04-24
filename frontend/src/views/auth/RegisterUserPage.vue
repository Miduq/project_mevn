<!-- frontend/src/views/auth/RegisterUserPage.vue -->

<template>
  <div class="form-container">
    <h2>Registro de usuarios</h2>

    <div v-if="message" :class="['alert', isError ? 'alert-danger' : 'alert-success']" role="alert">
      {{ message }}
    </div>

    <b-form @submit.prevent="onSubmit" @reset="onReset" v-if="showForm">
      <b-form-group id="input-group-name" label="Tu nombre:" label-for="input-name">
        <b-form-input
          id="input-name"
          v-model="form.name"
          placeholder="Introduce tu nombre"
          required
          :disabled="isSubmitting"
        ></b-form-input>
      </b-form-group>

      <b-form-group id="input-group-surname" label="Tus apellidos:" label-for="input-surname">
        <b-form-input
          id="input-surname"
          v-model="form.surname"
          placeholder="Introduce tus apellidos"
          required
          :disabled="isSubmitting"
        ></b-form-input>
      </b-form-group>

      <b-form-group id="input-group-username" label="Nombre de usuario:" label-for="input-username">
        <b-form-input
          id="input-username"
          v-model="form.username"
          placeholder="Introduce un nombre de usuario"
          required
          :disabled="isSubmitting"
        ></b-form-input>
      </b-form-group>

      <b-form-group
        id="input-group-email"
        label="Correo electrónico:"
        label-for="input-email"
        description="Necesitamos un email válido para activar tu cuenta."
      >
        <b-form-input
          id="input-email"
          v-model="form.email"
          type="email"
          :state="emailState"
          placeholder="Introduce tu email"
          required
          :disabled="isSubmitting"
        ></b-form-input>
        <b-form-invalid-feedback :state="emailState">
          Por favor, introduce un correo electrónico válido.
        </b-form-invalid-feedback>
      </b-form-group>

      <b-form-group id="input-group-password" label="Contraseña:" label-for="input-password">
        <b-form-input
          id="input-password"
          v-model="form.password"
          type="password"
          :state="passwordState"
          placeholder="Introduce tu contraseña"
          required
          :disabled="isSubmitting"
        ></b-form-input>
        <b-form-invalid-feedback :state="passwordState"> Las contraseñas no coinciden. </b-form-invalid-feedback>
      </b-form-group>

      <b-form-group id="input-group-retype-password" label="Repetir Contraseña:" label-for="input-retype-password">
        <b-form-input
          id="input-retype-password"
          v-model="form.retype_password"
          type="password"
          :state="passwordState"
          placeholder="Vuelve a introducir tu contraseña"
          required
          :disabled="isSubmitting"
        ></b-form-input>
      </b-form-group>

      <b-form-group id="input-group-rol" label="Rol:" label-for="input-rol">
        <b-form-select
          id="input-rol"
          v-model="form.rol"
          :options="rolOptions"
          required
          :disabled="isSubmitting"
        ></b-form-select>
      </b-form-group>

      <b-form-group
        id="input-group-token"
        label="Token de validación Profesor:"
        label-for="input-token"
        v-if="form.rol === 2"
      >
        <b-form-input
          id="input-token"
          v-model="form.token"
          type="text"
          placeholder="Introduce el token de validación"
          :required="form.rol === 2"
          :disabled="isSubmitting"
          aria-describedby="token-feedback"
        ></b-form-input>
        <b-form-invalid-feedback id="token-feedback" :state="!isError || form.rol !== 2">
          {{ message }}
        </b-form-invalid-feedback>
      </b-form-group>

      <div class="d-flex justify-content-between mt-4">
        <b-button type="submit" variant="primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
          {{ isSubmitting ? 'Registrando...' : 'Registrarse' }}
        </b-button>
        <b-button type="reset" variant="danger" :disabled="isSubmitting">Vaciar</b-button>
      </div>
    </b-form>

    <div class="mt-3 text-center">¿Ya tienes cuenta? <router-link to="/login">Inicia Sesión</router-link></div>
  </div>
</template>

<script>
import AuthService from '@/services/auth/AuthService'; // Importamos el servicio

export default {
  name: 'RegisterUserPage',
  data() {
    return {
      form: {
        name: '',
        surname: '',
        username: '',
        email: '',
        password: '',
        retype_password: '',
        rol: null,
        token: '', // Token de profesor
      },
      rolOptions: [
        { text: '¿Qué eres?', value: null, disabled: true },
        { text: 'Alumno', value: 1 }, // Valor 1 para Alumno
        { text: 'Profesor', value: 2 }, // Valor 2 para Profesor
      ],
      message: '',
      isError: false,
      isSubmitting: false,
      showForm: true,
    };
  },
  computed: {
    // Validación de formato de email
    emailState() {
      if (!this.form.email && !this.isSubmitting) return null; // No validar si vacío (a menos que se envíe)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(this.form.email);
    },
    // Validación de coincidencia de contraseñas
    passwordState() {
      if (!this.form.password && !this.form.retype_password) return null;
      if (!this.form.password || !this.form.retype_password) return null; // No valida si falta uno
      return this.form.password === this.form.retype_password;
    },
    // Estado visual para token
    tokenFieldState() {
      if (this.form.rol !== 2) return null;
      return null;
    },
  },
  methods: {
    async onSubmit() {
      this.message = '';
      this.isError = false;

      // Validaciones Frontend mejoradas
      if (!this.emailState) {
        this.message = 'El correo electrónico no tiene un formato válido.';
        this.isError = true;
        return;
      }
      if (this.passwordState === false) {
        this.message = 'Las contraseñas introducidas no coinciden.';
        this.isError = true;
        return;
      }
      if (this.form.rol === null) {
        this.message = 'Debes seleccionar un Rol (Alumno o Profesor).';
        this.isError = true;
        return;
      }
      if (this.form.rol === 2 && !this.form.token) {
        // Comparamos con el valor numérico 2
        this.message = 'Se requiere el token de validación para registrarse como Profesor.';
        this.isError = true;
        return;
      }

      // Llamada al Servicio AuthService
      this.isSubmitting = true;
      try {
        const userData = { ...this.form };
        delete userData.retype_password; // No enviar la confirmación de contraseña

        //  Usamos AuthService.register en lugar de fetch
        const response = await AuthService.register(userData);

        if (response.success) {
          this.message = response.message || 'Registro completado. Revisa tu email para validar la cuenta.';
          this.isError = false;
          this.showForm = false;
        } else {
          this.message = response.message || 'Error en el registro.';
          this.isError = true;
        }
      } catch (error) {
        // Error en la llamada API (catch del servicio o de red)
        console.error('Error en onSubmit de registro:', error);
        this.message = error.response?.data?.message || error.message || 'Error de comunicación con el servidor.';
        this.isError = true;
      } finally {
        this.isSubmitting = false; // Terminar estado de carga
      }
    },
    // Método para manejar el evento de resetear el formulario
    onReset(event) {
      event.preventDefault();
      this.form.name = '';
      this.form.surname = '';
      this.form.username = '';
      this.form.email = '';
      this.form.password = '';
      this.form.retype_password = '';
      this.form.rol = null;
      this.form.token = '';
      this.message = '';
      this.isError = false;
      this.showForm = false;
      this.$nextTick(() => {
        this.showForm = true;
      });
    },
  },
};
</script>

<style scoped>
.form-container {
  max-width: 600px;
  margin: 30px auto;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 30px 40px;
}
.b-form-group {
  margin-bottom: 1.25rem;
}
</style>
