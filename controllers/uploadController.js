// controllers/uploadController.js

const { User } = require('../models'); // Ajusta la ruta según tu estructura

// Controlador para manejar la subida de la imagen de perfil
exports.uploadProfilePic = async (req, res) => {
    const userId = req.params.id;
    console.log(`Iniciando subida para el usuario ID: ${userId}`);
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);

    try {
        // Verificar si el usuario existe
        const user = await User.findByPk(userId);
        if (!user) {
            console.log(`Usuario con ID ${userId} no encontrado.`);
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        // Verificar permisos
        if (req.user.id !== parseInt(userId) && req.user.role !== 2) { 
            console.log(`Usuario con ID ${req.user.id} no tiene permiso para actualizar al usuario ${userId}.`);
            return res.status(403).json({ success: false, message: 'No tienes permiso para actualizar este usuario.' });
        }

        // Verificar si el archivo fue recibido
        if (!req.file) {
            console.error('No se ha subido ningún archivo.');
            return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo.' });
        }

        // Log del archivo recibido
        console.log('Archivo recibido:', req.file);

        // Actualizar el usuario con el nombre del archivo de perfil
        user.profile_image = req.file.filename;
        await user.save();

        console.log(`Imagen de perfil actualizada para el usuario ${userId}: ${req.file.filename}`);
        res.json({ 
            success: true, 
            message: 'Imagen de perfil actualizada con éxito.',
            imageUrl: `http://localhost:3000/uploads/profile_images/${req.file.filename}`,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Error en uploadProfilePic:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
