<!-- frontend/src/components/users/AssignSubject.vue -->

<template>
  <div class="assign-modal-backdrop" @click.self="closeModal">
    <div class="assign-modal-content">
      <h3>
        Asignar Asignatura a {{ student?.name }} {{ student?.surname }}
        <span v-if="student?.id">(ID: {{ student.id }})</span>
      </h3>
      <hr />

      <div>
        <div v-if="isLoadingProfessorSubjects" class="alert alert-info">
          Cargando asignaturas disponibles...
        </div>

        <div v-if="assignErrorMessage" class="alert alert-danger">
          {{ assignErrorMessage }}
        </div>

        <form
          @submit.prevent="submitAssignment"
          v-if="!isLoadingProfessorSubjects && !assignErrorMessage"
        >
          <div class="mb-3">
            <label for="subjectSelectModal" class="form-label"
              >Selecciona la asignatura:</label
            >
            <select
              class="form-select"
              id="subjectSelectModal"
              v-model="selectedSubjectId"
              required
            >
              <option :value="null" disabled>
                -- Seleccione una asignatura --
              </option>
              <option v-if="professorSubjects.length === 0" disabled>
                (No hay asignaturas disponibles para este profesor)
              </option>
              <option
                v-for="subj in professorSubjects"
                :key="subj.id"
                :value="subj.id"
              >
                {{ subj.subject }}
              </option>
            </select>
          </div>

          <div class="mt-4 text-end">
            <button
              type="button"
              class="btn btn-secondary me-2"
              @click="closeModal"
              :disabled="isAssigning"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="
                selectedSubjectId === null ||
                isAssigning ||
                professorSubjects.length === 0
              "
            >
              <span
                v-if="isAssigning"
                class="spinner-border spinner-border-sm"
              ></span>
              {{ isAssigning ? "Asignando..." : "Confirmar Asignación" }}
            </button>
          </div>
        </form>

        <div
          class="text-end mt-3"
          v-if="
            !isLoadingProfessorSubjects &&
            assignErrorMessage &&
            professorSubjects.length === 0
          "
        >
          <button class="btn btn-secondary" @click="closeModal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UsersService from "@/services/users/UsersService";
import RelationService from "@/services/relations/RelationService";

export default {
  name: "AssignSubject",
  props: {
    student: {
      type: Object,
      required: true,
      default: () => ({ id: null, name: "Desconocido", surname: "" }),
    },
    // ID del profesor logueado. Requerido.
    professorId: {
      type: Number,
      required: true,
    },
  },
  emits: ["close", "assign-success"],
  data() {
    return {
      // Estado interno del modal
      professorSubjects: [],
      isLoadingProfessorSubjects: false, //
      selectedSubjectId: null,
      isAssigning: false,
      assignErrorMessage: "",
    };
  },
  methods: {
    closeModal() {
      console.log("AssignSubject: Emitiendo evento close");
      this.$emit("close");
    },

    // Busca las asignaturas que imparte el profesor logueado
    async fetchProfessorSubjects() {
      if (!this.professorId) {
        this.assignErrorMessage =
          "Error interno: No se proporcionó ID del profesor.";
        console.error(this.assignErrorMessage);
        return;
      }
      console.log(
        `AssignSubject: Buscando asignaturas para profesor ID ${this.professorId}`
      );
      this.isLoadingProfessorSubjects = true;
      this.assignErrorMessage = "";
      this.professorSubjects = []; // Limpiar antes de cargar

      try {
        // Llama a la función del servicio de usuario que creamos
        const response = await UsersService.getProfessorSubjectList(
          this.professorId
        );
        if (response && response.success) {
          // Asigna la lista de asignaturas
          this.professorSubjects = response.subjects;
          console.log(
            "AssignSubject: Asignaturas del profesor cargadas:",
            this.professorSubjects
          );
          if (this.professorSubjects.length === 0) {
            console.warn(
              "AssignSubject: El profesor no tiene asignaturas asociadas."
            );
          }
        } else {
          // Si la API devuelve success: false
          this.assignErrorMessage =
            response.message || "Error al cargar las asignaturas del profesor.";
        }
      } catch (error) {
        // Error en la llamada API
        console.error("AssignSubject: Error en fetchProfessorSubjects:", error);
        this.assignErrorMessage =
          error.response?.data?.message ||
          error.message ||
          "Ocurrió un error al cargar las asignaturas.";
      } finally {
        this.isLoadingProfessorSubjects = false;
      }
    },

    // Maneja el envío del formulario de asignación
    async submitAssignment() {
      // Validación básica
      if (this.selectedSubjectId === null) {
        this.assignErrorMessage =
          "Por favor, selecciona una asignatura para asignar.";
        return;
      }
      if (!this.student || !this.student.id) {
        this.assignErrorMessage =
          "Error interno: No se especificó el estudiante.";
        return;
      }
      if (!this.professorId) {
        this.assignErrorMessage = "Error interno: Falta ID del profesor.";
        return;
      }

      this.isAssigning = true;
      this.assignErrorMessage = "";

      try {
        // Prepara los datos para el servicio addRelation
        const relationData = {
          studentId: this.student.id,
          subjectId: this.selectedSubjectId,
          teacherId: this.professorId,
        };
        console.log(
          "AssignSubject: Enviando datos de asignación:",
          relationData
        );

        // Llama al servicio de relaciones
        const response = await RelationService.addRelation(relationData);

        if (response && response.success) {
          alert(
            `Asignatura asignada correctamente al alumno ${this.student.name}.`
          );
          this.$emit("assign-success");
          this.closeModal();
        } else {
          this.assignErrorMessage =
            response.message || "El backend indicó un error al asignar.";
        }
      } catch (error) {
        // Error en la llamada API
        console.error("AssignSubject: Error al asignar asignatura:", error);
        this.assignErrorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error desconocido al asignar la asignatura.";
      } finally {
        this.isAssigning = false;
      }
    },
  },
  mounted() {
    this.fetchProfessorSubjects();
  },
};
</script>

<style scoped>
.assign-modal-backdrop {
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

.assign-modal-content {
  background-color: white;
  padding: 25px 30px;
  border-radius: 8px;
  min-width: 350px;
  max-width: 500px;
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
