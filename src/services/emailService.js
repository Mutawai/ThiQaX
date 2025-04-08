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

// Email service methods
const emailService = {
  // Update email preferences
  updateEmailPreferences: async (preferences) => {
    try {
      const response = await api.put('/email/preferences', preferences);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update email preferences' };
    }
  },

  // Get current email preferences
  getEmailPreferences: async () => {
    try {
      const response = await api.get('/email/preferences');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch email preferences' };
    }
  },

  // Verify email address
  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/email/verify/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Email verification failed' };
    }
  },

  // Request email verification link
  requestVerificationEmail: async () => {
    try {
      const response = await api.post('/email/request-verification');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to request verification email' };
    }
  },

  // Update primary email address
  updateEmail: async (newEmail, password) => {
    try {
      const response = await api.put('/email/update', { email: newEmail, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update email address' };
    }
  },

  // Get email history/log
  getEmailHistory: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/email/history', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch email history' };
    }
  },

  // Send custom email (For admin/agent use)
  sendCustomEmail: async (data) => {
    try {
      const response = await api.post('/email/send', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send email' };
    }
  },

  // Get email templates (For admin use)
  getEmailTemplates: async () => {
    try {
      const response = await api.get('/email/templates');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch email templates' };
    }
  },

  // Update email template (For admin use)
  updateEmailTemplate: async (templateId, templateData) => {
    try {
      const response = await api.put(`/email/templates/${templateId}`, templateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update email template' };
    }
  },

  // Report an issue/contact support via email
  contactSupport: async (subject, message, attachments = []) => {
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      
      // Handle file attachments if any
      attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await api.post('/email/support', formData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send support request' };
    }
  }
};

export default emailService;
