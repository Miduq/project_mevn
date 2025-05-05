// backend/routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const isAuthenticated = require('../middleware/authMiddleware');

// Rutas para el historial de chat
router.get(
  '/history/:otherUserId',
  isAuthenticated, // Solo usuarios logueados pueden ver historial
  chatController.getChatHistory
);

// Ruta para la lista de conversaciones
router.get(
  '/conversations',
  isAuthenticated, // Solo usuarios logueados pueden ver sus conversaciones
  chatController.listConversations
);

// Ruta para descargar el historial de chat
router.get('/download/:otherUserId', isAuthenticated, chatController.downloadChatCsv);

module.exports = router;
