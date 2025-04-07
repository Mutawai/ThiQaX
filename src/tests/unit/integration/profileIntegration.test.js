// __tests__/integration/profile-integration.test.js
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Profile = require('../../src/models/Profile');
const Job = require('../../src/models/Job');
const { setupTestDB } = require('../utils/testSetup');

setupTestDB();

describe('Profile Integration API Tests', () => {
  let token;
  let userId;
  let profileId;
  let jobId;
  
  beforeEach(async () => {
    // Create test user
    const userResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'profile-test@example.com',
        password: 'Password1@',
        role: 'jobSeeker'
      });
    
    userId = userResponse.body.data.user._id;
    
    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'profile-test@example.com',
        password: 'Password1@'
      });
    
    token = loginResponse.body.data.token;
    
    // Create test profile
    const profileResponse = await request(app)
      .post('/api/v1/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        dateOfBirth: '1990-01-01',
        nationality: 'Kenyan',
        education: [
          {
            institution: 'Test University',
            degree: 'Bachelor',
            fieldOfStudy: 'Computer Science',
            startDate: '2010-01-01',
            endDate: '2014-01-01'
          }
        ],
        skills: ['JavaScript', 'Node.js'],
        languages: [
          {
            language: 'English',
            proficiency: 'Fluent'
          }
        ]
      });
    
    profileId = profileResponse.body.data._id;
    
    // Create test job
    const jobResponse = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`) // Using same token but would typically be a sponsor
      .send({
        title: 'Test Job',
        description: 'Test job description',
        requiredSkills: ['JavaScript', 'Node.js', 'React'],
        location: 'Remote',
        salary: {
          amount: 5000,
          currency: 'USD',
          period: 'MONTHLY'
        }
      });
    
    jobId = jobResponse.body.data._id;
  });
  
  test('Should check profile eligibility for job', async () => {
    const response = await request(app)
      .get(`/api/v1/integrations/profiles/${profileId}/eligibility/${jobId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('eligible');
    expect(response.body.data).toHaveProperty('missingRequirements');
    expect(response.body.data).toHaveProperty('reasons');
  });
  
  test('Should check profile completeness', async () => {
    const response = await request(app)
      .get(`/api/v1/integrations/profiles/${profileId}/completeness`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('isComplete');
    expect(response.body.data).toHaveProperty('completionPercentage');
    expect(response.body.data).toHaveProperty('missingFields');
  });
  
  test('Should verify KYC status', async () => {
    const response = await request(app)
      .get(`/api/v1/integrations/profiles/${profileId}/kyc-status`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('isVerified');
    expect(response.body.data).toHaveProperty('verificationStatus');
    expect(response.body.data).toHaveProperty('missingDocuments');
  });
});
