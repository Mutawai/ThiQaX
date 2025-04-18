// dashboard/SponsorDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import MetricsCards from './components/MetricsCards';
import QuickActions from './components/QuickActions';
import JobsTable from './components/JobsTable';
import ApplicationsTable from './components/ApplicationsTable';

const SponsorDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      activeJobs: 0,
      applications: 0,
      hires: 0,
      profileViews: 0
    },
    recentJobs: [],
    recentApplications: [],
    activeHires: [],
    recommendedCandidates: []
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
        // Example: await dispatch(fetchSponsorDashboardData());
        console.log('Fetching dashboard data for sponsor');
        
        // Simulate API call with mock data
        setTimeout(() => {
          const mockData = {
            metrics: {
              activeJobs: 8,
              applications: 42,
              hires: 5,
              profileViews: 156
            },
            recentJobs: [
              {
                id: 'job1',
                title: 'Senior Housekeeper',
                location: 'Dubai, UAE',
                postedDate: '2025-04-10',
                status: 'active',
                applicantsCount: 15
              },
              {
                id: 'job2',
                title: 'Restaurant Manager',
                location: 'Doha, Qatar',
                postedDate: '2025-04-08',
                status: 'active',
                applicantsCount: 8
              },
              {
                id: 'job3',
                title: 'Hotel Receptionist',
                location: 'Abu Dhabi, UAE',
                postedDate: '2025-04-07',
                status: 'filled',
                applicantsCount: 12
              }
            ],
            recentApplications: [
              {
                id: 'app1',
                candidateName: 'John Doe',
                jobTitle: 'Senior Housekeeper',
                appliedDate: '2025-04-12',
                status: 'shortlisted'
              },
              {
                id: 'app2',
                candidateName: 'Jane Smith',
                jobTitle: 'Restaurant Manager',
                appliedDate: '2025-04-11',
                status: 'in_review'
              },
              {
                id: 'app3',
                candidateName: 'Robert Johnson',
                jobTitle: 'Hotel Receptionist',
                appliedDate: '2025-04-10',
                status: 'hired'
              }
            ],
            activeHires: [
              {
                id: 'hire1',
                name: 'Robert Johnson',
                position: 'Hotel Receptionist',
                hireDate: '2025-04-15',
                status: 'onboarding'
              },
              {
                id: 'hire2',
                name: 'Maria Garcia',
                position: 'Housekeeping Supervisor',
                hireDate: '2025-04-01',
                status: 'active'
              }
            ],
            recommendedCandidates: [
              {
                id: 'cand1',
                name: 'Michael Brown',
                skills: ['Customer Service', 'Hospitality', 'Fluent in English, Arabic'],
                experience: '5 years',
                matchScore: 92
              },
              {
                id: 'cand2',
                name: 'Sarah Wilson',
                skills: ['Food Service', 'Team Management', 'Inventory Control'],
                experience: '7 years',
                matchScore: 88
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
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorAlert error={error} onRetry={() => window.location.reload()} />;
  }
  
  return (
    <div className="flex flex-col space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome back, {user.name || user.companyName || 'Sponsor'}
          </h2>
          
          <MetricsCards metrics={dashboardData.metrics} />
        </div>
      </div>
      
      <QuickActions />
      
      <JobsTable jobs={dashboardData.recentJobs} />
      
      <ApplicationsTable applications={dashboardData.recentApplications} />
    </div>
  );
};

export default SponsorDashboard;