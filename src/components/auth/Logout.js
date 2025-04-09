import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

/**
 * Logout component that handles user logout and redirects to login page
 * Can show a brief success message before redirecting
 */
const Logout = () => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        // Small delay to show success message before redirect
        setTimeout(() => {
          setIsLoggingOut(false);
        }, 1500);
      } catch (err) {
        setError(err.message || 'Failed to logout. Please try again.');
        // Even if there's an error, we'll redirect after a delay
        setTimeout(() => {
          setIsLoggingOut(false);
        }, 3000);
      }
    };

    performLogout();
  }, [logout]);

  // Redirect to login page once logout is complete
  if (!isLoggingOut) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        {error ? (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-blue-100">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-800">Logging Out</h2>
            <p className="text-gray-600">Please wait while we securely log you out...</p>
            <div className="flex justify-center mt-6">
              <div className="w-6 h-6 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logout;
