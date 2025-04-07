// src/tests/integration/notification.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const { generateToken } = require('../utils/auth-helper');

let user;
let adminUser;
let notifications = [];
let userToken;
let adminToken;

// Setup test data before running tests
beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  // Create test users
  user = await User.create({
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@example.com',
    password: 'password123',
    role: 'jobSeeker'
  });
  
  adminUser = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  });
  
  // Create tokens
  userToken = generateToken(user);
  adminToken = generateToken(adminUser);
  
  // Create test notifications
  const notificationData = [
    {
      recipient: user._id,
      type: 'DOCUMENT_VERIFIED',
      title: 'Document Verified',
      message: 'Your identity document has been verified',
      data: { documentId: new mongoose.Types.ObjectId() },
      read: false
    },
    {
      recipient: user._id,
      type: 'APPLICATION_STATUS',
      title: 'Application Update',
      message: 'Your application has been reviewed',
      data: { applicationId: new mongoose.Types.ObjectId() },
      read: true
    },
    {
      recipient: user._id,
      type: 'SYSTEM',
      title: 'Welcome to ThiQaX',
      message: 'Thank you for joining our platform',
      data: {},
      read: false
    }
  ];
  
  notifications = await Notification.insertMany(notificationData);
});

// Clean up after tests
afterAll(async () => {
  // Clean up test data
  await User.deleteMany({});
  await Notification.deleteMany({});
  
  // Disconnect from test database
  await mongoose.connection.close();
});

describe('Notification API', () => {
  test('GET /api/v1/notifications - Get user notifications', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(3);
    expect(res.body.data.unreadCount).toBe(2);
  });
  
  test('GET /api/v1/notifications/count - Get unread count', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/count')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unreadCount).toBe(2);
  });
  
  test('PUT /api/v1/notifications/:id/mark-read - Mark notification as read', async () => {
    // Get first unread notification
    const unreadNotification = notifications.find(n => !n.read);
    
    const res = await request(app)
      .put(`/api/v1/notifications/${unreadNotification._id}/mark-read`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.read).toBe(true);
    
    // Verify count updated
    const countRes = await request(app)
      .get('/api/v1/notifications/count')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(countRes.body.data.unreadCount).toBe(1);
  });
  
  test('PUT /api/v1/notifications/mark-read-all - Mark all notifications as read', async () => {
    const res = await request(app)
      .put('/api/v1/notifications/mark-read-all')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Verify all are marked as read
    const countRes = await request(app)
      .get('/api/v1/notifications/count')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(countRes.body.data.unreadCount).toBe(0);
  });
  
  test('DELETE /api/v1/notifications/:id - Delete notification', async () => {
    const notification = notifications[0];
    
    const res = await request(app)
      .delete(`/api/v1/notifications/${notification._id}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Verify notification is deleted
    const getRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(getRes.body.data.items.length).toBe(2);
  });
  
  test('DELETE /api/v1/notifications - Clear all notifications', async () => {
    const res = await request(app)
      .delete('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Verify all notifications are deleted
    const getRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(getRes.body.data.items.length).toBe(0);
  });
  
  test('GET /api/v1/notifications - Cannot access other user\'s notifications', async () => {
    // Create a notification for admin
    await Notification.create({
      recipient: adminUser._id,
      type: 'SYSTEM',
      title: 'Admin Notification',
      message: 'This is for admin only',
      data: {},
      read: false
    });
    
    // Try to access admin's notification as regular user
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.items.length).toBe(0); // Should not see admin's notification
  });
});

// src/tests/integration/document-verification.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const app = require('../../app');
const User = require('../../models/User');
const Document = require('../../models/Document');
const { generateToken } = require('../utils/auth-helper');

let user;
let adminUser;
let userToken;
let adminToken;
let document;

// Setup test data before running tests
beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  // Create test users
  user = await User.create({
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@example.com',
    password: 'password123',
    role: 'jobSeeker'
  });
  
  adminUser = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  });
  
  // Create tokens
  userToken = generateToken(user);
  adminToken = generateToken(adminUser);
  
  // Create test document
  document = await Document.create({
    user: user._id,
    documentType: 'IDENTITY',
    description: 'National ID',
    filename: 'test-document.jpg',
    originalname: 'national-id.jpg',
    mimetype: 'image/jpeg',
    size: 12345,
    url: '/uploads/test-document.jpg',
    status: 'PENDING',
    uploadedAt: new Date()
  });
});

// Clean up after tests
afterAll(async () => {
  // Clean up test data
  await User.deleteMany({});
  await Document.deleteMany({});
  
  // Disconnect from test database
  await mongoose.connection.close();
});

describe('Document Verification API', () => {
  test('GET /api/v1/documents - User can view their documents', async () => {
    const res = await request(app)
      .get('/api/v1/documents')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].documentType).toBe('IDENTITY');
  });
  
  test('GET /api/v1/documents/verification-queue - Admin can view verification queue', async () => {
    const res = await request(app)
      .get('/api/v1/documents/verification-queue')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });
  
  test('GET /api/v1/documents/verification-stats - Admin can view verification stats', async () => {
    const res = await request(app)
      .get('/api/v1/documents/verification-stats')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalDocuments).toBe(1);
    expect(res.body.data.pendingDocuments).toBe(1);
    expect(res.body.data.verifiedDocuments).toBe(0);
  });
  
  test('PUT /api/v1/documents/:id/verify - Admin can verify a document', async () => {
    const res = await request(app)
      .put(`/api/v1/documents/${document._id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Document looks valid' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('VERIFIED');
    expect(res.body.data.verifiedBy.toString()).toBe(adminUser._id.toString());
    expect(res.body.data.verificationNotes).toBe('Document looks valid');
  });
  
  test('PUT /api/v1/documents/:id/reject - Admin can reject a document', async () => {
    // Create another document for rejection
    const rejectDoc = await Document.create({
      user: user._id,
      documentType: 'ADDRESS_PROOF',
      description: 'Utility Bill',
      filename: 'test-document2.jpg',
      originalname: 'utility-bill.jpg',
      mimetype: 'image/jpeg',
      size: 12345,
      url: '/uploads/test-document2.jpg',
      status: 'PENDING',
      uploadedAt: new Date()
    });
    
    const res = await request(app)
      .put(`/api/v1/documents/${rejectDoc._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        rejectionReason: 'DOCUMENT_UNCLEAR',
        notes: 'The document is too blurry to read' 
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('REJECTED');
    expect(res.body.data.rejectedBy.toString()).toBe(adminUser._id.toString());
    expect(res.body.data.rejectionReason).toBe('DOCUMENT_UNCLEAR');
    expect(res.body.data.verificationNotes).toBe('The document is too blurry to read');
  });
  
  test('POST /api/v1/documents - User can upload a document', async () => {
    // Create a test file
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
    
    const res = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${userToken}`)
      .field('documentType', 'EDUCATIONAL')
      .field('description', 'University Degree')
      .attach('file', testImagePath);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.documentType).toBe('EDUCATIONAL');
    expect(res.body.data.description).toBe('University Degree');
    expect(res.body.data.status).toBe('PENDING');
  });
  
  test('Regular user cannot access verification endpoints', async () => {
    // Try to verify a document as regular user
    const res = await request(app)
      .put(`/api/v1/documents/${document._id}/verify`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ notes: 'Document looks valid' });
    
    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// src/tests/integration/job-application.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const Document = require('../../models/Document');
const { generateToken } = require('../utils/auth-helper');

let jobSeeker;
let agent;
let sponsor;
let jobSeekerToken;
let agentToken;
let sponsorToken;
let job;
let document;
let application;

// Setup test data before running tests
beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  // Create test users
  jobSeeker = await User.create({
    firstName: 'Job',
    lastName: 'Seeker',
    email: 'jobseeker@example.com',
    password: 'password123',
    role: 'jobSeeker',
    kycVerified: true
  });
  
  agent = await User.create({
    firstName: 'Agent',
    lastName: 'User',
    email: 'agent@example.com',
    password: 'password123',
    role: 'agent'
  });
  
  sponsor = await User.create({
    firstName: 'Sponsor',
    lastName: 'User',
    email: 'sponsor@example.com',
    password: 'password123',
    role: 'sponsor'
  });
  
  // Create tokens
  jobSeekerToken = generateToken(jobSeeker);
  agentToken = generateToken(agent);
  sponsorToken = generateToken(sponsor);
  
  // Create test job
  job = await Job.create({
    title: 'Software Developer',
    description: 'Exciting opportunity for a developer',
    responsibilities: ['Develop web applications', 'Fix bugs'],
    qualifications: ['JavaScript experience', 'React knowledge'],
    company: new mongoose.Types.ObjectId(),
    employer: sponsor._id,
    createdBy: agent._id,
    location: 'Nairobi, Kenya',
    jobType: 'FULL_TIME',
    salaryMin: 1500,
    salaryMax: 3000,
    experience: '2+ years',
    vacancies: 1,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    requiredDocuments: ['IDENTITY', 'EDUCATIONAL'],
    tags: ['javascript', 'react'],
    status: 'PUBLISHED',
    featured: true,
    verified: true
  });
  
  // Create verified document for job seeker
  document = await Document.create({
    user: jobSeeker._id,
    documentType: 'IDENTITY',
    description: 'National ID',
    filename: 'test-document.jpg',
    originalname: 'national-id.jpg',
    mimetype: 'image/jpeg',
    size: 12345,
    url: '/uploads/test-document.jpg',
    status: 'VERIFIED',
    verifiedAt: new Date(),
    verifiedBy: new mongoose.Types.ObjectId()
  });
});

// Clean up after tests
afterAll(async () => {
  // Clean up test data
  await User.deleteMany({});
  await Job.deleteMany({});
  await Application.deleteMany({});
  await Document.deleteMany({});
  
  // Disconnect from test database
  await mongoose.connection.close();
});

describe('Job Application API', () => {
  test('GET /api/v1/jobs - User can view jobs', async () => {
    const res = await request(app)
      .get('/api/v1/jobs')
      .set('Authorization', `Bearer ${jobSeekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Software Developer');
  });
  
  test('GET /api/v1/jobs/:id - User can view job details', async () => {
    const res = await request(app)
      .get(`/api/v1/jobs/${job._id}`)
      .set('Authorization', `Bearer ${jobSeekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Software Developer');
    expect(res.body.data.responsibilities).toContain('Develop web applications');
  });
  
  test('POST /api/v1/applications - Job seeker can apply for a job', async () => {
    const applicationData = {
      jobId: job._id,
      coverLetter: 'I am interested in this position and have the required skills.',
      expectedSalary: 2000,
      availableFrom: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      documents: [document._id]
    };
    
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${jobSeekerToken}`)
      .send(applicationData);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('SUBMITTED');
    
    // Save application for later tests
    application = res.body.data;
  });
  
  test('GET /api/v1/applications - Job seeker can view their applications', async () => {
    const res = await request(app)
      .get('/api/v1/applications')
      .set('Authorization', `Bearer ${jobSeekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('SUBMITTED');
  });
  
  test('GET /api/v1/applications/:id - Job seeker can view application details', async () => {
    const res = await request(app)
      .get(`/api/v1/applications/${application._id}`)
      .set('Authorization', `Bearer ${jobSeekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.coverLetter).toBe('I am interested in this position and have the required skills.');
  });
  
  test('PUT /api/v1/applications/:id/status - Agent can update application status', async () => {
    const res = await request(app)
      .put(`/api/v1/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        status: 'UNDER_REVIEW',
        notes: 'Reviewing candidate qualifications'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UNDER_REVIEW');
    expect(res.body.data.notes).toBe('Reviewing candidate qualifications');
  });
  
  test('PUT /api/v1/applications/:id/withdraw - Job seeker can withdraw application', async () => {
    // Create another application for withdrawal test
    const withdrawApp = await Application.create({
      job: job._id,
      user: jobSeeker._id,
      coverLetter: 'Test withdrawal application',
      expectedSalary: 2000,
      availableFrom: new Date(),
      documents: [document._id],
      status: 'SUBMITTED'
    });
    
    const res = await request(app)
      .put(`/api/v1/applications/${withdrawApp._id}/withdraw`)
      .set('Authorization', `Bearer ${jobSeekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('WITHDRAWN');
  });
  
  test('GET /api/v1/applications/stats - Job seeker can view application stats', async () => {
    const res = await request(app)
      .get('/api/v1/applications/stats')
      .set('Authorization', `Bearer ${jobSeekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.active).toBe(1);  // One under review
    expect(res.body.data.withdrawn).toBe(1);  // One withdrawn
  });
  
  test('Agent cannot apply for jobs', async () => {
    const applicationData = {
      jobId: job._id,
      coverLetter: 'I am an agent trying to apply',
      expectedSalary: 2000,
      availableFrom: new Date(),
      documents: [document._id]
    };
    
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${agentToken}`)
      .send(applicationData);
    
    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });
  
  test('PUT /api/v1/applications/:id/status - Agent can update to interview scheduled', async () => {
    const interviewDate = new Date();
    interviewDate.setDate(interviewDate.getDate() + 7); // Interview in 7 days
    
    const res = await request(app)
      .put(`/api/v1/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        status: 'INTERVIEW_SCHEDULED',
        notes: 'Scheduled initial interview',
        interviewDate: interviewDate.toISOString()
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('INTERVIEW_SCHEDULED');
    expect(res.body.data.interviewDate).toBeDefined();
  });
});

// src/tests/integration/real-time-notifications.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const io = require('socket.io-client');
const http = require('http');
const app = require('../../app');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const { generateToken } = require('../utils/auth-helper');
const { initSocketServer } = require('../../websocket/socket');
const { createNotification } = require('../../utils/notificationManager');

let server;
let socketServer;
let jobSeeker;
let agent;
let jobSeekerToken;
let agentToken;
let clientSocket;
let port = 5001;

// Setup before running tests
beforeAll(async (done) => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  // Create test users
  jobSeeker = await User.create({
    firstName: 'Job',
    lastName: 'Seeker',
    email: 'jobseeker@example.com',
    password: 'password123',
    role: 'jobSeeker'
  });
  
  agent = await User.create({
    firstName: 'Agent',
    lastName: 'User',
    email: 'agent@example.com',
    password: 'password123',
    role: 'agent'
  });
  
  // Create tokens
  jobSeekerToken = generateToken(jobSeeker);
  agentToken = generateToken(agent);
  
  // Create HTTP server
  server = http.createServer(app);
  
  // Initialize socket server
  socketServer = initSocketServer(server);
  
  // Start server
  server.listen(port, () => {
    // Create client socket
    const socketUrl = `http://localhost:${port}`;
    clientSocket = io(socketUrl, {
      auth: {
        token: jobSeekerToken
      },
      transports: ['websocket']
    });
    
    clientSocket.on('connect', () => {
      done();
    });
  });
});

// Clean up after tests
afterAll(async (done) => {
  // Clean up test data
  await User.deleteMany({});
  await Notification.deleteMany({});
  
  // Close client socket
  if (clientSocket.connected) {
    clientSocket.disconnect();
  }
  
  // Close server
  server.close(() => {
    mongoose.connection.close();
    done();
  });
});

describe('Real-time Notification System', () => {
  test('Should receive notification via WebSocket', (done) => {
    // Setup listener for notification event
    clientSocket.once('notification', (notification) => {
      expect(notification).toBeDefined();
      expect(notification.recipient.toString()).toBe(jobSeeker._id.toString());
      expect(notification.title).toBe('Test Notification');
      expect(notification.message).toBe('This is a test notification');
      expect(notification.type).toBe('SYSTEM');
      
      // Check if notification was saved to database
      Notification.findById(notification._id).then(savedNotification => {
        expect(savedNotification).toBeDefined();
        expect(savedNotification.recipient.toString()).toBe(jobSeeker._id.toString());
        done();
      });
    });
    
    // Create notification (this will emit via WebSocket)
    createNotification(socketServer, {
      recipient: jobSeeker._id,
      type: 'SYSTEM',
      title: 'Test Notification',
      message: 'This is a test notification',
      data: {}
    });
  });
  
  test('Should not receive notifications for other users', (done) => {
    let receivedNotification = false;
    
    // Set up timeout to verify no notification was received
    const timeout = setTimeout(() => {
      expect(receivedNotification).toBe(false);
      done();
    }, 1000);
    
    // Set up listener that should not be called
    clientSocket.once('notification', () => {
      receivedNotification = true;
      clearTimeout(timeout);
      done(new Error('Received notification intended for another user'));
    });
    
    // Create notification for a different user
    createNotification(socketServer, {
      recipient: agent._id,
      type: 'SYSTEM',
      title: 'Agent Notification',
      message: 'This is for agent only',
      data: {}
    });
  });
  
  test('Notifications API and WebSocket are in sync', async (done) => {
    // Setup listener for notification event
    clientSocket.once('notification', async (notification) => {
      // Wait a bit to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch notifications via API
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${jobSeekerToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Find the notification we just received
      const foundNotification = res.body.data.items.find(
        n => n._id === notification._id
      );
      
      expect(foundNotification).toBeDefined();
      expect(foundNotification.title).toBe('API Sync Test');
      
      done();
    });
    
    // Create notification
    createNotification(socketServer, {
      recipient: jobSeeker._id,
      type: 'SYSTEM',
      title: 'API Sync Test',
      message: 'Testing API and WebSocket sync',
      data: {}
    });
  });
});
