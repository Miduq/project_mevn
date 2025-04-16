// routes/studentsTeachersRelationRoutes.js

const express = require('express');
const router = express.Router();
const studentsTeachersRelationController = require('../controllers/studentsTeachersRelationController');
const isAuthenticated = require('../middleware/authMiddleware');

// Ruta para obtener profesores de un alumno (protegida)
router.get('/my-professors/:studentId', isAuthenticated, studentsTeachersRelationController.getMyProfessors);

// Ruta para obtener alumnos de un profesor (protegida)
router.get('/my-students/:teacherId', isAuthenticated, studentsTeachersRelationController.getMyStudents);

// Ruta para obtener asignaturas que imparte un profesor + número de alumnos (protegida)
router.get('/subjects-teacher/:teacherId', isAuthenticated, studentsTeachersRelationController.getSubjectsTeacher);

module.exports = router;
