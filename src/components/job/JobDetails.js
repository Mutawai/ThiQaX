import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyStatus, setApplyStatus] = useState({
    isEligible: null,
    reasons: [],
    isSubmitting: false,
    success: false,
    error: null
  });

  // Fetch job details from API
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call API to get job details
        // This is a placeholder and should be replaced with actual API call
        // const response = await jobService.getJobById(jobId);
        
        // Mock response for development
        const mockJob = {
          id: jobId,
          title: 'Domestic Helper',
          company: 'Al Faisal Household Services',
          companyLogo: 'https://via.placeholder.com/80',
          location: 'Dubai, UAE',
          category: 'domestic',
          salary: '500-700',
          currency: 'USD',
          contractDuration: '2 years',
          isVerified: true,
          createdAt: '2025-02-15T09:30:00Z',
          description: `
            <p>We are looking for a professional domestic helper to join a respected family in Dubai. The ideal candidate will be responsible for household cleaning, laundry, and basic cooking duties.</p>
            
            <h3>Responsibilities:</h3>
            <ul>
              <li>General house cleaning and maintenance</li>
              <li>Laundry and ironing</li>
              <li>Basic meal preparation</li>
              <li>Grocery shopping assistance</li>
              <li>Other household duties as assigned</li>
            </ul>
            
            <h3>Requirements:</h3>
            <ul>
              <li>Previous experience as a domestic helper (1+ years)</li>
              <li>Basic English communication skills</li>
              <li>Knowledge of household cleaning techniques</li>
              <li>Ability to follow instructions</li>
              <li>Good references from previous employers</li>
            </ul>
            
            <h3>Benefits:</h3>
            <ul>
              <li>Free accommodation and meals</li>
              <li>Health insurance</li>
              <li>Annual paid leave</li>
              <li>End of service benefits</li>
              <li>Round trip flight ticket every 2 years</li>
            </ul>
          `,
          sponsor: {
            id: '101',
            name: 'Al Faisal Family',
            rating: 4.7,
            totalHires: 28,
            verified: true,
            joinedDate: '2023-06-10T00:00:00Z'
          },
          agent: {
            id: '201',
            name: 'Global Recruitment Solutions',
            rating: 4.9,
            totalPlacements: 156,
            verified: true,
            joinedDate: '2022-03-15T00:00:00Z'
          },
          hasApplied: false, // If the current user has already applied
          applicationCount: 12, // Number of applicants who have applied
          applicationDeadline: '2025-05-15T23:59:59Z' // Application deadline
        };
        
        setTimeout(() => {
          setJob(mockJob);
          setLoading(false);
        }, 1000); // Simulate network delay
      } catch (err) {
        setError(err.message || 'Failed to fetch job details. Please try again.');
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  // Check if user is eligible to apply
  useEffect(() => {
    const checkEligibility = async () => {
      if (!job || !user) return;
      
      try {
        // This is a placeholder and should be replaced with actual API call
        // const eligibility = await profileService.checkApplicationEligibility(user.id, job.id);
        
        // Mock eligibility check for development
        const mockEligibility = {
          isEligible: user.profileComplete && user.kycVerified,
          reasons: []
        };
        
        if (!user.profileComplete) {
          mockEligibility.reasons.push('Your profile is incomplete');
        }
        
        if (!user.kycVerified) {
          mockEligibility.reasons.push('Your identity documents have not been verified');
        }
        
        setApplyStatus(prev => ({
          ...prev,
          isEligible: mockEligibility.isEligible,
          reasons: mockEligibility.reasons
        }));
      } catch (err) {
        console.error('Error checking eligibility:', err);
      }
    };
    
    checkEligibility();
  }, [job, user]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Check if deadline has passed
  const isDeadlinePassed = (deadlineString) => {
    const deadline = new Date(deadlineString);
    const now = new Date();
    return now > deadline;
  };

  // Handle apply button click
  const handleApply = async () => {
    if (!user) {
      // Redirect to login with return URL
      navigate('/login?returnUrl=' + encodeURIComponent(`/jobs/${jobId}`));
      return;
    }
    
    if (job.hasApplied) {
      navigate('/applications');
      return;
    }
    
    if (!applyStatus.isEligible) {
      // Show reasons why they can't apply
      return;
    }
    
    try {
      setApplyStatus(prev => ({
        ...prev,
        isSubmitting: true,
        error: null
      }));
      
      // This is a placeholder and should be replaced with actual API call
      // await applicationService.applyForJob(jobId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApplyStatus(prev => ({
        ...prev,
        isSubmitting: false,
        success: true
      }));
      
      // Update job state to reflect that user has applied
      setJob(prev => ({
        ...prev,
        hasApplied: true,
        applicationCount: prev.applicationCount + 1
      }));
    } catch (err) {
      setApplyStatus(prev => ({
        ...prev,
        isSubmitting: false,
        error: err.message || 'Failed to submit application. Please try again.'
      }));
    }
  };

  // Handle navigate to complete profile
  const handleCompleteProfile = () => {
    navigate('/profile/edit');
  };

  // Handle navigate to KYC verification
  const handleKYCVerification = () => {
    navigate('/kyc-verification');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-700">Loading job details...</p>
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
            onClick={() => navigate('/jobs')}
          >
            Back to Jobs
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
          <span className="block sm:inline"> The job you're looking for doesn't exist or has been removed.</span>
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
      {/* Back to jobs link */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Jobs
        </button>
      </div>

      {/* Job header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row">
          <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            <img
              src={job.companyLogo}
              alt={job.company}
              className="w-20 h-20 object-cover rounded"
            />
          </div>
          
          <div className="flex-grow">
            <div className="flex flex-wrap items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{job.title}</h1>
                <p className="text-gray-600">{job.company}</p>
                
                <div className="flex flex-wrap items-center mt-2">
                  <span className="inline-flex items-center mr-4 text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {job.location}
                  </span>
                  
                  <span className="inline-flex items-center mr-4 text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {job.salary} {job.currency}/month
                  </span>
                  
                  <span className="inline-flex items-center mr-4 text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {job.contractDuration}
                  </span>
                  
                  {job.isVerified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                {!isDeadlinePassed(job.applicationDeadline) ? (
                  <div className="flex flex-col items-center">
                    {applyStatus.success ? (
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-2">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                        <p className="text-green-600 font-semibold">Application Submitted!</p>
                        <button
                          onClick={() => navigate('/applications')}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Applications
                        </button>
                      </div>
                    ) : job.hasApplied ? (
                      <div className="text-center">
                        <button
                          onClick={() => navigate('/applications')}
                          className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Already Applied
                        </button>
                        <p className="text-sm text-gray-500 mt-1">View in Applications</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <button
                          onClick={handleApply}
                          disabled={applyStatus.isSubmitting || !applyStatus.isEligible}
                          className={`px-6 py-2 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            applyStatus.isEligible
                              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                              : 'bg-gray-200 text-gray-800 cursor-not-allowed focus:ring-gray-500'
                          }`}
                        >
                          {applyStatus.isSubmitting ? 'Submitting...' : 'Apply Now'}
                        </button>
                        
                        <p className="text-sm text-gray-500 mt-1">
                          {job.applicationCount} {job.applicationCount === 1 ? 'application' : 'applications'} so far
                        </p>
                        
                        {applyStatus.error && (
                          <p className="text-sm text-red-600 mt-2">{applyStatus.error}</p>
                        )}
                        
                        {!applyStatus.isEligible && applyStatus.reasons.length > 0 && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-left">
                            <p className="text-sm font-medium text-yellow-800 mb-1">You need to complete these steps:</p>
                            <ul className="text-sm text-yellow-700">
                              {applyStatus.reasons.map((reason, index) => (
                                <li key={index} className="flex items-start mt-1">
                                  <svg className="w-4 h-4 text-yellow-600 mr-1 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                  </svg>
                                  {reason}
                                </li>
                              ))}
                            </ul>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {!user.profileComplete && (
                                <button
                                  onClick={handleCompleteProfile}
                                  className="text-xs py-1 px-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  Complete Profile
                                </button>
                              )}
                              
                              {!user.kycVerified && (
                                <button
                                  onClick={handleKYCVerification}
                                  className="text-xs py-1 px-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  Verify Identity
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Application Closed
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Deadline was {formatDate(job.applicationDeadline)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Job Description</h2>
            <div 
              className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Job Details</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Posted On</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(job.createdAt)}</dd>
                </div>
                
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Application Deadline</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(job.applicationDeadline)}</dd>
                </div>
                
                <div className="col-span-1">
                  <dt className="text-sm
