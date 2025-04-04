import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import authService from '../../services/authService';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        if (!token) {
          setError('Invalid verification link. Please request a new one.');
          setLoading(false);
          return;
        }

        // Call API to verify email
        await authService.verifyEmail(token);
        setVerified(true);
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (err) {
        setError(err.message || 'Failed to verify email. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmailToken();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-center text-gray-600">
          Verifying your email...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <h2 className="mb-2 text-2xl font-bold text-center text-gray-800">
          Verification Failed
        </h2>
        <p className="mb-6 text-center text-gray-600">
          {error}
        </p>
        <div className="text-center">
          <Link
            to="/login"
            className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <svg
        className="w-16 h-16 mx-auto mb-4 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <h2 className="mb-2 text-2xl font-bold text-center text-gray-800">
        Email Verified Successfully
      </h2>
      <p className="mb-6 text-center text-gray-600">
        Thank you for verifying your email address. You can now access all features of ThiQaX. You will be redirected to your dashboard shortly.
      </p>
      <div className="text-center">
        <Link
          to="/dashboard"
          className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
