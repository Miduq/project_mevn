<!-- src/views/DashboardPage.vue -->

<template>
  <div class="dashboard-container">
    <!-- Botón de logout en la esquina superior derecha -->
    <div class="top-right">
      <b-button variant="danger" @click="logout">
        <span class="material-icons">logout</span>
        Logout
      </b-button>
    </div>

    <h2 class="text-center">
      Bienvenido, {{ userData.name }} (Rol: {{ userData.rolName }})
    </h2>

    <!-- Tabla para alumno -->
    <div v-if="isAlumno">
      <h3>Lista de Profesores y Asignaturas</h3>
      <b-table :items="professors" :fields="fieldsAlumno" striped hover>
        <template #cell(subject)="data">
          {{ data.item.subject }}
        </template>
      </b-table>
    </div>

    <!-- Tabla para profesor -->
    <div v-else-if="isProfesor">
      <h3>Lista de Alumnos y Asignaturas</h3>
      <b-table :items="students" :fields="fieldsProfesor" striped hover>
      </b-table>
    </div>
  </div>
</template>

<script>
import AuthService from "@/services/auth/AuthService";
import RelationService from "@/services/relations/RelationService";

export default {
  name: "DashboardPage",
  data() {
    return {
      userData: {
        id: null,
        name: "",
        surname: "",
        email: "",
        rol: null, // 1 => Alumno, 2 => Profesor
        rolName: "", // "alumno" o "profesor"
      },
      // Tabla para alumnos: Profesores que le imparten clase
      professors: [],
      fieldsAlumno: [
        { key: "name", label: "Nombre" },
        { key: "surname", label: "Apellidos" },
        { key: "email", label: "Email" },
        { key: "subject", label: "Asignatura" },
      ],
      // Tabla para profesores: Alumnos que imparte
      students: [],
      fieldsProfesor: [
        { key: "name", label: "Nombre" },
        { key: "surname", label: "Apellidos" },
        { key: "email", label: "Email" },
        { key: "subject", label: "Asignatura" },
      ],
    };
  },
  computed: {
    isAlumno() {
      // Rol 1 => Alumno
      return this.userData.rol === 1;
    },
    isProfesor() {
      // Rol 2 => Profesor
      return this.userData.rol === 2;
    },
  },
  async created() {
    console.log("DashboardPage creado");

    // Obtener los datos del usuario actual
    await this.fetchUserData();

    // Cargar los datos correspondientes según el rol
    if (this.isAlumno) {
      this.fetchMyProfessors();
    } else if (this.isProfesor) {
      this.fetchMyStudents();
    }
  },
  methods: {
    async fetchUserData() {
      try {
        const data = await AuthService.getMe();
        if (data.success) {
          this.userData = data.user;
          // Asignar rolName basado en el ID numérico
          if (this.userData.rol === 1) this.userData.rolName = "alumno";
          else if (this.userData.rol === 2) this.userData.rolName = "profesor";
          else this.userData.rolName = "desconocido";
          console.log("Usuario obtenido:", this.userData);
        } else {
          console.error(
            "Error al obtener datos del usuario (backend):",
            data.message
          );
          this.logout(); // Llama al método de logout si falla
        }
      } catch (error) {
        console.error(
          "Error de red/servicio al obtener datos del usuario:",
          error
        );
        this.logout(); // Llama al método de logout si falla
      }
    },
    async fetchMyProfessors() {
      if (!this.userData.id) return;
      try {
        const studentId = this.userData.id;
        const data = await RelationService.getMyProfessors(studentId);
        if (data.success) {
          this.professors = data.professors;
          console.log("Profesores obtenidos:", this.professors);
        } else {
          console.error("Error al obtener profesores:", data.message);
        }
      } catch (error) {
        console.error("Error de red/servicio al obtener profesores:", error);
      }
    },
    async fetchMyStudents() {
      if (!this.userData.id) return;
      try {
        const teacherId = this.userData.id;
        const data = await RelationService.getMyStudents(teacherId);

        if (data.success) {
          this.students = data.students;
          console.log("Alumnos obtenidos:", this.students);
        } else {
          console.error("Error al obtener alumnos:", data.message);
        }
      } catch (error) {
        console.error("Error de red/servicio al obtener alumnos:", error);
      }
    },
    logout() {
      AuthService.logout(); // Llama a la función logout del servicio
      this.$router.push("/");
    },
  },
};
</script>

<style scoped>
.dashboard-container {
  position: relative;
  padding: 20px;
}

.top-right {
  position: absolute;
  right: 20px;
  top: 20px;
}

.material-icons {
  vertical-align: middle;
  margin-right: 5px;
}
</style>
