// backend/controllers/userController.js

const validator = require('validator');
const teacherSubjectService = require('../services/teacherSubjectService');
const { User, Role, Subject } = require('../models');
const { Op, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const fs = require('fs').promises;
const multer = require('multer');

const formatUserOutput = (user) => {
  if (!user) {
    return null;
  }
  // Determina el nombre del rol de forma segura
  let roleName = 'Desconocido';
  if (user.userRole?.role_name) {
    // Si la relación userRole se incluyó y tiene nombre
    roleName = user.userRole.role_name;
  } else if (user.rol === 1) {
    roleName = 'Alumno';
  } else if (user.rol === 2) {
    roleName = 'Profesor';
  }

  // Devuelve el objeto limpio
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    surname: user.surname, // Mantenemos surname
    email: user.email,
    rol: user.rol,
    role_name: roleName, // Nombre del rol calculado
    active: user.active,
    profile_image: user.profile_image,
  };
};

// Obtener todos los usuarios
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'access_token', 'password_token'] },
      include: [{ model: Role, as: 'userRole', attributes: ['id', 'role_name'] }],
    });

    const formattedUsers = users.map(formatUserOutput);
    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    next(error);
  }
};

// Obtener solo los profesores
exports.getTeachers = async (req, res, next) => {
  try {
    const teacherRoleId = 2;
    const teachers = await User.findAll({
      where: { rol: teacherRoleId },
      attributes: ['id', 'name', 'surname'], // Solo los campos necesarios
      order: [
        ['surname', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    res.json({ success: true, teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    next(error);
  }
};

// Buscar usuarios por nombre o email
exports.searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    const studentRoleId = 1;

    let whereClause = {}; // Cláusula Where inicial vacía

    // Solo aplicar filtro si query tiene contenido real
    if (query && query.trim() !== '') {
      console.log(`Buscando usuarios con query: "${query}"`);
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { surname: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { username: { [Op.like]: `%${query}%` } },
        ],
        rol: studentRoleId,
      };
    } else {
      console.log('Query de búsqueda vacía, listando usuarios por defecto.');
      whereClause.rol = studentRoleId;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password', 'access_token', 'password_token'] },
      include: [{ model: Role, as: 'userRole', attributes: ['id', 'role_name'] }],
      order: [
        ['surname', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    const formattedUsers = users.map(formatUserOutput);

    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Error en searchUsers:', error);
    next(error);
  }
};

// Obtener usuario por ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID de usuario inválido.' });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'access_token', 'password_token'] },
      include: [{ model: Role, as: 'userRole', attributes: ['id', 'role_name'] }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const formattedUser = formatUserOutput(user);
    res.json({ success: true, user: formattedUser });
  } catch (error) {
    console.error('Error en getUserById:', error);
    next(error);
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const studentRoleId = 1;

    const students = await User.findAll({
      where: { rol: studentRoleId }, // Filtra por el ID de rol de Alumno
      attributes: { exclude: ['password', 'access_token', 'password_token'] },
      include: [{ model: Role, as: 'userRole', attributes: ['role_name'] }],
      order: [
        ['surname', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    const formattedStudents = students.map(formatUserOutput);
    res.json({ success: true, students: formattedStudents });
  } catch (error) {
    console.error('Error en getStudents:', error);
    next(error);
  }
};

// Obtener la lista de asignaturas (ID y nombre) que imparte un profesor específico
exports.getProfessorSubjectList = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    if (isNaN(teacherId)) {
      return res.status(400).json({ success: false, message: 'ID de profesor inválido.' });
    }
    // Buscamos las asignaturas que tienen una relación con este profesor
    const subjects = await Subject.findAll({
      attributes: ['id', 'subject'],
      include: [
        {
          model: User,
          as: 'teachers',
          attributes: [],
          where: { id: parseInt(teacherId) },
          required: true,
        },
      ],
      order: [['subject', 'ASC']],
    });

    res.json({ success: true, subjects: subjects });
  } catch (error) {
    console.error('Error en getProfessorSubjectList:', error);
    next(error);
  }
};

// Actualizar usuario
exports.updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { name, surname, email } = req.body;
  const userId = parseInt(id);

  if (!name || !surname || !email) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: 'El formato del email no es válido.' });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    // Verificar autorización (solo el mismo usuario o un administrador puede actualizar)
    if (req.user.id !== parseInt(id) && req.user.role !== 2) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar este usuario.',
      });
    }

    // Actualizar campos
    user.name = name;
    user.surname = surname;
    user.email = email;

    await user.save();

    const userResponse = formatUserOutput(updatedUserWithRole);
    res.json({ success: true, message: '...', user: userResponse });
  } catch (error) {
    console.error('Error en updateUser:', error);
    next(error);
  }
};

exports.uploadProfilePicture = async (req, res, next) => {
  const { id: targetUserId } = req.params; // ID del usuario cuya foto se cambia
  const requesterUser = req.user; // Usuario que hace la petición
  const targetUserIdParsed = parseInt(targetUserId);
  if (requesterUser.id !== targetUserIdParsed && requesterUser.role !== 2) {
    // Borrar archivo subido si ya existe por Multer ANTES de devolver error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error('Error borrando archivo tras fallo de permiso:', e);
      }
    }
    return res.status(403).json({ success: false, message: 'No tienes permiso para cambiar esta imagen de perfil.' });
  }
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó un archivo de imagen válido.',
      });
    }

    const userId = req.params.id;
    const filename = req.file.filename; // Multer nos da el nombre único del archivo guardado

    // Actualizar el registro del usuario en la base de datos
    const [numberOfAffectedRows] = await User.update({ profile_image: filename }, { where: { id: userId } });

    // Verificar si se actualizó alguna fila
    if (numberOfAffectedRows === 0) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error('Error borrando archivo de usuario no encontrado:', e);
      }
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado para actualizar imagen.',
      });
    }

    // Enviar una respuesta exitosa al frontend
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/profile_images/${filename}`;

    res.status(200).json({
      success: true,
      message: 'Imagen de perfil actualizada correctamente.',
      filename: filename,
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error('Error en uploadProfilePicture Controller:', error);

    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error('Error borrando archivo tras error en controlador:', e);
      }
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Error de Multer: ${error.message}` });
    } else if (error.message && error.message.includes('Solo se permiten archivos de imagen')) {
      // Error de tu fileFilter
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// Asignar una asignatura a un profesor
exports.assignSubjectToTeacher = async (req, res, next) => {
  const { teacherId } = req.params;
  const { subjectId } = req.body;

  // Validación básica de formato de IDs (podría ir a middleware)
  if (isNaN(teacherId) || !subjectId || isNaN(subjectId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Se requiere ID de profesor válido y ID de asignatura válido.' });
  }

  // Permisos: Asumimos que el middleware 'isProfessor' ya se ejecutó en la ruta

  try {
    // Llama a la lógica del servicio
    const newAssignment = await teacherSubjectService.assignSubject(parseInt(teacherId), parseInt(subjectId));

    // El servicio fue exitoso si no lanzó error
    res.status(201).json({
      success: true,
      message: `Asignatura asignada correctamente.`, // Mensaje más genérico
      assignment: newAssignment,
    });
  } catch (error) {
    next(error);
  }
};

// Quitar una asignatura de un profesor
exports.removeSubjectFromTeacher = async (req, res, next) => {
  // Añadimos next
  const { teacherId, subjectId } = req.params;

  // Validación básica de formato de IDs
  if (isNaN(teacherId) || isNaN(subjectId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Se requieren IDs numéricos válidos para profesor y asignatura.' });
  }

  try {
    // Llama a la lógica del servicio
    await teacherSubjectService.removeSubject(parseInt(teacherId), parseInt(subjectId));

    // Éxito si el servicio no lanzó error
    res.status(200).json({
      success: true,
      message: `Asignatura desasignada del profesor correctamente.`,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteStudentByProfessor = async (req, res, next) => {
  // ID del alumno a ELIMINAR viene de los parámetros de la ruta
  const { studentId } = req.params;
  // Usuario que realiza la petición (profesor), viene del middleware 'isAuthenticated'
  const requesterUser = req.user;

  // 2. Validar el ID del estudiante
  if (isNaN(studentId)) {
    return res.status(400).json({
      success: false,
      message: 'ID de estudiante inválido en la URL.',
    });
  }
  const studentIdParsed = parseInt(studentId);

  // 3. Opcional: Evitar que un profesor se elimine a sí mismo por error
  if (requesterUser.id === studentIdParsed) {
    return res.status(400).json({
      success: false,
      message: 'No puedes eliminarte a ti mismo usando esta función.',
    });
  }

  try {
    // 4. Verificar que el usuario a borrar existe y es un alumno
    const studentToDelete = await User.findOne({
      where: {
        id: studentIdParsed,
        rol: 1, // Aseguramos que sea un alumno
      },
    });

    // 5. Verificar si se encontró y es un alumno
    if (!studentToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Alumno no encontrado con el ID proporcionado.',
      });
    }

    // 6. Ejecutar el borrado físico (HARD DELETE)
    const numberOfAffectedRows = await User.destroy({
      where: {
        id: studentIdParsed,
      },
    });

    // 7. Verificar si se borró (debería ser 1 si findOne tuvo éxito)
    if (numberOfAffectedRows === 0) {
      // Caso raro si findOne funcionó pero destroy no afectó filas
      console.warn(`Se intentó borrar al alumno ${studentIdParsed} pero destroy devolvió 0 filas afectadas.`);
      return res.status(404).json({
        success: false,
        message: 'No se encontró el alumno para eliminar (posible condición de carrera).',
      });
    }

    // 8. Éxito
    res.status(200).json({
      success: true,
      // Mensaje actualizado para reflejar borrado permanente
      message: `Alumno "${studentToDelete.name} ${studentToDelete.surname}" eliminado permanentemente del sistema.`,
    });
  } catch (error) {
    // 9. Manejo de Errores
    console.error('Error en deleteStudentByProfessor (hard delete):', error);
    // Comprobar específicamente errores de FK si CASCADE fallara
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({
        success: false,
        message:
          'Conflicto: No se pudo eliminar al alumno debido a relaciones existentes (ON DELETE CASCADE podría haber fallado o no estar activo).',
      });
    }
    next(error);
  }
};

exports.updateStudentByProfessor = async (req, res) => {
  // ID del estudiante a actualizar (de la URL)
  const { studentId } = req.params;
  // Usuario que realiza la petición (profesor) (del token)
  const requesterUser = req.user;
  // Nuevos datos (del body de la petición)
  const { name, surname, email } = req.body;

  // 2. Validación del ID del estudiante
  if (isNaN(studentId)) {
    return res.status(400).json({ success: false, message: 'ID de estudiante inválido.' });
  }
  const studentIdParsed = parseInt(studentId);

  // 3. Validación de datos recibidos en el body
  if (!name || !surname || !email) {
    return res.status(400).json({
      success: false,
      message: 'Los campos nombre, apellidos y email son obligatorios.',
    });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'El formato del correo electrónico no es válido.',
    });
  }

  // 4. Opcional: Evitar auto-edición por esta ruta específica
  if (requesterUser.id === studentIdParsed) {
    return res.status(400).json({
      success: false,
      message: 'No puedes editarte a ti mismo usando esta función (usa tu perfil).',
    });
  }

  try {
    // 5. Buscar al alumno por ID y asegurarse de que es un alumno (Rol 1)
    const studentToUpdate = await User.findOne({
      where: {
        id: studentIdParsed,
        rol: 1, // Aseguramos que sea un alumno
      },
    });

    // 6. Verificar si se encontró al alumno
    if (!studentToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Alumno no encontrado con el ID proporcionado.',
      });
    }

    // 7. Actualizar los campos permitidos
    studentToUpdate.name = name;
    studentToUpdate.surname = surname;
    studentToUpdate.email = email;
    // Aquí NO modificamos 'password', 'rol', 'active', etc.

    // 8. Guardar los cambios en la BD
    await studentToUpdate.save();

    // 9. Éxito: Devolver los datos actualizados del alumno (excluyendo sensibles)
    const updatedStudentWithRole = await User.findByPk(studentToUpdate.id, {
      include: [{ model: Role, as: 'userRole', attributes: ['id', 'role_name'] }],
    });
    const userResponse = formatUserOutput(updatedStudentWithRole);
    res.status(200).json({ success: true, message: '...', user: userResponse });
  } catch (error) {
    // 10. Manejo de Errores (incluyendo posible email duplicado)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Error: El correo electrónico ya está registrado por otra cuenta.',
      });
    }
    next(error);
  }
};
