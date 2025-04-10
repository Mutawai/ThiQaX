const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const Document = require('../../../models/Document');
const Application = require('../../../models/Application');
const User = require('../../../models/User');
const { setupTestDB } = require('../../utils/testDatabase');

// Setup test database before tests
setupTestDB();

describe('Document Integration Controller', () => {
  let token;
  let testUser;
  let testDocument;
  let testApplication;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'testdocint@example.com',
      password: 'Password123!',
      role: 'jobSeeker'
    });

    // Create test document
    testDocument = await Document.create({
      title: 'Test Document',
      type: 'IDENTIFICATION',
      owner: testUser._id,
      fileUrl: 'https://test-bucket.s3.amazonaws.com/test-doc.pdf',
      status: 'PENDING'
    });

    // Create test application
    testApplication = await Application.create({
      jobSeeker: testUser._id,
      status: 'SUBMITTED',
      documents: []
    });

    // Get auth token for test user
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testdocint@example.com',
        password: 'Password123!'
      });
    
    token = authResponse.body.token;
  });

  afterEach(async () => {
    // Clean up created records
    await User.deleteMany({});
    await Document.deleteMany({});
    await Application.deleteMany({});
  });

  describe('POST /api/integration/documents/link', () => {
    it('should successfully link documents to an application', async () => {
      const response = await request(app)
        .post('/api/integration/documents/link')
        .set('Authorization', `Bearer ${token}`)
        .send({
          applicationId: testApplication._id,
          documentIds: [testDocument._id]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.application.documents).toContainEqual(
        expect.objectContaining({
          _id: testDocument._id.toString()
        })
      );

      // Verify document in DB is linked to application
      const updatedDoc = await Document.findById(testDocument._id);
      expect(updatedDoc.application.toString()).toBe(testApplication._id.toString());
    });

    it('should return 404 when application does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/integration/documents/link')
        .set('Authorization', `Bearer ${token}`)
        .send({
          applicationId: nonExistentId,
          documentIds: [testDocument._id]
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Application not found');
    });

    it('should return 404 when document does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/integration/documents/link')
        .set('Authorization', `Bearer ${token}`)
        .send({
          applicationId: testApplication._id,
          documentIds: [nonExistentId]
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('One or more documents not found');
    });
  });

  describe('PUT /api/integration/documents/verify/:id', () => {
    it('should update document verification status to VERIFIED', async () => {
      const response = await request(app)
        .put(`/api/integration/documents/verify/${testDocument._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'VERIFIED',
          verifiedBy: testUser._id,
          verificationNotes: 'Document verified successfully'
        });

      expect(response.status).toBe(200);
      expect(response.body.document.status).toBe('VERIFIED');
      expect(response.body.document.verificationNotes).toBe('Document verified successfully');

      // Verify document status in DB
      const updatedDoc = await Document.findById(testDocument._id);
      expect(updatedDoc.status).toBe('VERIFIED');
    });

    it('should update document verification status to REJECTED', async () => {
      const response = await request(app)
        .put(`/api/integration/documents/verify/${testDocument._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'REJECTED',
          verifiedBy: testUser._id,
          verificationNotes: 'Document is not valid'
        });

      expect(response.status).toBe(200);
      expect(response.body.document.status).toBe('REJECTED');
      expect(response.body.document.verificationNotes).toBe('Document is not valid');
    });

    it('should return 404 when document does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/integration/documents/verify/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'VERIFIED',
          verifiedBy: testUser._id
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Document not found');
    });
  });

  describe('GET /api/integration/documents/expiring', () => {
    it('should return documents expiring within the specified days', async () => {
      // Update test document to have an expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 20); // 20 days from now
      
      await Document.findByIdAndUpdate(testDocument._id, {
        expiryDate: expiryDate
      });

      const response = await request(app)
        .get('/api/integration/documents/expiring')
        .set('Authorization', `Bearer ${token}`)
        .query({ days: 30 });

      expect(response.status).toBe(200);
      expect(response.body.documents.length).toBeGreaterThan(0);
      expect(response.body.documents[0]._id).toBe(testDocument._id.toString());
    });

    it('should not return documents already notified about expiration', async () => {
      // Update test document to have an expiry date and set expiryNotified flag
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 20); // 20 days from now
      
      await Document.findByIdAndUpdate(testDocument._id, {
        expiryDate: expiryDate,
        expiryNotified: true
      });

      const response = await request(app)
        .get('/api/integration/documents/expiring')
        .set('Authorization', `Bearer ${token}`)
        .query({ days: 30 });

      expect(response.status).toBe(200);
      expect(response.body.documents.length).toBe(0);
    });
  });
});
