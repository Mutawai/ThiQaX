// client/src/components/integration/CrossSystemNotifier/CrossSystemNotifier.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Collapse,
  Divider,
  Tooltip,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  PhoneAndroid as MobileIcon,
  Email as EmailIcon,
  DesktopWindows as WebIcon,
  Sms as SmsIcon,
  Settings as SettingsIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Refresh as RetryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import styles from './CrossSystemNotifier.module.css';

/**
 * CrossSystemNotifier Component
 * 
 * Manages cross-platform notification delivery and channel configuration
 * Handles web, mobile, email, and SMS notification channels
 * 
 * @param {Object} props - Component props
 * @param {Array} props.channels - Available notification channels
 * @param {Object} props.preferences - User notification preferences
 * @param {Function} props.onPreferencesUpdate - Callback for preference updates
 * @param {Function} props.onChannelTest - Callback for testing channels
 * @param {boolean} props.showDeliveryStatus - Whether to show delivery status
 */
const CrossSystemNotifier = ({
  channels = [],
  preferences = {},
  onPreferencesUpdate,
  onChannelTest,
  showDeliveryStatus = true
}) => {
  const dispatch = useDispatch();
  
  // Local state
  const [activeChannels, setActiveChannels] = useState({});
  const [deliveryStatus, setDeliveryStatus] = useState({});
  const [channelSettings, setChannelSettings] = useState({});
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [testMessage, setTestMessage] = useState('');
  const [testing, setTesting] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [retryQueue, setRetryQueue] = useState([]);
  
  // Redux state
  const { user } = useSelector(state => state.auth);
  const { notifications } = useSelector(state => state.notifications);
  
  // Default channel configurations
  const defaultChannels = [
    {
      id: 'web_push',
      name: 'Web Push',
      type: 'WEB',
      icon: WebIcon,
      color: '#2196f3',
      enabled: true,
      priority: 1,
      settings: {
        showOnDesktop: true,
        playSound: true,
        vibrate: false
      }
    },
    {
      id: 'mobile_push',
      name: 'Mobile Push',
      type: 'MOBILE',
      icon: MobileIcon,
      color: '#4caf50',
      enabled: true,
      priority: 2,
      settings: {
        showOnLockScreen: true,
        playSound: true,
        vibrate: true
      }
    },
    {
      id: 'email',
      name: 'Email',
      type: 'EMAIL',
      icon: EmailIcon,
      color: '#f44336',
      enabled: true,
      priority: 3,
      settings: {
        digest: false,
        frequency: 'immediate',
        htmlFormat: true
      }
    },
    {
      id: 'sms',
      name: 'SMS',
      type: 'SMS',
      icon: SmsIcon,
      color: '#ff9800',
      enabled: false,
      priority: 4,
      settings: {
        emergencyOnly: true,
        phoneNumber: ''
      }
    }
  ];
  
  // Merge default channels with provided channels
  const allChannels = [...defaultChannels, ...channels];
  
  // Initialize state from preferences
  useEffect(() => {
    const channelStates = {};
    const settings = {};
    
    allChannels.forEach(channel => {
      const pref = preferences[channel.id] || {};
      channelStates[channel.id] = pref.enabled !== undefined ? pref.enabled : channel.enabled;
      settings[channel.id] = { ...channel.settings, ...pref.settings };
    });
    
    setActiveChannels(channelStates);
    setChannelSettings(settings);
  }, [preferences, allChannels]);
  
  // Handle channel toggle
  const handleChannelToggle = useCallback((channelId, enabled) => {
    const newChannels = { ...activeChannels, [channelId]: enabled };
    setActiveChannels(newChannels);
    
    if (onPreferencesUpdate) {
      onPreferencesUpdate({
        ...preferences,
        [channelId]: {
          ...preferences[channelId],
          enabled,
          settings: channelSettings[channelId]
        }
      });
    }
  }, [activeChannels, preferences, channelSettings, onPreferencesUpdate]);
  
  // Handle settings update
  const handleSettingsUpdate = useCallback((channelId, newSettings) => {
    const updatedSettings = { ...channelSettings, [channelId]: newSettings };
    setChannelSettings(updatedSettings);
    
    if (onPreferencesUpdate) {
      onPreferencesUpdate({
        ...preferences,
        [channelId]: {
          ...preferences[channelId],
          enabled: activeChannels[channelId],
          settings: newSettings
        }
      });
    }
  }, [channelSettings, preferences, activeChannels, onPreferencesUpdate]);
  
  // Test notification channel
  const handleTestChannel = async (channel) => {
    if (!onChannelTest) return;
    
    setTesting(true);
    
    try {
      const result = await onChannelTest(channel.id, testMessage || 'Test notification from ThiQaX');
      
      setDeliveryStatus(prev => ({
        ...prev,
        [channel.id]: {
          status: result.success ? 'SUCCESS' : 'FAILED',
          timestamp: new Date().toISOString(),
          message: result.message
        }
      }));
    } catch (error) {
      setDeliveryStatus(prev => ({
        ...prev,
        [channel.id]: {
          status: 'FAILED',
          timestamp: new Date().toISOString(),
          message: error.message
        }
      }));
    } finally {
      setTesting(false);
      setTestDialogOpen(false);
      setTestMessage('');
    }
  };
  
  // Retry failed deliveries
  const handleRetryDelivery = useCallback((channelId) => {
    setRetryQueue(prev => [...prev, channelId]);
    
    // Simulate retry process
    setTimeout(() => {
      setRetryQueue(prev => prev.filter(id => id !== channelId));
      setDeliveryStatus(prev => ({
        ...prev,
        [channelId]: {
          status: Math.random() > 0.3 ? 'SUCCESS' : 'FAILED',
          timestamp: new Date().toISOString(),
          message: 'Retry attempt completed'
        }
      }));
    }, 2000);
  }, []);
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <SuccessIcon className={styles.successIcon} />;
      case 'FAILED':
        return <ErrorIcon className={styles.errorIcon} />;
      case 'PENDING':
        return <PendingIcon className={styles.pendingIcon} />;
      default:
        return null;
    }
  };
  
  // Get delivery statistics
  const getDeliveryStats = () => {
    const stats = { total: 0, success: 0, failed: 0, pending: 0 };
    
    Object.values(deliveryStatus).forEach(status => {
      stats.total++;
      stats[status.status.toLowerCase()]++;
    });
    
    return stats;
  };
  
  const stats = getDeliveryStats();
  
  // Render channel configuration
  const renderChannelConfig = (channel) => (
    <Box className={styles.channelConfig}>
      <Typography variant="subtitle2" gutterBottom>
        {channel.name} Settings
      </Typography>
      
      {channel.type === 'WEB' && (
        <>
          <FormControlLabel
            control={
              <Switch
                checked={channelSettings[channel.id]?.showOnDesktop || false}
                onChange={(e) => handleSettingsUpdate(channel.id, {
                  ...channelSettings[channel.id],
                  showOnDesktop: e.target.checked
                })}
              />
            }
            label="Show on desktop"
          />
          <FormControlLabel
            control={
              <Switch
                checked={channelSettings[channel.id]?.playSound || false}
                onChange={(e) => handleSettingsUpdate(channel.id, {
                  ...channelSettings[channel.id],
                  playSound: e.target.checked
                })}
              />
            }
            label="Play sound"
          />
        </>
      )}
      
      {channel.type === 'EMAIL' && (
        <>
          <TextField
            select
            fullWidth
            size="small"
            label="Frequency"
            value={channelSettings[channel.id]?.frequency || 'immediate'}
            onChange={(e) => handleSettingsUpdate(channel.id, {
              ...channelSettings[channel.id],
              frequency: e.target.value
            })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="immediate">Immediate</MenuItem>
            <MenuItem value="hourly">Hourly digest</MenuItem>
            <MenuItem value="daily">Daily digest</MenuItem>
            <MenuItem value="weekly">Weekly digest</MenuItem>
          </TextField>
          
          <FormControlLabel
            control={
              <Switch
                checked={channelSettings[channel.id]?.htmlFormat || false}
                onChange={(e) => handleSettingsUpdate(channel.id, {
                  ...channelSettings[channel.id],
                  htmlFormat: e.target.checked
                })}
              />
            }
            label="HTML format"
          />
        </>
      )}
      
      {channel.type === 'SMS' && (
        <>
          <TextField
            fullWidth
            size="small"
            label="Phone Number"
            value={channelSettings[channel.id]?.phoneNumber || ''}
            onChange={(e) => handleSettingsUpdate(channel.id, {
              ...channelSettings[channel.id],
              phoneNumber: e.target.value
            })}
            sx={{ mb: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={channelSettings[channel.id]?.emergencyOnly || false}
                onChange={(e) => handleSettingsUpdate(channel.id, {
                  ...channelSettings[channel.id],
                  emergencyOnly: e.target.checked
                })}
              />
            }
            label="Emergency notifications only"
          />
        </>
      )}
    </Box>
  );
  
  return (
    <Paper className={styles.container}>
      {/* Header */}
      <Box className={styles.header}>
        <Box display="flex" alignItems="center" gap={2}>
          <NotificationsIcon />
          <Typography variant="h6">Cross-System Notifications</Typography>
        </Box>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<SettingsIcon />}
          onClick={() => setConfigDialogOpen(true)}
        >
          Configure
        </Button>
      </Box>
      
      {/* Delivery Statistics */}
      {showDeliveryStatus && stats.total > 0 && (
        <Box className={styles.statsContainer}>
          <Typography variant="subtitle2" gutterBottom>
            Delivery Status
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              label={`${stats.success} Delivered`}
              color="success"
              size="small"
              icon={<SuccessIcon />}
            />
            <Chip
              label={`${stats.failed} Failed`}
              color="error"
              size="small"
              icon={<ErrorIcon />}
            />
            <Chip
              label={`${stats.pending} Pending`}
              color="warning"
              size="small"
              icon={<PendingIcon />}
            />
          </Box>
        </Box>
      )}
      
      {/* Channel List */}
      <List className={styles.channelList}>
        {allChannels.map((channel) => {
          const IconComponent = channel.icon;
          const isEnabled = activeChannels[channel.id];
          const status = deliveryStatus[channel.id];
          const isRetrying = retryQueue.includes(channel.id);
          const isExpanded = expanded[channel.id];
          
          return (
            <React.Fragment key={channel.id}>
              <ListItem className={styles.channelItem}>
                <ListItemIcon>
                  <IconComponent style={{ color: channel.color }} />
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2">
                        {channel.name}
                      </Typography>
                      {status && getStatusIcon(status.status)}
                      {isRetrying && (
                        <CircularProgress size={16} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {channel.type} notifications
                      </Typography>
                      {status && (
                        <Typography variant="caption" color="text.secondary">
                          Last: {formatDistanceToNow(new Date(status.timestamp), { addSuffix: true })}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                
                <Box display="flex" alignItems="center" gap={1}>
                  {status?.status === 'FAILED' && (
                    <Tooltip title="Retry delivery">
                      <IconButton
                        size="small"
                        onClick={() => handleRetryDelivery(channel.id)}
                        disabled={isRetrying}
                      >
                        <RetryIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  <Tooltip title="Test channel">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedChannel(channel);
                        setTestDialogOpen(true);
                      }}
                      disabled={!isEnabled}
                    >
                      <SendIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Configure">
                    <IconButton
                      size="small"
                      onClick={() => setExpanded(prev => ({
                        ...prev,
                        [channel.id]: !prev[channel.id]
                      }))}
                    >
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Tooltip>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isEnabled}
                        onChange={(e) => handleChannelToggle(channel.id, e.target.checked)}
                        size="small"
                      />
                    }
                    label=""
                  />
                </Box>
              </ListItem>
              
              <Collapse in={isExpanded}>
                <Box className={styles.configSection}>
                  {renderChannelConfig(channel)}
                </Box>
              </Collapse>
              
              <Divider />
            </React.Fragment>
          );
        })}
      </List>
      
      {/* Test Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Test {selectedChannel?.name} Channel
        </DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Test Message"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter a test message..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleTestChannel(selectedChannel)}
            variant="contained"
            disabled={testing}
            startIcon={testing ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {testing ? 'Testing...' : 'Send Test'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Configuration Dialog */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Notification Channel Configuration
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Configure your notification preferences for different channels. 
            Channels are tried in priority order for delivery.
          </Alert>
          
          {allChannels.map((channel) => (
            <Paper key={channel.id} sx={{ p: 2, mb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <channel.icon style={{ color: channel.color }} />
                  <Typography variant="h6">{channel.name}</Typography>
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={activeChannels[channel.id]}
                      onChange={(e) => handleChannelToggle(channel.id, e.target.checked)}
                    />
                  }
                  label="Enabled"
                />
              </Box>
              
              {renderChannelConfig(channel)}
            </Paper>
          ))}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

CrossSystemNotifier.propTypes = {
  channels: PropTypes.array,
  preferences: PropTypes.object,
  onPreferencesUpdate: PropTypes.func,
  onChannelTest: PropTypes.func,
  showDeliveryStatus: PropTypes.bool
};

export default CrossSystemNotifier;