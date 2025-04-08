// utils/generate-test-data.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for test data generation');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

// Import all models
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Document = require('../src/models/Document');
const Job = require('../src/models/Job');
const Application = require('../src/models/Application');
const Notification = require('../src/models/Notification');

// Sample data arrays
const jobSeekerNames = [
  'James Kamau', 'Mary Wangari', 'John Ochieng', 'Jane Adhiambo', 
  'Michael Kiprop', 'Elizabeth Chepkorir', 'David Mwangi', 'Sarah Njeri',
  'Daniel Otieno', 'Ruth Akinyi', 'Joseph Maina', 'Grace Wambui',
  'Peter Njoroge', 'Esther Wanjiku', 'Samuel Kiprono', 'Faith Wangeci'
];

const agentNames = [
  'Alex Recruitment Services', 'Global Staffing Solutions', 
  'Kenya Placements Ltd', 'Professional Careers International',
  'JobLink Middle East'
];

const sponsorNames = [
  'Al Maha Hospitality Group', 'Gulf Engineering Services',
  'Royal Medical Center', 'Emirates Construction Corporation',
  'International Trading Company'
];

const jobTitles = [
  'Housekeeping Staff', 'Security Guard', 'Domestic Worker',
  'Restaurant Server', 'Cleaner', 'Construction Worker',
  'Hotel Receptionist', 'Nursing Assistant', 'Retail Sales Associate',
  'Driver', 'Chef Assistant', 'Warehouse Worker'
];

const locations = [
  'Dubai, UAE', 'Riyadh, Saudi Arabia', 'Doha, Qatar',
  'Abu Dhabi, UAE', 'Kuwait City, Kuwait', 'Manama, Bahrain',
  'Muscat, Oman', 'Jeddah, Saudi Arabia'
];

const skills = [
  'Customer Service', 'Communication', 'Basic English',
  'Driving', 'Cooking', 'Cleaning', 'Security Procedures',
  'Childcare', 'Healthcare Support', 'Hospitality', 'Retail',
  'Food Preparation', 'Patient Care', 'Elder Care'
];

const documentTypes = [
  'passport', 'nationalId', 'drivingLicense', 'resume',
  'educationCertificate', 'experienceCertificate'
];

// Helper functions
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate test users
async function generateUsers() {
  console.log('Generating users...');
  
  // Create job seekers
  const jobSeekers = [];
  for (const name of jobSeekerNames) {
    const email = name.toLowerCase().replace(' ', '.') + '@example.com';
    const password = await bcrypt.hash('password123', 10);
    
    const user = await User.create({
      name,
      email,
      role: 'jobSeeker',
      password,
      profileComplete: Math.random() > 0.3, // 70% complete profiles
      kycVerified: Math.random() > 0.5 // 50% verified
    });
    
    jobSeekers.push(user);
  }
  
  // Create agents
  const agents = [];
  for (const name of agentNames) {
    const email = name.toLowerCase().replace(/\s+/g, '') + '@example.com';
    const password = await bcrypt.hash('password123', 10);
    
    const user = await User.create({
      name,
      email,
      role: 'agent',
      password,
      profileComplete: true,
      kycVerified: true
    });
    
    agents.push(user);
  }
  
  // Create sponsors
  const sponsors = [];
  for (const name of sponsorNames) {
    const email = name.toLowerCase().replace(/\s+/g, '') + '@example.com';
    const password = await bcrypt.hash('password123', 10);
    
    const user = await User.create({
      name,
      email,
      role: 'sponsor',
      password,
      profileComplete: true,
      kycVerified: true
    });
    
    sponsors.push(user);
  }
  
  console.log(`Created ${jobSeekers.length} job seekers`);
  console.log(`Created ${agents.length} agents`);
  console.log(`Created ${sponsors.length} sponsors`);
  
  return { jobSeekers, agents, sponsors };
}

// Generate profiles for users
async function generateProfiles(users) {
  console.log('Generating profiles...');
  
  const { jobSeekers, agents, sponsors } = users;
  
  // Create job seeker profiles
  for (const user of jobSeekers) {
    const isComplete = user.profileComplete;
    
    const profile = {
      user: user._id,
      personalInfo: {
        fullName: user.name,
        dob: getRandomDate(new Date(1985, 0, 1), new Date(2000, 0, 1)),
        nationality: 'Kenyan',
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        maritalStatus: getRandomItem(['Single', 'Married', 'Divorced']),
        phoneNumber: '+254' + Math.floor(700000000 + Math.random() * 99999999),
        address: {
          city: getRandomItem(['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret']),
          country: 'Kenya'
        }
      },
      completionStatus: {
        personal: true,
        professional: isComplete,
        preferences: isComplete
      }
    };
    
    if (isComplete) {
      profile.professionalInfo = {
        title: getRandomItem(jobTitles),
        skills: getRandomItems(skills, Math.floor(3 + Math.random() * 5)),
        experience: [
          {
            title: getRandomItem(jobTitles),
            company: getRandomItem(['ABC Company', 'XYZ Ltd', 'Local Business', 'Family Business']),
            location: 'Kenya',
            from: getRandomDate(new Date(2015, 0, 1), new Date(2018, 0, 1)),
            to: getRandomDate(new Date(2019, 0, 1), new Date(2023, 0, 1)),
            current: false,
            description: 'Worked in this position handling various responsibilities.'
          }
        ],
        education: [
          {
            institution: getRandomItem(['Nairobi University', 'Kenyatta University', 'Moi University', 'Local College']),
            degree: getRandomItem(['High School Diploma', 'Certificate', 'Diploma']),
            fieldOfStudy: getRandomItem(['General Education', 'Hospitality', 'Technical Training']),
            from: getRandomDate(new Date(2010, 0, 1), new Date(2015, 0, 1)),
            to: getRandomDate(new Date(2012, 0, 1), new Date(2018, 0, 1)),
            current: false
          }
        ]
      };
      
      profile.preferencesInfo = {
        jobTypes: getRandomItems(['FULL_TIME', 'CONTRACT', 'TEMPORARY'], Math.floor(1 + Math.random() * 2)),
        locations: getRandomItems(locations, Math.floor(2 + Math.random() * 3)),
        industries: getRandomItems(['Hospitality', 'Healthcare', 'Construction', 'Retail', 'Security'], Math.floor(1 + Math.random() * 3)),
        minSalary: Math.floor(300 + Math.random() * 700) * 10,
        currency: 'USD'
      };
    }
    
    await Profile.create(profile);
  }
  
  // Create agent profiles
  for (const user of agents) {
    await Profile.create({
      user: user._id,
      personalInfo: {
        fullName: user.name,
        phoneNumber: '+254' + Math.floor(700000000 + Math.random() * 99999999),
        address: {
          city: getRandomItem(['Nairobi', 'Mombasa', 'Kisumu']),
          country: 'Kenya'
        }
      },
      professionalInfo: {
        title: 'Recruitment Agent',
        skills: ['Recruitment', 'Candidate Screening', 'Documentation']
      },
      completionStatus: {
        personal: true,
        professional: true,
        preferences: true
      }
    });
  }
  
  // Create sponsor profiles
  for (const user of sponsors) {
    await Profile.create({
      user: user._id,
      personalInfo: {
        fullName: user.name,
        phoneNumber: '+971' + Math.floor(500000000 + Math.random() * 99999999),
        address: {
          city: getRandomItem(['Dubai', 'Abu Dhabi', 'Riyadh', 'Doha']),
          country: getRandomItem(['UAE', 'Saudi Arabia', 'Qatar'])
        }
      },
      professionalInfo: {
        title: 'Employer',
        industry: getRandomItem(['Hospitality', 'Healthcare', 'Construction', 'Retail'])
      },
      completionStatus: {
        personal: true,
        professional: true,
        preferences: true
      }
    });
  }
  
  console.log(`Created profiles for all users`);
}

// Generate documents for job seekers
async function generateDocuments(users) {
  console.log('Generating documents...');
  
  const { jobSeekers } = users;
  const documents = [];
  
  for (const user of jobSeekers) {
    // Create 2-4 documents per job seeker
    const numDocs = 2 + Math.floor(Math.random() * 3);
    const userDocTypes = getRandomItems(documentTypes, numDocs);
    
    for (const type of userDocTypes) {
      let title, description;
      
      switch (type) {
        case 'passport':
          title = 'Kenyan Passport';
          description = 'International passport issued by Kenya';
          break;
        case 'nationalId':
          title = 'National ID Card';
          description = 'Kenyan national identification card';
          break;
        case 'drivingLicense':
          title = 'Driving License';
          description = 'Kenyan driving license';
          break;
        case 'resume':
          title = 'Curriculum Vitae';
          description = 'Professional resume with work history';
          break;
        case 'educationCertificate':
          title = getRandomItem(['High School Certificate', 'Diploma Certificate', 'Training Certificate']);
          description = 'Educational qualification certificate';
          break;
        case 'experienceCertificate':
          title = 'Work Experience Certificate';
          description = 'Certificate of previous employment';
          break;
      }
      
      const isExpirable = ['passport', 'nationalId', 'drivingLicense'].includes(type);
      const issuedDate = isExpirable ? getRandomDate(new Date(2018, 0, 1), new Date(2022, 0, 1)) : null;
      const expiryDate = isExpirable ? new Date(issuedDate.getTime() + (3 + Math.random() * 7) * 365 * 24 * 60 * 60 * 1000) : null;
      
      const verificationStatus = Math.random() > 0.3 ? 'VERIFIED' : (Math.random() > 0.5 ? 'PENDING' : 'REJECTED');
      const verificationDate = verificationStatus !== 'PENDING' ? new Date() : null;
      
      const document = await Document.create({
        user: user._id,
        type,
        title,
        description,
        fileUrl: `https://storage.thiqax.com/documents/${user._id}/${type}`,
        mimeType: 'application/pdf',
        fileSize: Math.floor(100000 + Math.random() * 900000),
        issuedDate,
        expiryDate,
        issuingAuthority: type === 'passport' ? 'Immigration Department' : (
          type === 'nationalId' ? 'National Registration Bureau' : 'Relevant Authority'
        ),
        documentNumber: `DOC${Math.floor(10000 + Math.random() * 90000)}`,
        verificationStatus,
        verificationDate,
        rejectionReason: verificationStatus === 'REJECTED' ? 'Document unclear or invalid' : null
      });
      
      documents.push(document);
    }
  }
  
  console.log(`Created ${documents.length} documents`);
  return documents;
}

// Generate jobs
async function generateJobs(users) {
  console.log('Generating jobs...');
  
  const { agents, sponsors } = users;
  const jobs = [];
  
  // Each sponsor creates 2-4 jobs
  for (const sponsor of sponsors) {
    const numJobs = 2 + Math.floor(Math.random() * 3);
    const agent = getRandomItem(agents);
    
    for (let i = 0; i < numJobs; i++) {
      const title = getRandomItem(jobTitles);
      const location = getRandomItem(locations);
      const jobStatus = Math.random() > 0.2 ? 'PUBLISHED' : (Math.random() > 0.5 ? 'DRAFT' : 'CLOSED');
      const salaryMin = Math.floor(300 + Math.random() * 500) * 10;
      const salaryMax = salaryMin + Math.floor(100 + Math.random() * 300) * 10;
      
      const job = await Job.create({
        title,
        description: `We are looking for a ${title} to join our team in ${location}. This is a great opportunity for motivated individuals.`,
        responsibilities: [
          'Perform daily duties related to the role',
          'Maintain high standards of service',
          'Follow company procedures and policies',
          'Report to the supervisor regularly'
        ],
        requirements: [
          'Previous experience in a similar role',
          'Basic English communication skills',
          'Ability to work in shifts',
          'Relevant certifications (if applicable)'
        ],
        location: location.split(',')[0].trim(),
        country: location.split(',')[1].trim(),
        salary: {
          min: salaryMin,
          max: salaryMax,
          currency: 'USD',
          isNegotiable: Math.random() > 0.7
        },
        jobType: getRandomItem(['FULL_TIME', 'CONTRACT', 'TEMPORARY']),
        industry: getRandomItem(['Hospitality', 'Healthcare', 'Construction', 'Retail', 'Security']),
        experienceLevel: getRandomItem(['ENTRY_LEVEL', 'INTERMEDIATE', 'MID_LEVEL']),
        educationLevel: getRandomItem(['HIGH_SCHOOL', 'ASSOCIATES_DEGREE', 'ANY']),
        skills: getRandomItems(skills, 3 + Math.floor(Math.random() * 5)),
        benefits: [
          'Accommodation provided',
          'Transportation arranged',
          'Medical insurance',
          'Annual return ticket'
        ],
        applicationDeadline: getRandomDate(new Date(), new Date(new Date().setMonth(new Date().getMonth() + 3))),
        sponsor: sponsor._id,
        agent: agent._id,
        status: jobStatus,
        isVerified: jobStatus === 'PUBLISHED',
        verificationDate: jobStatus === 'PUBLISHED' ? new Date() : null,
        createdAt: getRandomDate(new Date(new Date().setMonth(new Date().getMonth() - 2)), new Date())
      });
      
      jobs.push(job);
    }
  }
  
  console.log(`Created ${jobs.length} jobs`);
  return jobs;
}

// Generate applications
async function generateApplications(users, jobs, documents) {
  console.log('Generating applications...');
  
  const { jobSeekers } = users;
  const applications = [];
  
  // Only published jobs can receive applications
  const publishedJobs = jobs.filter(job => job.status === 'PUBLISHED');
  
  // Generate applications
  for (const job of publishedJobs) {
    // 3-7 applications per job
    const numApplications = 3 + Math.floor(Math.random() * 5);
    const randomApplicants = getRandomItems(jobSeekers, numApplications);
    
    for (const applicant of randomApplicants) {
      // Get verified documents for this applicant
      const applicantDocs = documents.filter(
        doc => doc.user.toString() === applicant._id.toString() && doc.verificationStatus === 'VERIFIED'
      );
      
      // If no verified documents, skip this application
      if (applicantDocs.length === 0) continue;
      
      const applicationStatus = getRandomItem([
        'APPLIED', 'APPLIED', 'APPLIED', // Higher weight for APPLIED
        'REVIEWING', 'REVIEWING',
        'INTERVIEW', 'SELECTED', 'REJECTED'
      ]);
      
      const application = await Application.create({
        job: job._id,
        applicant: applicant._id,
        status: applicationStatus,
        coverLetter: `Dear Hiring Manager,\n\nI am interested in the ${job.title} position in ${job.location}. I have relevant experience and am eager to work in this role.\n\nThank you for considering my application.\n\nSincerely,\n${applicant.name}`,
        documents: applicantDocs.map(doc => doc._id),
        history: [
          {
            status: 'APPLIED',
            changedAt: getRandomDate(new Date(new Date().setMonth(new Date().getMonth() - 1)), new Date(new Date().setDate(new Date().getDate() - 7))),
            note: 'Application submitted'
          }
        ],
        createdAt: getRandomDate(new Date(new Date().setMonth(new Date().getMonth() - 1)), new Date())
      });
      
      // Add status history if not just 'APPLIED'
      if (applicationStatus !== 'APPLIED') {
        await Application.findByIdAndUpdate(application._id, {
          $push: {
            history: {
              status: applicationStatus,
              changedAt: new Date(),
              note: `Status updated to ${applicationStatus}`
            }
          }
        });
      }
      
      // Update job applications count
      await Job.findByIdAndUpdate(job._id, {
        $inc: { applicationsCount: 1 }
      });
      
      applications.push(application);
    }
  }
  
  console.log(`Created ${applications.length} applications`);
  return applications;
}

// Generate notifications
async function generateNotifications(users, applications, documents) {
  console.log('Generating notifications...');
  
  const notifications = [];
  
  // Create document verification notifications
  for (const doc of documents) {
    if (doc.verificationStatus !== 'PENDING') {
      const status = doc.verificationStatus === 'VERIFIED' ? 'verified' : 'rejected';
      
      await Notification.create({
        recipient: doc.user,
        type: 'DOCUMENT_VERIFICATION',
        title: `Document ${status}`,
        message: `Your document "${doc.title}" has been ${status}.${doc.verificationStatus === 'REJECTED' ? ' Reason: ' + doc.rejectionReason : ''}`,
        relatedTo: {
          model: 'Document',
          id: doc._id
        },
        isRead: Math.random() > 0.5,
        createdAt: doc.verificationDate
      });
    }
  }
  
  // Create application status notifications
  for (const application of applications) {
    if (application.status !== 'APPLIED') {
      const job = await Job.findById(application.job);
      
      await Notification.create({
        recipient: application.applicant,
        type: 'APPLICATION_STATUS',
        title: 'Application status updated',
        message: `Your application for "${job.title}" has been updated to ${application.status}.`,
        relatedTo: {
          model: 'Application',
          id: application._id
        },
        isRead: Math.random() > 0.7,
        createdAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 7)))
      });
    }
  }
  
  // Create system notifications
  const { jobSeekers } = users;
  for (const user of jobSeekers) {
    // Get profile for this user
    const profile = await Profile.findOne({ user: user._id });
    
    if (profile && !profile.completionStatus.professional) {
      await Notification.create({
        recipient: user._id,
        type: 'PROFILE_COMPLETION',
        title: 'Complete your profile',
        message: 'Please complete your professional information to improve your job prospects.',
        relatedTo: {
          model: 'Profile',
          id: profile._id
        },
        isRead: false,
        createdAt: getRandomDate(new Date(new Date().setDate(new Date().getDate() - 14)), new Date())
      });
    }
    
    // Create random job alerts for some users
    if (Math.random() > 0.7) {
      await Notification.create({
        recipient: user._id,
        type: 'JOB_ALERT',
        title: 'New jobs matching your profile',
        message: 'We found new job opportunities that match your skills and preferences.',
        isRead: Math.random() > 0.3,
        createdAt: getRandomDate(new Date(new Date().setDate(new Date().getDate() - 10)), new Date())
      });
    }
    
    // Create system updates
    if (Math.random() > 0.8) {
      await Notification.create({
        recipient: user._id,
        type: 'SYSTEM_NOTIFICATION',
        title: 'Welcome to ThiQaX Platform',
        message: 'Thank you for joining ThiQaX, the trusted platform for Middle Eastern recruitment. Complete your profile to start applying for jobs.',
        isRead: true,
        createdAt: getRandomDat
