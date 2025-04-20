import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styles from './VerificationMetrics.module.css';

const VerificationMetrics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    totalVerifications: 0,
    pendingVerifications: 0,
    approvedVerifications: 0,
    rejectedVerifications: 0,
    averageProcessingTime: 0,
    verificationsByType: [],
    verificationTrends: []
  });
  
  const dispatch = useDispatch();
  
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // In production, dispatch action to fetch metrics
        // Example: await dispatch(fetchVerificationMetrics());
        
        // Simulating API call with mock data
        setTimeout(() => {
          setMetrics({
            totalVerifications: 1245,
            pendingVerifications: 23,
            approvedVerifications: 1154,
            rejectedVerifications: 68,
            averageProcessingTime: 1.4, // in days
            verificationsByType: [
              { type: 'Passport', count: 523 },
              { type: 'National ID', count: 412 },
              { type: 'Education', count: 245 },
              { type: 'Employment', count: 65 }
            ],
            verificationTrends: [
              { month: 'Jan', pending: 12, approved: 89, rejected: 5 },
              { month: 'Feb', pending: 15, approved: 95, rejected: 7 },
              { month: 'Mar', pending: 18, approved: 120, rejected: 10 },
              { month: 'Apr', pending: 23, approved: 154, rejected: 8 }
            ]
          });
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError(err.message || 'Failed to load verification metrics');
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
  }, [dispatch]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500" role="status"></div>
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
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Verification Metrics</h3>
        <div className="flex space-x-3">
          <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last 365 days</option>
            <option value="all">All time</option>
          </select>
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Verifications
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {metrics.totalVerifications.toLocaleString()}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Pending
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-500">
                {metrics.pendingVerifications.toLocaleString()}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Approved
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-500">
                {metrics.approvedVerifications.toLocaleString()}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Rejected
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-red-500">
                {metrics.rejectedVerifications.toLocaleString()}
              </dd>
            </div>
          </div>
        </dl>
        
        <div className="mt-8">
          <h4 className="text-base font-medium text-gray-700 mb-4">Verification Processing Time</h4>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Average Processing Time</p>
                  <p className="text-xl font-semibold text-gray-900">{metrics.averageProcessingTime} days</p>
                </div>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Target: 2 days
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                    Meeting goal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h4 className="text-base font-medium text-gray-700 mb-4">Verification Trends</h4>
          <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="h-64 flex items-end space-x-2">
                {metrics.verificationTrends.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full relative h-52">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-red-200"
                        style={{ height: `${item.rejected * 2}px` }}
                      ></div>
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-green-200"
                        style={{ height: `${item.approved * 0.3}px` }}
                      ></div>
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-yellow-200"
                        style={{ height: `${item.pending * 2}px` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">{item.month}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center space-x-8">
                <div className="flex items-center">
                  <span className="h-3 w-3 bg-yellow-200 rounded-sm mr-2"></span>
                  <span className="text-xs text-gray-500">Pending</span>
                </div>
                <div className="flex items-center">
                  <span className="h-3 w-3 bg-green-200 rounded-sm mr-2"></span>
                  <span className="text-xs text-gray-500">Approved</span>
                </div>
                <div className="flex items-center">
                  <span className="h-3 w-3 bg-red-200 rounded-sm mr-2"></span>
                  <span className="text-xs text-gray-500">Rejected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h4 className="text-base font-medium text-gray-700 mb-4">Verification by Document Type</h4>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <ul className="space-y-4">
                {metrics.verificationsByType.map((type, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-32 text-sm text-gray-600">{type.type}</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-indigo-600 h-2.5 rounded-full" 
                          style={{ width: `${(type.count / metrics.totalVerifications) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{type.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationMetrics;