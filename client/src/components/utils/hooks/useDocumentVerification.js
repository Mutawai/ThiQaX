// src/components/utils/hooks/useDocumentVerification.js
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateDocumentStatus,
  linkDocumentsToApplication,
  checkDocumentExpiry
} from '../../../redux/actions/documentActions';

/**
 * Custom hook for document verification functionality
 * @param {string} documentId - ID of document to verify (optional)
 * @returns {Object} Document verification utilities
 */
const useDocumentVerification = (documentId = null) => {
  const [verifying, setVerifying] = useState(false);
  const [linking, setLinking] = useState(false);
  const [checkingExpiry, setCheckingExpiry] = useState(false);
  const [error, setError] = useState(null);
  
  const dispatch = useDispatch();
  const { document, documents, expiringDocuments } = useSelector(state => state.document);
  
  // Reset error when documentId changes
  useEffect(() => {
    setError(null);
  }, [documentId]);
  
  // Verify a document
  const verifyDocument = useCallback(async (id = documentId, status = 'VERIFIED', reason = '') => {
    if (!id) {
      setError('Document ID is required for verification');
      return null;
    }
    
    try {
      setVerifying(true);
      setError(null);
      
      const statusData = {
        status,
        reason: status === 'REJECTED' ? reason : undefined
      };
      
      const result = await dispatch(updateDocumentStatus(id, statusData));
      setVerifying(false);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to update document verification status');
      setVerifying(false);
      return null;
    }
  }, [dispatch, documentId]);
  
  // Reject a document with reason
  const rejectDocument = useCallback((id = documentId, reason) => {
    return verifyDocument(id, 'REJECTED', reason);
  }, [verifyDocument, documentId]);
  
  // Check if a document is verified
  const isDocumentVerified = useCallback((id = documentId) => {
    if (!id) return false;
    
    // Check single document if it matches the ID
    if (document && document._id === id) {
      return document.verificationStatus === 'VERIFIED';
    }
    
    // Otherwise search in documents array
    const foundDoc = documents.find(doc => doc._id === id);
    return foundDoc ? foundDoc.verificationStatus === 'VERIFIED' : false;
  }, [document, documents, documentId]);
  
  // Link documents to an application
  const linkToApplication = useCallback(async (applicationId, documentIds) => {
    if (!applicationId || !documentIds || documentIds.length === 0) {
      setError('Application ID and at least one document ID are required');
      return null;
    }
    
    try {
      setLinking(true);
      setError(null);
      
      const result = await dispatch(linkDocumentsToApplication(applicationId, documentIds));
      setLinking(false);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to link documents to application');
      setLinking(false);
      return null;
    }
  }, [dispatch]);
  
  // Check for documents expiring soon
  const checkExpiration = useCallback(async () => {
    try {
      setCheckingExpiry(true);
      setError(null);
      
      const result = await dispatch(checkDocumentExpiry());
      setCheckingExpiry(false);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to check document expiration');
      setCheckingExpiry(false);
      return null;
    }
  }, [dispatch]);
  
  // Calculate days until expiration for a document
  const getDaysUntilExpiration = useCallback((id = documentId) => {
    if (!id) return null;
    
    // Find the document
    let doc = null;
    if (document && document._id === id) {
      doc = document;
    } else {
      doc = documents.find(d => d._id === id);
    }
    
    if (!doc || !doc.expiryDate) return null;
    
    const today = new Date();
    const expiryDate = new Date(doc.expiryDate);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [document, documents, documentId]);
  
  // Get document verification status
  const getDocumentStatus = useCallback((id = documentId) => {
    if (!id) return null;
    
    // Find the document
    let doc = null;
    if (document && document._id === id) {
      doc = document;
    } else {
      doc = documents.find(d => d._id === id);
    }
    
    if (!doc) return null;
    
    return {
      status: doc.verificationStatus,
      verifiedAt: doc.verifiedAt,
      verifiedBy: doc.verifiedBy,
      rejectionReason: doc.rejectionReason,
      expiryDate: doc.expiryDate,
      daysUntilExpiration: getDaysUntilExpiration(id)
    };
  }, [document, documents, documentId, getDaysUntilExpiration]);
  
  return {
    verifyDocument,
    rejectDocument,
    isDocumentVerified,
    linkToApplication,
    checkExpiration,
    getDaysUntilExpiration,
    getDocumentStatus,
    verifying,
    linking,
    checkingExpiry,
    expiringDocuments,
    error
  };
};

export default useDocumentVerification;