// controllers/roleController.js

const { Role } = require('../models');

// Obtener todos los roles
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({
            attributes: ['id', 'role_name']
        });
        res.json({ success: true, roles });
    } catch (error) {
        console.error('Error en getAllRoles:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los roles.' });
    }
};

// Crear un nuevo rol (opcional)
exports.createRole = async (req, res) => {
    const { role_name } = req.body;
    if (!role_name) {
        return res.status(400).json({ success: false, message: 'El nombre del rol es obligatorio.' });
    }

    try {
        const existingRole = await Role.findOne({ where: { role_name } });
        if (existingRole) {
            return res.status(400).json({ success: false, message: 'El rol ya existe.' });
        }

        const newRole = await Role.create({ role_name });
        res.status(201).json({ success: true, role: newRole });
    } catch (error) {
        console.error('Error en createRole:', error);
        res.status(500).json({ success: false, message: 'Error al crear el rol.' });
    }
};
