// routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const uploadController = require("../controllers/uploadController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware"); // Importar el middleware de Multer

// Rutas de autenticación...
router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/validate-email", authController.validateEmail);
router.post("/reset-password", authController.resetPassword);
router.post("/recover-password", authController.recoverPassword);

// Ruta protegida para obtener datos del usuario actual
router.get("/me", authMiddleware, authController.getCurrentUser);

// Ruta protegida para subir imagen de perfil con Multer como middleware
router.post(
  "/upload-profile/:id",
  upload.single("image"),
  authMiddleware,
  uploadController.uploadProfilePic
);

module.exports = router;
