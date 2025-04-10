/**
 * Models index module
 * Centralizes model exports and manages model initialization
 */

// Import models
const User = require('../../models/User');
const Document = require('./Document');
const Job = require('./Job');
const Application = require('./Application');
const Payment = require('./Payment');
const Notification = require('./Notification');

/**
 * Initialize model references when needed
 * This helps prevent circular references between models
 */
const initializeModels = () => {
  // No manual initialization needed currently as Mongoose handles this
  console.log('Database models initialized');
};

// Export models
module.exports = {
  User,
  Document,
  Job,
  Application,
  Payment,
  Notification,
  initializeModels
};
