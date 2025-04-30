// frontend/src/composables/useSocket.js

import { ref, readonly, computed } from 'vue'; // Importamos readonly para estado
import { io } from 'socket.io-client';
import AuthService from '@/services/auth/AuthService';

// URL del backend WebSocket (desde .env)
const SOCKET_URL = process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000';

// Estado Global
let socket = null;
const isConnected = ref(false);
const connectionError = ref(null); // Guardará el último error de conexión/auth
const currentUserId = ref(null);
const currentUsername = ref(null);
const unreadSenders = ref(new Set()); // Conjunto para IDs de remitentes no leídos
let currentActiveChatPartnerId = null;

export function useSocket() {
  // Computed para saber si hay mensajes no leídos
  const setActiveChatPartner = (partnerId) => {
    // partnerId será un número o null
    currentActiveChatPartnerId = partnerId;
    console.log(`useSocket: Active chat partner ID set to -> ${currentActiveChatPartnerId}`);
    // Aprovechamos para marcar como leído si se activa un chat
    if (partnerId) {
      markSenderAsRead(partnerId);
    }
  };
  // Función para conectar (opera sobre el estado global)
  const connect = () => {
    if (socket?.connected || socket?.connecting) {
      console.log('useSocket: Conexión ya activa o en progreso.');
      isConnected.value = socket.connected; // Asegurar estado local
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      connectionError.value = 'No autenticado.';
      isConnected.value = false;
      socket = null;
      return;
    }
    console.log('useSocket: Intentando conectar a', SOCKET_URL);
    connectionError.value = null;

    // Crea la instancia si no existe
    if (!socket) {
      socket = io(SOCKET_URL, { auth: { token }, autoConnect: false });

      // Registrar Listeners Globales
      socket.off(); // Limpiar listeners anteriores

      socket.on('connect', () => {
        console.log(`>>> useSocket: EVENTO 'connect'. Socket ID: ${socket?.id}`);
        isConnected.value = true;
        connectionError.value = null;
      });
      socket.on('disconnect', (reason) => {
        console.log(`>>> useSocket: EVENTO 'disconnect'. Razón: ${reason}`);
        isConnected.value = false;
        currentUserId.value = null;
        currentUsername.value = null;
        unreadSenders.value.clear(); // Limpiar no leídos al desconectar totalmente
      });
      socket.on('connect_error', (err) => {
        console.error(`>>> useSocket: EVENTO 'connect_error': ${err.message}`);
        isConnected.value = false;
        connectionError.value = `Error conexión: ${err.message}`;
        currentUserId.value = null;
        currentUsername.value = null;
        unreadSenders.value.clear();
        if (err.message.includes('Token inválido') || err.message.includes('no proporcionado')) {
          console.warn('Error de autenticación en socket, forzando logout...');
          AuthService.logout();
        }
      });
      socket.on('authenticated', (userData) => {
        console.log('>>> useSocket: EVENTO "authenticated" recibido:', userData);
        currentUserId.value = userData?.id;
        currentUsername.value = userData?.username;
      });
      // Listener para NOTIFICACIONES (actualiza Set global)
      socket.on('newMessageNotification', (notificationData) => {
        console.log('>>> useSocket: EVENTO "newMessageNotification" recibido:', notificationData);
        const senderId = notificationData?.senderId;
        if (senderId && senderId !== currentActiveChatPartnerId) {
          // <-- Comprueba variable global
          if (!unreadSenders.value.has(senderId)) {
            unreadSenders.value.add(senderId);
            unreadSenders.value = new Set(unreadSenders.value);
          }
        } else {
          console.log(`useSocket: Notificación de ${senderId} ignorada (chat activo o sin senderId)`);
        }
      });
    }

    // Conectar si no lo está ya
    if (!socket.connected) {
      socket.connect();
    }
  };

  // Función para desconectar
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
    }
    isConnected.value = false;
    connectionError.value = null;
    currentUserId.value = null;
    currentUsername.value = null;
    unreadSenders.value.clear();
  };

  // Emitir evento (usa instancia global)
  const emitEvent = (eventName, payload) => {
    if (socket && isConnected.value) {
      socket.emit(eventName, payload);
    } else {
      console.error(`useSocket: Socket no conectado para emitir ${eventName}`);
    }
  };

  // Registrar/Desregistrar listeners específicos del componente
  const registerListener = (eventName, callback) => {
    if (socket) {
      socket.on(eventName, callback);
    }
  };
  const unregisterListener = (eventName, callback) => {
    if (socket) {
      socket.off(eventName, callback);
    }
  };

  // Función para limpiar indicador de no leído
  const markSenderAsRead = (senderId) => {
    if (senderId && unreadSenders.value.has(senderId)) {
      const deleted = unreadSenders.value.delete(senderId);
      if (deleted) {
        unreadSenders.value = new Set(unreadSenders.value);
      }
      console.log(`useSocket: Limpiado unread para ${senderId}`, unreadSenders.value);
    }
  };

  // Exponer estado global (readonly) y métodos
  return {
    isConnected: readonly(isConnected),
    connectionError: readonly(connectionError),
    userId: readonly(currentUserId),
    username: readonly(currentUsername),
    unreadSenders: readonly(unreadSenders), // <-- Estado global compartido

    connect,
    disconnect,
    emitEvent,
    registerListener,
    unregisterListener,
    markSenderAsRead,
    setActiveChatPartner,
  };
}
