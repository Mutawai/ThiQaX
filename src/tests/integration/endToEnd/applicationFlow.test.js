const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const User = require('../../../models/User');
const Profile = require('../../../models/Profile');
const Job = require('../../../models/Job');
const Document = require('../../../models/Document');
const Application = require('../../../models/Application');
const Notification = require('../../../models/Notification');
const { setupTestDB } = require('../../utils/testDatabase');

// Setup test database before tests
setupTestDB();

describe('Application Flow End-to-End', () => {
  let jobSeekerToken;
  let agentToken;
  let adminToken;
  let jobSeeker;
  let agent;
  let admin;
  let job;
  let profile;
  let document;

  beforeAll(async () => {
    // Create users with different roles
    jobSeeker = await User.create({
      name: 'Job Seeker',
      email: 'jobseeker@example.com',
      password: 'Password123!',
      role: 'jobSeeker'
    });

    agent = await User.create({
      name: 'Agent User',
      email: 'agent@example.com',
      password: 'Password123!',
      role: 'agent'
    });

    admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin'
    });

    // Get auth tokens
    const jobSeekerAuth = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jobseeker@example.com',
        password: 'Password123!'
      });
    
    const agentAuth = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'agent@example.com',
        password: 'Password123!'
      });

    const adminAuth = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!'
      });
    
    jobSeekerToken = jobSeekerAuth.body.token;
    agentToken = agentAuth.body.token;
    adminToken = adminAuth.body.token;

    // Create a job
    job = await Job.create({
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
      status: 'ACTIVE',
      createdBy: agent._id
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Job.deleteMany({});
    await Document.deleteMany({});
    await Application.deleteMany({});
    await Notification.deleteMany({});
  });

  test('1. Job seeker completes profile', async () => {
    const profileData = {
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+254712345678',
        dateOfBirth: '1990-01-01'
      },
      education: [{
        institution: 'University of Nairobi',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        from: '2010-01-01',
        to: '2014-01-01'
      }],
      experience: [{
        position: 'Software Developer',
        company: 'Tech Corp',
        location: 'Nairobi',
        from: '2014-01-01',
        to: '2018-01-01',
        description: 'Full stack development'
      }],
      skills: ['JavaScript', 'Node.js', 'React']
    };

    const response = await request(app)
      .post('/api/profiles')
      .set('Authorization', `Bearer ${jobSeekerToken}`)
      .send(profileData);

    expect(response.status).toBe(201);
    expect(response.body.profile).toBeDefined();

    profile = response.body.profile;
    expect(profile.user.toString()).toBe(jobSeeker._id.toString());
    expect(profile.completionStatus).toBe(100);
  });

  test('2. Job seeker uploads KYC document', async () => {
    // Mock document upload (normally would involve file upload)
    const docData = {
      title: 'National ID',
      type: 'IDENTIFICATION',
      description: 'Kenyan national ID',
      fileUrl: 'https://test-bucket.s3.amazonaws.com/mock-id.pdf'
    };

    const response = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${jobSeekerToken}`)
      .send(docData);

    expect(response.status).toBe(201);
    expect(response.body.document).toBeDefined();
    document = response.body.document;
  });

  test('3. Agent verifies KYC document', async () => {
    const response = await request(app)
      .put(`/api/integration/documents/verify/${document._id}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        status: 'VERIFIED',
        verificationNotes: 'Document verified successfully'
      });

    expect(response.status).toBe(200);
    expect(response.body.document.status).toBe('VERIFIED');

    // Check if notification was sent
    const notifications = await Notification.find({ recipient: jobSeeker._id });
    expect(notifications.length).toBeGreaterThan(0);
    
    const verificationNotification = notifications.find(
      n => n.type === 'DOCUMENT_VERIFIED'
    );
    expect(verificationNotification).toBeDefined();
  });

  test('4. Job seeker checks eligibility for job', async () => {
    const response = await request(app)
      .get('/api/integration/profiles/eligible')
      .set('Authorization', `Bearer ${jobSeekerToken}`)
      .query({ jobId: job._id });

    expect(response.status).toBe(200);
    expect(response.body.eligible).toBe(true);
    expect(response.body.profile._id.toString()).toBe(profile._id.toString());
  });

  test('5. Job seeker applies for job', async () => {
    const applicationData = {
      jobId: job._id,
      coverLetter: 'I am very interested in this position...'
    };

    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${jobSeekerToken}`)
      .send(applicationData);

    expect(response.status).toBe(201);
    expect(response.body.application).toBeDefined();
    
    const application = response.body.application;
    expect(application.jobSeeker.toString()).toBe(jobSeeker._id.toString());
    expect(application.job.toString()).toBe(job._id.toString());
    expect(application.status).toBe('SUBMITTED');
  });

  test('6. Document is linked to application', async () => {
    // Get the most recent application
    const application = await Application.findOne({ jobSeeker: jobSeeker._id })
      .sort({ createdAt: -1 });

    const response = await request(app)
      .post('/api/integration/documents/link')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        applicationId: application._id,
        documentIds: [document._id]
      });

    expect(response.status).toBe(200);
    expect(response.body.application.documents).toContainEqual(
      expect.objectContaining({
        _id: document._id.toString()
      })
    );

    // Verify document in DB is linked to application
    const updatedDoc = await Document.findById(document._id);
    expect(updatedDoc.application.toString()).toBe(application._id.toString());
  });

  test('7. Agent updates application status', async () => {
    // Get the most recent application
    const application = await Application.findOne({ jobSeeker: jobSeeker._id })
      .sort({ createdAt: -1 });

    const response = await request(app)
      .put(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        status: 'SHORTLISTED',
        notes: 'Candidate has relevant skills and experience'
      });

    expect(response.status).toBe(200);
    expect(response.body.application.status).toBe('SHORTLISTED');

    // Check if notification was sent
    const notifications = await Notification.find({ 
      recipient: jobSeeker._id,
      type: 'APPLICATION_STATUS_CHANGE'
    });
    expect(notifications.length).toBeGreaterThan(0);
  });

  test('8. Job seeker checks application status', async () => {
    const response = await request(app)
      .get('/api/applications/me')
      .set('Authorization', `Bearer ${jobSeekerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.applications.length).toBeGreaterThan(0);
    
    const application = response.body.applications[0];
    expect(application.status).toBe('SHORTLISTED');
  });
});
