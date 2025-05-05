// frontend/src/composables/useProfilePicUpload.js

import { ref, computed, watch, readonly } from 'vue';
import AuthService from '@/services/auth/AuthService';

// Este composable se encarga de la subida de imágenes de perfil
export function useProfilePicUpload(userIdRef, initialImageUrlRef) {
  const profileImageUrl = ref(''); //URL de la imagen
  const selectedFile = ref(null); // Archivo seleccionado en el input
  const isUploading = ref(false); // Estado de carga
  const uploadError = ref(''); // Mensaje de error en la subida de imagen
  const uploadSuccess = ref(''); // Mensaje de éxito en la subida de imagen

  // Validación del archivo
  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (!validTypes.includes(file.type)) {
      uploadError.value = 'Formato de archivo no válido.';
      return false;
    }
    if (file.size > maxSize) {
      uploadError.value = 'El archivo es demasiado grande. Máximo 10 MB.';
      return false;
    }
    return true;
  };

  // Watcher para la URL inicial
  watch(
    initialImageUrlRef,
    (newUrl) => {
      if (!selectedFile.value) {
        profileImageUrl.value = newUrl || '';
      }
    },
    { immediate: true }
  );

  // Función para subir la imagen
  const onFileChange = (event) => {
    uploadError.value = '';
    uploadSuccess.value = '';
    selectedFile.value = null;
    const fileInput = event.target;
    const file = fileInput?.files?.[0];

    if (file && validateFile(file)) {
      selectedFile.value = file;
      profileImageUrl.value = URL.createObjectURL(file);
    } else {
      // Revertir a la URL original si el archivo es inválido
      profileImageUrl.value = initialImageUrlRef.value || '';
      if (fileInput) fileInput.value = '';
    }
    // Limpiar input para permitir volver a seleccionar el mismo archivo
    if (event.target) {
      event.target.value = '';
    }
  };

  // Computed para la URL de la imagen
  const updateProfilePic = async () => {
    const currentUserId = userIdRef.value; // Obtiene el ID del usuario actual
    const currentFile = selectedFile.value; // Obtiene el archivo seleccionado

    if (!currentFile || !currentUserId) {
      uploadError.value = 'No hay archivo seleccionado o ID de usuario no válido.';
      return;
    }

    isUploading.value = true;
    uploadError.value = '';
    uploadSuccess.value = ''; // Reinicia estados de carga y mensajes
    const formData = new FormData();
    formData.append('image', currentFile); // Crea un FormData con el archivo

    try {
      const response = await AuthService.uploadProfilePicture(currentUserId, formData); // Llama al servicio para subir la imagen
      if (response.success) {
        uploadSuccess.value = response.message;
        const newS3Url = response.imageUrl; // El backend devuelve la URL S3 completa aquí

        // Actualiza la URL con la respuesta
        if (newS3Url) {
          profileImageUrl.value = newS3Url;
        } else {
          console.warn('Respuesta de subida exitosa pero sin imageUrl.');
          uploadError.value = 'Subida OK, pero no se recibió URL.';
          profileImageUrl.value = initialImageUrlRef.value || ''; // Revertir
        }
        selectedFile.value = null; // Limpiar selección local
      } else {
        uploadError.value = response.message; // Mensaje de error
      }
    } catch (error) {
      console.error('Error al subir la imagen:', error); // Error en la subida
      uploadError.value = error.response?.data?.message || error.message || 'Error de red.';
    } finally {
      isUploading.value = false;
      // Revertir preview si falló
      if (uploadError.value) {
        profileImageUrl.value = initialImageUrlRef.value || ''; // Revertir a la URL inicial
        selectedFile.value = null;
      }
    }
  };

  // Devolvemos el estados y funciones
  return {
    profileImageUrl: readonly(profileImageUrl), // URL de la imagen
    isUploading: readonly(isUploading), // Estado de carga
    uploadError: readonly(uploadError), // Mensaje de error
    uploadSuccess: readonly(uploadSuccess), // Mensaje de éxito
    canUpload: computed(() => !!selectedFile.value), // Computed para verificar si se puede subir
    onFileChange,
    updateProfilePic,
  };
}
