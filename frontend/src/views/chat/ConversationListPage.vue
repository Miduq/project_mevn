<!-- frontend/src/views/chat/ConversationListPage.vue -->

<template>
  <div class="conversation-list-page container mt-4">
    <h2>Mis Conversaciones</h2>
    <p>Aquí puedes ver y descargar el historial de tus conversaciones.</p>

    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando conversaciones...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">Error al cargar las conversaciones: {{ error }}</div>

    <div v-else-if="!conversations || conversations.length === 0" class="alert alert-secondary text-center">
      Aún no tienes ninguna conversación registrada. ¡Inicia un chat desde la sección de Chat!
    </div>

    <div v-else class="list-group shadow-sm mt-3">
      <div
        v-for="conv in conversations"
        :key="conv.partnerId"
        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
      >
        <div class="d-flex align-items-center">
          <div class="me-3">
            <span
              class="placeholder-avatar rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center"
              style="width: 45px; height: 45px; font-size: 1.1rem"
            >
              {{ (conv.partner?.name?.[0] || '?').toUpperCase() }}
            </span>
          </div>
          <div>
            <h6 class="mb-0">{{ conv.partner?.name || 'Usuario' }} {{ conv.partner?.surname || 'Desconocido' }}</h6>
            <small class="text-muted" :title="conv.lastMessageText">
              Último mensaje: {{ formatTimestamp(conv.lastMessageTimestamp) }}
            </small>
          </div>
        </div>
        <div>
          <button
            class="btn btn-sm btn-outline-success"
            @click="downloadHistory(conv.partnerId, conv.partner)"
            :disabled="isDownloadingCsv === conv.partnerId"
            title="Descargar Historial CSV"
          >
            <span
              v-if="isDownloadingCsv === conv.partnerId"
              class="spinner-border spinner-border-sm me-1"
              style="width: 0.8rem; height: 0.8rem"
            ></span>
            <i v-else class="bi bi-download"></i>
            <span class="d-none d-md-inline ms-1">Descargar CSV</span>
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="downloadMessage"
      :class="['alert', downloadError ? 'alert-danger' : 'alert-success', 'p-2', 'mt-3']"
      role="alert"
    >
      {{ downloadMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFetchData } from '@/composables/useFetchData';
import ChatService from '@/services/chat/chatService';
import apiClient from '@/services/apiClient';

// Fetch conversation list usando el composable
const {
  data: conversations,
  isLoading,
  error,
  execute: fetchConversations,
} = useFetchData(
  ChatService.listConversations, // Llama a la nueva función del servicio
  { initialData: [], dataKey: 'conversations' } // La API devuelve { success, conversations }
);

// Cargar conversaciones al montar el componente
onMounted(fetchConversations);

// Formatear Timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
};

// Lógica para descargar historial
const isDownloadingCsv = ref(null); // Guarda el partnerId cuya descarga está en progreso
const downloadMessage = ref(''); // Mensaje de éxito/error de descarga
const downloadError = ref(false); // Flag para saber si el mensaje es de error

// Reemplaza la función downloadHistory existente por esta:
const downloadHistory = async (partnerId, partnerInfo) => {
  // Recibe partnerInfo para el nombre archivo
  if (!partnerId || isDownloadingCsv.value === partnerId) return; // Evitar doble clic

  const partnerName = `${partnerInfo?.name || 'Usuario'}_${partnerInfo?.surname || partnerId}`;
  console.log(`Solicitando descarga CSV para partner ID: ${partnerId} ${partnerName})`);
  isDownloadingCsv.value = partnerId; // Poner estado de carga para este botón
  downloadMessage.value = ''; // Limpiar mensajes previos
  downloadError.value = false;

  try {
    const url = `/api/chats/download/${partnerId}`; // URL del backend
    console.log(`ChatService (Download): GET ${url}`);

    // Llamar usando apiClient para incluir Token y recibir Blob
    const response = await apiClient.get(url, {
      responseType: 'blob', // ¡Clave para recibir el archivo!
    });

    // Crear un Blob con los datos recibidos y el tipo correcto
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'text/csv', // Usar tipo del header si existe
    });

    // Crear una URL temporal para el Blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Crear un enlace <a> temporal para iniciar la descarga
    const link = document.createElement('a');
    link.href = blobUrl;

    // Intentar obtener nombre de archivo del header Content-Disposition, sino generar uno
    let filename = `historial_chat_${partnerName}.csv`; // Nombre por defecto
    const disposition = response.headers['content-disposition'];
    if (disposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches?.[1]) {
        filename = matches[1].replace(/['"]/g, ''); // Quitar comillas si las hay
      }
    }
    link.setAttribute('download', filename); // Establecer nombre de archivo

    // Simular clic en el enlace
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Liberar la URL temporal del Blob
    window.URL.revokeObjectURL(blobUrl);

    console.log('Descarga CSV iniciada para:', filename);
  } catch (err) {
    console.error('Error descargando historial CSV:', err);
    // Intentar leer mensaje de error si el backend lo envió como JSON (menos probable con blob)
    let errorMsg = 'Error al descargar el historial.';
    if (
      err.response &&
      err.response.data instanceof Blob &&
      err.response.data.type.toLowerCase().indexOf('json') !== -1
    ) {
      // Si el error es un JSON dentro del Blob, intentar leerlo
      try {
        const errorJson = JSON.parse(await err.response.data.text());
        errorMsg = errorJson.message || errorMsg;
      } catch (parseError) {
        /* Ignorar error de parseo */
      }
    } else if (err.response?.data?.message) {
      errorMsg = err.response.data.message;
    } else if (err.message) {
      errorMsg = err.message;
    }
    downloadMessage.value = errorMsg;
    downloadError.value = true;
  } finally {
    // Quitar estado de carga después de un pequeño retardo
    setTimeout(() => {
      isDownloadingCsv.value = null;
    }, 500);
    // Limpiar mensaje después de un tiempo
    setTimeout(() => {
      downloadMessage.value = '';
    }, 7000);
  }
};
</script>

<style scoped>
.conversation-list-page {
  max-width: 900px;
}
.list-group-item {
  padding-top: 1rem;
  padding-bottom: 1rem;
}
.placeholder-avatar {
  vertical-align: middle;
}
.list-group-item h6 {
  margin-bottom: 0.1rem !important;
}
.list-group-item small {
  font-size: 0.85em;
}
.btn-sm .bi {
  vertical-align: text-bottom;
}
</style>
