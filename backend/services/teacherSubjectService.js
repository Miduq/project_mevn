// backend/services/teacherSubjectService.js
const { User, Subject, TeacherSubject, Role } = require('../models'); // Importa modelos necesarios

const assignSubject = async (teacherId, subjectId) => {
  const professorRoleId = 2;

  // 1. Validar Profesor: Existe y tiene rol 2
  const professor = await User.findOne({
    where: { id: teacherId, rol: professorRoleId },
  });
  if (!professor) {
    // Lanza un error específico que el controlador puede identificar
    const error = new Error('Profesor no encontrado o el ID no corresponde a un profesor.');
    error.statusCode = 404; // Añadimos código de estado sugerido
    throw error;
  }

  // 2. Validar Asignatura: Existe
  const subject = await Subject.findByPk(subjectId);
  if (!subject) {
    const error = new Error('Asignatura no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  // 3. Crear la relación (la PK compuesta en BD/modelo maneja duplicados)
  try {
    const newAssignment = await TeacherSubject.create({
      id_teacher: teacherId,
      id_subject: subjectId,
    });
    return newAssignment; // Devuelve el objeto creado
  } catch (dbError) {
    // Si es error de duplicado, personalizamos
    if (
      dbError.name === 'SequelizeUniqueConstraintError' ||
      (dbError.original && dbError.original.code === 'ER_DUP_ENTRY')
    ) {
      const error = new Error('Este profesor ya tiene asignada esta asignatura.');
      error.statusCode = 409; // Conflict
      throw error;
    }
    // Otros errores de BD
    console.error('Error DB en teacherSubjectService.assignSubject:', dbError);
    const error = new Error('Error de base de datos al intentar asignar la asignatura.');
    error.statusCode = 500; // Error interno del servidor
    throw error;
  }
};

const removeSubject = async (teacherId, subjectId) => {
  console.log(`SERVICE: Intentando eliminar relación T:<span class="math-inline">\{teacherId\}, S\:</span>{subjectId}`);
  try {
    // Intentar eliminar la entrada directamente usando la clave compuesta implícita
    const numberOfAffectedRows = await TeacherSubject.destroy({
      where: {
        id_teacher: teacherId, // Clave snake_case como en el modelo/DB
        id_subject: subjectId, // Clave snake_case como en el modelo/DB
      },
    });

    // Verificar si se eliminó algo
    if (numberOfAffectedRows === 0) {
      // Si no se eliminó nada, la relación no existía
      const error = new Error('La asignación entre este profesor y esta asignatura no fue encontrada.');
      error.statusCode = 404; // Not Found
      throw error;
    }

    console.log(`SERVICE: Relación T:<span class="math-inline">\{teacherId\}, S\:</span>{subjectId} eliminada.`);
    return numberOfAffectedRows; // Devuelve 1 si tuvo éxito
  } catch (dbError) {
    // Si ya es un error con statusCode (como el 404 que lanzamos), lo relanzamos
    if (dbError.statusCode) {
      throw dbError;
    }
    // Error genérico de BD
    console.error('Error DB en teacherSubjectService.removeSubject:', dbError);
    const error = new Error('Error de base de datos al intentar desasignar la asignatura.');
    error.statusCode = 500; // Error interno del servidor
    throw error;
  }
};

module.exports = {
  assignSubject,
  removeSubject,
};
