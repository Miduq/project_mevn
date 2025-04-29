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
    <div v-if="actionMessage" class="mb-3">
      <b-alert :modelValue="!!actionMessage" :variant="actionMessageVariant" show>
        {{ actionMessage }}
      </b-alert>
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
import { ref, onMounted, watch, onUnmounted } from 'vue';
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
  loadSubjects();
});

// Estado para el formulario
const formMode = ref(null);
const subjectForForm = ref(null);
const isSaving = ref(false);
const formApiErrorMessage = ref('');
const isDeleting = ref(false);
const actionMessage = ref(''); // Mensaje general (éxito o error de borrado)
const actionMessageVariant = ref('success'); // 'success' o 'danger'

// Watcher para limpiar mensaje de éxito o error
let actionMessageTimeout = null; // Timer para auto-limpiar éxito

// Watcher para limpiar mensajes de éxito
watch(
  actionMessage,
  (newValue) => {
    clearTimeout(actionMessageTimeout);
    if (newValue) {
      // <-- Se ejecuta si hay cualquier texto (éxito o error)
      // Opcional: Dar más tiempo para leer los errores
      const timeoutDuration = actionMessageVariant.value === 'success' ? 4000 : 5000;

      actionMessageTimeout = setTimeout(() => {
        console.log(`Watcher: Timeout! Limpiando mensaje.`);
        actionMessage.value = ''; // Limpiar el mensaje después del timeout
      }, timeoutDuration);
    } else {
      console.log(`Watcher: Mensaje vacío.`);
    }
  },
  { deep: false }
);
onUnmounted(() => {
  clearTimeout(actionMessageTimeout);
}); // Limpieza al desmontar

// Cargar asignaturas al montar el componente
const openAddForm = () => {
  actionMessage.value = '';
  formMode.value = 'add';
  subjectForForm.value = null;
  formApiErrorMessage.value = '';
};

// Abrir el formulario de edición
const openEditForm = (subjectToEdit) => {
  actionMessage.value = '';
  formMode.value = 'edit';
  subjectForForm.value = { ...subjectToEdit };
  formApiErrorMessage.value = '';
};

// Cancelar el formulario
const handleFormCancel = () => {
  actionMessage.value = '';
  formMode.value = null;
  subjectForForm.value = null;
  formApiErrorMessage.value = '';
};

// Guardar el formulario
const handleFormSave = async (formData) => {
  isSaving.value = true;
  formApiErrorMessage.value = '';
  actionMessage.value = '';

  const isEdit = formData.id !== null;
  try {
    const subjectDataPayload = { subject: formData.subject };
    if (isEdit) {
      // Lógica para Actualizar
      const response = await SubjectService.updateSubject(formData.id, subjectDataPayload);
      if (response.success) {
        handleFormCancel();
        await loadSubjects(); // <-- Llama a la función del composable para recargar
        actionMessage.value = `La asignatura ${formData.subject} actualizada con éxito.`;
        actionMessageVariant.value = 'success';
      } else {
        formApiErrorMessage.value = response.message || 'No se pudo actualizar.';
      }
    } else {
      // Lógica para Crear
      const createdSubject = await SubjectService.createSubject(subjectDataPayload);
      handleFormCancel();
      await loadSubjects(); // <-- Llama a la función del composable para recargar
      actionMessage.value = `Asignatura "${createdSubject.subject}" creada con éxito.`;
      actionMessageVariant.value = 'success';
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
  if (!subjectId || !(await window.confirm(`¿Seguro que quieres eliminar ID ${subjectId}?`))) {
    return;
  }
  isDeleting.value = true;
  listError.value = '';
  actionMessage.value = '';

  try {
    const response = await SubjectService.deleteSubject(subjectId);
    if (response.success) {
      actionMessage.value = response.message || `Asignatura ID ${subjectId} eliminada con éxito.`;
      actionMessageVariant.value = 'success';
      await loadSubjects(); // <-- Llama a la función del composable para recargar
    } else {
      actionMessage.value = `Error al eliminar: ${response.message || 'Error desconocido del backend.'}`;
      actionMessageVariant.value = 'danger';
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message || '?';
    actionMessage.value = `Error al eliminar: ${message}`;
    actionMessageVariant.value = 'danger';
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
