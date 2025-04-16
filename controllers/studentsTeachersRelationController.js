// controllers/studentsTeachersRelationController.js

const { Students_teachers_relation, User, Subject } = require('../models');
const { Sequelize } = require('sequelize');

// Obtener Profesores de un Alumno
exports.getMyProfessors = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Validar que el ID sea un número
        if (isNaN(studentId)) {
            return res.status(400).json({ success: false, message: 'ID de alumno inválido.' });
        }

        const relations = await Students_teachers_relation.findAll({
            where: { id_student: studentId },
            include: [
                {
                    model: User,
                    as: 'teacher',
                    attributes: ['id', 'name', 'surname', 'email']
                },
                {
                    model: Subject,
                    as: 'subject',
                    attributes: ['id', 'subject']
                }
            ]
        });

        const data = relations.map(rel => ({
            name: rel.teacher.name,
            surname: rel.teacher.surname,
            email: rel.teacher.email,
            subject: rel.subject.subject
        }));

        res.json({ success: true, professors: data });
    } catch (error) {
        console.error('Error en getMyProfessors:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// Obtener Alumnos de un Profesor
exports.getMyStudents = async (req, res) => {
    try {
        const { teacherId } = req.params; // Cambiar de 'id' a 'teacherId'

        // Validar que el ID sea un número
        if (isNaN(teacherId)) {
            return res.status(400).json({ success: false, message: 'ID de profesor inválido.' });
        }

        // Verificar que el usuario autenticado es el profesor solicitado
        if (req.user.id !== parseInt(teacherId)) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver estos datos.' });
        }

        const relations = await Students_teachers_relation.findAll({
            where: { id_teacher: teacherId },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'name', 'surname', 'email']
                },
                {
                    model: Subject,
                    as: 'subject',
                    attributes: ['id', 'subject']
                }
            ]
        });

        const data = relations.map(rel => ({
            name: rel.student.name,
            surname: rel.student.surname,
            email: rel.student.email,
            subject: rel.subject.subject,
            relationId: rel.id
        }));

        res.json({ success: true, students: data });
    } catch (error) {
        console.error('Error en getMyStudents:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
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
                [Sequelize.fn('COUNT', Sequelize.col('id_student')), 'totalStudents']
            ],
            include: [
                {
                    model: Subject,
                    as: 'subject',
                    attributes: []
                }
            ],
            group: ['subject.id', 'subject.subject'],
            raw: true
        });

        const data = results.map(row => ({
            subject: row.subject,
            totalStudents: parseInt(row.totalStudents, 10)
        }));

        res.json({ success: true, subjects: data });
    } catch (error) {
        console.error('Error en getSubjectsTeacher:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
