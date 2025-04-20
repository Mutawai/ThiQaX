import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import styles from './OfferAcceptance.module.css';
import applicationService from '../../services/applicationService';

/**
 * OfferAcceptance component allows users to accept or decline job offers.
 * It displays offer details and handles the acceptance/rejection process.
 */
const OfferAcceptance = ({ application, onComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Confirmation handler
  const handleConfirmationOpen = (action) => {
    setConfirmationAction(action);
    setShowConfirmation(true);
  };
  
  // Close confirmation dialog
  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setConfirmationAction(null);
    setDeclineReason('');
  };
  
  // Accept offer
  const handleAcceptOffer = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await applicationService.acceptOffer(application.id);
      setSuccess('Offer accepted successfully! Congratulations on your new position.');
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept offer. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };
  
  // Decline offer
  const handleDeclineOffer = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await applicationService.declineOffer(application.id, declineReason);
      setSuccess('Offer declined. Thank you for your consideration.');
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to decline offer. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };
  
  // If application doesn't have an offer, don't render
  if (!application.hasOffer) {
    return null;
  }
  
  // Render success message after completion
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <i className={`${styles.icon} ${styles.successIcon}`}></i>
          <p>{success}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Job Offer</h2>
      
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}
      
      <div className={styles.offerDetails}>
        <div className={styles.detailItem}>
          <span className={styles.label}>Position:</span>
          <span className={styles.value}>{application.jobTitle}</span>
        </div>
        
        <div className={styles.detailItem}>
          <span className={styles.label}>Employer:</span>
          <span className={styles.value}>{application.employer}</span>
        </div>
        
        <div className={styles.detailItem}>
          <span className={styles.label}>Location:</span>
          <span className={styles.value}>{application.location}</span>
        </div>
        
        <div className={styles.detailItem}>
          <span className={styles.label}>Salary:</span>
          <span className={styles.value}>{application.salary}</span>
        </div>
        
        <div className={styles.detailItem}>
          <span className={styles.label}>Start Date:</span>
          <span className={styles.value}>{application.startDate}</span>
        </div>
        
        {application.offerLetter && (
          <div className={styles.offerLetterContainer}>
            <h3 className={styles.offerLetterTitle}>Offer Letter</h3>
            <a 
              href={application.offerLetter} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.offerLetterLink}
            >
              View Offer Letter
            </a>
          </div>
        )}
        
        <div className={styles.offerExpiry}>
          <p>This offer is valid until: <strong>{application.offerExpiryDate}</strong></p>
        </div>
      </div>
      
      <div className={styles.actions}>
        <button 
          className={`${styles.actionButton} ${styles.acceptButton}`}
          onClick={() => handleConfirmationOpen('accept')}
          disabled={isSubmitting}
        >
          Accept Offer
        </button>
        
        <button 
          className={`${styles.actionButton} ${styles.declineButton}`}
          onClick={() => handleConfirmationOpen('decline')}
          disabled={isSubmitting}
        >
          Decline Offer
        </button>
      </div>
      
      {showConfirmation && (
        <div className={styles.confirmationModal}>
          <div className={styles.confirmationContent}>
            <h3 className={styles.confirmationTitle}>
              {confirmationAction === 'accept' ? 'Accept Offer' : 'Decline Offer'}
            </h3>
            
            <p className={styles.confirmationMessage}>
              {confirmationAction === 'accept'
                ? 'Are you sure you want to accept this job offer? This will notify the employer of your decision.'
                : 'Are you sure you want to decline this job offer? This cannot be undone.'}
            </p>
            
            {confirmationAction === 'decline' && (
              <div className={styles.reasonContainer}>
                <label htmlFor="declineReason" className={styles.reasonLabel}>
                  Please provide a reason (optional):
                </label>
                <textarea
                  id="declineReason"
                  className={styles.reasonTextarea}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Please let us know why you're declining this offer..."
                  rows={4}
                />
              </div>
            )}
            
            <div className={styles.confirmationActions}>
              <button
                className={`${styles.confirmationButton} ${styles.confirmButton}`}
                onClick={confirmationAction === 'accept' ? handleAcceptOffer : handleDeclineOffer}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : (confirmationAction === 'accept' ? 'Confirm Acceptance' : 'Confirm Decline')}
              </button>
              
              <button
                className={`${styles.confirmationButton} ${styles.cancelButton}`}
                onClick={handleConfirmationClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

OfferAcceptance.propTypes = {
  application: PropTypes.shape({
    id: PropTypes.string.isRequired,
    jobTitle: PropTypes.string.isRequired,
    employer: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    salary: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    offerExpiryDate: PropTypes.string,
    offerLetter: PropTypes.string,
    hasOffer: PropTypes.bool.isRequired
  }).isRequired,
  onComplete: PropTypes.func
};

export default OfferAcceptance;