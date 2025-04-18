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

// Response interceptor for API calls
apiClient.interceptors.response.use(
  response => response,
  error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      // Handle token refresh or logout logic here
      // For example, redirect to login page or refresh token
      // This depends on your authentication implementation
    }
    return Promise.reject(error);
  }
);

const adminService = {
  // Dashboard API
  getDashboardData: async () => {
    return await apiClient.get('/admin/dashboard');
  },
  
  // Users API
  getUsers: async (params = {}) => {
    return await apiClient.get('/admin/users', { params });
  },
  
  getUserById: async (id) => {
    return await apiClient.get(`/admin/users/${id}`);
  },
  
  createUser: async (userData) => {
    return await apiClient.post('/admin/users', userData);
  },
  
  updateUser: async (id, userData) => {
    return await apiClient.put(`/admin/users/${id}`, userData);
  },
  
  deleteUser: async (id) => {
    return await apiClient.delete(`/admin/users/${id}`);
  },
  
  // Verification Requests API
  getVerificationRequests: async (params = {}) => {
    return await apiClient.get('/admin/verifications', { params });
  },
  
  getVerificationById: async (id) => {
    return await apiClient.get(`/admin/verifications/${id}`);
  },
  
  approveVerification: async (id, comments = '') => {
    return await apiClient.post(`/admin/verifications/${id}/approve`, { comments });
  },
  
  rejectVerification: async (id, reason) => {
    return await apiClient.post(`/admin/verifications/${id}/reject`, { reason });
  },
  
  // Jobs API
  getJobs: async (params = {}) => {
    return await apiClient.get('/admin/jobs', { params });
  },
  
  getJobById: async (id) => {
    return await apiClient.get(`/admin/jobs/${id}`);
  },
  
  verifyJob: async (id, verificationData) => {
    return await apiClient.post(`/admin/jobs/${id}/verify`, verificationData);
  },
  
  // Disputes API
  getDisputes: async (params = {}) => {
    return await apiClient.get('/admin/disputes', { params });
  },
  
  getDisputeById: async (id) => {
    return await apiClient.get(`/admin/disputes/${id}`);
  },
  
  resolveDispute: async (id, resolutionData) => {
    return await apiClient.post(`/admin/disputes/${id}/resolve`, resolutionData);
  },
  
  // System API
  getSystemStatus: async () => {
    return await apiClient.get('/admin/system/status');
  },
  
  getDatabaseStats: async () => {
    return await apiClient.get('/admin/system/database');
  },
  
  initiateBackup: async () => {
    return await apiClient.post('/admin/system/backup');
  }
};

// For development/testing, implement mock response handling
if (process.env.REACT_APP_USE_MOCK_API === 'true') {
  const mockResponses = {
    // Mock Dashboard Data
    '/admin/dashboard': {
      metrics: {
        totalUsers: 1245,
        verificationRequests: 23,
        activeJobs: 128,
        pendingDisputes: 5
      },
      recentVerifications: [
        {
          id: 'ver1',
          applicantName: 'John Doe',
          documentType: 'Passport',
          status: 'pending',
          submittedDate: '2025-04-15'
        },
        {
          id: 'ver2',
          applicantName: 'Jane Smith',
          documentType: 'Address Proof',
          status: 'pending',
          submittedDate: '2025-04-14'
        }
      ],
      recentUsers: [
        {
          id: 'user1',
          name: 'Michael Johnson',
          email: 'michael@example.com',
          role: 'jobSeeker',
          joinedDate: '2025-04-12'
        },
        {
          id: 'user2',
          name: 'Sarah Williams',
          email: 'sarah@example.com',
          role: 'agent',
          joinedDate: '2025-04-11'
        }
      ],
      recentJobs: [
        {
          id: 'job1',
          title: 'Senior Housekeeper',
          company: 'Al Faisal Hospitality',
          status: 'published',
          postedDate: '2025-04-10'
        },
        {
          id: 'job2',
          title: 'Restaurant Manager',
          company: 'Luxury Dining Group',
          status: 'pending_verification',
          postedDate: '2025-04-08'
        }
      ],
      systemStatus: {
        apiStatus: 'healthy',
        databaseStatus: 'healthy',
        lastBackupTime: '2025-04-18T01:30:00Z',
        serverLoad: 0.2
      }
    },
    
    // Mock Users Data
    '/admin/users': {
      users: [
        {
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'jobSeeker',
          status: 'active',
          joinedDate: '2025-03-15',
          lastLogin: '2025-04-15'
        },
        {
          id: 'user2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'agent',
          status: 'active',
          joinedDate: '2025-03-20',
          lastLogin: '2025-04-16'
        },
        {
          id: 'user3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'sponsor',
          status: 'active',
          joinedDate: '2025-03-25',
          lastLogin: '2025-04-10'
        },
        {
          id: 'user4',
          name: 'Alice Williams',
          email: 'alice@example.com',
          role: 'jobSeeker',
          status: 'inactive',
          joinedDate: '2025-04-01',
          lastLogin: '2025-04-05'
        },
        {
          id: 'user5',
          name: 'Charlie Brown',
          email: 'charlie@example.com',
          role: 'admin',
          status: 'active',
          joinedDate: '2025-02-15',
          lastLogin: '2025-04-18'
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 5
      }
    }
  };
  
  // Override the actual API methods with mock implementations
  Object.keys(adminService).forEach(method => {
    const originalMethod = adminService[method];
    
    adminService[method] = async (...args) => {
      // For demo/development, simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      try {
        // Call the original method to get the URL
        const result = await originalMethod(...args);
        
        // Check if we have a mock response for this URL
        const url = result.config.url;
        
        if (mockResponses[url]) {
          console.log(`[MOCK API] ${url}`, args);
          return { data: mockResponses[url] };
        }
        
        // If no mock response, log a warning and return an empty successful response
        console.warn(`[MOCK API] No mock response defined for ${url}`);
        return { data: {} };
      } catch (error) {
        console.error('[MOCK API] Error', error);
        throw error;
      }
    };
  });
}

export default adminService;