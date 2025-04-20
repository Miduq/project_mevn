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
    exports.getRelationsForStudent = async (req, res) => {
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
                        as: 'teacher', // Asegúrate que 'teacher' es el alias correcto en tu modelo Students_teachers_relation
                        attributes: ['id', 'name', 'surname'] // Campos necesarios del profesor
                    },
                    {
                        model: Subject,
                        as: 'subject', // Asegúrate que 'subject' es el alias correcto
                        attributes: ['id', 'subject'] // Campos necesarios de la asignatura
                    }
                ],
                // Importante: Devolver el objeto completo, incluyendo el ID de la relación
                // para poder usarlo al borrar. El map no es necesario aquí si el frontend
                // puede manejar la estructura anidada.
            });

            // Devolvemos directamente las relaciones encontradas.
            // El frontend usará relation.id, relation.subject.subject, relation.teacher.name, etc.
            res.json({ success: true, relations: relations });

        } catch (error) {
            console.error('Error en getRelationsForStudent:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor al obtener relaciones.' });
        }
    };

    /**
     * Añadir una nueva relación entre estudiante, profesor y asignatura.
     * Necesario para el botón "Añadir Asignatura" en la página de edición.
     */
    exports.addRelation = async (req, res) => {
        try {
            const { studentId, teacherId, subjectId } = req.body;

            // Validación básica de entrada
            if (!studentId || !teacherId || !subjectId) {
                return res.status(400).json({ success: false, message: 'Faltan IDs de estudiante, profesor o asignatura.' });
            }

            // Opcional: Validar que los IDs existen en sus respectivas tablas (User, Subject)

            // Verificar si la relación exacta ya existe para evitar duplicados
            const existingRelation = await Students_teachers_relation.findOne({
                where: {
                    id_student: studentId,
                    id_teacher: teacherId,
                    id_subject: subjectId
                }
            });

            if (existingRelation) {
                // 409 Conflict indica que el recurso ya existe
                return res.status(409).json({ success: false, message: 'Esta relación asignatura-profesor ya existe para este alumno.' });
            }

            // Crear la nueva relación
            const newRelation = await Students_teachers_relation.create({
                id_student: studentId,
                id_teacher: teacherId,
                id_subject: subjectId
            });

            // 201 Created indica que se creó un recurso con éxito
            res.status(201).json({ success: true, relation: newRelation });

        } catch (error) {
            console.error('Error en addRelation:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor al añadir la relación.' });
        }
    };

    /**
     * Eliminar una relación específica por su ID.
     * Necesario para el botón "Quitar" junto a cada asignatura en la página de edición.
     */
    exports.deleteRelation = async (req, res) => {
        try {
            const { relationId } = req.params;

            // Validar que el ID sea un número
            if (isNaN(relationId)) {
                return res.status(400).json({ success: false, message: 'ID de relación inválido.' });
            }

            // Intentar eliminar la relación por su clave primaria (id)
            const result = await Students_teachers_relation.destroy({
                where: { id: relationId }
            });

            // destroy devuelve el número de filas eliminadas. Si es 0, no se encontró.
            if (result === 0) {
                return res.status(404).json({ success: false, message: 'Relación no encontrada.' });
            }

            // Éxito si se eliminó al menos una fila (debería ser solo 1 por ID)
            res.json({ success: true, message: 'Relación eliminada correctamente.' });

        } catch (error) {
            console.error('Error en deleteRelation:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar la relación.' });
        }
    };