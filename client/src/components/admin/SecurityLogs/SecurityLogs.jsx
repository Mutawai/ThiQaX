import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styles from './SecurityLogs.module.css';

const SecurityLogs = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [logGroups, setLogGroups] = useState({});
  const [filters, setFilters] = useState({
    severity: '',
    category: '',
    source: '',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0
  });
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);
  
  const dispatch = useDispatch();
  
  // Load logs on component mount and when filters/pagination change
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // In a real implementation, this would dispatch an action to fetch logs
        // Example: await dispatch(fetchSecurityLogs(filters, pagination.currentPage));
        
        // Simulate API call with mock data
        setTimeout(() => {
          // Generate mock logs
          const mockLogs = Array(40).fill().map((_, index) => {
            const severity = ['critical', 'high', 'medium', 'low', 'info'][Math.floor(Math.random() * 5)];
            const category = ['authentication', 'authorization', 'data_access', 'system', 'api'][Math.floor(Math.random() * 5)];
            const source = ['webapp', 'api', 'database', 'server', 'thirdparty'][Math.floor(Math.random() * 5)];
            const timestamp = new Date(Date.now() - (index * 3600000 * (Math.random() * 5))).toISOString();
            const userId = Math.random() > 0.3 ? `user-${Math.floor(Math.random() * 100)}` : null;
            
            return {
              id: `log-${index + 1}`,
              timestamp,
              severity,
              category,
              source,
              message: getLogMessage(category, severity),
              ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
              userId,
              userName: userId ? ['John Doe', 'Jane Smith', 'Admin User', 'Test User'][Math.floor(Math.random() * 4)] : null,
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
              metadata: {
                requestId: `req-${Math.random().toString(36).substring(2, 10)}`,
                endpoint: category === 'api' ? `/api/v1/${['users', 'jobs', 'documents', 'verifications'][Math.floor(Math.random() * 4)]}` : null,
                responseCode: category === 'api' ? [200, 201, 400, 401, 403, 404, 500][Math.floor(Math.random() * 7)] : null,
                sessionId: `sess-${Math.random().toString(36).substring(2, 10)}`,
                browser: 'Chrome',
                os: 'Windows 10',
                device: 'Desktop'
              }
            };
          });
          
          // Filter logs based on filters
          let filteredLogs = [...mockLogs];
          
          if (filters.severity) {
            filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
          }
          
          if (filters.category) {
            filteredLogs = filteredLogs.filter(log => log.category === filters.category);
          }
          
          if (filters.source) {
            filteredLogs = filteredLogs.filter(log => log.source === filters.source);
          }
          
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startDate);
          }
          
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endDate);
          }
          
          if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            filteredLogs = filteredLogs.filter(log => 
              log.message.toLowerCase().includes(searchTerm) ||
              (log.userName && log.userName.toLowerCase().includes(searchTerm)) ||
              (log.userId && log.userId.toLowerCase().includes(searchTerm)) ||
              log.ipAddress.includes(searchTerm)
            );
          }
          
          // Group logs by date
          const groups = {};
          filteredLogs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleDateString();
            if (!groups[date]) {
              groups[date] = [];
            }
            groups[date].push(log);
          });
          
          // Sort groups by date (newest first)
          const sortedGroups = {};
          Object.keys(groups)
            .sort((a, b) => new Date(b) - new Date(a))
            .forEach(date => {
              sortedGroups[date] = groups[date];
            });
          
          // Set logs and groups
          setLogs(filteredLogs);
          setLogGroups(sortedGroups);
          
          // Set pagination
          setPagination({
            currentPage: 1,
            totalPages: Math.ceil(filteredLogs.length / 20),
            totalLogs: filteredLogs.length
          });
          
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError(err.message || 'Failed to load security logs');
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, [dispatch, filters]);
// Helper function to generate realistic log messages
  const getLogMessage = (category, severity) => {
    const messages = {
      authentication: {
        critical: 'Brute force attack detected: Multiple failed login attempts from same IP',
        high: 'Failed login attempt for admin user',
        medium: 'User locked out due to multiple failed login attempts',
        low: 'Password reset requested',
        info: 'Successful login'
      },
      authorization: {
        critical: 'Privilege escalation attempt detected',
        high: 'Unauthorized access attempt to restricted resource',
        medium: 'Permission denied for resource access',
        low: 'User session expired',
        info: 'User permissions updated'
      },
      data_access: {
        critical: 'Unauthorized bulk data export detected',
        high: 'Sensitive document accessed by unauthorized user',
        medium: 'Document sharing permissions modified',
        low: 'User document access revoked',
        info: 'Document uploaded successfully'
      },
      system: {
        critical: 'System configuration change detected: Firewall disabled',
        high: 'System component failure',
        medium: 'System configuration changed: Password policy updated',
        low: 'Routine system backup completed',
        info: 'System health check passed'
      },
      api: {
        critical: 'API rate limit significantly exceeded, possible DOS attack',
        high: 'Invalid API key used multiple times',
        medium: 'API endpoint returned 500 error',
        low: 'API endpoint deprecated access',
        info: 'API request completed successfully'
      }
    };
    
    return messages[category][severity] || 'Unknown event';
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const applyFilters = (e) => {
    e.preventDefault();
    setPagination({
      ...pagination,
      currentPage: 1
    });
  };
  
  const resetFilters = () => {
    setFilters({
      severity: '',
      category: '',
      source: '',
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
  };
  
  const toggleGroupExpansion = (date) => {
    setExpandedGroups({
      ...expandedGroups,
      [date]: !expandedGroups[date]
    });
  };
  
  const viewLogDetails = (log) => {
    setSelectedLog(log);
  };
  
  const getSeverityClass = (severity) => {
    const classes = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
      info: 'bg-green-100 text-green-800'
    };
    
    return classes[severity] || 'bg-gray-100 text-gray-800';
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
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
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Security Logs</h3>
        <p className="mt-1 text-sm text-gray-500">
          Monitor security events and potential threats to the platform
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {/* Filter Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <form onSubmit={applyFilters}>
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">Search</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="searchTerm"
                    id="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleFilterChange}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search logs by message, user, or IP..."
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="sm:col-span-1">
                <label htmlFor="severity" className="block text-sm font-medium text-gray-700">Severity</label>
                <div className="mt-1">
                  <select
                    id="severity"
                    name="severity"
                    value={filters.severity}
                    onChange={handleFilterChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>
              
              <div className="sm:col-span-1">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                <div className="mt-1">
                  <select
                    id="category"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">All Categories</option>
                    <option value="authentication">Authentication</option>
                    <option value="authorization">Authorization</option>
                    <option value="data_access">Data Access</option>
                    <option value="system">System</option>
                    <option value="api">API</option>
                  </select>
                </div>
              </div>
              
              <div className="sm:col-span-1">
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">Source</label>
                <div className="mt-1">
                  <select
                    id="source"
                    name="source"
                    value={filters.source}
                    onChange={handleFilterChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">All Sources</option>
                    <option value="webapp">Web App</option>
                    <option value="api">API</option>
                    <option value="database">Database</option>
                    <option value="server">Server</option>
                    <option value="thirdparty">Third Party</option>
                  </select>
                </div>
              </div>
              
              <div className="sm:col-span-1">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-1">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-1">
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Filter
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Critical Alerts
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {logs.filter(log => log.severity === 'critical').length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      High Severity
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {logs.filter(log => log.severity === 'high').length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Medium Severity
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {logs.filter(log => log.severity === 'medium').length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Events Today
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {logs.filter(log => {
                          const today = new Date().toLocaleDateString();
                          const logDate = new Date(log.timestamp).toLocaleDateString();
                          return logDate === today;
                        }).length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
{/* Logs Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {logs.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {Object.entries(logGroups).map(([date, groupLogs]) => (
                <li key={date}>
                  <div
                    className="bg-gray-50 px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleGroupExpansion(date)}
                  >
                    <div className="flex items-center">
                      <svg
                        className={`mr-2 h-5 w-5 text-gray-400 transform ${expandedGroups[date] ? 'rotate-90' : ''} transition-transform duration-150`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">{date}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500">{groupLogs.length} events</span>
                      <div className="ml-4 flex space-x-1">
                        {groupLogs.some(log => log.severity === 'critical') && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Critical
                          </span>
                        )}
                        {groupLogs.some(log => log.severity === 'high') && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            High
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedGroups[date] && (
                    <div className="bg-white">
                      <ul className="divide-y divide-gray-100">
                        {groupLogs.map(log => (
                          <li
                            key={log.id}
                            className="flex items-start px-4 py-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => viewLogDetails(log)}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {formatTimestamp(log.timestamp)}
                                </p>
                                <span
                                  className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityClass(
                                    log.severity
                                  )}`}
                                >
                                  {log.severity}
                                </span>
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {log.category.replace('_', ' ')}
                                </span>
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {log.source}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-600">{log.message}</p>
                              <div className="mt-2 flex items-center text-xs text-gray-500">
                                {log.userId ? (
                                  <span className="truncate hover:text-gray-900">
                                    {log.userName} ({log.userId})
                                  </span>
                                ) : (
                                  <span>System</span>
                                )}
                                <span className="mx-1">•</span>
                                <span>{log.ipAddress}</span>
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div
              className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-headline"
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setSelectedLog(null)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                    Log Details
                  </h3>
                  
                  <div className="mt-4">
                    <div className="bg-gray-50 px-4 py-4 sm:rounded-lg">
                      <div className="flex items-center">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityClass(
                            selectedLog.severity
                          )}`}
                        >
                          {selectedLog.severity}
                        </div>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {selectedLog.category.replace('_', ' ')}
                        </span>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {selectedLog.source}
                        </span>
                      </div>
                      
                      <p className="mt-2 text-sm text-gray-600">{selectedLog.message}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(selectedLog.timestamp).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">User Information</h4>
                      <dl className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                        <div className="px-4 py-3 grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">User</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {selectedLog.userName || 'System'}
                          </dd>
                        </div>
                        <div className="px-4 py-3 grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">User ID</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {selectedLog.userId || 'N/A'}
                          </dd>
                        </div>
                        <div className="px-4 py-3 grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">IP Address</dt>
                          <dd className="text-sm text-gray-900 col-span-2">{selectedLog.ipAddress}</dd>
                        </div>
                        <div className="px-4 py-3 grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">User Agent</dt>
                          <dd className="text-sm text-gray-900 col-span-2 truncate">
                            {selectedLog.userAgent}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Additional Information</h4>
                      <dl className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                        <div className="px-4 py-3 grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Request ID</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {selectedLog.metadata.requestId}
                          </dd>
                        </div>
                        {selectedLog.metadata.endpoint && (
                          <div className="px-4 py-3 grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Endpoint</dt>
                            <dd className="text-sm text-gray-900 col-span-2">
                              {selectedLog.metadata.endpoint}
                            </dd>
                          </div>
                        )}
                        {selectedLog.metadata.responseCode && (
                          <div className="px-4 py-3 grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Response Code</dt>
                            <dd className="text-sm text-gray-900 col-span-2">
                              {selectedLog.metadata.responseCode}
                            </dd>
                          </div>
                        )}
                        <div className="px-4 py-3 grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Session ID</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {selectedLog.metadata.sessionId}
                          </dd>
                        </div>
                        <div className="px-4 py-3 grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Browser</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {selectedLog.metadata.browser}
                          </dd>
                        </div>
                        <div className="px-4 py-3 grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">OS / Device</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {selectedLog.metadata.os} / {selectedLog.metadata.device}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityLogs;