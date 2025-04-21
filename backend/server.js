// backend/server.js

require("dotenv").config(); // Cargar variables de entorno
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./models"); // Importar modelos de Sequelize
const multer = require("multer"); // Importar Multer para manejar errores de Multer

// Importar rutas
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const studentsTeachersRelationRoutes = require("./routes/studentsTeachersRelationRoutes");
const subjectRoutes = require("./routes/subjectRoutes");

const app = express();

// Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:8080", // Direccion del front-end
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Middleware para parsear JSON
app.use(express.json());

// Servir carpeta de imágenes (uploads) de forma estática
app.use(
  "/uploads/profile_images",
  express.static(path.join(__dirname, "uploads/profile_images"))
);

// Usar rutas
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/roles", roleRoutes);
app.use("/relations", studentsTeachersRelationRoutes);
app.use("/subjects", subjectRoutes);

// Manejar rutas no definidas (404)
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada." });
});

// Middleware de manejo de errores (opcional pero recomendado)
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// Sincronizar la base de datos y arrancar el servidor
const PORT = process.env.PORT || 3000;

db.sequelize
  .sync() //  para sincronizar cambios en modelos
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error al sincronizar la base de datos:", err);
  });
