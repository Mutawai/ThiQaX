// client/src/components/integration/NotificationAggregator/NotificationAggregator.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
  Badge,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Divider,
  Collapse,
  Alert,
  CircularProgress,
  Avatar,
  Button,
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Assignment as ApplicationIcon,
  Description as DocumentIcon,
  Work as JobIcon,
  Payment as PaymentIcon,
  Settings as SystemIcon,
  Info as GeneralIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../../../store/actions/notificationActions';
import styles from './NotificationAggregator.module.css';

/**
 * NotificationAggregator Component
 * 
 * Aggregates and displays notifications from multiple sources with filtering,
 * grouping, and real-time updates
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.compact - Whether to show compact view
 * @param {boolean} props.showGrouping - Whether to group notifications by type
 * @param {Function} props.onNotificationClick - Callback when notification is clicked
 * @param {number} props.maxHeight - Maximum height of the notification list
 */
const NotificationAggregator = ({
  compact = false,
  showGrouping = true,
  onNotificationClick,
  maxHeight = 600
}) => {
  const dispatch = useDispatch();
  
  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState('ALL');
  const [contextMenuAnchor, setContextMenuAnchor] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  // Redux state
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error 
  } = useSelector(state => state.notifications);
  const { user } = useSelector(state => state.auth);
  
  // Fetch notifications on mount
  useEffect(() => {
    if (user) {
      dispatch(getNotifications());
    }
  }, [dispatch, user]);
  
  // Notification type configurations
  const notificationTypes = {
    APPLICATION: {
      label: 'Applications',
      icon: ApplicationIcon,
      color: '#2196f3'
    },
    DOCUMENT: {
      label: 'Documents',
      icon: DocumentIcon,
      color: '#ff9800'
    },
    JOB: {
      label: 'Jobs',
      icon: JobIcon,
      color: '#4caf50'
    },
    PAYMENT: {
      label: 'Payments',
      icon: PaymentIcon,
      color: '#9c27b0'
    },
    SYSTEM: {
      label: 'System',
      icon: SystemIcon,
      color: '#607d8b'
    },
    GENERAL: {
      label: 'General',
      icon: GeneralIcon,
      color: '#795548'
    }
  };
  
  // Filter notifications based on active tab and search
  const filteredNotifications = useMemo(() => {
    let filtered = notifications || [];
    
    // Filter by tab (all, unread, by type)
    if (activeTab === 1) {
      filtered = filtered.filter(n => !n.read);
    } else if (activeTab > 1) {
      const typeIndex = activeTab - 2;
      const types = Object.keys(notificationTypes);
      filtered = filtered.filter(n => n.type === types[typeIndex]);
    }
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(search) ||
        n.message.toLowerCase().includes(search)
      );
    }
    
    // Filter by priority
    if (selectedPriority !== 'ALL') {
      filtered = filtered.filter(n => n.priority === selectedPriority);
    }
    
    // Filter by timeframe
    if (selectedTimeframe !== 'ALL') {
      const now = new Date();
      const timeframes = {
        TODAY: 1,
        WEEK: 7,
        MONTH: 30
      };
      
      const days = timeframes[selectedTimeframe];
      if (days) {
        const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        filtered = filtered.filter(n => new Date(n.createdAt) >= cutoff);
      }
    }
    
    return filtered;
  }, [notifications, activeTab, searchTerm, selectedPriority, selectedTimeframe]);
  
  // Group notifications by type
  const groupedNotifications = useMemo(() => {
    if (!showGrouping) return { ALL: filteredNotifications };
    
    const grouped = {};
    
    Object.keys(notificationTypes).forEach(type => {
      grouped[type] = filteredNotifications.filter(n => n.type === type);
    });
    
    return grouped;
  }, [filteredNotifications, showGrouping]);
  
  // Get notification counts by type
  const notificationCounts = useMemo(() => {
    const counts = {};
    
    Object.keys(notificationTypes).forEach(type => {
      const typeNotifications = (notifications || []).filter(n => n.type === type);
      counts[type] = {
        total: typeNotifications.length,
        unread: typeNotifications.filter(n => !n.read).length
      };
    });
    
    return counts;
  }, [notifications]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification._id));
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };
  
  // Handle context menu
  const handleContextMenu = (event, notification) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuAnchor(event.currentTarget);
    setSelectedNotification(notification);
  };
  
  const handleContextMenuClose = () => {
    setContextMenuAnchor(null);
    setSelectedNotification(null);
  };
  
  // Handle mark as read
  const handleMarkAsRead = () => {
    if (selectedNotification && !selectedNotification.read) {
      dispatch(markNotificationAsRead(selectedNotification._id));
    }
    handleContextMenuClose();
  };
  
  // Handle delete notification
  const handleDeleteNotification = () => {
    if (selectedNotification) {
      dispatch(deleteNotification(selectedNotification._id));
    }
    handleContextMenuClose();
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };
  
  // Toggle group expansion
  const toggleGroupExpansion = (type) => {
    setExpandedGroups(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  // Get notification icon
  const getNotificationIcon = (type) => {
    const config = notificationTypes[type] || notificationTypes.GENERAL;
    const IconComponent = config.icon;
    return <IconComponent style={{ color: config.color }} />;
  };
  
  // Format relative time
  const formatRelativeTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  // Render notification item
  const renderNotificationItem = (notification) => (
    <ListItem
      key={notification._id}
      button
      onClick={() => handleNotificationClick(notification)}
      onContextMenu={(e) => handleContextMenu(e, notification)}
      className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
      dense={compact}
    >
      <ListItemIcon>
        {getNotificationIcon(notification.type)}
      </ListItemIcon>
      
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography 
              variant={compact ? "body2" : "subtitle2"}
              className={!notification.read ? styles.unreadText : ''}
            >
              {notification.title}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={1}>
              {notification.priority === 'HIGH' && (
                <Chip label="High" size="small" color="error" />
              )}
              {!notification.read && (
                <Badge color="primary" variant="dot" />
              )}
            </Box>
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary" noWrap>
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatRelativeTime(notification.createdAt)}
            </Typography>
          </Box>
        }
      />
      
      <IconButton
        size="small"
        onClick={(e) => handleContextMenu(e, notification)}
        className={styles.menuButton}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </ListItem>
  );
  
  // Render grouped notifications
  const renderGroupedNotifications = () => {
    return Object.entries(groupedNotifications).map(([type, typeNotifications]) => {
      if (typeNotifications.length === 0) return null;
      
      const config = notificationTypes[type];
      const isExpanded = expandedGroups[type] !== false; // Default to expanded
      
      return (
        <Box key={type} className={styles.notificationGroup}>
          <ListItem
            button
            onClick={() => toggleGroupExpansion(type)}
            className={styles.groupHeader}
          >
            <ListItemIcon>
              {getNotificationIcon(type)}
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {config.label}
                  </Typography>
                  <Badge badgeContent={typeNotifications.length} color="primary" />
                </Box>
              }
            />
            
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItem>
          
          <Collapse in={isExpanded}>
            <List disablePadding>
              {typeNotifications.map(renderNotificationItem)}
            </List>
          </Collapse>
          
          <Divider />
        </Box>
      );
    });
  };
  
  return (
    <Paper className={styles.container} style={{ maxHeight }}>
      {/* Header */}
      <Box className={styles.header}>
        <Box display="flex" alignItems="center" gap={2}>
          <NotificationsIcon />
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error" />
          )}
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Mark all as read">
            <IconButton 
              size="small" 
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Filter">
            <IconButton 
              size="small" 
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Search */}
      <Box className={styles.searchContainer}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        className={styles.tabs}
      >
        <Tab label="All" />
        <Tab 
          label={
            <Badge badgeContent={unreadCount} color="error">
              <span>Unread</span>
            </Badge>
          }
        />
        {Object.entries(notificationTypes).map(([type, config]) => (
          <Tab
            key={type}
            label={
              <Badge badgeContent={notificationCounts[type]?.unread || 0} color="error">
                <span>{config.label}</span>
              </Badge>
            }
          />
        ))}
      </Tabs>
      
      {/* Content */}
      <Box className={styles.content}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Avatar sx={{ mx: 'auto', mb: 2, width: 60, height: 60, bgcolor: 'action.hover' }}>
              <NotificationsIcon color="action" fontSize="large" />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              No notifications
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchTerm ? 'No notifications match your search' : 'You have no notifications at this time'}
            </Typography>
          </Box>
        ) : (
          <List className={styles.notificationList}>
            {showGrouping ? renderGroupedNotifications() : filteredNotifications.map(renderNotificationItem)}
          </List>
        )}
      </Box>
      
      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Priority</Typography>
        </MenuItem>
        {['ALL', 'HIGH', 'NORMAL', 'LOW'].map(priority => (
          <MenuItem
            key={priority}
            selected={selectedPriority === priority}
            onClick={() => {
              setSelectedPriority(priority);
              setFilterMenuAnchor(null);
            }}
          >
            {priority}
          </MenuItem>
        ))}
        
        <Divider />
        
        <MenuItem disabled>
          <Typography variant="subtitle2">Timeframe</Typography>
        </MenuItem>
        {['ALL', 'TODAY', 'WEEK', 'MONTH'].map(timeframe => (
          <MenuItem
            key={timeframe}
            selected={selectedTimeframe === timeframe}
            onClick={() => {
              setSelectedTimeframe(timeframe);
              setFilterMenuAnchor(null);
            }}
          >
            {timeframe}
          </MenuItem>
        ))}
      </Menu>
      
      {/* Context Menu */}
      <Menu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleContextMenuClose}
      >
        {selectedNotification && !selectedNotification.read && (
          <MenuItem onClick={handleMarkAsRead}>
            <CheckIcon sx={{ mr: 1 }} />
            Mark as read
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteNotification}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Paper>
  );
};

NotificationAggregator.propTypes = {
  compact: PropTypes.bool,
  showGrouping: PropTypes.bool,
  onNotificationClick: PropTypes.func,
  maxHeight: PropTypes.number
};

export default NotificationAggregator;