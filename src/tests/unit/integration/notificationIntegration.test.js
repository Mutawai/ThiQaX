// __tests__/integration/notification-integration.test.js
const request = require('supertest');
const app = require('../../src/app');
const Notification = require('../../src/models/Notification');
const { setupTestDB } = require('../utils/testSetup');

setupTestDB();

describe('Notification Integration API Tests', () => {
  let token;
  let userId;
  let notificationId;
  
  beforeEach(async () => {
    // Create test user
    const userResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'notification-test@example.com',
        password: 'Password1@',
        role: 'jobSeeker'
      });
    
    userId = userResponse.body.data.user._id;
    
    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'notification-test@example.com',
        password: 'Password1@'
      });
    
    token = loginResponse.body.data.token;
    
    // Create test notification
    const notificationResponse = await request(app)
      .post('/api/v1/integrations/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient: userId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'GENERAL',
        link: '/profile'
      });
    
    notificationId = notificationResponse.body.data._id;
  });
  
  test('Should create a notification', async () => {
    const response = await request(app)
      .post('/api/v1/integrations/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient: userId,
        title: 'Another Test Notification',
        message: 'This is another test notification',
        type: 'DOCUMENT',
        link: '/documents'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data.title).toBe('Another Test Notification');
    expect(response.body.data.type).toBe('DOCUMENT');
  });
  
  test('Should mark notification as read', async () => {
    const response = await request(app)
      .put(`/api/v1/integrations/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.read).toBe(true);
  });
  
  test('Should get unread notification count', async () => {
    const response = await request(app)
      .get('/api/v1/integrations/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('count');
    expect(typeof response.body.data.count).toBe('number');
  });
  
  test('Should send job status notification', async () => {
    const response = await request(app)
      .post('/api/v1/integrations/notifications/job-status')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobId: '60d21b4667d0d8992e610c85', // Example job ID
        status: 'ACTIVE',
        message: 'Job is now active'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('notifications');
    expect(Array.isArray(response.body.data.notifications)).toBe(true);
  });
});
