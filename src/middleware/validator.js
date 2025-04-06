const { validationResult } = require('express-validator');
const { ErrorResponse } = require('./errorHandler');
const { createLogger } = require('../utils/logger');

const logger = createLogger('validator');

/**
 * Validate request body using express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const messages = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    
    logger.debug(`Validation errors: ${JSON.stringify(messages)}`);
    
    return next(new ErrorResponse('Validation failed', 400, messages));
  }
  
  next();
};

/**
 * Validate MongoDB ObjectId
 * @param {String} idParam - Name of the id parameter to validate
 */
exports.validateObjectId = (idParam = 'id') => {
  return (req, res, next) => {
    const id = req.params[idParam];
    
    // Regular expression to test for a valid MongoDB ObjectId
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdPattern.test(id)) {
      logger.debug(`Invalid ObjectId: ${id}`);
      return next(new ErrorResponse(`Invalid ${idParam} format`, 400));
    }
    
    next();
  };
};

/**
 * Sanitize and validate query parameters for pagination
 */
exports.validatePagination = (req, res, next) => {
  // Default pagination values
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 10;
  const MAX_LIMIT = 100;
  
  // Get pagination parameters
  let page = parseInt(req.query.page, 10) || DEFAULT_PAGE;
  let limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
  
  // Ensure page is at least 1
  if (page < 1) {
    page = DEFAULT_PAGE;
  }
  
  // Ensure limit is between 1 and MAX_LIMIT
  if (limit < 1 || limit > MAX_LIMIT) {
    limit = Math.min(Math.max(1, limit), MAX_LIMIT);
  }
  
  // Add pagination parameters to request for controllers to use
  req.pagination = {
    page,
    limit,
    startIndex: (page - 1) * limit
  };
  
  next();
};

/**
 * Sanitize and validate sorting parameters
 * @param {Array} allowedFields - Array of fields allowed for sorting
 */
exports.validateSorting = (allowedFields) => {
  return (req, res, next) => {
    // Default sorting
    let sort = {};
    
    if (req.query.sort) {
      const sortFields = req.query.sort.split(',');
      
      sortFields.forEach(field => {
        // Check if field starts with '-' for descending order
        const isDesc = field.startsWith('-');
        const fieldName = isDesc ? field.substring(1) : field;
        
        // Validate field is allowed
        if (allowedFields.includes(fieldName)) {
          sort[fieldName] = isDesc ? -1 : 1;
        }
      });
    }
    
    // Add sorting parameters to request for controllers to use
    req.sorting = Object.keys(sort).length > 0 ? sort : undefined;
    
    next();
  };
};

/**
 * Sanitize and validate filtering parameters
 * @param {Array} allowedFields - Array of fields allowed for filtering
 */
exports.validateFiltering = (allowedFields) => {
  return (req, res, next) => {
    const filter = {};
    
    // Process all query parameters for filtering
    Object.keys(req.query).forEach(key => {
      // Skip pagination, sorting, and other special parameters
      if (['page', 'limit', 'sort', 'fields'].includes(key)) {
        return;
      }
      
      // Check if the field is allowed for filtering
      if (allowedFields.includes(key)) {
        filter[key] = req.query[key];
      }
    });
    
    // Add filtering parameters to request for controllers to use
    req.filtering = Object.keys(filter).length > 0 ? filter : undefined;
    
    next();
  };
};
