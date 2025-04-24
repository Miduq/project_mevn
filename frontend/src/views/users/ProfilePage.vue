<!-- frontend/src/views/ProfilePage.vue -->

<template>
  <div class="profile-page container mt-4">
    <h2 class="text-center">Perfil de Usuario</h2>

    <div v-if="isLoadingUser" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
      <p class="mt-2 text-muted">Cargando datos del usuario...</p>
    </div>

    <div v-else-if="userError" class="alert alert-danger">Error al cargar el perfil: {{ userError }}</div>

    <div v-else-if="userData" class="row mt-4">
      <div class="col-md-4 text-center text-md-start mb-4 mb-md-0">
        <h4 class="mb-3">Foto de perfil</h4>
        <div class="profile-pic-wrapper">
          <div v-if="profileImageUrl" class="profile-pic-container">
            <img :src="profileImageUrl" alt="Foto de perfil" class="profile-pic img-thumbnail shadow-sm" />
          </div>
          <div v-else class="placeholder-image d-flex align-items-center justify-content-center">
            <i class="bi bi-person-fill display-4 text-secondary"></i>
          </div>
        </div>
        <div class="mt-3 upload-section">
          <label for="profilePicInput" class="form-label small d-block mb-1">Cambiar foto:</label>
          <input
            id="profilePicInput"
            type="file"
            @change="onFileChange"
            accept="image/*"
            ref="fileInputRef"
            class="form-control form-control-sm"
            :disabled="isUploading"
          />
          <div v-if="uploadErrorMessage" class="text-danger small mt-1">{{ uploadErrorMessage }}</div>
          <button
            class="btn btn-secondary btn-sm mt-2"
            @click="updateProfilePic"
            :disabled="isUploading || !selectedFile"
          >
            <span v-if="isUploading" class="spinner-border spinner-border-sm me-1"></span>
            {{ isUploading ? 'Subiendo...' : 'Subir Imagen' }}
          </button>
        </div>
      </div>

      <div class="col-md-8">
        <h4>Detalles del Usuario</h4>
        <hr />
        <div v-if="saveProfileError" class="alert alert-danger p-2">{{ saveProfileError }}</div>
        <div v-if="saveProfileSuccessMessage" class="alert alert-success p-2">{{ saveProfileSuccessMessage }}</div>

        <div v-if="!isEditingProfile" class="user-details">
          <p><strong>Nombre:</strong> {{ userData.name }}</p>
          <p><strong>Apellidos:</strong> {{ userData.surname }}</p>
          <p><strong>Email:</strong> {{ userData.email }}</p>
          <p><strong>Rol:</strong> {{ roleName }}</p>
          <p>
            <strong>Estado:</strong>
            <span :class="['badge', userData.active ? 'bg-success' : 'bg-secondary']">{{
              userData.active ? 'Activo' : 'Inactivo'
            }}</span>
          </p>
          <button class="btn btn-outline-secondary btn-sm mt-2" @click="startEditingProfile">
            <i class="bi bi-pencil-square"></i> Editar Mis Datos
          </button>
        </div>

        <form v-else @submit.prevent="saveProfileChanges">
          <div class="mb-3">
            <label for="profileName" class="form-label">Nombre:</label
            ><input
              type="text"
              id="profileName"
              class="form-control"
              v-model.trim="editFormData.name"
              required
              :disabled="isSavingProfile"
            />
          </div>
          <div class="mb-3">
            <label for="profileSurname" class="form-label">Apellidos:</label
            ><input
              type="text"
              id="profileSurname"
              class="form-control"
              v-model.trim="editFormData.surname"
              required
              :disabled="isSavingProfile"
            />
          </div>
          <div class="mb-3">
            <label for="profileEmail" class="form-label">Email:</label
            ><input
              type="email"
              id="profileEmail"
              class="form-control"
              v-model.trim="editFormData.email"
              required
              :disabled="isSavingProfile"
            />
          </div>
          <div class="text-end">
            <button
              type="button"
              class="btn btn-secondary me-2"
              @click="cancelEditingProfile"
              :disabled="isSavingProfile"
            >
              Cancelar
            </button>
            <button type="submit" class="btn btn-success" :disabled="isSavingProfile">
              <span v-if="isSavingProfile" class="spinner-border spinner-border-sm me-1"></span> Guardar Cambios
            </button>
          </div>
        </form>

        <div v-if="isProfesor && userData.id" class="mt-4 pt-3 border-top">
          <h4>Resumen de Asignaturas y Alumnos</h4>
          <div v-if="isLoadingSummary" class="text-center text-muted py-2">Cargando resumen...</div>
          <div v-else-if="summaryError" class="alert alert-warning p-2">{{ summaryError }}</div>
          <b-table
            v-else
            :items="teacherSubjectsSummary"
            :fields="summaryFields"
            striped
            hover
            small
            responsive="sm"
            empty-text="No impartes ninguna asignatura con alumnos matriculados actualmente."
            show-empty
            class="mt-2"
          >
            <template #cell(totalStudents)="data">
              <span class="badge bg-secondary rounded-pill">{{ data.item.totalStudents }}</span>
            </template>
          </b-table>
        </div>
      </div>
    </div>
    <div v-else class="alert alert-warning">No se pudieron cargar los datos del perfil.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import apiClient from '@/services/apiClient';
import AuthService from '@/services/auth/AuthService';
import RelationService from '@/services/relations/RelationService';
import UsersService from '@/services/users/UsersService';
import { useFetchData } from '@/composables/useFetchData';
import validator from 'validator';

// --- 1. Carga de Datos del Usuario  ---
const {
  data: userData,
  isLoading: isLoadingUser,
  error: userError,
  execute: fetchUserData,
} = useFetchData(AuthService.getMe, { initialData: null, dataKey: 'user' });
onMounted(fetchUserData);

// --- 2. Propiedades Computadas ---
const isProfesor = computed(() => userData.value?.rol === 2);
const roleName = computed(() => {
  if (!userData.value) return 'Cargando...';
  return (
    userData.value.role_name || (isProfesor.value ? 'Profesor' : userData.value.rol === 1 ? 'Alumno' : 'Desconocido')
  );
});

// --- 3. Lógica de Imagen de Perfil (usando refs) ---
const profileImageUrl = ref(''); // URL de la imagen a mostrar
const selectedFile = ref(null); // Archivo seleccionado en el input
const isUploading = ref(false); // Estado de carga para la subida
const uploadErrorMessage = ref(''); // Mensaje de error para la subida
const fileInputRef = ref(null); // Referencia de plantilla para el <input type="file">
const backendBaseUrl = computed(() => {
  return apiClient.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
});
const isEditingProfile = ref(false);
const isSavingProfile = ref(false);
const saveProfileError = ref('');
const saveProfileSuccessMessage = ref('');
const editFormData = ref({ name: '', surname: '', email: '' });
// Observador para actualizar la imagen cuando userData cambie (o cargue)

// Manejador para cuando se selecciona un archivo
const onFileChange = (event) => {
  const file = event.target.files?.[0];
  uploadErrorMessage.value = '';
  selectedFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  if (file && validateFile(file)) {
    selectedFile.value = file;
    profileImageUrl.value = URL.createObjectURL(file);
  } else if (file) {
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
};

// Validación del archivo (devuelve true/false, pone mensaje de error)
const validateFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (!validTypes.includes(file.type)) {
    uploadErrorMessage.value = 'Formato no válido (solo jpeg, jpg, png, gif).';
    return false;
  }
  if (file.size > maxSize) {
    uploadErrorMessage.value = 'Archivo demasiado grande (Máx 10MB).';
    return false;
  }
  return true;
};

// Sube la imagen seleccionada al backend
const updateProfilePic = async () => {
  // Verifica que haya un archivo seleccionado y tengamos el ID del usuario
  if (!selectedFile.value || !userData.value?.id) {
    uploadErrorMessage.value = '...';
    return;
  }
  isUploading.value = true;
  uploadErrorMessage.value = '';
  const formData = new FormData();
  formData.append('image', selectedFile.value);
  try {
    const response = await AuthService.uploadProfilePicture(userData.value.id, formData);
    if (response.success) {
      alert('Imagen actualizada.');
      // Actualizar UI
      if (response.imageUrl) {
        profileImageUrl.value = response.imageUrl;
      } else if (response.filename) {
        profileImageUrl.value = `<span class="math-inline">\{backendBaseUrl\.value\}/uploads/profile\_images/</span>{response.filename}`;
      }
      if (userData.value && response.filename) {
        userData.value.profile_image = response.filename;
      } // Actualiza estado local
      selectedFile.value = null;
      if (fileInputRef.value) {
        fileInputRef.value.value = '';
      }
    } else {
      uploadErrorMessage.value = response.message || 'Error al subir.';
    }
  } catch (error) {
    console.error('Error pic:', error);
    uploadErrorMessage.value = error.response?.data?.message || error.message || 'Error de red.';
  } finally {
    isUploading.value = false;
    /* Revertir preview si falló */ if (uploadErrorMessage.value) {
      fetchUserData();
    }
  } // Recargar datos si falla
};

// Copia los datos actuales al formulario de edición
function initializeEditForm(currentUserData) {
  if (currentUserData) {
    editFormData.value.name = currentUserData.name || '';
    editFormData.value.surname = currentUserData.surname || '';
    editFormData.value.email = currentUserData.email || '';
  }
}

// Activa el modo edición
function startEditingProfile() {
  saveProfileError.value = ''; // Limpiar errores/éxitos previos
  saveProfileSuccessMessage.value = '';
  initializeEditForm(userData.value); // Carga datos actuales en el form
  isEditingProfile.value = true;
}

// Cancela el modo edición
function cancelEditingProfile() {
  isEditingProfile.value = false;
  saveProfileError.value = ''; // Limpiar errores
  saveProfileSuccessMessage.value = '';
}

// Guarda los cambios del perfil
async function saveProfileChanges() {
  saveProfileError.value = '';
  saveProfileSuccessMessage.value = '';

  // Validación simple
  if (!editFormData.value.name || !editFormData.value.surname || !editFormData.value.email) {
    saveProfileError.value = 'Nombre, Apellidos y Email son obligatorios.';
    return;
  }
  if (!validator.isEmail(editFormData.value.email)) {
    saveProfileError.value = 'El formato del email no es válido.';
    return;
  }
  if (!userData.value?.id) {
    // Seguridad
    saveProfileError.value = 'Error: No se pudo identificar al usuario.';
    return;
  }

  isSavingProfile.value = true;
  try {
    // Payload con los datos a enviar
    const payload = {
      name: editFormData.value.name,
      surname: editFormData.value.surname,
      email: editFormData.value.email,
      // NO enviamos rol ni active desde aquí
    };
    // Llamamos al servicio de Users (asegúrate que está importado)
    const response = await UsersService.updateUser(userData.value.id, payload);

    if (response.success) {
      saveProfileSuccessMessage.value = 'Perfil actualizado exitosamente.';
      isEditingProfile.value = false; // Salir del modo edición
      // Forzar recarga de TODOS los datos del usuario desde la API
      // para asegurar que tenemos la info más reciente (incluyendo profile_image si cambió)
      await fetchUserData();
    } else {
      saveProfileError.value = response.message || 'Error al guardar (respuesta backend).';
    }
  } catch (error) {
    console.error('Error guardando perfil:', error);
    saveProfileError.value = error.response?.data?.message || error.message || 'Error de comunicación al guardar.';
  } finally {
    isSavingProfile.value = false;
  }
}

const teacherSubjectsSummary = ref([]); // Guarda [{ subject: 'Nombre', totalStudents: N }, ...]
const isLoadingSummary = ref(false); // Estado de carga para el resumen
const summaryError = ref(''); // Error al cargar resumen
// Definición de columnas para la tabla resumen
const summaryFields = [
  { key: 'subject', label: 'Asignatura Impartida', sortable: true },
  { key: 'totalStudents', label: 'Nº Alumnos', sortable: true, class: 'text-center', thClass: 'text-center' },
];

// Función para cargar el resumen de asignaturas y alumnos del profesor
async function fetchTeacherSubjectsSummary() {
  // Asegurarse de que tenemos el ID y es profesor antes de llamar
  if (!userData.value?.id || !isProfesor.value) return;

  isLoadingSummary.value = true;
  summaryError.value = '';
  teacherSubjectsSummary.value = []; // Limpiar antes

  try {
    // Llamamos a RelationService.getSubjectsTeacher (la que cuenta alumnos)
    const response = await RelationService.getSubjectsTeacher(userData.value.id);
    if (response.success && response.subjects) {
      teacherSubjectsSummary.value = response.subjects; // Guarda el array [{ subject, totalStudents }, ...]
    } else {
      summaryError.value = response.message || 'Error al cargar resumen de asignaturas.';
    }
  } catch (error) {
    console.error('Error fetchTeacherSubjectsSummary:', error);
    summaryError.value = error.response?.data?.message || error.message || 'Error de red al cargar resumen.';
  } finally {
    isLoadingSummary.value = false;
  }
}

watch(
  userData,
  (newUserData, oldUserData) => {
    // Actualiza imagen (sin cambios)
    if (!isUploading.value && newUserData?.profile_image) {
      profileImageUrl.value = `${backendBaseUrl.value}/uploads/profile_images/${newUserData.profile_image}`;
    } else if (!isUploading.value && !newUserData?.profile_image) {
      profileImageUrl.value = '';
    }
    // Inicializa form edición (sin cambios)
    if (isEditingProfile.value && newUserData) {
      initializeEditForm(newUserData);
    }

    // --- Cargar resumen si es profesor ---
    if (newUserData?.rol === 2 && newUserData?.id) {
      // Llama solo si el rol o ID cambiaron o es la carga inicial relevante
      if (newUserData.id !== oldUserData?.id || newUserData.rol !== oldUserData?.rol) {
        fetchTeacherSubjectsSummary();
      }
    } else {
      // Limpiar si no es profesor o no hay datos
      teacherSubjectsSummary.value = [];
      summaryError.value = '';
    }
  },
  { immediate: true, deep: true }
); // Immediate para intentar cargar al inicio
</script>

<style scoped>
/* Estilos mejorados y organizados */
.profile-page {
  max-width: 850px;
  margin: 30px auto;
}
h2 {
  margin-bottom: 1.5rem;
}
h4 {
  margin-top: 1.5rem;
  color: #495057;
} /* Estilo para subtítulos */
.profile-pic-container {
  width: 150px;
  height: 150px;
  margin-bottom: 1rem;
  position: relative;
}
.profile-pic {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #dee2e6;
}
.placeholder-image {
  width: 150px;
  height: 150px;
  background: #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  margin-bottom: 1rem;
}
.upload-section .form-control-sm {
  max-width: 250px;
  display: block;
} /* Input file como bloque */
.upload-section button {
  display: block;
  width: 100%;
  max-width: 250px;
} /* Botón ocupa ancho del input */
.user-details p {
  margin-bottom: 0.75rem;
  font-size: 1rem;
}
.user-details strong {
  min-width: 90px;
  display: inline-block;
  color: #495057;
  margin-right: 0.5rem;
}
.text-danger.small {
  font-size: 0.8em;
}
form .btn {
  min-width: 100px;
}
.text-end {
  text-align: right;
}
.me-2 {
  margin-right: 0.5rem !important;
}
.mt-4 {
  margin-top: 1.5rem !important;
} /* Ajuste margen */
.pt-3 {
  padding-top: 1rem !important;
} /* Ajuste padding */
.border-top {
  border-top: 1px solid #dee2e6 !important;
}
:deep(.table th.text-center),
:deep(.table td.text-center) {
  text-align: center;
} /* Centrar contenido tabla resumen */
/* Importar iconos */
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css');
</style>
