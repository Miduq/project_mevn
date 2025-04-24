<!-- frontend/src/views/subjects/SubjectManagementPage.vue -->

<template>
  <div class="subject-management container mt-4">
    <h1>Gestión de Asignaturas</h1>
    <p>Aquí podrás crear, ver, editar y eliminar asignaturas.</p>

    <div class="mb-3">
      <button
        v-if="formMode === null"
        @click="openAddForm"
        class="btn btn-primary"
        :disabled="isLoadingList || isSaving || isDeleting"
      >
        <i class="bi bi-plus-circle"></i> Añadir Nueva Asignatura
      </button>
    </div>

    <SubjectForm
      v-if="formMode !== null"
      :key="subjectForForm ? subjectForForm.id : 'add'"
      :initialSubject="subjectForForm"
      :isLoading="isSaving"
      :errorMessage="formApiErrorMessage"
      @save="handleFormSave"
      @cancel="handleFormCancel"
    />

    <div v-if="isLoadingList" class="alert alert-info">Cargando asignaturas...</div>
    <div v-if="listError" class="alert alert-danger">{{ listError }}</div>

    <div v-if="!isLoadingList && !listError">
      <SubjectTable
        :subjects="subjects"
        :actionsDisabled="formMode !== null || isDeleting"
        emptyMessage="No hay asignaturas registradas."
        @edit="openEditForm"
        @delete="deleteSubject"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SubjectService from '@/services/subjects/SubjectService';
import SubjectTable from '@/components/subjects/SubjectTable.vue';
import SubjectForm from '@/components/subjects/SubjectForm.vue';
import { useFetchData } from '@/composables/useFetchData';

// Lógica para manejar la carga de datos
const {
  data: subjects, // ref([]) que contendrá las asignaturas
  isLoading: isLoadingList, // ref(false) para el estado de carga
  error: listError, // ref(null) para el mensaje de error
  execute: loadSubjects, // Función para ejecutar la carga
} = useFetchData(
  SubjectService.getAllSubjects, // La función API a llamar
  { initialData: [], dataKey: 'subjects' } // Opciones: valor inicial y clave de datos
);

onMounted(() => {
  console.log('SubjectManagementPage (setup): Montado. Llamando a loadSubjects...');
  loadSubjects();
});

// Estado para el formulario
const formMode = ref(null);
const subjectForForm = ref(null);
const isSaving = ref(false);
const formApiErrorMessage = ref('');
const isDeleting = ref(false);

// Métodos
// Cargar asignaturas al montar el componente
const openAddForm = () => {
  formMode.value = 'add';
  subjectForForm.value = null;
  formApiErrorMessage.value = '';
};

// Abrir el formulario de edición
const openEditForm = (subjectToEdit) => {
  console.log('Edit event received:', subjectToEdit);
  formMode.value = 'edit';
  subjectForForm.value = { ...subjectToEdit };
  formApiErrorMessage.value = '';
};

// Cancelar el formulario
const handleFormCancel = () => {
  console.log('Form cancel received');
  formMode.value = null;
  subjectForForm.value = null;
  formApiErrorMessage.value = '';
};

// Guardar el formulario
const handleFormSave = async (formData) => {
  console.log('Parent received form save:', formData);
  isSaving.value = true; // Accedemos con .value
  formApiErrorMessage.value = '';
  const isEdit = formData.id !== null;

  try {
    const subjectDataPayload = { subject: formData.subject };
    if (isEdit) {
      // Lógica para el update
      const response = await SubjectService.updateSubject(formData.id, subjectDataPayload);
      if (response.success) {
        alert(`Asignatura ID ${formData.id} actualizada.`);
        handleFormCancel();
        await loadSubjects(); // <-- Llama a la función del composable para recargar
      } else {
        formApiErrorMessage.value = response.message || 'No se pudo actualizar.';
      }
    } else {
      // Lógica para el create
      const createdSubject = await SubjectService.createSubject(subjectDataPayload);
      alert(`Asignatura "${createdSubject.subject}" creada.`);
      handleFormCancel();
      await loadSubjects(); // <-- Llama a la función del composable para recargar
    }
  } catch (error) {
    console.error(`Error al ${isEdit ? 'actualizar' : 'crear'} asignatura:`, error);
    formApiErrorMessage.value = error.response?.data?.message || error.message || 'Error.';
  } finally {
    isSaving.value = false;
  }
};

// Eliminar asignatura
const deleteSubject = async (subjectId) => {
  console.log('Delete event received:', subjectId);
  if (!subjectId || !(await window.confirm(`¿Seguro que quieres eliminar ID ${subjectId}?`))) {
    return;
  }
  isDeleting.value = true;
  listError.value = '';

  try {
    const response = await SubjectService.deleteSubject(subjectId);
    if (response.success) {
      alert(`Asignatura ID ${subjectId} eliminada.`);
      await loadSubjects(); // <-- Llama a la función del composable para recargar
    } else {
      alert(`Error al eliminar: ${response.message || '?'}`);
      listError.value = response.message; // Guardamos error en la ref del composable
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message || '?';
    alert(`Error al eliminar: ${message}`);
    listError.value = message; // Guardamos error en la ref del composable
  } finally {
    isDeleting.value = false;
  }
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
</style>
