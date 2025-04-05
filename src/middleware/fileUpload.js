const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs-extra');
const ErrorResponse = require('../utils/errorResponse');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
fs.ensureDirSync(uploadDir);

// Storage configuration for different document types
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let targetDir = uploadDir;
    
    // Determine the appropriate directory based on the request path and file field
    if (req.originalUrl.includes('/jobs') && !req.params.id) {
      // Job attachment uploads - organize by user (sponsor/agent) ID
      targetDir = path.join(uploadDir, 'jobs', req.user.id.toString());
    } else if (req.originalUrl.includes('/applications')) {
      // Application document uploads
      const applicantId = req.user.id.toString();
      // Use field name to determine document type subdirectory
      let docType = 'other';
      if (file.fieldname === 'resume') docType = 'resumes';
      else if (file.fieldname === 'certificate') docType = 'certificates';
      else if (file.fieldname === 'identification') docType = 'identification';
      else if (file.fieldname === 'recommendation') docType = 'recommendations';
      
      targetDir = path.join(uploadDir, 'applications', applicantId, docType);
    } else {
      // Default to user uploads directory
      targetDir = path.join(uploadDir, 'users', req.user.id.toString());
    }
    
    // Ensure directory exists
    fs.ensureDirSync(targetDir);
    cb(null, targetDir);
  },
  filename: function(req, file, cb) {
    // Generate unique filename: timestamp-randomhex-originalname
    crypto.randomBytes(8, (err, buf) => {
      if (err) return cb(err);
      
      const uniqueSuffix = `${Date.now()}-${buf.toString('hex')}`;
      const fileExt = path.extname(file.originalname);
      // Include sanitized original filename for better identification
      const sanitizedName = path.basename(file.originalname, fileExt)
        .replace(/[^a-zA-Z0-9]/g, '-')
        .substring(0, 40); // Limit length
      
      cb(null, `${sanitizedName}-${uniqueSuffix}${fileExt}`);
    });
  }
});

// Extended file type validation
const fileFilter = (req, file, cb) => {
  // Extended allowed file types 
  const allowedMimeTypes = {
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    
    // Documents
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
    
    // Archives
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-7z-compressed': ['.7z']
  };
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  // Check if mime type is allowed
  if (allowedMimeTypes[file.mimetype]) {
    // Verify extension matches the mime type
    if (allowedMimeTypes[file.mimetype].includes(fileExtension)) {
      return cb(null, true);
    }
  }
  
  // Either mime type not allowed or extension doesn't match
  cb(new ErrorResponse(`File type not supported: ${file.mimetype} / ${fileExtension}`, 400), false);
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
      return next(new ErrorResponse('File too large. Maximum size is 10MB', 400));
    }
    return next(new ErrorResponse(`Upload error: ${err.message}`, 400));
  } else if (err) {
    return next(err);
  }
  next();
};

// Specialized upload middleware for job attachments
const jobAttachments = (req, res, next) => {
  const uploadMiddleware = upload.array('attachments', 5);
  uploadMiddleware(req, res, (err) => {
    handleUploadError(err, req, res, next);
  });
};

// Specialized upload middleware for application documents
const applicationDocuments = (req, res, next) => {
  const uploadFields = [
    { name: 'resume', maxCount: 1 },
    { name: 'certificate', maxCount: 5 },
    { name: 'recommendation', maxCount: 3 },
    { name: 'identification', maxCount: 2 },
    { name: 'other', maxCount: 5 }
  ];
  
  const uploadMiddleware = upload.fields(uploadFields);
  uploadMiddleware(req, res, (err) => {
    handleUploadError(err, req, res, next);
  });
};

module.exports = {
  upload,
  handleUploadError,
  jobAttachments,
  applicationDocuments
};
