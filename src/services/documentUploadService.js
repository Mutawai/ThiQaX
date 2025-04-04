// File: src/services/documentUploadService.js

const fs = require('fs');
const path = require('path');
const util = require('util');
const multer = require('multer');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');

// Make fs.unlink return a promise instead of callback
const unlinkAsync = util.promisify(fs.unlink);

// Define storage settings for multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Set upload directory based on environment
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? process.env.UPLOAD_PATH || 'uploads/'
      : 'uploads/';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate a unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${randomName}${fileExt}`);
  }
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ErrorResponse(`File type not supported. Please upload JPG, PNG or PDF files only.`, 400), false);
  }
};

// Set up multer with limits and storage configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter
});

// Service for handling document uploads
const documentUploadService = {
  // Get multer middleware for single file upload
  uploadMiddleware: (fieldName = 'document') => {
    return upload.single(fieldName);
  },
  
  // Process the uploaded file and return file information
  processUpload: (req) => {
    if (!req.file) {
      throw new ErrorResponse('No file uploaded', 400);
    }
    
    // Get file information
    const fileInfo = {
      fileName: req.file.filename,
      originalFilename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      fileURL: req.file.path.replace(/\\/g, '/') // Normalize paths for Windows
    };
    
    return fileInfo;
  },
  
  // Delete a file
  deleteFile: async (filePath) => {
    try {
      await unlinkAsync(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting file at ${filePath}:`, error);
      return false;
    }
  },
  
  // Validate if document type is valid
  validateDocumentType: (type) => {
    const validTypes = [
      'passport', 'nationalID', 'driverLicense', 'birthCertificate',
      'diploma', 'degree', 'certificate', 'employmentLetter',
      'referenceLetter', 'workPermit', 'visa', 'businessLicense',
      'registrationCertificate', 'taxCertificate', 'other'
    ];
    
    return validTypes.includes(type);
  },
  
  // Validate document metadata
  validateDocumentMetadata: (metadata) => {
    // Basic validation of required fields based on document type
    const {type, issuingCountry, documentNumber} = metadata;
    
    const errorsMap = {};
    
    // Check required fields based on document type
    if (['passport', 'nationalID', 'driverLicense', 'visa', 'workPermit'].includes(type)) {
      if (!documentNumber) errorsMap.documentNumber = 'Document number is required';
      if (!issuingCountry) errorsMap.issuingCountry = 'Issuing country is required';
    }
    
    // Check date validations
    if (metadata.issueDate && metadata.expiryDate) {
      const issueDate = new Date(metadata.issueDate);
      const expiryDate = new Date(metadata.expiryDate);
      
      if (issueDate > expiryDate) {
        errorsMap.dates = 'Issue date cannot be after expiry date';
      }
      
      if (expiryDate < new Date()) {
        errorsMap.expiry = 'Document is already expired';
      }
    }
    
    return {
      isValid: Object.keys(errorsMap).length === 0,
      errors: errorsMap
    };
  },
  
  // Generate document file URL
  generateFileURL: (fileName) => {
    // In production, this might point to a CDN or cloud storage URL
    if (process.env.NODE_ENV === 'production' && process.env.DOCUMENT_BASE_URL) {
      return `${process.env.DOCUMENT_BASE_URL}/${fileName}`;
    }
    
    // For development, use the local path
    return `/uploads/${fileName}`;
  }
};

module.exports = documentUploadService;
