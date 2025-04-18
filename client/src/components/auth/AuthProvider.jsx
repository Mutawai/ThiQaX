// src/components/auth/AuthProvider.jsx
import React, { createContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { setAuthToken, removeAuthToken } from '../../utils/authToken';
import config from '../../config';

// Create auth context
export const AuthContext = createContext();

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  token: localStorage.getItem('token')
};

// Reducer for auth state management
const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      setAuthToken(action.payload.token);
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        loading: false
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      removeAuthToken();
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    default:
      return state;
  }
};

// Auth Provider component
const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (localStorage.token) {
        setAuthToken(localStorage.token);
        
        try {
          const res = await axios.get(`${config.apiBaseUrl}/api/v1/auth/me`);
          
          dispatch({
            type: 'USER_LOADED',
            payload: res.data.data
          });
        } catch (err) {
          dispatch({
            type: 'AUTH_ERROR',
            payload: err.response?.data?.message || 'Authentication failed'
          });
        }
      } else {
        dispatch({
          type: 'AUTH_ERROR'
        });
      }
    };

    loadUser();
  }, []);

  // Login user
  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING' });

    try {
      const res = await axios.post(`${config.apiBaseUrl}/api/v1/auth/login`, {
        email,
        password
      });

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data.data
      });

      return res.data.data;
    } catch (err) {
      dispatch({
        type: 'LOGIN_FAIL',
        payload: err.response?.data?.message || 'Login failed'
      });
      throw err;
    }
  };

  // Register user
  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING' });

    try {
      const res = await axios.post(`${config.apiBaseUrl}/api/v1/auth/register`, userData);

      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: res.data.data
      });

      return res.data.data;
    } catch (err) {
      dispatch({
        type: 'REGISTER_FAIL',
        payload: err.response?.data?.message || 'Registration failed'
      });
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put(`${config.apiBaseUrl}/api/v1/users/profile`, profileData);

      dispatch({
        type: 'UPDATE_USER',
        payload: res.data.data
      });

      return res.data.data;
    } catch (err) {
      // Don't log out on profile update fail
      dispatch({
        type: 'AUTH_ERROR',
        payload: err.response?.data?.message || 'Profile update failed'
      });
      throw err;
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!state.isAuthenticated || !state.user) {
      return false;
    }

    if (Array.isArray(role)) {
      return role.includes(state.user.role);
    }

    return state.user.role === role;
  };

  // Check if user's KYC is verified
  const isKycVerified = () => {
    if (!state.isAuthenticated || !state.user) {
      return false;
    }

    return state.user.kycVerified === true;
  };

  // Clear error messages
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      const res = await axios.post(`${config.apiBaseUrl}/api/v1/auth/forgot-password`, { email });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'Password reset request failed';
    }
  };

  // Reset password with token
  const resetPassword = async (token, password) => {
    try {
      const res = await axios.post(`${config.apiBaseUrl}/api/v1/auth/reset-password`, {
        token,
        password
      });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'Password reset failed';
    }
  };

  // Verify email with token
  const verifyEmail = async (token) => {
    try {
      const res = await axios.post(`${config.apiBaseUrl}/api/v1/auth/verify-email`, { token });
      
      // Update user data if the current user's email was verified
      if (state.user && state.user.email === res.data.data.email) {
        dispatch({
          type: 'UPDATE_USER',
          payload: { emailVerified: true }
        });
      }
      
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || 'Email verification failed';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        updateProfile,
        hasRole,
        isKycVerified,
        clearError,
        requestPasswordReset,
        resetPassword,
        verifyEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;