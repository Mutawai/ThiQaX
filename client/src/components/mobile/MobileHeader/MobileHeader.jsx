// client/src/components/mobile/MobileHeader/MobileHeader.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon,
  ListItemText, 
  Badge,
  useTheme, 
  styled 
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Home as HomeIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../../store/actions/authActions';
import { useResponsive } from '../../../utils/responsive';
import styles from './MobileHeader.module.css';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary
}));

const StyledToolbar = styled(Toolbar)(() => ({
  minHeight: '56px !important',
  padding: '0 8px',
  '@media (min-width: 600px)': {
    minHeight: '64px !important',
    padding: '0 16px'
  }
}));

/**
 * MobileHeader Component
 * 
 * A mobile-optimized header component that provides navigation, title display,
 * and user actions with responsive design
 * 
 * @param {Object} props - Component props
 * @param {Function} props.toggleDrawer - Function to toggle the navigation drawer
 * @param {Function} props.onNavigate - Custom navigation handler
 * @param {Function} props.onLogout - Custom logout handler
 * @param {string} props.title - Custom title override
 * @param {boolean} props.showBackButton - Force show back button
 * @param {boolean} props.showMenuButton - Force show menu button
 * @param {boolean} props.showNotifications - Whether to show notification button
 * @param {boolean} props.showProfile - Whether to show profile menu
 * @param {Array} props.customActions - Custom action buttons to display
 * @param {string} props.variant - Header variant: 'default', 'minimal', 'transparent'
 * @param {string} props.position - AppBar position: 'fixed', 'static', 'sticky'
 * @param {string} props.className - Additional CSS class
 */
const MobileHeader = ({
  toggleDrawer,
  onNavigate,
  onLogout,
  title,
  showBackButton,
  showMenuButton,
  showNotifications = true,
  showProfile = true,
  customActions = [],
  variant = 'default',
  position = 'fixed',
  className = ''
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isMobile } = useResponsive();
  
  // Local state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [actionsMenuAnchorEl, setActionsMenuAnchorEl] = useState(null);
  
  // Redux state
  const { user } = useSelector(state => state.auth || { user: null });
  const { unreadCount } = useSelector(state => state.notifications || { unreadCount: 0 });
  
  // Handle menu operations
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleActionsMenuOpen = (event) => {
    setActionsMenuAnchorEl(event.currentTarget);
  };
  
  const handleActionsMenuClose = () => {
    setActionsMenuAnchorEl(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    handleMenuClose();
    
    if (onLogout) {
      onLogout();
    } else {
      dispatch(logout());
      navigate('/auth/login');
    }
  };
  
  // Handle navigation
  const handleNavigation = (path) => {
    handleMenuClose();
    
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    if (onNavigate) {
      onNavigate(-1);
    } else {
      navigate(-1);
    }
  };
  
  // Determine page title based on current route
  const getPageTitle = () => {
    if (title) return title;
    
    const path = location.pathname;
    const titleMap = {
      '/dashboard': 'Dashboard',
      '/jobs': 'Find Jobs',
      '/jobs/manage': 'Manage Jobs',
      '/jobs/create': 'Post a Job',
      '/applications': 'My Applications',
      '/profile': 'My Profile',
      '/profile/documents': 'My Documents',
      '/notifications': 'Notifications',
      '/settings': 'Settings',
      '/help': 'Help & Support',
      '/company': 'My Company',
      '/admin': 'Admin Panel',
      '/admin/verification': 'Verification',
      '/admin/users': 'User Management',
      '/admin/system': 'System Settings'
    };
    
    // Check for exact matches first
    if (titleMap[path]) return titleMap[path];
    
    // Check for partial matches
    if (path.startsWith('/jobs/') && path !== '/jobs/create' && path !== '/jobs/manage') {
      return 'Job Details';
    }
    if (path.startsWith('/applications/')) return 'Application Details';
    if (path.startsWith('/admin/')) return 'Admin Panel';
    
    return 'ThiQaX';
  };
  
  // Determine if back button should be shown
  const shouldShowBackButton = () => {
    if (showBackButton !== undefined) return showBackButton;
    if (showMenuButton !== undefined) return !showMenuButton;
    
    const mainRoutes = ['/dashboard', '/jobs', '/applications', '/profile', '/notifications'];
    return !mainRoutes.includes(location.pathname);
  };
  
  // Determine if menu button should be shown
  const shouldShowMenuButton = () => {
    if (showMenuButton !== undefined) return showMenuButton;
    if (showBackButton !== undefined) return !showBackButton;
    
    return !shouldShowBackButton();
  };
  
  // Get avatar display
  const getAvatarContent = () => {
    if (user?.avatar) return user.avatar;
    if (user?.firstName) return user.firstName.charAt(0).toUpperCase();
    return 'U';
  };
  
  // Don't render on larger screens unless specifically requested
  if (!isMobile && variant !== 'minimal') {
    return null;
  }
  
  return (
    <StyledAppBar 
      position={position} 
      className={`${styles.header} ${styles[variant]} ${className}`}
      elevation={variant === 'transparent' ? 0 : 1}
    >
      <StyledToolbar className={styles.toolbar}>
        {/* Left Action - Back or Menu Button */}
        {shouldShowBackButton() ? (
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            className={styles.backButton}
            aria-label="Go back"
          >
            <ArrowBackIcon />
          </IconButton>
        ) : shouldShowMenuButton() && toggleDrawer ? (
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer}
            className={styles.menuButton}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <Box width={48} /> // Spacer for centering title
        )}
        
        {/* Title */}
        <Typography 
          variant="h6" 
          component="div" 
          className={styles.title}
          noWrap
        >
          {getPageTitle()}
        </Typography>
        
        {/* Right Actions */}
        <Box className={styles.rightActions}>
          {/* Custom Actions */}
          {customActions.map((action, index) => (
            <IconButton
              key={index}
              color="inherit"
              onClick={action.onClick}
              className={styles.actionButton}
              aria-label={action.label}
            >
              {action.badge ? (
                <Badge badgeContent={action.badge} color="error" max={99}>
                  {action.icon}
                </Badge>
              ) : (
                action.icon
              )}
            </IconButton>
          ))}
          
          {/* Notifications */}
          {showNotifications && (
            <IconButton
              color="inherit"
              onClick={() => handleNavigation('/notifications')}
              className={styles.notificationButton}
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          )}
          
          {/* Profile Menu */}
          {showProfile && user && (
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleMenuOpen}
              className={styles.profileButton}
              aria-label="Open profile menu"
            >
              <Avatar 
                src={user.avatar}
                alt={user.firstName || 'User'}
                className={styles.avatar}
              >
                {getAvatarContent()}
              </Avatar>
            </IconButton>
          )}
          
          {/* Actions Menu (if many custom actions) */}
          {customActions.length > 2 && (
            <IconButton
              color="inherit"
              onClick={handleActionsMenuOpen}
              className={styles.moreButton}
              aria-label="More actions"
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>
      </StyledToolbar>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        className={styles.profileMenu}
      >
        <MenuItem onClick={() => handleNavigation('/dashboard')}>
          <ListItemIcon>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigation('/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="My Profile" />
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigation('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
      
      {/* Actions Menu */}
      <Menu
        anchorEl={actionsMenuAnchorEl}
        open={Boolean(actionsMenuAnchorEl)}
        onClose={handleActionsMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        className={styles.actionsMenu}
      >
        {customActions.slice(2).map((action, index) => (
          <MenuItem 
            key={index} 
            onClick={() => {
              action.onClick();
              handleActionsMenuClose();
            }}
          >
            <ListItemIcon>
              {action.icon}
            </ListItemIcon>
            <ListItemText primary={action.label} />
          </MenuItem>
        ))}
      </Menu>
    </StyledAppBar>
  );
};

MobileHeader.propTypes = {
  toggleDrawer: PropTypes.func,
  onNavigate: PropTypes.func,
  onLogout: PropTypes.func,
  title: PropTypes.string,
  showBackButton: PropTypes.bool,
  showMenuButton: PropTypes.bool,
  showNotifications: PropTypes.bool,
  showProfile: PropTypes.bool,
  customActions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node.isRequired,
      onClick: PropTypes.func.isRequired,
      label: PropTypes.string.isRequired,
      badge: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ),
  variant: PropTypes.oneOf(['default', 'minimal', 'transparent']),
  position: PropTypes.oneOf(['fixed', 'static', 'sticky']),
  className: PropTypes.string
};

export default MobileHeader;