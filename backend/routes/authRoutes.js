// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas de autenticación...
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/validate-email', authController.validateEmail);
router.post('/reset-password', authController.resetPassword);
router.post('/recover-password', authController.recoverPassword);

// Ruta protegida para obtener datos del usuario actual
router.get('/me', authMiddleware, authController.getCurrentUser);

// Ruta para verificar el token de Google
router.post('/google/verify', authController.verifyGoogleToken);

module.exports = router;
