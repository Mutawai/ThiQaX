import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const SponsorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    shortlistedCandidates: 0,
    pendingInterviews: 0,
    hiredWorkers: 0
  });
  const [jobListings, setJobListings] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  
  // Check if user is logged in and has sponsor role
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'sponsor') {
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
          activeJobs: 5,
          totalApplications: 47,
          shortlistedCandidates: 12,
          pendingInterviews: 4,
          hiredWorkers: 8
        };
        
        // Mock job listings
        const mockJobListings = [
          {
            id: 'job1',
            title: 'Domestic Helper',
            location: 'Dubai, UAE',
            salary: '500-700 USD',
            applicants: 23,
            status: 'active',
            postedDate: '2025-03-01T09:30:00Z',
            agent: 'Global Recruitment Services'
          },
          {
            id: 'job2',
            title: 'Security Guard',
            location: 'Dubai, UAE',
            salary: '750-900 USD',
            applicants: 15,
            status: 'active',
            postedDate: '2025-03-05T11:45:00Z',
            agent: 'Secure Staffing Solutions'
          },
          {
            id: 'job3',
            title: 'Driver',
            location: 'Dubai, UAE',
            salary: '800-1000 USD',
            applicants: 9,
            status: 'draft',
            postedDate: null,
            agent: 'Global Recruitment Services'
          }
        ];
        
        // Mock candidates
        const mockCandidates = [
          {
            id: 'cand1',
            name: 'John Doe',
            jobTitle: 'Domestic Helper',
            location: 'Nairobi, Kenya',
            experience: '3 years',
            status: 'shortlisted',
            matchPercentage: 85
          },
          {
            id: 'cand2',
            name: 'Jane Smith',
            jobTitle: 'Security Guard',
            location: 'Mombasa, Kenya',
            experience: '5 years',
            status: 'interview_scheduled',
            matchPercentage: 92
          },
          {
            id: 'cand3',
            name: 'Robert Johnson',
            jobTitle: 'Driver',
            location: 'Nakuru, Kenya',
            experience: '7 years',
            status: 'offer_sent',
            matchPercentage: 89
          },
          {
            id: 'cand4',
            name: 'Mary Williams',
            jobTitle: 'Security Guard',
            location: 'Kisumu, Kenya',
            experience: '2 years',
            status: 'shortlisted',
            matchPercentage: 78
          }
        ];
        
        // Mock upcoming interviews
        const mockInterviews = [
          {
            id: 'int1',
            candidateName: 'Jane Smith',
            jobTitle: 'Security Guard',
            date: '2025-04-12T10:00:00Z',
            type: 'video',
            status: 'scheduled'
          },
          {
            id: 'int2',
            candidateName: 'Michael Brown',
            jobTitle: 'Driver',
            date: '2025-04-15T14:30:00Z',
            type: 'phone',
            status: 'scheduled'
          },
          {
            id: 'int3',
            candidateName: 'Emily Davis',
            jobTitle: 'Domestic Helper',
            date: '2025-04-18T09:00:00Z',
            type: 'video',
            status: 'pending_confirmation'
          }
        ];
        
        setStats(mockStats);
        setJobListings(mockJobListings);
        setCandidates(mockCandidates);
        setUpcomingInterviews(mockInterviews);
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

  // Format interview time
  const formatInterviewTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'offer_sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'pending_confirmation':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get formatted status text
  const getStatusText = (status) => {
    switch (status) {
      case 'interview_scheduled':
        return 'Interview Scheduled';
      case 'offer_sent':
        return 'Offer Sent';
      case 'pending_confirmation':
        return 'Pending Confirmation';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
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
        <h1 className="text-2xl font-bold text-gray-800">Sponsor Dashboard</h1>
        
        <div className="mt-4 md:mt-0 space-x-2">
          <Link
            to="/jobs/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Create Job Opening
          </Link>
          
          <Link
            to="/candidates/browse"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Browse Candidates
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-semibold text-gray-700">Active Jobs</h2>
              <p className="text-2xl font-bold text-gray-800">{stats.activeJobs}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-semibold text-gray-700">Applications</h2>
              <p className="text-2xl font-bold text-gray-800">{stats.totalApplications}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-semibold text-gray-700">Shortlisted</h2>
              <p className="text-2xl font-bold text-gray-800">{stats.shortlistedCandidates}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-semibold text-gray-700">Interviews</h2>
              <p className="text-2xl font-bold text-gray-800">{stats.pendingInterviews}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-semibold text-gray-700">Hired</h2>
              <p className="text-2xl font-bold text-gray-800">{stats.hiredWorkers}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Listings */}
        <div>
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
                    Create Job Opening
                  </Link>
                </div>
              ) : (
                jobListings.map(job => (
                  <div key={job.id} className="p-4 hover:bg-gray-50">
                    <Link to={`/jobs/${job.id}`} className="block">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-md font-medium text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">
                            {job.location} • {job.salary}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Agent: {job.agent}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(job.status)}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {job.postedDate ? `Posted: ${formatDate(job.postedDate)}` : 'Draft'}
                        </span>
                        <span className="inline-flex items-center text-xs text-blue-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                          </svg>
                          {job.applicants} applicants
                        </span>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
            {jobListings.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Link
                  to="/jobs/create"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  + Create new job
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Candidates Pipeline */}
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Candidates Pipeline</h2>
              <Link
                to="/candidates/pipeline"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {candidates.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No candidates in your pipeline yet.</p>
                </div>
              ) : (
                candidates.map(candidate => (
                  <div key={candidate.id} className="p-4 hover:bg-gray-50">
                    <Link to={`/candidates/${candidate.id}`} className="block">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-md font-medium text-gray-900">{candidate.name}</h3>
                          <p className="text-sm text-gray-600">
                            {candidate.jobTitle} • {candidate.experience} experience
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {candidate.location}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(candidate.status)}`}>
                            {getStatusText(candidate.status)}
                          </span>
                          <span className="mt-1 inline-flex items-center text-xs font-medium text-green-600">
                            {candidate.matchPercentage}% match
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <Link
                to="/candidates/browse"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Browse candidate database
              </Link>
            </div>
          </div>
        </div>
        
        {/* Upcoming Interviews & Actions */}
        <div className="space-y-6">
          {/* Upcoming Interviews */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg
