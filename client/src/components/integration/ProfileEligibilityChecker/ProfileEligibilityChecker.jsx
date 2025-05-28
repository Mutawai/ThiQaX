/**
 * @file ProfileEligibilityChecker component for checking application eligibility
 * @description Displays profile completeness and eligibility status for job applications
 * @module components/integration/ProfileEligibilityChecker
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styles from './ProfileEligibilityChecker.module.css';

/**
 * ProfileEligibilityChecker component
 * @description Checks and displays user profile eligibility for job applications
 * @returns {JSX.Element} Profile eligibility checker component
 */
const ProfileEligibilityChecker = ({ jobId, onEligibilityChange }) => {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, profile } = useSelector((state) => ({
    user: state.auth.user,
    profile: state.profile.profile
  }));

  /**
   * Check application eligibility
   * @param {string} userId - User ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Eligibility check result
   */
  const checkEligibility = async (userId, jobId) => {
    try {
      const response = await fetch(`/api/integration/check-eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId, jobId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Eligibility check failed:', error);
      throw error;
    }
  };

  /**
   * Load eligibility status
   */
  const loadEligibility = async () => {
    if (!user?.id || !jobId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await checkEligibility(user.id, jobId);
      setEligibility(result.data);
      
      if (onEligibilityChange) {
        onEligibilityChange(result.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEligibility();
  }, [user?.id, jobId, profile?.lastUpdated]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Checking eligibility...</div>
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
            onClick={loadEligibility}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!eligibility) {
    return null;
  }

  const { eligible, reasons, missingRequirements, warnings } = eligibility;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Eligibility Status</h3>
        <div className={`${styles.status} ${eligible ? styles.eligible : styles.ineligible}`}>
          <span className={styles.statusIcon}>
            {eligible ? '✅' : '❌'}
          </span>
          <span className={styles.statusText}>
            {eligible ? 'Eligible to Apply' : 'Not Eligible'}
          </span>
        </div>
      </div>

      {!eligible && reasons && reasons.length > 0 && (
        <div className={styles.reasons}>
          <h4 className={styles.sectionTitle}>Requirements Not Met:</h4>
          <ul className={styles.reasonsList}>
            {reasons.map((reason, index) => (
              <li key={index} className={styles.reasonItem}>
                <span className={styles.reasonIcon}>•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingRequirements && missingRequirements.length > 0 && (
        <div className={styles.missing}>
          <h4 className={styles.sectionTitle}>Missing Information:</h4>
          <ul className={styles.missingList}>
            {missingRequirements.map((requirement, index) => (
              <li key={index} className={styles.missingItem}>
                <span className={styles.missingIcon}>⚠️</span>
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <div className={styles.warnings}>
          <h4 className={styles.sectionTitle}>Warnings:</h4>
          <ul className={styles.warningsList}>
            {warnings.map((warning, index) => (
              <li key={index} className={styles.warningItem}>
                <span className={styles.warningIcon}>⚠️</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <button 
          onClick={loadEligibility}
          className={styles.refreshButton}
        >
          Refresh Status
        </button>
        {!eligible && (
          <button 
            onClick={() => window.location.href = '/profile/complete'}
            className={styles.completeButton}
          >
            Complete Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileEligibilityChecker;
