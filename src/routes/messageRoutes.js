// src/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

// Validation schemas
const createConversationSchema = {
  recipient: {
    in: ['body'],
    isMongoId: {
      errorMessage: 'Invalid recipient ID'
    }
  },
  initialMessage: {
    in: ['body'],
    isString: {
      errorMessage: 'Initial message must be a string'
    },
    trim: true,
    notEmpty: {
      errorMessage: 'Initial message is required'
    },
    isLength: {
      options: { min: 1, max: 2000 },
      errorMessage: 'Message must be between 1 and 2000 characters'
    }
  },
  subject: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'Subject must be a string'
    },
    trim: true,
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: 'Subject must be between 1 and 100 characters'
    }
  },
  jobId: {
    in: ['body'],
    optional: true,
    isMongoId: {
      errorMessage: 'Invalid job ID'
    }
  },
  applicationId: {
    in: ['body'],
    optional: true,
    isMongoId: {
      errorMessage: 'Invalid application ID'
    }
  }
};

const sendMessageSchema = {
  content: {
    in: ['body'],
    isString: {
      errorMessage: 'Message content must be a string'
    },
    trim: true,
    notEmpty: {
      errorMessage: 'Message content is required'
    },
    isLength: {
      options: { min: 1, max: 2000 },
      errorMessage: 'Message must be between 1 and 2000 characters'
    }
  },
  attachments: {
    in: ['body'],
    optional: true,
    isArray: {
      errorMessage: 'Attachments must be an array'
    }
  },
  'attachments.*.fileId': {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'File ID must be a string'
    }
  },
  'attachments.*.fileName': {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'File name must be a string'
    }
  },
  'attachments.*.fileType': {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'File type must be a string'
    }
  },
  'attachments.*.fileSize': {
    in: ['body'],
    optional: true,
    isInt: {
      errorMessage: 'File size must be an integer'
    }
  }
};

/**
 * @swagger
 * /api/v1/messages/conversations:
 *   get:
 *     summary: Get all conversations for the current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of conversations per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter to show only unread conversations
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get(
  '/conversations',
  protect,
  messageController.getConversations
);

/**
 * @swagger
 * /api/v1/messages/conversations/{conversationId}:
 *   get:
 *     summary: Get a specific conversation by ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the conversation
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *       404:
 *         description: Conversation not found
 */
router.get(
  '/conversations/:conversationId',
  protect,
  messageController.getConversationById
);

/**
 * @swagger
 * /api/v1/messages/conversations:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient
 *               - initialMessage
 *             properties:
 *               recipient:
 *                 type: string
 *                 description: ID of the message recipient
 *               initialMessage:
 *                 type: string
 *                 description: First message content
 *               subject:
 *                 type: string
 *                 description: Conversation subject
 *               jobId:
 *                 type: string
 *                 description: Optional related job ID
 *               applicationId:
 *                 type: string
 *                 description: Optional related application ID
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/conversations',
  protect,
  validateRequest(createConversationSchema),
  messageController.createConversation
);

/**
 * @swagger
 * /api/v1/messages/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages from a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the conversation
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages per page
 *       - in: query
 *         name: lastMessageId
 *         schema:
 *           type: string
 *         description: Optional ID of last seen message for pagination
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       404:
 *         description: Conversation not found
 */
router.get(
  '/conversations/:conversationId/messages',
  protect,
  messageController.getMessages
);

/**
 * @swagger
 * /api/v1/messages/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fileId:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     fileType:
 *                       type: string
 *                     fileSize:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Conversation not found
 */
router.post(
  '/conversations/:conversationId/messages',
  protect,
  validateRequest(sendMessageSchema),
  messageController.sendMessage
);

/**
 * @swagger
 * /api/v1/messages/conversations/{conversationId}/read:
 *   put:
 *     summary: Mark a conversation as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the conversation
 *     responses:
 *       200:
 *         description: Conversation marked as read
 *       404:
 *         description: Conversation not found
 */
router.put(
  '/conversations/:conversationId/read',
  protect,
  messageController.markConversationAsRead
);

/**
 * @swagger
 * /api/v1/messages/unread-count:
 *   get:
 *     summary: Get count of unread conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get(
  '/unread-count',
  protect,
  messageController.getUnreadCount
);

/**
 * @swagger
 * /api/v1/messages/file-upload:
 *   post:
 *     summary: Get a presigned URL for file upload
 *     tags: [Messages]
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
  '/file-upload',
  protect,
  messageController.getFileUploadUrl
);

/**
 * @swagger
 * /api/v1/messages/conversations/{conversationId}:
 *   delete:
 *     summary: Delete a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the conversation
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *       404:
 *         description: Conversation not found
 */
router.delete(
  '/conversations/:conversationId',
  protect,
  messageController.deleteConversation
);

/**
 * @swagger
 * /api/v1/messages/templates:
 *   get:
 *     summary: Get message templates
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Template category
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 */
router.get(
  '/templates',
  protect,
  messageController.getMessageTemplates
);

/**
 * @swagger
 * /api/v1/messages/job-related/{jobId}:
 *   get:
 *     summary: Get conversations related to a specific job
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *       404:
 *         description: Job not found
 */
router.get(
  '/job-related/:jobId',
  protect,
  authorize('agent', 'sponsor', 'admin'),
  messageController.getJobRelatedConversations
);

/**
 * @swagger
 * /api/v1/messages/application-related/{applicationId}:
 *   get:
 *     summary: Get conversations related to a specific application
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the application
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *       404:
 *         description: Application not found
 */
router.get(
  '/application-related/:applicationId',
  protect,
  messageController.getApplicationRelatedConversations
);

module.exports = router;
