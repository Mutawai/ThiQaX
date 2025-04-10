/**
 * Seed data utility
 * Provides functions to populate database with initial test data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Document, Job, Application, Payment, Notification } = require('../models');

/**
 * Create initial admin user
 * @returns {Promise<Object>} Created admin user
 */
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@thiqax.com' });
    if (existingAdmin) {
      console.log('Admin user already exists, skipping creation');
      return existingAdmin;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123!', salt);

    const admin = await User.create({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@thiqax.com',
      password: hashedPassword,
      role: 'admin',
      profileComplete: true,
      kycVerified: true,
      emailVerified: true,
      active: true
    });

    console.log(`Admin user created with ID: ${admin._id}`);
    return admin;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

/**
 * Create test users of different roles
 * @param {Number} count Number of users to create
 * @returns {Promise<Array>} Created users
 */
const createTestUsers = async (count = 10) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password@123', salt);
    
    const users = [];
    const roles = ['jobSeeker', 'agent', 'sponsor'];
    
    // Create users with different roles
    for (let i = 0; i < count; i++) {
      const roleIndex = i % roles.length;
      
      const user = await User.create({
        firstName: `Test${i}`,
        lastName: `User${i}`,
        email: `test${i}@thiqax.com`,
        password: hashedPassword,
        role: roles[roleIndex],
        profileComplete: true,
        kycVerified: roleIndex === 0 ? Math.random() > 0.5 : true, // Some job seekers not verified
        emailVerified: true,
        active: true
      });
      
      users.push(user);
      console.log(`Created ${roles[roleIndex]} user with ID: ${user._id}`);
    }
    
    return users;
  } catch (error) {
    console.error('Error creating test users:', error);
    throw error;
  }
};

/**
 * Create sample documents for users
 * @param {Array} users User objects to create documents for
 * @returns {Promise<Array>} Created documents
 */
const createSampleDocuments = async (users) => {
  try {
    const documents = [];
    const documentTypes = ['identification', 'passport', 'certificate', 'address', 'education'];
    const statuses = ['PENDING', 'VERIFIED', 'REJECTED'];
    
    for (const user of users) {
      // Only create documents for job seekers
      if (user.role !== 'jobSeeker') continue;
      
      // Create 1-3 documents per user
      const docCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < docCount; i++) {
        const typeIndex = i % documentTypes.length;
        const statusIndex = Math.floor(Math.random() * statuses.length);
        
        // Set expiry date for some documents
        let expiryDate = null;
        if (Math.random() > 0.7) {
          const days = Math.floor(Math.random() * 365) + 1;
          expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + days);
        }
        
        const document = await Document.create({
          userId: user._id,
          type: documentTypes[typeIndex],
          fileUrl: `https://storage.thiqax.com/test/${user._id}/document${i}.pdf`,
          fileName: `document${i}.pdf`,
          fileType: 'application/pdf',
          fileSize: Math.floor(Math.random() * 1000000) + 500000,
          status: statuses[statusIndex],
          expiryDate
        });
        
        documents.push(document);
        console.log(`Created ${documentTypes[typeIndex]} document for user ${user._id}`);
      }
    }
    
    return documents;
  } catch (error) {
    console.error('Error creating sample documents:', error);
    throw error;
  }
};

/**
 * Create sample jobs
 * @param {Array} users User objects to create jobs for
 * @returns {Promise<Array>} Created jobs
 */
const createSampleJobs = async (users) => {
  try {
    const jobs = [];
    const sponsors = users.filter(user => user.role === 'sponsor');
    const agents = users.filter(user => user.role === 'agent');
    
    if (sponsors.length === 0) {
      throw new Error('No sponsor users found to create jobs');
    }
    
    // Sample job titles and locations
    const jobTitles = [
      'Housekeeping Supervisor',
      'Construction Worker',
      'Retail Associate',
      'Security Guard',
      'Delivery Driver',
      'Restaurant Server',
      'Office Administrator',
      'Warehouse Worker',
      'Customer Service Representative',
      'Landscaper'
    ];
    
    const locations = [
      'Dubai, UAE',
      'Doha, Qatar',
      'Riyadh, Saudi Arabia',
      'Abu Dhabi, UAE',
      'Muscat, Oman',
      'Kuwait City, Kuwait',
      'Manama, Bahrain'
    ];
    
    // Create 2-4 jobs per sponsor
    for (const sponsor of sponsors) {
      const jobCount = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < jobCount; i++) {
        const titleIndex = Math.floor(Math.random() * jobTitles.length);
        const locationIndex = Math.floor(Math.random() * locations.length);
        
        // Assign an agent to some jobs
        const assignAgent = Math.random() > 0.5 && agents.length > 0;
        const agentId = assignAgent ? 
          agents[Math.floor(Math.random() * agents.length)]._id : 
          undefined;
        
        const job = await Job.create({
          title: jobTitles[titleIndex],
          description: `This is a sample job posting for ${jobTitles[titleIndex]} position in ${locations[locationIndex]}. The role requires experience in the field and good communication skills. The employer offers competitive salary and benefits.`,
          location: locations[locationIndex],
          sponsorId: sponsor._id,
          agentId,
          salary: {
            amount: Math.floor(Math.random() * 3000) + 2000,
            currency: 'USD',
            period: 'monthly'
          },
          contractType: ['fullTime', 'partTime', 'contract'][Math.floor(Math.random() * 3)],
          contractDuration: Math.floor(Math.random() * 24) + 6,
          requirements: [
            'Minimum 2 years of experience',
            'Good communication skills',
            'Ability to work in shifts',
            'Valid passport and work permit'
          ],
          benefits: [
            'Health insurance',
            'Paid leave',
            'Accommodation provided',
            'Transportation allowance'
          ],
          skills: [
            'Customer service',
            'Team work',
            'Time management',
            'Problem solving'
          ],
          status: ['DRAFT', 'OPEN', 'CLOSED'][Math.floor(Math.random() * 3)],
          verified: Math.random() > 0.3,
          featured: Math.random() > 0.7
        });
        
        // Set open date for jobs with status OPEN
        if (job.status === 'OPEN') {
          job.openDate = new Date();
          await job.save();
        }
        
        jobs.push(job);
        console.log(`Created job "${job.title}" for sponsor ${sponsor._id}`);
      }
    }
    
    return jobs;
  } catch (error) {
    console.error('Error creating sample jobs:', error);
    throw error;
  }
};

/**
 * Create sample applications
 * @param {Array} users User objects
 * @param {Array} jobs Job objects
 * @param {Array} documents Document objects
 * @returns {Promise<Array>} Created applications
 */
const createSampleApplications = async (users, jobs, documents) => {
  try {
    const applications = [];
    const jobSeekers = users.filter(user => user.role === 'jobSeeker');
    const openJobs = jobs.filter(job => job.status === 'OPEN');
    
    if (jobSeekers.length === 0 || openJobs.length === 0) {
      console.log('No job seekers or open jobs found to create applications');
      return [];
    }
    
    // Application statuses (excluding WITHDRAWN)
    const statuses = ['PENDING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'ACCEPTED', 'REJECTED'];
    
    // Create applications for job seekers
    for (const jobSeeker of jobSeekers) {
      // Get documents for this job seeker
      const userDocuments = documents.filter(doc => doc.userId.toString() === jobSeeker._id.toString());
      
      // Apply to 1-3 jobs
      const applyCount = Math.min(Math.floor(Math.random() * 3) + 1, openJobs.length);
      const selectedJobs = [];
      
      for (let i = 0; i < applyCount; i++) {
        // Select a job randomly from open jobs that hasn't been selected yet
        let job;
        do {
          job = openJobs[Math.floor(Math.random() * openJobs.length)];
        } while (selectedJobs.includes(job._id.toString()));
        
        selectedJobs.push(job._id.toString());
        
        // Select a random status
        const statusIndex = Math.floor(Math.random() * statuses.length);
        
        // Create application
        const application = await Application.create({
          jobId: job._id,
          jobSeekerId: jobSeeker._id,
          status: statuses[statusIndex],
          documents: userDocuments.map(doc => doc._id),
          coverLetter: `I am writing to express my interest in the ${job.title} position. With my skills and experience, I believe I am a strong candidate for this role.`,
          expectedSalary: {
            amount: job.salary.amount + Math.floor(Math.random() * 500),
            currency: job.salary.currency
          },
          verificationStatus: {
            complete: userDocuments.length > 0,
            pendingDocuments: [],
            verifiedDocuments: userDocuments
              .filter(doc => doc.status === 'VERIFIED')
              .map(doc => doc.type),
            rejectedDocuments: userDocuments
              .filter(doc => doc.status === 'REJECTED')
              .map(doc => doc.type)
          }
        });
        
        // Update job application count
        await Job.findByIdAndUpdate(job._id, {
          $inc: { applicationCount: 1 }
        });
        
        // Update document applications array
        for (const docId of application.documents) {
          await Document.findByIdAndUpdate(docId, {
            $push: { applications: application._id }
          });
        }
        
        applications.push(application);
        console.log(`Created application for job "${job.title}" by job seeker ${jobSeeker._id}`);
      }
    }
    
    return applications;
  } catch (error) {
    console.error('Error creating sample applications:', error);
    throw error;
  }
};

/**
 * Create sample payments for applications
 * @param {Array} applications Application objects
 * @returns {Promise<Array>} Created payments
 */
const createSamplePayments = async (applications) => {
  try {
    const payments = [];
    
    // Only create payments for applications with status ACCEPTED
    const acceptedApplications = applications.filter(app => app.status === 'ACCEPTED');
    
    if (acceptedApplications.length === 0) {
      console.log('No accepted applications found to create payments');
      return [];
    }
    
    for (const application of acceptedApplications) {
      const job = await Job.findById(application.jobId);
      
      // Create payment
      const payment = await Payment.create({
        amount: job.salary.amount,
        currency: job.salary.currency,
        type: 'ESCROW',
        status: ['PENDING', 'COMPLETED', 'RELEASED'][Math.floor(Math.random() * 3)],
        payerId: job.sponsorId,
        payeeId: application.jobSeekerId,
        applicationId: application._id,
        jobId: job._id,
        paymentMethod: ['CREDIT_CARD', 'BANK_TRANSFER'][Math.floor(Math.random() * 2)],
        description: `Payment for ${job.title} position`,
        platformFee: {
          amount: job.salary.amount * 0.05,
          percentage: 5
        }
      });
      
      // Update application payment info
      await Application.findByIdAndUpdate(application._id, {
        'payment.escrowId': payment._id,
        'payment.status': payment.status
      });
      
      payments.push(payment);
      console.log(`Created payment for application ${application._id}`);
    }
    
    return payments;
  } catch (error) {
    console.error('Error creating sample payments:', error);
    throw error;
  }
};

/**
 * Create sample notifications
 * @param {Array} users User objects
 * @param {Array} applications Application objects
 * @param {Array} documents Document objects
 * @param {Array} payments Payment objects
 * @returns {Promise<Array>} Created notifications
 */
const createSampleNotifications = async (users, applications, documents, payments) => {
  try {
    const notifications = [];
    
    // Create application notifications
    for (const application of applications) {
      const job = await Job.findById(application.jobId);
      
      // Create notification for job seeker
      const notification = await Notification.createApplicationStatusNotification(
        application.jobSeekerId,
        application._id,
        application.status,
        job.title
      );
      
      notifications.push(notification);
      
      // Create notification for sponsor
      if (['SHORTLISTED', 'INTERVIEW', 'OFFERED', 'ACCEPTED'].includes(application.status)) {
        const sponsorNotification = await Notification.create({
          userId: job.sponsorId,
          type: 'APPLICATION',
          title: `Application ${application.status}`,
          message: `An application for ${job.title} has been ${application.status.toLowerCase()}.`,
          entityId: application._id,
          entityType: 'Application',
          actionLabel: 'View Application',
          actionUrl: `/applications/${application._id}`,
          priority: application.status === 'ACCEPTED' ? 'HIGH' : 'NORMAL'
        });
        
        notifications.push(sponsorNotification);
      }
    }
    
    // Create document notifications
    for (const document of documents) {
      if (document.status !== 'PENDING') {
        const notification = await Notification.createDocumentVerificationNotification(
          document.userId,
          document._id,
          document.type,
          document.status,
          document.status === 'REJECTED' ? 'Document quality issue' : null
        );
        
        notifications.push(notification);
      }
    }
    
    // Create payment notifications
    for (const payment of payments) {
      if (payment.status !== 'PENDING') {
        // Notification for payer
        const payerNotification = await Notification.createPaymentNotification(
          payment.payerId,
          payment._id,
          payment.status,
          payment.amount,
          payment.currency
        );
        
        notifications.push(payerNotification);
        
        // Notification for payee if released
        if (payment.status === 'RELEASED') {
          const payeeNotification = await Notification.createPaymentNotification(
            payment.payeeId,
            payment._id,
            payment.status,
            payment.amount,
            payment.currency
          );
          
          notifications.push(payeeNotification);
        }
      }
    }
    
    console.log(`Created ${notifications.length} notifications`);
    return notifications;
  } catch (error) {
    console.error('Error creating sample notifications:', error);
    throw error;
  }
};

/**
 * Run the complete seed data process
 * @returns {Promise<Object>} Results of seeding process
 */
const seedAll = async () => {
  try {
    console.log('Starting database seed process...');
    
    // Create admin user
    const admin = await createAdminUser();
    
    // Create test users
    const users = await createTestUsers();
    users.push(admin);
    
    // Create documents for users
    const documents = await createSampleDocuments(users);
    
    // Create jobs
    const jobs = await createSampleJobs(users);
    
    // Create applications
    const applications = await createSampleApplications(users, jobs, documents);
    
    // Create payments
    const payments = await createSamplePayments(applications);
    
    // Create notifications
    const notifications = await createSampleNotifications(users, applications, documents, payments);
    
    console.log('Database seed process completed successfully');
    
    return {
      users: users.length,
      documents: documents.length,
      jobs: jobs.length,
      applications: applications.length,
      payments: payments.length,
      notifications: notifications.length
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

/**
 * Clean all seed data (for testing)
 * @returns {Promise<Object>} Results of cleaning process
 */
const cleanSeedData = async () => {
  try {
    console.log('Cleaning seed data...');
    
    // Keep admin user but remove test users
    const deleteUsers = await User.deleteMany({
      email: { $ne: 'admin@thiqax.com' }
    });
    
    // Delete all other data
    const deleteDocuments = await Document.deleteMany({});
    const deleteJobs = await Job.deleteMany({});
    const deleteApplications = await Application.deleteMany({});
    const deletePayments = await Payment.deleteMany({});
    const deleteNotifications = await Notification.deleteMany({});
    
    console.log('Seed data cleaning completed');
    
    return {
      users: deleteUsers.deletedCount,
      documents: deleteDocuments.deletedCount,
      jobs: deleteJobs.deletedCount,
      applications: deleteApplications.deletedCount,
      payments: deletePayments.deletedCount,
      notifications: deleteNotifications.deletedCount
    };
  } catch (error) {
    console.error('Error cleaning seed data:', error);
    throw error;
  }
};

module.exports = {
  createAdminUser,
  createTestUsers,
  createSampleDocuments,
  createSampleJobs,
  createSampleApplications,
  createSamplePayments,
  createSampleNotifications,
  seedAll,
  cleanSeedData
};
