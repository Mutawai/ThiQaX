import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Theme
import theme from './theme';

// Pages - Existing
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Pages - Auth
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerificationSentPage from './pages/auth/VerificationSentPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Pages - Dashboard
import JobSeekerDashboard from './pages/dashboard/JobSeekerDashboard';
import AgentDashboard from './pages/dashboard/AgentDashboard';
import SponsorDashboard from './pages/dashboard/SponsorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

// Pages - KYC
import KycVerificationPage from './pages/kyc/KycVerificationPage';
import DocumentUploadPage from './pages/kyc/DocumentUploadPage';
import VerificationStatusPage from './pages/kyc/VerificationStatusPage';

// Pages - Jobs
import JobListingPage from './pages/jobs/JobListingPage';
import JobDetailsPage from './pages/jobs/JobDetailsPage';
import JobApplicationPage from './pages/jobs/JobApplicationPage';
import ApplicationTrackingPage from './pages/jobs/ApplicationTrackingPage';

// Pages - Admin
import AdminVerificationDashboard from './pages/admin/AdminVerificationDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';

// Pages - Search
import SearchPage from './pages/search/SearchPage';
import AdvancedSearchPage from './pages/search/AdvancedSearchPage';

// Pages - Messaging
import MessagesPage from './pages/messages/MessagesPage';
import ConversationPage from './pages/messages/ConversationPage';

// Layout components
import Header from './components/layout/Header';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth components
import { useSelector } from 'react-redux';

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Public route wrapper (accessible only if NOT authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.auth);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  // Redirect to appropriate dashboard based on user role
  const getDashboardRoute = () => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'agent':
        return <AgentDashboard />;
      case 'sponsor':
        return <SponsorDashboard />;
      default:
        return <JobSeekerDashboard />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth routes - public only when not logged in */}
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
          
          {/* Dashboard routes - protected by role */}
          <Route path="/dashboard" element={<ProtectedRoute>{getDashboardRoute()}</ProtectedRoute>} />
          
          {/* Job routes */}
          <Route path="/jobs" element={<JobListingPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
          <Route path="/jobs/:jobId/apply" element={
            <ProtectedRoute allowedRoles={['jobSeeker']}>
              <JobApplicationPage />
            </ProtectedRoute>
          } />
          <Route path="/applications" element={
            <ProtectedRoute>
              <ApplicationTrackingPage />
            </ProtectedRoute>
          } />
          
          {/* KYC verification routes */}
          <Route path="/kyc" element={
            <ProtectedRoute>
              <KycVerificationPage />
            </ProtectedRoute>
          } />
          <Route path="/kyc/documents" element={
            <ProtectedRoute>
              <DocumentUploadPage />
            </ProtectedRoute>
          } />
          <Route path="/kyc/status" element={
            <ProtectedRoute>
              <VerificationStatusPage />
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/verification" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminVerificationDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminSettings />
            </ProtectedRoute>
          } />
          
          {/* Search routes */}
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search/advanced" element={<AdvancedSearchPage />} />
          
          {/* Messaging routes */}
          <Route path="/messages" element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } />
          <Route path="/messages/:conversationId" element={
            <ProtectedRoute>
              <ConversationPage />
            </ProtectedRoute>
          } />
          
          {/* Error routes */}
          <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={5000} />
    </ThemeProvider>
  );
}

export default App;
