// routes/subjectRoutes.js

const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const isAuthenticated = require('../middleware/authMiddleware');

// Rutas protegidas
router.get('/', isAuthenticated, subjectController.getAllSubjects);
router.post('/', isAuthenticated, subjectController.createSubject);

module.exports = router;
