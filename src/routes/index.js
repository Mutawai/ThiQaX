import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  LoginPage, 
  RegisterPage, 
  ForgotPasswordPage, 
  ResetPasswordPage,
  VerificationSentPage,
  VerifyEmailPage
} from '../pages/auth';

// Placeholder Dashboard page
const Dashboard = () => (
  <div className="p-6">
    <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
    <p>Dashboard content will go here.</p>
  </div>
);

// Landing Page placeholder
const LandingPage = () => (
  <div className="p-6">
    <h1 className="mb-4 text-2xl font-bold">ThiQaX - Trust in Recruitment</h1>
    <p className="mb-4">Welcome to ThiQaX, the blockchain-based platform for trusted recruitment.</p>
    <div className="flex space-x-4">
      <a href="/login" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
        Log in
      </a>
      <a href="/register" className="px-4 py-2 text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50">
        Register
      </a>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('token');
  
  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public route wrapper (accessible only if NOT authenticated)
const PublicRoute = ({ children }) => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('token');
  
  if (isAuthenticated) {
    // Redirect to dashboard if already authenticated
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (no auth required) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth routes (only when not logged in) */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verification-sent" element={<VerificationSentPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        
        {/* Protected routes (auth required) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
