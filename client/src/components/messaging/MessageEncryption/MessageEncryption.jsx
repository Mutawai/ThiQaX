// client/src/components/messaging/MessageEncryption/MessageEncryption.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Tooltip, 
  IconButton, 
  Collapse,
  Paper
} from '@mui/material';
import {
  LockOutlined as LockIcon,
  InfoOutlined as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircleOutline as CheckCircleIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import styles from './MessageEncryption.module.css';

/**
 * MessageEncryption Component
 * 
 * Displays encryption status and information for messages
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isEncrypted - Whether messages are encrypted
 * @param {string} props.encryptionType - Type of encryption (e.g., 'e2e', 'tls')
 * @param {boolean} props.verificationStatus - Whether encryption is verified
 * @param {boolean} props.expandable - Whether encryption details can be expanded
 */
const MessageEncryption = ({ 
  isEncrypted = true,
  encryptionType = 'e2e',
  verificationStatus = true,
  expandable = true
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpanded = () => {
    if (expandable) {
      setExpanded(!expanded);
    }
  };
  
  // Get encryption method label
  const getEncryptionLabel = () => {
    switch (encryptionType) {
      case 'e2e':
        return 'End-to-End Encrypted';
      case 'tls':
        return 'TLS Encrypted';
      default:
        return 'Encrypted';
    }
  };
  
  // Get verification status label
  const getVerificationLabel = () => {
    if (!isEncrypted) return '';
    
    return verificationStatus
      ? 'Verified'
      : 'Unverified';
  };
  
  // Get status icon
  const getStatusIcon = () => {
    if (!isEncrypted) {
      return <ErrorIcon className={styles.unencryptedIcon} fontSize="small" />;
    }
    
    return verificationStatus 
      ? <CheckCircleIcon className={styles.verifiedIcon} fontSize="small" />
      : <ErrorIcon className={styles.unverifiedIcon} fontSize="small" />;
  };
  
  return (
    <Box className={styles.container}>
      {/* Main indicator */}
      <Paper 
        elevation={0} 
        className={`${styles.indicator} ${expandable ? styles.clickable : ''}`}
        onClick={toggleExpanded}
      >
        <LockIcon 
          fontSize="small" 
          className={isEncrypted ? styles.encryptedIcon : styles.unencryptedIcon} 
        />
        
        <Typography variant="caption" className={styles.label}>
          {isEncrypted ? getEncryptionLabel() : 'Not Encrypted'}
        </Typography>
        
        {getStatusIcon()}
        
        {expandable && (
          <IconButton 
            size="small" 
            className={styles.expandButton}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
            aria-expanded={expanded}
            aria-label={expanded ? "Show less" : "Show more"}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        )}
      </Paper>
      
      {/* Expanded details */}
      {expandable && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Paper elevation={0} className={styles.details}>
            <Box className={styles.detailItem}>
              <Typography variant="caption" className={styles.detailLabel}>
                Encryption Type:
              </Typography>
              <Typography variant="caption" className={styles.detailValue}>
                {encryptionType === 'e2e' ? 'End-to-End (AES-256)' : 'Transport Layer (TLS 1.3)'}
              </Typography>
            </Box>
            
            <Box className={styles.detailItem}>
              <Typography variant="caption" className={styles.detailLabel}>
                Verification Status:
              </Typography>
              <Typography 
                variant="caption" 
                className={`${styles.detailValue} ${
                  verificationStatus ? styles.verifiedText : styles.unverifiedText
                }`}
              >
                {getVerificationLabel()}
              </Typography>
            </Box>
            
            <Box className={styles.detailItem}>
              <Typography variant="caption" className={styles.detailLabel}>
                Key Exchange:
              </Typography>
              <Typography variant="caption" className={styles.detailValue}>
                {encryptionType === 'e2e' ? 'Diffie-Hellman' : 'N/A'}
              </Typography>
            </Box>
            
            <Box className={styles.infoBox}>
              <InfoIcon fontSize="small" className={styles.infoIcon} />
              <Typography variant="caption" className={styles.infoText}>
                {encryptionType === 'e2e' 
                  ? 'Messages are encrypted on your device and can only be read by you and the recipient.' 
                  : 'Messages are encrypted in transit but may be visible to the server.'}
              </Typography>
            </Box>
          </Paper>
        </Collapse>
      )}
    </Box>
  );
};

MessageEncryption.propTypes = {
  isEncrypted: PropTypes.bool,
  encryptionType: PropTypes.oneOf(['e2e', 'tls']),
  verificationStatus: PropTypes.bool,
  expandable: PropTypes.bool
};

export default MessageEncryption;