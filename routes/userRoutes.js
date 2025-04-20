// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const isAuthenticated = require('../middleware/authMiddleware');

// Ruta para obtener todos los usuarios (protegida)
router.get('/', isAuthenticated, userController.getAllUsers);
// Ruta para obtener solo los profesores (protegida)
router.get('/teachers', isAuthenticated, userController.getTeachers);

// Ruta para buscar usuarios (protegida)
router.get('/search', isAuthenticated, userController.searchUsers);

// Ruta para obtener un usuario por ID (protegida)
router.get('/:id', isAuthenticated, userController.getUserById);

// Ruta para actualizar un usuario (protegida)
router.put('/:id', isAuthenticated, userController.updateUser);

module.exports = router;
