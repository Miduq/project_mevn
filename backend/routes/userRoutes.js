// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const isAuthenticated = require('../middleware/authMiddleware');
const { isProfessor } = require('../middleware/roleMiddleware');
const uploadS3 = require('../config/s3Config');

// Ruta para obtener todos los usuarios
router.get('/', isAuthenticated, isProfessor, userController.getAllUsers);

// Ruta para obtener solo los profesores
router.get('/teachers', isAuthenticated, userController.getTeachers);

// Ruta para obtener solo los estudiantes
router.get('/students', isAuthenticated, isProfessor, userController.getStudents);

// Ruta para buscar usuarios
router.get('/search', isAuthenticated, isProfessor, userController.searchUsers);

// Ruta para eliminar un usuario
router.delete('/students/:studentId', isAuthenticated, isProfessor, userController.deleteStudentByProfessor);

// Obtener lista de asignaturas (id, nombre) para un profesor específico
router.get('/:teacherId/subjects', isAuthenticated, userController.getProfessorSubjectList);

// Ruta para asignar una asignatura a un profesor
router.post('/:teacherId/subjects', isAuthenticated, isProfessor, userController.assignSubjectToTeacher);

// Ruta para eliminar una asignatura de un profesor
router.delete('/:teacherId/subjects/:subjectId', isAuthenticated, isProfessor, userController.removeSubjectFromTeacher);

// Ruta para actualizar datos a un alumno SIENDO profesor
router.put('/students/:studentId', isAuthenticated, isProfessor, userController.updateStudentByProfessor);

// Ruta para obtener un usuario por ID
router.get('/:id', isAuthenticated, userController.getUserById);

// Ruta para actualizar un usuario
router.put('/:id', isAuthenticated, userController.updateUser);

// Ruta para actualizar la IMAGEN DE PERFIL de un usuario
router.put('/:id/profile-picture', isAuthenticated, uploadS3.single('image'), userController.uploadProfilePicture);

module.exports = router;
