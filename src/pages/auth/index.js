import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import RegistrationForm from '../../components/auth/RegistrationForm';
import ForgotPassword from '../../components/auth/ForgotPassword';
import ResetPassword from '../../components/auth/ResetPassword';
import VerificationSent from '../../components/auth/VerificationSent';
import VerifyEmail from '../../components/auth/VerifyEmail';

// Auth layout wrapper component
const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-4xl px-4 py-8 mx-auto">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="mb-6">
            <img 
              src="/logo.png" 
              alt="ThiQaX Logo" 
              className="h-10"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150x50?text=ThiQaX';
              }}
            />
          </Link>
          {title && (
            <h1 className="text-2xl font-bold text-center text-gray-800">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-2 text-center text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="flex justify-center w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

// Login page
export const LoginPage = () => {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};

// Registration page
export const RegisterPage = () => {
  return (
    <AuthLayout>
      <RegistrationForm />
    </AuthLayout>
  );
};

// Forgot password page
export const ForgotPasswordPage = () => {
  return (
    <AuthLayout>
      <ForgotPassword />
    </AuthLayout>
  );
};

// Reset password page
export const ResetPasswordPage = () => {
  return (
    <AuthLayout>
      <ResetPassword />
    </AuthLayout>
  );
};

// Verification sent page
export const VerificationSentPage = () => {
  return (
    <AuthLayout>
      <VerificationSent />
    </AuthLayout>
  );
};

// Verify email page
export const VerifyEmailPage = () => {
  return (
    <AuthLayout>
      <VerifyEmail />
    </AuthLayout>
  );
};
