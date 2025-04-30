<!-- frontend/src/views/chat/ChatPage.vue -->

<template>
  <div class="chat-page container mt-4">
    <h2 class="mb-3">Chat</h2>
    <hr />
    <div class="chat-interface row">
      <div class="col-md-4 mb-3 mb-md-0">
        <h5>Contactos</h5>
        <div v-if="isLoadingContacts" class="text-center text-muted small py-2">Cargando...</div>
        <div v-else-if="contactsError" class="alert alert-warning p-1 px-2 small">{{ contactsError }}</div>
        <div v-else-if="contacts.length === 0" class="text-center text-muted small py-2">
          No hay contactos disponibles.
        </div>
        <div v-else class="list-group user-list">
          <a
            v-for="contact in contacts"
            :key="contact.id"
            href="#"
            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
            :class="{ active: selectedContact?.id === contact.id }"
            @click.prevent="selectContact(contact)"
          >
            <span>
              {{ contact.name }} {{ contact.surname }}
              <small class="text-muted d-block">{{ contact.type }}</small>
            </span>
            <span v-if="unreadSenders.has(contact.id)" class="badge bg-danger rounded-pill p-1" title="Nuevos mensajes">
              <span class="visually-hidden">Nuevos mensajes</span>
            </span>
          </a>
        </div>
      </div>
      <div class="col-md-8">
        <h5>
          Conversación con:
          <span v-if="selectedContact">{{ selectedContact.name }} {{ selectedContact.surname }}</span>
          <span v-else class="text-muted">Nadie seleccionado</span>
        </h5>
        <div ref="chatWindowRef" class="messages-area card card-body mb-3 shadow-sm">
          <div v-if="isLoadingDetails" class="text-center text-muted p-5">
            <div class="spinner-border spinner-border-sm" role="status"></div>
            Cargando historial...
          </div>
          <p v-if="!selectedContact" class="text-center text-muted fst-italic mt-3">
            Selecciona un contacto de la lista para empezar a chatear.
          </p>
          <p v-else-if="messages.length === 0" class="text-center text-muted fst-italic mt-3">
            No hay mensajes todavía. ¡Envía el primero!
          </p>
          <div
            v-else
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message-bubble mb-2', msg.isOwnMessage ? 'text-end' : 'text-start']"
          >
            <div
              :class="[
                'd-inline-block p-2 rounded',
                msg.isOwnMessage ? 'bg-primary-subtle text-primary-emphasis' : 'bg-light text-dark',
              ]"
              style="max-width: 75%"
            >
              <div v-if="!msg.isOwnMessage" class="fw-bold small mb-1">{{ msg.senderUsername || '?' }}</div>
              <div>{{ msg.text }}</div>
              <div
                :class="['text-muted small mt-1', msg.isOwnMessage ? 'text-end' : 'text-start']"
                style="font-size: 0.7em"
              >
                {{ new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }}
              </div>
            </div>
          </div>
        </div>
        <div class="input-area d-flex gap-2">
          <input
            type="text"
            class="form-control"
            placeholder="Escribe tu mensaje..."
            v-model="newMessage"
            @keyup.enter="sendMessage"
            :disabled="!isConnected || !selectedContact"
          />
          <button
            class="btn btn-primary"
            @click="sendMessage"
            :disabled="!isConnected || !selectedContact || !newMessage.trim()"
          >
            <i class="bi bi-send"></i> Enviar
          </button>
        </div>
        <div v-if="chatError" class="alert alert-warning p-2 mt-2 small" role="alert">
          {{ chatError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useSocket } from '@/composables/useSocket.js';
import RelationService from '@/services/relations/RelationService';
import { jwtDecode } from 'jwt-decode';

// 1. Obtenemos el estado y las funciones del composable
const {
  isConnected,
  userId,
  emitEvent, // <-- Obtenemos la función para emitir eventos
  registerListener, // <-- Obtenemos la función para limpiar
  unregisterListener, // <-- Obtenemos la función para limpiar
  unreadSenders, // <-- Obtenemos el Set global
  setActiveChatPartner, // <-- Obtenemos la función para limpiar
} = useSocket(); // connect/disconnect no se llaman aquí directamente si App.vue lo maneja

// Estado del Chat ---
const messages = ref([]);
const newMessage = ref('');
const chatWindowRef = ref(null);
const contacts = ref([]);
const isLoadingContacts = ref(false);
const contactsError = ref('');
const selectedContact = ref(null);
const chatError = ref('');
const isLoadingDetails = ref(false);

// Estado de conexión
const userRole = computed(() => {
  const token = localStorage.getItem('token');
  try {
    if (!token) return null;
    // Asegúrate que tu token JWT tiene la propiedad 'rol' (o 'role')
    return jwtDecode(token).rol || jwtDecode(token).role;
  } catch {
    return null;
  }
});

// Función para cargar contactos
async function fetchContacts() {
  // Solo cargar si estamos conectados y tenemos ID y Rol
  if (!isConnected.value || !userId.value || !userRole.value) {
    console.log('fetchContacts: No conectado o falta userId/userRole. Abortando.');
    // Limpiar por si acaso
    contacts.value = [];
    selectedContact.value = null;
    return;
  }

  isLoadingContacts.value = true;
  contactsError.value = '';
  contacts.value = [];
  selectedContact.value = null; // Deseleccionar al recargar

  try {
    let response;
    if (userRole.value === 1) {
      // Soy Alumno -> Cargar Profesores
      console.log('ChatPage: Cargando profesores para alumno', userId.value);
      response = await RelationService.getMyProfessors(userId.value);

      if (response.success && response.professors) {
        // Procesar para obtener profesores únicos
        const uniqueProfessors = new Map();
        response.professors.forEach((relation) => {
          // Accedemos al objeto anidado 'teacher'
          const teacher = relation.teacher;
          // Verificamos que 'teacher' y su 'id' existan
          if (teacher && teacher.id && !uniqueProfessors.has(teacher.id)) {
            uniqueProfessors.set(teacher.id, {
              id: teacher.id, // ID del profesor
              name: teacher.name, // Nombre del profesor
              surname: teacher.surname, // Apellido del profesor
              type: 'Profesor',
            });
          }
        });
        contacts.value = Array.from(uniqueProfessors.values()).sort((a, b) => a.surname.localeCompare(b.surname || '')); // Ordenar
      } else {
        throw new Error(response.message || 'Error cargando profesores');
      }
    } else if (userRole.value === 2) {
      // Soy Profesor -> Cargar Alumnos
      console.log('ChatPage: Cargando alumnos para profesor', userId.value);
      response = await RelationService.getMyStudents(userId.value, { page: 1, limit: 1000 });
      if (response.success && response.students) {
        // Procesar para obtener alumnos únicos
        const uniqueContacts = new Map();
        // getMyStudents devuelve [{ studentId, name, surname, email, subject, relationId }]
        response.students.forEach((s) => {
          if (s.studentId && !uniqueContacts.has(s.studentId)) {
            uniqueContacts.set(s.studentId, { id: s.studentId, name: s.name, surname: s.surname, type: 'Alumno' });
          }
        });
        contacts.value = Array.from(uniqueContacts.values()).sort((a, b) => a.surname.localeCompare(b.surname)); // Ordenar
      } else {
        throw new Error(response.message || 'Error cargando alumnos');
      }
    }
    console.log('Chat contacts loaded:', contacts.value);
  } catch (error) {
    console.error('>>> ChatPage: Error DENTRO de fetchContacts:', error); // Log detallado
    contactsError.value = error.response?.data?.message || error.message || 'Error al cargar contactos.';
  } finally {
    isLoadingContacts.value = false;
  }
}

function selectContact(contact) {
  if (selectedContact.value?.id === contact.id) return;
  selectedContact.value = contact;
  messages.value = [];
  chatError.value = '';
  isLoadingHistory.value = true; // Asume que tienes isLoadingHistory

  // --- Informar al composable qué chat está activo ---
  setActiveChatPartner(contact.id);
  // La función markSenderAsRead ahora se llama DENTRO de setActiveChatPartner

  // TODO: Cargar historial (la lógica de fetch va aquí)
  fetchHistoryForContact(contact.id); // Necesitarías una función así

  console.log(`Seleccionado chat con ${contact.name}.`);
  scrollToBottom();
}

// Se llama al pulsar Enviar o presionar Enter
const sendMessage = () => {
  const textToSend = newMessage.value.trim();
  chatError.value = ''; // Limpiar error previo siempre

  // Reemplazar Alerts por asignación a chatError
  if (!selectedContact.value) {
    chatError.value = 'Por favor, selecciona un contacto para enviarle un mensaje.';
    console.warn(chatError.value); // Mantenemos log si quieres
    return; // Detener
  }
  if (!isConnected.value) {
    chatError.value = 'No estás conectado al servidor de chat.';
    console.warn(chatError.value);
    return; // Detener
  }
  if (!textToSend) {
    chatError.value = 'No puedes enviar un mensaje vacío.';
    console.warn(chatError.value);
    return; // Detener
  }
  // Si pasa validaciones, enviar mensaje
  console.log(`ChatPage: Enviando mensaje "${textToSend}" al destinatario ID ${selectedContact.value.id}`);
  emitEvent('sendMessage', {
    recipientId: selectedContact.value.id,
    text: textToSend,
  });
  newMessage.value = '';
  scrollToBottom();
};

// Callback que se ejecuta cuando se recibe un evento 'newMessage' del servidor
const handleNewMessage = (messageData) => {
  console.log('ChatPage: Raw newMessage recibido:', JSON.parse(JSON.stringify(messageData)));
  const currentUserId = userId.value;
  const partnerId = selectedContact.value?.id;
  if (!partnerId || !currentUserId) return;
  // Comprobar si el mensaje pertenece a la conversación activa:
  const isRelevant =
    (messageData.senderId === currentUserId && messageData.recipientId === partnerId) ||
    (messageData.recipientId === currentUserId && messageData.senderId === partnerId);

  if (isRelevant) {
    // Añadir a la lista visible
    messages.value.push({
      ...messageData,
      isOwnMessage: messageData.senderId === currentUserId,
    });
    scrollToBottom(); // Hacer scroll si es relevante
  } else {
    console.log('ChatPage: Mensaje recibido pero NO pertenece al chat activo. Ignorando display.');
  }
};

// Función para hacer scroll automático al final del chat
const scrollToBottom = async () => {
  // Esperar a que Vue actualice el DOM
  await nextTick();
  const chatWindow = chatWindowRef.value;
  if (chatWindow) {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
};

const isLoadingHistory = ref(false); // Añadir si no existe
async function fetchHistoryForContact(partnerId) {
  if (!partnerId) return;
  isLoadingHistory.value = true;
  chatError.value = '';
  try {
    const response = await RelationService.getChatHistory(partnerId); // Asumiendo que está en RelationService
    if (response.success && Array.isArray(response.history)) {
      messages.value = response.history.map((msg) => ({ ...msg, isOwnMessage: msg.senderId === userId.value }));
      scrollToBottom();
    } else {
      chatError.value = response.message || 'Error al cargar historial.';
    }
  } catch (error) {
    chatError.value = error.response?.data?.message || error.message || 'Error.';
  } finally {
    isLoadingHistory.value = false;
  }
}

watch(
  [isConnected, userId], // 1. Array de fuentes a observar
  ([newIsConnected, newUserId], [oldIsConnected, oldUserId]) => {
    // --- Lógica para registrar/desregistrar listeners basada en isConnected ---
    if (newIsConnected && !oldIsConnected) {
      // Acabamos de conectar (pasamos de false a true)
      console.log('Watcher Combinado: Registrando listeners por nueva conexión.');
      registerListener('newMessage', handleNewMessage);
    } else if (!newIsConnected && oldIsConnected) {
      // Acabamos de desconectar (pasamos de true a false)
      console.log('Watcher Combinado: Desregistrando listeners por desconexión.');
      unregisterListener('newMessage', handleNewMessage);
    }

    // --- Lógica para cargar contactos ---
    if (newIsConnected && newUserId && contacts.value.length === 0) {
      console.log('Watcher Combinado: Conectado con ID y sin contactos, llamando a fetchContacts.');
      fetchContacts();
    }

    // --- Lógica para limpiar estado si nos desconectamos o perdemos el usuario ---
    if (!newIsConnected || !newUserId) {
      // Si perdemos conexión O el ID de usuario se vuelve null (ej. logout)
      if (
        contacts.value.length > 0 ||
        selectedContact.value ||
        messages.value.length > 0 ||
        unreadSenders.value.size > 0
      ) {
        console.log('Watcher Combinado: Limpiando estado por desconexión o logout.');
        contacts.value = [];
        selectedContact.value = null;
        messages.value = [];
        unreadSenders.value.clear();
        chatError.value = ''; // Limpiar también errores de chat
      }
    }
  },
  {
    immediate: true,
  }
);

// 3. Desconectar cuando el componente se destruya
onUnmounted(() => {
  console.log('ChatPage: Desmontado.');
  // Limpiar el listener cuando el componente se destruye
  unregisterListener('newMessage', handleNewMessage);
  setActiveChatPartner(null);
});
</script>

<style scoped>
.chat-page {
  padding-bottom: 50px;
}
.connection-status .badge {
  font-size: 0.9em;
}
.messages-area {
  background-color: #ffffff;
  height: 55vh; /* Más altura */
  overflow-y: scroll;
}
.user-list {
  max-height: calc(55vh + 75px);
  overflow-y: auto; /* Scroll para lista larga */
}
.list-group-item small {
  font-size: 0.8em;
}
.message-bubble > div {
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
}
/* Importamos iconos */
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css');
</style>
