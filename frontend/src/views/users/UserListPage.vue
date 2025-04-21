<!-- frontend/src/views/users/UserListPage.vue -->

<template>
  <div class="user-list container mt-4">
    <h2>Lista de Alumnos</h2>
    <div class="search-container input-group mb-3">
      <input
        type="text"
        v-model="searchQuery"
        @keyup.enter="searchUsers"
        placeholder="Buscar alumno por nombre o correo..."
        class="form-control search-input"
        aria-label="Buscar alumno"
      />
      <button
        @click="searchUsers"
        class="btn btn-outline-primary search-button"
        type="button"
      >
        <i class="bi bi-search"></i> Buscar
      </button>
      <button
        v-if="isSearchResults"
        @click="loadInitialStudents"
        class="btn btn-outline-secondary"
        type="button"
        title="Mostrar todos"
      >
        <i class="bi bi-x-lg"></i> Limpiar
      </button>
    </div>
    <div v-if="loading" class="alert alert-info">
      <span
        class="spinner-border spinner-border-sm"
        role="status"
        aria-hidden="true"
      ></span>
      Cargando usuarios...
    </div>
    <div v-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>
    <div v-if="!loading && !errorMessage">
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Apellidos</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="users.length === 0">
            <td colspan="5" class="text-center fst-italic">
              {{
                isSearchResults
                  ? "No se encontraron alumnos con esos criterios."
                  : "No hay alumnos registrados."
              }}
            </td>
          </tr>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.surname }}</td>
            <td>{{ user.email }}</td>
            <td>
              <button
                class="btn btn-sm btn-success"
                @click="openAssignModal(user)"
                :disabled="showAssignModal"
              >
                <i class="bi bi-journal-plus"></i> Asignar Asignatura
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="showAssignModal" class="assign-modal-backdrop">
      <div class="assign-modal-content">
        <h3>
          Asignar Asignatura a {{ studentToAssign?.name }}
          {{ studentToAssign?.surname }}
        </h3>
        <hr />

        <div v-if="isLoadingProfessorSubjects">
          Cargando asignaturas del profesor...
        </div>
        <div v-if="assignErrorMessage" class="alert alert-danger">
          {{ assignErrorMessage }}
        </div>

        <div v-if="!isLoadingProfessorSubjects && !assignErrorMessage">
          <form @submit.prevent="submitAssignment">
            <div class="mb-3">
              <label for="subjectSelect" class="form-label"
                >Selecciona la asignatura:</label
              >
              <select
                class="form-select"
                id="subjectSelect"
                v-model="selectedSubjectId"
                required
              >
                <option :value="null" disabled>
                  -- Seleccione una asignatura --
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

            <p
              v-if="selectedSubjectId !== null"
              style="font-size: 0.8em; color: grey"
            >
              ID Seleccionado: {{ selectedSubjectId }}
            </p>

            <div class="mt-3">
              <button
                type="submit"
                class="btn btn-primary me-2"
                :disabled="selectedSubjectId === null || isAssigning"
              >
                <span
                  v-if="isAssigning"
                  class="spinner-border spinner-border-sm"
                ></span>
                {{ isAssigning ? "Asignando..." : "Confirmar Asignación" }}
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeAssignModal"
                :disabled="isAssigning"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
        <div v-else-if="!isLoadingProfessorSubjects && assignErrorMessage">
          <button class="btn btn-secondary" @click="closeAssignModal">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UsersService from "@/services/users/UsersService";
import RelationService from "@/services/relations/RelationService";
import { jwtDecode } from "jwt-decode";

export default {
  name: "UserListPage",
  data() {
    return {
      users: [],
      searchQuery: "",
      errorMessage: "",
      loading: false,
      isSearchResults: false,
      showAssignModal: false,
      studentToAssign: null,
      professorSubjects: [],
      isLoadingProfessorSubjects: false,
      selectedSubjectId: null,
      isAssigning: false,
      assignErrorMessage: "",
    };
  },
  methods: {
    // Método para que la lista no aparezca vacia
    async loadInitialStudents() {
      this.loading = true;
      this.errorMessage = "";
      this.users = [];
      this.searchQuery = ""; // Limpia la búsqueda
      this.isSearchResults = false; // Marcar que no son resultados de búsqueda
      try {
        // Llama a la nueva función del servicio de usuarios
        const response = await UsersService.getStudents();
        if (response && response.success) {
          this.users = response.students; // Asigna la lista de alumnos
        } else {
          this.errorMessage =
            response.message || "Error al cargar la lista de alumnos.";
        }
      } catch (error) {
        console.error("Error al cargar alumnos:", error);
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Ocurrió un error al cargar los alumnos.";
      } finally {
        this.loading = false;
      }
    },

    async searchUsers() {
      if (!this.searchQuery.trim()) {
        this.errorMessage = "Por favor, ingresa un término de búsqueda.";
        this.loadInitialStudents();
        return;
      }

      this.loading = true;
      this.errorMessage = "";
      this.users = [];
      this.isSearchResults = true;

      try {
        const response = await UsersService.searchUsers(this.searchQuery);
        if (response.success) {
          // Filtramos para mostrar solo alumnos en los resultados de búsqueda también
          // Asegúrate que el ID de rol de alumno es 1
          this.users = response.users.filter((user) => user.rol === 1);
          if (this.users.length === 0) {
            this.errorMessage =
              "No se encontraron alumnos con los criterios de búsqueda proporcionados.";
          }
        } else {
          this.errorMessage =
            response.message || "Error al buscar los usuarios.";
        }
      } catch (error) {
        console.error("Error al buscar usuarios:", error);
        this.errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Ocurrió un error al buscar los usuarios.";
      } finally {
        this.loading = false;
      }
    },

    async openAssignModal(student) {
      this.studentToAssign = student;
      this.assignErrorMessage = "";
      this.professorSubjects = [];
      this.selectedSubjectId = null;
      this.isLoadingProfessorSubjects = true;
      this.showAssignModal = true; // Muestra el modal

      try {
        // Obtener ID del profesor logueado desde el token
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token no encontrado");
        const decodedToken = jwtDecode(token);
        const professorId = decodedToken.id;

        if (!professorId)
          throw new Error("No se pudo obtener el ID del profesor del token");

        // Llama al servicio para obtener las asignaturas de ESE profesor
        const response = await UsersService.getProfessorSubjectList(
          professorId
        );

        if (response && response.success) {
          console.warn("Respuesta de getSubjectsTeacher:", response.subjects);
          this.professorSubjects = response.subjects;
          if (
            response.subjects.length > 0 &&
            typeof response.subjects[0].id === "undefined"
          ) {
            console.error(
              "getSubjectsTeacher no devuelve ID de asignatura, se necesita ajustar backend/servicio o usar otra llamada."
            );
            this.assignErrorMessage =
              "Error: No se pudo obtener la lista completa de asignaturas del profesor.";
            this.professorSubjects = []; // Vacío
            // *** Simulación temporal para ver el modal ***
            this.professorSubjects = response.subjects.map((s, index) => ({
              id: index + 1000,
              subject: s.subject,
            })); // QUITAR ESTO LUEGO
          } else {
            this.professorSubjects = response.subjects; // Si ya devuelve id y subject/name, esto estaría bien
          }
        } else {
          this.assignErrorMessage =
            response.message || "Error al cargar las asignaturas del profesor.";
        }
      } catch (error) {
        console.error("Error en openAssignModal:", error);
        this.assignErrorMessage =
          error.response?.data?.message ||
          error.message ||
          "Ocurrió un error al preparar la asignación.";
      } finally {
        this.isLoadingProfessorSubjects = false; // Termina la carga
      }
    },
    closeAssignModal() {
      this.showAssignModal = false;
      this.studentToAssign = null;
      this.professorSubjects = [];
      this.selectedSubjectId = null;
      this.assignErrorMessage = "";
      this.isAssigning = false;
    },

    // Método para manejar el envío del formulario
    async submitAssignment() {
      console.log("Submit assignment triggered!");
      this.assignErrorMessage = "";

      if (this.selectedSubjectId === null || !this.studentToAssign) {
        this.assignErrorMessage = "Por favor, selecciona una asignatura.";
        return;
      }

      this.isAssigning = true; // Iniciar estado de carga

      try {
        // Obtener ID del profesor logueado desde el token
        const token = localStorage.getItem("token");
        if (!token)
          throw new Error(
            "Token no encontrado. Por favor, inicia sesión de nuevo."
          );
        const decodedToken = jwtDecode(token);
        const professorId = decodedToken.id;
        if (!professorId)
          throw new Error("No se pudo obtener el ID del profesor del token.");

        const relationData = {
          studentId: this.studentToAssign.id,
          subjectId: this.selectedSubjectId,
          teacherId: professorId,
        };

        console.log("Enviando datos de asignación al backend:", relationData);

        const response = await RelationService.addRelation(relationData);

        console.log("Respuesta del backend a addRelation:", response);

        // Maneja la respuesta del backend
        if (response && response.success) {
          alert(
            `Asignatura asignada correctamente al alumno ${this.studentToAssign.name}.`
          );
          this.closeAssignModal();
        } else {
          this.assignErrorMessage =
            response.message || "El backend indicó un error al asignar.";
        }
      } catch (error) {
        // Error en la llamada API
        console.error("Error al asignar asignatura:", error);
        // Intenta mostrar el mensaje de error específico del backend si existe
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
    console.log("UserListPage montado. Cargando lista inicial de alumnos...");
    this.loadInitialStudents();
  },
};
</script>

<style scoped>
.user-list {
  max-width: 1000px;
  margin: 20px auto;
  text-align: center;
  padding: 20px;
}

.search-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.search-button {
  padding: 10px 15px;
  border: none;
  background-color: #007bff;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
}

.search-button:hover {
  background-color: #0056b3;
}

.error-message {
  color: red;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

thead {
  background-color: #f2f2f2;
}

th,
td {
  padding: 12px 15px;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid #ddd;
}

.edit-button {
  padding: 5px 10px;
  cursor: pointer;
  background-color: #28a745;
  color: #fff;
  border: none;
  border-radius: 4px;
}

.edit-button:hover {
  background-color: #218838;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #f1f1f1;
}

.table th:first-child,
.table td:first-child {
  width: 5%;
}

.table th:last-child,
.table td:last-child {
  width: 25%;
  text-align: center;
}
.assign-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050; /* Asegura que esté por encima de otros elementos */
}

.assign-modal-content {
  background-color: white;
  padding: 20px 30px;
  border-radius: 8px;
  min-width: 400px; /* Ancho mínimo */
  max-width: 600px; /* Ancho máximo */
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}
</style>
