import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  getDocuments,
  getDocument,
  uploadDocument,
  deleteDocument,
  updateDocumentStatus,
  clearDocumentErrors
} from '../../../redux/actions/documentActions';
import { 
  updateDocumentVerification,
  checkDocumentExpirations,
  linkDocumentsToApplication
} from '../../../services/integrationService';

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

const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

const DocumentVerification = ({ 
  documentId, 
  showAdminActions = false, 
  applicationId = null,
  onVerificationComplete,
  onDocumentUpdate 
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { document, documents, loading, error, actionLoading } = useSelector(state => state.document);
  const { user } = useSelector(state => state.auth || {});
  
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [draggedOver, setDraggedOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [documentMetadata, setDocumentMetadata] = useState(null);
  const [expirationWarning, setExpirationWarning] = useState(null);

  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    } else {
      loadDocuments();
    }
  }, [documentId, dispatch]);

  useEffect(() => {
    if (document) {
      setSelectedDocument(document);
      setVerificationStatus(document.verificationStatus || VERIFICATION_STATUS.PENDING);
      setVerificationNotes(document.verificationNotes || '');
      checkDocumentExpiration(document);
    }
  }, [document]);

  const loadDocument = async (id) => {
    try {
      await dispatch(getDocument(id));
    } catch (err) {
      console.error('Failed to load document:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      await dispatch(getDocuments());
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const checkDocumentExpiration = (doc) => {
    if (doc.expiryDate) {
      const expiryDate = new Date(doc.expiryDate);
      const currentDate = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) {
        setExpirationWarning({
          type: 'expired',
          message: 'This document has expired',
          days: Math.abs(daysUntilExpiry)
        });
      } else if (daysUntilExpiry <= 30) {
        setExpirationWarning({
          type: 'expiring',
          message: `This document expires in ${daysUntilExpiry} days`,
          days: daysUntilExpiry
        });
      } else {
        setExpirationWarning(null);
      }
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
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('description', DOCUMENT_LABELS[documentType]);

    try {
      const result = await dispatch(uploadDocument(formData));
      
      if (result.payload) {
        setSelectedDocument(result.payload);
        setUploadMode(false);
        
        // Link to application if provided
        if (applicationId && result.payload._id) {
          await linkDocumentsToApplication(applicationId, [result.payload._id]);
        }
        
        if (onDocumentUpdate) {
          onDocumentUpdate(result.payload);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }, [dispatch, applicationId, onDocumentUpdate]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDraggedOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && selectedDocument) {
      handleFileUpload(files[0], selectedDocument.documentType);
    }
  }, [handleFileUpload, selectedDocument]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDraggedOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDraggedOver(false);
  }, []);

  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file && selectedDocument) {
      handleFileUpload(file, selectedDocument.documentType);
    }
  }, [handleFileUpload, selectedDocument]);

  const handleVerificationUpdate = async (status, notes = '') => {
    if (!selectedDocument || !showAdminActions) return;

    try {
      const verificationData = {
        verificationStatus: status,
        verificationNotes: notes,
        verifiedBy: user?._id,
        verifiedAt: new Date().toISOString()
      };

      // Update via integration service
      await updateDocumentVerification(selectedDocument._id, verificationData);
      
      // Update local state
      await dispatch(updateDocumentStatus(selectedDocument._id, verificationData));
      
      setVerificationStatus(status);
      setVerificationNotes(notes);

      if (onVerificationComplete) {
        onVerificationComplete(selectedDocument, status);
      }
    } catch (err) {
      console.error('Failed to update verification:', err);
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;

    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await dispatch(deleteDocument(selectedDocument._id));
        setSelectedDocument(null);
        
        if (onDocumentUpdate) {
          onDocumentUpdate(null);
        }
      } catch (err) {
        console.error('Failed to delete document:', err);
      }
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      [VERIFICATION_STATUS.PENDING]: {
        color: 'yellow',
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        icon: 'clock'
      },
      [VERIFICATION_STATUS.VERIFIED]: {
        color: 'green',
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: 'check-circle'
      },
      [VERIFICATION_STATUS.REJECTED]: {
        color: 'red',
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: 'x-circle'
      },
      [VERIFICATION_STATUS.EXPIRED]: {
        color: 'orange',
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        icon: 'exclamation-triangle'
      }
    };
    
    return configs[status] || configs[VERIFICATION_STATUS.PENDING];
  };

  const renderStatusIcon = (iconType, className = "h-5 w-5") => {
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
      'exclamation-triangle': (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    };
    
    return icons[iconType] || icons['clock'];
  };

  const renderDocumentPreview = () => {
    if (!selectedDocument) return null;

    const isPDF = selectedDocument.mimeType === 'application/pdf';
    const isImage = selectedDocument.mimeType?.startsWith('image/');

    return (
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="text-center">
          {isImage ? (
            <div className="relative">
              <img
                src={selectedDocument.fileUrl || selectedDocument.previewUrl}
                alt={selectedDocument.originalName}
                className="max-w-full max-h-96 mx-auto rounded-lg shadow-md cursor-pointer"
                onClick={() => setPreviewMode(true)}
              />
              <button
                onClick={() => setPreviewMode(true)}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          ) : isPDF ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="h-16 w-16 text-red-500 mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">PDF Document</p>
              <p className="text-sm text-gray-500 mb-4">{selectedDocument.originalName}</p>
              <button
                onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open PDF
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">Document</p>
              <p className="text-sm text-gray-500">{selectedDocument.originalName}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDocumentMetadata = () => {
    if (!selectedDocument) return null;

    const statusConfig = getStatusConfig(selectedDocument.verificationStatus);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Document Information</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
            {renderStatusIcon(statusConfig.icon, "h-4 w-4 mr-1")}
            {selectedDocument.verificationStatus || 'Pending'}
          </span>
        </div>

        {/* Expiration Warning */}
        {expirationWarning && (
          <div className={`mb-4 p-4 rounded-md ${
            expirationWarning.type === 'expired' 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex">
              <svg 
                className={`h-5 w-5 ${
                  expirationWarning.type === 'expired' ? 'text-red-400' : 'text-yellow-400'
                } mr-2`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className={`text-sm font-medium ${
                  expirationWarning.type === 'expired' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {expirationWarning.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Document Type</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {DOCUMENT_LABELS[selectedDocument.documentType] || selectedDocument.documentType}
            </dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">File Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{selectedDocument.originalName}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">File Size</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {selectedDocument.fileSize 
                ? `${(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB`
                : 'Unknown'
              }
            </dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Upload Date</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {selectedDocument.uploadedAt 
                ? new Date(selectedDocument.uploadedAt).toLocaleDateString()
                : 'Unknown'
              }
            </dd>
          </div>

          {selectedDocument.expiryDate && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(selectedDocument.expiryDate).toLocaleDateString()}
              </dd>
            </div>
          )}

          {selectedDocument.verifiedAt && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Verified Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(selectedDocument.verifiedAt).toLocaleDateString()}
              </dd>
            </div>
          )}
        </dl>

        {selectedDocument.verificationNotes && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500">Verification Notes</dt>
            <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {selectedDocument.verificationNotes}
            </dd>
          </div>
        )}
      </div>
    );
  };

  const renderVerificationActions = () => {
    if (!showAdminActions || !selectedDocument) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Actions</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="verification-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Notes
            </label>
            <textarea
              id="verification-notes"
              rows={3}
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Add notes about the verification decision..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleVerificationUpdate(VERIFICATION_STATUS.VERIFIED, verificationNotes)}
              disabled={actionLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {actionLoading ? 'Verifying...' : 'Approve'}
            </button>

            <button
              onClick={() => handleVerificationUpdate(VERIFICATION_STATUS.REJECTED, verificationNotes)}
              disabled={actionLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {actionLoading ? 'Rejecting...' : 'Reject'}
            </button>

            <button
              onClick={() => handleVerificationUpdate(VERIFICATION_STATUS.PENDING, verificationNotes)}
              disabled={actionLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Reset to Pending
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUploadReplacement = () => {
    if (!uploadMode) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Replace Document</h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            draggedOver
              ? 'border-indigo-400 bg-indigo-50'
              : validationErrors.length > 0
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-indigo-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-replacement').click()}
        >
          <input
            id="file-replacement"
            type="file"
            className="hidden"
            accept={ACCEPTED_FILE_TYPES.join(',')}
            onChange={handleFileInputChange}
          />
          
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
        </div>

        {validationErrors.length > 0 && (
          <div className="mt-4">
            {validationErrors.map((error, index) => (
              <p key={index} className="text-sm text-red-600">
                {error}
              </p>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={() => setUploadMode(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderDocumentActions = () => {
    if (!selectedDocument) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Document Actions</h3>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setUploadMode(true)}
            disabled={actionLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Replace Document
          </button>

          {selectedDocument.fileUrl && (
            <a
              href={selectedDocument.fileUrl}
              download={selectedDocument.originalName}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </a>
          )}

          <button
            onClick={handleDeleteDocument}
            disabled={actionLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Document
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
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
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Document</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedDocument && !documents.length) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by uploading a document for verification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Preview */}
      {selectedDocument && renderDocumentPreview()}
      
      {/* Document Metadata */}
      {selectedDocument && renderDocumentMetadata()}
      
      {/* Upload Replacement */}
      {uploadMode && renderUploadReplacement()}
      
      {/* Admin Verification Actions */}
      {renderVerificationActions()}
      
      {/* Document Actions */}
      {selectedDocument && renderDocumentActions()}

      {/* Full Screen Preview Modal */}
      {previewMode && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-full max-h-full p-4">
            <button
              onClick={() => setPreviewMode(false)}
              className="absolute top-0 right-0 m-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedDocument.fileUrl || selectedDocument.previewUrl}
              alt={selectedDocument.originalName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

DocumentVerification.propTypes = {
  documentId: PropTypes.string,
  showAdminActions: PropTypes.bool,
  applicationId: PropTypes.string,
  onVerificationComplete: PropTypes.func,
  onDocumentUpdate: PropTypes.func
};

export default DocumentVerification;