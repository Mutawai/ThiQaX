import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalUsers: 0,
      verificationRequests: 0,
      activeJobs: 0,
      pendingDisputes: 0
    },
    recentVerifications: [],
    recentUsers: [],
    recentJobs: [],
    systemStatus: {
      apiStatus: 'healthy',
      databaseStatus: 'healthy',
      lastBackupTime: null,
      serverLoad: 0.2
    }
  });
  
  const dispatch = useDispatch();
  
  // In a real implementation, you would get this from redux state
  const user = useSelector(state => state.auth?.user || {});
  
  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // In a real implementation, you would dispatch actions to fetch data
        // Example: await dispatch(fetchAdminDashboardData());
        console.log('Fetching dashboard data for admin');
        
        // Simulate API call with mock data
        setTimeout(() => {
          const mockData = {
            metrics: {
              totalUsers: 1245,
              verificationRequests: 23,
              activeJobs: 128,
              pendingDisputes: 5
            },
            recentVerifications: [
              {
                id: 'ver1',
                applicantName: 'John Doe',
                documentType: 'Passport',
                status: 'pending',
                submittedDate: '2025-04-15'
              },
              {
                id: 'ver2',
                applicantName: 'Jane Smith',
                documentType: 'Address Proof',
                status: 'pending',
                submittedDate: '2025-04-14'
              }
            ],
            recentUsers: [
              {
                id: 'user1',
                name: 'Michael Johnson',
                email: 'michael@example.com',
                role: 'jobSeeker',
                joinedDate: '2025-04-12'
              },
              {
                id: 'user2',
                name: 'Sarah Williams',
                email: 'sarah@example.com',
                role: 'agent',
                joinedDate: '2025-04-11'
              }
            ],
            recentJobs: [
              {
                id: 'job1',
                title: 'Senior Housekeeper',
                company: 'Al Faisal Hospitality',
                status: 'published',
                postedDate: '2025-04-10'
              },
              {
                id: 'job2',
                title: 'Restaurant Manager',
                company: 'Luxury Dining Group',
                status: 'pending_verification',
                postedDate: '2025-04-08'
              }
            ],
            systemStatus: {
              apiStatus: 'healthy',
              databaseStatus: 'healthy',
              lastBackupTime: '2025-04-18T01:30:00Z',
              serverLoad: 0.2
            }
          };
          
          setDashboardData(mockData);
          setIsLoading(false);
        }, 1500);
      } catch (err) {
        setIsLoading(false);
        setError(err.message || 'Failed to load dashboard data. Please try again.');
      }
    };
    
    fetchDashboardData();
  }, [dispatch]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome back, {user.name || 'Admin'}
          </h2>
          
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Users Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Users
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {dashboardData.metrics.totalUsers}
                </dd>
                <div className="mt-4">
                  <Link
                    to="/admin/users"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    Manage users →
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Verification Requests Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Verification Requests
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {dashboardData.metrics.verificationRequests}
                </dd>
                <div className="mt-4">
                  <Link
                    to="/admin/verifications"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    Process verifications →
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Active Jobs Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Jobs
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {dashboardData.metrics.activeJobs}
                </dd>
                <div className="mt-4">
                  <Link
                    to="/admin/jobs"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    Manage jobs →
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Pending Disputes Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Pending Disputes
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {dashboardData.metrics.pendingDisputes}
                </dd>
                <div className="mt-4">
                  <Link
                    to="/admin/disputes"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    Resolve disputes →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* System Status Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* API Status Card */}
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  API Status
                </dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dashboardData.systemStatus.apiStatus === 'healthy'
                      ? 'bg-green-100 text-green-800'
                      : dashboardData.systemStatus.apiStatus === 'degraded'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {dashboardData.systemStatus.apiStatus === 'healthy'
                      ? 'Healthy'
                      : dashboardData.systemStatus.apiStatus === 'degraded'
                      ? 'Degraded'
                      : 'Unhealthy'}
                  </span>
                </dd>
              </div>
            </div>
            
            {/* Database Status Card */}
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Database Status
                </dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dashboardData.systemStatus.databaseStatus === 'healthy'
                      ? 'bg-green-100 text-green-800'
                      : dashboardData.systemStatus.databaseStatus === 'degraded'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {dashboardData.systemStatus.databaseStatus === 'healthy'
                      ? 'Healthy'
                      : dashboardData.systemStatus.databaseStatus === 'degraded'
                      ? 'Degraded'
                      : 'Unhealthy'}
                  </span>
                </dd>
              </div>
            </div>
            
            {/* Last Backup Card */}
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Last Backup
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {dashboardData.systemStatus.lastBackupTime 
                    ? new Date(dashboardData.systemStatus.lastBackupTime).toLocaleString()
                    : 'No backup found'}
                </dd>
              </div>
            </div>
            
            {/* Server Load Card */}
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Server Load
                </dt>
                <dd className="mt-1">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          dashboardData.systemStatus.serverLoad < 0.5
                            ? 'bg-green-500'
                            : dashboardData.systemStatus.serverLoad < 0.8
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(dashboardData.systemStatus.serverLoad * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {Math.round(dashboardData.systemStatus.serverLoad * 100)}%
                    </span>
                  </div>
                </dd>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Link
              to="/admin/system"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View System Details
            </Link>
          </div>
        </div>
      </div>
      
      {/* Recent Verifications Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Verification Requests</h3>
        </div>
        <div className="px-4 py-3 sm:px-6">
          {dashboardData.recentVerifications.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No pending verification requests.</p>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted Date
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentVerifications.map(verification => (
                    <tr key={verification.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{verification.applicantName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{verification.documentType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          verification.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : verification.status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {verification.status === 'pending'
                            ? 'Pending'
                            : verification.status === 'verified'
                            ? 'Verified'
                            : 'Rejected'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(verification.submittedDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/admin/verifications/${verification.id}`} className="text-indigo-600 hover:text-indigo-900">
                          Verify
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-center">
            <Link
              to="/admin/verifications"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View All Verifications
            </Link>
          </div>
        </div>
      </div>
      
      {/* Recent Users Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
        </div>
        <div className="px-4 py-3 sm:px-6">
          {dashboardData.recentUsers.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No recent users found.</p>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined Date
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whites