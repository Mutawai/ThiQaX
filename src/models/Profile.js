//Profile.js
const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Personal Information
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer not to say']
  },
  nationality: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  // Professional Details
  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    current: Boolean
  }],
  workExperience: [{
    company: String,
    position: String,
    description: String,
    startDate: Date,
    endDate: Date,
    current: Boolean
  }],
  skills: [String],
  languages: [{
    language: String,
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'native']
    }
  }],
  // Role-specific fields
  // Job Seeker specific
  preferredLocations: [String],
  salaryExpectation: {
    amount: Number,
    currency: String,
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly']
    }
  },
  jobTypes: [{
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship']
  }],
  // Agent specific
  agencyName: String,
  recruitmentSpecialties: [String],
  licensingInformation: {
    licenseNumber: String,
    issuingAuthority: String,
    expiryDate: Date,
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified'
    }
  },
  // Sponsor specific
  companyName: String,
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  industryType: String,
  companyWebsite: String,
  // Common fields
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  profilePicture: {
    url: String,
    publicId: String
  },
  profileCompletionFields: {
    type: [String],
    default: []
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Method to calculate profile completion percentage
ProfileSchema.methods.calculateCompletionPercentage = function() {
  // Define fields required for each role
  const requiredFields = {
    jobSeeker: [
      'fullName', 'dateOfBirth', 'gender', 'nationality', 'phoneNumber',
      'address', 'education', 'skills', 'languages', 'preferredLocations'
    ],
    agent: [
      'fullName', 'phoneNumber', 'address', 'agencyName',
      'recruitmentSpecialties', 'licensingInformation'
    ],
    sponsor: [
      'fullName', 'phoneNumber', 'companyName', 'companySize',
      'industryType', 'companyWebsite'
    ]
  };
  
  // Get user role from associated user document
  // This requires that the user document is populated
  if (!this.populated('user')) {
    return 0; // Cannot calculate without user role
  }
  
  const userRole = this.user.role || 'jobSeeker'; // Default to jobSeeker
  const fieldsToCheck = requiredFields[userRole] || requiredFields.jobSeeker;
  
  let completedFields = 0;
  
  // Check each required field
  fieldsToCheck.forEach(field => {
    if (field.includes('.')) {
      // Handle nested fields like 'address.city'
      const [parent, child] = field.split('.');
      if (this[parent] && this[parent][child]) {
        completedFields++;
      }
    } else if (Array.isArray(this[field])) {
      // Check if array fields have at least one entry
      if (this[field].length > 0) {
        completedFields++;
      }
    } else if (this[field]) {
      // Check if the field has a value
      completedFields++;
    }
  });
  
  // Calculate percentage
  return Math.round((completedFields / fieldsToCheck.length) * 100);
};

// Update the profileCompletionFields array before saving
ProfileSchema.pre('save', function(next) {
  // Similar logic to calculateCompletionPercentage, but store fields that are completed
  // This would be used to show users which fields they need to complete
  const allPossibleFields = [
    'fullName', 'dateOfBirth', 'gender', 'nationality', 'phoneNumber',
    'address', 'education', 'workExperience', 'skills', 'languages',
    'preferredLocations', 'salaryExpectation', 'jobTypes',
    'agencyName', 'recruitmentSpecialties', 'licensingInformation',
    'companyName', 'companySize', 'industryType', 'companyWebsite',
    'profilePicture'
  ];
  
  this.profileCompletionFields = allPossibleFields.filter(field => {
    if (Array.isArray(this[field])) {
      return this[field].length > 0;
    } else {
      return !!this[field];
    }
  });
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Profile', ProfileSchema);
