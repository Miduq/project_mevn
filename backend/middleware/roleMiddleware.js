// backend/middleware/roleMiddleware.js

// Asume que el middleware 'isAuthenticated' ya se ejecutó y añadió 'req.user'
const isProfessor = (req, res, next) => {
  if (req.user && req.user.role === 2) {
    next();
  } else {
    res
      .status(403)
      .json({
        success: false,
        message: "Acceso denegado. Se requiere rol de Profesor.",
      });
  }
};

module.exports = {
  isProfessor,
};
