// controllers/userController.js

const { User, Role } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password', 'access_token', 'password_token'] },
            include: [{ model: Role, as: 'userRole', attributes: ['id', 'role_name'] }],
        });

        const usersWithRole = users.map(user => ({
            id: user.id,
            username: user.username,
            name: user.name,
            surname: user.surname,
            email: user.email,
            rol: user.rol,
            role_name: user.userRole ? user.userRole.role_name : 'Desconocido',
            active: user.active,
            profile_image: user.profile_image,
        }));

        res.json({ success: true, users: usersWithRole });
    } catch (error) {
        console.error('Error en getAllUsers:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los usuarios.' });
    }
};

// Obtener solo los profesores
exports.getTeachers = async (req, res) => {
    try {
      const teacherRoleId = 2; 
      const teachers = await User.findAll({
        where: { rol: teacherRoleId },
        attributes: ['id', 'name', 'surname'], // Solo los campos necesarios
        order: [['surname', 'ASC'], ['name', 'ASC']]
      });
      res.json({ success: true, teachers });
    } catch (error) {
       console.error('Error fetching teachers:', error);
       res.status(500).json({ success: false, message: 'Error al obtener los profesores.' });
    }
  };

// Buscar usuarios por nombre o email
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ success: false, message: 'El parámetro de búsqueda es obligatorio.' });
        }

        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } },
                ],
            },
            attributes: { exclude: ['password', 'access_token', 'password_token'] },
            include: [{ model: Role, as: 'userRole', attributes: ['id', 'role_name'] }],
        });

        const usersWithRole = users.map(user => ({
            id: user.id,
            username: user.username,
            name: user.name,
            surname: user.surname,
            email: user.email,
            rol: user.rol,
            role_name: user.userRole ? user.userRole.role_name : 'Desconocido',
            active: user.active,
            profile_image: user.profile_image,
        }));

        res.json({ success: true, users: usersWithRole });
    } catch (error) {
        console.error('Error en searchUsers:', error);
        res.status(500).json({ success: false, message: 'Error al buscar los usuarios.' });
    }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
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

        const userWithRole = {
            id: user.id,
            username: user.username,
            name: user.name,
            surname: user.surname,
            email: user.email,
            rol: user.rol,
            role_name: user.userRole ? user.userRole.role_name : 'Desconocido',
            active: user.active,
            profile_image: user.profile_image,
        };

        res.json({ success: true, user: userWithRole });
    } catch (error) {
        console.error('Error en getUserById:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, surname, email, rol } = req.body;

    if (!name || !surname || !email || !rol) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        // Verificar autorización (solo el mismo usuario o un administrador puede actualizar)
        if (req.user.id !== parseInt(id) && req.user.role !== 2) { // Asumiendo que 2 es administrador
            return res.status(403).json({ success: false, message: 'No tienes permiso para actualizar este usuario.' });
        }

        // Actualizar campos
        user.name = name;
        user.surname = surname;
        user.email = email;
        user.rol = rol;

        await user.save();

        res.json({ success: true, message: 'Usuario actualizado correctamente.', user });
    } catch (error) {
        console.error('Error en updateUser:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el usuario.' });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se proporcionó un archivo de imagen válido.' });
        }

        const userId = req.params.id;
        const filename = req.file.filename; // Multer nos da el nombre único del archivo guardado

        // Actualizar el registro del usuario en la base de datos
        const [numberOfAffectedRows] = await User.update(
            { profile_image: filename }, 
            { where: { id: userId } }  
        );

        // Verificar si se actualizó alguna fila
        if (numberOfAffectedRows === 0) {
            try { await fs.unlink(req.file.path); } catch (e) { console.error("Error borrando archivo de usuario no encontrado:", e); }
            return res.status(404).json({ success: false, message: 'Usuario no encontrado para actualizar imagen.' });
        }

        // Enviar una respuesta exitosa al frontend
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/profile_images/${filename}`;

        res.status(200).json({
            success: true,
            message: 'Imagen de perfil actualizada correctamente.',
            filename: filename,
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error("Error en uploadProfilePicture Controller:", error);

        if (req.file && req.file.path) {
            try { await fs.unlink(req.file.path); } catch (e) { console.error("Error borrando archivo tras error en controlador:", e); }
        }

        if (error instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `Error de Multer: ${error.message}`});
        } else if (error.message && error.message.includes('Solo se permiten archivos de imagen')) { // Error de tu fileFilter
            return res.status(400).json({ success: false, message: error.message });
        }

        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar la imagen.' });
    }
};
