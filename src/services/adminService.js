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

// Admin service methods
const adminService = {
  // Dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard statistics' };
    }
  },

  // User management
  getUsers: async (filters = {}) => {
    try {
      const response = await api.get('/admin/users', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Get user details
  getUserDetails: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user details' };
    }
  },

  // Update user (role, status, etc.)
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  // Disable/enable user account
  toggleUserStatus: async (userId, active) => {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, { active });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user status' };
    }
  },

  // Job verification management
  getPendingJobs: async (filters = {}) => {
    try {
      const response = await api.get('/admin/jobs/pending', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pending jobs' };
    }
  },

  // Verify or reject a job
  reviewJob: async (jobId, approved, feedback = '') => {
    try {
      const response = await api.put(`/admin/jobs/${jobId}/review`, { approved, feedback });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to review job' };
    }
  },

  // Document verification management
  getPendingDocuments: async (filters = {}) => {
    try {
      const response = await api.get('/admin/documents/pending', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pending documents' };
    }
  },

  // Verify or reject a document
  reviewDocument: async (documentId, approved, feedback = '') => {
    try {
      const response = await api.put(`/admin/documents/${documentId}/review`, { approved, feedback });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to review document' };
    }
  },

  // System settings
  getSystemSettings: async () => {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch system settings' };
    }
  },

  // Update system settings
  updateSystemSettings: async (settings) => {
    try {
      const response = await api.put('/admin/settings', settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update system settings' };
    }
  },

  // Audit logs
  getAuditLogs: async (filters = {}) => {
    try {
      const response = await api.get('/admin/audit-logs', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch audit logs' };
    }
  },

  // System health check
  getSystemHealth: async () => {
    try {
      const response = await api.get('/admin/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch system health' };
    }
  }
};

export default adminService;
