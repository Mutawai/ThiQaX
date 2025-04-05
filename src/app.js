// This is for your Express backend app.js file, not the React frontend App.js
// Add these imports to your existing imports

const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const path = require('path');

// Your existing middleware and configurations...

// Add this after your middleware setup but before routes
// Static folder for serving uploaded files in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// Add these with your existing route registrations
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Your existing error handling middleware...
