// src/config/storage.js
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('./logger');
const { getEnvironment } = require('./environment');

// Initialize storage instance based on environment
const getStorageInstance = () => {
  const { isProduction, isStaging } = getEnvironment();
  
  // For production and staging, use GCP credentials
  if (isProduction || isStaging) {
    // Check for credentials file or environment variable
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return new Storage();
    }
    
    // Try to use credentials from environment variable
    if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
      try {
        const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
        return new Storage({ credentials });
      } catch (error) {
        logger.error('Failed to parse GCP credentials from environment', error);
        throw new Error('Invalid GCP credentials format');
      }
    }
    
    logger.error('No GCP credentials found for storage');
    throw new Error('Missing GCP credentials for storage');
  }
  
  // For development, use local emulator if available, otherwise use GCP
  if (process.env.STORAGE_EMULATOR_HOST) {
    logger.info(`Using storage emulator at ${process.env.STORAGE_EMULATOR_HOST}`);
    return new Storage({ apiEndpoint: process.env.STORAGE_EMULATOR_HOST, projectId: 'thiqax-development' });
  }
  
  // Fallback to local file storage for development
  logger.info('Using local file storage for development');
  return null;
};

// Get bucket name based on environment
const getBucketName = () => {
  return process.env.STORAGE_BUCKET || `thiqax-${getEnvironment().current}`;
};

// Get local storage directory for development
const getLocalStorageDir = () => {
  const localDir = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), 'uploads');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  
  return localDir;
};

// Generate a unique filename
const generateUniqueFilename = (originalFilename) => {
  const extension = path.extname(originalFilename);
  const uuid = uuidv4();
  return `${uuid}${extension}`;
};

// Upload file to appropriate storage
const uploadFile = async (fileBuffer, originalFilename, mimetype, directory = '') => {
  const uniqueFilename = generateUniqueFilename(originalFilename);
  const filePath = directory ? `${directory}/${uniqueFilename}` : uniqueFilename;
  
  const { isDevelopment } = getEnvironment();
  
  // Use local storage for development if no emulator
  if (isDevelopment && !process.env.STORAGE_EMULATOR_HOST) {
    return uploadToLocalStorage(fileBuffer, filePath);
  }
  
  // Otherwise use GCP storage
  return uploadToGCPStorage(fileBuffer, filePath, mimetype);
};

// Upload to GCP storage
const uploadToGCPStorage = async (fileBuffer, filePath, mimetype) => {
  try {
    const storage = getStorageInstance();
    const bucket = storage.bucket(getBucketName());
    const file = bucket.file(filePath);
    
    const options = {
      resumable: false,
      metadata: {
        contentType: mimetype
      }
    };
    
    await file.save(fileBuffer, options);
    
    const publicUrl = `https://storage.googleapis.com/${getBucketName()}/${filePath}`;
    
    logger.info(`File uploaded to GCP: ${filePath}`);
    
    return {
      filename: path.basename(filePath),
      path: filePath,
      url: publicUrl
    };
  } catch (error) {
    logger.error(`Failed to upload file to GCP: ${filePath}`, error);
    throw error;
  }
};

// Upload to local storage for development
const uploadToLocalStorage = async (fileBuffer, filePath) => {
  try {
    const localStorageDir = getLocalStorageDir();
    const fullPath = path.join(localStorageDir, filePath);
    
    // Create directory if it doesn't exist
    const directory = path.dirname(fullPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(fullPath, fileBuffer);
    
    // Generate local URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const publicUrl = `${baseUrl}/uploads/${filePath}`;
    
    logger.info(`File uploaded to local storage: ${filePath}`);
    
    return {
      filename: path.basename(filePath),
      path: filePath,
      url: publicUrl
    };
  } catch (error) {
    logger.error(`Failed to upload file to local storage: ${filePath}`, error);
    throw error;
  }
};

// Delete file from storage
const deleteFile = async (filePath) => {
  const { isDevelopment } = getEnvironment();
  
  // Use local storage for development if no emulator
  if (isDevelopment && !process.env.STORAGE_EMULATOR_HOST) {
    return deleteFromLocalStorage(filePath);
  }
  
  // Otherwise use GCP storage
  return deleteFromGCPStorage(filePath);
};

// Delete from GCP storage
const deleteFromGCPStorage = async (filePath) => {
  try {
    const storage = getStorageInstance();
    const bucket = storage.bucket(getBucketName());
    const file = bucket.file(filePath);
    
    await file.delete();
    
    logger.info(`File deleted from GCP: ${filePath}`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to delete file from GCP: ${filePath}`, error);
    throw error;
  }
};

// Delete from local storage
const deleteFromLocalStorage = async (filePath) => {
  try {
    const localStorageDir = getLocalStorageDir();
    const fullPath = path.join(localStorageDir, filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`File deleted from local storage: ${filePath}`);
      return true;
    }
    
    logger.warn(`File not found in local storage: ${filePath}`);
    return false;
  } catch (error) {
    logger.error(`Failed to delete file from local storage: ${filePath}`, error);
    throw error;
  }
};

module.exports = {
  getStorageInstance,
  getBucketName,
  uploadFile,
  deleteFile,
  generateUniqueFilename
};
