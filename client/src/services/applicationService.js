import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

const applicationService = {
  // Get applications for current user
  getUserApplications: async (params = {}) => {
    return await apiClient.get('/applications', { params });
  },
  
  // Get application details
  getApplicationById: async (id) => {
    return await apiClient.get(`/applications/${id}`);
  },
  
  // Create new application
  createApplication: async (applicationData) => {
    return await apiClient.post('/applications', applicationData);
  },
  
  // Update application
  updateApplication: async (id, applicationData) => {
    return await apiClient.put(`/applications/${id}`, applicationData);
  },
  
  // Accept job offer
  acceptOffer: async (id) => {
    return await apiClient.post(`/applications/${id}/accept-offer`);
  },
  
  // Decline job offer
  declineOffer: async (id, reason) => {
    return await apiClient.post(`/applications/${id}/decline-offer`, { reason });
  },
  
  // Submit application feedback
  submitFeedback: async (id, feedbackData) => {
    return await apiClient.post(`/applications/${id}/feedback`, feedbackData);
  },
  
  // Withdraw application
  withdrawApplication: async (id, reason) => {
    return await apiClient.post(`/applications/${id}/withdraw`, { reason });
  }
};

export default applicationService;