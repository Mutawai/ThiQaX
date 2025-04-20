// src/components/documents/ExpirationNotice/ExpirationNotice.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography, Tooltip } from '@mui/material';
import { 
  Warning, 
  AccessTime, 
  CalendarMonth, 
  Error, 
  CheckCircle 
} from '@mui/icons-material';
import styles from './ExpirationNotice.module.css';

/**
 * Displays notifications for documents that are expired or about to expire
 */
const ExpirationNotice = ({ 
  expiryDate,
  verificationStatus,
  warningThreshold = 30,
  criticalThreshold = 7,
  showLabel = true,
  variant = 'default',
  className = '',
  compact = false,
  onClick
}) => {
  const { daysRemaining, expiryStatus } = useMemo(() => {
    if (!expiryDate) {
      return { 
        daysRemaining: null, 
        expiryStatus: 'no-expiry' 
      };
    }

    const today = new Date();
    const expiry = new Date(expiryDate);
    const timeDiff = expiry - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    let status;
    if (daysDiff < 0 || verificationStatus === 'EXPIRED' || verificationStatus === 'expired') {
      status = 'expired';
    } else if (daysDiff <= criticalThreshold) {
      status = 'critical';
    } else if (daysDiff <= warningThreshold) {
      status = 'warning';
    } else {
      status = 'valid';
    }

    return { 
      daysRemaining: daysDiff < 0 ? 0 : daysDiff, 
      expiryStatus: status 
    };
  }, [expiryDate, verificationStatus, warningThreshold, criticalThreshold]);

  // If there's no expiry date and we're not showing "no expiry" notices
  if (!expiryDate && !showLabel) {
    return null;
  }

  const getNoticeConfig = () => {
    switch (expiryStatus) {
      case 'expired':
        return {
          icon: <Error fontSize="small" />,
          color: 'error.main',
          backgroundColor: 'error.light',
          label: 'Expired',
          message: 'This document has expired'
        };
      case 'critical':
        return {
          icon: <Warning fontSize="small" />,
          color: 'error.dark',
          backgroundColor: 'error.lighter',
          label: 'Expiring Soon',
          message: `Expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`
        };
      case 'warning':
        return {
          icon: <AccessTime fontSize="small" />,
          color: 'warning.dark',
          backgroundColor: 'warning.lighter',
          label: 'Expiration Approaching',
          message: `Expires in ${daysRemaining} days`
        };
      case 'valid':
        return {
          icon: <CheckCircle fontSize="small" />,
          color: 'success.main',
          backgroundColor: 'success.lighter',
          label: 'Valid',
          message: `Valid for ${daysRemaining} more days`
        };
      case 'no-expiry':
      default:
        return {
          icon: <CalendarMonth fontSize="small" />,
          color: 'primary.main',
          backgroundColor: 'primary.lighter',
          label: 'No Expiry Date',
          message: 'This document does not have an expiration date'
        };
    }
  };

  const { icon, color, backgroundColor, label, message } = getNoticeConfig();

  // Render compact version (icon only with tooltip)
  if (compact) {
    return (
      <Tooltip title={`${label}: ${message}`} arrow>
        <Box
          className={`${styles.compactNotice} ${className}`}
          sx={{
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: onClick ? 'pointer' : 'default'
          }}
          onClick={onClick}
        >
          {icon}
        </Box>
      </Tooltip>
    );
  }

  // Render banner variant
  if (variant === 'banner') {
    return (
      <Box
        className={`${styles.bannerNotice} ${className}`}
        sx={{
          bgcolor: backgroundColor,
          color,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 1,
          mb: 2,
          cursor: onClick ? 'pointer' : 'default'
        }}
        onClick={onClick}
      >
        <Box sx={{ mr: 1.5 }}>{icon}</Box>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            {label}
          </Typography>
          <Typography variant="body2">
            {message}
            {expiryDate && ` (${new Date(expiryDate).toLocaleDateString()})`}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Render default chip-like variant
  return (
    <Paper
      elevation={0}
      className={`${styles.notice} ${className}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        bgcolor: backgroundColor,
        color,
        px: 1,
        py: 0.5,
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
      {showLabel && (
        <Typography variant="caption" fontWeight="medium">
          {label}
        </Typography>
      )}
    </Paper>
  );
};

ExpirationNotice.propTypes = {
  /** Expiration date of the document (ISO string) */
  expiryDate: PropTypes.string,
  /** Current verification status of the document */
  verificationStatus: PropTypes.string,
  /** Number of days before expiration to show warning */
  warningThreshold: PropTypes.number,
  /** Number of days before expiration to show critical warning */
  criticalThreshold: PropTypes.number,
  /** Whether to show the label text or just icon */
  showLabel: PropTypes.bool,
  /** Visual style variant */
  variant: PropTypes.oneOf(['default', 'banner']),
  /** Additional CSS class */
  className: PropTypes.string,
  /** Show compact version (icon only with tooltip) */
  compact: PropTypes.bool,
  /** Click handler for the notice */
  onClick: PropTypes.func
};

export default ExpirationNotice;