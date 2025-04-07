// src/controllers/documentation.js
const asyncHandler = require('../middleware/async');
const Documentation = require('../models/Documentation');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get all documentation items
 * @route   GET /api/v1/documentation
 * @access  Public
 */
exports.getAllDocumentation = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Get documentation by ID
 * @route   GET /api/v1/documentation/:id
 * @access  Public
 */
exports.getDocumentationById = asyncHandler(async (req, res, next) => {
  const doc = await Documentation.findById(req.params.id);

  if (!doc) {
    return next(
      new ErrorResponse(`Documentation not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: doc
  });
});

/**
 * @desc    Get user guides
 * @route   GET /api/v1/documentation/user-guides
 * @access  Public
 */
exports.getUserGuides = asyncHandler(async (req, res, next) => {
  const userGuides = await Documentation.find({ 
    type: 'userGuide',
    ...req.query.role ? { roles: req.query.role } : {}
  });

  res.status(200).json({
    success: true,
    count: userGuides.length,
    data: userGuides
  });
});

/**
 * @desc    Get help content
 * @route   GET /api/v1/documentation/help
 * @access  Public
 */
exports.getHelpContent = asyncHandler(async (req, res, next) => {
  const help = await Documentation.find({ 
    type: 'help',
    ...req.query.workflow ? { workflow: req.query.workflow } : {}
  });

  res.status(200).json({
    success: true,
    count: help.length,
    data: help
  });
});

/**
 * @desc    Get FAQ content
 * @route   GET /api/v1/documentation/faq
 * @access  Public
 */
exports.getFaqContent = asyncHandler(async (req, res, next) => {
  const faq = await Documentation.find({ 
    type: 'faq',
    ...req.query.category ? { category: req.query.category } : {}
  });

  res.status(200).json({
    success: true,
    count: faq.length,
    data: faq
  });
});

/**
 * @desc    Get tooltips
 * @route   GET /api/v1/documentation/tooltips
 * @access  Public
 */
exports.getTooltips = asyncHandler(async (req, res, next) => {
  const tooltips = await Documentation.find({ 
    type: 'tooltip',
    ...req.query.componentId ? { componentId: req.query.componentId } : {}
  });

  res.status(200).json({
    success: true,
    count: tooltips.length,
    data: tooltips
  });
});

/**
 * @desc    Create documentation item
 * @route   POST /api/v1/documentation
 * @access  Private/Admin
 */
exports.createDocumentation = asyncHandler(async (req, res, next) => {
  const doc = await Documentation.create(req.body);

  res.status(201).json({
    success: true,
    data: doc
  });
});

/**
 * @desc    Update documentation item
 * @route   PUT /api/v1/documentation/:id
 * @access  Private/Admin
 */
exports.updateDocumentation = asyncHandler(async (req, res, next) => {
  let doc = await Documentation.findById(req.params.id);

  if (!doc) {
    return next(
      new ErrorResponse(`Documentation not found with id of ${req.params.id}`, 404)
    );
  }

  doc = await Documentation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: doc
  });
});

/**
 * @desc    Delete documentation item
 * @route   DELETE /api/v1/documentation/:id
 * @access  Private/Admin
 */
exports.deleteDocumentation = asyncHandler(async (req, res, next) => {
  const doc = await Documentation.findById(req.params.id);

  if (!doc) {
    return next(
      new ErrorResponse(`Documentation not found with id of ${req.params.id}`, 404)
    );
  }

  await doc.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// src/models/Documentation.js
const mongoose = require('mongoose');

const DocumentationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['userGuide', 'help', 'faq', 'tooltip'],
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: function() {
      return this.type !== 'userGuide' || !this.steps || this.steps.length === 0;
    }
  },
  // Fields specific to user guides
  category: {
    type: String,
    required: function() {
      return this.type === 'userGuide' || this.type === 'faq';
    },
    trim: true
  },
  roles: {
    type: [String],
    enum: ['jobSeeker', 'agent', 'sponsor', 'admin'],
    required: function() {
      return this.type === 'userGuide';
    }
  },
  steps: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  // Fields specific to help content
  workflow: {
    type: String,
    required: function() {
      return this.type === 'help';
    },
    trim: true
  },
  // Fields specific to FAQ
  question: {
    type: String,
    required: function() {
      return this.type === 'faq';
    },
    trim: true
  },
  answer: {
    type: String,
    required: function() {
      return this.type === 'faq';
    }
  },
  // Fields specific to tooltips
  componentId: {
    type: String,
    required: function() {
      return this.type === 'tooltip';
    },
    trim: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
DocumentationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Documentation', DocumentationSchema);

// src/routes/documentation.js
const express = require('express');
const {
  getAllDocumentation,
  getDocumentationById,
  getUserGuides,
  getHelpContent,
  getFaqContent,
  getTooltips,
  createDocumentation,
  updateDocumentation,
  deleteDocumentation
} = require('../controllers/documentation');

const Documentation = require('../models/Documentation');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes for specific documentation types
router.get('/user-guides', getUserGuides);
router.get('/help', getHelpContent);
router.get('/faq', getFaqContent);
router.get('/tooltips', getTooltips);

// General routes with advanced results middleware
router
  .route('/')
  .get(advancedResults(Documentation), getAllDocumentation)
  .post(protect, authorize('admin'), createDocumentation);

router
  .route('/:id')
  .get(getDocumentationById)
  .put(protect, authorize('admin'), updateDocumentation)
  .delete(protect, authorize('admin'), deleteDocumentation);

module.exports = router;

// Add to app.js (after the other routes)
// app.use(`${apiPath}/documentation`, documentationRoutes);
