// src/routes/kycRoutes.js
const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

// Validation schemas
const verificationSubmissionSchema = {
  documentType: {
    in: ['body'],
    isIn: {
      options: [['IDENTITY', 'ADDRESS', 'QUALIFICATION', 'CERTIFICATE']],
      errorMessage: 'Invalid document type'
    }
  },
  documentNumber: {
    in: ['body'],
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Document number is required'
    }
  },
  expiryDate: {
    in: ['body'],
    optional: { options: { nullable: true } },
    isISO8601: {
      errorMessage: 'Expiry date must be a valid date in ISO format'
    }
  },
  documentFile: {
    in: ['body'],
    isObject: true,
    errorMessage: 'Document file is required'
  },
  'documentFile.fileId': {
    in: ['body'],
    isString: true,
    notEmpty: {
      errorMessage: 'File ID is required'
    }
  }
};

const bioDataSchema = {
  fullName: {
    in: ['body'],
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Full name is required'
    }
  },
  dateOfBirth: {
    in: ['body'],
    isISO8601: {
      errorMessage: 'Date of birth must be a valid date in ISO format'
    }
  },
  nationality: {
    in: ['body'],
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: 'Nationality is required'
    }
  },
  gender: {
    in: ['body'],
    isIn: {
      options: [['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']],
      errorMessage: 'Invalid gender value'
    }
  }
};

/**
 * @swagger
 * /api/v1/kyc/requirements:
 *   get:
 *     summary: Get KYC requirements based on user role
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC requirements retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get(
  '/requirements',
  protect,
  kycController.getRequirements
);

/**
 * @swagger
 * /api/v1/kyc/status:
 *   get:
 *     summary: Get current user's KYC verification status
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC status retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get(
  '/status',
  protect,
  kycController.getVerificationStatus
);

/**
 * @swagger
 * /api/v1/kyc/documents:
 *   get:
 *     summary: Get all KYC documents for current user
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get(
  '/documents',
  protect,
  kycController.getUserDocuments
);

/**
 * @swagger
 * /api/v1/kyc/documents/{documentId}:
 *   get:
 *     summary: Get specific KYC document details
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the document
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *       404:
 *         description: Document not found
 */
router.get(
  '/documents/:documentId',
  protect,
  kycController.getDocumentById
);

/**
 * @swagger
 * /api/v1/kyc/documents/{type}:
 *   post:
 *     summary: Upload a new KYC document
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [IDENTITY, ADDRESS, QUALIFICATION, CERTIFICATE]
 *         description: Type of document
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentNumber
 *               - documentFile
 *             properties:
 *               documentNumber:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               documentFile:
 *                 type: object
 *                 properties:
 *                   fileId:
 *                     type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/documents/:type',
  protect,
  validateRequest(verificationSubmissionSchema),
  kycController.uploadDocument
);

/**
 * @swagger
 * /api/v1/kyc/documents/{documentId}:
 *   put:
 *     summary: Update an existing KYC document
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the document
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentNumber:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               documentFile:
 *                 type: object
 *                 properties:
 *                   fileId:
 *                     type: string
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Document not found
 */
router.put(
  '/documents/:documentId',
  protect,
  kycController.updateDocument
);

/**
 * @swagger
 * /api/v1/kyc/biodata:
 *   put:
 *     summary: Update user's bio data for KYC
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - dateOfBirth
 *               - nationality
 *               - gender
 *             properties:
 *               fullName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               nationality:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *     responses:
 *       200:
 *         description: Bio data updated successfully
 *       400:
 *         description: Validation error
 */
router.put(
  '/biodata',
  protect,
  validateRequest(bioDataSchema),
  kycController.updateBioData
);

/**
 * @swagger
 * /api/v1/kyc/submit:
 *   post:
 *     summary: Submit KYC verification for review
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification submitted successfully
 *       400:
 *         description: Missing required documents or information
 *       401:
 *         description: Not authorized
 */
router.post(
  '/submit',
  protect,
  kycController.submitVerification
);

/**
 * @swagger
 * /api/v1/kyc/documents/presigned-url:
 *   post:
 *     summary: Get a presigned URL for document upload
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *             properties:
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *       400:
 *         description: Invalid file type
 */
router.post(
  '/documents/presigned-url',
  protect,
  kycController.getDocumentUploadUrl
);

/**
 * @swagger
 * /api/v1/kyc/verify-phone:
 *   post:
 *     summary: Initiate phone verification for KYC
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       400:
 *         description: Invalid phone number
 */
router.post(
  '/verify-phone',
  protect,
  kycController.initiatePhoneVerification
);

/**
 * @swagger
 * /api/v1/kyc/verify-phone/confirm:
 *   post:
 *     summary: Confirm phone verification code
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - verificationCode
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               verificationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone verified successfully
 *       400:
 *         description: Invalid or expired verification code
 */
router.post(
  '/verify-phone/confirm',
  protect,
  kycController.confirmPhoneVerification
);

module.exports = router;
