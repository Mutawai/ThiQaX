import axios from 'axios';

// Create an axios instance with base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// KYC service methods
const kycService = {
  // Get KYC status for current user
  getKycStatus: async () => {
    try {
      const response = await api.get('/kyc/status');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch KYC status' };
    }
  },

  // Submit identity verification
  submitIdentityVerification: async (formData) => {
    try {
      // Need to use FormData for file uploads
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      const response = await api.post('/kyc/identity', formData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit identity verification' };
    }
  },

  // Submit address verification
  submitAddressVerification: async (formData) => {
    try {
      // Need to use FormData for file uploads
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      const response = await api.post('/kyc/address', formData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit address verification' };
    }
  },

  // Submit professional verification (CV, certificates, etc.)
  submitProfessionalVerification: async (formData) => {
    try {
      // Need to use FormData for file uploads
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      const response = await api.post('/kyc/professional', formData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit professional verification' };
    }
  },

  // Get verification documents
  getVerificationDocuments: async (documentType) => {
    try {
      const response = await api.get(`/kyc/documents${documentType ? `?type=${documentType}` : ''}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch verification documents' };
    }
  },

  // Delete a verification document
  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/kyc/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete document' };
    }
  },

  // For admin/agent: Get verification requests
  getVerificationRequests: async (status = 'pending') => {
    try {
      const response = await api.get(`/kyc/requests?status=${status}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch verification requests' };
    }
  },

  // For admin/agent: Approve verification request
  approveVerification: async (requestId, feedback = '') => {
    try {
      const response = await api.put(`/kyc/requests/${requestId}/approve`, { feedback });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to approve verification' };
    }
  },

  // For admin/agent: Reject verification request
  rejectVerification: async (requestId, reason) => {
    try {
      const response = await api.put(`/kyc/requests/${requestId}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject verification' };
    }
  }
};

export default kycService;
