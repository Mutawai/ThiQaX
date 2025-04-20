// src/components/documents/VerificationHistoryLog/VerificationHistoryLog.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Collapse,
  Button,
  Tooltip,
  Chip,
  Paper
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  PendingActions,
  UploadFile,
  ReviewsOutlined,
  AccessTime,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Person
} from '@mui/icons-material';
import styles from './VerificationHistoryLog.module.css';

/**
 * Displays a timeline of document verification status changes
 */
const VerificationHistoryLog = ({ 
  history = [], 
  maxVisible = 3,
  showUserInfo = true,
  compact = false,
  className = '',
  emptyMessage = 'No verification history available' 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpanded = () => {
    setExpanded(prev => !prev);
  };

  const visibleHistory = useMemo(() => {
    if (!history || !history.length) return [];
    
    const sortedHistory = [...history].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    return expanded ? sortedHistory : sortedHistory.slice(0, maxVisible);
  }, [history, expanded, maxVisible]);

  const needsExpansion = history.length > maxVisible;

  const getStatusIcon = (status) => {
    const iconProps = { 
      fontSize: compact ? 'small' : 'medium' 
    };
    
    switch (status?.toLowerCase()) {
      case 'verified':
        return <CheckCircle color="success" {...iconProps} />;
      case 'rejected':
        return <Cancel color="error" {...iconProps} />;
      case 'pending':
        return <PendingActions color="warning" {...iconProps} />;
      case 'uploaded':
        return <UploadFile color="primary" {...iconProps} />;
      case 'underreview':
      case 'under_review':
        return <ReviewsOutlined color="info" {...iconProps} />;
      case 'expired':
        return <AccessTime color="error" {...iconProps} />;
      default:
        return <PendingActions color="action" {...iconProps} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      case 'uploaded':
        return 'primary';
      case 'underreview':
      case 'under_review':
        return 'info';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    if (compact) {
      return date.toLocaleDateString();
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // If no history is available
  if (!history || history.length === 0) {
    return (
      <Paper 
        elevation={0} 
        className={`${styles.emptyState} ${className}`}
        sx={{ 
          p: 2, 
          bgcolor: 'background.default',
          borderRadius: 1,
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box className={`${styles.historyLog} ${className}`}>
      <Timeline 
        position={compact ? "right" : "alternate"}
        sx={{
          p: compact ? 0 : 2,
          m: 0,
          [`& .MuiTimelineItem-root`]: {
            minHeight: compact ? 'auto' : '70px',
          }
        }}
      >
        {visibleHistory.map((entry, index) => (
          <TimelineItem key={`${entry.timestamp}-${index}`} sx={{ my: compact ? 0 : 1 }}>
            {!compact && (
              <TimelineOppositeContent sx={{ m: 'auto 0' }}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(entry.timestamp)}
                </Typography>
              </TimelineOppositeContent>
            )}
            
            <TimelineSeparator>
              <TimelineDot 
                color={getStatusColor(entry.status)}
                variant={index === 0 ? "filled" : "outlined"}
              >
                {getStatusIcon(entry.status)}
              </TimelineDot>
              {index < visibleHistory.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            
            <TimelineContent sx={{ py: '12px', px: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography 
                  variant={compact ? "body2" : "subtitle2"} 
                  component="span"
                >
                  {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                </Typography>
                
                {compact && (
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(entry.timestamp)}
                  </Typography>
                )}
                
                {showUserInfo && entry.performedBy && (
                  <Chip
                    icon={<Person fontSize="small" />}
                    label={entry.performedByName || `User ${entry.performedBy.substring(0, 8)}...`}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              
              {entry.notes && (
                <Tooltip title={entry.notes} placement="top" arrow>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {entry.notes}
                  </Typography>
                </Tooltip>
              )}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
      
      {needsExpansion && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: 1 
          }}
        >
          <Button
            size="small"
            onClick={toggleExpanded}
            endIcon={expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            sx={{ textTransform: 'none' }}
          >
            {expanded ? 'Show Less' : `Show ${history.length - maxVisible} More`}
          </Button>
        </Box>
      )}
    </Box>
  );
};

VerificationHistoryLog.propTypes = {
  /** Array of history entries with status, timestamp, performedBy, and notes */
  history: PropTypes.arrayOf(
    PropTypes.shape({
      status: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      performedBy: PropTypes.string,
      performedByName: PropTypes.string,
      notes: PropTypes.string
    })
  ),
  /** Maximum number of visible history items when collapsed */
  maxVisible: PropTypes.number,
  /** Whether to show user information */
  showUserInfo: PropTypes.bool,
  /** Whether to use compact layout */
  compact: PropTypes.bool,
  /** Additional CSS class */
  className: PropTypes.string,
  /** Message to display when history is empty */
  emptyMessage: PropTypes.string
};

export default VerificationHistoryLog;