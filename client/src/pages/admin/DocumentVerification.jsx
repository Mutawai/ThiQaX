// client/src/pages/Admin/DocumentVerification.jsx - PART 1
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

const DocumentVerification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationRequest, setVerificationRequest] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Fetch verification request data on component mount
  useEffect(() => {
    const fetchVerificationRequest = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // In a real implementation, you would dispatch an action to fetch the verification request
        // Example: const data = await dispatch(fetchVerificationRequest(id));
        console.log('Fetching verification request:', id);
        
        // Simulate API call with mock data
        setTimeout(() => {
          const mockData = {
            id,
            userId: 'user123',
            userName: 'John Doe',
            userEmail: 'john@example.com',
            userRole: 'jobSeeker',
            documentType: 'passport',
            documentNumber: 'P12345678',
            documentIssuingCountry: 'Kenya',
            documentExpiryDate: '2027-08-15',
            documentImage: 'https://via.placeholder.com/800x600.png?text=Passport+Document',
            supportingDocument: 'https://via.placeholder.com/800x600.png?text=Supporting+Document',
            selfieImage: 'https://via.placeholder.com/400x400.png?text=Selfie+Image',
            submissionDate: '2025-04-15T10:30:00Z',
            status: 'pending',
            assignedTo: 'admin001',
            previousRejectionReason: '',
            verificationAttempts: 1
          };
          
          setVerificationRequest(mockData);
          setIsLoading(false);
        }, 1500);
      } catch (err) {
        setIsLoading(false);
        setError(err.message || 'Failed to load verification request. Please try again.');
      }
    };
    
    fetchVerificationRequest();
  }, [id, dispatch]);
  
  const handleVerify = async () => {
    setIsSubmitting(true);
    
    try {
      // In a real implementation, you would dispatch an action to verify the document
      // Example: await dispatch(verifyDocument(id, { status: verificationStatus, notes, rejectionReason }));
      console.log('Verifying document:', id, { status: verificationStatus, notes, rejectionReason });
      
      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false);
        
        // Navigate back to the verification queue
        navigate('/admin/verifications');
      }, 1500);
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to submit verification decision. Please try again.');
    }
  };
  
  const handleCancel = () => {
    navigate('/admin/verifications');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!verificationRequest) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Verification Request Not Found</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>The verification request you're looking for does not exist or has been removed.</p>
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => navigate('/admin/verifications')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Verification Queue
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Document Verification</h2>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            verificationRequest.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : verificationRequest.status === 'approved'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {verificationRequest.status === 'pending'
              ? 'Pending'
              : verificationRequest.status === 'approved'
              ? 'Approved'
              : 'Rejected'}
          </span>
        </div>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 lg:grid-cols-3">
          {/* User Information Section */}
          <div className="col-span-1">
            <div className="bg-gray-50 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{verificationRequest.userName}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{verificationRequest.userEmail}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {verificationRequest.userRole === 'jobSeeker'
                        ? 'Job Seeker'
                        : verificationRequest.userRole === 'agent'
                        ? 'Recruitment Agent'
                        : verificationRequest.userRole === 'sponsor'
                        ? 'Employer/Sponsor'
                        : 'Admin'}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Submission Date</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(verificationRequest.submissionDate).toLocaleString()}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Attempts</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {verificationRequest.verificationAttempts}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div className="mt-6 bg-gray-50 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Document Information</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {verificationRequest.documentType === 'passport'
                        ? 'Passport'
                        : verificationRequest.documentType === 'nationalId'
                        ? 'National ID'
                        : verificationRequest.documentType === 'drivingLicense'
                        ? 'Driving License'
                        : 'Other'}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Document Number</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{verificationRequest.documentNumber}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Issuing Country</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{verificationRequest.documentIssuingCountry}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(verificationRequest.documentExpiryDate).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Verification Decision Section */}
            <div className="mt-6 bg-gray-50 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Verification Decision</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="mt-1">
                  <div>
                    <label className="text-base font-medium text-gray-900">Status</label>
                    <p className="text-sm text-gray-500">Select the verification status for this document.</p>
                    <fieldset className="mt-4">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            id="status-approve"
                            name="status"
                            type="radio"
                            checked={verificationStatus === 'approved'}
                            onChange={() => setVerificationStatus('approved')}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                          />
                          <label htmlFor="status-approve" className="ml-3 block text-sm font-medium text-gray-700">
                            Approve
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="status-reject"
                            name="status"
                            type="radio"
                            checked={verificationStatus === 'rejected'}
                            onChange={() => setVerificationStatus('rejected')}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                          />
                          <label htmlFor="status-reject" className="ml-3 block text-sm font-medium text-gray-700">
                            Reject
                          </label>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                  
                  {verificationStatus === 'rejected' && (
                    <div className="mt-6">
                      <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
                        Rejection Reason
                      </label>
                      <div className="mt-1">
                        <select
                          id="rejectionReason"
                          name="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="">Select a reason</option>
                          <option value="document_expired">Document expired</option>
                          <option value="document_unclear">Document unclear or unreadable</option>
                          <option value="document_tampered">Document appears tampered or forged</option>
                          <option value="information_mismatch">Information doesn't match profile</option>
                          <option value="selfie_mismatch">Selfie doesn't match document photo</option>
                          <option value="supporting_document_missing">Supporting documents missing</option>
                          <option value="other">Other (specify in notes)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes (Internal Only)
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Add any additional notes about this verification..."
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={isSubmitting || (verificationStatus === 'rejected' && !rejectionReason)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Decision'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Document Viewer Section */}
          <div className="col-span-2">
            <div className="bg-gray-50 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Document Viewer</h3>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-500">{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-200">
                <div className="px-4 py-5 sm:px-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Main Document</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left', width: `${10000 / zoomLevel}%` }}>
                          <img
                            src={verificationRequest.documentImage}
                            alt="Main Document"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Supporting Document</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left', width: `${10000 / zoomLevel}%` }}>
                          <img
                            src={verificationRequest.supportingDocument}
                            alt="Supporting Document"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Selfie</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left', width: `${10000 / zoomLevel}%` }}>
                          <img
                            src={verificationRequest.selfieImage}
                            alt="Selfie"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentVerification;