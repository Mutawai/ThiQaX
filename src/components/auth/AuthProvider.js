import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../../services/authService';

// Create auth context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Initialize authentication state on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        // Check if user is already logged in (token exists and is valid)
        const user = await authService.getCurrentUser();
        
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        // Clear any invalid tokens if there's an error
        authService.logout();
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login handler
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.login(credentials);
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      
      return result;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.register(userData);
      return result;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await authService.updateProfile(userData);
      setCurrentUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      setError(err.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user KYC is verified
  const isKycVerified = () => {
    return currentUser?.kycVerified === true;
  };

  // Check if user has completed their profile
  const isProfileComplete = () => {
    return currentUser?.profileComplete === true;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return currentUser?.role === role;
  };

  // Context value
  const value = {
    currentUser,
    loading,
    isAuthenticated,
    error,
    login,
    logout,
    register,
    updateProfile,
    isKycVerified,
    isProfileComplete,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
