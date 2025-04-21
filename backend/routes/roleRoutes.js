// routes/roleRoutes.js

const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const isAuthenticated = require("../middleware/authMiddleware");

// Ruta para obtener todos los roles (protegida)
router.get("/", isAuthenticated, roleController.getAllRoles);

// Ruta para crear un nuevo rol (protegida y opcional)
router.post("/", isAuthenticated, roleController.createRole);

module.exports = router;
