// This is for your Express backend app.js file, not the React frontend App.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const { handleUploadError } = require('./middleware/fileUpload');

// Import all route files
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes'); // Add this new import
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const jobRoutes = require('./routes/jobRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Handle file upload errors
app.use(handleUploadError);

// Static folder for serving uploaded files in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ThiQaX API' });
});

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes); // Add this new route
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/jobs', jobRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

module.exports = app;
