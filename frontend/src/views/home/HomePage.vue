<!-- frontend/src/views/dashboard/DashboardPage.vue -->

<template>
  <div class="dashboard-container container mt-4">
    <div class="top-right">
      <b-button variant="danger" @click="logoutAndRedirect()"> <i class="bi bi-box-arrow-right"></i> Logout </b-button>
    </div>

    <h2 class="text-center mb-4">Bienvenido, {{ userData?.name || 'Usuario' }} (Rol: {{ rolName }})</h2>

    <div v-if="isLoadingUser" class="text-center mt-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando datos de usuario...</span>
      </div>
    </div>
    <div v-else-if="userError" class="alert alert-danger">
      Error al cargar datos del usuario: {{ userError }}
      <p class="small mb-0">Intenta recargar o contacta con soporte.</p>
    </div>

    <div v-else-if="userData?.id">
      <div v-if="isAlumno">
        <h3>Mis Profesores y Asignaturas</h3>
        <div v-if="isLoadingProfessors" class="text-center mt-3 text-muted">Cargando profesores...</div>
        <div v-else-if="professorsError" class="alert alert-warning mt-3">
          {{ professorsError }}
        </div>
        <b-table
          v-else
          :items="professors"
          :fields="fieldsAlumno"
          striped
          hover
          responsive="sm"
          empty-text="No tienes asignaturas o profesores asignados."
          show-empty
          class="mt-3"
        >
        </b-table>
      </div>

      <div v-else-if="isProfesor">
        <h3>Mis Alumnos y Asignaturas Impartidas</h3>
        <div v-if="isLoadingStudents" class="text-center mt-3 text-muted">Cargando alumnos...</div>
        <div v-else-if="studentsError" class="alert alert-warning mt-3">{{ studentsError }}</div>
        <b-table
          v-else
          :items="students"
          :fields="fieldsProfesor"
          striped
          hover
          responsive="sm"
          empty-text="No tienes alumnos asignados."
          show-empty
          class="mt-3"
        >
          <template #cell(actions)="data">
            <b-button
              size="sm"
              variant="warning"
              class="me-1"
              @click="editStudent(data.item)"
              title="Editar Alumno"
              :disabled="isUpdatingStudent || isDeletingStudentId === data.item.studentId"
            >
              <i class="bi bi-pencil"></i>
            </b-button>
            <b-button
              size="sm"
              variant="danger"
              @click="deleteStudent(data.item)"
              :disabled="isUpdatingStudent || isDeletingStudentId === data.item.studentId"
              title="Eliminar/Desactivar Alumno"
            >
              <span
                v-if="isDeletingStudentId === data.item.studentId"
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <i v-else class="bi bi-person-x-fill"></i>
            </b-button>
          </template>
        </b-table>
      </div>

      <div v-else>
        <p class="text-center text-muted mt-3">Panel principal.</p>
      </div>
    </div>

    <EditStudent
      v-if="showEditStudentModal"
      :student="studentToEdit"
      :isLoading="isUpdatingStudent"
      :errorMessage="editErrorMessage"
      @close="handleEditModalClose"
      @save="handleEditModalSave"
    />
  </div>
</template>

<script setup>
// 1. Imports
import { ref, computed, onMounted, watch } from 'vue';
import AuthService from '@/services/auth/AuthService';
import RelationService from '@/services/relations/RelationService';
import UsersService from '@/services/users/UsersService';
import EditStudent from '@/components/users/EditStudent.vue';
import { useFetchData } from '@/composables/useFetchData';
import { useAuth } from '@/composables/useAuth';

// 2. Setup inicial
const { logoutAndRedirect } = useAuth();

// 3. Estado y Carga de Datos del Usuario Logueado
const {
  data: userData,
  isLoading: isLoadingUser,
  error: userError,
  execute: fetchUserData,
} = useFetchData(AuthService.getMe, { initialData: null, dataKey: 'user' });

onMounted(fetchUserData); // Cargar datos del usuario al montar

// 4. Propiedades computadas para rol
const isAlumno = computed(() => userData.value?.rol === 1);
const isProfesor = computed(() => userData.value?.rol === 2);
const rolName = computed(() => {
  if (isLoadingUser.value) return 'Cargando...';
  if (!userData.value) return 'Desconocido';
  if (isAlumno.value) return 'Alumno';
  if (isProfesor.value) return 'Profesor';
  return 'Desconocido';
});

// 5. Estado y Carga de Datos Específicos del Rol (usando useFetchData)
const {
  data: professors,
  isLoading: isLoadingProfessors,
  error: professorsError,
  execute: fetchMyProfessors,
} = useFetchData((studentId) => RelationService.getMyProfessors(studentId), {
  initialData: [],
  dataKey: 'professors',
});

const {
  data: students,
  isLoading: isLoadingStudents,
  error: studentsError,
  execute: fetchMyStudents,
} = useFetchData((teacherId) => RelationService.getMyStudents(teacherId), {
  initialData: [],
  dataKey: 'students',
});

// 6. Definición de campos para las tablas b-table (como constantes)
const fieldsAlumno = [
  { key: 'name', label: 'Nombre Profesor', sortable: true },
  { key: 'surname', label: 'Apellidos Profesor', sortable: true },
  { key: 'email', label: 'Email Profesor' },
  { key: 'subject', label: 'Asignatura', sortable: true },
];
const fieldsProfesor = [
  { key: 'name', label: 'Nombre Alumno', sortable: true },
  { key: 'surname', label: 'Apellidos Alumno', sortable: true },
  { key: 'email', label: 'Email Alumno' },
  { key: 'subject', label: 'Asignatura Impartida', sortable: true },
  {
    key: 'actions',
    label: 'Acciones',
    class: 'text-center',
    tdClass: 'text-center',
    thClass: 'text-center',
  },
];

// 7. Watcher para cargar datos de rol cuando userData esté listo
watch(
  userData,
  (newUserData, oldUserData) => {
    if (newUserData?.id === oldUserData?.id && newUserData?.rol === oldUserData?.rol) return;
    if (newUserData && newUserData.id) {
      if (newUserData.rol !== oldUserData?.rol) {
        professors.value = [];
        students.value = [];
      }
      if (newUserData.rol === 1) fetchMyProfessors(newUserData.id);
      else if (newUserData.rol === 2) fetchMyStudents(newUserData.id);
    } else {
      professors.value = [];
      students.value = [];
      if (userError.value && !isLoadingUser.value) {
        logout();
      }
    }
  },
  { deep: true }
);

// --- 9. Lógica Modal Editar Alumno (COMPLETA) ---
const showEditStudentModal = ref(false);
const studentToEdit = ref(null);
const isUpdatingStudent = ref(false);
const editErrorMessage = ref('');

const editStudent = (studentData) => {
  studentToEdit.value = { ...studentData };
  editErrorMessage.value = ''; // Limpiar errores previos del modal
  showEditStudentModal.value = true; // Mostrar modal
};

const handleEditModalClose = () => {
  showEditStudentModal.value = false;
  studentToEdit.value = null;
  editErrorMessage.value = '';
};

const handleEditModalSave = async (updatedStudentData) => {
  // Validar ID recibido del modal
  if (!updatedStudentData?.id) {
    console.error('Error: Datos inválidos recibidos del modal (falta ID).');
    editErrorMessage.value = 'Error interno: Falta ID del estudiante.';
    return;
  }
  isUpdatingStudent.value = true; // Activar estado de carga
  editErrorMessage.value = ''; // Limpiar error previo

  try {
    // Payload solo con los campos permitidos para la API
    const payload = {
      name: updatedStudentData.name,
      surname: updatedStudentData.surname,
      email: updatedStudentData.email,
    };
    // Llamar al servicio para actualizar
    const response = await UsersService.updateStudentByProfessor(updatedStudentData.id, payload);

    if (response.success) {
      // Éxito
      alert(response.message || 'Alumno actualizado.');
      handleEditModalClose(); // Cerrar modal
      // Refrescar la lista de estudiantes si somos profesor
      if (isProfesor.value && userData.value?.id) {
        await fetchMyStudents(userData.value.id); // Llama al execute del composable
      }
    } else {
      // Error de API (ej: email duplicado) -> Mostrar en el modal
      editErrorMessage.value = response.message || 'Error del backend al actualizar.';
    }
  } catch (error) {
    // Error de red/servicio -> Mostrar en el modal
    console.error('Error en handleEditModalSave:', error);
    editErrorMessage.value = error.response?.data?.message || error.message || 'Error de comunicación.';
  } finally {
    isUpdatingStudent.value = false; // Quitar estado de carga
  }
};

// --- 10. Lógica Eliminar/Desactivar Alumno (COMPLETA) ---
const isDeletingStudentId = ref(null); // Guarda el ID del que se está procesando

const deleteStudent = async (studentData) => {
  // El ID del alumno viene en 'studentId' por el mapeo del backend
  const studentId = studentData.studentId;
  if (typeof studentId === 'undefined') {
    console.error('Delete: studentId es undefined en el objeto:', studentData);
    alert('Error interno al intentar eliminar.');
    return;
  }
  const studentFullName = `${studentData.name || ''} ${studentData.surname || ''}`.trim();
  const confirmationMessage = `¿Estás MUY seguro de eliminar permanentemente al alumno ${studentFullName} (ID: ${studentId})? ¡Esta acción NO se puede deshacer y borrará sus relaciones!`;

  if (!window.confirm(confirmationMessage)) {
    return;
  }

  isDeletingStudentId.value = studentId; // Bloquear botón específico
  try {
    // Llamar al servicio (asegúrate que UsersService está importado)
    const response = await UsersService.deleteStudent(studentId); // Llama a DELETE /users/students/:id

    if (response && response.success) {
      alert(response.message || `Alumno ID ${studentId} procesado con éxito.`);
      // Refrescar la lista si somos profesor
      if (isProfesor.value && userData.value?.id) {
        await fetchMyStudents(userData.value.id); // Llama al execute del composable
      }
    } else {
      // Error devuelto por backend (404, 409 si hay FK sin cascade, etc.)
      alert(`Error al procesar alumno: ${response?.message || 'Error backend.'}`);
    }
  } catch (error) {
    // Error de red o servicio
    console.error(`Error al eliminar/desactivar alumno ${studentId}:`, error);
    const message = error.response?.data?.message || error.message || 'Error desconocido.';
    alert(`Error: ${message}`);
  } finally {
    isDeletingStudentId.value = null; // Desbloquear botón
  }
};
</script>

<style scoped>
/* Importar iconos si los usas */
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css');

.dashboard-container {
  position: relative;
  padding: 20px;
  padding-bottom: 50px;
}
.top-right {
  position: absolute;
  right: 20px;
  top: 20px;
}
.table-responsive {
  margin-top: 1.5rem;
}
/* Clase para centrar contenido en celdas/cabeceras de tabla */
:deep(.table th.text-center),
:deep(.table td.text-center) {
  text-align: center;
}
/* Clase para botones extra pequeños */
.btn-xs {
  --bs-btn-padding-y: 0.1rem;
  --bs-btn-padding-x: 0.4rem;
  --bs-btn-font-size: 0.75rem;
  --bs-btn-border-radius: var(--bs-border-radius-sm);
}
</style>
