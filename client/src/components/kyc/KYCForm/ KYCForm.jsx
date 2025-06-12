import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  uploadDocument,
  getDocuments,
  clearDocumentErrors
} from '../../../redux/actions/documentActions';
import { checkKycStatus } from '../../../services/integrationService';

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

const KYCForm = ({ onComplete, initialStep = 1 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error, success, documents } = useSelector(state => state.document);
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [draggedOver, setDraggedOver] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [kycStatus, setKycStatus] = useState(null);

  const steps = [
    {
      id: 1,
      title: 'Identity Documents',
      description: 'Upload your passport or national ID',
      documentTypes: [DOCUMENT_TYPES.PASSPORT, DOCUMENT_TYPES.NATIONAL_ID],
      required: true
    },
    {
      id: 2,
      title: 'Address Verification',
      description: 'Upload proof of address (utility bill, bank statement)',
      documentTypes: [DOCUMENT_TYPES.ADDRESS_PROOF],
      required: true
    },
    {
      id: 3,
      title: 'Professional Documents',
      description: 'Upload education and professional certificates',
      documentTypes: [DOCUMENT_TYPES.EDUCATION_CERTIFICATE, DOCUMENT_TYPES.PROFESSIONAL_CERTIFICATE],
      required: false
    }
  ];

  useEffect(() => {
    dispatch(getDocuments());
    loadKycStatus();
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      // Clear success state after a short delay
      setTimeout(() => {
        dispatch(clearDocumentErrors());
      }, 3000);
    }
  }, [success, dispatch]);

  const loadKycStatus = async () => {
    try {
      const response = await checkKycStatus();
      setKycStatus(response.data);
    } catch (err) {
      console.error('Failed to load KYC status:', err);
    }
  };

  const validateFile = (file) => {
    const errors = [];
    
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      errors.push('Please upload a valid file type (JPEG, PNG, or PDF)');
    }
    
    if (file.size > MAX_FILE_SIZE) {
      errors.push('File size must be less than 5MB');
    }
    
    return errors;
  };

  const handleFileUpload = useCallback(async (file, documentType) => {
    const errors = validateFile(file);
    
    if (errors.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        [documentType]: errors
      }));
      return;
    }

    // Clear any previous validation errors
    setValidationErrors(prev => ({
      ...prev,
      [documentType]: []
    }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('description', DOCUMENT_LABELS[documentType]);

    try {
      await dispatch(uploadDocument(formData));
      
      setUploadedFiles(prev => ({
        ...prev,
        [documentType]: {
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        }
      }));
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }, [dispatch]);

  const handleDrop = useCallback((e, documentType) => {
    e.preventDefault();
    setDraggedOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], documentType);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e, documentType) => {
    e.preventDefault();
    setDraggedOver(documentType);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDraggedOver(null);
  }, []);

  const handleFileInputChange = useCallback((e, documentType) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file, documentType);
    }
  }, [handleFileUpload]);

  const isStepComplete = (step) => {
    if (!step.required) return true;
    
    return step.documentTypes.some(docType => 
      uploadedFiles[docType] || 
      documents.some(doc => 
        doc.documentType === docType && 
        ['VERIFIED', 'PENDING'].includes(doc.verificationStatus)
      )
    );
  };

  const canProceedToNextStep = () => {
    const currentStepData = steps.find(step => step.id === currentStep);
    return isStepComplete(currentStepData);
  };

  const handleNextStep = () => {
    if (canProceedToNextStep() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (currentStep === steps.length && canProceedToNextStep()) {
      try {
        await loadKycStatus();
        if (onComplete) {
          onComplete();
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Failed to complete KYC:', err);
      }
    }
  };

  const renderFileUploadArea = (documentType) => {
    const hasError = validationErrors[documentType]?.length > 0;
    const isUploaded = uploadedFiles[documentType];
    const existingDoc = documents.find(doc => doc.documentType === documentType);
    const isDragged = draggedOver === documentType;

    return (
      <div key={documentType} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {DOCUMENT_LABELS[documentType]}
          <span className="text-red-500 ml-1">*</span>
        </label>
        
        {existingDoc ? (
          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {existingDoc.originalName || 'Document uploaded'}
                  </p>
                  <p className="text-xs text-green-600">
                    Status: {existingDoc.verificationStatus || 'Pending'}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                existingDoc.verificationStatus === 'VERIFIED' 
                  ? 'bg-green-100 text-green-800'
                  : existingDoc.verificationStatus === 'REJECTED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {existingDoc.verificationStatus || 'Pending'}
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragged
                ? 'border-indigo-400 bg-indigo-50'
                : hasError
                ? 'border-red-300 bg-red-50'
                : isUploaded
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-indigo-400'
            }`}
            onDrop={(e) => handleDrop(e, documentType)}
            onDragOver={(e) => handleDragOver(e, documentType)}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById(`file-${documentType}`).click()}
          >
            <input
              id={`file-${documentType}`}
              type="file"
              className="hidden"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              onChange={(e) => handleFileInputChange(e, documentType)}
            />
            
            {isUploaded ? (
              <div className="flex items-center justify-center">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium text-green-800">
                    {isUploaded.name}
                  </p>
                  <p className="text-xs text-green-600">
                    {(isUploaded.size / 1024 / 1024).toFixed(2)} MB • Uploaded
                  </p>
                </div>
              </div>
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, PDF up to 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}
        
        {hasError && (
          <div className="mt-2">
            {validationErrors[documentType].map((error, index) => (
              <p key={index} className="text-sm text-red-600">
                {error}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  };

  const currentStepData = steps.find(step => step.id === currentStep);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">KYC Verification</h2>
          <p className="text-sm text-gray-600 mt-1">
            Complete your identity verification to access all platform features
          </p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.id < currentStep 
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.id === currentStep
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {step.id < currentStep ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    step.id <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-auto border-t-2 mx-4 ${
                    step.id < currentStep ? 'border-green-500' : 'border-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Document uploaded successfully!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="px-6 py-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {currentStepData.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {currentStepData.description}
            </p>
          </div>

          {currentStepData.documentTypes.map(documentType => 
            renderFileUploadArea(documentType)
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
              currentStep === 1
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            Previous
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={!canProceedToNextStep() || loading}
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                canProceedToNextStep() && !loading
                  ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  : 'text-gray-400 bg-gray-300 cursor-not-allowed'
              }`}
            >
              {loading ? 'Uploading...' : 'Next'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceedToNextStep() || loading}
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md ${
                canProceedToNextStep() && !loading
                  ? 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  : 'text-gray-400 bg-gray-300 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : 'Complete Verification'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

KYCForm.propTypes = {
  onComplete: PropTypes.func,
  initialStep: PropTypes.number
};

export default KYCForm;