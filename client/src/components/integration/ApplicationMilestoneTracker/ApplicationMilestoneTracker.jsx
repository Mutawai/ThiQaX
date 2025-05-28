/**
 * @file ApplicationMilestoneTracker component for tracking application progress
 * @description Displays real-time application milestone progress with visual timeline
 * @module components/integration/ApplicationMilestoneTracker
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styles from './ApplicationMilestoneTracker.module.css';

/**
 * ApplicationMilestoneTracker component
 * @description Tracks and displays application milestones with notifications
 * @returns {JSX.Element} Application milestone tracker component
 */
const ApplicationMilestoneTracker = ({ applicationId, onMilestoneUpdate, showTimeline = true }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);

  const { user } = useSelector((state) => ({
    user: state.auth.user
  }));

  /**
   * Fetch application milestones
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Milestones data
   */
  const fetchMilestones = async (applicationId) => {
    try {
      const response = await fetch(`/api/integration/application-milestones/${applicationId}`, {
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
      console.error('Milestones fetch failed:', error);
      throw error;
    }
  };

  /**
   * Record milestone notification
   * @param {string} applicationId - Application ID
   * @param {string} milestone - Milestone type
   * @param {Object} details - Milestone details
   * @returns {Promise<Object>} Notification result
   */
  const recordMilestoneNotification = async (applicationId, milestone, details) => {
    try {
      const response = await fetch('/api/integration/milestone-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ applicationId, milestone, details })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Milestone notification failed:', error);
      throw error;
    }
  };

  /**
   * Load milestones data
   */
  const loadMilestones = async () => {
    if (!applicationId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchMilestones(applicationId);
      setMilestones(result.data.milestones || []);
      setCurrentStage(result.data.currentStage);
      
      if (onMilestoneUpdate) {
        onMilestoneUpdate(result.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMilestones();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadMilestones, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [applicationId]);

  const getMilestoneConfig = (type) => {
    const configs = {
      'APPLICATION_SUBMITTED': {
        label: 'Application Submitted',
        icon: '📝',
        color: 'submitted',
        description: 'Your application has been submitted successfully'
      },
      'DOCUMENTS_UPLOADED': {
        label: 'Documents Uploaded',
        icon: '📎',
        color: 'documents',
        description: 'Required documents have been uploaded'
      },
      'DOCUMENTS_VERIFIED': {
        label: 'Documents Verified',
        icon: '✅',
        color: 'verified',
        description: 'Your documents have been verified'
      },
      'INITIAL_REVIEW': {
        label: 'Initial Review',
        icon: '👀',
        color: 'review',
        description: 'Application is under initial review'
      },
      'SHORTLISTED': {
        label: 'Shortlisted',
        icon: '⭐',
        color: 'shortlisted',
        description: 'You have been shortlisted for this position'
      },
      'INTERVIEW_SCHEDULED': {
        label: 'Interview Scheduled',
        icon: '📅',
        color: 'interview',
        description: 'Interview has been scheduled'
      },
      'INTERVIEW_COMPLETED': {
        label: 'Interview Completed',
        icon: '✅',
        color: 'completed',
        description: 'Interview has been completed'
      },
      'OFFER_MADE': {
        label: 'Offer Made',
        icon: '🎉',
        color: 'offer',
        description: 'Job offer has been extended'
      },
      'OFFER_ACCEPTED': {
        label: 'Offer Accepted',
        icon: '🤝',
        color: 'accepted',
        description: 'You have accepted the job offer'
      },
      'VISA_PROCESSING': {
        label: 'Visa Processing',
        icon: '🛂',
        color: 'visa',
        description: 'Visa application is being processed'
      },
      'VISA_APPROVED': {
        label: 'Visa Approved',
        icon: '✈️',
        color: 'approved',
        description: 'Your visa has been approved'
      },
      'TRAVEL_ARRANGED': {
        label: 'Travel Arranged',
        icon: '🎫',
        color: 'travel',
        description: 'Travel arrangements have been made'
      },
      'REJECTED': {
        label: 'Application Rejected',
        icon: '❌',
        color: 'rejected',
        description: 'Application was not successful'
      },
      'WITHDRAWN': {
        label: 'Application Withdrawn',
        icon: '🔙',
        color: 'withdrawn',
        description: 'Application has been withdrawn'
      }
    };

    return configs[type] || {
      label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      icon: '📋',
      color: 'default',
      description: 'Milestone updated'
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading && milestones.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading application progress...</div>
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
            onClick={loadMilestones}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noMilestones}>
          <span className={styles.noMilestonesIcon}>📋</span>
          <span>No milestones recorded yet</span>
        </div>
      </div>
    );
  }

  const sortedMilestones = [...milestones].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latestMilestone = sortedMilestones[0];
  const config = getMilestoneConfig(latestMilestone.milestone);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Application Progress</h3>
        <div className={`${styles.currentStatus} ${styles[config.color]}`}>
          <span className={styles.statusIcon}>{config.icon}</span>
          <span className={styles.statusText}>{config.label}</span>
        </div>
      </div>

      <div className={styles.currentMilestone}>
        <p className={styles.description}>{config.description}</p>
        {latestMilestone.details && (
          <div className={styles.details}>
            <p className={styles.detailsText}>{latestMilestone.details}</p>
          </div>
        )}
      </div>

      {showTimeline && (
        <div className={styles.timeline}>
          <h4 className={styles.timelineTitle}>Timeline</h4>
          <div className={styles.timelineList}>
            {sortedMilestones.map((milestone, index) => {
              const milestoneConfig = getMilestoneConfig(milestone.milestone);
              const { date, time } = formatDate(milestone.timestamp);
              
              return (
                <div key={index} className={styles.timelineItem}>
                  <div className={`${styles.timelineIcon} ${styles[milestoneConfig.color]}`}>
                    {milestoneConfig.icon}
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineHeader}>
                      <span className={styles.timelineLabel}>{milestoneConfig.label}</span>
                      <span className={styles.timelineDate}>{date}</span>
                    </div>
                    <div className={styles.timelineDescription}>
                      {milestoneConfig.description}
                    </div>
                    {milestone.details && (
                      <div className={styles.timelineDetails}>
                        {milestone.details}
                      </div>
                    )}
                    <div className={styles.timelineTime}>{time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button 
          onClick={loadMilestones}
          className={styles.refreshButton}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
        
        {currentStage && (
          <div className={styles.stageInfo}>
            <span className={styles.stageLabel}>Current Stage:</span>
            <span className={styles.stageValue}>{currentStage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationMilestoneTracker;