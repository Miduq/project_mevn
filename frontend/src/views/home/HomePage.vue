<!-- frontend/src/views/home/HomePage.vue -->

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
        <div class="row mb-3">
          <div class="col-md-5">
            <label for="nameSearch" class="form-label form-label-sm">Buscar por Nombre/Apellido:</label>
            <div class="input-group input-group-sm">
              <input
                type="text"
                id="nameSearch"
                class="form-control"
                v-model="nameQuery"
                @keyup.enter="handleSearch"
                placeholder="Nombre o Apellido..."
              />
              <button
                v-if="nameQuery"
                class="btn btn-outline-secondary"
                type="button"
                @click="clearNameSearch"
                title="Limpiar filtro nombre"
              >
                <i class="bi bi-x-lg"></i>
              </button>
              <button class="btn btn-outline-secondary" type="button" @click="handleSearch" title="Aplicar filtros">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>
          <div class="col-md-5">
            <label for="emailSearch" class="form-label form-label-sm">Buscar por Email:</label>
            <div class="input-group input-group-sm">
              <input
                type="email"
                id="emailSearch"
                class="form-control"
                v-model="emailQuery"
                @keyup.enter="handleSearch"
                placeholder="Email..."
              />
              <button
                v-if="emailQuery"
                class="btn btn-outline-secondary"
                type="button"
                @click="clearEmailSearch"
                title="Limpiar filtro email"
              >
                <i class="bi bi-x-lg"></i>
              </button>
              <button class="btn btn-outline-secondary" type="button" @click="handleSearch" title="Aplicar filtros">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>
        </div>
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
          <template #cell(active)="data">
            <span :class="['badge', data.item.active ? 'bg-success' : 'bg-danger']">
              {{ data.item.active ? 'Sí' : 'No' }}
            </span>
          </template>
        </b-table>
        <div class="d-flex justify-content-center mt-3" v-if="totalPages > 1">
          <b-pagination
            v-model="currentPage"
            :total-rows="totalStudents"
            :per-page="pageSize"
            @update:modelValue="goToPage"
            aria-controls="my-table"
            first-text="Primera"
            prev-text="Anterior"
            next-text="Siguiente"
            last-text="Última"
          ></b-pagination>
        </div>
        <div v-if="tableActionMessage" class="mb-3">
          <b-alert
            :modelValue="!!tableActionMessage"
            :variant="tableActionVariant"
            dismissible
            @dismissed="tableActionMessage = ''"
          >
            {{ tableActionMessage }}
          </b-alert>
        </div>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import AuthService from '@/services/auth/AuthService';
import RelationService from '@/services/relations/RelationService';
import UsersService from '@/services/users/UsersService';
import EditStudent from '@/components/users/EditStudent.vue';
import { useFetchData } from '@/composables/useFetchData';
import { useAuth } from '@/composables/useAuth';

const { logoutAndRedirect } = useAuth();

// Estado y Carga de Datos del Usuario Logueado
const {
  data: userData,
  isLoading: isLoadingUser,
  error: userError,
  execute: fetchUserData,
} = useFetchData(AuthService.getMe, { initialData: null, dataKey: 'user' });

onMounted(fetchUserData);

// Propiedades computadas para rol
const isAlumno = computed(() => userData.value?.rol === 1);
const isProfesor = computed(() => userData.value?.rol === 2);
const rolName = computed(() => {
  if (isLoadingUser.value) return 'Cargando...';
  if (!userData.value) return 'Desconocido';
  return (
    userData.value.rolName || (isProfesor.value ? 'Profesor' : userData.value.rol === 1 ? 'Alumno' : 'Desconocido')
  );
});

// Estado y Carga de Datos Específicos del Rol
const {
  data: professors,
  isLoading: isLoadingProfessors,
  error: professorsError,
  execute: fetchMyProfessors,
} = useFetchData((studentId) => RelationService.getMyProfessors(studentId), {
  initialData: [],
  dataKey: 'professors',
});

const fieldsProfesor = [
  { key: 'name', label: 'Nombre Alumno', sortable: true },
  { key: 'surname', label: 'Apellidos Alumno', sortable: true },
  { key: 'email', label: 'Email Alumno' },
  { key: 'subject', label: 'Asignatura Impartida', sortable: true }, //<- Nombre Asignatura
  { key: 'active', label: 'Activo', sortable: true, class: 'text-center', thClass: 'text-center' },
  { key: 'actions', label: 'Acciones', class: 'text-center', tdClass: 'text-center', thClass: 'text-center' },
];

const fieldsAlumno = [
  {
    key: 'teacherName', // Le damos una key única (no tiene por qué coincidir con la propiedad)
    label: 'Nombre Profesor',
    // 'formatter' recibe (value, key, item) donde 'item' es el objeto de la fila (la relación)
    formatter: (value, key, item) => {
      // Accedemos de forma segura al nombre dentro del objeto anidado 'teacher'
      return item.teacher?.name || 'Desconocido';
    },
    sortable: true, // Puedes mantener sortable si quieres
  },
  {
    key: 'teacherSurname',
    label: 'Apellidos Profesor',
    formatter: (value, key, item) => {
      return item.teacher?.surname || ''; // Devolver vacío si no hay apellido
    },
    sortable: true,
  },
  {
    key: 'teacherEmail',
    label: 'Email Profesor',
    formatter: (value, key, item) => {
      return item.teacher?.email || 'N/A';
    },
    // El email no suele ser sortable
  },
  {
    key: 'subjectName',
    label: 'Asignatura',
    formatter: (value, key, item) => {
      // Accedemos al nombre dentro del objeto anidado 'subject'
      return item.subject?.subject || 'Desconocida';
    },
    sortable: true,
  },
];

// Estado para la lista de alumnos (página actual)
const students = ref([]);
const isLoadingStudents = ref(false);
const studentsError = ref('');

// Estado para los filtros de búsqueda
const nameQuery = ref('');
const emailQuery = ref('');

// Estado para la edición de alumnos
const tableActionMessage = ref(''); // Guarda el mensaje a mostrar
const tableActionVariant = ref('success'); // 'success' o 'danger' para el estilo del alert
let tableMessageTimeout = null; // Para limpiar mensajes de éxito automáticamente
const isDeletingStudentId = ref(null); // ID del alumno que se está eliminando

// Estado para la paginación
const currentPage = ref(1);
const pageSize = ref(5); // Máximo 5 por página
const totalStudents = ref(0); // Total de alumnos
const totalPages = computed(() => Math.ceil(totalStudents.value / pageSize.value) || 1);

// Función para cargar una página específica de alumnos
const fetchMyStudents = async (pageToFetch = 1) => {
  if (!isProfesor.value || !userData.value?.id) return;
  isLoadingStudents.value = true;
  studentsError.value = '';
  console.log(`HomePage(setup): Cargando alumnos para profesor ID ${userData.value.id}, página ${pageToFetch}`);

  try {
    // Prepara las opciones con paginación Y filtros
    const options = {
      page: pageToFetch,
      limit: pageSize.value,
      name: nameQuery.value, // Pasa valor actual del input de nombre
      email: emailQuery.value, // Pasa valor actual del input de email
    };
    // Llama al servicio modificado
    const response = await RelationService.getMyStudents(userData.value.id, options);

    if (response.success) {
      students.value = response.students || [];
      if (response.pagination) {
        totalStudents.value = response.pagination.totalItems || 0;
        currentPage.value = pageToFetch; // Actualizar a la página solicitada
      } else {
        console.warn('Respuesta de getMyStudents no contenía datos de paginación.');
        totalStudents.value = students.value.length;
        currentPage.value = 1;
      }
    } else {
      studentsError.value = error.response?.data?.message || error.message || 'Error';
      students.value = [];
      totalStudents.value = 0;
      currentPage.value = 1;
    }
  } catch (error) {
    // Error de red/servicio
    console.error('Error de red/servicio al obtener alumnos:', error);
    studentsError.value = error.response?.data?.message || error.message || 'Error de red.';
    students.value = [];
    totalStudents.value = 0;
    currentPage.value = 1;
  } finally {
    isLoadingStudents.value = false;
  }
};

// Handler para iniciar una búsqueda
const handleSearch = () => {
  currentPage.value = 1; // Siempre volver a página 1 al aplicar filtros
  fetchMyStudents(1);
};

// Handlers para limpiar filtros individuales
const clearNameSearch = () => {
  if (nameQuery.value) {
    nameQuery.value = '';
    handleSearch();
  }
};
const clearEmailSearch = () => {
  if (emailQuery.value) {
    emailQuery.value = '';
    handleSearch();
  }
};

// Método para cambiar de página (por b-pagination)
const goToPage = (newPage) => {
  // Comprobamos si la página es válida y diferente a la actual antes de cargar
  if (newPage >= 1 && newPage <= totalPages.value) {
    fetchMyStudents(newPage);
  } else {
    console.warn(`Intento de ir a página inválida: ${newPage}. Total: ${totalPages.value}`);
  }
};

// Watcher para cargar datos de rol cuando userData esté listo
watch(
  userData,
  (newUserData) => {
    if (newUserData?.id) {
      professors.value = [];
      students.value = [];
      currentPage.value = 1;
      totalStudents.value = 0; // Resetear
      if (newUserData.rol === 1) {
        fetchMyProfessors(newUserData.id);
      } else if (newUserData.rol === 2) {
        fetchMyStudents(1);
      } // <-- Llama a la primera página
    } else if (userError.value && !isLoadingUser.value) {
      logout(); // Si falla carga de usuario, logout
    }
  },
  { deep: true }
);
watch(tableActionMessage, (newValue) => {
  clearTimeout(tableMessageTimeout);
  // Limpiar solo si es un mensaje de éxito (variant == 'success')
  if (newValue && tableActionVariant.value === 'success') {
    tableMessageTimeout = setTimeout(() => {
      tableActionMessage.value = '';
    }, 4000); // Ocultar después de 2 segundos
  }
});

// Lógica editar alumno
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
  tableActionMessage.value = ''; // Limpiar mensaje previo de la tabla
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
      handleEditModalClose(); // Cerrar modal
      await fetchMyStudents(1);
      await nextTick();
      tableActionMessage.value = 'Alumno actualizado con éxito.';
      tableActionVariant.value = 'success';
    } else {
      editErrorMessage.value = response.message || 'Error del backend al actualizar.';
    }
  } catch (error) {
    // Error de red/servicio -> Mostrar en el modal
    editErrorMessage.value = error.response?.data?.message || error.message || 'Error en la comuncación.';
  } finally {
    isUpdatingStudent.value = false; // Quitar estado de carga
  }
};

// Lógica Eliminar/Desactivar Alumno
const deleteStudent = async (studentData) => {
  const studentId = studentData.studentId;
  if (typeof studentId === 'undefined') {
    console.error('Delete: studentId es undefined en el objeto:', studentData);
    alert('Error interno al intentar eliminar.');
    return;
  }
  const studentFullName = `${studentData.name || ''} ${studentData.surname || ''}`.trim();
  const confirmationMessage = `¿Estás MUY seguro de eliminar permanentemente al alumno ${studentFullName}? ¡Esta acción NO se puede deshacer y borrará sus relaciones!`;

  if (!window.confirm(confirmationMessage)) {
    return;
  }

  isDeletingStudentId.value = studentId; // Bloquear botón específico
  tableActionMessage.value = ''; // Limpiar mensaje previo
  try {
    // Llamar al servicio (asegúrate que UsersService está importado)
    const response = await UsersService.deleteStudent(studentId); // Llama a DELETE /users/students/:id

    if (response && response.success) {
      // Éxito
      await fetchMyStudents(1);
      tableActionMessage.value = `Alumno ${studentData.name} ${studentData.surname} eliminado/desactivado con éxito.`;
      tableActionVariant.value = 'success';
    } else {
      tableActionMessage.value = `Error al procesar alumno: ${response?.message || 'Error backend.'}`;
      tableActionVariant.value = 'danger';
    }
  } catch (error) {
    // Error de red o servicio
    console.error(`Error al eliminar/desactivar alumno ${studentId}:`, error);
    const message = error.response?.data?.message || error.message || 'Error desconocido.';
    tableActionMessage.value = `Error: ${message}`;
    tableActionVariant.value = 'danger';
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
