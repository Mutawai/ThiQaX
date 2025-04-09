import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

/**
 * Route guard component that protects routes based on authentication status and user roles
 * 
 * @param {Object} props Component props
 * @param {Array} props.allowedRoles Array of roles allowed to access the route
 * @param {boolean} props.requireAuth Whether authentication is required
 * @param {boolean} props.requireKyc Whether KYC verification is required
 * @param {boolean} props.requireCompleteProfile Whether complete profile is required
 * @param {string} props.redirectPath Path to redirect to if conditions are not met
 */
const AuthGuard = ({
  allowedRoles = [],
  requireAuth = true,
  requireKyc = false,
  requireCompleteProfile = false,
  redirectPath = '/login',
}) => {
  const { isAuthenticated, currentUser, hasRole, isKycVerified, isProfileComplete, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // For public routes that don't require auth
  if (!requireAuth) {
    // If user is already authenticated and tries to access login/register pages
    if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <Outlet />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.some(role => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check KYC verification if required
  if (requireKyc && !isKycVerified()) {
    return <Navigate to="/kyc-verification" state={{ from: location }} replace />;
  }

  // Check profile completion if required
  if (requireCompleteProfile && !isProfileComplete()) {
    return <Navigate to="/complete-profile" state={{ from: location }} replace />;
  }

  // If all checks pass, render the protected route
  return <Outlet />;
};

export default AuthGuard;
