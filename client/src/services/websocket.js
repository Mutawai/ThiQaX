/**
 * ThiQaX Frontend Notification System
 * 
 * This artifact contains the frontend components for the real-time notification system:
 * 1. WebSocket service for real-time communication
 * 2. Redux actions for notification management
 * 3. Redux reducer for the notification state
 * 4. NotificationCenter React component for UI
 */

// =======================================
// src/services/websocket.js
// =======================================
import { io } from 'socket.io-client';
import { store } from '../store';
import { newNotification, updateNotificationCount } from '../store/actions/notificationActions';
import config from '../config';

let socket;

/**
 * Initialize WebSocket connection
 * @param {string} token JWT token for authentication
 */
export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }
  
  socket = io(config.wsBaseUrl, {
    auth: {
      token
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('WebSocket connected');
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`WebSocket disconnected: ${reason}`);
  });
  
  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // Notification events
  socket.on('notification', (data) => {
    // Dispatch notification to Redux store
    store.dispatch(newNotification(data));
    store.dispatch(updateNotificationCount());
    
    // Play notification sound if enabled in user settings
    const { soundEnabled } = store.getState().settings;
    if (soundEnabled) {
      playNotificationSound();
    }
    
    // Show browser notification if allowed
    showBrowserNotification(data);
  });
  
  return socket;
};

/**
 * Disconnect WebSocket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Play notification sound
 */
const playNotificationSound = () => {
  const audio = new Audio('/sounds/notification.mp3');
  audio.play().catch(err => console.error('Error playing notification sound:', err));
};

/**
 * Show browser notification
 * @param {Object} notification Notification data
 */
const showBrowserNotification = (notification) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('ThiQaX Notification', {
      body: notification.message,
      icon: '/logo192.png'
    });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
};

// =======================================
// src/store/actions/notificationActions.js
// =======================================
import axios from 'axios';
import config from '../../config';

// Action Types
export const GET_NOTIFICATIONS_REQUEST = 'GET_NOTIFICATIONS_REQUEST';
export const GET_NOTIFICATIONS_SUCCESS = 'GET_NOTIFICATIONS_SUCCESS';
export const GET_NOTIFICATIONS_FAILURE = 'GET_NOTIFICATIONS_FAILURE';
export const NEW_NOTIFICATION = 'NEW_NOTIFICATION';
export const UPDATE_NOTIFICATION_COUNT = 'UPDATE_NOTIFICATION_COUNT';
export const MARK_NOTIFICATION_READ_REQUEST = 'MARK_NOTIFICATION_READ_REQUEST';
export const MARK_NOTIFICATION_READ_SUCCESS = 'MARK_NOTIFICATION_READ_SUCCESS';
export const MARK_NOTIFICATION_READ_FAILURE = 'MARK_NOTIFICATION_READ_FAILURE';
export const MARK_NOTIFICATIONS_READ_REQUEST = 'MARK_NOTIFICATIONS_READ_REQUEST';
export const MARK_NOTIFICATIONS_READ_SUCCESS = 'MARK_NOTIFICATIONS_READ_SUCCESS';
export const MARK_NOTIFICATIONS_READ_FAILURE = 'MARK_NOTIFICATIONS_READ_FAILURE';
export const DELETE_NOTIFICATION_REQUEST = 'DELETE_NOTIFICATION_REQUEST';
export const DELETE_NOTIFICATION_SUCCESS = 'DELETE_NOTIFICATION_SUCCESS';
export const DELETE_NOTIFICATION_FAILURE = 'DELETE_NOTIFICATION_FAILURE';
export const CLEAR_ALL_NOTIFICATIONS_REQUEST = 'CLEAR_ALL_NOTIFICATIONS_REQUEST';
export const CLEAR_ALL_NOTIFICATIONS_SUCCESS = 'CLEAR_ALL_NOTIFICATIONS_SUCCESS';
export const CLEAR_ALL_NOTIFICATIONS_FAILURE = 'CLEAR_ALL_NOTIFICATIONS_FAILURE';

/**
 * Get user notifications
 */
export const getNotifications = () => async (dispatch) => {
  try {
    dispatch({ type: GET_NOTIFICATIONS_REQUEST });
    
    const res = await axios.get(`${config.apiBaseUrl}/api/v1/notifications`);
    
    dispatch({
      type: GET_NOTIFICATIONS_SUCCESS,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: GET_NOTIFICATIONS_FAILURE,
      payload: err.response?.data?.message || err.message
    });
  }
};

/**
 * New notification received via WebSocket
 * @param {Object} notification Notification data
 */
export const newNotification = (notification) => ({
  type: NEW_NOTIFICATION,
  payload: notification
});

/**
 * Update notification count
 */
export const updateNotificationCount = () => async (dispatch) => {
  try {
    const res = await axios.get(`${config.apiBaseUrl}/api/v1/notifications/count`);
    
    dispatch({
      type: UPDATE_NOTIFICATION_COUNT,
      payload: res.data.data.unreadCount
    });
  } catch (err) {
    console.error('Error updating notification count:', err);
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId Notification ID
 */
export const markNotificationAsRead = (notificationId) => async (dispatch) => {
  try {
    dispatch({ type: MARK_NOTIFICATION_READ_REQUEST });
    
    const res = await axios.put(`${config.apiBaseUrl}/api/v1/notifications/${notificationId}/mark-read`);
    
    dispatch({
      type: MARK_NOTIFICATION_READ_SUCCESS,
      payload: notificationId
    });
  } catch (err) {
    dispatch({
      type: MARK_NOTIFICATION_READ_FAILURE,
      payload: err.response?.data?.message || err.message
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = () => async (dispatch) => {
  try {
    dispatch({ type: MARK_NOTIFICATIONS_READ_REQUEST });
    
    const res = await axios.put(`${config.apiBaseUrl}/api/v1/notifications/mark-all-read`);
    
    dispatch({
      type: MARK_NOTIFICATIONS_READ_SUCCESS
    });
  } catch (err) {
    dispatch({
      type: MARK_NOTIFICATIONS_READ_FAILURE,
      payload: err.response?.data?.message || err.message
    });
  }
};

/**
 * Delete a notification
 * @param {string} notificationId Notification ID
 */
export const deleteNotification = (notificationId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_NOTIFICATION_REQUEST });
    
    const res = await axios.delete(`${config.apiBaseUrl}/api/v1/notifications/${notificationId}`);
    
    dispatch({
      type: DELETE_NOTIFICATION_SUCCESS,
      payload: notificationId
    });
  } catch (err) {
    dispatch({
      type: DELETE_NOTIFICATION_FAILURE,
      payload: err.response?.data?.message || err.message
    });
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = () => async (dispatch) => {
  try {
    dispatch({ type: CLEAR_ALL_NOTIFICATIONS_REQUEST });
    
    const res = await axios.delete(`${config.apiBaseUrl}/api/v1/notifications`);
    
    dispatch({
      type: CLEAR_ALL_NOTIFICATIONS_SUCCESS
    });
  } catch (err) {
    dispatch({
      type: CLEAR_ALL_NOTIFICATIONS_FAILURE,
      payload: err.response?.data?.message || err.message
    });
  }
};

// =======================================
// src/store/reducers/notificationReducer.js
// =======================================
import {
  GET_NOTIFICATIONS_REQUEST,
  GET_NOTIFICATIONS_SUCCESS,
  GET_NOTIFICATIONS_FAILURE,
  NEW_NOTIFICATION,
  UPDATE_NOTIFICATION_COUNT,
  MARK_NOTIFICATION_READ_REQUEST,
  MARK_NOTIFICATION_READ_SUCCESS,
  MARK_NOTIFICATION_READ_FAILURE,
  MARK_NOTIFICATIONS_READ_REQUEST,
  MARK_NOTIFICATIONS_READ_SUCCESS,
  MARK_NOTIFICATIONS_READ_FAILURE,
  DELETE_NOTIFICATION_REQUEST,
  DELETE_NOTIFICATION_SUCCESS,
  DELETE_NOTIFICATION_FAILURE,
  CLEAR_ALL_NOTIFICATIONS_REQUEST,
  CLEAR_ALL_NOTIFICATIONS_SUCCESS,
  CLEAR_ALL_NOTIFICATIONS_FAILURE
} from '../types';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null
};

export default function notificationReducer(state = initialState, action) {
  switch (action.type) {
    case GET_NOTIFICATIONS_REQUEST:
    case MARK_NOTIFICATIONS_READ_REQUEST:
    case CLEAR_ALL_NOTIFICATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case GET_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        notifications: action.payload.items,
        unreadCount: action.payload.unreadCount,
        error: null
      };
    
    case GET_NOTIFICATIONS_FAILURE:
    case MARK_NOTIFICATIONS_READ_FAILURE:
    case CLEAR_ALL_NOTIFICATIONS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case NEW_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    
    case UPDATE_NOTIFICATION_COUNT:
      return {
        ...state,
        unreadCount: action.payload
      };
    
    case MARK_NOTIFICATION_READ_SUCCESS:
      return {
        ...state,
        notifications: state.notifications.map(notification => 
          notification._id === action.payload
            ? { ...notification, read: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    
    case MARK_NOTIFICATIONS_READ_SUCCESS:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          read: true
        })),
        unreadCount: 0,
        loading: false
      };
    
    case DELETE_NOTIFICATION_SUCCESS:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification._id !== action.payload
        ),
        unreadCount: state.notifications.find(
          notification => notification._id === action.payload && !notification.read
        )
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount
      };
    
    case CLEAR_ALL_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
        loading: false
      };
    
    default:
      return state;
  }
}

// =======================================
// src/components/notifications/NotificationCenter.js
// =======================================
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Badge, IconButton, Drawer, Typography, List, ListItem,
  ListItemText, ListItemIcon, Divider, Button, Chip, Avatar,
  Tabs, Tab, CircularProgress, Alert, Menu, MenuItem, ListItemSecondaryAction
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircle, Cancel, Assignment, Work, Info,
  AccessTime, Delete, MoreVert, MarkEmailRead
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications
} from '../../store/actions/notificationActions';
import { useResponsive } from '../../utils/responsive';

const NotificationCenter = () => {
  const dispatch = useDispatch();
  const { isMobile } = useResponsive();
  
  const { user } = useSelector(state => state.auth);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error 
  } = useSelector(state => state.notifications);
  
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  const drawerWidth = isMobile ? '100%' : 350;
  const prevUnreadCountRef = useRef(unreadCount);
  
  // Fetch notifications when opened
  useEffect(() => {
    if (open && user) {
      dispatch(getNotifications());
    }
  }, [open, user, dispatch]);
  
  // Highlight badge when new notifications arrive
  useEffect(() => {
    const notificationBadge = document.getElementById('notification-badge');
    
    if (unreadCount > prevUnreadCountRef.current && notificationBadge) {
      notificationBadge.classList.add('pulse-animation');
      
      setTimeout(() => {
        notificationBadge.classList.remove('pulse-animation');
      }, 2000);
    }
    
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);
  
  const toggleDrawer = () => {
    setOpen(!open);
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification._id));
    }
    
    // Handle notification action based on type
    switch (notification.type) {
      case 'DOCUMENT_VERIFIED':
      case 'DOCUMENT_REJECTED':
        window.location.href = '/profile/documents';
        break;
      case 'APPLICATION_STATUS':
        window.location.href = `/applications/${notification.data.applicationId}`;
        break;
      case 'JOB_MATCH':
        window.location.href = `/jobs/${notification.data.jobId}`;
        break;
      default:
        // No specific action
        break;
    }
  };
  
  const handleMenuOpen = (event, notification) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedNotification(null);
  };
  
  const handleMarkAsRead = () => {
    if (selectedNotification) {
      dispatch(markNotificationAsRead(selectedNotification._id));
    }
    handleMenuClose();
  };
  
  const handleDelete = () => {
    if (selectedNotification) {
      dispatch(deleteNotification(selectedNotification._id));
    }
    handleMenuClose();
  };
  
  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };
  
  const handleClearAll = () => {
    dispatch(clearAllNotifications());
  };
  
  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 0 
    ? notifications 
    : notifications.filter(notification => !notification.read);
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'DOCUMENT_VERIFIED':
        return <CheckCircle color="success" />;
      case 'DOCUMENT_REJECTED':
        return <Cancel color="error" />;
      case 'APPLICATION_STATUS':
        return <Assignment color="primary" />;
      case 'JOB_MATCH':
        return <Work color="secondary" />;
      case 'DOCUMENT_EXPIRING':
        return <AccessTime color="warning" />;
      default:
        return <Info color="action" />;
    }
  };
  
  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={toggleDrawer}
        id="notification-button"
        aria-label={`${unreadCount} unread notifications`}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error" 
          id="notification-badge"
          max={99}
          overlap="circular"
        >
          {unreadCount > 0 ? (
            <NotificationsActiveIcon />
          ) : (
            <NotificationsIcon />
          )}
        </Badge>
      </IconButton>
      
      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notifications
            {unreadCount > 0 && (
              <Chip 
                label={unreadCount} 
                color="error" 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          <IconButton onClick={toggleDrawer}>
            <Cancel />
          </IconButton>
        </Box>
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All" />
          <Tab 
            label="Unread" 
            disabled={unreadCount === 0}
          />
        </Tabs>
        
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            size="small" 
            onClick={handleMarkAllAsRead}
            startIcon={<MarkEmailRead />}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
          <Button 
            size="small" 
            onClick={handleClearAll}
            startIcon={<Delete />}
            disabled={notifications.length === 0}
            color="error"
          >
            Clear all
          </Button>
        </Box>
        
        <Divider />
        
        {error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : loading ? (
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
              {activeTab === 0 
                ? "You don't have any notifications yet" 
                : "You don't have any unread notifications"}
            </Typography>
          </Box>
        ) : (
          <List sx={{ overflow: 'auto', flex: 1 }}>
            {filteredNotifications.map((notification) => (
              <ListItem 
                key={notification._id}
                divider
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{ 
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  py: 1
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                
                <ListItemText 
                  primary={
                    <Typography 
                      variant="subtitle2" 
                      sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography 
                        variant="body2" 
                        color="textPrimary" 
                        component="span"
                        sx={{ display: 'block' }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="textSecondary" 
                        component="span"
                      >
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                    </>
                  }
                />
                
                <ListItemSecondaryAction>
          
