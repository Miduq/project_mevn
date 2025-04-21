// controllers/authController.js

const { User, Role } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_PROFESOR = '3rhb23uydb238ry6g2429hrh';

// Lógica para el inicio de sesión
exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({
            where: { username },
            include: [{ model: Role, as: 'userRole' }],
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Usuario no encontrado.' });
        }

        if (!user.active) {
            return res.status(403).json({ success: false, message: 'Debes validar tu correo antes de iniciar sesión.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
        }

        // Generar JWT ( Para validar con isAuthenticated() )
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.rol },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        

        res.json({ success: true, message: 'Inicio de sesión exitoso.', token });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// Registrar usuario
exports.register = async (req, res) => {
    const {
        nombre,
        apellidos,
        username,
        email,
        rol,
        token,
        password,
        retype_password
    } = req.body;

    // Validaciones
    if (!nombre || !apellidos || !username || !email || !rol || !password || !retype_password) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }
    if (password !== retype_password) {
        return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden.' });
    }
    if (rol === 'Profesor' && token !== TOKEN_PROFESOR) {
        return res.status(400).json({ success: false, message: 'Token inválido, ponte en contacto con el Administrador.' });
    }

    try {
        // Verificar si el usuario existe
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'El nombre de usuario ya está registrado.' });
        }

        // Crear usuario
        const hashedPassword = await bcrypt.hash(password, 10);
        const accessToken = crypto.randomUUID();
        const passwordToken = crypto.randomUUID();

        const newUser = await User.create({
            username,
            name: nombre,
            surname: apellidos,
            email,
            password: hashedPassword,
            rol: rol === 'Profesor' ? 2 : 1,
            access_token: accessToken,
            password_token: passwordToken,
            active: 0
        });

        res.json({ success: true, message: 'Usuario registrado correctamente. Por favor, valida tu correo.', user: newUser });
        
        // Enviar correo de validación
        const validationUrl = `http://localhost:8080/validate-email?token=${accessToken}`;
        await emailService.sendValidationEmail(email, nombre, validationUrl);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al registrar el usuario.' });
    }
};

// Validar Correo
exports.validateEmail = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({ where: { access_token: token } });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Token inválido o expirado.' });
        }
        user.active = 1;
        user.access_token = null; // Eliminar el token una vez validado
        await user.save();
        res.json({ success: true, message: 'Correo validado exitosamente. Ahora puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error al validar el correo:', error);
        res.status(500).json({ success: false, message: 'Error al validar el correo.' });
    }
};

// Resetear contraseña
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await User.findOne({ where: { password_token: token } });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Token inválido o expirado.' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.password_token = null; // Eliminar el token una vez usado
        await user.save();
        res.json({ success: true, message: 'Tu contraseña ha sido actualizada con éxito.' });
    } catch (error) {
        console.error('Error al actualizar la contraseña:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// Enviar link de recuperación de contraseña
exports.recoverPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ success: false, message: 'El correo no está registrado en nuestra plataforma.' });
        }
        if (!user.active) {
            return res.status(400).json({ success: false, message: 'La cuenta no está activa. Por favor, valida tu correo o contacta con el administrador.' });
        }
        
        const resetToken = crypto.randomUUID();
        user.password_token = resetToken;
        await user.save();

        const resetUrl = `http://localhost:8080/reset-password?token=${resetToken}`;
        await emailService.sendPasswordRecoveryEmail(user.email, user.name, resetUrl);
        res.json({ success: true, message: `Se ha enviado un enlace de recuperación a tu correo: ${user.email}` });
    } catch (error) {
        console.error('Error al recuperar contraseña:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// Obtener datos del usuario actual
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'surname', 'email', 'rol', 'profile_image'],
            include: [{ model: Role, as: 'userRole' }],
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error al obtener el usuario actual:', error);
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
};