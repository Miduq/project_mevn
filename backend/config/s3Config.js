// backend/config/s3Config.js

require('dotenv').config();
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Validar que las variables de entorno necesarias existan
if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_REGION ||
  !process.env.AWS_S3_BUCKET_NAME
) {
  console.error('ERROR: Faltan variables de entorno de AWS S3 en .env');
  // Detener la aplicación si faltan credenciales críticas
  process.exit(1);
}

// Crear instancia del cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configuración Multer-S3
const s3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_S3_BUCKET_NAME, // El nombre del bucket desde .env
  acl: 'public-read',
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    // Define cómo se llamará el archivo dentro del bucket S3
    const userId = req.params.id || 'userid-desconocido';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const filename = `profile-images/user-${userId}-${uniqueSuffix}${extension}`; // Guarda en una carpeta 'profile-images'
    console.log(`Multer-S3: Generando key (filename) para S3: ${filename}`);
    cb(null, filename);
  },
});

// Filtro de archivos para Multer
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  // Sistema de errores de Multer
  cb(new Error('Error: Solo se permiten archivos de imagen (jpeg, jpg, png, gif)!'));
};

// Crear instancia de Multer configurada para S3
const uploadS3 = multer({
  storage: s3Storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, // Límite de 10MB (opcional)
});

module.exports = uploadS3;
