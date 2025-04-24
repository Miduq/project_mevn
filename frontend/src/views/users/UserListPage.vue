<!-- frontend/src/views/users/UserListPage.vue -->

<template>
  <div class="user-list-container container mt-4">
    <h2>Lista de Alumnos</h2>

    <div class="row mb-3">
      <div class="col-md-6">
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            v-model="searchQuery"
            @keyup.enter="handleSearchNow"
            :disabled="isLoadingSearch"
            placeholder="Buscar..."
          />
          <button class="btn btn-primary" @click="handleSearchNow" :disabled="isLoadingSearch">
            <span v-if="isLoadingSearch" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-search"></i> Buscar
          </button>
          <button
            v-if="isSearchResults"
            @click="
              () => {
                searchQuery = '';
                handleSearchNow();
              }
            "
            class="btn btn-outline-secondary"
            type="button"
            title="Mostrar todos"
          >
            <i class="bi bi-x-lg"></i> Limpiar
          </button>
        </div>
        <div v-if="searchError" class="alert alert-danger mt-2 p-2">{{ searchError }}</div>
      </div>
    </div>

    <div v-if="searchError && (!users || users.length === 0) && !isLoadingSearch" class="alert alert-danger">
      {{ searchError }}
    </div>

    <div class="table-responsive">
      <b-table
        :items="users"
        :fields="fieldsProfesor"
        :busy="isLoadingSearch"
        striped
        hover
        responsive="sm"
        empty-text="No se encontraron alumnos."
        show-empty
        class="mt-3 user-table"
        @row-clicked="toggleAssignments"
        tbody-tr-class="clickable-row"
        primary-key="id"
        details-toggle-event=""
      >
        <template #table-busy>
          <div class="text-center text-info my-2">
            <b-spinner class="align-middle"></b-spinner>
            <strong> Cargando...</strong>
          </div>
        </template>

        <template #cell(active)="data">
          <span :class="['badge', data.item.active ? 'bg-success' : 'bg-danger']">
            {{ data.item.active ? 'Sí' : 'No' }}
          </span>
        </template>

        <template #cell(rol)="data">
          {{ data.item.rolName || (data.item.rol === 1 ? 'Alumno' : data.item.rol === 2 ? 'Profesor' : data.item.rol) }}
        </template>

        <template #cell(actions)="data">
          <div class="d-flex justify-content-end gap-1">
            <button
              v-if="data.item.rol === 1"
              class="btn btn-sm btn-outline-primary"
              @click.stop="openAssignModal(data.item)"
              title="Asignar Asignatura"
              :disabled="isLoadingDetails && selectedUser?.id === data.item.id"
            >
              <i class="bi bi-journal-plus"></i>
              <span class="d-none d-md-inline ms-1">Asignar</span>
            </button>
            <button
              class="btn btn-sm btn-outline-info"
              @click.stop="toggleAssignments(data.item)"
              :disabled="isLoadingDetails && selectedUser?.id === data.item.id"
              :aria-expanded="data.item._showDetails ? 'true' : 'false'"
              title="Ver/Ocultar Asignaturas Asignadas"
            >
              <i :class="data.item._showDetails ? 'bi bi-chevron-up' : 'bi bi-card-list'"></i>
              <span class="d-none d-md-inline ms-1">Asignaturas</span>
            </button>
          </div>
        </template>

        <template #row-details="row">
          <div v-if="row.item._showDetails && selectedUser?.id === row.item.id">
            <div class="assignment-details p-3 bg-light border-top">
              <h5>Asignaturas de {{ row.item.name }} {{ row.item.surname }}:</h5>
              <div v-if="isLoadingDetails" class="text-center text-muted py-2">
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>Cargando...
              </div>
              <div v-else-if="detailsError" class="alert alert-warning p-2">{{ detailsError }}</div>
              <div v-else>
                <p v-if="!assignments || assignments.length === 0" class="fst-italic text-muted mb-0">
                  No tiene asignaturas asignadas.
                </p>
                <ul class="list-group list-group-flush" v-else>
                  <li
                    v-for="assign in assignments"
                    :key="assign.id"
                    class="list-group-item d-flex justify-content-between align-items-center px-0 py-1 bg-light"
                  >
                    <span>
                      <strong>{{ assign.subject?.subject || '?' }}</strong>
                      <small class="text-muted ms-2">
                        (Prof: {{ assign.teacher?.name || '?' }} {{ assign.teacher?.surname || '' }})
                      </small>
                    </span>
                    <button
                      v-if="assign.id"
                      class="btn btn-xs btn-outline-danger border-0"
                      @click="removeAssignment(assign.id, row.item.id)"
                      :disabled="isDeletingRelationId === assign.id"
                      title="Quitar esta asignación"
                    >
                      <span v-if="isDeletingRelationId === assign.id" class="spinner-border spinner-border-sm"></span>
                      <i v-else class="bi bi-trash"></i>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </template>
      </b-table>
    </div>
    <AssignSubject
      v-if="showAssignModal"
      :student="studentToAssign"
      :professorId="loggedInProfessorId"
      @close="closeAssignModal"
      @assign-success="handleAssignSuccess"
    />
  </div>
</template>

<script setup>
// 1. Imports
import { ref, onMounted, computed, watch } from 'vue';
import RelationService from '@/services/relations/RelationService';
import UsersService from '@/services/users/UsersService';
import AssignSubject from '@/components/users/AssignSubject.vue'; // Verifica ruta
import { useFetchData } from '@/composables/useFetchData'; // Nuestro composable
import { jwtDecode } from 'jwt-decode'; // Para obtener ID profesor

// 3. Búsqueda y Lista de Usuarios (usando useFetchData)
const searchQuery = ref('');
const isSearchResults = ref(false);
const {
  data: users,
  isLoading: isLoadingSearch,
  error: searchError,
  execute: fetchUsers,
} = useFetchData(UsersService.searchUsers, { initialData: [], dataKey: 'users' });

// Carga inicial al montar
onMounted(() => {
  isSearchResults.value = false; // Asegurar estado inicial
  fetchUsers('');
});

// Lógica de búsqueda (manual + debounce)
let debounceTimer = null;
const handleSearchNow = () => {
  isSearchResults.value = !!searchQuery.value && searchQuery.value.trim() !== '';
  fetchUsers(searchQuery.value);
};
watch(searchQuery, (newValue) => {
  clearTimeout(debounceTimer);
  if (newValue.length > 2 || newValue.length === 0) {
    debounceTimer = setTimeout(() => {
      isSearchResults.value = !!newValue && newValue.trim() !== '';
      fetchUsers(newValue);
    }, 500);
  }
});

// 4. Lógica Modal Asignar Asignatura
const studentToAssign = ref(null);
const showAssignModal = computed(() => studentToAssign.value !== null);
const loggedInProfessorId = computed(() => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return jwtDecode(token).id;
  } catch {
    return null;
  }
});
const openAssignModal = (student) => {
  studentToAssign.value = student;
};
const closeAssignModal = () => {
  studentToAssign.value = null;
};

// 5. Lógica para Detalles de Asignaturas
const selectedUser = ref(null); // Usuario seleccionado
// Composable para los detalles (sin cambios)
const {
  data: assignments,
  isLoading: isLoadingDetails,
  error: detailsError,
  execute: fetchAssignmentsForStudent,
} = useFetchData((studentId) => RelationService.getRelationsForStudent(studentId), {
  initialData: [],
  dataKey: 'relations',
});

// Función toggleAssignments (simplificada)
const toggleAssignments = async (userRowItem) => {
  // Busca el item reactivo correspondiente en nuestro array 'users'
  const itemInState = users.value.find((u) => u.id === userRowItem.id);
  if (!itemInState) {
    return;
  }

  const isOpening = !itemInState._showDetails; // Determina si vamos a abrir o cerrar

  // --- Lógica para cerrar otras filas (Opcional pero recomendado) ---
  if (isOpening) {
    users.value.forEach((u) => {
      if (u.id !== itemInState.id && u._showDetails) {
        u._showDetails = false; // Cierra las demás
      }
    });
  }

  // Alterna el estado _showDetails del item actual (esto controla b-table)
  itemInState._showDetails = !itemInState._showDetails;

  // Actualiza 'selectedUser' y carga datos
  if (itemInState._showDetails) {
    selectedUser.value = itemInState;
    // Limpiar antes de cargar por si acaso
    detailsError.value = null;
    await fetchAssignmentsForStudent(itemInState.id); // Carga los datos usando el composable
  } else {
    // Si estamos CERRANDO, simplemente deseleccionamos
    selectedUser.value = null;
  }
};

// --- Lógica handleAssignSuccess (Ahora usa fetchAssignmentsForStudent) ---
const handleAssignSuccess = async () => {
  const currentlySelectedStudentId = selectedUser.value?.id;
  const assignedStudentId = studentToAssign.value?.id;
  closeAssignModal();
  if (currentlySelectedStudentId && currentlySelectedStudentId === assignedStudentId) {
    await fetchAssignmentsForStudent(currentlySelectedStudentId); // <-- Llama al execute del composable
  }
};

// 6. Definición de campos para las tablas b-table
const fieldsProfesor = [
  // Asumiendo que esta página lista ALUMNOS
  { key: 'name', label: 'Nombre Alumno', sortable: true },
  { key: 'surname', label: 'Apellidos Alumno', sortable: true },
  { key: 'email', label: 'Email Alumno' },
  { key: 'active', label: 'Activo', sortable: true, class: 'text-center', thClass: 'text-center' }, // Añadido activo y centrado
  {
    key: 'actions',
    label: 'Acciones',
    class: 'text-center',
    tdClass: 'text-center',
    thClass: 'text-center',
  },
];

// 7. Lógica para Eliminar Asignación (desde los detalles)
const isDeletingRelationId = ref(null); // Para el spinner del botón borrar asignación

async function removeAssignment(relationId, studentId) {
  // Esta función ya estaba bien, solo necesita llamar a fetchAssignmentsForStudent al final
  const student = users.value.find((u) => u.id === studentId);
  const studentName = student ? `${student.name} ${student.surname}` : `ID ${studentId}`;
  const assignment = assignments.value.find((a) => a.id === relationId); // Usa assign.id de la relación
  const subjectName = assignment?.subject?.subject || 'esta asignatura';

  if (!window.confirm(`¿Seguro que quieres quitar ${subjectName} al alumno ${studentName}?`)) {
    return;
  }

  isDeletingRelationId.value = relationId;
  detailsError.value = '';

  try {
    const response = await RelationService.deleteRelation(relationId);
    if (response && response.success) {
      alert(`Asignación de ${subjectName} eliminada.`);
      // Refrescar detalles si el usuario afectado sigue seleccionado
      if (selectedUser.value && selectedUser.value.id === studentId) {
        await fetchAssignmentsForStudent(studentId); // <-- Llama al execute del composable
      }
    } else {
      detailsError.value = response?.message || 'Error del backend al eliminar.';
      alert(`Error al eliminar: ${detailsError.value}`);
    }
  } catch (error) {
    console.error(`Error al eliminar relación ${relationId}:`, error);
    const message = error.response?.data?.message || error.message || 'Error desconocido.';
    detailsError.value = message;
    alert(`Error: ${message}`);
  } finally {
    isDeletingRelationId.value = null; // Limpiar estado de carga
  }
}
</script>

<style scoped>
/* Añadimos algunos estilos para la interacción y detalles */
.user-list-container {
  padding-bottom: 50px; /* Espacio al final */
}
.table-responsive {
  margin-top: 20px;
}
/* Cambia cursor para filas clicables */
tbody tr[style*='cursor: pointer']:hover {
  background-color: #e9ecef; /* Color suave al pasar por encima */
}
/* Estilo para la fila seleccionada */
.table-info {
  --bs-table-accent-bg: var(--bs-info-bg-subtle); /* Usa variables BS5 si están disponibles */
  /* background-color: #cfe2ff !important; */ /* Fallback */
  font-weight: bold;
}
/* Estilo para la celda de detalles */
.assignment-details {
  margin-top: -1px; /* Para que los bordes se solapen */
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}
.input-group .btn {
  z-index: 0; /* Evita solapamiento visual raro con input */
}
</style>
