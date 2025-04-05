const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs-extra');
const ErrorResponse = require('../utils/errorResponse');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
fs.ensureDirSync(uploadDir);

// Storage configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create user-specific directory
    const userDir = path.join(uploadDir, req.user.id.toString());
    fs.ensureDirSync(userDir);
    cb(null, userDir);
  },
  filename: function(req, file, cb) {
    // Generate unique filename: timestamp-randomhex-originalname
    crypto.randomBytes(8, (err, buf) => {
      if (err) return cb(err);
      
      const uniqueSuffix = `${Date.now()}-${buf.toString('hex')}`;
      const fileExt = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${fileExt}`);
    });
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedFileTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
  
  // Check extension
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  
  // Check mime type
  const mimetype = allowedFileTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new ErrorResponse('File type not supported', 400), false);
  }
};

// Initialize multer with configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter
});

// Middleware for handling document upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ErrorResponse('File too large. Max size is 10MB', 400));
    }
    return next(new ErrorResponse(`Upload error: ${err.message}`, 400));
  } else if (err) {
    return next(err);
  }
  next();
};

module.exports = {
  upload,
  handleUploadError
};
