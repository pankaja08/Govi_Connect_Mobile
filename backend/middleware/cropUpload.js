const multer = require('multer');

// Use memory storage so we can pipe the buffer directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'), false);
  }
};

const uploadCropImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = { uploadCropImage };
