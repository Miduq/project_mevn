<!-- frontend/src/components/users/EditStudent.vue -->

<template>
  <div class="edit-modal-backdrop" @click.self="handleCancel">
    <div class="edit-modal-content">
      <h3>
        Editando Alumno: {{ formData.name }} {{ formData.surname }} (ID:
        {{ student?.id }})
      </h3>
      <hr />

      <form @submit.prevent="handleSubmit">
        <div
          v-if="errorMessage || internalErrorMessage"
          class="alert alert-danger p-2"
          role="alert"
        >
          {{ errorMessage || internalErrorMessage }}
        </div>

        <div class="mb-3">
          <label for="editStudentNameModal" class="form-label">Nombre:</label>
          <input
            type="text"
            class="form-control"
            id="editStudentNameModal"
            v-model.trim="formData.name"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="mb-3">
          <label for="editStudentSurnameModal" class="form-label"
            >Apellidos:</label
          >
          <input
            type="text"
            class="form-control"
            id="editStudentSurnameModal"
            v-model.trim="formData.surname"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="mb-3">
          <label for="editStudentEmailModal" class="form-label">Email:</label>
          <input
            type="email"
            class="form-control"
            id="editStudentEmailModal"
            v-model.trim="formData.email"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="text-end mt-4">
          <button
            type="button"
            class="btn btn-secondary me-2"
            @click="handleCancel"
            :disabled="isLoading"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn btn-success"
            :disabled="isLoading || !isFormValid"
          >
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
            {{ isLoading ? "Guardando..." : "Guardar Cambios" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import validator from "validator";

export default {
  name: "EditStudent",
  props: {
    // Recibe el objeto completo del estudiante a editar
    student: {
      type: Object,
      required: true,
    },
    // Recibe el estado de carga del padre (cuando se está llamando a la API)
    isLoading: {
      type: Boolean,
      default: false,
    },
    // Recibe mensajes de error de la API desde el padre
    errorMessage: {
      type: String,
      default: "",
    },
  },
  // Eventos que emite al padre
  emits: ["close", "save"],
  data() {
    return {
      // Usamos formData como una copia local para no mutar la prop directamente
      formData: {
        id: null,
        name: "",
        surname: "",
        email: "",
      },
      // Para errores de validación DENTRO del modal (si los hubiera)
      internalErrorMessage: "",
    };
  },
  computed: {
    // Validación básica para habilitar el botón Guardar
    isFormValid() {
      // Verifica que los campos requeridos no estén vacíos
      return this.formData.name && this.formData.surname && this.formData.email;
      // Podrías añadir validación de formato de email aquí también
    },
  },
  methods: {
    // Inicializa el formData interno con los datos de la prop 'student'
    initializeForm() {
      if (this.student) {
        // Copia las propiedades relevantes del estudiante a formData
        this.formData.id = this.student.studentId;
        // Usa los nombres de propiedad que vengan en 'student'
        // (Asegúrate que coinciden con lo que devuelve getMyStudents)
        this.formData.name = this.student.name || "";
        this.formData.surname = this.student.surname || "";
        this.formData.email = this.student.email || "";
      } else {
        // Si no hay estudiante, resetea (no debería ocurrir si se usa v-if en el padre)
        this.formData = { id: null, name: "", surname: "", email: "" };
      }
      this.internalErrorMessage = ""; // Limpia errores internos al (re)inicializar
    },
    // Se llama al enviar el formulario
    handleSubmit() {
      this.internalErrorMessage = ""; // Limpiar error interno
      // Realiza validación interna antes de emitir
      if (!this.isFormValid) {
        this.internalErrorMessage =
          "Por favor, completa todos los campos requeridos.";
        return;
      }
      // Si todo está bien, emite el evento 'save' con los datos del formulario
      console.log("EditStudentModal: Emitiendo save con data:", this.formData);
      this.$emit("save", { ...this.formData }); // Importante enviar una copia
    },
    // Se llama al pulsar Cancelar o clicar fuera
    handleCancel() {
      console.log("EditStudentModal: Emitiendo close");
      this.$emit("close");
    },
  },
  watch: {
    // Observador para re-inicializar el formulario si la prop 'student' cambia
    student: {
      handler: "initializeForm", // Llama a initializeForm cuando 'student' cambie
      immediate: true, // Ejecuta el handler inmediatamente al montar
      deep: true, // Necesario para detectar cambios dentro del objeto
    },
  },
};
</script>

<style scoped>
.edit-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  padding: 15px;
}
.edit-modal-content {
  background-color: white;
  padding: 25px 30px;
  border-radius: 8px;
  min-width: 350px;
  max-width: 550px;
  width: 90%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  max-height: 80vh;
  overflow-y: auto;
}
.text-end {
  text-align: right;
}
.me-2 {
  margin-right: 0.5rem !important;
}
</style>
