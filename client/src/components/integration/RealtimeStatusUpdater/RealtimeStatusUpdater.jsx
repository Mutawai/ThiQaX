// client/src/components/integration/RealtimeStatusUpdater/RealtimeStatusUpdater.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Badge,
  Tooltip,
  Collapse,
  LinearProgress,
  Alert,
  Switch,
  FormControlLabel,
  Button,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
  Sync as SyncIcon,
  SyncProblem as SyncProblemIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { initializeSocket, disconnectSocket } from '../../../services/websocket';
import styles from './RealtimeStatusUpdater.module.css';

/**
 * RealtimeStatusUpdater Component
 * 
 * Manages real-time status updates across platform entities
 * Handles WebSocket connections and live status synchronization
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.autoConnect - Whether to auto-connect on mount
 * @param {Array} props.watchedEntities - Entities to watch for updates
 * @param {Function} props.onStatusUpdate - Callback for status updates
 * @param {boolean} props.showConnectionStatus - Whether to show connection indicator
 */
const RealtimeStatusUpdater = ({
  autoConnect = true,
  watchedEntities = [],
  onStatusUpdate,
  showConnectionStatus = true
}) => {
  const dispatch = useDispatch();
  
  // Local state
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [entityStatuses, setEntityStatuses] = useState({});
  const [updateQueue, setUpdateQueue] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [syncProgress, setSyncProgress] = useState(0);
  
  // Refs
  const socketRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const queueProcessorRef = useRef(null);
  
  // Redux state
  const { user, token } = useSelector(state => state.auth);
  const { notifications } = useSelector(state => state.notifications);
  
  // Entity type configurations
  const entityTypes = {
    APPLICATION: {
      label: 'Applications',
      color: '#2196f3',
      statuses: ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'ACCEPTED', 'REJECTED']
    },
    DOCUMENT: {
      label: 'Documents',
      color: '#ff9800',
      statuses: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED']
    },
    JOB: {
      label: 'Jobs',
      color: '#4caf50',
      statuses: ['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED']
    },
    PAYMENT: {
      label: 'Payments',
      color: '#9c27b0',
      statuses: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']
    }
  };
  
  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!token || socketRef.current) return;
    
    setConnectionStatus('CONNECTING');
    
    try {
      const socket = initializeSocket(token);
      socketRef.current = socket;
      
      // Connection events
      socket.on('connect', () => {
        setConnectionStatus('CONNECTED');
        setRetryCount(0);
        
        // Subscribe to entity updates
        watchedEntities.forEach(entity => {
          socket.emit('subscribe', { entityType: entity.type, entityId: entity.id });
        });
      });
      
      socket.on('disconnect', (reason) => {
        setConnectionStatus('DISCONNECTED');
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          setTimeout(connectWebSocket, 1000);
        }
      });
      
      socket.on('connect_error', (error) => {
        setConnectionStatus('ERROR');
        handleRetry();
      });
      
      // Status update events
      socket.on('status_update', handleStatusUpdate);
      socket.on('entity_update', handleEntityUpdate);
      socket.on('batch_update', handleBatchUpdate);
      
    } catch (error) {
      setConnectionStatus('ERROR');
      handleRetry();
    }
  }, [token, watchedEntities]);
  
  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionStatus('DISCONNECTED');
  }, []);
  
  // Handle connection retry
  const handleRetry = useCallback(() => {
    if (retryCount >= 5) {
      setConnectionStatus('FAILED');
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    setRetryCount(prev => prev + 1);
    
    retryTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, delay);
  }, [retryCount, connectWebSocket]);
  
  // Handle status updates
  const handleStatusUpdate = useCallback((data) => {
    if (paused) return;
    
    const { entityType, entityId, status, timestamp, metadata } = data;
    
    setEntityStatuses(prev => ({
      ...prev,
      [`${entityType}:${entityId}`]: {
        type: entityType,
        id: entityId,
        status,
        timestamp,
        metadata,
        previous: prev[`${entityType}:${entityId}`]?.status
      }
    }));
    
    // Add to update queue for batch processing
    setUpdateQueue(prev => [...prev, data]);
    setLastUpdate(new Date().toISOString());
    
    // Call callback if provided
    if (onStatusUpdate) {
      onStatusUpdate(data);
    }
  }, [paused, onStatusUpdate]);
  
  // Handle entity updates
  const handleEntityUpdate = useCallback((data) => {
    handleStatusUpdate(data);
  }, [handleStatusUpdate]);
  
  // Handle batch updates
  const handleBatchUpdate = useCallback((updates) => {
    if (paused) return;
    
    setSyncProgress(0);
    
    updates.forEach((update, index) => {
      setTimeout(() => {
        handleStatusUpdate(update);
        setSyncProgress(((index + 1) / updates.length) * 100);
      }, index * 50);
    });
  }, [paused, handleStatusUpdate]);
  
  // Process update queue
  useEffect(() => {
    if (updateQueue.length === 0) return;
    
    queueProcessorRef.current = setTimeout(() => {
      setUpdateQueue([]);
    }, 5000);
    
    return () => {
      if (queueProcessorRef.current) {
        clearTimeout(queueProcessorRef.current);
      }
    };
  }, [updateQueue]);
  
  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && user) {
      connectWebSocket();
    }
    
    return () => {
      disconnectWebSocket();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [autoConnect, user, connectWebSocket, disconnectWebSocket]);
  
  // Get connection status info
  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return {
          icon: ConnectedIcon,
          color: '#4caf50',
          label: 'Connected',
          description: 'Real-time updates active'
        };
      case 'CONNECTING':
        return {
          icon: SyncIcon,
          color: '#ff9800',
          label: 'Connecting',
          description: 'Establishing connection'
        };
      case 'DISCONNECTED':
        return {
          icon: DisconnectedIcon,
          color: '#757575',
          label: 'Disconnected',
          description: 'Real-time updates inactive'
        };
      case 'ERROR':
        return {
          icon: SyncProblemIcon,
          color: '#f44336',
          label: 'Connection Error',
          description: `Retry attempt ${retryCount}/5`
        };
      case 'FAILED':
        return {
          icon: ErrorIcon,
          color: '#f44336',
          label: 'Connection Failed',
          description: 'Manual retry required'
        };
      default:
        return {
          icon: DisconnectedIcon,
          color: '#757575',
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };
  
  // Get status chip color
  const getStatusChipColor = (status, entityType) => {
    const successStatuses = ['VERIFIED', 'COMPLETED', 'ACCEPTED', 'PUBLISHED'];
    const errorStatuses = ['REJECTED', 'FAILED', 'CANCELLED'];
    const warningStatuses = ['PENDING', 'UNDER_REVIEW', 'PROCESSING'];
    
    if (successStatuses.includes(status)) return 'success';
    if (errorStatuses.includes(status)) return 'error';
    if (warningStatuses.includes(status)) return 'warning';
    return 'default';
  };
  
  // Toggle pause/resume
  const handleTogglePause = () => {
    setPaused(!paused);
  };
  
  // Manual refresh
  const handleManualRefresh = () => {
    if (socketRef.current && connectionStatus === 'CONNECTED') {
      socketRef.current.emit('refresh_status', { entities: watchedEntities });
    } else {
      connectWebSocket();
    }
  };
  
  const statusInfo = getConnectionStatusInfo();
  const StatusIcon = statusInfo.icon;
  const recentUpdates = Object.values(entityStatuses)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);
  
  return (
    <Paper className={styles.container}>
      {/* Header */}
      <Box className={styles.header}>
        <Box display="flex" alignItems="center" gap={2}>
          <Badge
            badgeContent={updateQueue.length}
            color="primary"
            max={99}
            className={styles.badge}
          >
            <NotificationsIcon />
          </Badge>
          
          <Typography variant="h6">Real-time Status</Typography>
          
          {showConnectionStatus && (
            <Tooltip title={statusInfo.description}>
              <Chip
                icon={<StatusIcon className={styles.connectionIcon} />}
                label={statusInfo.label}
                size="small"
                style={{ color: statusInfo.color }}
                className={styles.statusChip}
              />
            </Tooltip>
          )}
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <FormControlLabel
            control={
              <Switch
                checked={!paused}
                onChange={handleTogglePause}
                size="small"
              />
            }
            label=""
          />
          
          <Tooltip title={paused ? 'Resume updates' : 'Pause updates'}>
            <IconButton size="small" onClick={handleTogglePause}>
              {paused ? <PlayIcon /> : <PauseIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={handleManualRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <IconButton 
            size="small" 
            onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
          >
            <SettingsIcon />
          </IconButton>
          
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>
      
      {/* Sync Progress */}
      {syncProgress > 0 && syncProgress < 100 && (
        <LinearProgress
          variant="determinate"
          value={syncProgress}
          className={styles.syncProgress}
        />
      )}
      
      {/* Connection Error Alert */}
      {connectionStatus === 'ERROR' && (
        <Alert
          severity="warning"
          action={
            <Button size="small" onClick={connectWebSocket}>
              Retry
            </Button>
          }
          className={styles.errorAlert}
        >
          Connection lost. Retrying... ({retryCount}/5)
        </Alert>
      )}
      
      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box className={styles.content}>
          {/* Recent Updates */}
          {recentUpdates.length > 0 && (
            <Box className={styles.section}>
              <Typography variant="subtitle2" gutterBottom>
                Recent Updates
              </Typography>
              <List dense>
                {recentUpdates.map((update) => {
                  const entityConfig = entityTypes[update.type];
                  
                  return (
                    <ListItem key={`${update.type}:${update.id}`} className={styles.updateItem}>
                      <ListItemIcon>
                        <Box
                          className={styles.typeIndicator}
                          style={{ backgroundColor: entityConfig?.color }}
                        />
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">
                              {entityConfig?.label} #{update.id}
                            </Typography>
                            <Chip
                              label={update.status}
                              size="small"
                              color={getStatusChipColor(update.status, update.type)}
                            />
                            {update.previous && update.previous !== update.status && (
                              <Typography variant="caption" color="text.secondary">
                                from {update.previous}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
          
          {/* Statistics */}
          <Box className={styles.section}>
            <Typography variant="subtitle2" gutterBottom>
              Statistics
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Chip
                label={`${Object.keys(entityStatuses).length} Entities`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${updateQueue.length} Pending`}
                size="small"
                variant="outlined"
              />
              {lastUpdate && (
                <Chip
                  label={`Last: ${formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>
        
        <Divider />
      </Collapse>
      
      {/* Settings Menu */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={() => setSettingsMenuAnchor(null)}
      >
        <MenuItem onClick={connectWebSocket} disabled={connectionStatus === 'CONNECTED'}>
          Connect
        </MenuItem>
        <MenuItem onClick={disconnectWebSocket} disabled={connectionStatus === 'DISCONNECTED'}>
          Disconnect
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setUpdateQueue([])}>
          Clear Queue
        </MenuItem>
        <MenuItem onClick={() => setEntityStatuses({})}>
          Clear History
        </MenuItem>
      </Menu>
    </Paper>
  );
};

RealtimeStatusUpdater.propTypes = {
  autoConnect: PropTypes.bool,
  watchedEntities: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired
    })
  ),
  onStatusUpdate: PropTypes.func,
  showConnectionStatus: PropTypes.bool
};

export default RealtimeStatusUpdater;