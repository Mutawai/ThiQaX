// client/src/components/messaging/ReadReceipt/ReadReceipt.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Typography } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoneIcon from '@mui/icons-material/Done';
import styles from './ReadReceipt.module.css';

/**
 * ReadReceipt Component
 * 
 * Displays read status for a message with appropriate styling
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isRead - Whether the message has been read
 * @param {string} props.readAt - ISO timestamp when message was read
 * @param {boolean} props.isSent - Whether the message has been sent successfully
 * @param {string} props.alignRight - Whether to align the component to the right
 */
const ReadReceipt = ({ isRead, readAt, isSent, alignRight }) => {
  // Format the timestamp if it exists
  const formattedTime = readAt ? new Date(readAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '';
  
  // Determine appropriate status message for tooltip
  const getStatusMessage = () => {
    if (!isSent) return 'Sending...';
    if (!isRead) return 'Delivered';
    return `Read at ${formattedTime}`;
  };
  
  return (
    <div className={`${styles.container} ${alignRight ? styles.alignRight : ''}`}>
      <Tooltip title={getStatusMessage()} placement="bottom" arrow>
        <div className={styles.receiptContainer}>
          {!isSent ? (
            <Typography variant="caption" className={styles.pending}>
              <span className={styles.sendingDot}></span>
              <span className={styles.sendingDot}></span>
              <span className={styles.sendingDot}></span>
            </Typography>
          ) : isRead ? (
            <DoneAllIcon className={styles.readIcon} fontSize="small" />
          ) : (
            <DoneIcon className={styles.deliveredIcon} fontSize="small" />
          )}
          
          {isRead && readAt && (
            <Typography variant="caption" className={styles.timestamp}>
              {formattedTime}
            </Typography>
          )}
        </div>
      </Tooltip>
    </div>
  );
};

ReadReceipt.propTypes = {
  isRead: PropTypes.bool,
  readAt: PropTypes.string,
  isSent: PropTypes.bool,
  alignRight: PropTypes.bool
};

ReadReceipt.defaultProps = {
  isRead: false,
  isSent: true,
  alignRight: false
};

export default ReadReceipt;