// src/components/auth/useAuth.js
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

/**
 * Custom hook for accessing authentication context
 * Provides convenient access to all auth-related state and methods
 * 
 * @returns {Object} Auth context with all authentication state and methods
 */
const useAuth = () => {
  const context = useContext(AuthContext);

  // Throw error if used outside of AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;