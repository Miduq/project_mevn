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

module.exports = router;
