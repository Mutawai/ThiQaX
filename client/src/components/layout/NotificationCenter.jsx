// src/components/layout/NotificationCenter.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer, 
  Typography, 
  IconButton, 
  Badge, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Divider, 
  Button, 
  CircularProgress,
  Tooltip,
  Avatar,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ErrorOutline as ErrorIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getNotifications, 
  markNotificationsAsRead, 
  deleteNotification 
} from '../../store/actions/notificationActions';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import useAuth from '../auth/useAuth';

// Width of the notification drawer
const drawerWidth = 320;

const NotificationCenter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  
  // Get notifications from Redux store
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error 
  } = useSelector(state => state.notifications);

  // Load notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getNotifications());
      
      // Set up interval to check for new notifications
      const interval = setInterval(() => {
        if (!open) { // Only fetch when drawer is closed
          dispatch(getNotifications());
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [dispatch, isAuthenticated, open]);

  // Toggle notification center
  const toggleDrawer = (isOpen) => {
    setOpen(isOpen);
    
    // Mark notifications as read when opening
    if (isOpen && unreadCount > 0) {
      dispatch(markNotificationsAsRead());
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Navigate based on notification type
    if (notification.link) {
      navigate(notification.link);
      toggleDrawer(false);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = () => {
    dispatch(markNotificationsAsRead());
  };

  // Handle delete notification
  const handleDeleteNotification = (id, e) => {
    e.stopPropagation(); // Prevent notification click
    dispatch(deleteNotification(id));
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };

  return (
    <>
      {/* Notification Icon */}
      <IconButton 
        color="inherit" 
        onClick={() => toggleDrawer(true)}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      {/* Notification Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => toggleDrawer(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6">
            Notifications
            {unreadCount > 0 && (
              <Chip 
                label={unreadCount} 
                color="primary" 
                size="small" 
                sx={{ ml: 1 }} 
              />
            )}
          </Typography>
          
          <Box>
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton size="small" onClick={handleMarkAsRead} sx={{ mr: 1 }}>
                  <MarkReadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small" onClick={() => toggleDrawer(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        <Divider />
        
        {loading && !notifications.length ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100px">
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box p={2}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" p={3}>
            <Avatar sx={{ width: 60, height: 60, mb: 2, bgcolor: 'background.paper' }}>
              <NotificationsIcon color="disabled" fontSize="large" />
            </Avatar>
            <Typography variant="body1" gutterBottom align="center">
              No notifications yet
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              We'll notify you when something important happens.
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ p: 0 }}>
              {notifications.map((notification) => (
                <ListItem 
                  key={notification._id}
                  sx={{ 
                    py: 1.5, 
                    px: 2,
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    }
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography 
                          variant="body2" 
                          component="span" 
                          display="block" 
                          noWrap
                        >
                          {notification.message}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="textSecondary"
                        >
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            <Box p={2}>
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={() => {
                  navigate('/notifications');
                  toggleDrawer(false);
                }}
              >
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Drawer>
    </>
  );
};

export default NotificationCenter;