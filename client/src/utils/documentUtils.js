// src/utils/documentUtils.js

/**
 * Utility functions for document processing and validation
 * Used by SmartUploadFlow and other document components
 */

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Validate document file against requirements
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateDocument = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    minSize = 1024 // 1KB minimum
  } = options;

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`);
  }

  if (file.size < minSize) {
    errors.push(`File size (${formatFileSize(file.size)}) is too small. Minimum size is ${formatFileSize(minSize)}`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file name
  if (!file.name || file.name.length > 255) {
    errors.push('Invalid file name');
  }

  // Check for suspicious file extensions
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.vbs', '.js'];
  const fileName = file.name.toLowerCase();
  if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
    errors.push('File type not allowed for security reasons');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * AI-powered document type detection (simulated)
 * In production, this would call an actual AI service
 * @param {File} file - File to analyze
 * @returns {Promise<Object>} Detection result
 */
export const detectDocumentType = async (file) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  const fileName = file.name.toLowerCase();
  
  // Simple keyword-based detection (in production, use actual AI/ML)
  const detectionRules = [
    {
      keywords: ['passport', 'id', 'identity', 'license', 'driver'],
      type: 'identity',
      confidence: 0.9
    },
    {
      keywords: ['degree', 'diploma', 'certificate', 'transcript', 'education', 'university', 'college'],
      type: 'education',
      confidence: 0.85
    },
    {
      keywords: ['medical', 'health', 'doctor', 'hospital', 'clinic', 'vaccination', 'vaccine'],
      type: 'medical',
      confidence: 0.8
    },
    {
      keywords: ['bank', 'statement', 'utility', 'bill', 'invoice', 'address', 'proof'],
      type: 'address',
      confidence: 0.75
    },
    {
      keywords: ['employment', 'work', 'job', 'salary', 'contract', 'cv', 'resume'],
      type: 'employment',
      confidence: 0.7
    },
    {
      keywords: ['professional', 'certification', 'license', 'qualification'],
      type: 'professional',
      confidence: 0.8
    },
    {
      keywords: ['financial', 'income', 'tax', 'payslip', 'earning'],
      type: 'financial',
      confidence: 0.75
    }
  ];

  // Find best match
  let bestMatch = { type: 'other', confidence: 0.3 };
  
  for (const rule of detectionRules) {
    const matches = rule.keywords.filter(keyword => fileName.includes(keyword));
    if (matches.length > 0) {
      const confidence = rule.confidence * (matches.length / rule.keywords.length);
      if (confidence > bestMatch.confidence) {
        bestMatch = { type: rule.type, confidence };
      }
    }
  }

  // Generate suggested name
  const suggestedName = generateSuggestedName(file, bestMatch.type);

  return {
    type: bestMatch.type,
    confidence: bestMatch.confidence,
    suggestedName,
    detectedAt: new Date().toISOString()
  };
};

/**
 * Generate a suggested document name based on type and file
 * @param {File} file - Original file
 * @param {string} type - Detected document type
 * @returns {string} Suggested name
 */
const generateSuggestedName = (file, type) => {
  const typeNames = {
    identity: 'Identity Document',
    education: 'Educational Certificate',
    medical: 'Medical Certificate',
    address: 'Proof of Address',
    employment: 'Employment Document',
    professional: 'Professional Certificate',
    financial: 'Financial Document',
    other: 'Document'
  };

  const baseName = typeNames[type] || 'Document';
  const timestamp = new Date().toLocaleDateString();
  
  return `${baseName} - ${timestamp}`;
};

/**
 * Extract text from image using OCR (simulated)
 * In production, use actual OCR service like Tesseract.js or cloud OCR
 * @param {File} file - Image file
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromImage = async (file) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('OCR only works with image files');
  }

  // Simulate OCR processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return simulated extracted text
  return `[Simulated OCR Text from ${file.name}]
  This is sample text that would be extracted from the document.
  In production, this would contain actual text from the image.`;
};

/**
 * Check if document appears to be expired based on content analysis
 * @param {string} extractedText - Text extracted from document
 * @returns {Object} Expiry analysis
 */
export const analyzeDocumentExpiry = (extractedText) => {
  const text = extractedText.toLowerCase();
  
  // Look for date patterns
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/gi
  ];

  const expiryKeywords = ['expiry', 'expires', 'valid until', 'valid till', 'expiration'];
  const issuedKeywords = ['issued', 'date of issue', 'issued on'];

  let hasExpiryDate = false;
  let hasIssueDate = false;

  // Check for expiry keywords
  expiryKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      hasExpiryDate = true;
    }
  });

  // Check for issue keywords
  issuedKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      hasIssueDate = true;
    }
  });

  return {
    hasExpiryDate,
    hasIssueDate,
    confidence: (hasExpiryDate || hasIssueDate) ? 0.8 : 0.2,
    analysis: hasExpiryDate ? 'Document appears to have an expiry date' : 
             hasIssueDate ? 'Document appears to have an issue date' : 
             'No clear date information detected'
  };
};

/**
 * Get document quality score based on file properties
 * @param {File} file - File to analyze
 * @returns {Object} Quality assessment
 */
export const assessDocumentQuality = (file) => {
  let score = 100;
  const issues = [];
  const recommendations = [];

  // File size assessment
  if (file.size < 100 * 1024) { // Less than 100KB
    score -= 20;
    issues.push('File size is very small, image may be low quality');
    recommendations.push('Use a higher resolution when scanning or photographing');
  } else if (file.size > 8 * 1024 * 1024) { // Greater than 8MB
    score -= 10;
    issues.push('File size is very large');
    recommendations.push('Consider compressing the image to reduce file size');
  }

  // File type assessment
  if (file.type === 'application/pdf') {
    score += 10; // PDFs are generally preferred
  } else if (file.type === 'image/png') {
    score += 5; // PNG is good for documents
  } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    // JPEG is okay but not ideal for text
  } else {
    score -= 15;
    issues.push('File type may not be optimal for document storage');
    recommendations.push('Consider using PDF or PNG format for better quality');
  }

  // File name assessment
  if (file.name.length < 5) {
    score -= 5;
    issues.push('File name is very short');
    recommendations.push('Use a descriptive file name');
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  let quality = 'Excellent';
  if (score < 60) quality = 'Poor';
  else if (score < 75) quality = 'Fair';
  else if (score < 90) quality = 'Good';

  return {
    score,
    quality,
    issues,
    recommendations,
    passesBasicQuality: score >= 60
  };
};

/**
 * Generate security hash for document (for integrity checking)
 * @param {File} file - File to hash
 * @returns {Promise<string>} SHA-256 hash
 */
export const generateDocumentHash = async (file) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Check if file might be corrupted
 * @param {File} file - File to check
 * @returns {Promise<Object>} Corruption check result
 */
export const checkFileIntegrity = async (file) => {
  try {
    // For images, try to create an image element to verify
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve({
            isValid: true,
            hasIntegrity: true,
            message: 'Image file appears to be valid'
          });
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({
            isValid: false,
            hasIntegrity: false,
            message: 'Image file appears to be corrupted or invalid'
          });
        };
        
        img.src = url;
        
        // Timeout after 5 seconds
        setTimeout(() => {
          URL.revokeObjectURL(url);
          resolve({
            isValid: false,
            hasIntegrity: false,
            message: 'Image validation timed out'
          });
        }, 5000);
      });
    }
    
    // For PDFs, check basic file structure
    if (file.type === 'application/pdf') {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // Check PDF header
      const pdfHeader = String.fromCharCode.apply(null, uint8Array.slice(0, 4));
      if (pdfHeader !== '%PDF') {
        return {
          isValid: false,
          hasIntegrity: false,
          message: 'PDF file header is invalid'
        };
      }
      
      return {
        isValid: true,
        hasIntegrity: true,
        message: 'PDF file appears to be valid'
      };
    }
    
    // For other files, basic checks
    return {
      isValid: true,
      hasIntegrity: true,
      message: 'File appears to be valid'
    };
    
  } catch (error) {
    return {
      isValid: false,
      hasIntegrity: false,
      message: `File integrity check failed: ${error.message}`
    };
  }
};

/**
 * Get recommended document types for a user based on their profile
 * @param {Object} userProfile - User profile data
 * @returns {Array} Recommended document types
 */
export const getRecommendedDocumentTypes = (userProfile) => {
  const recommendations = [];
  
  if (!userProfile) return recommendations;
  
  // Basic identity documents for all users
  recommendations.push({
    type: 'identity',
    priority: 'high',
    reason: 'Required for identity verification'
  });
  
  // Address proof for all users
  recommendations.push({
    type: 'address',
    priority: 'high',
    reason: 'Required for address verification'
  });
  
  // Education based on user role or preferences
  if (userProfile.role === 'jobSeeker' || userProfile.seekingEducationVerification) {
    recommendations.push({
      type: 'education',
      priority: 'medium',
      reason: 'Helps verify educational qualifications'
    });
  }
  
  // Professional certifications for certain roles
  if (userProfile.professionalField) {
    recommendations.push({
      type: 'professional',
      priority: 'medium',
      reason: 'Validates professional expertise'
    });
  }
  
  // Medical certificates for healthcare or travel
  if (userProfile.industry === 'healthcare' || userProfile.travelDocuments) {
    recommendations.push({
      type: 'medical',
      priority: 'low',
      reason: 'May be required for certain positions'
    });
  }
  
  return recommendations;
};

/**
 * Default export object with all utility functions
 */
export default {
  formatFileSize,
  validateDocument,
  detectDocumentType,
  extractTextFromImage,
  analyzeDocumentExpiry,
  assessDocumentQuality,
  generateDocumentHash,
  checkFileIntegrity,
  getRecommendedDocumentTypes
};