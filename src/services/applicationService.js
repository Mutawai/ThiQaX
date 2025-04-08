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

// Application service methods
const applicationService = {
  // Get all applications for a job seeker
  getMyApplications: async (filters = {}) => {
    try {
      const response = await api.get('/applications/my-applications', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch applications' };
    }
  },

  // Get applications received (for agents/sponsors)
  getReceivedApplications: async (filters = {}) => {
    try {
      const response = await api.get('/applications/received', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch received applications' };
    }
  },

  // Get application by ID
  getApplicationById: async (applicationId) => {
    try {
      const response = await api.get(`/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch application details' };
    }
  },

  // Submit application
  submitApplication: async (jobId, applicationData) => {
    try {
      const response = await api.post(`/applications/jobs/${jobId}`, applicationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit application' };
    }
  },

  // Update application (partial updates)
  updateApplication: async (applicationId, updateData) => {
    try {
      const response = await api.patch(`/applications/${applicationId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update application' };
    }
  },

  // Withdraw application
  withdrawApplication: async (applicationId, reason = '') => {
    try {
      const response = await api.put(`/applications/${applicationId}/withdraw`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to withdraw application' };
    }
  },

  // For agents/sponsors: Update application status
  updateApplicationStatus: async (applicationId, status, feedback = '') => {
    try {
      const response = await api.put(`/applications/${applicationId}/status`, { status, feedback });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update application status' };
    }
  },

  // Check application eligibility for a job
  checkEligibility: async (jobId) => {
    try {
      const response = await api.get(`/applications/eligibility/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to check eligibility' };
    }
  },

  // Attach documents to application
  attachDocuments: async (applicationId, documentIds) => {
    try {
      const response = await api.post(`/applications/${applicationId}/documents`, { documentIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to attach documents' };
    }
  },

  // Get application timeline/history
  getApplicationTimeline: async (applicationId) => {
    try {
      const response = await api.get(`/applications/${applicationId}/timeline`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch application timeline' };
    }
  },

  // Add a note to an application (internal use for agents/sponsors)
  addApplicationNote: async (applicationId, note) => {
    try {
      const response = await api.post(`/applications/${applicationId}/notes`, { note });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add application note' };
    }
  }
};

export default applicationService;
