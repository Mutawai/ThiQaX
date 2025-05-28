/**
 * @file KYCStatusIntegrator component for real-time KYC verification status
 * @description Displays KYC verification status and integrates with profile updates
 * @module components/integration/KYCStatusIntegrator
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styles from './KYCStatusIntegrator.module.css';

/**
 * KYCStatusIntegrator component
 * @description Integrates KYC verification status across the platform
 * @returns {JSX.Element} KYC status integrator component
 */
const KYCStatusIntegrator = ({ onStatusChange, showDetails = true }) => {
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncingProfile, setSyncingProfile] = useState(false);

  const { user, profile } = useSelector((state) => ({
    user: state.auth.user,
    profile: state.profile.profile
  }));

  const dispatch = useDispatch();

  /**
   * Fetch KYC verification status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} KYC status data
   */
  const fetchKYCStatus = async (userId) => {
    try {
      const response = await fetch(`/api/integration/kyc-status/${userId}`, {
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
      console.error('KYC status fetch failed:', error);
      throw error;
    }
  };

  /**
   * Sync KYC status with profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Sync result
   */
  const syncKYCWithProfile = async (userId) => {
    try {
      const response = await fetch(`/api/integration/sync-kyc-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('KYC profile sync failed:', error);
      throw error;
    }
  };

  /**
   * Load KYC status
   */
  const loadKYCStatus = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchKYCStatus(user.id);
      setKycStatus(result.data);
      
      if (onStatusChange) {
        onStatusChange(result.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load KYC status');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle profile sync
   */
  const handleProfileSync = async () => {
    if (!user?.id) return;

    setSyncingProfile(true);
    try {
      await syncKYCWithProfile(user.id);
      await loadKYCStatus(); // Refresh status after sync
      
      // Dispatch action to update profile in Redux store
      dispatch({ type: 'PROFILE_SYNC_SUCCESS' });
    } catch (err) {
      setError(err.message || 'Failed to sync profile');
    } finally {
      setSyncingProfile(false);
    }
  };

  useEffect(() => {
    loadKYCStatus();
  }, [user?.id]);

  const getStatusConfig = (status) => {
    const configs = {
      'VERIFIED': {
        icon: '✅',
        label: 'Verified',
        color: 'verified',
        description: 'Your identity has been successfully verified'
      },
      'PENDING': {
        icon: '🔄',
        label: 'Pending',
        color: 'pending',
        description: 'Your documents are being reviewed'
      },
      'REJECTED': {
        icon: '❌',
        label: 'Rejected',
        color: 'rejected',
        description: 'Verification failed. Please resubmit documents'
      },
      'NOT_STARTED': {
        icon: '⏳',
        label: 'Not Started',
        color: 'notStarted',
        description: 'Start your identity verification process'
      },
      'INCOMPLETE': {
        icon: '⚠️',
        label: 'Incomplete',
        color: 'incomplete',
        description: 'Additional documents required'
      }
    };

    return configs[status] || configs['NOT_STARTED'];
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading KYC status...</div>
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
            onClick={loadKYCStatus}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!kycStatus) {
    return null;
  }

  const { 
    overallStatus, 
    identityDocument, 
    addressDocument, 
    lastUpdated, 
    nextActionRequired 
  } = kycStatus;

  const statusConfig = getStatusConfig(overallStatus);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>KYC Verification Status</h3>
        <div className={`${styles.status} ${styles[statusConfig.color]}`}>
          <span className={styles.statusIcon}>{statusConfig.icon}</span>
          <span className={styles.statusText}>{statusConfig.label}</span>
        </div>
      </div>

      {showDetails && (
        <div className={styles.details}>
          <p className={styles.description}>{statusConfig.description}</p>
          
          {(identityDocument || addressDocument) && (
            <div className={styles.documents}>
              <h4 className={styles.sectionTitle}>Document Status:</h4>
              
              {identityDocument && (
                <div className={styles.documentItem}>
                  <span className={styles.documentLabel}>Identity Document:</span>
                  <span className={`${styles.documentStatus} ${styles[identityDocument.status?.toLowerCase()]}`}>
                    {getStatusConfig(identityDocument.status).icon} {identityDocument.status}
                  </span>
                </div>
              )}
              
              {addressDocument && (
                <div className={styles.documentItem}>
                  <span className={styles.documentLabel}>Address Document:</span>
                  <span className={`${styles.documentStatus} ${styles[addressDocument.status?.toLowerCase()]}`}>
                    {getStatusConfig(addressDocument.status).icon} {addressDocument.status}
                  </span>
                </div>
              )}
            </div>
          )}

          {nextActionRequired && (
            <div className={styles.nextAction}>
              <h4 className={styles.sectionTitle}>Next Action Required:</h4>
              <p className={styles.actionText}>{nextActionRequired}</p>
            </div>
          )}

          {lastUpdated && (
            <div className={styles.lastUpdated}>
              <span className={styles.updateLabel}>Last Updated:</span>
              <span className={styles.updateTime}>
                {new Date(lastUpdated).toLocaleDateString()} at{' '}
                {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button 
          onClick={loadKYCStatus}
          className={styles.refreshButton}
          disabled={loading}
        >
          Refresh Status
        </button>
        
        <button 
          onClick={handleProfileSync}
          className={styles.syncButton}
          disabled={syncingProfile}
        >
          {syncingProfile ? 'Syncing...' : 'Sync Profile'}
        </button>

        {overallStatus === 'NOT_STARTED' || overallStatus === 'INCOMPLETE' && (
          <button 
            onClick={() => window.location.href = '/kyc/verify'}
            className={styles.verifyButton}
          >
            {overallStatus === 'NOT_STARTED' ? 'Start Verification' : 'Complete Verification'}
          </button>
        )}

        {overallStatus === 'REJECTED' && (
          <button 
            onClick={() => window.location.href = '/kyc/resubmit'}
            className={styles.resubmitButton}
          >
            Resubmit Documents
          </button>
        )}
      </div>
    </div>
  );
};

export default KYCStatusIntegrator;