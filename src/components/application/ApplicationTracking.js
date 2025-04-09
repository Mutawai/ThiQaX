import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const ApplicationTracking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Define application status options
  const statusOptions = {
    all: 'All Applications',
    pending: 'Pending Review',
    shortlisted: 'Shortlisted',
    interview: 'Interview Scheduled',
    offered: 'Job Offered',
    accepted: 'Offer Accepted',
    rejected: 'Not Selected',
    withdrawn: 'Withdrawn'
  };

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/login?returnUrl=/applications');
      return;
    }
  }, [navigate, user]);

  // Fetch applications from API
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // This would be an actual API call in production
        // const response = await applicationService.getUserApplications(user.id);
        
        // Mock applications data
        const mockApplications = [
          {
            id: 'app1',
            jobId: 'job1',
            jobTitle: 'Domestic Helper',
            companyName: 'Al Faisal Household Services',
            location: 'Dubai, UAE',
            salary: '500-700 USD',
            applicationDate: '2025-03-10T15:30:00Z',
            status: 'pending',
            statusUpdateDate: '2025-03-10T15:30:00Z',
            interviewDate: null,
            offerDetails: null,
            feedback: null,
            nextSteps: null,
            isWithdrawn: false
          },
          {
            id: 'app2',
            jobId: 'job2',
            jobTitle: 'Construction Worker',
            companyName: 'Qatar Building Corporation',
            location: 'Doha, Qatar',
            salary: '800-1000 USD',
            applicationDate: '2025-03-05T09:45:00Z',
            status: 'shortlisted',
            statusUpdateDate: '2025-03-07T14:20:00Z',
            interviewDate: null,
            offerDetails: null,
            feedback: 'Your application has been shortlisted. We will contact you soon for an interview.',
            nextSteps: 'Prepare for interview',
            isWithdrawn: false
          },
          {
            id: 'app3',
            jobId: 'job3',
            jobTitle: 'Hospital Cleaner',
            companyName: 'Saudi Medical Services',
            location: 'Riyadh, Saudi Arabia',
            salary: '600-800 USD',
            applicationDate: '2025-02-28T11:15:00Z',
            status: 'interview',
            statusUpdateDate: '2025-03-03T10:30:00Z',
            interviewDate: '2025-03-15T13:00:00Z',
            offerDetails: null,
            feedback: 'Your application has been reviewed and we would like to schedule an interview.',
            nextSteps: 'Attend online interview',
            isWithdrawn: false
          },
          {
            id: 'app4',
            jobId: 'job4',
            jobTitle: 'Security Guard',
            companyName: 'Emirates Security Services',
            location: 'Abu Dhabi, UAE',
            salary: '700-900 USD',
            applicationDate: '2025-02-20T16:45:00Z',
            status: 'rejected',
            statusUpdateDate: '2025-02-25T09:10:00Z',
            interviewDate: null,
            offerDetails: null,
            feedback: 'Thank you for your interest. While your profile is impressive, we have selected candidates whose experience more closely aligns with our requirements.',
            nextSteps: null,
            isWithdrawn: false
          },
          {
            id: 'app5',
            jobId: 'job5',
            jobTitle: 'Taxi Driver',
            companyName: 'Kuwait Transportation Company',
            location: 'Kuwait City, Kuwait',
            salary: '800-950 USD',
            applicationDate: '2025-02-15T10:20:00Z',
            status: 'offered',
            statusUpdateDate: '2025-03-01T15:45:00Z',
            interviewDate: '2025-02-25T14:30:00Z',
            offerDetails: {
              salary: 900,
              startDate: '2025-04-15T00:00:00Z',
              contractDuration: '2 years',
              benefits: ['Accommodation', 'Health Insurance', 'Transport']
            },
            feedback: 'Congratulations! Based on your qualifications and interview, we are pleased to offer you the position.',
            nextSteps: 'Review offer details and accept/decline',
            isWithdrawn: false
          },
          {
            id: 'app6',
            jobId: 'job6',
            jobTitle: 'Hotel Receptionist',
            companyName: 'Bahrain Luxury Hotels',
            location: 'Manama, Bahrain',
            salary: '750-900 USD',
            applicationDate: '2025-02-10T13:15:00Z',
            status: 'accepted',
            statusUpdateDate: '2025-03-05T11:30:00Z',
            interviewDate: '2025-02-20T15:00:00Z',
            offerDetails: {
              salary: 850,
              startDate: '2025-04-01T00:00:00Z',
              contractDuration: '2 years',
              benefits: ['Accommodation', 'Health Insurance', 'Meals']
            },
            feedback: 'Welcome to the team! We are excited to have you join us.',
            nextSteps: 'Complete pre-departure procedures',
            isWithdrawn: false
          },
          {
            id: 'app7',
            jobId: 'job7',
            jobTitle: 'Restaurant Server',
            companyName: 'Oman Hospitality Group',
            location: 'Muscat, Oman',
            salary: '650-800 USD',
            applicationDate: '2025-02-05T09:30:00Z',
            status: 'pending',
            statusUpdateDate: '2025-02-05T09:30:00Z',
            interviewDate: null,
            offerDetails: null,
            feedback: null,
            nextSteps: null,
            isWithdrawn: true
          }
        ];
        
        setApplications(mockApplications);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load applications. Please try again.');
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [user]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status text
  const getStatusText = (status, isWithdrawn) => {
    if (isWithdrawn) return 'Withdrawn';
    return statusOptions[status] ? statusOptions[status].replace('All Applications', 'Pending Review') : 'Unknown';
  };

  // Filter applications based on active tab and search term
  const filteredApplications = applications.filter(app => {
    const matchesTab = activeTab === 'all' || app.status === activeTab || (activeTab === 'withdrawn' && app.isWithdrawn);
    const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Handle tab click
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle view application
  const handleViewApplication = (applicationId) => {
    navigate(`/applications/${applicationId}`);
  };

  // Handle withdraw application
  const handleWithdrawApplication = async (applicationId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }
    
    try {
      // This would be an actual API call in production
      // await applicationService.withdrawApplication(applicationId);
      
      // Update application status locally
      setApplications(prevApplications => 
        prevApplications.map(app => 
          app.id === applicationId ? { ...app, isWithdrawn: true } : app
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to withdraw application. Please try again.');
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
          <p className="mt-4 text-gray-700">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Applications</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="relative">
              <input
                type="text"
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-gray-500 mr-2">Total:</span>
            <span className="font-medium">{applications.length} applications</span>
          </div>
        </div>
      </div>
      
      {/* Status Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="inline-flex min-w-full">
          {Object.keys(statusOptions).map(status => (
            <button
              key={status}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 first:rounded-l-md last:rounded-r-md -ml-px first:ml-0`}
              onClick={() => handleTabClick(status)}
            >
              {statusOptions[status]}
              {status !== 'all' && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                  {status === 'withdrawn'
                    ? applications.filter(app => app.isWithdrawn).length
                    : applications.filter(app => app.status === status).length}
                </span>
              )}
            </button>
          ))}
          
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'withdrawn'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300 rounded-r-md -ml-px`}
            onClick={() => handleTabClick('withdrawn')}
          >
            Withdrawn
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
              {applications.filter(app => app.isWithdrawn).length}
            </span>
          </button>
        </div>
      </div>
      
      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? 'No applications match your search criteria. Try adjusting your search.'
              : activeTab !== 'all'
              ? `You don't have any applications with "${statusOptions[activeTab]}" status.`
              : 'You haven\'t applied for any jobs yet.'}
          </p>
          <button
            onClick={() => navigate('/jobs')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Steps
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map(application => (
                <tr 
                  key={application.id} 
                  className={`hover:bg-gray-50 cursor-pointer ${application.isWithdrawn ? 'bg-gray-50' : ''}`}
                  onClick={() => handleViewApplication(application.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{application.jobTitle}</div>
                    <div className="text-sm text-gray-500">{application.companyName}</div>
                    <div className="text-xs text-gray-500">{application.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      application.isWithdrawn
                        ? 'bg-gray-100 text-gray-800'
                        : getStatusBadgeClass(application.status)
                    }`}>
                      {getStatusText(application.status, application.isWithdrawn)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(application.applicationDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(application.statusUpdateDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.nextSteps || 'Waiting for review'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => handleViewApplication(application.id, e)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </button>
                    {!application.isWithdrawn && application.status !== 'accepted' && application.status !== 'rejected' && (
                      <button
                        onClick={(e) => handleWithdrawApplication(application.id, e)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Withdraw
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApplicationTracking;
