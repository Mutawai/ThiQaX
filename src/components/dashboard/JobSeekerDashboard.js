import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const JobSeekerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pendingApplications: 0,
    activeApplications: 0,
    profileCompletion: 0,
    documentsVerified: 0,
    totalDocuments: 0,
    recentActivity: []
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'jobSeeker') {
      navigate('/dashboard');
      return;
    }
  }, [navigate, user]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // These would be actual API calls in production
        // const dashboardStats = await dashboardService.getJobSeekerStats(user.id);
        // const jobs = await jobService.getRecentJobs();
        // const userNotifications = await notificationService.getUserNotifications(user.id, { limit: 5 });
        
        // Mock dashboard stats
        const mockStats = {
          pendingApplications: 3,
          activeApplications: 5,
          profileCompletion: 85,
          documentsVerified: 4,
          totalDocuments: 6,
          recentActivity: [
            {
              id: 'activity1',
              type: 'application_status',
              message: 'Your application for Domestic Helper at Al Faisal Services has been shortlisted',
              timestamp: '2025-04-07T14:30:00Z'
            },
            {
              id: 'activity2',
              type: 'document_verification',
              message: 'Your passport has been verified successfully',
              timestamp: '2025-04-05T10:15:00Z'
            },
            {
              id: 'activity3',
              type: 'application_submitted',
              message: 'You have applied for Construction Worker at Qatar Building Corp',
              timestamp: '2025-04-03T09:20:00Z'
            }
          ]
        };
        
        // Mock recent jobs
        const mockJobs = [
          {
            id: 'job1',
            title: 'Domestic Helper',
            company: 'Al Faisal Household Services',
            location: 'Dubai, UAE',
            salary: '500-700 USD/month',
            isVerified: true,
            postedDate: '2025-04-08T09:30:00Z'
          },
          {
            id: 'job2',
            title: 'Security Guard',
            company: 'Emirates Security',
            location: 'Abu Dhabi, UAE',
            salary: '750-900 USD/month',
            isVerified: true,
            postedDate: '2025-04-07T11:45:00Z'
          },
          {
            id: 'job3',
            title: 'Hotel Cleaner',
            company: 'Luxury Stays Inc',
            location: 'Doha, Qatar',
            salary: '600-750 USD/month',
            isVerified: false,
            postedDate: '2025-04-06T14:20:00Z'
          }
        ];
        
        // Mock notifications
        const mockNotifications = [
          {
            id: 'notif1',
            type: 'application',
            message: 'Interview scheduled for your Domestic Helper application',
            isRead: false,
            timestamp: '2025-04-08T15:30:00Z'
          },
          {
            id: 'notif2',
            type: 'document',
            message: 'Your national ID requires reverification',
            isRead: true,
            timestamp: '2025-04-06T09:15:00Z'
          },
          {
            id: 'notif3',
            type: 'system',
            message: 'Welcome to ThiQaX! Complete your profile to apply for jobs',
            isRead: true,
            timestamp: '2025-04-01T10:00:00Z'
          }
        ];
        
        setStats(mockStats);
        setRecentJobs(mockJobs);
        setNotifications(mockNotifications);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Format time ago
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? 'Yesterday' : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    }
    
    return 'Just now';
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application':
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
        );
      case 'document':
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.firstName || 'User'}!</h1>
        
        <div className="mt-4 md:mt-0">
          {stats.profileCompletion < 100 && (
            <Link
              to="/profile/edit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Complete Your Profile ({stats.profileCompletion}%)
            </Link>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Applications</h2>
              <p className="text-3xl font-bold text-gray-800">{stats.activeApplications}</p>
              <p className="text-sm text-gray-500">{stats.pendingApplications} awaiting review</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/applications"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all applications
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Documents</h2>
              <p className="text-3xl font-bold text-gray-800">{stats.documentsVerified}/{stats.totalDocuments}</p>
              <p className="text-sm text-gray-500">verified documents</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/documents"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Manage documents
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Profile</h2>
              <p className="text-3xl font-bold text-gray-800">{stats.profileCompletion}%</p>
              <p className="text-sm text-gray-500">completion rate</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/profile"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View profile
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Notifications</h2>
              <p className="text-3xl font-bold text-gray-800">{notifications.filter(n => !n.isRead).length}</p>
              <p className="text-sm text-gray-500">unread notifications</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/notifications"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all notifications
            </Link>
          </div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Recent Job Opportunities</h2>
              <Link
                to="/jobs"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View all jobs
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {recentJobs.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No recent jobs found.</p>
                </div>
              ) : (
                recentJobs.map(job => (
                  <div key={job.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          to={`/jobs/${job.id}`}
                          className="text-lg font-medium text-gray-900 hover:text-blue-600"
                        >
                          {job.title}
                        </Link>
                        <p className="text-sm text-gray-600">{job.company}</p>
                      </div>
                      {job.isVerified && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        {job.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {job.salary}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Posted {timeAgo(job.postedDate)}</span>
                      <Link
                        to={`/jobs/${job.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Notifications & Activity */}
        <div className="lg:col-span-1 space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
              <Link
                to="/notifications"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No notifications yet.</p>
                </div>
              ) : (
                notifications.slice(0, 3).map(notification => (
                  <div key={notification.id} className={`p-4 ${!notification.isRead ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start">
                      {getNotificationIcon(notification.type)}
                      <div className="ml-3 flex-1">
                        <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {timeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {stats.recentActivity.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No recent activity.</p>
                </div>
      
