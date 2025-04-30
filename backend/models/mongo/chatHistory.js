// backend/models/mongo/chatHistory.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definición del esquema para el historial de chat
const chatHistorySchema = new Schema(
  {
    // Emisor del mensaje
    senderId: {
      type: Number,
      required: [true, 'El ID del emisor es obligatorio'],
      index: true,
    },
    // Receptor del mensaje
    recipientId: {
      type: Number,
      required: [true, 'El ID del receptor es obligatorio'],
      index: true,
    },
    // Texto del mensaje
    text: {
      type: String,
      required: [true, 'El texto del mensaje es obligatorio'],
      trim: true,
    },
    // Fecha y hora del mensaje
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Estado del mensaje (leído/no leído)
    status: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  }
);
chatHistorySchema.index({ senderId: 1, recipientId: 1, timestamp: -1 });
chatHistorySchema.index({ recipientId: 1, senderId: 1, timestamp: -1 });

module.exports = mongoose.model('chatHistory', chatHistorySchema);
