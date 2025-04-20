// src/components/utils/hooks/useBlockchainVerification.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { useSelector } from 'react-redux';
import config from '../../../config';

// ABI for the ThiQaX verification contract
const VERIFICATION_CONTRACT_ABI = [
  'function verifyDocument(bytes32 documentHash, string metadata) external returns (uint256)',
  'function getVerification(uint256 verificationId) external view returns (bytes32 documentHash, address verifier, uint256 timestamp, string metadata, bool isValid)',
  'function validateDocument(bytes32 documentHash) external view returns (bool isValid, uint256 verificationId, uint256 timestamp)',
  'function revokeVerification(uint256 verificationId) external returns (bool)'
];

/**
 * Custom hook for blockchain verification functionality
 * @returns {Object} Blockchain verification utilities
 */
const useBlockchainVerification = () => {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user } = useSelector(state => state.auth);
  
  // Initialize ethers provider and contract
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        // Use the configured provider
        let ethersProvider;
        
        if (config.blockchain.useMetaMask && window.ethereum) {
          // Use MetaMask if available
          ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
          
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        } else {
          // Otherwise use the configured RPC endpoint
          ethersProvider = new ethers.providers.JsonRpcProvider(config.blockchain.rpcUrl);
        }
        
        // Create contract instance
        const verificationContract = new ethers.Contract(
          config.blockchain.verificationContractAddress,
          VERIFICATION_CONTRACT_ABI,
          ethersProvider
        );
        
        setProvider(ethersProvider);
        setContract(verificationContract);
        setIsConnected(true);
        setError(null);
      } catch (err) {
        console.error('Blockchain initialization error:', err);
        setError('Failed to connect to blockchain: ' + err.message);
        setIsConnected(false);
      }
    };
    
    initBlockchain();
  }, []);
  
  // Calculate SHA-256 hash of a document
  const calculateDocumentHash = useCallback(async (fileOrData) => {
    try {
      let fileBuffer;
      
      if (fileOrData instanceof File) {
        // Convert File to ArrayBuffer
        fileBuffer = await fileOrData.arrayBuffer();
      } else if (typeof fileOrData === 'string') {
        // Convert string to ArrayBuffer
        const encoder = new TextEncoder();
        fileBuffer = encoder.encode(fileOrData).buffer;
      } else if (fileOrData instanceof ArrayBuffer) {
        fileBuffer = fileOrData;
      } else {
        throw new Error('Invalid input type. Expected File, string, or ArrayBuffer.');
      }
      
      // Hash the file using Web Crypto API
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      
      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    } catch (err) {
      setError('Error calculating document hash: ' + err.message);
      throw err;
    }
  }, []);
  
  // Submit a document verification to the blockchain
  const verifyDocumentOnChain = useCallback(async (documentId, documentHash, metadata = '') => {
    if (!isConnected || !contract) {
      setError('Blockchain connection not established');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Need a signer to send transactions
      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      
      // Submit verification transaction
      const tx = await contractWithSigner.verifyDocument(documentHash, metadata);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Parse logs to get the verification ID
      const verificationId = receipt.logs[0].topics[1];
      
      // Store verification result in API
      await axios.post(
        `${config.apiBaseUrl}/api/v1/blockchain/verifications`, 
        {
          documentId,
          verificationId,
          documentHash,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          metadata
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );
      
      setIsLoading(false);
      
      return {
        documentId,
        verificationId,
        documentHash,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (err) {
      setError('Error verifying document on blockchain: ' + err.message);
      setIsLoading(false);
      return null;
    }
  }, [isConnected, contract, provider, user]);
  
  // Verify a document hash against the blockchain
  const validateDocumentHash = useCallback(async (documentHash) => {
    if (!isConnected || !contract) {
      setError('Blockchain connection not established');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the validation function
      const [isValid, verificationId, timestamp] = await contract.validateDocument(documentHash);
      
      setIsLoading(false);
      
      return {
        isValid,
        verificationId: verificationId.toString(),
        timestamp: new Date(timestamp.toNumber() * 1000),
        documentHash
      };
    } catch (err) {
      setError('Error validating document on blockchain: ' + err.message);
      setIsLoading(false);
      return null;
    }
  }, [isConnected, contract]);
  
  // Get details of a verification by ID
  const getVerificationDetails = useCallback(async (verificationId) => {
    if (!isConnected || !contract) {
      setError('Blockchain connection not established');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get verification details from contract
      const [documentHash, verifier, timestamp, metadata, isValid] = 
        await contract.getVerification(verificationId);
      
      setIsLoading(false);
      
      return {
        documentHash,
        verifier,
        timestamp: new Date(timestamp.toNumber() * 1000),
        metadata,
        isValid,
        verificationId
      };
    } catch (err) {
      setError('Error getting verification details: ' + err.message);
      setIsLoading(false);
      return null;
    }
  }, [isConnected, contract]);
  
  // Revoke a verification
  const revokeVerification = useCallback(async (verificationId) => {
    if (!isConnected || !contract) {
      setError('Blockchain connection not established');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Need a signer to send transactions
      const signer = provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      
      // Submit revocation transaction
      const tx = await contractWithSigner.revokeVerification(verificationId);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Update verification status in API
      await axios.put(
        `${config.apiBaseUrl}/api/v1/blockchain/verifications/${verificationId}/revoke`,
        {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );
      
      setIsLoading(false);
      return true;
    } catch (err) {
      setError('Error revoking verification: ' + err.message);
      setIsLoading(false);
      return false;
    }
  }, [isConnected, contract, provider, user]);
  
  // Get verification history for a document from API
  const getDocumentVerificationHistory = useCallback(async (documentId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${config.apiBaseUrl}/api/v1/blockchain/verifications/document/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );
      
      setIsLoading(false);
      return response.data.data;
    } catch (err) {
      setError('Error fetching verification history: ' + err.message);
      setIsLoading(false);
      return [];
    }
  }, [user]);
  
  return {
    isConnected,
    isLoading,
    error,
    calculateDocumentHash,
    verifyDocumentOnChain,
    validateDocumentHash,
    getVerificationDetails,
    revokeVerification,
    getDocumentVerificationHistory
  };
};

export default useBlockchainVerification;