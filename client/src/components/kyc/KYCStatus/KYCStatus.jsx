import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  getDocuments,
  clearDocumentErrors
} from '../../../redux/actions/documentActions';
import { checkKycStatus, syncProfileVerification } from '../../../services/integrationService';

const VERIFICATION_STATUS = {
  NOT_STARTED: 'not_started',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  INCOMPLETE: 'incomplete'
};

const DOCUMENT_TYPES = {
  PASSPORT: 'passport',
  NATIONAL_ID: 'national_id',
  ADDRESS_PROOF: 'address_proof',
  EDUCATION_CERTIFICATE: 'education_certificate',
  PROFESSIONAL_CERTIFICATE: 'professional_certificate'
};

const DOCUMENT_LABELS = {
  [DOCUMENT_TYPES.PASSPORT]: 'Passport',
  [DOCUMENT_TYPES.NATIONAL_ID]: 'National ID',
  [DOCUMENT_TYPES.ADDRESS_PROOF]: 'Address Proof',
  [DOCUMENT_TYPES.EDUCATION_CERTIFICATE]: 'Education Certificate',
  [DOCUMENT_TYPES.PROFESSIONAL_CERTIFICATE]: 'Professional Certificate'
};

const REQUIRED_DOCUMENTS = [
  DOCUMENT_TYPES.PASSPORT,
  DOCUMENT_TYPES.NATIONAL_ID,
  DOCUMENT_TYPES.ADDRESS_PROOF
];

const KYCStatus = ({ compact = false, showActions = true, onStatusChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { documents, loading, error } = useSelector(state => state.document);
  
  const [kycStatus, setKycStatus] = useState(null);
  const [overallStatus, setOverallStatus] = useState(VERIFICATION_STATUS.NOT_STARTED);
  const [statusLoading, setStatusLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    loadData();
  }, [dispatch]);

  useEffect(() => {
    if (documents.length > 0) {
      calculateOverallStatus();
    }
  }, [documents]);

  const loadData = async () => {
    try {
      dispatch(getDocuments());
      await loadKycStatus();
    } catch (err) {
      console.error('Failed to load KYC data:', err);
    }
  };

  const loadKycStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await checkKycStatus();
      setKycStatus(response.data);
      setLastUpdated(new Date().toISOString());
      
      if (onStatusChange) {
        onStatusChange(response.data);
      }
    } catch (err) {
      console.error('Failed to load KYC status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const calculateOverallStatus = () => {
    if (!documents || documents.length === 0) {
      setOverallStatus(VERIFICATION_STATUS.NOT_STARTED);
      setCompletionPercentage(0);
      return;
    }

    const documentsByType = {};
    documents.forEach(doc => {
      documentsByType[doc.documentType] = doc;
    });

    // Check if we have at least one identity document
    const hasIdentityDoc = documentsByType[DOCUMENT_TYPES.PASSPORT] || 
                          documentsByType[DOCUMENT_TYPES.NATIONAL_ID];
    
    const hasAddressProof = documentsByType[DOCUMENT_TYPES.ADDRESS_PROOF];

    // Calculate completion percentage
    let completedCount = 0;
    let totalRequired = REQUIRED_DOCUMENTS.length;
    
    // Count identity documents as one requirement
    if (hasIdentityDoc) completedCount++;
    if (hasAddressProof) completedCount++;
    
    // Adjust for identity docs (either passport OR national ID counts as 1)
    if (documentsByType[DOCUMENT_TYPES.PASSPORT] && documentsByType[DOCUMENT_TYPES.NATIONAL_ID]) {
      totalRequired--; // Both uploaded, but only counts as one requirement
    }

    const percentage = Math.round((completedCount / totalRequired) * 100);
    setCompletionPercentage(percentage);

    // Determine overall status
    const verifiedDocs = documents.filter(doc => doc.verificationStatus === 'VERIFIED');
    const rejectedDocs = documents.filter(doc => doc.verificationStatus === 'REJECTED');
    const pendingDocs = documents.filter(doc => doc.verificationStatus === 'PENDING');
    const expiredDocs = documents.filter(doc => doc.verificationStatus === 'EXPIRED');

    if (rejectedDocs.length > 0) {
      setOverallStatus(VERIFICATION_STATUS.REJECTED);
    } else if (expiredDocs.length > 0) {
      setOverallStatus(VERIFICATION_STATUS.EXPIRED);
    } else if (!hasIdentityDoc || !hasAddressProof) {
      setOverallStatus(VERIFICATION_STATUS.INCOMPLETE);
    } else if (verifiedDocs.length >= totalRequired) {
      setOverallStatus(VERIFICATION_STATUS.VERIFIED);
    } else if (pendingDocs.length > 0) {
      setOverallStatus(VERIFICATION_STATUS.PENDING);
    } else {
      setOverallStatus(VERIFICATION_STATUS.INCOMPLETE);
    }
  };

  const handleSyncVerification = async () => {
    setStatusLoading(true);
    try {
      await syncProfileVerification();
      await loadData();
    } catch (err) {
      console.error('Failed to sync verification:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      [VERIFICATION_STATUS.NOT_STARTED]: {
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        icon: 'clock',
        title: 'Not Started',
        description: 'Begin your KYC verification process',
        actionText: 'Start Verification',
        actionColor: 'indigo'
      },
      [VERIFICATION_STATUS.INCOMPLETE]: {
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: 'exclamation',
        title: 'Incomplete',
        description: 'Some required documents are missing',
        actionText: 'Complete Verification',
        actionColor: 'yellow'
      },
      [VERIFICATION_STATUS.PENDING]: {
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        icon: 'clock',
        title: 'Under Review',
        description: 'Your documents are being verified',
        actionText: 'View Status',
        actionColor: 'blue'
      },
      [VERIFICATION_STATUS.VERIFIED]: {
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: 'check-circle',
        title: 'Verified',
        description: 'Your identity has been successfully verified',
        actionText: 'View Details',
        actionColor: 'green'
      },
      [VERIFICATION_STATUS.REJECTED]: {
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        icon: 'x-circle',
        title: 'Verification Failed',
        description: 'Some documents were rejected and need to be resubmitted',
        actionText: 'Fix Issues',
        actionColor: 'red'
      },
      [VERIFICATION_STATUS.EXPIRED]: {
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200',
        icon: 'exclamation-triangle',
        title: 'Documents Expired',
        description: 'Some documents have expired and need renewal',
        actionText: 'Update Documents',
        actionColor: 'orange'
      }
    };
    
    return configs[status] || configs[VERIFICATION_STATUS.NOT_STARTED];
  };

  const renderStatusIcon = (iconType, className = "h-6 w-6") => {
    const icons = {
      'check-circle': (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      'x-circle': (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      'clock': (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      'exclamation': (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      'exclamation-triangle': (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    };
    
    return icons[iconType] || icons['clock'];
  };

  const renderDocumentStatus = (documentType) => {
    const document = documents.find(doc => doc.documentType === documentType);
    
    if (!document) {
      return (
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-600">{DOCUMENT_LABELS[documentType]}</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Not Uploaded
          </span>
        </div>
      );
    }

    const statusConfig = {
      'VERIFIED': { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      'REJECTED': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      'EXPIRED': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Expired' }
    };

    const status = statusConfig[document.verificationStatus] || 
                  { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };

    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-900">{DOCUMENT_LABELS[documentType]}</span>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          {document.verificationStatus === 'VERIFIED' && (
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    );
  };

  const renderCompactView = () => {
    const config = getStatusConfig(overallStatus);
    
    return (
      <div className={`rounded-lg border p-4 ${config.borderColor} ${config.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {renderStatusIcon(config.icon, "h-5 w-5 mr-2")}
            <div>
              <h4 className={`text-sm font-medium ${config.textColor}`}>
                KYC Status: {config.title}
              </h4>
              {overallStatus !== VERIFICATION_STATUS.VERIFIED && (
                <p className="text-xs text-gray-600 mt-1">
                  {completionPercentage}% Complete
                </p>
              )}
            </div>
          </div>
          {showActions && (
            <Link
              to="/kyc"
              className={`text-xs font-medium text-${config.actionColor}-600 hover:text-${config.actionColor}-900`}
            >
              {config.actionText}
            </Link>
          )}
        </div>
        
        {overallStatus !== VERIFICATION_STATUS.VERIFIED && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-${config.actionColor}-500 h-2 rounded-full transition-all duration-300`}
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFullView = () => {
    const config = getStatusConfig(overallStatus);
    
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${config.borderColor} ${config.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {renderStatusIcon(config.icon, "h-8 w-8 mr-3")}
              <div>
                <h3 className={`text-lg font-medium ${config.textColor}`}>
                  KYC Verification Status
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {config.description}
                </p>
              </div>
            </div>
            {statusLoading && (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {overallStatus !== VERIFICATION_STATUS.VERIFIED && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Verification Progress</span>
              <span>{completionPercentage}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-${config.actionColor}-500 h-3 rounded-full transition-all duration-500`}
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Status</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Status Details */}
        <div className="px-6 py-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Document Status</h4>
          <div className="space-y-1">
            {/* Required Documents */}
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Required Documents
              </h5>
              {renderDocumentStatus(DOCUMENT_TYPES.PASSPORT)}
              {renderDocumentStatus(DOCUMENT_TYPES.NATIONAL_ID)}
              {renderDocumentStatus(DOCUMENT_TYPES.ADDRESS_PROOF)}
            </div>

            {/* Optional Documents */}
            {documents.some(doc => 
              doc.documentType === DOCUMENT_TYPES.EDUCATION_CERTIFICATE || 
              doc.documentType === DOCUMENT_TYPES.PROFESSIONAL_CERTIFICATE
            ) && (
              <div>
                <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Additional Documents
                </h5>
                {renderDocumentStatus(DOCUMENT_TYPES.EDUCATION_CERTIFICATE)}
                {renderDocumentStatus(DOCUMENT_TYPES.PROFESSIONAL_CERTIFICATE)}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Actions */}
        {showActions && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {lastUpdated && (
                  <span>
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSyncVerification}
                  disabled={statusLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {statusLoading ? 'Syncing...' : 'Refresh Status'}
                </button>
                
                {overallStatus !== VERIFICATION_STATUS.VERIFIED && (
                  <Link
                    to="/kyc"
                    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-${config.actionColor}-600 hover:bg-${config.actionColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${config.actionColor}-500`}
                  >
                    {config.actionText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && !documents.length) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return compact ? renderCompactView() : renderFullView();
};

KYCStatus.propTypes = {
  compact: PropTypes.bool,
  showActions: PropTypes.bool,
  onStatusChange: PropTypes.func
};

export default KYCStatus;