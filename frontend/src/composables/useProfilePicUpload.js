// frontend/src/composables/useProfilePicUpload.js

import { ref, computed, watch, readonly } from 'vue';
import apiClient from '@/services/apiClient';
import AuthService from '@/services/auth/AuthService';

// Este composable se encarga de la subida de imágenes de perfil
export function useProfilePicUpload(userIdRef, initialImage) {
  const profileImageUrl = ref(''); //URL de la imagen
  const selectefFile = ref(null); // Archivo seleccionado en el input
  const isUploading = ref(false); // Estado de carga
  const uploadError = ref(''); // Mensaje de error en la subida de imagen
  const uploadSuccess = ref(''); // Mensaje de éxito en la subida de imagen

  // Helper para obtener la URL del backend
  const backendBaseUrl = computed(() => {
    return apiClient.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
  });

  // Helper para construir la URL de la imagen guardada
  const calculateImageUrl = (filename) => {
    if (!filename) return ''; // Devuelve nada sino hay nombre de archivo
    return `${backendBaseUrl.value}/uploads/profile_images/${filename}`; // Devuelve la URL completa
  };

  // Watcher para la imagen inicial
  watch(
    initialImage,
    (newImage) => {
      if (!selectefFile.value) {
        profileImageUrl.value = calculateImageUrl(newImage); // Calcula la URL de la imagen
      }
    },
    { immediate: true }
  );

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

  // Función para subir la imagen
  const onFileChange = (event) => {
    uploadError.value = ''; // Limpia errores previos
    uploadSuccess.value = ''; // Limpia mensajes de éxito previos
    selectefFile.value = null; // Reinicia el archivo seleccionado
    const fileInput = event.target; // Obtiene el input de archivo
    const file = fileInput?.files?.[0]; // Obtiene el archivo seleccionado

    if (file && validateFile(file)) {
      selectedFile.value = file; // Guarda el archivo seleccionado
      profileImageUrl.value = URL.createObjectURL(file); // Crea una URL temporal para la imagen
    } else {
      profileImageUrl.value = calculateImageUrl(initialImage); // Si no hay archivo, usa la imagen inicial
      if (fileInput) fileInput.value = ''; // Limpia el input de archivo si era inválido
    }
  };

  // Computed para la URL de la imagen
  const updateProfilePic = async () => {
    const currentUserId = userIdRef.value; // Obtiene el ID del usuario actual
    const currentFile = selectefFile.value; // Obtiene el archivo seleccionado

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
      const response = await AuthService.updateProfilePic(currentUserId, formData); // Llama al servicio para subir la imagen
      if (response.success) {
        uploadSuccess.value = response.message; // Mensaje de éxito
        const newFilename = response.filename; // Obtiene el nuevo nombre de archivo

        // Actualiza la URL con la respuesta
        if (response.imageUrl) {
          profileImageUrl.value = response.imageUrl;
        } else if (newFilename) {
          profileImageUrl.value = calculateImageUrl(newFilename);
        } // Calcula la URL de la imagen
        selectefFile.value = null; // Limpia el archivo seleccionado
      } else {
        uploadError.value = response.message; // Mensaje de error
      }
    } catch (error) {
      console.error('Error al subir la imagen:', error); // Error en la subida
      uploadError.value =
        error.response?.data?.message || error.message || 'Error al subir la imagen. Inténtalo de nuevo.';
      profileImageUrl.value = calculateImageUrl(initialImage); // Reestablece la imagen inicial si falló la anterior
      selectefFile.value = null; // Limpia el archivo seleccionado
    } finally {
      isUploading.value = false; // Finaliza el estado de carga
    }
  };

  // Devolvemos el estados y funciones
  return {
    profileImageUrl: readonly(profileImageUrl), // URL de la imagen
    isUploading: readonly(isUploading), // Estado de carga
    uploadError: readonly(uploadError), // Mensaje de error
    uploadSuccess: readonly(uploadSuccess), // Mensaje de éxito
    canUpload: computed(() => !!selectefFile.value), // Computed para verificar si se puede subir
    onFileChange,
    updateProfilePic,
  };
}
