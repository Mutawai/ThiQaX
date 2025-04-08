/**
 * Utility functions for encryption, hashing, and cryptographic operations
 * in the ThiQaX platform.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

/**
 * Generate a secure random string of specified length
 * @param {number} length - Length of string to generate
 * @returns {string} Random string in hex format
 */
const generateRandomString = (length = 32) => {
  try {
    return crypto.randomBytes(length / 2).toString('hex');
  } catch (error) {
    logger.error('Error generating random string', { error });
    throw error;
  }
};

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @param {number} saltRounds - Number of salt rounds (default: 10)
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password, saltRounds = 10) => {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    logger.error('Error hashing password', { error });
    throw error;
  }
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches hash
 */
const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error comparing password', { error });
    throw error;
  }
};

/**
 * Encrypt data using AES-256-GCM
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key (uses env var if not provided)
 * @returns {Object} Object containing iv, encrypted data, and auth tag
 */
const encrypt = (data, key = process.env.ENCRYPTION_KEY) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: cipher.getAuthTag().toString('hex')
    };
  } catch (error) {
    logger.error('Error encrypting data', { error });
    throw error;
  }
};

/**
 * Decrypt data encrypted with AES-256-GCM
 * @param {Object} encryptedData - Object with iv, encrypted data, and auth tag
 * @param {string} key - Decryption key (uses env var if not provided)
 * @returns {string} Decrypted data
 */
const decrypt = (encryptedData, key = process.env.ENCRYPTION_KEY) => {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Error decrypting data', { error });
    throw error;
  }
};

/**
 * Generate a secure hash of data using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} Hash in hex format
 */
const hashData = (data) => {
  try {
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (error) {
    logger.error('Error hashing data', { error });
    throw error;
  }
};

module.exports = {
  generateRandomString,
  hashPassword,
  comparePassword,
  encrypt,
  decrypt,
  hashData
};
