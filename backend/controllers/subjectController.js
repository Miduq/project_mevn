// backend/controllers/controllers/subjectController.js

const { Subject, Students_teachers_relation } = require("../models");
const { UniqueConstraintError } = require("sequelize");
const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");

// Obtener todas las asignaturas
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      order: [["id", "ASC"]],
    });
    res.json({ success: true, subjects });
  } catch (error) {
    console.error("Error en getAllSubjects:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener las asignaturas." });
  }
};

// Crear una nueva asignatura
exports.createSubject = async (req, res) => {
  const { subject } = req.body;
  if (!subject || typeof subject !== "string" || subject.trim() === "") {
    return res
      .status(400)
      .json({
        success: false,
        message:
          "El nombre de la asignatura es obligatorio y no puede estar vacío.",
      });
  }

  try {
    const newSubject = await Subject.create({ subject: subject.trim() });
    res.status(201).json({ success: true, subject: newSubject });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Ya existe una asignatura con ese nombre.",
        }); // 409 Conflict
    }
    // Otros errores
    console.error("Error en createSubject:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al crear la asignatura." });
  }
};

// Obtener una asignatura por ID
exports.getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID de asignatura inválida." });
    }

    // Buscar la asignatura por ID
    const subject = await Subject.findByPk(id);

    // Si no se encuentra la asignatura
    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Asignatura no encontrada." });
    }

    res.json({ success: true, subject });
  } catch (error) {
    console.error("Error en getSubjectById:", error);
    res
      .status(500)
      .json({ success: false, message: "Error internos del servidor." });
  }
};

exports.updateSubject = async (req, res) => {
  if (!req.user || req.user.role !== 2) {
    return res
      .status(403)
      .json({
        success: false,
        message: "Acceso denegado. Solo los profesores pueden actualizar.",
      });
  }
  try {
    const { id } = req.params;
    const { subject } = req.body;

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Id de asignatura inválida." });
    }
    if (!subject || typeof subject !== "string" || subject.trim() === "") {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "El nombre de la asignatura es obligatorio y no puede estar vacío.",
        });
    }

    const subjectNameTrimmed = subject.trim();
    const [numberOfAffectedRows] = await Subject.update(
      { subject: subjectNameTrimmed }, // Nuevos datos a actualizar con el trim
      { where: { id: parseInt(id) } } // Asegúrate de que el id sea un número
    );

    // Verificar si se ha actualizado algo
    if (numberOfAffectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Asignatura no encontrada." });
    }
    res.json({
      success: true,
      message: "Asignatura actualizada correctamente.",
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Ya existe una asignatura con ese nombre.",
        });
    }
    console.error("Error en updateSubject:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor." });
  }
};

exports.deleteSubject = async (req, res) => {
  if (!req.user || req.user.role !== 2) {
    return res
      .status(403)
      .json({
        success: false,
        message: "Acceso denegado. Solo los profesores pueden eliminar.",
      });
  }
  try {
    const { id } = req.params;
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Id de asignatura inválida." });
    }

    const subjectId = parseInt(id);

    // Verifica si la asignatura a borrar esta siendo usada en la tabla de relaciones
    const existingRelation = await Students_teachers_relation.findOne({
      where: { id_subject: subjectId },
    });

    // Si encuentra relación no permite el borrado
    if (existingRelation) {
      return res.status(409).json({
        success: false,
        message:
          "No se puede eliminar la asignatura porque está siendo utilizada por un estudiante o profesor.",
      });
    }

    const numberOfAffectedRows = await Subject.destroy({
      where: { id: subjectId },
    });

    // Verifica si se borró algo
    if (numberOfAffectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Asignatura no encontrada." });
    }
    res
      .status(200)
      .json({ success: true, message: "Asignatura eliminada correctamente." });
  } catch (error) {
    console.error("Error en deleteSubject:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor." });
  }
};
