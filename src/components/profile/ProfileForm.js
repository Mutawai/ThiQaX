import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../auth/AuthProvider';

const ProfileForm = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  
  // Countries list for nationality and residence
  const countries = [
    { code: 'KE', name: 'Kenya' },
    { code: 'UG', name: 'Uganda' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'ET', name: 'Ethiopia' },
    // Add more countries as needed
  ];
  
  // Education levels
  const educationLevels = [
    { value: 'primary', label: 'Primary School' },
    { value: 'secondary', label: 'Secondary School' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'bachelors', label: 'Bachelors Degree' },
    { value: 'masters', label: 'Masters Degree' },
    { value: 'phd', label: 'PhD' }
  ];
  
  // Form validation schema
  const validationSchema = Yup.object({
    // Personal Information
    firstName: Yup.string()
      .required('First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters'),
    lastName: Yup.string()
      .required('Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters'),
    dateOfBirth: Yup.date()
      .required('Date of birth is required')
      .max(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), 'You must be at least 18 years old'),
    gender: Yup.string()
      .required('Gender is required')
      .oneOf(['male', 'female', 'other'], 'Invalid gender selection'),
    nationalId: Yup.string()
      .required('National ID is required')
      .min(5, 'National ID must be at least 5 characters')
      .max(20, 'National ID must not exceed 20 characters'),
    passportNumber: Yup.string()
      .min(5, 'Passport number must be at least 5 characters')
      .max(20, 'Passport number must not exceed 20 characters'),
    nationality: Yup.string()
      .required('Nationality is required'),
    
    // Contact Information
    email: Yup.string()
      .required('Email is required')
      .email('Invalid email format'),
    phone: Yup.string()
      .required('Phone number is required')
      .matches(/^\+?[0-9]{10,15}$/, 'Invalid phone number format'),
    alternativePhone: Yup.string()
      .matches(/^\+?[0-9]{10,15}$/, 'Invalid phone number format')
      .nullable(),
    address: Yup.string()
      .required('Address is required')
      .min(5, 'Address must be at least 5 characters'),
    city: Yup.string()
      .required('City is required'),
    county: Yup.string()
      .required('County/Region is required'),
    country: Yup.string()
      .required('Country is required'),
    postalCode: Yup.string()
      .required('Postal code is required'),
    
    // Education & Skills
    educationLevel: Yup.string()
      .required('Education level is required'),
    institution: Yup.string()
      .required('Institution is required'),
    fieldOfStudy: Yup.string()
      .required('Field of study is required'),
    graduationYear: Yup.number()
      .required('Graduation year is required')
      .min(1950, 'Graduation year must be after 1950')
      .max(new Date().getFullYear(), 'Graduation year cannot be in the future'),
    skills: Yup.string()
      .required('Skills are required'),
    languages: Yup.string()
      .required('Languages are required'),
    
    // Employment History
    previousEmployer: Yup.string(),
    jobTitle: Yup.string(),
    employmentStartDate: Yup.date(),
    employmentEndDate: Yup.date()
      .min(
        Yup.ref('employmentStartDate'),
        'End date must be after start date'
      )
      .nullable(),
    jobDescription: Yup.string(),
    
    // Emergency Contact
    emergencyContactName: Yup.string()
      .required('Emergency contact name is required'),
    emergencyContactRelationship: Yup.string()
      .required('Relationship is required'),
    emergencyContactPhone: Yup.string()
      .required('Emergency contact phone is required')
      .matches(/^\+?[0-9]{10,15}$/, 'Invalid phone number format'),
  });

  // Initialize form with user data if available
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        setLoading(true);
        
        // This would be an actual API call in production
        // const profileData = await profileService.getUserProfile(user.id);
        
        // Mock profile data for development
        const mockProfileData = {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-15',
          gender: 'male',
          nationalId: 'KE123456789',
          passportNumber: 'KE9876543',
          nationality: 'KE',
          
          email: 'john.doe@example.com',
          phone: '+254712345678',
          alternativePhone: '',
          address: '123 Main Street',
          city: 'Nairobi',
          county: 'Nairobi County',
          country: 'KE',
          postalCode: '00100',
          
          educationLevel: 'bachelors',
          institution: 'University of Nairobi',
          fieldOfStudy: 'Computer Science',
          graduationYear: 2015,
          skills: 'Customer Service, Cleaning, Cooking, Communication',
          languages: 'English, Swahili',
          
          previousEmployer: 'Kenyan Hospitality Services',
          jobTitle: 'House Helper',
          employmentStartDate: '2018-03-01',
          employmentEndDate: '2022-02-28',
          jobDescription: 'Provided cleaning and cooking services for a family of four.',
          
          emergencyContactName: 'Jane Doe',
          emergencyContactRelationship: 'Sister',
          emergencyContactPhone: '+254723456789',
          
          profileImage: null
        };
        
        // Set initial form values
        formik.setValues({
          ...formik.values,
          ...mockProfileData
        });
        
        // Set profile image preview if available
        if (mockProfileData.profileImage) {
          setProfileImagePreview(mockProfileData.profileImage);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load profile data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [navigate, user]);

  // Handle profile image upload
  const handleProfileImageChange = (event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setProfileImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Set field value for form submission
      formik.setFieldValue('profileImage', file);
    }
  };

  // Formik setup
  const formik = useFormik({
    initialValues: {
      // Personal Information
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      nationalId: '',
      passportNumber: '',
      nationality: '',
      
      // Contact Information
      email: '',
      phone: '',
      alternativePhone: '',
      address: '',
      city: '',
      county: '',
      country: '',
      postalCode: '',
      
      // Education & Skills
      educationLevel: '',
      institution: '',
      fieldOfStudy: '',
      graduationYear: '',
      skills: '',
      languages: '',
      
      // Employment History
      previousEmployer: '',
      jobTitle: '',
      employmentStartDate: '',
      employmentEndDate: '',
      jobDescription: '',
      
      // Emergency Contact
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      
      // Profile Image
      profileImage: null
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSaving(true);
        setError(null);
        
        // Create form data for file upload
        const formData = new FormData();
        
        // Add form values
        Object.keys(values).forEach(key => {
          if (key !== 'profileImage' || (key === 'profileImage' && values[key])) {
            formData.append(key, values[key]);
          }
        });
        
        // Add profile image if exists
        if (profileImage) {
          formData.append('profileImage', profileImage);
        }
        
        // This would be an actual API call in production
        // const response = await profileService.updateUserProfile(user.id, formData);
        
        // Simulate API call with delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update user in auth context
        updateProfile({ 
          ...user, 
          firstName: values.firstName,
          lastName: values.lastName,
          profileComplete: true
        });
        
        setSaving(false);
        setSuccessMessage('Profile updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (err) {
        setError(err.message || 'Failed to update profile. Please try again.');
        setSaving(false);
      }
    }
  });

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Complete Your Profile</h1>
        
        {error && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={formik.handleSubmit}>
          {/* Profile Image */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                {profileImagePreview ? (
                  <img 
                    src={profileImagePreview} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              <label
                htmlFor="profileImage"
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <input
                  id="profileImage"
                  name="profileImage"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                />
              </label>
            </div>
          </div>
          
          {/* Form Sections */}
          <div className="space-y-8">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name*
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formik.touched.firstName && formik.errors.firstName
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    {...formik.getFieldProps('firstName')}
                  />
                  {formik.touched.firstName && formik.errors.firstName && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name*
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formik.touched.lastName && formik.errors.lastName
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    {...formik.getFieldProps('lastName')}
                  />
                  {formik.touched.lastName && formik.errors.lastName && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.lastName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth*
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formik.touched.dateOfBirth && formik.errors.dateOfBirth
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    {...formik.getFieldProps('dateOfBirth')}
                  />
                  {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.dateOfBirth}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender*
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formik.touched.gender && formik.errors.gender
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    {...formik.getFieldProps('gender')}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {formik.touched.gender && formik.errors.gender && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.gender}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700">
                    National ID*
                  </label>
                  <input
                    id="nationalId"
                    name="nationalId"
                    type="text"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formik.touched.nationalId && formik.errors.nationalId
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    {...formik.getFieldProps('nationalId')}
                  />
                  {formik.touched.nationalId && formik.errors.nationalId && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.nationalId}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700">
                    Passport Number (if available)
                  </label>
                  <input
                    id="passportNumber"
                    name="passportNumber"
                    type="text"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formik.touched.passportNumber && formik.errors.passportNumber
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    {...formik.getFieldProps('passportNumber')}
                  />
                  {formik.touched.passportNumber && formik.errors.passportNumber && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.passportNumber}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                    Nationality*
                  </label>
                  <select
                    id="nationality"
                    name="nationality"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formik.touched.nationality && formik.errors.nationality
                        ? 'border-red-500'
      
