/**
 * @file KYCStatus component - Sonnet style conversion
 * @description KYC verification status display without external UI dependencies
 * @module components/kyc/KYCStatus
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styles from './KYCStatus.module.css';

/**
 * KYC Status configuration
 */
const statusConfig = {
  unverified: {
    label: 'Not Started',
    icon: '⏳',
    color: 'default',
    description: 'You have not started the KYC verification process.'
  },
  pending: {
    label: 'Pending Review',
    icon: '🔄',
    color: 'warning',
    description: 'Your documents are being reviewed by our verification team.'
  },
  verified: {
    label: 'Verified',
    icon: '✅',
    color: 'success',
    description: 'Your identity has been successfully verified.'
  },
  rejected: {
    label: 'Rejected',
    icon: '❌',
    color: 'error',
    description: 'Your verification was rejected. Please review the feedback and resubmit.'
  },
  expired: {
    label: 'Expired',
    icon: '⚠️',
    color: 'error',
    description: 'Your verification has expired. Please submit new documents.'
  },
  incomplete: {
    label: 'Incomplete',
    icon: '⚠️',
    color: 'warning',
    description: 'Additional documents are required to complete verification.'
  }
};

/**
 * KYCStatus component - Sonnet style
 * @param {Object} props - Component props
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {boolean} props.compact - Whether to show compact view
 * @param {Function} props.onStartVerification - Callback for start verification
 * @returns {JSX.Element} KYC status component
 */
const KYCStatus = ({ showActions = true, compact = false, onStartVerification }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get KYC data from Redux store
  const { kycStatus, kycDetails, profile } = useSelector(state => ({
    kycStatus: state.auth?.kycStatus || 'unverified',
    kycDetails: state.auth?.kycDetails || null,
    profile: state.auth?.profile || null
  }));

  const status = kycStatus || 'unverified';
  const config = statusConfig[status] || statusConfig.unverified;

  /**
   * Refresh KYC status from API
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      // Check if backend action exists, otherwise use API directly
      if (typeof dispatch === 'function') {
        // Try Redux action first
        try {
          await dispatch({ type: 'KYC_STATUS_REQUEST' });
          // Simulate API call for now
          setTimeout(() => {
            dispatch({
              type: 'KYC_STATUS_SUCCESS',
              payload: {
                status: 'pending',
                details: {
                  verifiedAt: null,
                  expiresAt: null,
                  verificationId: null
                }
              }
            });
          }, 1000);
        } catch (reduxError) {
          // Fallback to direct API call
          await fetchKYCStatusDirect();
        }
      } else {
        await fetchKYCStatusDirect();
      }
    } catch (err) {
      setError(err.message || 'Failed to refresh KYC status');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Direct API call fallback
   */
  const fetchKYCStatusDirect = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/kyc/status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  };

  /**
   * Download KYC certificate
   */
  const handleDownloadCertificate = async () => {
    setDownloading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/kyc/certificate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'kyc-certificate.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download certificate');
    } finally {
      setDownloading(false);
    }
  };

  /**
   * Handle navigation actions
   */
  const handleStartVerification = () => {
    if (onStartVerification) {
      onStartVerification();
    } else {
      navigate('/profile/kyc');
    }
  };

  const handleResubmit = () => {
    navigate('/profile/kyc/resubmit');
  };

  // Compact view for dashboard widgets
  if (compact) {
    return (
      <div className={styles.compactStatus}>
        <div className={styles.compactContent}>
          <span className={`${styles.statusBadge} ${styles[config.color]}`}>
            <span className={styles.statusIcon}>{config.icon}</span>
            <span className={styles.statusLabel}>{config.label}</span>
          </span>
          {status === 'verified' && (
            <button 
              className={styles.downloadIcon}
              onClick={handleDownloadCertificate}
              disabled={downloading}
              title="Download Certificate"
            >
              📄
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className={styles.kycStatus}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>KYC Verification Status</h2>
        <button 
          className={`${styles.refreshButton} ${refreshing ? styles.rotating : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh Status"
        >
          🔄
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className={styles.dismissError}
          >
            ✕
          </button>
        </div>
      )}

      {/* Status Display */}
      <div className={styles.statusDisplay}>
        <div className={styles.statusHeader}>
          <div className={`${styles.statusIconLarge} ${styles[config.color]}`}>
            {config.icon}
          </div>
          <div className={styles.statusInfo}>
            <h3 className={styles.statusTitle}>{config.label}</h3>
            <p className={styles.statusDescription}>{config.description}</p>
          </div>
        </div>

        {/* Progress for pending status */}
        {status === 'pending' && (
          <div className={styles.progressSection}>
            <p className={styles.progressLabel}>Verification Progress</p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
            <p className={styles.progressTime}>Estimated time: 1-2 business days</p>
          </div>
        )}

        {/* Rejection reason */}
        {status === 'rejected' && kycDetails?.rejectionReason && (
          <div className={styles.rejectionAlert}>
            <h4 className={styles.alertTitle}>Rejection Reason:</h4>
            <p className={styles.alertText}>{kycDetails.rejectionReason}</p>
          </div>
        )}

        {/* Missing documents */}
        {status === 'incomplete' && kycDetails?.missingDocuments && (
          <div className={styles.incompleteAlert}>
            <h4 className={styles.alertTitle}>Missing Documents:</h4>
            <ul className={styles.documentList}>
              {kycDetails.missingDocuments.map((doc, index) => (
                <li key={index} className={styles.documentItem}>
                  <span className={styles.documentIcon}>📄</span>
                  <span className={styles.documentName}>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Verification details for verified status */}
        {status === 'verified' && kycDetails && (
          <div className={styles.verificationDetails}>
            <div className={styles.divider}></div>
            <div className={styles.detailsGrid}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Verified On:</span>
                <span className={styles.detailValue}>
                  {new Date(kycDetails.verifiedAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Valid Until:</span>
                <span className={styles.detailValue}>
                  {new Date(kycDetails.expiresAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Verification ID:</span>
                <span className={`${styles.detailValue} ${styles.monospace}`}>
                  {kycDetails.verificationId}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className={styles.actions}>
          <div className={styles.divider}></div>
          <div className={styles.actionButtons}>
            {status === 'unverified' && (
              <button
                className={`${styles.actionButton} ${styles.primary}`}
                onClick={handleStartVerification}
              >
                <span className={styles.buttonIcon}>ℹ️</span>
                Start Verification
              </button>
            )}
            
            {status === 'rejected' && (
              <button
                className={`${styles.actionButton} ${styles.primary}`}
                onClick={handleResubmit}
              >
                <span className={styles.buttonIcon}>🔄</span>
                Resubmit Documents
              </button>
            )}
            
            {status === 'incomplete' && (
              <button
                className={`${styles.actionButton} ${styles.primary}`}
                onClick={handleStartVerification}
              >
                <span className={styles.buttonIcon}>📄</span>
                Upload Missing Documents
              </button>
            )}
            
            {status === 'expired' && (
              <button
                className={`${styles.actionButton} ${styles.primary}`}
                onClick={handleStartVerification}
              >
                <span className={styles.buttonIcon}>🔄</span>
                Renew Verification
              </button>
            )}
            
            {status === 'verified' && (
              <button
                className={`${styles.actionButton} ${styles.secondary}`}
                onClick={handleDownloadCertificate}
                disabled={downloading}
              >
                <span className={styles.buttonIcon}>📥</span>
                {downloading ? 'Downloading...' : 'Download Certificate'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Info box for pending status */}
      {status === 'pending' && (
        <div className={styles.infoBox}>
          <div className={styles.infoAlert}>
            <span className={styles.infoIcon}>ℹ️</span>
            <p className={styles.infoText}>
              We'll notify you via email once your verification is complete. 
              You can also check back here for updates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCStatus;