/**
 * Test data generation utility for the ThiQaX platform.
 * Provides functions to generate realistic test data for development and testing environments.
 */
const mongoose = require('mongoose');
const faker = require('faker');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');
const { connectDatabase } = require('./dbUtils');

// Set faker seed for reproducible data
faker.seed(123);

// Collection sizes
const USERS_COUNT = 50;
const JOBS_COUNT = 100;
const DOCUMENTS_COUNT = 150;
const APPLICATIONS_COUNT = 200;
const PAYMENTS_COUNT = 150;
const NOTIFICATIONS_COUNT = 300;

/**
 * Generate test users with different roles
 * @param {number} count - Number of users to generate
 * @returns {Promise<Array>} Generated users
 */
const generateUsers = async (count = USERS_COUNT) => {
  try {
    const User = mongoose.model('User');
    
    // Define role distribution
    const roleCounts = {
      jobSeeker: Math.floor(count * 0.6), // 60% job seekers
      agent: Math.floor(count * 0.2),     // 20% agents
      sponsor: Math.floor(count * 0.15),  // 15% sponsors
      admin: Math.floor(count * 0.05)     // 5% admins
    };
    
    // Adjust for rounding errors
    const totalDefined = Object.values(roleCounts).reduce((sum, val) => sum + val, 0);
    if (totalDefined < count) {
      roleCounts.jobSeeker += (count - totalDefined);
    }
    
    const users = [];
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    // Generate specific test users first (for testing purposes)
    const testUsers = [
      {
        name: 'Test Admin',
        email: 'admin@thiqax.com',
        password: hashedPassword,
        role: 'admin',
        profileComplete: true,
        kycVerified: true
      },
      {
        name: 'Test Agent',
        email: 'agent@thiqax.com',
        password: hashedPassword,
        role: 'agent',
        profileComplete: true,
        kycVerified: true
      },
      {
        name: 'Test Sponsor',
        email: 'sponsor@thiqax.com',
        password: hashedPassword,
        role: 'sponsor',
        profileComplete: true,
        kycVerified: true
      },
      {
        name: 'Test Job Seeker',
        email: 'jobseeker@thiqax.com',
        password: hashedPassword,
        role: 'jobSeeker',
        profileComplete: true,
        kycVerified: true
      }
    ];
    
    // Insert test users
    const createdTestUsers = await User.create(testUsers);
    users.push(...createdTestUsers);
    
    // Adjust role counts to account for test users
    for (const user of testUsers) {
      roleCounts[user.role]--;
    }
    
    // Generate random users for each role
    for (const [role, roleCount] of Object.entries(roleCounts)) {
      if (roleCount <= 0) continue;
      
      const roleUsers = Array(roleCount).fill().map(() => {
        const firstName = faker.name.firstName();
        const lastName = faker.name.lastName();
        const email = faker.internet.email(firstName, lastName).toLowerCase();
        
        return {
          name: `${firstName} ${lastName}`,
          email,
          password: hashedPassword,
          role,
          profileComplete: Math.random() > 0.3, // 70% have complete profiles
          kycVerified: Math.random() > 0.5,     // 50% are KYC verified
          createdAt: faker.date.past(1),        // Created within the last year
          updatedAt: faker.date.recent()
        };
      });
      
      const createdRoleUsers = await User.create(roleUsers);
      users.push(...createdRoleUsers);
    }
    
    logger.info(`Generated ${users.length} test users`);
    return users;
  } catch (error) {
    logger.error('Error generating test users', { error });
    throw error;
  }
};

/**
 * Generate profiles for users
 * @param {Array} users - List of user documents
 * @returns {Promise<Array>} Generated profiles
 */
const generateProfiles = async (users) => {
  try {
    const Profile = mongoose.model('Profile');
    const jobSeekers = users.filter(user => user.role === 'jobSeeker');
    const agents = users.filter(user => user.role === 'agent');
    const sponsors = users.filter(user => user.role === 'sponsor');
    
    // Function to create profiles for a specific user type
    const createProfilesForUsers = async (userList, profileType) => {
      const profiles = userList.map(user => {
        // Common profile data
        const baseProfile = {
          user: user._id,
          personalInfo: {
            dateOfBirth: faker.date.past(30, new Date('2000-01-01')),
            gender: faker.random.arrayElement(['male', 'female', 'other']),
            nationality: faker.address.country(),
            idNumber: faker.random.alphaNumeric(10).toUpperCase(),
            phoneNumber: faker.phone.phoneNumber()
          },
          address: {
            street: faker.address.streetAddress(),
            city: faker.address.city(),
            state: faker.address.state(),
            postalCode: faker.address.zipCode(),
            country: faker.address.country()
          },
          isVerified: user.kycVerified,
          completionPercentage: user.profileComplete ? faker.datatype.number({ min: 70, max: 100 }) : faker.datatype.number({ min: 20, max: 69 }),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
        
        // Add type-specific profile data
        if (profileType === 'jobSeeker') {
          return {
            ...baseProfile,
            education: Array(faker.datatype.number({ min: 1, max: 3 })).fill().map(() => ({
              institution: faker.company.companyName() + ' University',
              degree: faker.random.arrayElement(['Bachelor', 'Master', 'Diploma', 'Certificate']),
              fieldOfStudy: faker.name.jobArea(),
              from: faker.date.past(10),
              to: faker.date.past(5),
              current: false,
              description: faker.lorem.paragraph()
            })),
            experience: Array(faker.datatype.number({ min: 0, max: 4 })).fill().map(() => ({
              title: faker.name.jobTitle(),
              company: faker.company.companyName(),
              location: `${faker.address.city()}, ${faker.address.country()}`,
              from: faker.date.past(8),
              to: faker.date.past(2),
              current: Math.random() > 0.8,
              description: faker.lorem.paragraph()
            })),
            skills: Array(faker.datatype.number({ min: 3, max: 8 })).fill().map(() => 
              faker.random.arrayElement([
                'Customer Service', 'Sales', 'Cleaning', 'Cooking', 'Driving',
                'Childcare', 'Elder Care', 'Security', 'Office Administration',
                'Housekeeping', 'Construction', 'Electrical', 'Plumbing'
              ])
            ),
            languages: [
              {
                name: 'English',
                proficiency: faker.random.arrayElement(['Basic', 'Intermediate', 'Fluent', 'Native'])
              },
              {
                name: faker.random.arrayElement(['Arabic', 'Swahili', 'French', 'Spanish']),
                proficiency: faker.random.arrayElement(['Basic', 'Intermediate', 'Fluent', 'Native'])
              }
            ],
            preferredJobs: [
              faker.random.arrayElement(['Domestic Worker', 'Driver', 'Security Guard', 'Caregiver', 'Construction Worker'])
            ],
            availableFrom: faker.date.future(1)
          };
        } else if (profileType === 'agent') {
          return {
            ...baseProfile,
            companyInfo: {
              name: faker.company.companyName() + ' Recruitment',
              registrationNumber: faker.random.alphaNumeric(8).toUpperCase(),
              licenseNumber: faker.random.alphaNumeric(10).toUpperCase(),
              website: faker.internet.url(),
              yearEstablished: faker.date.past(15).getFullYear()
            },
            serviceAreas: Array(faker.datatype.number({ min: 1, max: 4 })).fill().map(() => 
              faker.random.arrayElement([
                'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'
              ])
            ),
            specializations: Array(faker.datatype.number({ min: 1, max: 5 })).fill().map(() => 
              faker.random.arrayElement([
                'Domestic Workers', 'Healthcare', 'Hospitality', 'Construction', 'Security'
              ])
            ),
            contactInfo: {
              email: faker.internet.email(),
              phone: faker.phone.phoneNumber(),
              alternatePhone: faker.phone.phoneNumber()
            }
          };
        } else if (profileType === 'sponsor') {
          return {
            ...baseProfile,
            companyInfo: {
              name: faker.company.companyName(),
              industry: faker.random.arrayElement([
                'Healthcare', 'Hospitality', 'Construction', 'Retail', 'Transportation',
                'Education', 'Manufacturing', 'Energy', 'Real Estate'
              ]),
              registrationNumber: faker.random.alphaNumeric(8).toUpperCase(),
              website: faker.internet.url(),
              employeeCount: faker.random.arrayElement([
                '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
              ])
            },
            contactInfo: {
              businessEmail: faker.internet.email(),
              businessPhone: faker.phone.phoneNumber(),
              fax: faker.phone.phoneNumber()
            },
            location: {
              headquarters: faker.address.city() + ', ' + faker.address.country(),
              branches: Array(faker.datatype.number({ min: 0, max: 3 })).fill().map(() => 
                faker.address.city() + ', ' + faker.address.country()
              )
            },
            hiringHistory: {
              jobsPosted: faker.datatype.number({ min: 0, max: 50 }),
              hiresCompleted: faker.datatype.number({ min: 0, max: 30 })
            }
          };
        }
      });
      
      return await Profile.create(profiles);
    };
    
    // Generate profiles for each user type
    const jobSeekerProfiles = await createProfilesForUsers(jobSeekers, 'jobSeeker');
    const agentProfiles = await createProfilesForUsers(agents, 'agent');
    const sponsorProfiles = await createProfilesForUsers(sponsors, 'sponsor');
    
    const allProfiles = [...jobSeekerProfiles, ...agentProfiles, ...sponsorProfiles];
    logger.info(`Generated ${allProfiles.length} test profiles`);
    
    return allProfiles;
  } catch (error) {
    logger.error('Error generating test profiles', { error });
    throw error;
  }
};

/**
 * Generate document records
 * @param {Array} users - List of user documents
 * @returns {Promise<Array>} Generated documents
 */
const generateDocuments = async (users) => {
  try {
    const Document = mongoose.model('Document');
    const documents = [];
    
    // Document types by user role
    const documentTypesByRole = {
      jobSeeker: [
        'passport', 'nationalId', 'birthCertificate', 'educationCertificate',
        'workExperience', 'medicalCertificate', 'policeClearance', 'photo'
      ],
      agent: [
        'businessRegistration', 'operatingLicense', 'taxCertificate',
        'agencyAgreement', 'insuranceCertificate', 'directorId'
      ],
      sponsor: [
        'companyRegistration', 'taxIdentification', 'sponsorLicense',
        'authorizedSignatoryId', 'companyProfile'
      ],
      admin: [
        'employeeId', 'contractDocument', 'confidentialityAgreement'
      ]
    };
    
    // Mime types by document type
    const mimeTypeMap = {
      photo: 'image/jpeg',
      passport: 'application/pdf',
      nationalId: 'application/pdf',
      birthCertificate: 'application/pdf',
      educationCertificate: 'application/pdf',
      workExperience: 'application/pdf',
      medicalCertificate: 'application/pdf',
      policeClearance: 'application/pdf',
      businessRegistration: 'application/pdf',
      operatingLicense: 'application/pdf',
      taxCertificate: 'application/pdf',
      agencyAgreement: 'application/pdf',
      insuranceCertificate: 'application/pdf',
      directorId: 'application/pdf',
      companyRegistration: 'application/pdf',
      taxIdentification: 'application/pdf',
      sponsorLicense: 'application/pdf',
      authorizedSignatoryId: 'application/pdf',
      companyProfile: 'application/pdf',
      employeeId: 'application/pdf',
      contractDocument: 'application/pdf',
      confidentialityAgreement: 'application/pdf'
    };
    
    // Create documents for each user
    for (const user of users) {
      // Determine how many documents to create for this user
      const docsCount = faker.datatype.number({ min: 1, max: 5 });
      const docTypes = documentTypesByRole[user.role] || documentTypesByRole.jobSeeker;
      
      // Create documents
      for (let i = 0; i < docsCount && i < docTypes.length; i++) {
        const docType = docTypes[i];
        const verificationStatuses = ['pending', 'verified', 'rejected'];
        const weightedStatuses = [
          ...Array(5).fill('verified'),   // 50% verified
          ...Array(3).fill('pending'),    // 30% pending
          ...Array(2).fill('rejected')    // 20% rejected
        ];
        
        const status = user.kycVerified 
          ? 'verified' 
          : faker.random.arrayElement(weightedStatuses);
        
        const document = {
          user: user._id,
          type: docType,
          fileName: `${user._id}_${docType}_${faker.random.alphaNumeric(8)}.${docType === 'photo' ? 'jpg' : 'pdf'}`,
          originalName: `${docType}_${faker.random.word()}.${docType === 'photo' ? 'jpg' : 'pdf'}`,
          mimeType: mimeTypeMap[docType] || 'application/pdf',
          size: faker.datatype.number({ min: 10000, max: 5000000 }),
          path: `/uploads/${user._id}/${faker.random.uuid()}.${docType === 'photo' ? 'jpg' : 'pdf'}`,
          verificationStatus: status,
          verificationNotes: status === 'rejected' ? faker.lorem.sentence() : '',
          verifiedBy: status === 'verified' ? users.find(u => u.role === 'admin')._id : null,
          verifiedAt: status === 'verified' ? faker.date.recent() : null,
          issueDate: faker.date.past(5),
          expiryDate: faker.date.future(5),
          issuingAuthority: faker.company.companyName() + ' Authority',
          createdAt: faker.date.past(1),
          updatedAt: faker.date.recent()
        };
        
        documents.push(document);
      }
    }
    
    const createdDocuments = await Document.create(documents);
    logger.info(`Generated ${createdDocuments.length} test documents`);
    
    return createdDocuments;
  } catch (error) {
    logger.error('Error generating test documents', { error });
    throw error;
  }
};

/**
 * Generate job listings
 * @param {Array} users - List of user documents
 * @returns {Promise<Array>} Generated jobs
 */
const generateJobs = async (users) => {
  try {
    const Job = mongoose.model('Job');
    const sponsors = users.filter(user => user.role === 'sponsor');
    const agents = users.filter(user => user.role === 'agent');
    const admins = users.filter(user => user.role === 'admin');
    
    if (sponsors.length === 0 || agents.length === 0) {
      throw new Error('No sponsors or agents found to create jobs');
    }
    
    const jobs = [];
    
    // Job categories and related data
    const jobCategories = [
      {
        title: 'Domestic Helper',
        requirements: [
          'Experience in household cleaning and management',
          'Knowledge of modern cleaning equipment',
          'Ability to follow instructions'
        ],
        responsibilities: [
          'Clean and maintain home spaces',
          'Prepare simple meals',
          'Run household errands',
          'Assist with laundry and ironing'
        ],
        salaryRange: { min: 300, max: 600 }
      },
      {
        title: 'Driver',
        requirements: [
          'Valid driving license',
          'Minimum 2 years driving experience',
          'Clean driving record',
          'Basic English communication skills'
        ],
        responsibilities: [
          'Transport family members to various locations',
          'Maintain vehicle cleanliness and condition',
          'Perform basic vehicle maintenance',
          'Run errands as needed'
        ],
        salaryRange: { min: 400, max: 800 }
      },
      {
        title: 'Security Guard',
        requirements: [
          'Previous security experience preferred',
          'Physical fitness',
          'Alertness and attention to detail',
          'Basic English communication skills'
        ],
        responsibilities: [
          'Monitor premises for suspicious activity',
          'Control access to property',
          'Maintain security logs',
          'Respond to security incidents'
        ],
        salaryRange: { min: 350, max: 700 }
      },
      {
        title: 'Nurse/Caregiver',
        requirements: [
          'Nursing certificate or relevant healthcare training',
          'Previous caregiving experience',
          'Patient and compassionate attitude',
          'Good English communication skills'
        ],
        responsibilities: [
          'Provide personal care assistance',
          'Monitor health condition and medications',
          'Assist with mobility and daily activities',
          'Provide companionship and emotional support'
        ],
        salaryRange: { min: 500, max: 1000 }
      },
      {
        title: 'Cook/Chef',
        requirements: [
          'Experience in food preparation',
          'Knowledge of regional cuisines',
          'Ability to plan meals',
          'Good hygiene practices'
        ],
        responsibilities: [
          'Prepare daily meals for family',
          'Plan weekly menus',
          'Maintain kitchen cleanliness',
          'Manage grocery shopping and inventory'
        ],
        salaryRange: { min: 400, max: 900 }
      },
      {
        title: 'Construction Worker',
        requirements: [
          'Physical strength and stamina',
          'Basic construction knowledge',
          'Ability to operate hand and power tools',
          'Safety awareness'
        ],
        responsibilities: [
          'Carry out basic construction tasks',
          'Load and unload construction materials',
          'Operate and maintain equipment',
          'Follow safety protocols'
        ],
        salaryRange: { min: 300, max: 700 }
      },
      {
        title: 'Office Assistant',
        requirements: [
          'Basic computer literacy',
          'Good English communication',
          'Organizational skills',
          'Attention to detail'
        ],
        responsibilities: [
          'Handle administrative tasks',
          'Manage correspondence and filing',
          'Assist with scheduling and appointments',
          'Perform data entry and document processing'
        ],
        salaryRange: { min: 450, max: 800 }
      }
    ];
    
    // Create jobs
    for (let i = 0; i < JOBS_COUNT; i++) {
      const randomSponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      const randomCategory = jobCategories[Math.floor(Math.random() * jobCategories.length)];
      
      // Determine job status weighted toward open jobs
      const weightedStatuses = [
        ...Array(6).fill('open'),     // 60% open
        ...Array(2).fill('filled'),   // 20% filled
        ...Array(1).fill('closed'),   // 10% closed
        ...Array(1).fill('draft')     // 10% draft
      ];
      
      const status = faker.random.arrayElement(weightedStatuses);
      
      // Create job object
      const minSalary = randomCat
