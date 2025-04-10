/**
 * Models index module
 * Centralizes model exports and references to src/models
 */

// Import models from src/models
const User = require('../../models/User');
const Document = require('../../models/Document');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const Notification = require('../../models/Notification');
const Profile = require('../../models/Profile');
const Payment = require('../../models/Payment');

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
  Profile,
  initializeModels
};
