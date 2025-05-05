// frontend/src/services/chatService.js
import apiClient from '../apiClient';

// Obtiene la lista de conversaciones para el usuario logueado.
const listConversations = async () => {
  try {
    const url = '/api/chats/conversations';
    console.log(`ChatService: GET ${url}`);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error en servicio listConversations:', error.response?.data || error.message);
    throw error;
  }
};

// Obtiene el historial de chat entre el usuario logueado y otro usuario.
const getChatHistory = async (otherUserId) => {
  if (!otherUserId) return { success: false, message: 'ID inválido.', history: [] };
  try {
    const url = `/api/chats/history/${otherUserId}`;
    console.log(`ChatService: GET ${url}`);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error en servicio getChatHistory con ${otherUserId}:`, error.response?.data || error.message);
    throw error;
  }
};

export default {
  listConversations,
  getChatHistory,
  // downloadChatHistory
};
