// backend/controllers/chatController.js

const ChatHistory = require('../models/mongo/chatHistory');

exports.getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id; // ID del usuario autenticado
    const otherUserId = parseInt(req.params.otherUserId, 10); // ID del otro usuario

    // Validaciones básicas
    if (isNaN(otherUserId)) {
      return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
    }
    // Evitar solicitar historial a sí mismo
    if (userId === otherUserId) {
      return res.json({ success: true, history: [] }); // Devolver historial vacío
    }

    // Obtener el historial de chat entre los dos usuarios
    const chatHistory = await ChatHistory.find({
      $or: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    })
      .sort({ timestamp: 1 }) // Ordenar por fecha ascendente
      .limit(50); // Limitar a los últimos 50 mensajes
    res.json({ success: true, history: chatHistory });
  } catch (error) {
    console.error(`Error obteniendo historial entre ${req.user?.id} y ${req.params.otherUserId}:`, error);
    next(error); // Pasar el error al manejador de errores
  }
};
