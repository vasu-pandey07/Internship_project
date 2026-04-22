const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

/**
 * Multer + Cloudinary upload middleware.
 * Provides separate uploaders for images and videos.
 */

// Image upload (for thumbnails, avatars)
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eduplatform/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 450, crop: 'fill' }],
  },
});

// Video upload (for lessons)
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eduplatform/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'webm', 'mov'],
  },
});

const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eduplatform/documents',
    resource_type: 'raw',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
  },
});

const localDocumentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'documents');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = path
      .basename(file.originalname || 'document', ext)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 80);
    cb(null, `${Date.now()}-${base || 'document'}${ext}`);
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

const uploadDocument = multer({
  // Keep assignment files on local disk to avoid Cloudinary failures
  // when cloud_name/API settings are invalid or partially configured.
  storage: localDocumentStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

module.exports = { uploadImage, uploadVideo, uploadDocument };
