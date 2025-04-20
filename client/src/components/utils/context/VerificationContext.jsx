// src/components/utils/context/VerificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import config from '../../../config';
import useDocumentVerification from '../hooks/useDocumentVerification';
import useBlockchainVerification from '../hooks/useBlockchainVerification';

// Create the context
const VerificationContext = createContext();

/**
 * Verification Provider Component
 * Provides verification workflows and state throughout the application
 */
export const VerificationProvider = ({ children }) => {
  const [verifications, setVerifications] = useState([]);
  const [activeVerification, setActiveVerification] = useState(null);
  const [verificationStats, setVerificationStats] = useState({
    pending: 0,
    verified: 0,
    rejected: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const dispatch = useDispatch();
  const { token, user } = useSelector(state => state.auth);
  
  // Access the document and blockchain verification hooks
  const documentVerification = useDocumentVerification();
  const blockchainVerification = useBlockchainVerification();
  
  // Load verification data
  const loadVerifications = useCallback(async (filters = {}) => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query params
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      // Fetch verifications
      const response = await axios.get(
        `${config.apiBaseUrl}/api/v1/verifications?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setVerifications(response.data.data);
      
      // Fetch verification stats
      const statsResponse = await axios.get(
        `${config.apiBaseUrl}/api/v1/verifications/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setVerificationStats(statsResponse.data.data);
      setIsLoading(false);
    } catch (err) {
      setError(`Error loading verifications: ${err.message}`);
      setIsLoading(false);
    }
  }, [token]);
  
  // Load details of a specific verification
  const loadVerificationDetails = useCallback(async (verificationId) => {
    if (!token || !verificationId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${config.apiBaseUrl}/api/v1/verifications/${verificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setActiveVerification(response.data.data);
      setIsLoading(false);
    } catch (err) {
      setError(`Error loading verification details: ${err.message}`);
      setIsLoading(false);
    }
  }, [token]);
  
  // Create a new verification request
  const createVerificationRequest = useCallback(async (data) => {
    if (!token) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${config.apiBaseUrl}/api/v1/verifications`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Add to verifications list
      setVerifications(prev => [response.data.data, ...prev]);
      
      // Update stats
      setVerificationStats(prev => ({
        ...prev,
        pending: prev.pending + 1,
        total: prev.total + 1
      }));
      
      setIsLoading(false);
      return response.data.data;
    } catch (err) {
      setError(`Error creating verification request: ${err.message}`);
      setIsLoading(false);
      return null;
    }
  }, [token]);
  
  // Update verification status
  const updateVerificationStatus = useCallback(async (verificationId, status, notes = '') => {
    if (!token || !verificationId) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Update via API
      const response = await axios.put(
        `${config.apiBaseUrl}/api/v1/verifications/${verificationId}/status`,
        { status, notes },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const updatedVerification = response.data.data;
      
      // Update in state
      setVerifications(prev => 
        prev.map(v => 
          v.id === verificationId ? updatedVerification : v
        )
      );
      
      // Update active verification if it's the same
      if (activeVerification?.id === verificationId) {
        setActiveVerification(updatedVerification);
      }
      
      // Update stats
      // Calculate stat differences based on previous and new status
      if (activeVerification?.status && activeVerification.status !== updatedVerification.status) {
        const statUpdates = {};
        
        // Decrement previous status count
        if (activeVerification.status === 'PENDING') {
          statUpdates.pending = -1;
        } else if (activeVerification.status === 'VERIFIED') {
          statUpdates.verified = -1;
        } else if (activeVerification.status === 'REJECTED') {
          statUpdates.rejected = -1;
        }
        
        // Increment new status count
        if (updatedVerification.status === 'PENDING') {
          statUpdates.pending = (statUpdates.pending || 0) + 1;
        } else if (updatedVerification.status === 'VERIFIED') {
          statUpdates.verified = (statUpdates.verified || 0) + 1;
        } else if (updatedVerification.status === 'REJECTED') {
          statUpdates.rejected = (statUpdates.rejected || 0) + 1;
        }
        
        // Update stats
        setVerificationStats(prev => ({
          ...prev,
          pending: prev.pending + (statUpdates.pending || 0),
          verified: prev.verified + (statUpdates.verified || 0),
          rejected: prev.rejected + (statUpdates.rejected || 0)
        }));
      }
      
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(`Error updating verification status: ${err.message}`);
      setIsLoading(false);
      return false;
    }
  }, [token, activeVerification]);
  
  // Get verification process for a document
  const getDocumentVerificationProcess = useCallback(async (documentId) => {
    if (!token || !documentId) return null;
    
    try {
      const response = await axios.get(
        `${config.apiBaseUrl}/api/v1/documents/${documentId}/verification-process`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data.data;
    } catch (err) {
      setError(`Error getting document verification process: ${err.message}`);
      return null;
    }
  }, [token]);
  
  // Submit document for verification
  const submitDocumentForVerification = useCallback(async (documentId, metadata = {}) => {
    if (!token || !documentId) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create verification request
      const verificationData = {
        type: 'DOCUMENT',
        entityId: documentId,
        metadata
      };
      
      const newVerification = await createVerificationRequest(verificationData);
      
      // Update document status
      const documentStatus = await documentVerification.verifyDocument(
        documentId, 
        'PENDING_VERIFICATION'
      );
      
      setIsLoading(false);
      return newVerification;
    } catch (err) {
      setError(`Error submitting document for verification: ${err.message}`);
      setIsLoading(false);
      return null;
    }
  }, [token, createVerificationRequest, documentVerification]);
  
  // Verify a document with blockchain
  const verifyDocumentWithBlockchain = useCallback(async (documentId, hash) => {
    if (!token || !documentId) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get document data if hash not provided
      let documentHash = hash;
      if (!documentHash) {
        const documentResponse = await axios.get(
          `${config.apiBaseUrl}/api/v1/documents/${documentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Calculate hash from document data
        const document = documentResponse.data.data;
        documentHash = await blockchainVerification.calculateDocumentHash(document.fileUrl);
      }
      
      // Verify on blockchain
      const verificationResult = await blockchainVerification.verifyDocumentOnChain(
        documentId,
        documentHash,
        JSON.stringify({
          userId: user.id,
          timestamp: new Date().toISOString(),
          documentId
        })
      );
      
      // If successful, update document status
      if (verificationResult) {
        await documentVerification.verifyDocument(documentId, 'VERIFIED');
        
        // Create verification record in system
        const verificationData = {
          type: 'BLOCKCHAIN',
          entityId: documentId,
          status: 'VERIFIED',
          metadata: {
            blockchainTransactionHash: verificationResult.transactionHash,
            blockchainVerificationId: verificationResult.verificationId,
            documentHash: verificationResult.documentHash
          }
        };
        
        await createVerificationRequest(verificationData);
      }
      
      setIsLoading(false);
      return verificationResult;
    } catch (err) {
      setError(`Error verifying document with blockchain: ${err.message}`);
      setIsLoading(false);
      return null;
    }
  }, [token, user, blockchainVerification, documentVerification, createVerificationRequest]);
  
  // Validate document with blockchain
  const validateDocumentWithBlockchain = useCallback(async (documentId) => {
    if (!documentId) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get document data
      const documentResponse = await axios.get(
        `${config.apiBaseUrl}/api/v1/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const document = documentResponse.data.data;
      
      // Calculate hash from document data
      const documentHash = await blockchainVerification.calculateDocumentHash(document.fileUrl);
      
      // Validate on blockchain
      const validationResult = await blockchainVerification.validateDocumentHash(documentHash);
      
      setIsLoading(false);
      return validationResult;
    } catch (err) {
      setError(`Error validating document with blockchain: ${err.message}`);
      setIsLoading(false);
      return null;
    }
  }, [token, blockchainVerification]);
  
  // Get verification status for any entity
  const getVerificationStatus = useCallback(async (entityType, entityId) => {
    if (!token || !entityType || !entityId) return null;
    
    try {
      const response = await axios.get(
        `${config.apiBaseUrl}/api/v1/verifications/status/${entityType}/${entityId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data.data;
    } catch (err) {
      setError(`Error getting verification status: ${err.message}`);
      return null;
    }
  }, [token]);
  
  // Load initial data
  useEffect(() => {
    if (token) {
      loadVerifications();
    }
  }, [token, loadVerifications]);
  
  // Context value
  const contextValue = {
    verifications,
    activeVerification,
    verificationStats,
    isLoading,
    error,
    loadVerifications,
    loadVerificationDetails,
    createVerificationRequest,
    updateVerificationStatus,
    getDocumentVerificationProcess,
    submitDocumentForVerification,
    verifyDocumentWithBlockchain,
    validateDocumentWithBlockchain,
    getVerificationStatus,
    // Expose hooks through context
    documentVerification,
    blockchainVerification
  };
  
  return (
    <VerificationContext.Provider value={contextValue}>
      {children}
    </VerificationContext.Provider>
  );
};

// Custom hook for using the verification context
export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};

export default VerificationContext;