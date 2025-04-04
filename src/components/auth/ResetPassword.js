import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate, useParams } from 'react-router-dom';
import authService from '../../services/authService';

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams(); // Get token from URL

  // Validation schema
  const validationSchema = Yup.object({
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: Yup.string()
      .required('Please confirm your password')
      .oneOf([Yup.ref('password'), null], 'Passwords must match'),
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // Reset password with token
        await authService.resetPassword(values.password, token);
        setSuccess(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setError(err.message || 'Failed to reset password. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  if (success) {
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
          Password Reset Successful
        </h2>
        <p className="mb-6 text-center text-gray-600">
          Your password has been reset successfully. You will be redirected to the login page in a few seconds.
        </p>
        <div className="text-center">
          <Link
            to="/login"
            className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Log in Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
        Create New Password
      </h2>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
        <div className="mb-4">
          <label 
            htmlFor="password" 
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
              formik.touched.password && formik.errors.password
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Create a new password"
            {...formik.getFieldProps('password')}
          />
          {formik.touched.password && formik.errors.password && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.password}</p>
          )}
        </div>

        <div className="mb-6">
          <label 
            htmlFor="confirmPassword" 
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
              formik.touched.confirmPassword && formik.errors.confirmPassword
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Confirm your new password"
            {...formik.getFieldProps('confirmPassword')}
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
