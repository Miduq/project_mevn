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

        <h2 class="text-center">Bienvenido, {{ userData.name }} (Rol: {{ userData.rolName }})</h2>

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
import apiClient from '../../services/apiService';

export default {
    name: "DashboardPage",
    data() {
        return {
            userData: {
                id: null,
                name: '',
                surname: '',
                email: '',
                rol: null,   // 1 => Alumno, 2 => Profesor
                rolName: ''  // "alumno" o "profesor"
            },
            // Tabla para alumnos: Profesores que le imparten clase
            professors: [],
            fieldsAlumno: [
                { key: 'name', label: 'Nombre' },
                { key: 'surname', label: 'Apellidos' },
                { key: 'email', label: 'Email' },
                { key: 'subject', label: 'Asignatura' }
            ],
            // Tabla para profesores: Alumnos que imparte
            students: [],
            fieldsProfesor: [
                { key: 'name', label: 'Nombre' },
                { key: 'surname', label: 'Apellidos' },
                { key: 'email', label: 'Email' },
                { key: 'subject', label: 'Asignatura' },
            ]
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
        }
    },
    async created() {
        console.log('DashboardPage creado');

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
                const response = await apiClient.get('/auth/me');
                if (response.data.success) {
                    this.userData = response.data.user;
                    this.userData.rolName = (this.userData.rol === 1) ? 'alumno' : 'profesor';
                    console.log('Usuario obtenido:', this.userData);
                } else {
                    console.error('Error al obtener datos del usuario:', response.data.message);
                    this.$router.push('/');
                }
            } catch (error) {
                console.error('Error al obtener datos del usuario:', error);
                this.$router.push('/');
            }
        },
        async fetchMyProfessors() {
            try {
                const studentId = this.userData.id;
                const response = await apiClient.get(`/relations/my-professors/${studentId}`);
                if (response.data.success) {
                    // Añadir id_teacher, id_student y id_subject a cada profesor para futuras operaciones
                    this.professors = response.data.professors.map(prof => ({
                        ...prof,
                        id_teacher: prof.id_teacher, // Asegúrate de que el backend retorna estos campos
                        id_student: prof.id_student,
                        id_subject: prof.id_subject
                    }));
                    console.log('Profesores obtenidos:', this.professors);
                } else {
                    console.error('Error al obtener profesores:', response.data.message);
                }
            } catch (error) {
                console.error('Error al obtener profesores:', error);
            }
        },

        async fetchMyStudents() {
            try {
                const teacherId = this.userData.id;
                const response = await apiClient.get(`/relations/my-students/${teacherId}`);
                if (response.data.success) {
                    // Añadir id_teacher, id_student y id_subject a cada alumno para futuras operaciones
                    this.students = response.data.students.map(student => ({
                        ...student,
                        id_teacher: student.id_teacher, // Asegúrate de que el backend retorna estos campos
                        id_student: student.id_student,
                        id_subject: student.id_subject
                    }));
                    console.log('Alumnos obtenidos:', this.students);
                } else {
                    console.error('Error al obtener alumnos:', response.data.message);
                }
            } catch (error) {
                console.error('Error al obtener alumnos:', error);
            }
        },
        
        logout() {
            // Borrar el token y redirigir al inicio
            localStorage.removeItem("token");
            this.$router.push('/');
            console.log('Usuario ha cerrado sesión');
        }
    }
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
