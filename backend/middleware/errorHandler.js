// middleware/errorHandler.js

module.exports = (err, req, res, next) => {
  console.error('Middleware de manejo de errores:', err);

  if (err.name === 'MulterError') {
    // Errores específicos de Multer
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.message === 'Solo se permiten archivos de imagen (jpeg, jpg, png, gif).') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Otros errores
  res.status(500).json({ success: false, message: 'Error interno del servidor.' });
};
