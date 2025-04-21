// services/emailService.js

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // Cambia esto si usas otro servicio
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN,
    },
});

// Enviar correo de validación
exports.sendValidationEmail = async (to, nombre, validationUrl) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Validación de correo electrónico',
        html: `
      <p>Hola ${nombre},</p>
      <p>Gracias por registrarte. Por favor, valida tu correo electrónico haciendo clic en el siguiente enlace:</p>
      <a href="${validationUrl}">Validar correo</a>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo de validación enviado a ${to}`);
    } catch (error) {
        console.error('Error al enviar correo de validación:', error);
        throw new Error('No se pudo enviar el correo de validación.');
    }
};

// Enviar correo de recuperación de contraseña
exports.sendPasswordRecoveryEmail = async (to, nombre, resetUrl) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Recuperación de contraseña',
        html: `
      <p>Hola ${nombre},</p>
      <p>Has solicitado un cambio de contraseña. Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
      <a href="${resetUrl}">Cambiar mi contraseña</a>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo de recuperación de contraseña enviado a ${to}`);
    } catch (error) {
        console.error('Error al enviar correo de recuperación de contraseña:', error);
        throw new Error('No se pudo enviar el correo de recuperación de contraseña.');
    }
};
