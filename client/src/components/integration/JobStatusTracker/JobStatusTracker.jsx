/**
 * @file JobStatusTracker component for real-time job status monitoring
 * @description Displays job posting status and updates across the platform
 * @module components/integration/JobStatusTracker
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styles from './JobStatusTracker.module.css';

/**
 * JobStatusTracker component
 * @description Tracks job status changes and notifies relevant stakeholders
 * @returns {JSX.Element} Job status tracker component
 */
const JobStatusTracker = ({ jobId, onStatusChange, userRole = 'jobSeeker' }) => {
  const [jobStatus, setJobStatus] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [applicationsCount, setApplicationsCount] = useState(0);

  const { user } = useSelector((state) => ({
    user: state.auth.user
  }));

  /**
   * Fetch job status information
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job status data
   */
  const fetchJobStatus = async (jobId) => {
    try {
      const response = await fetch(`/api/integration/job-status/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Job status fetch failed:', error);
      throw error;
    }
  };

  /**
   * Send job status notification
   * @param {string} jobId - Job ID
   * @param {string} status - New status
   * @param {Array} recipients - Notification recipients
   * @returns {Promise<Object>} Notification result
   */
  const sendJobStatusNotification = async (jobId, status, recipients) => {
    try {
      const response = await fetch('/api/integration/job-status-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ jobId, status, recipients })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Job status notification failed:', error);
      throw error;
    }
  };

  /**
   * Load job status data
   */
  const loadJobStatus = async () => {
    if (!jobId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchJobStatus(jobId);
      const { currentStatus, statusHistory, applicationsCount, lastUpdated } = result.data;
      
      setJobStatus({
        currentStatus,
        lastUpdated,
        ...result.data
      });
      setStatusHistory(statusHistory || []);
      setApplicationsCount(applicationsCount || 0);
      
      if (onStatusChange) {
        onStatusChange(result.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load job status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobStatus();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadJobStatus, 45000); // Poll every 45 seconds
    
    return () => clearInterval(interval);
  }, [jobId]);

  const getStatusConfig = (status) => {
    const configs = {
      'DRAFT': {
        label: 'Draft',
        icon: '📝',
        color: 'draft',
        description: 'Job is being prepared and not yet published'
      },
      'ACTIVE': {
        label: 'Active',
        icon: '🟢',
        color: 'active',
        description: 'Job is live and accepting applications'
      },
      'PAUSED': {
        label: 'Paused',
        icon: '⏸️',
        color: 'paused',
        description: 'Job is temporarily not accepting applications'
      },
      'REVIEWING': {
        label: 'Under Review',
        icon: '👀',
        color: 'reviewing',
        description: 'Applications are being reviewed'
      },
      'SHORTLISTING': {
        label: 'Shortlisting',
        icon: '📋',
        color: 'shortlisting',
        description: 'Candidates are being shortlisted'
      },
      'INTERVIEWING': {
        label: 'Interviewing',
        icon: '💬',
        color: 'interviewing',
        description: 'Interviews are in progress'
      },
      'FILLED': {
        label: 'Position Filled',
        icon: '✅',
        color: 'filled',
        description: 'Position has been successfully filled'
      },
      'CANCELLED': {
        label: 'Cancelled',
        icon: '❌',
        color: 'cancelled',
        description: 'Job posting has been cancelled'
      },
      'EXPIRED': {
        label: 'Expired',
        icon: '⏰',
        color: 'expired',
        description: 'Job posting has expired'
      },
      'CLOSED': {
        label: 'Closed',
        icon: '🔒',
        color: 'closed',
        description: 'Job is no longer accepting applications'
      }
    };

    return configs[status] || {
      label: status?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
      icon: '📋',
      color: 'default',
      description: 'Status information not available'
    };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: '', time: '' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getApplicationsText = () => {
    if (applicationsCount === 0) return 'No applications yet';
    if (applicationsCount === 1) return '1 application received';
    return `${applicationsCount} applications received`;
  };

  if (loading && !jobStatus) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading job status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
          <button 
            onClick={loadJobStatus}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!jobStatus) {
    return null;
  }

  const statusConfig = getStatusConfig(jobStatus.currentStatus);
  const { date, time } = formatDateTime(jobStatus.lastUpdated);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Job Status</h3>
        <div className={`${styles.status} ${styles[statusConfig.color]}`}>
          <span className={styles.statusIcon}>{statusConfig.icon}</span>
          <span className={styles.statusText}>{statusConfig.label}</span>
        </div>
      </div>

      <div className={styles.statusDetails}>
        <p className={styles.description}>{statusConfig.description}</p>
        
        {jobStatus.lastUpdated && (
          <div className={styles.lastUpdated}>
            <span className={styles.updateLabel}>Last updated:</span>
            <span className={styles.updateTime}>{date} at {time}</span>
          </div>
        )}
      </div>

      {userRole !== 'jobSeeker' && (
        <div className={styles.metrics}>
          <div className={styles.metricItem}>
            <span className={styles.metricIcon}>👥</span>
            <span className={styles.metricText}>{getApplicationsText()}</span>
          </div>
          
          {jobStatus.viewsCount && (
            <div className={styles.metricItem}>
              <span className={styles.metricIcon}>👁️</span>
              <span className={styles.metricText}>{jobStatus.viewsCount} views</span>
            </div>
          )}
          
          {jobStatus.shortlistedCount && (
            <div className={styles.metricItem}>
              <span className={styles.metricIcon}>⭐</span>
              <span className={styles.metricText}>{jobStatus.shortlistedCount} shortlisted</span>
            </div>
          )}
        </div>
      )}

      {statusHistory.length > 0 && (
        <div className={styles.history}>
          <h4 className={styles.historyTitle}>Status History</h4>
          <div className={styles.historyList}>
            {statusHistory.slice(0, 3).map((historyItem, index) => {
              const historyConfig = getStatusConfig(historyItem.status);
              const historyDate = formatDateTime(historyItem.timestamp);
              
              return (
                <div key={index} className={styles.historyItem}>
                  <div className={`${styles.historyIcon} ${styles[historyConfig.color]}`}>
                    {historyConfig.icon}
                  </div>
                  <div className={styles.historyContent}>
                    <div className={styles.historyHeader}>
                      <span className={styles.historyStatus}>{historyConfig.label}</span>
                      <span className={styles.historyDate}>{historyDate.date}</span>
                    </div>
                    {historyItem.reason && (
                      <div className={styles.historyReason}>{historyItem.reason}</div>
                    )}
                    <div className={styles.historyTime}>{historyDate.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {statusHistory.length > 3 && (
            <button className={styles.showMoreButton}>
              Show {statusHistory.length - 3} more status changes
            </button>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button 
          onClick={loadJobStatus}
          className={styles.refreshButton}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
        
        {userRole === 'sponsor' && jobStatus.currentStatus === 'ACTIVE' && (
          <button 
            onClick={() => window.location.href = `/jobs/${jobId}/applications`}
            className={styles.viewApplicationsButton}
          >
            View Applications
          </button>
        )}
        
        {userRole === 'agent' && (
          <button 
            onClick={() => window.location.href = `/jobs/${jobId}/manage`}
            className={styles.manageButton}
          >
            Manage Job
          </button>
        )}
        
        {userRole === 'jobSeeker' && jobStatus.currentStatus === 'ACTIVE' && (
          <button 
            onClick={() => window.location.href = `/jobs/${jobId}/apply`}
            className={styles.applyButton}
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
};

export default JobStatusTracker;