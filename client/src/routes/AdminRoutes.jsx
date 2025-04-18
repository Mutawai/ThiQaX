import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layout
import AdminLayout from '../layouts/AdminLayout';

// Components
import AdminDashboard from '../components/dashboard/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import UserDetails from '../components/admin/UserDetails';
import UserForm from '../components/admin/UserForm';
import VerificationList from '../components/admin/VerificationList';
import VerificationDetails from '../components/admin/VerificationDetails';
import JobList from '../components/admin/JobList';
import JobDetails from '../components/admin/JobDetails';
import JobVerification from '../components/admin/JobVerification';
import DisputeList from '../components/admin/DisputeList';
import DisputeDetails from '../components/admin/DisputeDetails';
import SystemStatus from '../components/admin/SystemStatus';
import NotFound from '../components/common/NotFound';

// Auth guard component for admin routes
const AdminGuard = ({ children }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  // Check if user is authenticated and has admin role
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        
        {/* User Management Routes */}
        <Route path="users">
          <Route index element={<UserManagement />} />
          <Route path="create" element={<UserForm />} />
          <Route path=":userId" element={<UserDetails />} />
          <Route path=":userId/edit" element={<UserForm />} />
        </Route>
        
        {/* Verification Routes */}
        <Route path="verifications">
          <Route index element={<VerificationList />} />
          <Route path=":verificationId" element={<VerificationDetails />} />
        </Route>
        
        {/* Job Routes */}
        <Route path="jobs">
          <Route index element={<JobList />} />
          <Route path=":jobId" element={<JobDetails />} />
          <Route path=":jobId/verify" element={<JobVerification />} />
        </Route>
        
        {/* Dispute Routes */}
        <Route path="disputes">
          <Route index element={<DisputeList />} />
          <Route path=":disputeId" element={<DisputeDetails />} />
        </Route>
        
        {/* System Routes */}
        <Route path="system" element={<SystemStatus />} />
        
        {/* Catch-all route for admin section */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;