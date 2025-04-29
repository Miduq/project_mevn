// frontend/src/composables/useSocket.js

import { ref, readonly, onUnmounted } from 'vue'; // Importamos readonly para estado
import { io } from 'socket.io-client';

// URL del backend WebSocket (idealmente desde .env)
// Asegúrate que coincide con el puerto donde corre tu httpServer en server.js
const SOCKET_URL = process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000';

// Usaremos un patrón simple para intentar tener una única instancia de socket
// y estado compartido si se llama al composable desde múltiples sitios.
let socket = null;
const isConnected = ref(false);
const connectionError = ref(null); // Guardará el último error de conexión/auth
const userId = ref(null); // Guardaremos el ID del usuario autenticado aquí
const username = ref(null); // Guardaremos el username autenticado aquí

export function useSocket() {
  const connect = () => {
    // Evitar reconexión si ya está conectado o conectando
    if (socket?.connected) {
      console.log('useSocket: Conexión ya establecida.');
      isConnected.value = true; // Sincronizar estado local
      return;
    }
    if (socket?.connecting) {
      console.log('useSocket: Conexión ya en progreso.');
      return;
    }

    // 1. Obtener token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('useSocket: No hay token JWT para conectar.');
      connectionError.value = 'No autenticado.';
      isConnected.value = false;
      socket = null; // Asegurar que no hay instancia vieja
      return;
    }

    console.log('useSocket: Intentando conectar a', SOCKET_URL);
    connectionError.value = null;

    // 2. Crear o reutilizar instancia con autenticación
    // Pasamos el token en 'auth' para que lo reciba el middleware io.use() del backend
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false, // Conectaremos manualmente
      // forceNew: true, // Podría ser útil si hay problemas de reconexión
    });

    // 3. Listeners básicos (ANTES de conectar)
    socket.off(); // Limpiar listeners previos por si acaso

    socket.on('connect', () => {
      console.log(`useSocket: Conectado! Socket ID: ${socket.id}`);
      isConnected.value = true;
      connectionError.value = null;
      // Podríamos obtener el ID/username del usuario del payload del token aquí si no lo hace el backend
      // o esperar a que el backend nos confirme quiénes somos
    });

    socket.on('disconnect', (reason) => {
      console.log(`useSocket: Desconectado. Razón: ${reason}`);
      isConnected.value = false;
      userId.value = null; // Limpiar datos de usuario al desconectar
      username.value = null;
      if (reason === 'io server disconnect') {
        // Desconexión forzada por el server (ej: auth falló)
        connectionError.value = 'Desconexión forzada por el servidor.';
      } else if (reason === 'transport close') {
        // Puede ser normal, ej. al cerrar pestaña
      } else {
        connectionError.value = `Desconectado: ${reason}`;
      }
    });

    socket.on('connect_error', (err) => {
      // Error durante el intento de conexión (incluye errores del middleware io.use)
      console.error(`useSocket: Error de Conexión: ${err.message}`);
      isConnected.value = false;
      userId.value = null;
      username.value = null;
      connectionError.value = `Error de conexión: ${err.message}`; // Muestra error de auth del backend
      // Considerar si limpiar la instancia de socket aquí
      // socket?.disconnect();
      // socket = null;
    });

    // --- Listener de ejemplo para confirmar autenticación (el backend debería enviarlo) ---
    // El backend, después de io.use() exitoso, podría emitir esto en io.on('connection')
    socket.on('authenticated', (userData) => {
      console.log('useSocket: Autenticación confirmada por el servidor:', userData);
      userId.value = userData.id;
      username.value = userData.username;
      // Podríamos guardar más datos si el backend los envía
    });
    // ---------------------------------------------------------------------------------

    // --- Listeners para mensajes de chat irán aquí ---
    // socket.on('newMessage', (messageData) => { ... });
    // ----------------------------------------------

    // 4. Conectar
    socket.connect();
  };

  const disconnect = () => {
    if (socket) {
      console.log('useSocket: Desconectando socket...');
      socket.disconnect();
      socket = null; // Liberar instancia
    }
    isConnected.value = false;
    connectionError.value = null;
    userId.value = null;
    username.value = null;
  };

  // Función para emitir eventos (ej: enviar mensaje)
  const emitEvent = (eventName, payload) => {
    if (socket && isConnected.value) {
      console.log(`useSocket: Emitiendo evento '${eventName}' con payload:`, payload);
      socket.emit(eventName, payload);
    } else {
      console.error(`useSocket: No se puede emitir '${eventName}'. Socket no conectado.`);
      connectionError.value = 'No conectado al servidor de chat.';
    }
  };

  // Función para registrar listeners de eventos específicos
  // Es mejor que el componente registre los listeners que necesita
  const registerListener = (eventName, callback) => {
    if (socket) {
      console.log(`useSocket: Registrando listener para '${eventName}'`);
      socket.on(eventName, callback);
    } else {
      console.warn(`useSocket: Socket no inicializado, no se puede registrar listener para '${eventName}' aún.`);
    }
  };

  const unregisterListener = (eventName, callback) => {
    if (socket) {
      console.log(`useSocket: Eliminando listener para '${eventName}'`);
      socket.off(eventName, callback); // Importante pasar el mismo callback si se especificó
    }
  };

  // Desconectar al desmontar el componente que lo usa (si es el último)
  // Esto requiere una gestión más compleja si quieres una conexión persistente global
  // onUnmounted(disconnect); // Comentado por ahora

  // Devolvemos estado readonly (para evitar mutaciones accidentales) y funciones
  return {
    isConnected: readonly(isConnected),
    connectionError: readonly(connectionError),
    userId: readonly(userId),
    username: readonly(username),
    connect,
    disconnect,
    emitEvent, // Para enviar mensajes/eventos
    registerListener, // Para escuchar eventos
    unregisterListener,
  };
}
