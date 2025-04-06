// src/middleware/validator.js
const { checkSchema, validationResult } = require('express-validator');

/**
 * Middleware to validate requests using express-validator
 * @param {Object} schema - Validation schema for express-validator
 */
exports.validateRequest = (schema) => {
  return [
    checkSchema(schema),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      next();
    }
  ];
};
