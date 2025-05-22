import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './ScreenReaderAnnouncements.module.css';

/**
 * ScreenReaderAnnouncements - Component for making dynamic announcements to screen readers
 * 
 * Use this component to announce important updates to screen reader users.
 * The announcements are visually hidden but available to assistive technologies.
 * 
 * @example
 * // For immediate announcement
 * <ScreenReaderAnnouncements message="Your application has been submitted successfully." />
 * 
 * @example
 * // For announcing messages that change programmatically
 * <ScreenReaderAnnouncements 
 *   message={`${updatedCount} new jobs found matching your criteria.`}
 *   politeness="assertive" 
 * />
 */
const ScreenReaderAnnouncements = ({ 
  message, 
  clearAfter = 5000, 
  politeness = 'polite', 
  announceOnce = false 
}) => {
  const [announcement, setAnnouncement] = useState('');
  const previousMessageRef = useRef('');
  const announcementRef = useRef(null);

  useEffect(() => {
    // Skip if message is empty or the same as the previous (when announceOnce is true)
    if (!message || (announceOnce && message === previousMessageRef.current)) {
      return;
    }

    // Save current message for reference
    previousMessageRef.current = message;
    
    // Set the announcement
    setAnnouncement(message);

    // Clear the announcement after specified time
    const timerId = setTimeout(() => {
      setAnnouncement('');
    }, clearAfter);

    // Cleanup
    return () => {
      clearTimeout(timerId);
    };
  }, [message, clearAfter, announceOnce]);

  // Focus the element when announcement changes to ensure certain screen readers catch it
  useEffect(() => {
    if (announcement && announcementRef.current) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        // Try to get screen reader's attention in some edge cases
        announcementRef.current.focus();
      });
    }
  }, [announcement]);

  return (
    <>
      <div
        ref={announcementRef}
        className={styles.srOnly}
        role="status"
        aria-live={politeness}
        aria-atomic="true"
        tabIndex="-1"
      >
        {announcement}
      </div>
    </>
  );
};

ScreenReaderAnnouncements.propTypes = {
  /** The message to be announced to screen readers */
  message: PropTypes.string,
  /** Time in milliseconds after which the announcement is cleared */
  clearAfter: PropTypes.number,
  /** ARIA live region politeness level: 'polite' or 'assertive' */
  politeness: PropTypes.oneOf(['polite', 'assertive']),
  /** If true, the same message won't be announced twice in a row */
  announceOnce: PropTypes.bool
};

export default ScreenReaderAnnouncements;