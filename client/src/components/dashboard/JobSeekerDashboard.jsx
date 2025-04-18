import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Import components
import ProfileCompletionCard from './ProfileCompletionCard';
import KYCVerificationCard from './KYCVerificationCard';
import ApplicationStatusCard from './ApplicationStatusCard';
import RecommendedJobsSection from './RecommendedJobsSection';
import ApplicationsSection from './ApplicationsSection';
import SavedJobsSection from './SavedJobsSection';

const JobSeekerDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    profileCompletion: 0,
    kycStatus: 'pending',
    recentJobs: [],
    applications: [],
    savedJobs: [],
    notifications: []
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
        // Example: await dispatch(fetchDashboardData());
        console.log('Fetching dashboard data for job seeker');
        
        // Simulate API call with mock data
        setTimeout(() => {
          const mockData = {
            profileCompletion: 75,
            kycStatus: 'pending',
            recentJobs: [
              {
                id: 'job1',
                title: 'Senior Housekeeper',
                company: 'Al Faisal Hospitality',
                location: 'Dubai, UAE',
                salary: '$800 - $1,200 per month',
                postedDate: '2025-04-10'
              },
              {
                id: 'job2',
                title: 'Restaurant Manager',
                company: 'Luxury Dining Group',
                location: 'Doha, Qatar',
                salary: '$1,500 - $2,000 per month',
                postedDate: '2025-04-08'
              },
              {
                id: 'job3',
                title: 'Hotel Receptionist',
                company: 'Grand Plaza Hotels',
                location: 'Abu Dhabi, UAE',
                salary: '$700 - $900 per month',
                postedDate: '2025-04-07'
              }
            ],
            applications: [
              {
                id: 'app1',
                jobId: 'job1',
                jobTitle: 'Senior Housekeeper',
                company: 'Al Faisal Hospitality',
                status: 'under_review',
                appliedDate: '2025-04-12'
              },
              {
                id: 'app2',
                jobId: 'job4',
                jobTitle: 'Maintenance Technician',
                company: 'Royal Resorts',
                status: 'shortlisted',
                appliedDate: '2025-04-05'
              }
            ],
            savedJobs: [
              {
                id: 'job5',
                title: 'Executive Chef',
                company: 'Luxury Dining Group',
                location: 'Riyadh, Saudi Arabia',
                salary: '$2,500 - $3,500 per month',
                postedDate: '2025-04-09'
              }
            ],
            notifications: [
              {
                id: 'notif1',
                type: 'application_update',
                message: 'Your application for Maintenance Technician has been shortlisted',
                date: '2025-04-15',
                read: false
              },
              {
                id: 'notif2',
                type: 'document_verification',
                message: 'Your passport has been verified',
                date: '2025-04-14',
                read: true
              }
            ]
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
            Welcome back, {user.name || 'Job Seeker'}
          </h2>
          
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Profile Completion Card */}
            <ProfileCompletionCard completionPercentage={dashboardData.profileCompletion} />
            
            {/* KYC Status Card */}
            <KYCVerificationCard status={dashboardData.kycStatus} />
            
            {/* Application Status Card */}
            <ApplicationStatusCard applicationsCount={dashboardData.applications.length} />
          </div>
        </div>
      </div>
      
      {/* Job Recommendations Section */}
      <RecommendedJobsSection jobs={dashboardData.recentJobs} />
      
      {/* Applications Section */}
      <ApplicationsSection applications={dashboardData.applications} />
      
      {/* Saved Jobs Section */}
      <SavedJobsSection jobs={dashboardData.savedJobs} />
    </div>
  );
};

export default JobSeekerDashboard;