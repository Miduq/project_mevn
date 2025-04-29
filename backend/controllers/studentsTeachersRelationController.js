// controllers/studentsTeachersRelationController.js

const { Students_teachers_relation, User, Subject } = require('../models');
const { Sequelize, Op } = require('sequelize');

// Obtener Profesores de un Alumno
exports.getMyProfessors = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Validar que el ID sea un número
    if (isNaN(studentId)) {
      return res.status(400).json({ success: false, message: 'ID de alumno inválido.' });
    }

    const relations = await Students_teachers_relation.findAll({
      where: { id_student: parseInt(studentId, 10) },
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'surname', 'email'],
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'subject'],
        },
      ],
    });

    res.json({ success: true, professors: relations });
  } catch (error) {
    console.error('Error en getMyProfessors:', error);
    next(error); // Delega al error handler
  }
};

// Obtener Alumnos de un Profesor
exports.getMyStudents = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    // Paginación de la busqueda en HomePage
    const page = parseInt(req.query.page || '1', 10); // Página actual, default 1
    const limit = parseInt(req.query.limit || '5', 10); // Tamaño página, default 5
    const offset = (page - 1) * limit;
    const { name, email } = req.query;

    // Validar que el ID sea un número
    if (isNaN(teacherId) || isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({ success: false, message: 'Parámetros de profesor o paginación inválidos.' });
    }

    // Verificar permiso
    if (!req.user || req.user.id !== parseInt(teacherId)) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para ver estos datos.' });
    }

    let studentWhereClause = {};
    if (name && name.trim() !== '') {
      // Buscar nombre O apellido que contenga el string (case-insensitive con iLike en PG)
      studentWhereClause[Op.or] = [
        { name: { [Op.iLike]: `%${name}%` } }, // iLike para case-insensitive (PostgreSQL)
        { surname: { [Op.iLike]: `%${name}%` } }, // Si MySQL, usa Op.like
      ];
    }
    if (email && email.trim() !== '') {
      studentWhereClause.email = { [Op.iLike]: `%${email}%` }; // Buscar email (case-insensitive)
    }

    // Usa findAndCountAll para obtener datos y total
    const result = await Students_teachers_relation.findAndCountAll({
      where: { id_teacher: parseInt(teacherId) },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'surname', 'email', 'active', 'rol', 'username'],
          where: studentWhereClause,
          required: true,
        },
        { model: Subject, as: 'subject', attributes: ['id', 'subject'] },
      ],
      limit: limit,
      offset: offset,
      order: [
        // Ordenar primero por apellido del alumno, luego nombre
        [{ model: User, as: 'student' }, 'surname', 'ASC'],
        [{ model: User, as: 'student' }, 'name', 'ASC'],
      ],
      distinct: true,
    });

    // Mapeo de resultados
    const data = result.rows.map((rel) => {
      const student = rel.student || {};
      const subject = rel.subject || {};
      return {
        studentId: student.id,
        name: student.name,
        surname: student.surname,
        email: student.email,
        active: student.active,
        rol: student.rol,
        rolName: 'Alumno',
        subjectId: subject.id,
        subject: subject.subject,
        relationId: rel.id,
      };
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(result.count / limit);

    // Devolver respuesta paginada
    res.json({
      success: true,
      students: data, // Los datos de la página actual
      pagination: {
        totalItems: result.count, // Total de alumnos para este profesor
        totalPages: totalPages, // Total de páginas
        currentPage: page, // Página actual
        pageSize: limit, // Tamaño de página
      },
    });
  } catch (error) {
    console.error('Error en getMyStudents (paginado):', error);
    next(error);
  }
};

// Obtener Asignaturas que imparte un profesor + número de alumnos
exports.getSubjectsTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validar que el ID sea un número
    if (isNaN(teacherId)) {
      return res.status(400).json({ success: false, message: 'ID de profesor inválido.' });
    }

    // Usar Sequelize para contar
    const results = await Students_teachers_relation.findAll({
      where: { id_teacher: teacherId },
      attributes: [
        [Sequelize.col('subject.subject'), 'subject'],
        [Sequelize.fn('COUNT', Sequelize.col('id_student')), 'totalStudents'],
      ],
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: [],
        },
      ],
      group: ['subject.id', 'subject.subject'],
      raw: true,
    });

    const data = results.map((row) => ({
      subject: row.subject,
      totalStudents: parseInt(row.totalStudents, 10),
    }));

    res.json({ success: true, subjects: data });
  } catch (error) {
    console.error('Error en getSubjectsTeacher:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};
exports.getRelationsForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validar que el ID sea un número
    if (isNaN(studentId)) {
      return res.status(400).json({ success: false, message: 'ID de alumno inválido.' });
    }
    const studentIdParsed = parseInt(studentId);

    const relations = await Students_teachers_relation.findAll({
      where: { id_student: studentIdParsed },
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'surname'], // Campos necesarios del profesor
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'subject'], // Campos necesarios de la asignatura
        },
      ],
    });
    // El frontend usará relation.id, relation.subject.subject, relation.teacher.name, etc.
    res.json({ success: true, relations: relations });
  } catch (error) {
    console.error('Error en getRelationsForStudent:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener relaciones.',
    });
  }
};

exports.addRelation = async (req, res) => {
  try {
    const { studentId, teacherId, subjectId } = req.body;

    // Validación básica de entrada
    if (!studentId || !teacherId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Faltan IDs de estudiante, profesor o asignatura.',
      });
    }

    // Verificar si la relación exacta ya existe para evitar duplicados
    const existingRelation = await Students_teachers_relation.findOne({
      where: {
        id_student: studentId,
        id_teacher: teacherId,
        id_subject: subjectId,
      },
    });

    if (existingRelation) {
      // 409 Conflict indica que el recurso ya existe
      return res.status(409).json({
        success: false,
        message: 'Esta relación asignatura-profesor ya existe para este alumno.',
      });
    }

    // Crear la nueva relación
    const newRelation = await Students_teachers_relation.create({
      id_student: studentId,
      id_teacher: teacherId,
      id_subject: subjectId,
    });

    // 201 Created indica que se creó un recurso con éxito
    res.status(201).json({ success: true, relation: newRelation });
  } catch (error) {
    console.error('Error en addRelation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al añadir la relación.',
    });
  }
};

exports.deleteRelation = async (req, res) => {
  try {
    const { relationId } = req.params;

    // Validar que el ID sea un número
    if (isNaN(relationId)) {
      return res.status(400).json({ success: false, message: 'ID de relación inválido.' });
    }

    // Intentar eliminar la relación por su clave primaria (id)
    const result = await Students_teachers_relation.destroy({
      where: { id: relationId },
    });

    // destroy devuelve el número de filas eliminadas. Si es 0, no se encontró.
    if (result === 0) {
      return res.status(404).json({ success: false, message: 'Relación no encontrada.' });
    }

    // Éxito si se eliminó al menos una fila (debería ser solo 1 por ID)
    res.json({ success: true, message: 'Relación eliminada correctamente.' });
  } catch (error) {
    console.error('Error en deleteRelation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar la relación.',
    });
  }
};
