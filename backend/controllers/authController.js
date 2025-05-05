// controllers/authController.js

const { User, Role } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');
const { formatUserOutput } = require('../utils/userFormatter');

const EMAIL_CLIENT_ID = process.env.EMAIL_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_PROFESOR = '3rhb23uydb238ry6g2429hrh';
const client = new OAuth2Client(EMAIL_CLIENT_ID);

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
      return res.status(403).json({
        success: false,
        message: 'Debes validar tu correo antes de iniciar sesión.',
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    // Generar JWT ( Para validar con isAuthenticated() )
    const token = jwt.sign({ id: user.id, username: user.username, role: user.rol }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ success: true, message: 'Inicio de sesión exitoso.', token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

// Registrar usuario
exports.register = async (req, res) => {
  const { name, surname, username, email, rol, token, password } = req.body;

  // Validaciones
  if (!name || !surname || !username || !email || typeof rol === 'undefined' || rol === null || !password) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
  }
  if (rol === 2 && token !== TOKEN_PROFESOR) {
    return res.status(400).json({
      success: false,
      message: 'Token inválido, ponte en contacto con el Administrador.',
    });
  }

  try {
    // Verificar si el usuario existe
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está registrado.',
      });
    }

    // Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const accessToken = crypto.randomUUID();
    const passwordToken = crypto.randomUUID();

    const newUser = await User.create({
      username,
      name: name,
      surname: surname,
      email,
      password: hashedPassword,
      rol: rol,
      access_token: accessToken,
      password_token: passwordToken,
      active: 0,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080'; // Usa variable de entorno
    const validationUrl = `${frontendUrl}/validate-email?token=${accessToken}`;
    await emailService.sendValidationEmail(email, name, validationUrl); // <-- CORREGIDO: Pasa 'name'

    // --- Filtra la respuesta
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      surname: newUser.surname,
      email: newUser.email,
      rol: newUser.rol,
      active: newUser.active,
    };

    // Devuelve éxito con 201 Created
    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente. Por favor, valida tu correo.',
      user: userResponse,
    });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar el usuario.',
    });
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
    res.json({
      success: true,
      message: 'Correo validado exitosamente. Ahora puedes iniciar sesión.',
    });
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
    res.json({
      success: true,
      message: 'Tu contraseña ha sido actualizada con éxito.',
    });
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
      return res.status(400).json({
        success: false,
        message: 'El correo no está registrado en nuestra plataforma.',
      });
    }
    if (!user.active) {
      return res.status(400).json({
        success: false,
        message: 'La cuenta no está activa. Por favor, valida tu correo o contacta con el administrador.',
      });
    }

    const resetToken = crypto.randomUUID();
    user.password_token = resetToken;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    await emailService.sendPasswordRecoveryEmail(user.email, user.name, resetUrl);
    res.json({
      success: true,
      message: `Se ha enviado un enlace de recuperación a tu correo: ${user.email}`,
    });
  } catch (error) {
    console.error('Error al recuperar contraseña:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

// Obtener datos del usuario actual
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'name', 'surname', 'email', 'rol', 'profile_image', 'active'],
      include: [{ model: Role, as: 'userRole', attributes: ['id', 'role_name'] }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      email: user.email,
      rol: user.rol,
      role_name: user.userRole?.role_name || (user.rol === 1 ? 'Alumno' : user.rol === 2 ? 'Profesor' : 'Desconocido'),
      profile_image: user.profile_image,
      active: user.active,
    };
    res.json({ success: true, user: userResponse });
  } catch (error) {
    next(error);
  }
};

// Funcion para registrar un nuevo usuario con Google
exports.verifyGoogleToken = async (req, res, next) => {
  const { credential } = req.body; // El token JWT de Google enviado por el frontend

  if (!credential) {
    return res.status(400).json({ success: false, message: 'No se proporcionó credencial de Google.' });
  }
  if (!EMAIL_CLIENT_ID) {
    console.error('ERROR FATAL: GOOGLE_CLIENT_ID no definido en .env');
    return res.status(500).json({ success: false, message: 'Error de configuración del servidor [GAuth].' });
  }

  try {
    // 1. Verificar el token ID de Google
    console.log('Verificando Google ID Token...');
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: EMAIL_CLIENT_ID, // Especifica el Client ID de tu aplicación
    });
    const payload = ticket.getPayload();
    console.log('Payload de Google verificado:', payload);

    // 2. Extraer datos necesarios
    const googleId = payload['sub']; // ID único de Google para el usuario
    const email = payload['email'];
    const name = payload['given_name'] || 'Usuario'; // Nombre de pila
    const surname = payload['family_name'] || 'Google'; // Apellido
    const profile_image_google = payload['picture']; // URL de la imagen de Google

    if (!googleId || !email) {
      throw new Error('El token de Google no contenía ID o email.');
    }

    // 3. Buscar usuario en NUESTRA BD por googleId
    let user = await User.findOne({ where: { id_google: googleId }, include: [{ model: Role, as: 'userRole' }] });

    if (user) {
      // --- Usuario YA existe ---
      console.log(`Usuario encontrado por Google ID: ${user.id}`);
      // Verificar si está activo (opcional, Google ya verifica email)
      if (!user.active) {
        // Podríamos activarlo automáticamente o mostrar un error específico
        console.warn(`Usuario ${user.id} encontrado pero no está activo. Activando...`);
        user.active = 1; // Activar cuenta
        // Limpiar tokens de validación/reseteo si los tuviera
        user.access_token = null;
        user.password_token = null;
        await user.save();
      }
      // ¿Actualizar nombre/foto con los de Google cada vez? Opcional.
      // user.name = name; user.surname = surname; user.profile_image = profile_image_google; await user.save();
    } else {
      // --- Usuario NO existe -> Crear uno nuevo ---
      console.log(`Usuario con Google ID ${googleId} no encontrado. Creando nuevo usuario...`);
      // Comprobar si el EMAIL ya existe (por registro normal)
      const emailExists = await User.findOne({ where: { email: email } });
      if (emailExists) {
        // Qué hacer? Vincular cuenta? Mostrar error? Por ahora error.
        console.warn(`El email ${email} ya existe para un usuario no-google. No se puede crear.`);
        return res
          .status(409)
          .json({ success: false, message: `El email ${email} ya está registrado. Inicia sesión de forma normal.` });
      }

      // Generar un username único (ej: a partir del email o random)
      let username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      // Generar una contraseña "falsa" o aleatoria (no se usará para login)
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        username: username, // O genera uno diferente
        name: name,
        surname: surname,
        email: email,
        password: hashedPassword, // Password requerido, pero no se usará
        rol: 1, // <-- ROL POR DEFECTO para nuevos usuarios Google (ej: Alumno)
        active: 1, // Activado directamente (email verificado por Google)
        id_google: googleId, // Guardar el ID de Google
        profile_image: profile_image_google, // Guardar foto de Google
        // access_token y password_token se quedan null
      });
      console.log(`Nuevo usuario creado con ID: ${user.id}`);
      // Necesitamos recargar para incluir el rol si no lo devuelve create
      user = await User.findByPk(user.id, { include: [{ model: Role, as: 'userRole' }] });
    }

    // 4. Generar NUESTRO token JWT para la sesión de la aplicación
    const appTokenPayload = {
      id: user.id,
      username: user.username,
      role: user.rol, // Asegúrate que 'rol' tiene el ID numérico
    };
    const appToken = jwt.sign(appTokenPayload, JWT_SECRET, { expiresIn: '1d' }); // O tu tiempo de expiración

    // 5. Devolver éxito con NUESTRO token JWT y datos formateados
    const userResponse = formatUserOutput(user); // Usa el helper
    res.json({
      success: true,
      message: 'Inicio de sesión con Google exitoso.',
      token: appToken, // Enviar nuestro token
      user: userResponse,
    });
  } catch (error) {
    console.error('Error verificando token de Google o gestionando usuario:', error);
    if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token signature')) {
      return res.status(401).json({ success: false, message: 'Credencial de Google inválida o expirada.' });
    }
    next(error); // Pasar otros errores al manejador global
  }
};
