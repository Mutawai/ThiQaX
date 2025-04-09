import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalCandidates: 0,
    pendingVerifications: 0,
    totalPlacements: 0,
    recentPlacements: []
  });
  const [jobListings, setJobListings] = useState([]);
  const [candidates, setCandidates] = useState([]);
  
  // Check if user is logged in and has agent role
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'agent') {
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
        
        // Mock dashboard stats
        const mockStats = {
          activeJobs: 12,
          totalCandidates: 87,
          pendingVerifications: 15,
          totalPlacements: 43,
          recentPlacements: [
            {
              id: 'placement1',
              candidateName: 'John Doe',
              jobTitle: 'Domestic Helper',
              employer: 'Al Faisal Family',
              location: 'Dubai, UAE',
              date: '2025-03-15T10:30:00Z'
            },
            {
              id: 'placement2',
              candidateName: 'Jane Smith',
              jobTitle: 'Security Guard',
              employer: 'Qatar Security Services',
              location: 'Doha, Qatar',
              date: '2025-03-10T14:45:00Z'
            },
            {
              id: 'placement3',
              candidateName: 'Robert Johnson',
              jobTitle: 'Driver',
              employer: 'Riyadh Transportation Co.',
              location: 'Riyadh, Saudi Arabia',
              date: '2025-03-05T09:15:00Z'
            }
          ]
        };
        
        // Mock job listings
        const mockJobListings = [
          {
            id: 'job1',
            title: 'Domestic Helper',
            employer: 'Al Faisal Family',
            location: 'Dubai, UAE',
            salary: '500-700 USD',
            applicants: 23,
            status: 'active',
            postedDate: '2025-03-01T09:30:00Z',
            verified: true
          },
          {
            id: 'job2',
            title: 'Security Guard',
            employer: 'Qatar Security Services',
            location: 'Doha, Qatar',
            salary: '750-900 USD',
            applicants: 15,
            status: 'active',
            postedDate: '2025-03-05T11:45:00Z',
            verified: true
          },
          {
            id: 'job3',
            title: 'Driver',
            employer: 'Riyadh Transportation Co.',
            location: 'Riyadh, Saudi Arabia',
            salary: '800-1000 USD',
            applicants: 10,
            status: 'active',
            postedDate: '2025-03-10T14:20:00Z',
            verified: false
          },
          {
            id: 'job4',
            title: 'Cook',
            employer: 'Kuwait Restaurant Group',
            location: 'Kuwait City, Kuwait',
            salary: '700-900 USD',
            applicants: 8,
            status: 'draft',
            postedDate: null,
            verified: false
          }
        ];
        
        // Mock candidates
        const mockCandidates = [
          {
            id: 'cand1',
            name: 'John Doe',
            location: 'Nairobi, Kenya',
            skills: ['Cleaning', 'Cooking', 'Childcare'],
            status: 'verified',
            appliedJobs: 3,
            profileCompletion: 100
          },
          {
            id: 'cand2',
            name: 'Jane Smith',
            location: 'Mombasa, Kenya',
            skills: ['Security', 'Customer Service'],
            status: 'pending',
            appliedJobs: 2,
            profileCompletion: 85
          },
          {
            id: 'cand3',
            name: 'Robert Johnson',
            location: 'Nakuru, Kenya',
            skills: ['Driving', 'Mechanics'],
            status: 'verified',
            appliedJobs: 1,
            profileCompletion: 90
          },
          {
            id: 'cand4',
            name: 'Mary Williams',
            location: 'Kisumu, Kenya',
            skills: ['Housekeeping', 'Elderly Care'],
            status: 'pending',
            appliedJobs: 0,
            profileCompletion: 70
          }
        ];
        
        setStats(mockStats);
        setJobListings(mockJobListings);
        setCandidates(mockCandidates);
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
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'filled':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-2xl font-bold text-gray-800">Agent Dashboard</h1>
        
        <div className="mt-4 md:mt-0 space-x-2">
          <Link
            to="/jobs/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Post New Job
          </Link>
          
          <Link
            to="/candidates"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            View All Candidates
          </Link>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Active Jobs</h2>
              <p className="text-3xl font-bold text-gray-800">{stats.activeJobs}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/jobs/manage"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Manage job listings
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Candidates</h2>
              <p className="text-3xl font-bold text-gray-800">{stats.totalCandidates}</p>
              <p className="text-sm text-gray-500">{stats.pendingVerifications} pending verifications</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/verifications"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Review verifications
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Placements</h2>
              <p className="text-3xl font-bold text-gray-800">{stats.totalPlacements}</p>
              <p className="text-sm text-gray-500">successful placements</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/placements"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View placement history
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Earnings</h2>
              <p className="text-3xl font-bold text-gray-800">$4,250</p>
              <p className="text-sm text-gray-500">this month</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/finance"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View financial reports
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Listings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Your Job Listings</h2>
              <Link
                to="/jobs/manage"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {jobListings.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No job listings found.</p>
                  <Link
                    to="/jobs/create"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Post Your First Job
                  </Link>
                </div>
              ) : (
                jobListings.map(job => (
                  <div key={job.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          to={`/jobs/${job.id}`}
                          className="text-lg font-medium text-gray-900 hover:text-blue-600"
                        >
                          {job.title}
                        </Link>
                        <p className="text-sm text-gray-600">{job.employer} • {job.location}</p>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(job.status)}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                        {job.verified && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {job.salary}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                        {job.applicants} applicants
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        {job.postedDate ? `Posted: ${formatDate(job.postedDate)}` : 'Draft'}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <Link
                        to={`/jobs/${job.id}/applications`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Applications
                      </Link>
                      <Link
                        to={`/jobs/${job.id}/edit`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Placements */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-l
