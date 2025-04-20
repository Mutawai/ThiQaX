import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './ApplicationFeedback.module.css';
import applicationService from '../../services/applicationService';

/**
 * ApplicationFeedback component allows users to provide feedback about their application experience.
 * It includes a rating system and text feedback field.
 */
const ApplicationFeedback = ({ applicationId, isCompleted, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Rating selection handler
  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
  };
  
  // Rating hover handlers
  const handleRatingHover = (hoveredValue) => {
    setHoveredRating(hoveredValue);
  };
  
  const handleRatingLeave = () => {
    setHoveredRating(0);
  };
  
  // Feedback text change handler
  const handleFeedbackChange = (e) => {
    setFeedback(e.target.value);
  };
  
  // Submit feedback handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await applicationService.submitFeedback(applicationId, {
        rating,
        feedback
      });
      
      setSuccess(true);
      
      if (onSubmit) {
        onSubmit({ rating, feedback });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Skip rendering if the application isn't completed and feedback isn't relevant yet
  if (!isCompleted) {
    return null;
  }
  
  // Render success message if feedback was submitted
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <i className={`${styles.icon} ${styles.successIcon}`}></i>
          <p>Thank you for your feedback! Your input helps us improve the platform for everyone.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Application Feedback</h2>
      <p className={styles.description}>
        Help us improve by sharing your experience with the application process. 
        Your feedback is valuable to us and helps make ThiQaX better for everyone.
      </p>
      
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.feedbackForm}>
        <div className={styles.ratingContainer}>
          <label className={styles.ratingLabel}>
            Rate your overall experience:
          </label>
          
          <div className={styles.starsContainer} onMouseLeave={handleRatingLeave}>
            {[1, 2, 3, 4, 5].map((starValue) => (
              <button
                key={starValue}
                type="button"
                className={styles.starButton}
                onMouseEnter={() => handleRatingHover(starValue)}
                onClick={() => handleRatingClick(starValue)}
                aria-label={`Rate ${starValue} star${starValue !== 1 ? 's' : ''}`}
              >
                <span 
                  className={`${styles.star} ${
                    (hoveredRating || rating) >= starValue ? styles.filled : ''
                  }`}
                >
                  ★
                </span>
              </button>
            ))}
          </div>
          
          <span className={styles.ratingText}>
            {rating > 0 ? (
              <>
                <strong>{rating}</strong> {rating === 1 ? 'star' : 'stars'}
              </>
            ) : 'No rating selected'}
          </span>
        </div>
        
        <div className={styles.feedbackTextContainer}>
          <label htmlFor="feedback" className={styles.feedbackLabel}>
            Share your thoughts (optional):
          </label>
          <textarea
            id="feedback"
            className={styles.feedbackTextarea}
            placeholder="What worked well? What could be improved? Any other comments or suggestions?"
            value={feedback}
            onChange={handleFeedbackChange}
            rows={5}
          />
        </div>
        
        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

ApplicationFeedback.propTypes = {
  applicationId: PropTypes.string.isRequired,
  isCompleted: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func
};

export default ApplicationFeedback;