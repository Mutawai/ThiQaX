const request = require('supertest');
const app = require('../../../app');
const User = require('../../../models/User');
const { setupTestDB } = require('../../utils/testDatabase');

// Setup test database before tests
setupTestDB();

describe('Integration Routes Authentication & Authorization', () => {
  let adminToken;
  let userToken;
  let agentToken;

  beforeAll(async () => {
    // Create test users with different roles
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin'
    });

    const user = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'Password123!',
      role: 'jobSeeker'
    });

    const agent = await User.create({
      name: 'Agent User',
      email: 'agent@example.com',
      password: 'Password123!',
      role: 'agent'
    });

    // Get auth tokens
    const adminAuth = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!'
      });
    
    const userAuth = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'Password123!'
      });
    
    const agentAuth = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'agent@example.com',
        password: 'Password123!'
      });
    
    adminToken = adminAuth.body.token;
    userToken = userAuth.body.token;
    agentToken = agentAuth.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app)
        .get('/api/integration/profiles/eligible')
        .query({ jobId: '507f1f77bcf86cd799439011' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('No token provided');
    });

    it('should reject requests with invalid auth token', async () => {
      const response = await request(app)
        .get('/api/integration/profiles/eligible')
        .set('Authorization', 'Bearer invalidtoken')
        .query({ jobId: '507f1f77bcf86cd799439011' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Authorization Middleware', () => {
    it('should allow admin access to admin-only routes', async () => {
      const response = await request(app)
        .get('/api/integration/documents/expiring')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).not.toBe(403);
    });

    it('should deny non-admin access to admin-only routes', async () => {
      const response = await request(app)
        .get('/api/integration/documents/expiring')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('should allow agents access to agent routes', async () => {
      const response = await request(app)
        .put('/api/integration/documents/verify/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          status: 'VERIFIED',
          verificationNotes: 'Verified successfully'
        });

      // Should be 404 (not found) rather than 403 (forbidden)
      // This confirms the auth check passed but document wasn't found
      expect(response.status).toBe(404);
    });
  });

  describe('Input Validation', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/integration/documents/link')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing applicationId and documentIds
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeInstanceOf(Array);
    });

    it('should validate correct input formats', async () => {
      const response = await request(app)
        .post('/api/integration/documents/link')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          applicationId: 'invalid-id-format',
          documentIds: ['also-invalid-id']
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeInstanceOf(Array);
    });
  });

  describe('Route Handlers', () => {
    it('should correctly route to document linking endpoint', async () => {
      const response = await request(app)
        .post('/api/integration/documents/link')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          applicationId: '507f1f77bcf86cd799439011',
          documentIds: ['507f1f77bcf86cd799439012']
        });

      // Should be 404 (not found) which confirms the route is connected properly
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should correctly route to profile eligibility endpoint', async () => {
      const response = await request(app)
        .get('/api/integration/profiles/eligible')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ jobId: '507f1f77bcf86cd799439011' });

      // Should be 404 (not found) which confirms the route is connected properly
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });
});
