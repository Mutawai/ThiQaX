const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const Profile = require('../../../models/Profile');
const User = require('../../../models/User');
const Job = require('../../../models/Job');
const Document = require('../../../models/Document');
const { setupTestDB } = require('../../utils/testDatabase');

// Setup test database before tests
setupTestDB();

describe('Profile Integration Controller', () => {
  let token;
  let testUser;
  let testProfile;
  let testJob;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'testprofint@example.com',
      password: 'Password123!',
      role: 'jobSeeker'
    });

    // Create test profile
    testProfile = await Profile.create({
      user: testUser._id,
      personalInfo: {
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+254712345678',
        dateOfBirth: new Date('1990-01-01')
      },
      education: [{
        institution: 'Test University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        from: new Date('2010-01-01'),
        to: new Date('2014-01-01')
      }],
      experience: [{
        position: 'Software Developer',
        company: 'Tech Corp',
        location: 'Nairobi',
        from: new Date('2014-01-01'),
        to: new Date('2018-01-01'),
        description: 'Full stack development'
      }],
      skills: ['JavaScript', 'Node.js', 'React'],
      completionStatus: 80
    });

    // Create test job
    testJob = await Job.create({
      title: 'Software Engineer',
      location: 'Dubai, UAE',
      description: 'Full stack developer role',
      requirements: [
        'JavaScript',
        'Node.js',
        'React',
        '3+ years experience'
      ],
      salary: {
        min: 3000,
        max: 5000,
        currency: 'USD'
      },
      status: 'ACTIVE'
    });

    // Get auth token for test user
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testprofint@example.com',
        password: 'Password123!'
      });
    
    token = authResponse.body.token;
  });

  afterEach(async () => {
    // Clean up created records
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Job.deleteMany({});
    await Document.deleteMany({});
  });

  describe('GET /api/integration/profiles/eligible', () => {
    it('should return eligible=true for complete profile with verified KYC', async () => {
      // Update profile to be complete
      await Profile.findByIdAndUpdate(testProfile._id, {
        completionStatus: 100
      });

      // Add verified KYC document
      await Document.create({
        title: 'National ID',
        type: 'IDENTIFICATION',
        owner: testUser._id,
        fileUrl: 'https://test-bucket.s3.amazonaws.com/test-id.pdf',
        status: 'VERIFIED'
      });

      const response = await request(app)
        .get('/api/integration/profiles/eligible')
        .set('Authorization', `Bearer ${token}`)
        .query({ jobId: testJob._id });

      expect(response.status).toBe(200);
      expect(response.body.eligible).toBe(true);
      expect(response.body.profile._id).toBe(testProfile._id.toString());
    });

    it('should return eligible=false for incomplete profile', async () => {
      // Update profile to be incomplete
      await Profile.findByIdAndUpdate(testProfile._id, {
        completionStatus: 50
      });

      const response = await request(app)
        .get('/api/integration/profiles/eligible')
        .set('Authorization', `Bearer ${token}`)
        .query({ jobId: testJob._id });

      expect(response.status).toBe(200);
      expect(response.body.eligible).toBe(false);
      expect(response.body.reasons).toContain('Profile is incomplete');
    });

    it('should return eligible=false for unverified KYC', async () => {
      // Update profile to be complete
      await Profile.findByIdAndUpdate(testProfile._id, {
        completionStatus: 100
      });

      // Add pending KYC document
      await Document.create({
        title: 'National ID',
        type: 'IDENTIFICATION',
        owner: testUser._id,
        fileUrl: 'https://test-bucket.s3.amazonaws.com/test-id.pdf',
        status: 'PENDING'
      });

      const response = await request(app)
        .get('/api/integration/profiles/eligible')
        .set('Authorization', `Bearer ${token}`)
        .query({ jobId: testJob._id });

      expect(response.status).toBe(200);
      expect(response.body.eligible).toBe(false);
      expect(response.body.reasons).toContain('KYC verification is not complete');
    });

    it('should return eligible=false for missing required skills', async () => {
      // Update profile to be complete
      await Profile.findByIdAndUpdate(testProfile._id, {
        completionStatus: 100,
        skills: ['JavaScript'] // Missing Node.js and React
      });

      // Add verified KYC document
      await Document.create({
        title: 'National ID',
        type: 'IDENTIFICATION',
        owner: testUser._id,
        fileUrl: 'https://test-bucket.s3.amazonaws.com/test-id.pdf',
        status: 'VERIFIED'
      });

      const response = await request(app)
        .get('/api/integration/profiles/eligible')
        .set('Authorization', `Bearer ${token}`)
        .query({ jobId: testJob._id });

      expect(response.status).toBe(200);
      expect(response.body.eligible).toBe(false);
      expect(response.body.reasons).toContain('Missing required skills');
      expect(response.body.missingRequirements).toContain('Node.js');
      expect(response.body.missingRequirements).toContain('React');
    });
  });

  describe('GET /api/integration/profiles/completion', () => {
    it('should report accurate completion status for a profile', async () => {
      const response = await request(app)
        .get('/api/integration/profiles/completion')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.completionStatus).toBe(80);
      expect(response.body.missingFields).toBeDefined();
    });

    it('should identify missing fields in a profile', async () => {
      // Update profile to remove some fields
      await Profile.findByIdAndUpdate(testProfile._id, {
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          // Missing phoneNumber and dateOfBirth
        },
        completionStatus: 50
      });

      const response = await request(app)
        .get('/api/integration/profiles/completion')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.completionStatus).toBe(50);
      expect(response.body.missingFields).toContain('personalInfo.phoneNumber');
      expect(response.body.missingFields).toContain('personalInfo.dateOfBirth');
    });
  });

  describe('GET /api/integration/profiles/kyc-status', () => {
    it('should report correct KYC status when all documents are verified', async () => {
      // Add verified KYC documents
      await Document.create([
        {
          title: 'National ID',
          type: 'IDENTIFICATION',
          owner: testUser._id,
          fileUrl: 'https://test-bucket.s3.amazonaws.com/test-id.pdf',
          status: 'VERIFIED'
        },
        {
          title: 'Utility Bill',
          type: 'ADDRESS',
          owner: testUser._id,
          fileUrl: 'https://test-bucket.s3.amazonaws.com/test-bill.pdf',
          status: 'VERIFIED'
        }
      ]);

      const response = await request(app)
        .get('/api/integration/profiles/kyc-status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.kycVerified).toBe(true);
      expect(response.body.verifiedDocuments.length).toBe(2);
    });

    it('should report incomplete KYC status when documents are pending', async () => {
      // Add pending KYC document
      await Document.create({
        title: 'National ID',
        type: 'IDENTIFICATION',
        owner: testUser._id,
        fileUrl: 'https://test-bucket.s3.amazonaws.com/test-id.pdf',
        status: 'PENDING'
      });

      const response = await request(app)
        .get('/api/integration/profiles/kyc-status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.kycVerified).toBe(false);
      expect(response.body.pendingDocuments.length).toBe(1);
    });
  });
});
