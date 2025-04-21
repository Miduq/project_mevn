import { response } from 'express';
<!-- frontend/src/views/subjects/SubjectManagementPage.vue -->

<template>
  <div class="subject-management container mt-4">
    <h1>Gestión de Asignaturas</h1>
    <p>Aquí podrás crear, ver, editar y eliminar asignaturas.</p>

    <div class="mb-3">
      <button
        v-if="!showAddForm && !editingSubject"
        @click="openAddForm"
        class="btn btn-primary"
      >
        <i class="bi bi-plus-circle"></i> Añadir Nueva Asignatura
      </button>

      <div v-if="showAddForm" class="card mt-2 mb-4">
        <div class="card-body">
          <h5 class="card-title">Nueva Asignatura</h5>
          <form @submit.prevent="addSubject">
            <div class="mb-3">
              <label for="newSubjectName" class="form-label">Nombre:</label>
              <input
                type="text"
                class="form-control"
                id="newSubjectName"
                v-model.trim="newSubjectName"
                required
              />
            </div>
            <div v-if="createErrorMessage" class="alert alert-danger mt-2 p-2">
              {{ createErrorMessage }}
            </div>
            <button
              type="submit"
              class="btn btn-success me-2"
              :disabled="isCreating"
            >
              <span
                v-if="isCreating"
                class="spinner-border spinner-border-sm"
              ></span>
              {{ isCreating ? "Guardando..." : "Guardar" }}
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              @click="cancelAddForm"
              :disabled="isCreating"
            >
              Cancelar
            </button>
          </form>
        </div>
      </div>

      <div v-if="editingSubject" class="card mt-2 mb-4 border-warning">
        <div class="card-body">
          <h5 class="card-title">
            Editando Asignatura: {{ editingSubject.subject }} (ID:
            {{ editingSubject.id }})
          </h5>
          <form @submit.prevent="submitUpdateSubject">
            <div class="mb-3">
              <label for="editSubjectName" class="form-label"
                >Nuevo Nombre:</label
              >
              <input
                type="text"
                class="form-control"
                id="editSubjectName"
                v-model.trim="editSubjectName"
                required
              />
            </div>
            <div v-if="updateErrorMessage" class="alert alert-danger mt-2 p-2">
              {{ updateErrorMessage }}
            </div>
            <button
              type="submit"
              class="btn btn-success me-2"
              :disabled="isUpdating"
            >
              <span
                v-if="isUpdating"
                class="spinner-border spinner-border-sm"
              ></span>
              {{ isUpdating ? "Actualizando..." : "Actualizar" }}
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              @click="cancelEditForm"
              :disabled="isUpdating"
            >
              Cancelar
            </button>
          </form>
        </div>
      </div>
    </div>
    <div v-if="isLoading" class="alert alert-info">Cargando asignaturas...</div>
    <div v-if="listErrorMessage" class="alert alert-danger">
      {{ listErrorMessage }}
    </div>

    <div v-if="!isLoading && !listErrorMessage">
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre Asignatura</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="subjects.length === 0">
            <td colspan="3" class="text-center">
              No hay asignaturas para mostrar.
            </td>
          </tr>
          <tr v-for="subject in subjects" :key="subject.id">
            <td>{{ subject.id }}</td>
            <td>{{ subject.subject }}</td>
            <td>
              <button
                class="btn btn-sm btn-warning me-2"
                @click="openEditForm(subject)"
                :disabled="isCreating || !!editingSubject"
              >
                <i class="bi bi-pencil"></i> Editar
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="deleteSubject(subject.id)"
                :disabled="isCreating || !!editingSubject"
              >
                <i class="bi bi-trash"></i> Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import SubjectService from "@/services/subjects/SubjectService";

export default {
  name: "SubjectManagementPage",
  data() {
    return {
      subjects: [],
      isLoading: false,
      listErrorMessage: "",
      showAddForm: false,
      newSubjectName: "",
      isCreating: false,
      createErrorMessage: "",
      editingSubject: null,
      editSubjectName: "",
      isUpdating: false,
      updateErrorMessage: "",
      isDeleting: false,
    };
  },
  methods: {
    // Método para cargar las asignaturas desde el backend
    async loadSubjects() {
      this.isLoading = true;
      this.listErrorMessage = "";
      try {
        const response = await SubjectService.getAllSubjects();

        if (response && response.success) {
          this.subjects = response.subjects;
        } else {
          // Si la API devuelve success: false o una respuesta inesperada
          this.listErrorMessage =
            response.message || "No se pudieron cargar las asignaturas.";
        }
      } catch (error) {
        // Si ocurre un error en la llamada
        console.error("Error al cargar asignaturas en la página:", error);
        // Intenta obtener el mensaje de error específico del backend
        this.listErrorMessage =
          error.response?.data?.message ||
          error.message ||
          "Ocurrió un error al cargar las asignaturas.";
      } finally {
        this.isLoading = false;
      }
    },
    // Método para crear una nueva asignatura
    openAddForm() {
      this.showAddForm = true;
      this.newSubjectName = "";
      this.createErrorMessage = "";
    },
    cancelAddForm() {
      this.showAddForm = false;
      this.newSubjectName = "";
      this.createErrorMessage = "";
    },
    async addSubject() {
      if (!this.newSubjectName) {
        this.createErrorMessage = "El nombre de la asignatura es obligatorio.";
        return;
      }

      this.isCreating = true;
      this.createErrorMessage = "";

      try {
        const newSubjectData = { subject: this.newSubjectName };
        const createdSubject = await SubjectService.createSubject(
          newSubjectData
        );
        console.LoginPageVue("Asignatura creada:", createdSubject);
        alert(`Asignatura "${createdSubject.subject}" creada con éxito.`);

        // Si tiene éxito se limpia el formulario
        this.newSubjectName = "";
        this.showAddForm = false;
        await this.loadSubjects(); // Recargar la lista de asignaturas
      } catch (error) {
        console.error("Error al crear asignatura:", error);
        this.createErrorMessage =
          error.response?.data?.message ||
          error.message ||
          "Ocurrió un error al crear la asignatura.";
      } finally {
        this.isCreating = false;
      }
    },

    // Método para editar una asignatura
    openEditForm(subjectToEdit) {
      this.showAddForm = false;
      this.editingSubject = { ...subjectToEdit };
      this.editSubjectName = subjectToEdit.subject;
      this.updateErrorMessage = "";
    },
    cancelEditForm() {
      this.editingSubject = null;
      this.editSubjectName = "";
      this.updateErrorMessage = "";
    },
    async submitUpdateSubject() {
      if (!this.editSubjectName) {
        this.updateErrorMessage = "El nombre de la asignatura es obligatorio.";
        return;
      }
      if (!this.editingSubject || !this.editingSubject.id) {
        this.updateErrorMessage = "No se puede actualizar la asignatura.";
        return;
      }
      this.isUpdating = true;
      this.updateErrorMessage = "";

      try {
        const subjectData = { subject: this.editSubjectName };
        const response = await SubjectService.updateSubject(
          this.editingSubject.id,
          subjectData
        );

        if (response.success) {
          alert(
            `Asignatura ID ${this.editingSubject.id} actualizada con éxito.`
          );
          this.cancelEditForm();
          await this.loadSubjects();
        } else {
          this.updateErrorMessage =
            response.message || "No se pudo actualizar la asignatura.";
        }
      } catch (error) {
        console.Error(
          `Error al actualizar asignatura ${this.editingSubject.id}:`,
          error
        );
        this.updateErrorMessage =
          error.response?.data?.message ||
          error.message ||
          "Ocurrió un error al actualizar la asignatura.";
      } finally {
        this.isUpdating = false;
      }
    },

    // Método para eliminar una asignatura
    async deleteSubject(subjectId) {
      if (!subjectId) return;
      if (
        !window.confirm(
          `¿Estás seguro de que quieres eliminar la asignatura con ID ${subjectId}? Esta acción no se puede deshacer.`
        )
      ) {
        return;
      }
      this.isDeleting = true; // Marcar como eliminando
      try {
        const response = await SubjectService.deleteSubject(subjectId);

        if (response.success) {
          alert(`Asignatura ID ${subjectId} eliminada con éxito.`);
          await this.loadSubjects(); // Recarga la lista para quitar la eliminada
        } else {
          // Muestra el error que viene del backend
          alert(
            `Error al eliminar: ${response.message || "Error desconocido."}`
          );
          this.listErrorMessage = response.message; // Muestra error en la zona de lista
        }
      } catch (error) {
        console.error(`Error al eliminar asignatura ${subjectId}:`, error);
        // Muestra el error en la zona de lista o en un alert
        const message =
          error.response?.data?.message ||
          error.message ||
          "Error desconocido al eliminar.";
        alert(`Error al eliminar: ${message}`);
        this.listErrorMessage = message;
      } finally {
        this.isDeleting = false; // Desmarcar al finalizar
      }
    },
  },
  mounted() {
    console.log("SubjectManagementPage montado. Cargando asignaturas...");
    this.loadSubjects();
  },
};
</script>

<style scoped>
.subject-management {
  padding: 20px;
}
.alert {
  margin-top: 15px;
}
.me-2 {
  margin-right: 0.5rem !important;
}
.card {
  max-width: 500px;
}
.table {
  margin-top: 1.5rem;
}
</style>
