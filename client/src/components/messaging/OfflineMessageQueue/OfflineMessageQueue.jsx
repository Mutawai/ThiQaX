// client/src/components/messaging/OfflineMessageQueue/OfflineMessageQueue.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Paper,
  Collapse,
  Badge,
  Tooltip,
  LinearProgress,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  SignalWifiOff as OfflineIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SignalWifi4Bar as OnlineIcon,
  ErrorOutline as ErrorIcon,
  CheckCircleOutline as SuccessIcon,
  WifiTetheringError as RetryIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';
import styles from './OfflineMessageQueue.module.css';

/**
 * OfflineMessageQueue Component
 * 
 * Manages and displays messages that are queued for sending when offline
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOnline - Current online status
 * @param {Array} props.queuedMessages - Array of messages waiting to be sent
 * @param {Function} props.onRetryAll - Callback to retry sending all messages
 * @param {Function} props.onRetryMessage - Callback to retry sending a specific message
 * @param {Function} props.onDeleteMessage - Callback to delete a specific message
 * @param {Function} props.onClearQueue - Callback to clear the entire queue
 */
const OfflineMessageQueue = ({ 
  isOnline = navigator.onLine,
  queuedMessages = [],
  onRetryAll,
  onRetryMessage,
  onDeleteMessage,
  onClearQueue
}) => {
  const [expanded, setExpanded] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [currentRetryId, setCurrentRetryId] = useState(null);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Retry all messages
  const handleRetryAll = async () => {
    if (!isOnline || !onRetryAll) return;
    
    setRetrying(true);
    
    try {
      await onRetryAll();
    } catch (error) {
      console.error('Failed to retry all messages:', error);
    } finally {
      setRetrying(false);
    }
  };
  
  // Retry a specific message
  const handleRetryMessage = async (messageId) => {
    if (!isOnline || !onRetryMessage) return;
    
    setCurrentRetryId(messageId);
    
    try {
      await onRetryMessage(messageId);
    } catch (error) {
      console.error(`Failed to retry message ${messageId}:`, error);
    } finally {
      setCurrentRetryId(null);
    }
  };
  
  // Delete a specific message
  const handleDeleteMessage = (messageId) => {
    if (onDeleteMessage) {
      onDeleteMessage(messageId);
    }
  };
  
  // Clear the queue
  const handleClearQueue = () => {
    if (onClearQueue) {
      onClearQueue();
    }
  };
  
  // Format message preview
  const formatMessagePreview = (message) => {
    if (!message.content) return '';
    
    const maxLength = 30;
    
    if (message.attachments && message.attachments.length > 0) {
      const attachmentText = message.attachments.length === 1 
        ? '1 attachment' 
        : `${message.attachments.length} attachments`;
        
      return message.content.length > 0
        ? `${message.content.substring(0, maxLength)}${message.content.length > maxLength ? '...' : ''} (${attachmentText})`
        : attachmentText;
    }
    
    return message.content.length > maxLength
      ? `${message.content.substring(0, maxLength)}...`
      : message.content;
  };
  
  // Format status
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: <PendingIcon className={styles.pendingIcon} />,
          text: 'Pending',
          className: styles.pendingText
        };
      case 'failed':
        return {
          icon: <ErrorIcon className={styles.errorIcon} />,
          text: 'Failed',
          className: styles.errorText
        };
      case 'sending':
        return {
          icon: <CircularProgress size={16} className={styles.sendingIcon} />,
          text: 'Sending',
          className: styles.sendingText
        };
      default:
        return {
          icon: <PendingIcon className={styles.pendingIcon} />,
          text: 'Queued',
          className: styles.pendingText
        };
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // No messages in queue
  if (queuedMessages.length === 0) {
    return null;
  }
  
  return (
    <Paper elevation={1} className={styles.container}>
      {/* Header */}
      <Box 
        className={styles.header}
        onClick={toggleExpanded}
      >
        <Box className={styles.headerContent}>
          <Badge 
            badgeContent={queuedMessages.length} 
            color="error"
            max={99}
          >
            {isOnline ? (
              <OnlineIcon className={styles.onlineIcon} />
            ) : (
              <OfflineIcon className={styles.offlineIcon} />
            )}
          </Badge>
          
          <Typography variant="body2" className={styles.headerText}>
            {isOnline 
              ? `${queuedMessages.length} message${queuedMessages.length !== 1 ? 's' : ''} waiting to be sent`
              : `You're offline. ${queuedMessages.length} message${queuedMessages.length !== 1 ? 's' : ''} will be sent when online.`
            }
          </Typography>
        </Box>
        
        <IconButton 
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
          aria-expanded={expanded}
          aria-label={expanded ? "Show less" : "Show more"}
          className={styles.expandButton}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      {/* Queue Details */}
      <Collapse in={expanded}>
        <Divider />
        
        {/* Action Buttons */}
        {isOnline && (
          <Box className={styles.actionsContainer}>
            <Button
              startIcon={<SyncIcon />}
              onClick={handleRetryAll}
              disabled={retrying || queuedMessages.length === 0}
              size="small"
              variant="outlined"
              className={styles.retryButton}
            >
              {retrying ? 'Sending...' : 'Retry All'}
            </Button>
            
            <Button
              startIcon={<DeleteIcon />}
              onClick={handleClearQueue}
              disabled={queuedMessages.length === 0}
              size="small"
              variant="outlined"
              color="error"
              className={styles.clearButton}
            >
              Clear Queue
            </Button>
          </Box>
        )}
        
        {retrying && (
          <LinearProgress className={styles.progressBar} />
        )}
        
        {/* Messages List */}
        <List className={styles.messageList}>
          {queuedMessages.map((message) => {
            const statusInfo = getStatusInfo(message.status);
            
            return (
              <ListItem
                key={message.id}
                disableGutters
                className={styles.messageItem}
              >
                <ListItemText
                  primary={formatMessagePreview(message)}
                  secondary={
                    <Box className={styles.messageDetails}>
                      {statusInfo.icon}
                      <Typography 
                        variant="caption" 
                        component="span"
                        className={statusInfo.className}
                      >
                        {statusInfo.text}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        component="span"
                        className={styles.timestamp}
                      >
                        {formatTimestamp(message.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  {isOnline && message.status !== 'sending' && (
                    <Tooltip title="Retry sending">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRetryMessage(message.id)}
                        disabled={currentRetryId === message.id}
                        className={styles.actionButton}
                      >
                        {currentRetryId === message.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <RetryIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  <Tooltip title="Delete message">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDeleteMessage(message.id)}
                      disabled={currentRetryId === message.id}
                      className={styles.actionButton}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </Paper>
  );
};

OfflineMessageQueue.propTypes = {
  isOnline: PropTypes.bool,
  queuedMessages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      content: PropTypes.string,
      timestamp: PropTypes.string,
      status: PropTypes.oneOf(['pending', 'failed', 'sending']),
      attachments: PropTypes.array
    })
  ),
  onRetryAll: PropTypes.func,
  onRetryMessage: PropTypes.func,
  onDeleteMessage: PropTypes.func,
  onClearQueue: PropTypes.func
};

export default OfflineMessageQueue;