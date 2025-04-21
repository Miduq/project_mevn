// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const isAuthenticated = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const { isProfessor } = require("../middleware/roleMiddleware");

// Ruta para obtener todos los usuarios (protegida)
router.get("/", isAuthenticated, isProfessor, userController.getAllUsers);

// Ruta para obtener solo los profesores (protegida)
router.get("/teachers", isAuthenticated, userController.getTeachers);

// Ruta para obtener solo los estudiantes (protegida para Profesores)
router.get(
  "/students",
  isAuthenticated,
  isProfessor,
  userController.getStudents
);

// Ruta para buscar usuarios (protegida)
router.get("/search", isAuthenticated, isProfessor, userController.searchUsers);

// Obtener lista de asignaturas (id, nombre) para un profesor específico
router.get(
  "/:teacherId/subjects",
  isAuthenticated,
  userController.getProfessorSubjectList
);

// Ruta para obtener un usuario por ID (protegida)
router.get("/:id", isAuthenticated, userController.getUserById);

// Ruta para actualizar un usuario (protegida)
router.put("/:id", isAuthenticated, userController.updateUser);

// Ruta para actualizar la IMAGEN DE PERFIL de un usuario (protegida)
router.put(
  "/:id/profile-picture", // 2. Define el path correcto (usa :id como en tus otras rutas)
  isAuthenticated, // 3. Aplica autenticación (igual que las otras)
  uploadMiddleware.single("image"), // 4. ¡Usa el middleware Multer! 'image' es el campo del form-data
  userController.uploadProfilePicture // 5. Llama a la función específica del controlador
);

module.exports = router;
