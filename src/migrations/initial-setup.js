// migrations/initial-setup.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for migration');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

// Define schemas for collections that need to be created
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  role: {
    type: String,
    enum: ['jobSeeker', 'agent', 'sponsor', 'admin'],
    default: 'jobSeeker'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  kycVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalInfo: {
    fullName: String,
    dob: Date,
    nationality: String,
    gender: String,
    maritalStatus: String,
    phoneNumber: String,
    altPhoneNumber: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  professionalInfo: {
    title: String,
    skills: [String],
    experience: [
      {
        title: String,
        company: String,
        location: String,
        from: Date,
        to: Date,
        current: Boolean,
        description: String
      }
    ],
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        from: Date,
        to: Date,
        current: Boolean
      }
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        dateObtained: Date,
        expiryDate: Date
      }
    ]
  },
  preferencesInfo: {
    jobTypes: [String],
    locations: [String],
    industries: [String],
    minSalary: Number,
    currency: String
  },
  completionStatus: {
    personal: Boolean,
    professional: Boolean,
    preferences: Boolean
  }
});

const DocumentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'passport',
      'nationalId',
      'drivingLicense',
      'resume',
      'educationCertificate',
      'experienceCertificate',
      'professionalCertificate',
      'other'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  fileUrl: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  issuedDate: Date,
  expiryDate: Date,
  issuingAuthority: String,
  documentNumber: String,
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING'
  },
  verificationDate: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a job description']
  },
  responsibilities: [String],
  requirements: [String],
  location: {
    type: String,
    required: [true, 'Please add a job location']
  },
  country: {
    type: String,
    required: [true, 'Please add a country']
  },
  salary: {
    min: Number,
    max: Number,
    currency: String,
    isNegotiable: Boolean
  },
  jobType: {
    type: String,
    enum: [
      'FULL_TIME',
      'PART_TIME',
      'CONTRACT',
      'TEMPORARY',
      'INTERNSHIP'
    ],
    required: true
  },
  industry: String,
  experienceLevel: {
    type: String,
    enum: [
      'ENTRY_LEVEL',
      'INTERMEDIATE',
      'MID_LEVEL',
      'SENIOR',
      'EXECUTIVE'
    ],
    required: true
  },
  educationLevel: {
    type: String,
    enum: [
      'HIGH_SCHOOL',
      'ASSOCIATES_DEGREE',
      'BACHELORS_DEGREE',
      'MASTERS_DEGREE',
      'DOCTORAL_DEGREE',
      'ANY'
    ]
  },
  skills: [String],
  benefits: [String],
  applicationDeadline: Date,
  sponsor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'FILLED'],
    default: 'DRAFT'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: Date,
  applicationsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const ApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: [
      'APPLIED',
      'REVIEWING',
      'INTERVIEW',
      'SELECTED',
      'REJECTED',
      'WITHDRAWN',
      'HIRED'
    ],
    default: 'APPLIED'
  },
  coverLetter: String,
  documents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }
  ],
  notes: [
    {
      text: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  history: [
    {
      status: {
        type: String,
        enum: [
          'APPLIED',
          'REVIEWING',
          'INTERVIEW',
          'SELECTED',
          'REJECTED',
          'WITHDRAWN',
          'HIRED'
        ]
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      changedAt: {
        type: Date,
        default: Date.now
      },
      note: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'APPLICATION_STATUS',
      'DOCUMENT_VERIFICATION',
      'PROFILE_COMPLETION',
      'JOB_ALERT',
      'SYSTEM_NOTIFICATION'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Job', 'Application', 'Document', 'User', 'Profile']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create models based on the schemas
const User = mongoose.model('User', UserSchema);
const Profile = mongoose.model('Profile', ProfileSchema);
const Document = mongoose.model('Document', DocumentSchema);
const Job = mongoose.model('Job', JobSchema);
const Application = mongoose.model('Application', ApplicationSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

// Create admin user
async function createAdminUser() {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@thiqax.com' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    
    const admin = await User.create({
      name: 'ThiQaX Admin',
      email: 'admin@thiqax.com',
      role: 'admin',
      password: hashedPassword,
      profileComplete: true,
      kycVerified: true
    });
    
    console.log('Admin user created:', admin.email);
    
    // Create admin profile
    await Profile.create({
      user: admin._id,
      personalInfo: {
        fullName: 'ThiQaX Administrator',
        phoneNumber: '+1234567890',
        address: {
          country: 'Kenya'
        }
      },
      completionStatus: {
        personal: true,
        professional: true,
        preferences: true
      }
    });
    
    console.log('Admin profile created');
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
}

// Create indexes for performance
async function createIndexes() {
  try {
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    
    await Profile.collection.createIndex({ user: 1 }, { unique: true });
    await Profile.collection.createIndex({ 'personalInfo.nationality': 1 });
    
    await Document.collection.createIndex({ user: 1 });
    await Document.collection.createIndex({ type: 1 });
    await Document.collection.createIndex({ verificationStatus: 1 });
    
    await Job.collection.createIndex({ sponsor: 1 });
    await Job.collection.createIndex({ agent: 1 });
    await Job.collection.createIndex({ status: 1 });
    await Job.collection.createIndex({ location: 1 });
    await Job.collection.createIndex({ jobType: 1 });
    await Job.collection.createIndex({ createdAt: -1 });
    
    await Application.collection.createIndex({ job: 1 });
    await Application.collection.createIndex({ applicant: 1 });
    await Application.collection.createIndex({ status: 1 });
    
    await Notification.collection.createIndex({ recipient: 1 });
    await Notification.collection.createIndex({ isRead: 1 });
    await Notification.collection.createIndex({ createdAt: -1 });
    
    console.log('Indexes created successfully');
  } catch (err) {
    console.error('Error creating indexes:', err);
  }
}

// Run the migration
async function runMigration() {
  try {
    await connectDB();
    await createAdminUser();
    await createIndexes();
    
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Execute the migration
runMigration();
