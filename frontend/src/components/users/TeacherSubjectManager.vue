<!-- frontend/src/components/TeacherSubjectManager.vue -->

<!--  <template>
  <div class="teacher-subject-manager mt-4 p-3 border rounded bg-light shadow-sm">
    <h4>Gestionar Mis Asignaturas Impartidas</h4>
    <hr />

    <div v-if="isLoading" class="text-center text-muted py-3">
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Cargando datos...
    </div>
    <div v-else-if="loadErrorMessage" class="alert alert-danger">
      {{ loadErrorMessage }}
    </div>

    <div v-else>
      <div class="add-subject-section mb-4">
        <label for="availableSubjectSelect" class="form-label">Añadir asignatura a mi lista:</label>
        <div class="input-group">
          <select
            class="form-select"
            v-model="selectedAvailableSubjectId"
            :disabled="isProcessing || availableSubjects.length === 0"
          >
            <option :value="null" disabled>
              {{ availableSubjects.length === 0 ? '-- Todas asignadas --' : '-- Selecciona --' }}
            </option>
            <option v-for="subj in availableSubjects" :key="subj.id" :value="subj.id">
              {{ subj.subject }}
            </option>
          </select>
          <button
            class="btn btn-outline-primary"
            @click="addSelectedSubject"
            :disabled="selectedAvailableSubjectId === null || isProcessing"
          >
            <span v-if="isProcessing === 'add'" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="bi bi-plus-lg"></i> Añadir
          </button>
        </div>
        <div v-if="actionErrorMessage" class="alert alert-warning p-2 mt-2">
          {{ actionErrorMessage }}
        </div>
      </div>
      <hr />
      <div>
        <h5>Asignaturas que imparto actualmente:</h5>
        <p v-if="!assignedSubjects || assignedSubjects.length === 0" class="fst-italic text-muted">
          No tienes ninguna asignatura asignada actualmente.
        </p>
        <ul class="list-group" v-else>
          <li
            v-for="subj in assignedSubjects"
            :key="'assigned-' + subj.id"
            class="list-group-item d-flex justify-content-between align-items-center"
          >
            <span
              >{{ subj.subject }} <small class="text-muted">(ID: {{ subj.id }})</small></span
            >
            <button
              class="btn btn-sm btn-outline-danger border-0"
              @click="removeAssignedSubject(subj.id)"
              :disabled="isProcessing === subj.id"
              title="Dejar de impartir"
            >
              <span v-if="isProcessing === subj.id" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-trash"></i>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import SubjectService from '@/services/subjects/SubjectService';
import UsersService from '@/services/users/UsersService';
import { useFetchData } from '@/composables/useFetchData';

// --- 1. Props ---
const props = defineProps({
  professorId: {
    type: Number,
    required: true,
  },
});

// --- 2. Fetch All Subjects ---
const {
  data: allSubjects, // ref([]) -> Todas las asignaturas {id, subject}
  isLoading: isLoadingAll, // ref(false) -> Estado de carga para esta llamada
  error: errorAll, // ref(null) -> Error para esta llamada
  execute: fetchAllSubjects, // Función para ejecutar esta carga
} = useFetchData(SubjectService.getAllSubjects, { initialData: [], dataKey: 'subjects' });

// --- 3. Fetch Assigned Subjects ---
// ¡IMPORTANTE! El fetcher ahora es una función que usa la prop professorId
const {
  data: assignedSubjects, // ref([]) -> Asignaturas asignadas {id, subject}
  isLoading: isLoadingAssigned, // ref(false) -> Estado de carga para esta llamada
  error: errorAssigned, // ref(null) -> Error para esta llamada
  execute: fetchAssignedSubjects, // Función para (re)ejecutar esta carga
} = useFetchData(
  // La función fetcher ahora recibe el ID del profesor cuando se llama a execute
  (profId) => {
    if (!profId) {
      console.warn('fetchAssignedSubjects: Se intentó llamar sin professorId.');
      // Devolver una promesa rechazada para que useFetchData lo capture como error
      return Promise.reject(new Error('ID de profesor no disponible'));
    }
    return UsersService.getProfessorSubjectList(profId);
  },
  { initialData: [], dataKey: 'subjects' } // La data está en 'subjects'
);

// --- 4. Combined Loading/Error State (Computed) ---
// isLoading será true si CUALQUIERA de las dos cargas está activa
const isLoading = computed(() => isLoadingAll.value || isLoadingAssigned.value);
// loadErrorMessage mostrará el primer error que ocurra
const loadErrorMessage = computed(() => errorAll.value || errorAssigned.value || '');

// --- 5. State for UI Interaction (Refs) ---
const selectedAvailableSubjectId = ref(null);
const isProcessing = ref(false); // Carga para Add/Remove (podría ser 'add' o ID de asignatura)
const actionErrorMessage = ref(''); // Errores de Add/Remove

// --- 6. Computed for Available Subjects (usa refs con .value) ---
const availableSubjects = computed(() => {
  if (!allSubjects.value || allSubjects.value.length === 0) return [];
  const assignedIds = new Set(assignedSubjects.value?.map((s) => s.id) ?? []);
  return allSubjects.value
    .filter((s) => !assignedIds.has(s.id))
    .sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));
});

// --- 7. Load Initial Data on Mount ---
onMounted(() => {
  fetchAllSubjects(); // Ejecuta la carga de todas las asignaturas
  if (props.professorId) {
    fetchAssignedSubjects(props.professorId); // Ejecuta la carga de asignadas, pasando el ID
  } else {
    console.error('TeacherSubjectManager: No se recibió professorId al montar.');
    // Podríamos establecer loadErrorMessage aquí
  }
});

// --- 8. Action Methods (ahora llaman a fetchAssignedSubjects para refrescar) ---

const addSelectedSubject = async () => {
  if (selectedAvailableSubjectId.value === null) return;
  isProcessing.value = 'add';
  actionErrorMessage.value = '';
  try {
    const subjectIdToAdd = selectedAvailableSubjectId.value;
    const response = await UsersService.assignSubjectToTeacher(props.professorId, {
      subjectId: subjectIdToAdd,
    });
    if (response && response.success) {
      alert('Asignatura añadida con éxito.');
      selectedAvailableSubjectId.value = null;
      await fetchAssignedSubjects(props.professorId); // Llama al 'execute' del composable
    } else {
      actionErrorMessage.value = response?.message || 'Error al añadir.';
      alert(`Error: ${actionErrorMessage.value}`);
    }
  } catch (error) {
    console.error('Error en addSelectedSubject:', error);
    actionErrorMessage.value = error.response?.data?.message || error.message || 'Error.';
    alert(`Error: ${actionErrorMessage.value}`);
  } finally {
    isProcessing.value = false;
  }
};

const removeAssignedSubject = async (subjectIdToRemove) => {
  const subjectName =
    assignedSubjects.value?.find((s) => s.id === subjectIdToRemove)?.subject || `ID ${subjectIdToRemove}`;
  if (!window.confirm(`¿Seguro que quieres dejar de impartir "${subjectName}"?`)) return;
  isProcessing.value = subjectIdToRemove;
  actionErrorMessage.value = '';
  try {
    const response = await UsersService.removeSubjectFromTeacher(props.professorId, subjectIdToRemove);
    if (response && response.success) {
      alert(`Asignatura "${subjectName}" quitada con éxito.`);
      await fetchAssignedSubjects(props.professorId); // Llama al 'execute' del composable
    } else {
      actionErrorMessage.value = response?.message || 'Error al quitar.';
      alert(`Error: ${actionErrorMessage.value}`);
    }
  } catch (error) {
    console.error('Error en removeAssignedSubject:', error);
    actionErrorMessage.value = error.response?.data?.message || error.message || 'Error.';
    alert(`Error: ${actionErrorMessage.value}`);
  } finally {
    isProcessing.value = false;
  }
};
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css');
/* Mismos estilos que antes */
.teacher-subject-manager {
  background-color: #f8f9fa;
}
.add-subject-section select {
  max-width: calc(100% - 100px);
  display: inline-block;
}
.list-group-item {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.list-group-item small {
  font-size: 0.8em;
}
.btn-sm .spinner-border-sm {
  width: 0.85em;
  height: 0.85em;
}
.btn-xs {
  --bs-btn-padding-y: 0.1rem;
  --bs-btn-padding-x: 0.4rem;
  --bs-btn-font-size: 0.75rem;
  --bs-btn-border-radius: var(--bs-border-radius-sm);
}
</style>
