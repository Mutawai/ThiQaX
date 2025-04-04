import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

const VerificationSent = () => {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  
  // Get email from state passed by registration form
  const email = location.state?.email || 'your email';

  const handleResendVerification = async () => {
    try {
      setResending(true);
      setError(null);
      
      // This would be an API call to resend verification email
      // For now, we'll simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setResendSuccess(true);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <svg
        className="w-16 h-16 mx-auto mb-4 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        ></path>
      </svg>
      <h2 className="mb-2 text-2xl font-bold text-center text-gray-800">
        Verify Your Email
      </h2>
      <p className="mb-6 text-center text-gray-600">
        We've sent a verification link to <strong>{email}</strong>. Please check your email and click the link to verify your account.
      </p>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}
      
      {resendSuccess && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
          Verification email sent successfully!
        </div>
      )}
      
      <div className="text-center">
        <Link
          to="/login"
          className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Go to Login
        </Link>
        <button
          onClick={handleResendVerification}
          disabled={resending}
          className="block mx-auto mt-4 text-sm text-blue-600 hover:underline disabled:opacity-50 disabled:hover:no-underline"
        >
          {resending ? 'Resending...' : "Didn't receive an email? Send again"}
        </button>
      </div>
    </div>
  );
};

export default VerificationSent;
