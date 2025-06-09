// client/src/components/integration/MobileWebSyncHandler/MobileWebSyncHandler.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  LinearProgress,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  Badge,
  Collapse,
  Menu,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon,
  CloudDone as SyncedIcon,
  CloudOff as OfflineIcon,
  Smartphone as MobileIcon,
  Computer as WebIcon,
  Warning as ConflictIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Schedule as PendingIcon,
  Storage as DataIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import styles from './MobileWebSyncHandler.module.css';

/**
 * MobileWebSyncHandler Component
 * 
 * Manages synchronization between mobile and web platforms
 * Handles offline data, sync conflicts, and cross-device continuity
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.autoSync - Whether to auto-sync when online
 * @param {number} props.syncInterval - Sync interval in milliseconds
 * @param {Function} props.onSyncComplete - Callback when sync completes
 * @param {Function} props.onConflict - Callback for sync conflicts
 * @param {boolean} props.showProgress - Whether to show sync progress
 */
const MobileWebSyncHandler = ({
  autoSync = true,
  syncInterval = 30000,
  onSyncComplete,
  onConflict,
  showProgress = true
}) => {
  const dispatch = useDispatch();
  
  // Local state
  const [syncStatus, setSyncStatus] = useState('IDLE');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [syncQueue, setSyncQueue] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: 30000,
    syncOnFocus: true,
    conflictResolution: 'manual'
  });
  const [deviceInfo, setDeviceInfo] = useState({
    current: 'WEB',
    lastMobile: null,
    lastWeb: null
  });
  
  // Refs
  const syncIntervalRef = useRef(null);
  const syncTimeoutRef = useRef(null);
  
  // Redux state
  const { user } = useSelector(state => state.auth);
  const { profile } = useSelector(state => state.profile);
  const { applications } = useSelector(state => state.applications);
  const { documents } = useSelector(state => state.documents);
  
  // Sync data types
  const syncDataTypes = [
    {
      type: 'PROFILE',
      label: 'Profile Data',
      icon: DataIcon,
      priority: 1,
      enabled: true
    },
    {
      type: 'APPLICATIONS',
      label: 'Applications',
      icon: DataIcon,
      priority: 2,
      enabled: true
    },
    {
      type: 'DOCUMENTS',
      label: 'Documents',
      icon: DataIcon,
      priority: 3,
      enabled: true
    },
    {
      type: 'PREFERENCES',
      label: 'Preferences',
      icon: DataIcon,
      priority: 4,
      enabled: true
    }
  ];
  
  // Detect device type
  const detectDevice = useCallback(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile ? 'MOBILE' : 'WEB';
  }, []);
  
  // Initialize device info
  useEffect(() => {
    const currentDevice = detectDevice();
    setDeviceInfo(prev => ({
      ...prev,
      current: currentDevice,
      [`last${currentDevice}`]: new Date().toISOString()
    }));
  }, [detectDevice]);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncSettings.autoSync && syncQueue.length > 0) {
        performSync();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('OFFLINE');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncSettings.autoSync, syncQueue.length]);
  
  // Auto-sync interval
  useEffect(() => {
    if (syncSettings.autoSync && isOnline) {
      syncIntervalRef.current = setInterval(() => {
        performSync();
      }, syncSettings.syncInterval);
    }
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncSettings.autoSync, syncSettings.syncInterval, isOnline]);
  
  // Sync on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (syncSettings.syncOnFocus && isOnline) {
        performSync();
      }
    };
    
    if (syncSettings.syncOnFocus) {
      window.addEventListener('focus', handleFocus);
    }
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncSettings.syncOnFocus, isOnline]);
  
  // Perform sync operation
  const performSync = useCallback(async () => {
    if (syncStatus === 'SYNCING' || !isOnline) return;
    
    setSyncStatus('SYNCING');
    setSyncProgress(0);
    
    try {
      const syncData = {
        deviceType: deviceInfo.current,
        lastSync: lastSync,
        dataTypes: syncDataTypes.filter(dt => dt.enabled)
      };
      
      // Simulate sync API call
      const response = await mockSyncAPI(syncData);
      
      // Process sync response
      await processSyncResponse(response);
      
      setSyncStatus('SUCCESS');
      setLastSync(new Date().toISOString());
      
      if (onSyncComplete) {
        onSyncComplete(response);
      }
      
    } catch (error) {
      setSyncStatus('ERROR');
      console.error('Sync failed:', error);
    } finally {
      setSyncProgress(100);
      
      // Reset status after delay
      syncTimeoutRef.current = setTimeout(() => {
        setSyncStatus('IDLE');
        setSyncProgress(0);
      }, 3000);
    }
  }, [syncStatus, isOnline, deviceInfo.current, lastSync, onSyncComplete]);
  
  // Mock sync API
  const mockSyncAPI = async (syncData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate progress updates
    for (let i = 0; i <= 100; i += 20) {
      setSyncProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Mock response with potential conflicts
    return {
      success: true,
      conflicts: Math.random() > 0.8 ? [
        {
          id: 'conflict1',
          type: 'PROFILE',
          field: 'phoneNumber',
          localValue: '+254700123456',
          remoteValue: '+254700654321',
          timestamp: new Date().toISOString()
        }
      ] : [],
      updated: {
        profile: Math.random() > 0.5,
        applications: Math.random() > 0.7,
        documents: Math.random() > 0.6
      }
    };
  };
  
  // Process sync response
  const processSyncResponse = async (response) => {
    if (response.conflicts?.length > 0) {
      setConflicts(response.conflicts);
      
      if (syncSettings.conflictResolution === 'manual') {
        // Show conflict dialog for manual resolution
        setSelectedConflict(response.conflicts[0]);
        setConflictDialogOpen(true);
      } else {
        // Auto-resolve conflicts
        await resolveConflicts(response.conflicts, syncSettings.conflictResolution);
      }
      
      if (onConflict) {
        onConflict(response.conflicts);
      }
    }
    
    // Update local state with synced data
    if (response.updated) {
      // Dispatch actions to update Redux state
      // dispatch(updateProfile(response.updated.profile));
      // dispatch(updateApplications(response.updated.applications));
      // etc.
    }
  };
  
  // Resolve sync conflicts
  const resolveConflicts = async (conflicts, resolution) => {
    for (const conflict of conflicts) {
      const resolvedValue = resolution === 'local' 
        ? conflict.localValue 
        : conflict.remoteValue;
      
      // Apply resolution
      console.log(`Resolving conflict: ${conflict.field} = ${resolvedValue}`);
    }
    
    setConflicts([]);
  };
  
  // Handle manual conflict resolution
  const handleConflictResolution = (conflict, useLocal) => {
    const resolvedValue = useLocal ? conflict.localValue : conflict.remoteValue;
    
    // Apply resolution
    resolveConflicts([conflict], useLocal ? 'local' : 'remote');
    
    // Remove from conflicts and close dialog
    setConflicts(prev => prev.filter(c => c.id !== conflict.id));
    setConflictDialogOpen(false);
    setSelectedConflict(null);
  };
  
  // Get sync status info
  const getSyncStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: OfflineIcon,
        color: '#757575',
        label: 'Offline',
        description: 'Sync will resume when online'
      };
    }
    
    switch (syncStatus) {
      case 'SYNCING':
        return {
          icon: SyncIcon,
          color: '#2196f3',
          label: 'Syncing',
          description: 'Synchronizing data...'
        };
      case 'SUCCESS':
        return {
          icon: SyncedIcon,
          color: '#4caf50',
          label: 'Synced',
          description: 'All data synchronized'
        };
      case 'ERROR':
        return {
          icon: ErrorIcon,
          color: '#f44336',
          label: 'Sync Failed',
          description: 'Failed to synchronize'
        };
      case 'OFFLINE':
        return {
          icon: OfflineIcon,
          color: '#757575',
          label: 'Offline',
          description: 'No internet connection'
        };
      default:
        return {
          icon: SyncIcon,
          color: '#757575',
          label: 'Ready',
          description: 'Ready to sync'
        };
    }
  };
  
  const statusInfo = getSyncStatusInfo();
  const StatusIcon = statusInfo.icon;
  
  return (
    <Paper className={styles.container}>
      {/* Header */}
      <Box className={styles.header}>
        <Box display="flex" alignItems="center" gap={2}>
          <Badge
            badgeContent={conflicts.length}
            color="error"
            invisible={conflicts.length === 0}
          >
            <StatusIcon
              className={`${styles.statusIcon} ${syncStatus === 'SYNCING' ? styles.spinning : ''}`}
              style={{ color: statusInfo.color }}
            />
          </Badge>
          
          <Typography variant="h6">Mobile-Web Sync</Typography>
          
          <Chip
            icon={deviceInfo.current === 'MOBILE' ? <MobileIcon /> : <WebIcon />}
            label={deviceInfo.current}
            size="small"
            className={styles.deviceChip}
          />
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title={statusInfo.description}>
            <Chip
              label={statusInfo.label}
              size="small"
              style={{ color: statusInfo.color }}
              className={styles.statusChip}
            />
          </Tooltip>
          
          <Tooltip title="Manual sync">
            <IconButton
              size="small"
              onClick={performSync}
              disabled={syncStatus === 'SYNCING' || !isOnline}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <IconButton size="small" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
          
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>
      
      {/* Sync Progress */}
      {showProgress && syncStatus === 'SYNCING' && (
        <LinearProgress
          variant="determinate"
          value={syncProgress}
          className={styles.syncProgress}
        />
      )}
      
      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert
          severity="warning"
          action={
            <Button size="small" onClick={() => setConflictDialogOpen(true)}>
              Resolve
            </Button>
          }
          className={styles.conflictAlert}
        >
          {conflicts.length} sync conflict{conflicts.length > 1 ? 's' : ''} need resolution
        </Alert>
      )}
      
      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box className={styles.content}>
          {/* Sync Settings */}
          <Box className={styles.section}>
            <Typography variant="subtitle2" gutterBottom>
              Sync Settings
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={syncSettings.autoSync}
                  onChange={(e) => setSyncSettings(prev => ({
                    ...prev,
                    autoSync: e.target.checked
                  }))}
                  size="small"
                />
              }
              label="Auto-sync"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={syncSettings.syncOnFocus}
                  onChange={(e) => setSyncSettings(prev => ({
                    ...prev,
                    syncOnFocus: e.target.checked
                  }))}
                  size="small"
                />
              }
              label="Sync on focus"
            />
          </Box>
          
          {/* Last Sync Info */}
          {lastSync && (
            <Box className={styles.section}>
              <Typography variant="subtitle2" gutterBottom>
                Last Sync
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
              </Typography>
            </Box>
          )}
          
          {/* Data Types */}
          <Box className={styles.section}>
            <Typography variant="subtitle2" gutterBottom>
              Sync Data Types
            </Typography>
            <List dense>
              {syncDataTypes.map((dataType) => (
                <ListItem key={dataType.type} className={styles.dataTypeItem}>
                  <ListItemIcon>
                    <dataType.icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={dataType.label} />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={dataType.enabled}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Collapse>
      
      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sync Settings</DialogTitle>
        <DialogContent>
          <Box className={styles.settingsForm}>
            <TextField
              select
              fullWidth
              label="Conflict Resolution"
              value={syncSettings.conflictResolution}
              onChange={(e) => setSyncSettings(prev => ({
                ...prev,
                conflictResolution: e.target.value
              }))}
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="manual">Manual</option>
              <option value="local">Prefer Local</option>
              <option value="remote">Prefer Remote</option>
            </TextField>
            
            <TextField
              type="number"
              fullWidth
              label="Sync Interval (seconds)"
              value={syncSettings.syncInterval / 1000}
              onChange={(e) => setSyncSettings(prev => ({
                ...prev,
                syncInterval: parseInt(e.target.value) * 1000
              }))}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Conflict Resolution Dialog */}
      <Dialog open={conflictDialogOpen} onClose={() => setConflictDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ConflictIcon color="warning" />
            Resolve Sync Conflict
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedConflict && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Conflicting values for <strong>{selectedConflict.field}</strong>:
              </Typography>
              
              <Box className={styles.conflictOptions}>
                <Paper className={styles.conflictOption} elevation={1}>
                  <Typography variant="subtitle2" color="primary">
                    Local Value ({deviceInfo.current})
                  </Typography>
                  <Typography variant="body2">
                    {selectedConflict.localValue}
                  </Typography>
                </Paper>
                
                <Paper className={styles.conflictOption} elevation={1}>
                  <Typography variant="subtitle2" color="secondary">
                    Remote Value (Other Device)
                  </Typography>
                  <Typography variant="body2">
                    {selectedConflict.remoteValue}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleConflictResolution(selectedConflict, false)}
            color="secondary"
          >
            Use Remote
          </Button>
          <Button
            onClick={() => handleConflictResolution(selectedConflict, true)}
            variant="contained"
            color="primary"
          >
            Use Local
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

MobileWebSyncHandler.propTypes = {
  autoSync: PropTypes.bool,
  syncInterval: PropTypes.number,
  onSyncComplete: PropTypes.func,
  onConflict: PropTypes.func,
  showProgress: PropTypes.bool
};

export default MobileWebSyncHandler;