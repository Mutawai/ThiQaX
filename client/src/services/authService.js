import axios from 'axios';
import jwtDecode from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Set token to localStorage and add to authorization header
const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Initialize axios with token from localStorage if available
const initializeAuth = () => {
  const token = getToken();
  if (token) {
    // Check if token is expired
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired
        setToken(null);
        return false;
      } else {
        // Token valid
        setToken(token);
        return true;
      }
    } catch (error) {
      // Invalid token
      setToken(null);
      return false;
    }
  }
  return false;
};

// Set up axios interceptor for 401 responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized - clear token and redirect to login
      setToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Initialize on service load
initializeAuth();

const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const { token, user } = response.data;
      setToken(token);
      return { token, user };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Logout user
  logout: () => {
    setToken(null);
  },

  // Get current user from token
  getCurrentUser: async () => {
    try {
      if (!getToken()) return null;
      
      const response = await axios.get(`${API_URL}/auth/me`);
      return response.data.user;
    } catch (error) {
      setToken(null);
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  },

  // Request password reset
  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to request password reset');
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, { 
        token, 
        password: newPassword 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-email`, { token });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to verify email');
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await axios.put(`${API_URL}/auth/profile`, userData);
      return response.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getToken();
  },

  // Get token
  getToken,
};

export default authService;
