import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../auth/AuthProvider';

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [additionalDocFile, setAdditionalDocFile] = useState(null);
  
  // Define experience levels
  const experienceLevels = [
    { value: 'none', label: 'No experience' },
    { value: 'beginner', label: 'Beginner (0-1 years)' },
    { value: 'intermediate', label: 'Intermediate (1-3 years)' },
    { value: 'experienced', label: 'Experienced (3-5 years)' },
    { value: 'expert', label: 'Expert (5+ years)' }
  ];

  // Define language proficiency levels
  const languageProficiencies = [
    { value: 'none', label: 'None' },
    { value: 'basic', label: 'Basic' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'fluent', label: 'Fluent' },
    { value: 'native', label: 'Native' }
  ];

  // Check if user is eligible to apply
  useEffect(() => {
    if (!user) {
      navigate('/login?returnUrl=' + encodeURIComponent(`/jobs/${jobId}/apply`));
      return;
    }
    
    const checkEligibility = async () => {
      try {
        // This would be an actual API call in production
        // const eligibility = await profileService.checkApplicationEligibility(user.id, jobId);
        
        // Mock eligibility check
        const mockEligibility = {
          isEligible: user.profileComplete && user.kycVerified,
          reasons: []
        };
        
        if (!mockEligibility.isEligible) {
          // Redirect to job details with error message
          navigate(`/jobs/${jobId}`, { 
            state: { 
              applicationError: 'You need to complete your profile and verify your identity before applying.' 
            }
          });
        }
      } catch (err) {
        console.error('Error checking eligibility:', err);
        navigate(`/jobs/${jobId}`);
      }
    };
    
    checkEligibility();
  }, [jobId, navigate, user]);

  // Fetch job details and user documents
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // These would be actual API calls in production
        // const jobData = await jobService.getJobById(jobId);
        // const userDocuments = await documentService.getUserDocuments(user.id);
        
        // Mock job data
        const mockJob = {
          id: jobId,
          title: 'Domestic Helper',
          company: 'Al Faisal Household Services',
          location: 'Dubai, UAE',
          salary: '500-700 USD/month',
          isVerified: true,
          requiredDocuments: [
            'Passport',
            'Resume/CV',
            'Educational Certificates'
          ],
          skills: [
            'Cleaning',
            'Cooking',
            'Childcare',
            'Elderly Care'
          ]
        };
        
        // Mock user documents
        const mockDocuments = [
          {
            id: 'doc1',
            name: 'Passport',
            type: 'identity',
            status: 'verified',
            uploadDate: '2025-01-15T10:30:00Z'
          },
          {
            id: 'doc2',
            name: 'Resume',
            type: 'professional',
            status: 'verified',
            uploadDate: '2025-01-20T14:45:00Z'
          },
          {
            id: 'doc3',
            name: 'High School Certificate',
            type: 'education',
            status: 'verified',
            uploadDate: '2025-01-25T09:15:00Z'
          }
        ];
        
        setJob(mockJob);
        setDocuments(mockDocuments);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load application data. Please try again.');
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [jobId, user]);

  // Handle document checkbox change
  const handleDocumentChange = (docId) => {
    setSelectedDocuments(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  // Handle additional document upload
  const handleAdditionalDocUpload = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setAdditionalDocFile(file);
      setFieldValue('additionalDocument', file);
    }
  };

  // Validation schema
  const validationSchema = Yup.object({
    coverLetter: Yup.string()
      .required('Cover letter is required')
      .min(100, 'Cover letter should be at least 100 characters')
      .max(2000, 'Cover letter should not exceed 2000 characters'),
    experienceLevel: Yup.string()
      .required('Experience level is required'),
    relevantExperience: Yup.string()
      .required('Please describe your relevant experience')
      .min(50, 'Description should be at least 50 characters')
      .max(1000, 'Description should not exceed 1000 characters'),
    englishProficiency: Yup.string()
      .required('English proficiency level is required'),
    arabicProficiency: Yup.string(),
    expectedSalary: Yup.number()
      .required('Expected salary is required')
      .min(1, 'Salary must be greater than 0'),
    earliestStartDate: Yup.date()
      .required('Earliest start date is required')
      .min(new Date(), 'Start date must be in the future'),
    additionalDocument: Yup.mixed(),
    termsAccepted: Yup.boolean()
      .oneOf([true], 'You must accept the terms and conditions')
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      coverLetter: '',
      experienceLevel: '',
      relevantExperience: '',
      englishProficiency: '',
      arabicProficiency: '',
      expectedSalary: '',
      earliestStartDate: '',
      additionalDocument: null,
      termsAccepted: false
    },
    validationSchema,
    onSubmit: async (values) => {
      if (selectedDocuments.length === 0) {
        formik.setErrors({ documents: 'Please select at least one document' });
        return;
      }
      
      try {
        setSubmitting(true);
        
        // Create form data for file upload
        const formData = new FormData();
        
        // Add form values
        Object.keys(values).forEach(key => {
          if (key !== 'additionalDocument') {
            formData.append(key, values[key]);
          }
        });
        
        // Add selected documents
        selectedDocuments.forEach(docId => {
          formData.append('selectedDocuments[]', docId);
        });
        
        // Add additional document if exists
        if (values.additionalDocument) {
          formData.append('additionalDocument', values.additionalDocument);
        }
        
        // This would be an actual API call in production
        // await applicationService.submitApplication(jobId, formData);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Navigate to success page
        navigate(`/applications/success/${jobId}`);
      } catch (err) {
        setError(err.message || 'Failed to submit application. Please try again.');
        setSubmitting(false);
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
          <p className="mt-4 text-gray-700">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => navigate(`/jobs/${jobId}`)}
          >
            Back to Job
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Found!</strong>
          <span className="block sm:inline"> The job you're applying for doesn't exist or has been removed.</span>
          <button
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => navigate('/jobs')}
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/jobs/${jobId}`)}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Job Details
        </button>
      </div>
      
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Apply for: {job.title}</h1>
        <p className="text-gray-600">{job.company} - {job.location}</p>
        <div className="mt-2 flex items-center text-gray-500">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {job.salary}
        </div>
      </div>
      
      {/* Application Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={formik.handleSubmit}>
          {/* Documents Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Required Documents</h2>
            <p className="text-gray-600 mb-4">
              Please select the documents to include with your application. Documents with verification status are already uploaded to your profile.
            </p>
            
            {documents.length === 0 ? (
              <p className="text-yellow-600">
                You don't have any verified documents. Please go to your profile to upload and verify documents.
              </p>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-start">
                    <input
                      id={`doc-${doc.id}`}
                      type="checkbox"
                      className="h-5 w-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={() => handleDocumentChange(doc.id)}
                    />
                    <label htmlFor={`doc-${doc.id}`} className="ml-3 flex-1">
                      <div className="text-gray-700 font-medium">{doc.name}</div>
                      <div className="text-sm text-gray-500">
                        Uploaded on {new Date(doc.uploadDate).toLocaleDateString()}
                      </div>
                      <div className="mt-1">
                        {doc.status === 'verified' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Pending Verification
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
                
                {formik.errors.documents && (
                  <p className="mt-2 text-sm text-red-600">{formik.errors.documents}</p>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <label htmlFor="additionalDocument" className="block text-sm font-medium text-gray-700">
                Additional Document (Optional)
              </label>
              <div className="mt-1">
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="additionalDocument"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="additionalDocument"
                          name="additionalDocument"
                          type="file"
                          className="sr-only"
                          onChange={(event) => handleAdditionalDocUpload(event, formik.setFieldValue)}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG or PNG up to 10MB</p>
                  </div>
                </div>
                {additionalDocFile && (
                  <p className="mt-2 text-sm text-green-600">
                    File selected: {additionalDocFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-b border-gray-200 mb-6 pb-6"></div>
          
          {/* Cover Letter Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Cover Letter</h2>
            <div className="mb-4">
              <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                Why are you interested in this position?
              </label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                rows={5}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  formik.touched.coverLetter && formik.errors.coverLetter
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="Introduce yourself and explain why you're a good fit for this position..."
                {...formik.getFieldProps('coverLetter')}
              ></textarea>
              {formik.touched.coverLetter && formik.errors.coverLetter && (
                <p className="mt-2 text-sm text-red-600">{formik.errors.coverLetter}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formik.values.coverLetter.length}/2000 characters
              </p>
            </div>
          </div>
          
          <div className="border-b border-gray-200 mb-6 pb-6"></div>
          
          {/* Skills and Experience Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Skills and Experience</h2>
            
            <div className="mb-4">
              <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700">
                Experience Level in Similar Roles
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  formik.touched.experienceLevel && formik.errors.experienceLevel
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                {...formik.getFieldProps('experienceLevel')}
              >
                <option value="">Select your experience level</option>
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
              {formik.touched.experienceLevel && formik.errors.experienceLevel && (
                <p className="mt-2 text-sm text-red-600">{formik.errors.experienceLevel}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="relevantExperience" className="block text-sm font-medium text-gray-700">
                Describe your relevant experience
              </label>
              <textarea
                id="relevantExperience"
                
