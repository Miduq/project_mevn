// controllers/subjectController.js

const { Subject } = require('../models');

// Obtener todas las asignaturas
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll();
    res.json({ success: true, subjects });
  } catch (error) {
    console.error('Error en getAllSubjects:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las asignaturas.' });
  }
};

// Crear una nueva asignatura
exports.createSubject = async (req, res) => {
  const { subject } = req.body;
  try {
    const newSubject = await Subject.create({ subject });
    res.json({ success: true, subject: newSubject });
  } catch (error) {
    console.error('Error en createSubject:', error);
    res.status(500).json({ success: false, message: 'Error al crear la asignatura.' });
  }
};
