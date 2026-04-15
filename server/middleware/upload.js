const multer = require('multer');
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

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

module.exports = { uploadImage, uploadVideo };
