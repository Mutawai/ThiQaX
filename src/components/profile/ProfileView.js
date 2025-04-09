import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const ProfileView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  
  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [navigate, user]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // This would be actual API calls in production
        // const profileData = await profileService.getUserProfile(user.id);
        // const userDocuments = await documentService.getUserDocuments(user.id);
        
        // Mock profile data
        const mockProfile = {
          id: user.id,
          firstName: 'John',
          lastName: 'Doe',
          profileImage: 'https://via.placeholder.com/150',
          dateOfBirth: '1990-01-15',
          gender: 'male',
          nationalId: 'KE123456789',
          passportNumber: 'KE9876543',
          nationality: 'Kenyan',
          
          email: 'john.doe@example.com',
          phone: '+254712345678',
          alternativePhone: '+254723456789',
          address: '123 Main Street',
          city: 'Nairobi',
          county: 'Nairobi County',
          country: 'Kenya',
          postalCode: '00100',
          
          educationLevel: 'Bachelor\'s Degree',
          institution: 'University of Nairobi',
          fieldOfStudy: 'Computer Science',
          graduationYear: 2015,
          
          previousEmployer: 'Kenyan Hospitality Services',
          jobTitle: 'House Helper',
          employmentStartDate: '2018-03-01',
          employmentEndDate: '2022-02-28',
          jobDescription: 'Provided cleaning and cooking services for a family of four.',
          
          emergencyContactName: 'Jane Doe',
          emergencyContactRelationship: 'Sister',
          emergencyContactPhone: '+254723456789',
          
          skillsText: 'Customer Service, Cleaning, Cooking, Communication, Problem Solving, Time Management',
          languagesText: 'English (Fluent), Swahili (Native), Arabic (Basic)',
          
          profileComplete: true,
          kycVerified: true,
          
          createdAt: '2025-01-10T09:30:00Z',
          updatedAt: '2025-03-15T14:20:00Z'
        };
        
        // Mock documents
        const mockDocuments = [
          {
            id: 'doc1',
            name: 'Passport',
            type: 'passport',
            category: 'identity',
            status: 'verified',
            uploadDate: '2025-02-10T14:20:00Z',
            verificationDate: '2025-02-15T09:30:00Z',
            thumbnailUrl: 'https://via.placeholder.com/100x140'
          },
          {
            id: 'doc2',
            name: 'Bachelor\'s Degree',
            type: 'degree',
            category: 'education',
            status: 'verified',
            uploadDate: '2025-02-18T13:30:00Z',
            verificationDate: '2025-02-20T11:45:00Z',
            thumbnailUrl: 'https://via.placeholder.com/100x140'
          },
          {
            id: 'doc3',
            name: 'Resume',
            type: 'resume',
            category: 'professional',
            status: 'verified',
            uploadDate: '2025-02-28T09:45:00Z',
            verificationDate: '2025-03-01T16:20:00Z',
            thumbnailUrl: 'https://via.placeholder.com/100x140'
          }
        ];
        
        // Parse skills and languages
        const skillsArray = mockProfile.skillsText.split(',').map(skill => skill.trim());
        const languagesArray = mockProfile.languagesText.split(',').map(language => {
          const parts = language.trim().match(/(.+)\s*\((.+)\)/);
          if (parts) {
            return {
              name: parts[1].trim(),
              level: parts[2].trim()
            };
          }
          return {
            name: language.trim(),
            level: 'Conversational'
          };
        });
        
        setProfile(mockProfile);
        setDocuments(mockDocuments);
        setSkills(skillsArray);
        setLanguages(languagesArray);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load profile data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Get document status badge
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-700">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Profile Not Found!</strong>
          <span className="block sm:inline"> Please complete your profile.</span>
          <button
            onClick={() => navigate('/profile/edit')}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        
        <Link
          to="/profile/edit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
          </svg>
          Edit Profile
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="bg-blue-700 px-6 py-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={profile.profileImage}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold">{profile.firstName} {profile.lastName}</h2>
              <p className="text-blue-200">{profile.nationality}</p>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>{profile.city}, {profile.country}</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  <span>{profile.educationLevel}</span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center">
                {profile.profileComplete && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-800 mr-2">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    Profile Complete
                  </span>
                )}
                
                {profile.kycVerified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    KYC Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-gray-800">{profile.firstName} {profile.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <p className="text-gray-800">{formatDate(profile.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Gender</p>
                      <p className="text-gray-800">{profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : profile.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nationality</p>
                      <p className="text-gray-800">{profile.nationality}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">National ID</p>
                      <p className="text-gray-800">{profile.nationalId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Passport Number</p>
                      <p className="text-gray-800">{profile.passportNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-800">{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone Number</p>
                      <p className="text-gray-800">{profile.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Alternative Phone</p>
                      <p className="text-gray-800">{profile.alternativePhone || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-gray-800">
                        {profile.address}, {profile.city}, {profile.county}, {profile.country}, {profile.postalCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Education & Employment */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Education & Employment</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-700 mb-2">Education</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Highest Education Level</p>
                        <p className="text-gray-800">{profile.educationLevel}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Institution</p>
                        <p className="text-gray-800">{profile.institution}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Field of Study</p>
                        <p className="text-gray-800">{profile.fieldOfStudy}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Graduation Year</p>
                        <p className="text-gray-800">{profile.graduationYear}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">Employment History</h4>
                    {profile.previousEmployer ? (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Previous Employer</p>
                            <p className="text-gray-800">{profile.previousEmployer}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Job Title</p>
                            <p className="text-gray-800">{profile.jobTitle}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Employment Period</p>
                            <p className="text-gray-800">
                              {formatDate(profile.employmentStartDate)} - {profile.employmentEndDate ? formatDate(profile.employmentEndDate) : 'Present'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-500">Job Description</p>
                          <p className="text-gray-800">{profile.jobDescription}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">No previous employment information available.</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Emergency Contact */}
              <div className="mb-8 lg:mb-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
   
