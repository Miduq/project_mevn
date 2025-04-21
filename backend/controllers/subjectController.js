// controllers/subjectController.js

const { Subject } = require('../models');
const { UniqueConstraintError } = require('sequelize');

// Obtener todas las asignaturas
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      order: [['subject', 'ASC']],
    });
    res.json({ success: true, subjects });
  } catch (error) {
    console.error('Error en getAllSubjects:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las asignaturas.' });
  }
};

// Crear una nueva asignatura
exports.createSubject = async (req, res) => {
  const { subject } = req.body;
  if (!subject || typeof subject !== "string" || subject.trim() === "") {
    return res.status(400).json({ success: false, message: 'El nombre de la asignatura es obligatorio y no puede estar vacío.' });
  }

  try {
    const newSubject = await Subject.create({ subject: subject.trim() });
    res.status(201).json({ success: true, subject: newSubject });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ success: false, message: 'Ya existe una asignatura con ese nombre.' }); // 409 Conflict
    }
    // Otros errores
    console.error('Error en createSubject:', error);
    res.status(500).json({ success: false, message: 'Error al crear la asignatura.' });
  }
};
