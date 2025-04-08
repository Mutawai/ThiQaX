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

// Search service methods
const searchService = {
  // Search jobs with various filters
  searchJobs: async (params) => {
    try {
      const response = await api.get('/search/jobs', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search jobs' };
    }
  },

  // Get job search filters (categories, locations, etc.)
  getJobFilters: async () => {
    try {
      const response = await api.get('/search/jobs/filters');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch job filters' };
    }
  },

  // Search users (based on role and access level)
  searchUsers: async (params) => {
    try {
      const response = await api.get('/search/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search users' };
    }
  },

  // Search agents for sponsors
  searchAgents: async (params) => {
    try {
      const response = await api.get('/search/agents', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search agents' };
    }
  },

  // Search for document submissions
  searchDocuments: async (params) => {
    try {
      const response = await api.get('/search/documents', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search documents' };
    }
  },

  // Get trending searches
  getTrendingSearches: async (type = 'jobs') => {
    try {
      const response = await api.get(`/search/trending/${type}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch trending searches' };
    }
  },

  // Search for applications by various parameters
  searchApplications: async (params) => {
    try {
      const response = await api.get('/search/applications', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search applications' };
    }
  },

  // Search for job categories
  searchCategories: async (query) => {
    try {
      const response = await api.get('/search/categories', { params: { query } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search categories' };
    }
  },

  // Get search suggestion as user types
  getSearchSuggestions: async (type, query) => {
    try {
      const response = await api.get('/search/suggestions', { 
        params: { type, query } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get search suggestions' };
    }
  }
};

export default searchService;
