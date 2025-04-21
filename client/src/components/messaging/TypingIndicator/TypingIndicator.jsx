// client/src/components/messaging/TypingIndicator/TypingIndicator.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography, Box } from '@mui/material';
import styles from './TypingIndicator.module.css';

/**
 * TypingIndicator Component
 * 
 * Displays an animated indicator when someone is typing
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isTyping - Whether the user is currently typing
 * @param {string} props.userName - Name of the user who is typing
 * @param {number} props.timeout - Time in ms after which typing indicator disappears if no updates
 */
const TypingIndicator = ({ isTyping, userName, timeout = 3000 }) => {
  const [visible, setVisible] = useState(false);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    // Clear existing timer if any
    if (timer) {
      clearTimeout(timer);
    }

    if (isTyping) {
      setVisible(true);
      
      // Set a new timeout to hide the indicator after the specified time
      const newTimer = setTimeout(() => {
        setVisible(false);
      }, timeout);
      
      setTimer(newTimer);
    } else {
      setVisible(false);
    }

    // Cleanup timer on unmount
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isTyping, timeout, timer]);

  if (!visible) {
    return null;
  }

  return (
    <Box className={styles.container}>
      <Typography variant="caption" className={styles.text}>
        {userName ? `${userName} is typing` : 'Someone is typing'}
      </Typography>
      <div className={styles.dots}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
    </Box>
  );
};

TypingIndicator.propTypes = {
  isTyping: PropTypes.bool.isRequired,
  userName: PropTypes.string,
  timeout: PropTypes.number
};

export default TypingIndicator;