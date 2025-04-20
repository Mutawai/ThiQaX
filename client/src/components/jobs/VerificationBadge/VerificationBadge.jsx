// src/components/jobs/VerificationBadge/VerificationBadge.jsx
import React from 'react';
import {
  Tooltip,
  Avatar,
  Box,
  Badge,
  useTheme
} from '@mui/material';
import {
  VerifiedUser as VerifiedIcon
} from '@mui/icons-material';
import styles from './VerificationBadge.module.css';

/**
 * Component to display verification status badge for jobs, companies, and other entities
 *
 * @param {Object} props Component props
 * @param {string} props.type Type of verification: 'job', 'company', 'sponsor' (default: 'job')
 * @param {string} props.size Badge size: 'small', 'medium', 'large' (default: 'medium')
 * @param {string|boolean} props.tooltip Custom tooltip text (or false to disable tooltip)
 * @param {boolean} props.standalone Show badge standalone vs. as an addon to another element
 * @param {string} props.color Custom color for badge (default: theme primary color)
 * @param {JSX.Element} props.children Content to display verification badge with
 */
const VerificationBadge = ({
  type = 'job',
  size = 'medium',
  tooltip,
  standalone = false,
  color,
  children
}) => {
  const theme = useTheme();
  
  // Determine the appropriate tooltip text based on type
  const getTooltipText = () => {
    if (tooltip === false) return null;
    if (tooltip) return tooltip;
    
    switch (type) {
      case 'job':
        return 'This job posting has been verified and is legitimate';
      case 'company':
        return 'This company has been verified and is legitimate';
      case 'sponsor':
        return 'This sponsor has been verified and is legitimate';
      default:
        return 'Verified';
    }
  };
  
  // Size configuration
  const sizeConfig = {
    small: {
      iconSize: 'small',
      avatarSize: 16,
      badgeSize: 14
    },
    medium: {
      iconSize: 'medium',
      avatarSize: 20, 
      badgeSize: 18
    },
    large: {
      iconSize: 'large',
      avatarSize: 24,
      badgeSize: 22
    }
  };
  
  const { iconSize, avatarSize, badgeSize } = sizeConfig[size] || sizeConfig.medium;
  
  // Badge color (use provided color or theme primary)
  const badgeColor = color || theme.palette.primary.main;
  
  // Standalone badge (just the verification icon)
  if (standalone) {
    const tooltipText = getTooltipText();
    
    return tooltipText ? (
      <Tooltip title={tooltipText} arrow>
        <Avatar 
          className={styles.standaloneVerificationBadge}
          sx={{ 
            width: avatarSize, 
            height: avatarSize, 
            bgcolor: badgeColor,
            '& .MuiSvgIcon-root': {
              fontSize: `${badgeSize * 0.75}px`
            }
          }}
        >
          <VerifiedIcon fontSize={iconSize} className={styles.verificationIcon} />
        </Avatar>
      </Tooltip>
    ) : (
      <Avatar 
        className={styles.standaloneVerificationBadge}
        sx={{ 
          width: avatarSize, 
          height: avatarSize, 
          bgcolor: badgeColor,
          '& .MuiSvgIcon-root': {
            fontSize: `${badgeSize * 0.75}px`
          }
        }}
      >
        <VerifiedIcon fontSize={iconSize} className={styles.verificationIcon} />
      </Avatar>
    );
  }
  
  // Badge with children
  if (children) {
    const tooltipText = getTooltipText();
    const badge = (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <Avatar 
            className={styles.verificationBadge}
            sx={{ 
              width: badgeSize, 
              height: badgeSize, 
              bgcolor: badgeColor,
              '& .MuiSvgIcon-root': {
                fontSize: `${badgeSize * 0.75}px`
              }
            }}
          >
            <VerifiedIcon className={styles.verificationIcon} />
          </Avatar>
        }
      >
        {children}
      </Badge>
    );
    
    return tooltipText ? (
      <Tooltip title={tooltipText} arrow>
        {badge}
      </Tooltip>
    ) : badge;
  }
  
  // Default - just render a small verification icon with tooltip
  const tooltipText = getTooltipText();
  const verificationIcon = (
    <VerifiedIcon 
      fontSize={iconSize} 
      color="primary" 
      className={styles.inlineVerificationIcon}
      sx={{ color: badgeColor }}
    />
  );
  
  return tooltipText ? (
    <Tooltip title={tooltipText} arrow>
      {verificationIcon}
    </Tooltip>
  ) : verificationIcon;
};

export default VerificationBadge;