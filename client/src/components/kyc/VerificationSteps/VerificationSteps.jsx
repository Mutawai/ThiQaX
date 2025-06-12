import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { checkKycStatus } from '../../../services/integrationService';

const STEP_STATUS = {
  PENDING: 'pending',
  CURRENT: 'current',
  COMPLETED: 'completed',
  DISABLED: 'disabled'
};

const DOCUMENT_TYPES = {
  PASSPORT: 'passport',
  NATIONAL_ID: 'national_id',
  ADDRESS_PROOF: 'address_proof',
  EDUCATION_CERTIFICATE: 'education_certificate',
  PROFESSIONAL_CERTIFICATE: 'professional_certificate'
};

const DEFAULT_STEPS = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Basic profile setup',
    icon: 'user',
    requiredFields: ['name', 'email', 'phone', 'dateOfBirth'],
    optional: false
  },
  {
    id: 'identity-documents',
    title: 'Identity Documents',
    description: 'Upload passport or national ID',
    icon: 'identification',
    requiredDocuments: [DOCUMENT_TYPES.PASSPORT, DOCUMENT_TYPES.NATIONAL_ID],
    requiresOneOf: true,
    optional: false
  },
  {
    id: 'address-verification',
    title: 'Address Verification',
    description: 'Proof of residence',
    icon: 'location',
    requiredDocuments: [DOCUMENT_TYPES.ADDRESS_PROOF],
    optional: false
  },
  {
    id: 'professional-documents',
    title: 'Professional Documents',
    description: 'Education and certifications',
    icon: 'academic-cap',
    requiredDocuments: [DOCUMENT_TYPES.EDUCATION_CERTIFICATE, DOCUMENT_TYPES.PROFESSIONAL_CERTIFICATE],
    optional: true
  },
  {
    id: 'review-submit',
    title: 'Review & Submit',
    description: 'Final verification review',
    icon: 'check-circle',
    optional: false
  }
];

const VerificationSteps = ({ 
  steps = DEFAULT_STEPS,
  currentStep = 'personal-info',
  onStepClick,
  allowNavigation = true,
  showProgress = true,
  orientation = 'horizontal',
  size = 'medium',
  userProfile = null,
  className = ''
}) => {
  const navigate = useNavigate();
  const { documents } = useSelector(state => state.document);
  const { user } = useSelector(state => state.auth || {});
  
  const [stepStatuses, setStepStatuses] = useState({});
  const [completionData, setCompletionData] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    calculateStepStatuses();
  }, [documents, userProfile, user, currentStep]);

  const calculateStepStatuses = async () => {
    const statuses = {};
    const completion = {};
    let completedSteps = 0;
    let currentStepFound = false;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const isCompleted = await checkStepCompletion(step);
      const isCurrent = step.id === currentStep && !currentStepFound;
      
      if (isCurrent) {
        currentStepFound = true;
      }

      if (isCompleted) {
        statuses[step.id] = STEP_STATUS.COMPLETED;
        completedSteps++;
      } else if (isCurrent) {
        statuses[step.id] = STEP_STATUS.CURRENT;
      } else if (!currentStepFound && allowNavigation) {
        statuses[step.id] = STEP_STATUS.PENDING;
      } else {
        statuses[step.id] = allowNavigation ? STEP_STATUS.PENDING : STEP_STATUS.DISABLED;
      }

      completion[step.id] = await getStepCompletionData(step);
    }

    setStepStatuses(statuses);
    setCompletionData(completion);
    setOverallProgress(Math.round((completedSteps / steps.length) * 100));
  };

  const checkStepCompletion = async (step) => {
    switch (step.id) {
      case 'personal-info':
        return checkPersonalInfoCompletion(step);
      case 'identity-documents':
        return checkDocumentsCompletion(step);
      case 'address-verification':
        return checkDocumentsCompletion(step);
      case 'professional-documents':
        return step.optional ? true : checkDocumentsCompletion(step);
      case 'review-submit':
        return checkReviewCompletion();
      default:
        return false;
    }
  };

  const checkPersonalInfoCompletion = (step) => {
    const profile = userProfile || user;
    if (!profile || !step.requiredFields) return false;

    return step.requiredFields.every(field => {
      const value = profile[field];
      return value && value.toString().trim().length > 0;
    });
  };

  const checkDocumentsCompletion = (step) => {
    if (!step.requiredDocuments || !documents) return false;

    if (step.requiresOneOf) {
      // For identity documents, we need at least one of passport OR national ID
      return step.requiredDocuments.some(docType => 
        documents.some(doc => 
          doc.documentType === docType && 
          ['VERIFIED', 'PENDING'].includes(doc.verificationStatus)
        )
      );
    } else {
      // For other documents, we need all required documents
      return step.requiredDocuments.every(docType =>
        documents.some(doc => 
          doc.documentType === docType && 
          ['VERIFIED', 'PENDING'].includes(doc.verificationStatus)
        )
      );
    }
  };

  const checkReviewCompletion = async () => {
    try {
      const kycStatus = await checkKycStatus();
      return kycStatus.data.status === 'verified';
    } catch (err) {
      return false;
    }
  };

  const getStepCompletionData = async (step) => {
    const baseData = {
      isCompleted: stepStatuses[step.id] === STEP_STATUS.COMPLETED,
      isCurrent: stepStatuses[step.id] === STEP_STATUS.CURRENT,
      completionPercentage: 0
    };

    switch (step.id) {
      case 'personal-info':
        return {
          ...baseData,
          ...getPersonalInfoProgress(step)
        };
      case 'identity-documents':
      case 'address-verification':
      case 'professional-documents':
        return {
          ...baseData,
          ...getDocumentProgress(step)
        };
      case 'review-submit':
        return {
          ...baseData,
          completionPercentage: baseData.isCompleted ? 100 : 0
        };
      default:
        return baseData;
    }
  };

  const getPersonalInfoProgress = (step) => {
    const profile = userProfile || user;
    if (!profile || !step.requiredFields) {
      return { completionPercentage: 0, missingFields: step.requiredFields || [] };
    }

    const completedFields = step.requiredFields.filter(field => {
      const value = profile[field];
      return value && value.toString().trim().length > 0;
    });

    const missingFields = step.requiredFields.filter(field => {
      const value = profile[field];
      return !value || value.toString().trim().length === 0;
    });

    return {
      completionPercentage: Math.round((completedFields.length / step.requiredFields.length) * 100),
      completedFields,
      missingFields
    };
  };

  const getDocumentProgress = (step) => {
    if (!step.requiredDocuments || !documents) {
      return { completionPercentage: 0, missingDocuments: step.requiredDocuments || [] };
    }

    const documentStatuses = step.requiredDocuments.map(docType => {
      const doc = documents.find(d => d.documentType === docType);
      return {
        type: docType,
        uploaded: !!doc,
        verified: doc?.verificationStatus === 'VERIFIED',
        pending: doc?.verificationStatus === 'PENDING',
        rejected: doc?.verificationStatus === 'REJECTED'
      };
    });

    if (step.requiresOneOf) {
      // For identity documents (one of passport OR national ID)
      const hasValidDocument = documentStatuses.some(doc => doc.uploaded && !doc.rejected);
      return {
        completionPercentage: hasValidDocument ? 100 : 0,
        documentStatuses,
        requiresOneOf: true
      };
    } else {
      // For other documents (all required)
      const uploadedCount = documentStatuses.filter(doc => doc.uploaded && !doc.rejected).length;
      return {
        completionPercentage: Math.round((uploadedCount / step.requiredDocuments.length) * 100),
        documentStatuses,
        missingDocuments: documentStatuses.filter(doc => !doc.uploaded).map(doc => doc.type)
      };
    }
  };

  const handleStepClick = (step, stepStatus) => {
    if (!allowNavigation || stepStatus === STEP_STATUS.DISABLED) return;

    if (onStepClick) {
      onStepClick(step, stepStatus);
    } else {
      // Default navigation behavior
      const routes = {
        'personal-info': '/profile/edit',
        'identity-documents': '/kyc',
        'address-verification': '/kyc',
        'professional-documents': '/kyc',
        'review-submit': '/kyc/review'
      };

      const route = routes[step.id];
      if (route) {
        navigate(route);
      }
    }
  };

  const getStepIcon = (step, status) => {
    if (status === STEP_STATUS.COMPLETED) {
      return (
        <svg className={`${getIconSize()} text-white`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }

    const icons = {
      'user': (
        <svg className={getIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      'identification': (
        <svg className={getIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
      'location': (
        <svg className={getIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      'academic-cap': (
        <svg className={getIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
      'check-circle': (
        <svg className={getIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };

    return icons[step.icon] || icons['check-circle'];
  };

  const getIconSize = () => {
    const sizes = {
      small: 'h-4 w-4',
      medium: 'h-5 w-5',
      large: 'h-6 w-6'
    };
    return sizes[size] || sizes.medium;
  };

  const getStepCircleSize = () => {
    const sizes = {
      small: 'h-8 w-8',
      medium: 'h-10 w-10',
      large: 'h-12 w-12'
    };
    return sizes[size] || sizes.medium;
  };

  const getStepCircleClasses = (status) => {
    const baseClasses = `${getStepCircleSize()} rounded-full flex items-center justify-center border-2 transition-all duration-300`;
    
    switch (status) {
      case STEP_STATUS.COMPLETED:
        return `${baseClasses} bg-green-500 border-green-500 text-white`;
      case STEP_STATUS.CURRENT:
        return `${baseClasses} bg-indigo-500 border-indigo-500 text-white`;
      case STEP_STATUS.PENDING:
        return `${baseClasses} bg-white border-gray-300 text-gray-500 hover:border-indigo-300`;
      case STEP_STATUS.DISABLED:
        return `${baseClasses} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed`;
      default:
        return `${baseClasses} bg-white border-gray-300 text-gray-500`;
    }
  };

  const getStepTextClasses = (status) => {
    const baseClasses = 'transition-colors duration-300';
    
    switch (status) {
      case STEP_STATUS.COMPLETED:
      case STEP_STATUS.CURRENT:
        return `${baseClasses} text-gray-900`;
      case STEP_STATUS.PENDING:
        return `${baseClasses} text-gray-700 hover:text-gray-900`;
      case STEP_STATUS.DISABLED:
        return `${baseClasses} text-gray-400`;
      default:
        return `${baseClasses} text-gray-700`;
    }
  };

  const getConnectorClasses = (currentStatus, nextStatus) => {
    const baseClasses = 'flex-1 h-0.5 transition-colors duration-300';
    
    if (currentStatus === STEP_STATUS.COMPLETED && nextStatus === STEP_STATUS.COMPLETED) {
      return `${baseClasses} bg-green-500`;
    } else if (currentStatus === STEP_STATUS.COMPLETED) {
      return `${baseClasses} bg-green-500`;
    } else {
      return `${baseClasses} bg-gray-300`;
    }
  };

  const renderStepContent = (step, status) => {
    const completion = completionData[step.id] || {};
    
    return (
      <div className="text-center sm:text-left">
        <h3 className={`text-sm font-medium ${getStepTextClasses(status)}`}>
          {step.title}
        </h3>
        <p className={`text-xs mt-1 ${getStepTextClasses(status)}`}>
          {step.description}
        </p>
        
        {showProgress && completion.completionPercentage !== undefined && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{completion.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  status === STEP_STATUS.COMPLETED 
                    ? 'bg-green-500' 
                    : status === STEP_STATUS.CURRENT 
                    ? 'bg-indigo-500' 
                    : 'bg-gray-400'
                }`}
                style={{ width: `${completion.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Show missing items for current step */}
        {status === STEP_STATUS.CURRENT && (
          <div className="mt-2 text-xs">
            {completion.missingFields && completion.missingFields.length > 0 && (
              <p className="text-amber-600">
                Missing: {completion.missingFields.join(', ')}
              </p>
            )}
            {completion.missingDocuments && completion.missingDocuments.length > 0 && (
              <p className="text-amber-600">
                Upload: {completion.missingDocuments.length} document(s)
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHorizontalSteps = () => {
    return (
      <div className="flex items-center w-full">
        {steps.map((step, index) => {
          const status = stepStatuses[step.id] || STEP_STATUS.PENDING;
          const isClickable = allowNavigation && status !== STEP_STATUS.DISABLED;
          const nextStatus = index < steps.length - 1 ? stepStatuses[steps[index + 1].id] : null;
          
          return (
            <React.Fragment key={step.id}>
              <div 
                className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''} group`}
                onClick={() => handleStepClick(step, status)}
              >
                {/* Step Circle */}
                <div className={getStepCircleClasses(status)}>
                  {getStepIcon(step, status)}
                </div>
                
                {/* Step Content */}
                <div className="mt-3 max-w-xs">
                  {renderStepContent(step, status)}
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`mx-4 ${getConnectorClasses(status, nextStatus)}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderVerticalSteps = () => {
    return (
      <div className="space-y-6">
        {steps.map((step, index) => {
          const status = stepStatuses[step.id] || STEP_STATUS.PENDING;
          const isClickable = allowNavigation && status !== STEP_STATUS.DISABLED;
          const nextStatus = index < steps.length - 1 ? stepStatuses[steps[index + 1].id] : null;
          
          return (
            <div key={step.id} className="flex">
              {/* Step Circle and Connector */}
              <div className="flex flex-col items-center mr-4">
                <div 
                  className={`${getStepCircleClasses(status)} ${isClickable ? 'cursor-pointer' : ''} group`}
                  onClick={() => handleStepClick(step, status)}
                >
                  {getStepIcon(step, status)}
                </div>
                
                {/* Vertical Connector */}
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-12 mt-4 ${getConnectorClasses(status, nextStatus).replace('h-0.5', 'w-0.5 h-12').replace('flex-1', '')}`}></div>
                )}
              </div>
              
              {/* Step Content */}
              <div 
                className={`flex-1 ${isClickable ? 'cursor-pointer' : ''}`}
                onClick={() => handleStepClick(step, status)}
              >
                {renderStepContent(step, status)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`verification-steps ${className}`}>
      {/* Overall Progress Bar */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{overallProgress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-green-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Steps */}
      {orientation === 'horizontal' ? renderHorizontalSteps() : renderVerticalSteps()}
    </div>
  );
};

VerificationSteps.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    icon: PropTypes.string,
    requiredFields: PropTypes.arrayOf(PropTypes.string),
    requiredDocuments: PropTypes.arrayOf(PropTypes.string),
    requiresOneOf: PropTypes.bool,
    optional: PropTypes.bool
  })),
  currentStep: PropTypes.string,
  onStepClick: PropTypes.func,
  allowNavigation: PropTypes.bool,
  showProgress: PropTypes.bool,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  userProfile: PropTypes.object,
  className: PropTypes.string
};

export default VerificationSteps;