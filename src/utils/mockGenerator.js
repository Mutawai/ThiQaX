/**
 * Mock data generator utilities for testing in the ThiQaX platform.
 * Provides functions to create consistent test data for various entities.
 */
const mongoose = require('mongoose');
const faker = require('faker');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

// Set faker locale
faker.locale = 'en';

/**
 * Generate a mock ObjectId
 * @returns {mongoose.Types.ObjectId} MongoDB ObjectId
 */
const generateObjectId = () => new mongoose.Types.ObjectId();

/**
 * Generate a mock user
 * @param {Object} overrides - Properties to override in the generated user
 * @returns {Object} Mock user object
 */
const generateUser = async (overrides = {}) => {
  const roles = ['jobSeeker', 'agent', 'sponsor', 'admin'];
  const defaultRole = overrides.role || roles[Math.floor(Math.random() * 3)]; // Avoid admin by default
  
  // Hash password if provided
  let password = overrides.password || 'Password123!';
  if (!overrides.hasOwnProperty('password') || !overrides.password.startsWith('$2a$')) {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
  }
  
  return {
    _id: generateObjectId(),
    name: faker.name.findName(),
    email: faker.internet.email().toLowerCase(),
    role: defaultRole,
    password,
    profileComplete: faker.datatype.boolean(),
    kycVerified: faker.datatype.boolean(),
    createdAt: faker.date.past(),
    ...overrides
  };
};

/**
 * Generate multiple mock users
 * @param {number} count - Number of users to generate
 * @param {Object} overrides - Properties to override in all generated users
 * @returns {Promise<Array<Object>>} Array of mock user objects
 */
const generateUsers = async (count = 5, overrides = {}) => {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    users.push(await generateUser(overrides));
  }
  
  return users;
};

/**
 * Generate a mock profile
 * @param {Object} overrides - Properties to override in the generated profile
 * @param {mongoose.Types.ObjectId} userId - User ID to associate with profile
 * @returns {Object} Mock profile object
 */
const generateProfile = (overrides = {}, userId = generateObjectId()) => {
  const genders = ['male', 'female', 'other', 'prefer not to say'];
  
  return {
    _id: generateObjectId(),
    user: userId,
    personalInfo: {
      dateOfBirth: faker.date.past(30),
      gender: genders[Math.floor(Math.random() * genders.length)],
      nationality: faker.address.country(),
      idNumber: faker.random.alphaNumeric(8).toUpperCase(),
      phoneNumber: faker.phone.phoneNumber()
    },
    address: {
      street: faker.address.streetAddress(),
      city: faker.address.city(),
      state: faker.address.state(),
      postalCode: faker.address.zipCode(),
      country: faker.address.country()
    },
    education: [
      {
        institution: faker.company.companyName() + ' University',
        degree: faker.name.jobArea() + ' Degree',
        fieldOfStudy: faker.name.jobType(),
        from: faker.date.past(10),
        to: faker.date.past(5),
        current: false,
        description: faker.lorem.paragraph()
      }
    ],
    experience: [
      {
        title: faker.name.jobTitle(),
        company: faker.company.companyName(),
        location: faker.address.city() + ', ' + faker.address.country(),
        from: faker.date.past(7),
        to: faker.date.past(2),
        current: false,
        description: faker.lorem.paragraph()
      }
    ],
    skills: [
      faker.name.jobArea(),
      faker.name.jobDescriptor(),
      faker.name.jobType()
    ],
    languages: [
      {
        name: 'English',
        proficiency: 'Fluent'
      },
      {
        name: faker.address.country(),
        proficiency: 'Basic'
      }
    ],
    documents: [],
    completionPercentage: faker.datatype.number({ min: 0, max: 100 }),
    isVerified: faker.datatype.boolean(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides
  };
};

/**
 * Generate a mock document
 * @param {Object} overrides - Properties to override in the generated document
 * @param {mongoose.Types.ObjectId} userId - User ID to associate with document
 * @returns {Object} Mock document object
 */
const generateDocument = (overrides = {}, userId = generateObjectId()) => {
  const documentTypes = ['passport', 'nationalId', 'drivingLicense', 'birthCertificate', 'academicCertificate'];
  const verificationStatuses = ['pending', 'verified', 'rejected'];
  
  return {
    _id: generateObjectId(),
    user: userId,
    type: overrides.type || documentTypes[Math.floor(Math.random() * documentTypes.length)],
    fileName: faker.system.fileName(),
    originalName: 'original_' + faker.system.fileName(),
    mimeType: 'application/pdf',
    size: faker.datatype.number({ min: 10000, max: 5000000 }), // 10KB to 5MB
    path: '/uploads/' + faker.random.uuid() + '.pdf',
    verificationStatus: overrides.verificationStatus || verificationStatuses[Math.floor(Math.random() * verificationStatuses.length)],
    verificationNotes: faker.lorem.sentence(),
    verifiedBy: verificationStatuses[1] === 'verified' ? generateObjectId() : null,
    verifiedAt: verificationStatuses[1] === 'verified' ? faker.date.recent() : null,
    issueDate: faker.date.past(5),
    expiryDate: faker.date.future(5),
    issuingAuthority: faker.company.companyName() + ' Authority',
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides
  };
};

/**
 * Generate a mock job
 * @param {Object} overrides - Properties to override in the generated job
 * @param {mongoose.Types.ObjectId} sponsorId - Sponsor ID for the job
 * @param {mongoose.Types.ObjectId} agentId - Agent ID for the job
 * @returns {Object} Mock job object
 */
const generateJob = (overrides = {}, sponsorId = generateObjectId(), agentId = generateObjectId()) => {
  const jobTypes = ['full-time', 'part-time', 'contract', 'internship'];
  const industries = ['Healthcare', 'Hospitality', 'Construction', 'Domestic Work', 'Transportation', 'Security'];
  const countries = ['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'];
  const statuses = ['draft', 'open', 'closed', 'filled', 'cancelled'];
  
  const salaryMin = faker.datatype.number({ min: 500, max: 2000 });
  const salaryMax = faker.datatype.number({ min: salaryMin + 100, max: salaryMin + 1000 });
  
  return {
    _id: generateObjectId(),
    title: faker.name.jobTitle(),
    description: faker.lorem.paragraphs(3),
    responsibilities: [
      faker.lorem.sentence(),
      faker.lorem.sentence(),
      faker.lorem.sentence()
    ],
    requirements: [
      faker.lorem.sentence(),
      faker.lorem.sentence(),
      faker.lorem.sentence()
    ],
    type: jobTypes[Math.floor(Math.random() * jobTypes.length)],
    industry: industries[Math.floor(Math.random() * industries.length)],
    location: {
      country: countries[Math.floor(Math.random() * countries.length)],
      city: faker.address.city(),
      address: faker.address.streetAddress()
    },
    salary: {
      min: salaryMin,
      max: salaryMax,
      currency: 'USD',
      period: 'monthly'
    },
    benefits: [
      'Healthcare',
      'Housing',
      'Transportation',
      faker.lorem.words(2)
    ],
    contractDuration: faker.datatype.number({ min: 6, max: 36 }) + ' months',
    sponsor: sponsorId,
    agent: agentId,
    vacancies: faker.datatype.number({ min: 1, max: 20 }),
    applicationDeadline: faker.date.future(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    isVerified: faker.datatype.boolean(),
    verificationNotes: faker.lorem.sentence(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides
  };
};

/**
 * Generate a mock application
 * @param {Object} overrides - Properties to override in the generated application
 * @param {mongoose.Types.ObjectId} jobId - Job ID for the application
 * @param {mongoose.Types.ObjectId} applicantId - Applicant ID for the application
 * @returns {Object} Mock application object
 */
const generateApplication = (overrides = {}, jobId = generateObjectId(), applicantId = generateObjectId()) => {
  const statuses = ['pending', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn'];
  
  return {
    _id: generateObjectId(),
    job: jobId,
    applicant: applicantId,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    coverLetter: faker.lorem.paragraphs(2),
    documents: [
      generateObjectId(),
      generateObjectId()
    ],
    notes: faker.lorem.paragraph(),
    submittedAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides
  };
};

/**
 * Generate a mock payment
 * @param {Object} overrides - Properties to override in the generated payment
 * @param {mongoose.Types.ObjectId} applicationId - Application ID for the payment
 * @param {mongoose.Types.ObjectId} payerId - Payer ID for the payment
 * @param {mongoose.Types.ObjectId} payeeId - Payee ID for the payment
 * @returns {Object} Mock payment object
 */
const generatePayment = (overrides = {}, applicationId = generateObjectId(), payerId = generateObjectId(), payeeId = generateObjectId()) => {
  const types = ['application', 'service', 'commission', 'refund'];
  const statuses = ['pending', 'completed', 'failed', 'refunded', 'disputed'];
  const methods = ['bank_transfer', 'credit_card', 'paypal', 'mobile_money'];
  
  const amount = faker.datatype.number({ min: 100, max: 5000 });
  
  return {
    _id: generateObjectId(),
    application: applicationId,
    payer: payerId,
    payee: payeeId,
    type: types[Math.floor(Math.random() * types.length)],
    amount,
    currency: 'USD',
    description: faker.lorem.sentence(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    paymentMethod: methods[Math.floor(Math.random() * methods.length)],
    transactionId: faker.random.uuid(),
    metadata: {
      receipt: faker.internet.url(),
      note: faker.lorem.sentence()
    },
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    completedAt: statuses[1] === 'completed' ? faker.date.recent() : null,
    ...overrides
  };
};

/**
 * Generate a mock notification
 * @param {Object} overrides - Properties to override in the generated notification
 * @param {mongoose.Types.ObjectId} userId - User ID for the notification recipient
 * @returns {Object} Mock notification object
 */
const generateNotification = (overrides = {}, userId = generateObjectId()) => {
  const types = ['application', 'document', 'payment', 'message', 'system'];
  const priorities = ['low', 'medium', 'high'];
  
  return {
    _id: generateObjectId(),
    user: userId,
    type: types[Math.floor(Math.random() * types.length)],
    title: faker.lorem.sentence(),
    message: faker.lorem.paragraph(),
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    isRead: faker.datatype.boolean(),
    metadata: {
      entityId: generateObjectId(),
      entityType: types[Math.floor(Math.random() * types.length)],
      actionUrl: '/dashboard/' + faker.lorem.slug()
    },
    createdAt: faker.date.past(),
    readAt: faker.datatype.boolean() ? faker.date.recent() : null,
    ...overrides
  };
};

/**
 * Generate mock Express request and response objects
 * @param {Object} reqOverrides - Properties to override in the request object
 * @param {Object} resOverrides - Properties to override in the response object
 * @returns {Object} Object containing mock req and res objects
 */
const generateExpressMocks = (reqOverrides = {}, resOverrides = {}) => {
  // Mock request object
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {
      'content-type': 'application/json'
    },
    cookies: {},
    protocol: 'http',
    hostname: 'localhost',
    originalUrl: '/',
    path: '/',
    method: 'GET',
    ...reqOverrides
  };
  
  // Add user if auth is needed
  if (reqOverrides.authenticated && !req.user) {
    req.user = {
      _id: generateObjectId(),
      role: reqOverrides.role || 'jobSeeker',
      email: faker.internet.email()
    };
  }
  
  // Add helper method to get full URL
  req.get = (header) => req.headers[header.toLowerCase()];
  
  // Mock response object
  const res = {
    statusCode: 200,
    headers: {},
    locals: {},
    
    status(code) {
      this.statusCode = code;
      return this;
    },
    
    json(data) {
      this.body = data;
      return this;
    },
    
    send(data) {
      this.body = data;
      return this;
    },
    
    sendStatus(code) {
      this.statusCode = code;
      return this;
    },
    
    cookie(name, value, options = {}) {
      this.cookies = this.cookies || {};
      this.cookies[name] = { value, options };
      return this;
    },
    
    clearCookie(name) {
      if (this.cookies && this.cookies[name]) {
        delete this.cookies[name];
      }
      return this;
    },
    
    set(header, value) {
      this.headers[header.toLowerCase()] = value;
      return this;
    },
    
    redirect(url) {
      this.redirectUrl = url;
      return this;
    },
    
    ...resOverrides
  };
  
  return { req, res };
};

/**
 * Generate a mock JWT token for testing
 * @param {Object} payload - Token payload
 * @param {string} secret - Secret key for signing
 * @param {Object} options - JWT options
 * @returns {string} JWT token
 */
const generateMockToken = (payload = {}, secret = 'test-secret', options = {}) => {
  try {
    const jwt = require('jsonwebtoken');
    
    const defaultPayload = {
      id: generateObjectId(),
      role: 'jobSeeker',
      email: faker.internet.email(),
      ...payload
    };
    
    const defaultOptions = {
      expiresIn: '1h',
      ...options
    };
    
    return jwt.sign(defaultPayload, secret, defaultOptions);
  } catch (error) {
    logger.error('Error generating mock token', { error });
    throw error;
  }
};

module.exports = {
  generateObjectId,
  generateUser,
  generateUsers,
  generateProfile,
  generateDocument,
  generateJob,
  generateApplication,
  generatePayment,
  generateNotification,
  generateExpressMocks,
  generateMockToken
};
