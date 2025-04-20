// src/components/documents/SecurityWatermark/SecurityWatermark.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { VerifiedUser, Warning, Cancel, PendingActions, Error } from '@mui/icons-material';
import styles from './SecurityWatermark.module.css';

/**
 * A component that overlays a security watermark on document previews
 * to indicate verification status.
 */
const SecurityWatermark = ({ 
  status, 
  opacity = 0.15, 
  showText = true, 
  position = 'center',
  scale = 1,
  customText = '',
  customColor = '',
  className = ''
}) => {
  const getWatermarkConfig = () => {
    switch (status) {
      case 'VERIFIED':
      case 'verified':
        return {
          icon: <VerifiedUser fontSize="inherit" />,
          text: customText || 'VERIFIED',
          color: customColor || 'success.main'
        };
      case 'PENDING':
      case 'pending':
        return {
          icon: <PendingActions fontSize="inherit" />,
          text: customText || 'PENDING VERIFICATION',
          color: customColor || 'info.main'
        };
      case 'REJECTED':
      case 'rejected':
        return {
          icon: <Cancel fontSize="inherit" />,
          text: customText || 'REJECTED',
          color: customColor || 'error.main'
        };
      case 'EXPIRED':
      case 'expired':
        return {
          icon: <Error fontSize="inherit" />,
          text: customText || 'EXPIRED',
          color: customColor || 'error.dark'
        };
      case 'UNDER_REVIEW':
      case 'underReview':
        return {
          icon: <Warning fontSize="inherit" />,
          text: customText || 'UNDER REVIEW',
          color: customColor || 'warning.main'
        };
      default:
        return {
          icon: <PendingActions fontSize="inherit" />,
          text: customText || 'UNVERIFIED',
          color: customColor || 'text.disabled'
        };
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: '10%', left: '10%', transform: 'translate(-10%, -10%) rotate(-45deg)' };
      case 'top-right':
        return { top: '10%', right: '10%', transform: 'translate(10%, -10%) rotate(45deg)' };
      case 'bottom-left':
        return { bottom: '10%', left: '10%', transform: 'translate(-10%, 10%) rotate(45deg)' };
      case 'bottom-right':
        return { bottom: '10%', right: '10%', transform: 'translate(10%, 10%) rotate(-45deg)' };
      case 'center':
      default:
        return { 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%) rotate(-30deg)' 
        };
    }
  };

  const { icon, text, color } = getWatermarkConfig();
  const positionStyles = getPositionStyles();

  return (
    <Box 
      className={`${styles.watermark} ${className}`}
      sx={{
        position: 'absolute',
        zIndex: 10,
        opacity,
        color,
        fontSize: `${6 * scale}rem`,
        ...positionStyles,
        pointerEvents: 'none',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
      }}
      aria-hidden="true"
    >
      {icon}
      {showText && (
        <Typography 
          variant="overline" 
          component="div"
          sx={{ 
            fontSize: `${scale}rem`, 
            fontWeight: 'bold',
            letterSpacing: '0.2em',
            mt: 2
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );
};

SecurityWatermark.propTypes = {
  /** The verification status of the document */
  status: PropTypes.oneOf([
    'VERIFIED', 'PENDING', 'REJECTED', 'EXPIRED', 'UNDER_REVIEW', 'UNVERIFIED',
    'verified', 'pending', 'rejected', 'expired', 'underReview', '' 
  ]).isRequired,
  /** Opacity of the watermark (0-1) */
  opacity: PropTypes.number,
  /** Whether to show text below the icon */
  showText: PropTypes.bool,
  /** Position of the watermark */
  position: PropTypes.oneOf(['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']),
  /** Scale factor for the watermark size */
  scale: PropTypes.number,
  /** Custom text to override default status text */
  customText: PropTypes.string,
  /** Custom color to override default status color */
  customColor: PropTypes.string,
  /** Additional CSS class */
  className: PropTypes.string
};

export default SecurityWatermark;