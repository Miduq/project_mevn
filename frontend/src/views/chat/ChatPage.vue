<!-- frontend/src/views/chat/ChatPage.vue -->

<template>
  <div class="chat-page container mt-4">
    <h2 class="mb-3">Chat</h2>

    <div class="connection-status card bg-light p-2 mb-3 shadow-sm">...</div>
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
            class="list-group-item list-group-item-action"
            :class="{ active: selectedContact?.id === contact.id }"
            @click.prevent="selectContact(contact)"
          >
            {{ contact.name }} {{ contact.surname }}
            <small class="text-muted d-block">{{ contact.type }}</small>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useSocket } from '@/composables/useSocket';
import RelationService from '@/services/relations/RelationService';
import { jwtDecode } from 'jwt-decode';

// 1. Obtenemos el estado y las funciones del composable
const {
  isConnected, // boolean reactivo: ¿estamos conectados?
  connectionError, // string|null reactivo: último error de conexión
  connect, // función para iniciar la conexión (con token)
  disconnect, // función para desconectar manualmente
  userId, // ref(null) -> ID del usuario autenticado (si/cuando se recibe)
  username, // ref(null) -> Username del usuario (si/cuando se recibe)
  registerListener, // función para escuchar eventos (ej. 'newMessage')
  unregisterListener, // función para dejar de escuchar
  emitEvent, // función para enviar eventos (ej. 'sendMessage')
} = useSocket();

// --- 2. Estado del Chat ---
const messages = ref([]); // Array para guardar los mensajes recibidos/enviados
const newMessage = ref(''); // v-model para el input de nuevo mensaje
const chatWindowRef = ref(null); // Ref para el contenedor de mensajes (para scroll)

// --- NUEVO: Estado para Contactos y Selección ---
const contacts = ref([]); // Lista de usuarios con quien chatear {id, name, surname, type}
const isLoadingContacts = ref(false);
const contactsError = ref('');
const selectedContact = ref(null); // El contacto seleccionado actualmente {id, name, surname, type}
const chatError = ref('');
// --- Propiedad Computada para Rol ---
// Necesitamos saber el rol para cargar los contactos correctos
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

// --- NUEVA: Función para cargar contactos ---
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
      // Usamos getMyStudents. Podríamos necesitar todos, no solo los de la pág 1.
      // Pedimos una página muy grande para simular "todos" por ahora.
      // Idealmente, el backend tendría un endpoint para "todos mis alumnos para chat".
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
    console.error('Error fetching contacts:', error);
    contactsError.value = error.response?.data?.message || error.message || 'Error al cargar contactos.';
  } finally {
    isLoadingContacts.value = false;
  }
}

// --- NUEVA: Función para seleccionar contacto ---
function selectContact(contact) {
  try {
    if (selectedContact.value?.id === contact.id) {
      console.log('Contacto ya seleccionado, no hacer nada.');
      return;
    }
    console.log('Contacto seleccionado:', contact);
    selectedContact.value = contact;
    messages.value = [];
    chatError.value = ''; // Usar la variable de error del chat

    // Lógica futura (comentada)
    console.log(`Seleccionado chat con ${contact.name}. Funcionalidad real pendiente.`);
    // Asegúrate que NO hay ningún alert() aquí

    scrollToBottom(); // Esto también podría fallar si chatWindowRef es null
  } catch (error) {
    // --- Añadir CATCH aquí ---
    // Logueamos el error específico que ocurre DENTRO de selectContact
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!! ERROR CAPTURADO DENTRO DE selectContact !!!', error);
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    // Mostramos un error local en lugar de dejar que salte al global
    chatError.value = `Error al procesar selección: ${error.message}`;
    // NO redirigimos, dejamos que el usuario vea el error aquí
  }
}

// --- Watcher para cargar contactos cuando se conecte ---
watch(
  isConnected,
  (newValue, oldValue) => {
    // Cargar contactos solo cuando pasamos de desconectado a conectado Y tenemos ID/Rol
    if (newValue === true && oldValue === false && userId.value && userRole.value) {
      console.log('Conectado! Cargando contactos...');
      fetchContacts();
    } else if (newValue === false) {
      // Limpiar si nos desconectamos
      contacts.value = [];
      selectedContact.value = null;
    }
  },
  { immediate: true }
);

// --- 3. Funciones de Chat ---

// Se llama al pulsar Enviar o presionar Enter
const sendMessage = () => {
  const textToSend = newMessage.value.trim();
  // Añadir comprobación de que hay un contacto seleccionado
  if (textToSend && isConnected.value && selectedContact.value) {
    console.log(`ChatPage: Enviando mensaje "${textToSend}" al destinatario ID ${selectedContact.value.id}`);
    emitEvent('sendMessage', {
      recipientId: selectedContact.value.id, // <-- ENVIAMOS EL ID DEL DESTINATARIO
      text: textToSend,
    });
    newMessage.value = '';
    scrollToBottom();
  } else if (!selectedContact.value) {
    alert('Por favor, selecciona un contacto para enviarle un mensaje.');
  } else if (!isConnected.value) {
    alert('No estás conectado al chat.');
  }
};

// Callback que se ejecuta cuando se recibe un evento 'newMessage' del servidor
const handleNewMessage = (messageData) => {
  console.log('ChatPage: Nuevo mensaje recibido:', messageData);
  // TODO: Verificar si el mensaje es de/para el chat activo antes de añadirlo
  // if(selectedContact.value && (messageData.senderId === selectedContact.value.id || messageData.senderId === userId.value)) {
  messages.value.push({
    ...messageData,
    isOwnMessage: messageData.senderId === userId.value,
  });
  scrollToBottom();
  // } else { console.log("Mensaje recibido para otro chat, ignorando display."); }
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

// Conectar cuando el componente se monte
onMounted(() => {
  console.log('ChatPage: Montado. Conectando socket...');
  connect(); // Llama a connect() del composable
  registerListener('newMessage', handleNewMessage); // Registra el listener para nuevos mensajes
});

// 3. Desconectar cuando el componente se destruya
onUnmounted(() => {
  console.log('ChatPage: Desmontado.');
  // Limpiar el listener cuando el componente se destruye
  unregisterListener('newMessage', handleNewMessage);
  // Decidimos no desconectar automáticamente por ahora
  // disconnect();
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
