// backend/server.js

require('dotenv').config(); // Cargar variables de entorno
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./models'); // Importar modelos de Sequelize
const mongoose = require('mongoose'); // Dependencia para MongoDB
const multer = require('multer'); // Importar Multer para manejar errores de Multer
const errorHandler = require('./middleware/errorHandler');
const http = require('http'); // Módulo http nativo de Node
const jwt = require('jsonwebtoken'); // JWT para manejar autenticación
const JWT_SECRET = process.env.JWT_SECRET; // Clave secreta para firmar el JWT
const { Server } = require('socket.io');
const chatHistorySchema = require('./models/mongo/chatHistory'); // Modelo de Mongoose para el historial de chat

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const studentsTeachersRelationRoutes = require('./routes/studentsTeachersRelationRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Crea un servidor HTTP estándar usando la app de Express
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080', // URL del frontend
    methods: ['GET', 'POST'], // Métodos permitidos para la conexión inicial
  },
});

// Mapa para rastrear usuarios conectados: userId -> socketId
const userSockets = new Map();

// Middleware para verificar el token JWT en cada conexión nueva
io.use((socket, next) => {
  const token = socket.handshake.auth?.token; // Usamos optional chaining por seguridad
  const socketId = socket.id; // Para logs

  console.log(
    `Socket Auth Middleware: Intentando conectar socket ${socketId}... Token presente: ${token ? 'Sí' : 'No'}`
  );

  if (!token) {
    console.log(`Socket Auth Middleware: Rechazado ${socketId} (Sin token)`);
    // Devolver un error en next() rechaza la conexión
    return next(new Error('Authentication error: No se proporcionó token.'));
  }

  // Verificar el token
  jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
    if (err) {
      console.log(`Socket Auth Middleware: Rechazado ${socketId} (Token inválido/expirado: ${err.message})`);
      return next(new Error('Authentication error: Token inválido o expirado.'));
    }

    // Token válido
    socket.user = {
      id: decodedPayload.id,
      username: decodedPayload.username,
      role: decodedPayload.rol || decodedPayload.role,
    };

    console.log(
      `Socket Auth Middleware: Socket ${socketId} autenticado como User ID: ${socket.user.id}, Username: ${socket.user.username}`
    );
    next();
  });
});
// Configuración de CORS
app.use(
  cors({
    origin: 'http://localhost:8080', // Direccion del front-end
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Middleware para parsear JSON
app.use(express.json());

// Servir carpeta de imágenes (uploads) de forma estática
app.use('/uploads/profile_images', express.static(path.join(__dirname, 'uploads/profile_images')));

// Usar rutas
app.use('/auth', authRoutes); // Ruta para autenticación
app.use('/users', userRoutes); // Ruta para los usuarios
app.use('/roles', roleRoutes); // Ruta para los roles
app.use('/relations', studentsTeachersRelationRoutes); // Ruta para las relaciones entre estudiantes y profesores
app.use('/subjects', subjectRoutes); // Ruta para las asignaturas
app.use('/api/chats', chatRoutes); // Ruta para el historial de chat

// LÓGICA DE SOCKET.IO

io.on('connection', (socket) => {
  // 'socket' representa la conexión individual de UN cliente
  const connectedUser = socket.user;
  console.log(
    `🔌 Usuario CONECTADO y AUTENTICADO: ${connectedUser?.username} (ID: ${connectedUser?.id}, Socket: ${connectedUser.id})`
  );

  // Guardar el socket del usuario si se autenticó correctamente
  if (connectedUser?.id) {
    userSockets.set(connectedUser.id, socket.id);
    console.log('Mapa de Sockets Activos:', userSockets); // Muestra el mapa actualizado

    // Enviar confirmación y datos básicos del usuario de vuelta al cliente conectado
    socket.emit('authenticated', { id: connectedUser.id, username: connectedUser.username, role: connectedUser.role });
  } else {
    // Esto no debería pasar si io.use funciona bien, pero por seguridad
    console.error(`Socket ${socket.id} conectado pero sin datos de usuario autenticado! Desconectando.`);
    socket.disconnect(true); // Forzar desconexión
    return; // Salir del handler de conexión
  }

  socket.on('sendMessage', async (data) => {
    // data debería ser { recipientId: X, text: '...' } enviado por el cliente
    const sender = socket.user; // El usuario que envía (obtenido del socket autenticado)
    const messageText = data?.text?.trim();
    const recipientId = data?.recipientId ? parseInt(data.recipientId, 10) : null;

    // Validaciones básicas
    if (!sender || !recipientId || !messageText || isNaN(recipientId)) {
      console.log(`Mensaje inválido recibido de ${sender.username} ${socket.id}. Data:`, data);
      socket.emit('chatError', { message: 'Mensaje o destinatario inválido.' });
      return;
    }

    // Creamos el objeto mensaje que reenviaremos y/o guardaremos
    const messageToSend = {
      senderId: sender.id,
      senderUsername: sender.username,
      recipientId: recipientId, // Incluir a quién va dirigido
      text: messageText,
      timestamp: new Date(),
    };

    // Guardar el mensaje en MongoDB (historial de chat)
    try {
      // Crear una nueva instancia del modelo ChatHistory con los datos
      const newMessage = new chatHistorySchema(messageToSend);
      // Guardar el documento en la colección 'chathistories'
      await newMessage.save();
      // Loguear éxito (opcional, útil para debug)
      console.log(`💾 Mensaje guardado en MongoDB. ID Mongoose: ${newMessage._id}`);
    } catch (dbSaveError) {
      // Error específico al guardar en MongoDB
      console.error('❌ ERROR al guardar mensaje en MongoDB:', dbSaveError);
    }

    // Enviar al destinatario SI está conectado
    const recipientSocketId = userSockets.get(recipientId);
    if (recipientSocketId) {
      console.log(`Enviando 'newMessage' a destinatario ${recipientId} (Socket: ${recipientSocketId})`);
      // io.to() se usa para enviar a sockets específicos o salas
      io.to(recipientSocketId).emit('newMessage', messageToSend);
      // Enviar notificación simple SOLO al destinatario para indicador "no leído"
      io.to(recipientSocketId).emit('newMessageNotification', {
        senderId: sender.id,
        senderUsername: sender.username, // Enviamos quién lo manda
      });
    } else {
      console.log(`Destinatario ${recipientId} no conectado. Mensaje no entregado en tiempo real.`);
      // Aquí podríamos guardar el mensaje en BD como 'no leído'
      // O enviar un aviso al remitente
      socket.emit('chatError', { message: `El usuario destinatario no está conectado.` });
    }

    // 3. Enviar siempre de vuelta al remitente (echo)
    console.log(`Enviando 'newMessage' (echo) a ${sender.username} ${socket.id}`);
    socket.emit('newMessage', messageToSend);
  });

  // Manejar desconexión
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Usuario desconectado: ${socket.user?.username} (Socket: ${socket.id}). Razón: ${reason}`);
    // Eliminar al usuario del mapa de sockets activos
    if (socket.user?.id) {
      // Asegurarse de borrar solo si el ID coincide (por si reconecta rápido)
      if (userSockets.get(socket.user.id) === socket.id) {
        userSockets.delete(socket.user.id);
        console.log('Mapa de Sockets Activos:', userSockets); // Mostrar mapa actualizado
      }
    }
  });

  // Manejar errores de socket (importante)
  socket.on('error', (error) => {
    console.error(`❌ Error en Socket ${socket.id} (Usuario: ${socket.user?.username}):`, error);
  });
});

// Manejar rutas no definidas (404)
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada.' });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Sincronizar la base de datos y arrancar el servidor
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI; // Obtener URI de MongoDB desde .env

// Función async para poder usar await y manejar errores centralizadamente
const startServer = async () => {
  try {
    // 1. Conectar a PostgreSQL (Sequelize)
    await db.sequelize.sync(); // Esperar a que Sequelize esté listo
    console.log('🐘 PostgreSQL Conectado y Sincronizado.');

    // 2. Conectar a MongoDB (Mongoose)
    if (!MONGODB_URI) {
      // Es crucial tener la URI, si no, parar la aplicación
      throw new Error('MONGODB_URI no está definida en el archivo .env');
    }
    console.log('🍃 Intentando conectar a MongoDB Atlas...');
    // Usamos await para esperar a que la conexión se establezca o falle
    await mongoose.connect(MONGODB_URI, {
      // Opciones ya no necesarias en Mongoose 6+:
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // Si usas Mongoose 6 o superior, normalmente no necesitas pasar opciones aquí.
    });
    console.log('🍃 MongoDB Atlas Conectado con éxito.');

    // (Opcional) Escuchar eventos de Mongoose después de conectar
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de conexión MongoDB (post-conexión):', err);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB desconectado.');
    });

    // 3. Arrancar el servidor HTTP (Express + Socket.IO)
    // SOLO si ambas conexiones a BD fueron exitosas
    httpServer.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT} (Express + Socket.IO + PG + MongoDB)`);
    });
  } catch (error) {
    // Captura cualquier error durante la conexión a CUALQUIERA de las BDs
    console.error('--------------------------------------------');
    console.error('💥 ERROR FATAL AL INICIAR EL SERVIDOR 💥');
    console.error('No se pudo conectar a las bases de datos:', error.message);
    console.error('--------------------------------------------');
    process.exit(1); // Termina el proceso de Node si no puede conectar a las BDs
  }
};

// Ejecutar la función de arranque
startServer();
