// backend/controllers/chatController.js

const ChatHistory = require('../models/mongo/chatHistory');
const { User } = require('../models/'); // Asegúrate de importar el modelo de usuario
const { Op } = require('sequelize');
const papaparse = require('papaparse');

exports.getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id; // ID del usuario autenticado
    const otherUserId = parseInt(req.params.otherUserId, 10); // ID del otro usuario

    // Validaciones básicas
    if (isNaN(otherUserId)) {
      return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
    }
    // Evitar solicitar historial a sí mismo
    if (userId === otherUserId) {
      return res.json({ success: true, history: [] }); // Devolver historial vacío
    }

    // Obtener el historial de chat entre los dos usuarios
    const chatHistory = await ChatHistory.find({
      $or: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    })
      .sort({ timestamp: 1 }) // Ordenar por fecha ascendente
      .limit(50); // Limitar a los últimos 50 mensajes

    const senderIds = [...new Set(chatHistory.map((msg) => msg.senderId))];
    // Buscar esos usuarios en PostgreSQL para obtener sus usernames
    const senders = await User.findAll({
      where: {
        id: { [Op.in]: senderIds }, // Buscar todos los remitentes a la vez
      },
      attributes: ['id', 'username', 'name', 'surname'],
    });

    // 4. Crear un mapa para buscar fácilmente
    const senderInfoMap = new Map();
    senders.forEach((sender) => {
      senderInfoMap.set(sender.id, {
        username: sender.username,
        name: sender.name,
        surname: sender.surname,
      });
    });
    console.log('API: Mapa de info de remitentes creado:', senderInfoMap);

    // Mapear el historial para añadir la información del remitente
    const populatedHistory = chatHistory.map((msg) => {
      const senderInfo = senderInfoMap.get(msg.senderId);
      // Convertir doc Mongoose a objeto plano para poder añadir propiedades
      const msgObject = msg.toObject ? msg.toObject() : { ...msg };

      // Añadir el username
      msgObject.senderUsername = senderInfo?.username || 'Usuario Desconocido';
      return msgObject;
    });
    res.json({ success: true, history: populatedHistory });
  } catch (error) {
    console.error(`Error obteniendo historial entre ${req.user?.id} y ${req.params.otherUserId}:`, error);
    next(error);
  }
};

// Devuelve la lista de conversaciones para el usuario autenticado
exports.listConversations = async (req, res, next) => {
  const userId = req.user.id; // Usuario logueado
  console.log(`API: Solicitud de lista de conversaciones para Usuario ${userId}`);

  try {
    const conversations = [
      // Filtrar mensajes relevantes para el usuario
      { $match: { $or: [{ senderId: userId }, { recipientId: userId }] } },
      // Ordenar por fecha DESCENDENTE (más reciente primero)
      { $sort: { timestamp: -1 } },
      // Agrupar por la "pareja" de conversación
      {
        $group: {
          // Crear un ID de grupo único para la pareja (siempre el ID menor primero)
          _id: {
            $cond: [
              { $lt: ['$senderId', '$recipientId'] },
              { u1: '$senderId', u2: '$recipientId' },
              { u1: '$recipientId', u2: '$senderId' },
            ],
          },
          // Obtener el ID del OTRO participante (el partner)
          partnerId: { $first: { $cond: [{ $eq: ['$senderId', userId] }, '$recipientId', '$senderId'] } },
          // Obtener los datos del ÚLTIMO mensaje de esta agrupación
          lastMessageTimestamp: { $first: '$timestamp' },
          lastMessageText: { $first: '$text' },
          lastMessageSenderId: { $first: '$senderId' },
        },
      },
      // Ordenar las CONVERSACIONES por fecha del último mensaje
      { $sort: { lastMessageTimestamp: -1 } },
    ];

    const conversationsData = await ChatHistory.aggregate(conversations);

    console.log(`API: Encontradas ${conversationsData.length} conversaciones únicas en MongoDB.`);

    if (conversationsData.length === 0) {
      return res.json({ success: true, conversations: [] }); // No hay conversaciones
    }

    // Obtener los IDs de todos los usuarios para buscar sus detalles
    const partnerIds = conversationsData.map((conv) => conv.partnerId);
    console.log(`API: IDs de usuarios únicos:`, partnerIds);

    // Buscar detalles de los usuarios en PostgreSQL
    const partners = await User.findAll({
      where: { id: { [Op.in]: partnerIds } },
      attributes: ['id', 'username', 'name', 'surname', 'profile_image', 'active'], // Campos útiles
    });

    // Mapeo para fácil acceso
    const partnerInfoMap = new Map();
    partners.forEach((p) => partnerInfoMap.set(p.id, p.toJSON())); // Convertir a objeto plano

    // Combinar datos de conversación con detalles del partner
    const conversationsResult = conversationsData.map((conv) => {
      const partnerDetails = partnerInfoMap.get(conv.partnerId);
      return {
        partnerId: conv.partnerId,
        lastMessageTimestamp: conv.lastMessageTimestamp,
        lastMessageText: conv.lastMessageText,
        // Indica si el último mensaje lo envié yo o el partner
        lastMessageSentByMe: conv.lastMessageSenderId === userId,
        partner: partnerDetails
          ? {
              id: partnerDetails.id,
              username: partnerDetails.username,
              name: partnerDetails.name,
              surname: partnerDetails.surname,
              profile_image: partnerDetails.profile_image,
              active: partnerDetails.active,
            }
          : { id: conv.partnerId, name: 'Usuario', surname: 'Eliminado?', active: false },
      };
    });

    console.log(`API: Devolviendo ${conversationsResult.length} conversaciones formateadas.`);
    res.json({ success: true, conversations: conversationsResult });
  } catch (error) {
    console.error(`Error listando conversaciones para Usuario ${userId}:`, error);
    next(error);
  }
};

// Genera un CSV con el historial de chat entre dos usuarios para descargar
exports.downloadChatCsv = async (req, res, next) => {
  const userId = req.user.id;
  const otherUserIdParam = req.params.otherUserId;

  if (!otherUserIdParam || isNaN(otherUserIdParam)) {
    return res.status(400).json({ success: false, message: 'ID de usuario inválido.' });
  }
  const otherUserId = parseInt(otherUserIdParam, 10);
  if (userId === otherUserId) {
    return res.status(400).json({ success: false, message: 'No se puede descargar historial consigo mismo.' });
  }

  try {
    // Obtener historial
    const rawHistory = await ChatHistory.find({
      $or: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    }).sort({ timestamp: 1 });

    if (rawHistory.length === 0) {
      // Devolver un CSV vacío con cabeceras si no hay historial
      const emptyCsv = papaparse.unparse([{}]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="historial_chat_${userId}_${otherUserId}_vacio.csv"`);
      return res.status(200).send(emptyCsv);
    }

    const senderIds = [...new Set(rawHistory.map((msg) => msg.senderId))];
    const senders = await User.findAll({ where: { id: { [Op.in]: senderIds } }, attributes: ['id', 'username'] });
    const senderInfoMap = new Map(senders.map((s) => [s.id, { username: s.username }]));

    const populatedHistoryForCsv = rawHistory.map((msg) => {
      const senderInfo = senderInfoMap.get(msg.senderId);
      return {
        // Seleccionar y formatear campos para el CSV
        'Fecha y Hora': msg.timestamp.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' }),
        'Remitente ID': msg.senderId,
        'Remitente Username': senderInfo?.username || 'Desconocido',
        Mensaje: msg.text,
        Leído: msg.status ? 'Sí' : 'No',
      };
    });

    // Convertir el array de objetos a CSV string usando Papaparse
    const csvString = papaparse.unparse(populatedHistoryForCsv, {
      header: true, // Incluir la fila de cabeceras
      quotes: true, // Poner comillas alrededor de los campos
      delimiter: ',', // Delimitador estándar
      newline: '\r\n', // Salto de línea Windows/Excel compatible
    });

    // Establecer las cabeceras HTTP para forzar la descarga
    const filename = `historial_chat_user${userId}_user${otherUserId}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); // Tipo de contenido y codificación
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`); // Nombre del archivo

    // Enviar la cadena CSV como respuesta
    res.status(200).send(csvString);
    console.log(`API: CSV generado y enviado para chat ${userId} <-> ${otherUserId}`);
  } catch (error) {
    console.error(`Error generando CSV para chat ${userId} <-> ${otherUserId}:`, error);
    next(error);
  }
};
