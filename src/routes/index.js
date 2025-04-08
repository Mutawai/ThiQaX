// src/routes/index.js
const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const documentRoutes = require('./documentRoutes');
const jobRoutes = require('./jobRoutes');
const profileRoutes = require('./profileRoutes');
const notificationRoutes = require('./notificationRoutes');
const applicationRoutes = require('./applicationRoutes');
const integrationRoutes = require('./integrationRoutes');
const adminRoutes = require('./adminRoutes');
const kycRoutes = require('./kycRoutes');
const searchRoutes = require('./searchRoutes');
const messageRoutes = require('./messageRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/documents', documentRoutes);
router.use('/jobs', jobRoutes);
router.use('/profiles', profileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/applications', applicationRoutes);
router.use('/integrations', integrationRoutes);
router.use('/admin', adminRoutes);
router.use('/kyc', kycRoutes);
router.use('/search', searchRoutes);
router.use('/messages', messageRoutes);

module.exports = router;
