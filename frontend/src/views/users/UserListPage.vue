<!-- frontend/src/views/users/UserListPage.vue -->

<template>
  <div class="user-list-container container mt-4">
    <h2>Lista de Alumnos</h2>
    <div class="row mb-3 gx-2 align-items-end">
      <div class="col-md-5">
        <label for="nameSearchUserList" class="form-label form-label-sm visually-hidden">Buscar Nombre/Apellido:</label>
        <div class="input-group input-group-sm">
          <input
            type="text"
            id="nameSearchUserList"
            class="form-control"
            v-model.lazy="searchQuery"
            @keyup.enter="handleSearchNow"
            placeholder="Nombre, Apellido, Email..."
            aria-label="Buscar usuario"
            :disabled="isLoadingSearch"
          />
          <button
            v-if="searchQuery"
            class="btn btn-outline-secondary"
            type="button"
            @click="
              () => {
                searchQuery = '';
                handleSearchNow();
              }
            "
            title="Limpiar búsqueda"
          >
            <i class="bi bi-x-lg"></i>
          </button>
          <button
            class="btn btn-outline-primary"
            type="button"
            @click="handleSearchNow"
            :disabled="isLoadingSearch"
            title="Buscar"
          >
            <i class="bi bi-search"></i>
          </button>
        </div>
        <div v-if="searchError" class="text-danger small mt-1">{{ searchError }}</div>
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
        empty-text="No se encontraron alumnos con los criterios actuales."
        show-empty
        class="mt-3 user-table"
        @row-clicked="toggleAssignments"
        tbody-tr-class="clickable-row"
        primary-key="id"
        details-toggle-event=""
      >
        <template #table-busy>
          <div class="text-center text-secondary my-2">
            <b-spinner class="align-middle small"></b-spinner>
            <strong> Cargando Alumnos...</strong>
          </div>
        </template>

        <template #cell(active)="data">
          <span :class="['badge', data.item.active ? 'bg-success' : 'bg-danger']">
            {{ data.item.active ? 'Sí' : 'No' }}
          </span>
        </template>

        <template #cell(rol)="data">
          {{ data.item.rolName || (data.item.rol === 1 ? 'Alumno' : data.item.rol) }}
        </template>

        <template #cell(actions)="data">
          <div class="d-flex justify-content-center gap-1">
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
          <div v-if="row.item._showDetails">
            <div class="assignment-details p-3 bg-light border-top">
              <h5>Asignaturas de {{ row.item.name }} {{ row.item.surname }}:</h5>

              <div v-if="actionMessage && selectedUser?.id === row.item.id" class="mb-2">
                <b-alert
                  :modelValue="!!actionMessage"
                  :variant="actionMessageVariant"
                  show
                  dismissible
                  @dismissed="actionMessage = ''"
                >
                  {{ actionMessage }}
                </b-alert>
              </div>
              <div v-if="isLoadingDetails && selectedUser?.id === row.item.id" class="text-center text-muted py-2">
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>Cargando...
              </div>
              <div v-else-if="detailsError && selectedUser?.id === row.item.id" class="alert alert-warning p-2">
                {{ detailsError }}
              </div>
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
                      <small class="text-muted ms-2"
                        >(Prof: {{ assign.teacher?.name || '?' }} {{ assign.teacher?.surname || '' }})</small
                      >
                    </span>
                    <button
                      v-if="assign.id"
                      class="btn btn-xs btn-outline-danger border-0"
                      @click="removeAssignment(assign.id, row.item.id)"
                      :disabled="isDeletingRelationId === assign.id"
                      title="Quitar Asignación"
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
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
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

// Estado para Mensajes de Acción (Asignar/Quitar Asignación)
const actionMessage = ref(''); // Mensaje (éxito o error) de la última acción
const actionMessageVariant = ref('success'); // Variante ('success' o 'danger')
let actionMessageTimeout = null; // Timer para auto-limpiar

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
watch(actionMessage, (newValue) => {
  clearTimeout(actionMessageTimeout);
  if (newValue) {
    // Aplicar timeout a cualquier mensaje que aparezca
    const timeoutDuration = actionMessageVariant.value === 'success' ? 3000 : 4000; // Más tiempo para errores
    actionMessageTimeout = setTimeout(() => {
      actionMessage.value = '';
    }, timeoutDuration);
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
  actionMessage.value = ''; // Limpiar mensaje de acción anterior al abrir/cerrar detalles
  const itemInState = users.value.find((u) => u.id === userRowItem.id);
  if (!itemInState) return;
  const isOpening = !itemInState._showDetails;
  if (isOpening) {
    users.value.forEach((u) => {
      if (u.id !== itemInState.id) u._showDetails = false;
    });
  }
  itemInState._showDetails = !itemInState._showDetails;
  if (itemInState._showDetails) {
    selectedUser.value = itemInState;
    detailsError.value = null; // Limpiar error de carga de detalles
    await fetchAssignmentsForStudent(itemInState.id); // Carga datos
  } else {
    selectedUser.value = null;
  }
};

// Lógica handleAssignSuccess (Ahora usa fetchAssignmentsForStudent)
const handleAssignSuccess = async () => {
  const currentlySelectedStudentId = selectedUser.value?.id;
  const assignedStudentId = studentToAssign.value?.id;
  const studentName = studentToAssign.value?.name ?? '';
  closeAssignModal();
  // Establecer mensaje de ÉXITO de la acción
  actionMessage.value = `Asignatura asignada ${studentName ? 'a ' + studentName : ''} con éxito.`;
  actionMessageVariant.value = 'success';
  // Refrescar detalles si estaban abiertos
  if (currentlySelectedStudentId && currentlySelectedStudentId === assignedStudentId) {
    await fetchAssignmentsForStudent(currentlySelectedStudentId);
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

// 7. Lógica para Eliminar Asignación
const isDeletingRelationId = ref(null); // Para el spinner del botón borrar asignación

async function removeAssignment(relationId, studentId) {
  const student = users.value.find((u) => u.id === studentId);
  const studentName = student ? `${student.name} ${student.surname}` : `ID ${studentId}`;
  const assignment = assignments.value.find((a) => a.id === relationId);
  const subjectName = assignment?.subject?.subject || 'esta asignatura';

  if (!window.confirm(`¿Seguro que quieres quitar ${subjectName} al alumno ${studentName}?`)) {
    return;
  }

  isDeletingRelationId.value = relationId;
  actionMessage.value = ''; // Limpiar acción previa
  detailsError.value = ''; // Limpiar error carga previo

  try {
    const response = await RelationService.deleteRelation(relationId);
    if (response && response.success) {
      // Mensaje ÉXITO de la acción
      actionMessage.value = response.message || `Asignación de ${subjectName} eliminada.`;
      actionMessageVariant.value = 'success';
      if (selectedUser.value && selectedUser.value.id === studentId) {
        await fetchAssignmentsForStudent(studentId); // Refrescar
      }
    } else {
      // Mensaje ERROR de la acción
      actionMessage.value = response?.message || 'Error backend al eliminar.';
      actionMessageVariant.value = 'danger';
    }
  } catch (error) {
    // Mensaje ERROR de la acción
    const message = error.response?.data?.message || error.message || 'Error.';
    actionMessage.value = `Error: ${message}`;
    actionMessageVariant.value = 'danger';
  } finally {
    isDeletingRelationId.value = null;
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
