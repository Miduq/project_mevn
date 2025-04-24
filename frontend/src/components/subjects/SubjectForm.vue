<!-- fronend/src/components/SubjectForm.vue -->

<template>
  <div class="card mt-2 mb-4" :class="{ 'border-warning': isEditMode }">
    <div class="card-body">
      <h5 class="card-title">{{ formTitle }}</h5>

      <form @submit.prevent="handleSubmit">
        <div
          v-if="errorMessage || internalErrorMessage"
          class="alert alert-danger mt-2 p-2"
          role="alert"
        >
          {{ errorMessage || internalErrorMessage }}
        </div>

        <div class="mb-3">
          <label for="subjectNameInput" class="form-label"
            >Nombre de la Asignatura:</label
          >
          <input
            type="text"
            class="form-control"
            id="subjectNameInput"
            v-model.trim="formData.subject"
            required
            :disabled="isLoading"
            ref="subjectNameInputRef"
          />
        </div>

        <div class="text-end">
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
            class="btn"
            :class="isEditMode ? 'btn-success' : 'btn-primary'"
            :disabled="isLoading || !formData.subject"
          >
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
            {{ buttonText }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: "SubjectForm",
  props: {
    // Objeto con datos iniciales para modo edición. Si es null, es modo añadir.
    initialSubject: {
      type: Object,
      default: null,
    },
    // Estado de carga pasado desde el padre (para deshabilitar mientras guarda/actualiza)
    isLoading: {
      type: Boolean,
      default: false,
    },
    // Mensaje de error específico de API pasado desde el padre (ej: nombre duplicado)
    errorMessage: {
      type: String,
      default: "",
    },
  },
  // Eventos que este componente emite hacia el padre
  emits: ["save", "cancel"],
  data() {
    return {
      // Estado interno del formulario
      formData: {
        id: null,
        subject: "", // Usaremos 'subject' para mantener consistencia con tu modelo
      },
      // Para errores de validación DENTRO del formulario (ej: campo vacío)
      internalErrorMessage: "",
    };
  },
  computed: {
    // Determina si estamos en modo edición basado en la prop initialSubject
    isEditMode() {
      return this.initialSubject && this.initialSubject.id !== null;
    },
    // Título dinámico para el formulario
    formTitle() {
      return this.isEditMode
        ? `Editando Asignatura (ID: ${this.initialSubject.id})`
        : "Nueva Asignatura";
    },
    // Texto dinámico para el botón de guardar/actualizar
    buttonText() {
      if (this.isLoading) {
        return this.isEditMode ? "Actualizando..." : "Guardando...";
      }
      return this.isEditMode ? "Actualizar" : "Guardar";
    },
  },
  methods: {
    // Inicializa o resetea los datos del formulario basado en la prop initialSubject
    initializeForm() {
      console.log(
        "SubjectForm: Initializing/Resetting form. Edit Mode:",
        this.isEditMode
      );
      if (this.isEditMode) {
        // Modo Edición: Copia los datos del objeto pasado como prop
        this.formData.id = this.initialSubject.id;
        this.formData.subject = this.initialSubject.subject;
      } else {
        // Modo Añadir: Resetea los campos
        this.formData.id = null;
        this.formData.subject = "";
      }
      this.internalErrorMessage = ""; // Limpiar errores internos
    },
    // Se ejecuta al enviar el formulario
    handleSubmit() {
      this.internalErrorMessage = ""; // Limpiar errores previos
      // Validación básica interna
      if (!this.formData.subject) {
        this.internalErrorMessage =
          "El nombre de la asignatura no puede estar vacío.";
        return; // Detener si falla validación interna
      }
      // Si la validación pasa, emite el evento 'save' con los datos actuales del formulario
      console.log("SubjectForm: Emitting save event with data:", {
        ...this.formData,
      });
      // Emitimos una copia para evitar mutaciones inesperadas
      this.$emit("save", { ...this.formData });
    },
    // Se ejecuta al pulsar Cancelar
    handleCancel() {
      console.log("SubjectForm: Emitting cancel event");
      this.$emit("cancel");
    },
    // Pone el foco en el input (útil al abrir el form)
    focusInput() {
      // $nextTick asegura que el elemento exista en el DOM antes de intentar enfocarlo
      this.$nextTick(() => {
        this.$refs.subjectNameInputRef?.focus(); // ?. es optional chaining
      });
    },
  },
  watch: {
    // Observa cambios en la prop initialSubject por si el padre cambia
    // la asignatura a editar sin destruir/recrear el componente.
    initialSubject: {
      handler() {
        this.initializeForm();
        // Si cambiamos a modo edición, ponemos foco
        if (this.isEditMode) {
          this.focusInput();
        }
      },
      immediate: true, // Ejecuta el handler inmediatamente al crear el componente
      deep: true, // Necesario si comparamos objetos
    },
  },
  mounted() {
    // Poner foco automáticamente al montar si estamos en modo Añadir
    if (!this.isEditMode) {
      this.focusInput();
    }
  },
};
</script>

<style scoped>
/* Estilos básicos (puedes añadir más) */
.card {
  max-width: 500px; /* O el ancho que prefieras */
  margin-bottom: 1.5rem;
}
.text-end {
  text-align: right;
}
.me-2 {
  margin-right: 0.5rem !important;
}
</style>
