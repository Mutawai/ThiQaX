// __tests__/integration/document-integration.test.js
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app');
const Document = require('../../src/models/Document');
const Application = require('../../src/models/Application');
const User = require('../../src/models/User');
const { setupTestDB } = require('../utils/testSetup');

setupTestDB();

describe('Document Integration API Tests', () => {
  let token;
  let userId;
  let applicationId;
  let documentId;
  
  beforeEach(async () => {
    // Create test user
    const userResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password1@',
        role: 'jobSeeker'
      });
    
    userId = userResponse.body.data.user._id;
    
    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password1@'
      });
    
    token = loginResponse.body.data.token;
    
    // Create test application
    const applicationResponse = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobId: mongoose.Types.ObjectId(),
        coverLetter: 'Test cover letter'
      });
    
    applicationId = applicationResponse.body.data._id;
    
    // Create test document
    const documentResponse = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'identity')
      .field('documentName', 'Test ID')
      .attach('file', '__tests__/fixtures/test-document.pdf');
    
    documentId = documentResponse.body.data._id;
  });
  
  test('Should link documents to application', async () => {
    const response = await request(app)
      .post('/api/v1/integrations/documents/link')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId,
        documentIds: [documentId]
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('application');
    expect(response.body.data.application.documents).toContain(documentId);
  });
  
  test('Should update document verification status', async () => {
    const response = await request(app)
      .put(`/api/v1/integrations/documents/${documentId}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'VERIFIED',
        verificationNotes: 'Document verified successfully'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('VERIFIED');
  });
  
  test('Should reject verification with invalid status', async () => {
    const response = await request(app)
      .put(`/api/v1/integrations/documents/${documentId}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'INVALID_STATUS',
        verificationNotes: 'Test notes'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
  
  test('Should check for documents expiring soon', async () => {
    // Set a document to expire soon
    await Document.findByIdAndUpdate(documentId, {
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
    });
    
    const response = await request(app)
      .get('/api/v1/integrations/documents/check-expiration')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.expiringDocuments.length).toBeGreaterThan(0);
    expect(response.body.data.expiringDocuments[0].notificationSent).toBe(true);
  });
});
