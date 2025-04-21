// backend/routes/subjectRoutes.js

const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");
const isAuthenticated = require("../middleware/authMiddleware");
const { isProfessor } = require("../middleware/roleMiddleware");

// Rutas protegidas
router.get("/", isAuthenticated, subjectController.getAllSubjects);
router.post("/", isAuthenticated, isProfessor, subjectController.createSubject);
router.get("/:id", isAuthenticated, subjectController.getSubjectById);
router.put(
  "/:id",
  isAuthenticated,
  isProfessor,
  subjectController.updateSubject
);
router.delete(
  "/:id",
  isAuthenticated,
  isProfessor,
  subjectController.deleteSubject
);

module.exports = router;
