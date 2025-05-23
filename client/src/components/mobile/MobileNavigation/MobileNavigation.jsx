// client/src/components/mobile/MobileNavigation/MobileNavigation.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  BottomNavigation, 
  BottomNavigationAction, 
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  Avatar,
  Divider,
  Collapse,
  useTheme,
  styled
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Dashboard as DashboardIcon,
  Assignment as ApplicationIcon,
  Description as DocumentIcon,
  Business as CompanyIcon,
  SupervisorAccount as AdminIcon,
  ExitToApp as LogoutIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './MobileNavigation.module.css';

// Styled components
const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  '& .MuiBottomNavigationAction-root': {
    minWidth: 'auto',
    padding: theme.spacing(1, 0),
    '&.Mui-selected': {
      paddingTop: theme.spacing(0.5),
    }
  }
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    boxSizing: 'border-box',
  }
}));

/**
 * MobileNavigation Component
 * 
 * A comprehensive mobile navigation solution that provides both top app bar 
 * and bottom navigation patterns, with support for drawer navigation
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Navigation type: 'bottom', 'top', 'drawer', or 'hybrid'
 * @param {Array} props.items - Navigation items configuration
 * @param {string} props.currentRoute - Current active route
 * @param {Function} props.onNavigate - Navigation callback
 * @param {Object} props.user - Current user object
 * @param {number} props.notificationCount - Unread notification count
 * @param {string} props.title - App bar title (for top/hybrid navigation)
 * @param {boolean} props.showProfile - Whether to show profile avatar/button
 * @param {Function} props.onProfileClick - Profile click callback
 * @param {Function} props.onLogout - Logout callback
 * @param {Object} props.customIcons - Custom icons for navigation items
 * @param {boolean} props.hideLabels - Whether to hide labels in bottom navigation
 * @param {string} props.variant - Visual variant: 'default', 'minimal', 'material'
 * @param {boolean} props.persistent - Whether drawer should be persistent (drawer type)
 */
const MobileNavigation = ({
  type = 'bottom',
  items = [],
  currentRoute = '',
  onNavigate,
  user = null,
  notificationCount = 0,
  title = 'ThiQaX',
  showProfile = true,
  onProfileClick,
  onLogout,
  customIcons = {},
  hideLabels = false,
  variant = 'default',
  persistent = false
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Local state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  
  // Get current route from location if not provided
  const getCurrentRoute = () => {
    return currentRoute || location.pathname;
  };
  
  // Default navigation items based on user role
  const getDefaultItems = () => {
    const baseItems = [
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        route: '/dashboard', 
        icon: 'dashboard',
        roles: ['all']
      },
      { 
        id: 'jobs', 
        label: 'Jobs', 
        route: '/jobs', 
        icon: 'work',
        roles: ['all']
      },
      { 
        id: 'applications', 
        label: 'Applications', 
        route: '/applications', 
        icon: 'application',
        roles: ['jobSeeker', 'agent']
      },
      { 
        id: 'profile', 
        label: 'Profile', 
        route: '/profile', 
        icon: 'person',
        roles: ['all']
      },
      { 
        id: 'notifications', 
        label: 'Notifications', 
        route: '/notifications', 
        icon: 'notifications',
        roles: ['all'],
        badge: notificationCount > 0 ? notificationCount : null
      }
    ];
    
    // Add role-specific items
    if (user?.role === 'agent') {
      baseItems.splice(2, 0, {
        id: 'manage-jobs',
        label: 'Manage Jobs',
        route: '/jobs/manage',
        icon: 'work',
        roles: ['agent']
      });
    }
    
    if (user?.role === 'admin') {
      baseItems.push({
        id: 'admin',
        label: 'Admin',
        route: '/admin',
        icon: 'admin',
        roles: ['admin'],
        children: [
          { id: 'verification', label: 'Verification', route: '/admin/verification', icon: 'document' },
          { id: 'users', label: 'Users', route: '/admin/users', icon: 'person' },
          { id: 'system', label: 'System', route: '/admin/system', icon: 'settings' }
        ]
      });
    }
    
    return baseItems;
  };
  
  // Get navigation items (use provided items or generate defaults)
  const navigationItems = items.length > 0 ? items : getDefaultItems();
  
  // Filter items based on user role
  const getFilteredItems = () => {
    return navigationItems.filter(item => 
      !item.roles || 
      item.roles.includes('all') || 
      (user?.role && item.roles.includes(user.role))
    );
  };
  
  // Get icon component
  const getIcon = (iconName, itemId) => {
    // Check for custom icons first
    if (customIcons[itemId]) {
      return customIcons[itemId];
    }
    
    // Default icon mapping
    const iconMap = {
      dashboard: <DashboardIcon />,
      home: <HomeIcon />,
      work: <WorkIcon />,
      jobs: <WorkIcon />,
      person: <PersonIcon />,
      profile: <PersonIcon />,
      notifications: <NotificationsIcon />,
      application: <ApplicationIcon />,
      document: <DocumentIcon />,
      company: <CompanyIcon />,
      admin: <AdminIcon />,
      settings: <SettingsIcon />,
      help: <HelpIcon />,
      logout: <LogoutIcon />
    };
    
    return iconMap[iconName] || <HomeIcon />;
  };
  
  // Handle navigation
  const handleNavigate = (route, item) => {
    if (onNavigate) {
      onNavigate(route, item);
    } else {
      navigate(route);
    }
    
    // Close drawer if open
    if (drawerOpen && type !== 'bottom') {
      setDrawerOpen(false);
    }
  };
  
  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Handle item expansion in drawer
  const handleItemExpansion = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  // Handle profile click
  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setDrawerOpen(false);
  };
  
  // Check if route is active
  const isRouteActive = (route) => {
    const current = getCurrentRoute();
    return current === route || current.startsWith(route + '/');
  };
  
  // Render bottom navigation
  const renderBottomNavigation = () => {
    const filteredItems = getFilteredItems().slice(0, 5); // Limit to 5 items for bottom nav
    
    return (
      <StyledBottomNavigation
        value={getCurrentRoute()}
        onChange={(event, newValue) => {
          const item = filteredItems.find(item => item.route === newValue);
          if (item) {
            handleNavigate(newValue, item);
          }
        }}
        showLabels={!hideLabels}
        className={styles.bottomNavigation}
      >
        {filteredItems.map((item) => (
          <BottomNavigationAction
            key={item.id}
            label={hideLabels ? undefined : item.label}
            value={item.route}
            icon={
              item.badge ? (
                <Badge badgeContent={item.badge} color="error" max={99}>
                  {getIcon(item.icon, item.id)}
                </Badge>
              ) : (
                getIcon(item.icon, item.id)
              )
            }
          />
        ))}
      </StyledBottomNavigation>
    );
  };
  
  // Render top app bar
  const renderTopAppBar = () => {
    return (
      <StyledAppBar position="fixed" className={styles.appBar}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            className={styles.menuButton}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" className={styles.title}>
            {title}
          </Typography>
          
          {showProfile && (
            <Box className={styles.profileSection}>
              {notificationCount > 0 && (
                <IconButton 
                  color="inherit" 
                  onClick={() => handleNavigate('/notifications')}
                  className={styles.notificationButton}
                >
                  <Badge badgeContent={notificationCount} color="error" max={99}>
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              )}
              
              <IconButton 
                color="inherit" 
                onClick={handleProfileClick}
                className={styles.profileButton}
              >
                <Avatar 
                  src={user?.avatar} 
                  alt={user?.firstName || 'User'}
                  className={styles.avatar}
                >
                  {user?.firstName?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </StyledAppBar>
    );
  };
  
  // Render drawer navigation
  const renderDrawerNavigation = () => {
    const filteredItems = getFilteredItems();
    
    return (
      <StyledDrawer
        variant={persistent ? 'persistent' : 'temporary'}
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        className={styles.drawer}
      >
        <Box className={styles.drawerHeader}>
          <Typography variant="h6" className={styles.drawerTitle}>
            {title}
          </Typography>
          {!persistent && (
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        
        <Divider />
        
        <List className={styles.drawerList}>
          {filteredItems.map((item) => (
            <Box key={item.id}>
              <ListItemButton
                selected={isRouteActive(item.route)}
                onClick={() => {
                  if (item.children) {
                    handleItemExpansion(item.id);
                  } else {
                    handleNavigate(item.route, item);
                  }
                }}
                className={styles.listItem}
              >
                <ListItemIcon className={styles.listItemIcon}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error" max={99}>
                      {getIcon(item.icon, item.id)}
                    </Badge>
                  ) : (
                    getIcon(item.icon, item.id)
                  )}
                </ListItemIcon>
                <ListItemText primary={item.label} />
                {item.children && (
                  expandedItems[item.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />
                )}
              </ListItemButton>
              
              {item.children && (
                <Collapse in={expandedItems[item.id]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.id}
                        selected={isRouteActive(child.route)}
                        onClick={() => handleNavigate(child.route, child)}
                        className={styles.nestedListItem}
                      >
                        <ListItemIcon className={styles.nestedListItemIcon}>
                          {getIcon(child.icon, child.id)}
                        </ListItemIcon>
                        <ListItemText primary={child.label} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          ))}
        </List>
        
        <Divider />
        
        {/* User actions */}
        <List className={styles.userActions}>
          <ListItemButton onClick={() => handleNavigate('/settings')}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
          
          <ListItemButton onClick={() => handleNavigate('/help')}>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary="Help & Support" />
          </ListItemButton>
          
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </List>
      </StyledDrawer>
    );
  };
  
  // Main render based on type
  return (
    <Box className={`${styles.mobileNavigation} ${styles[type]} ${styles[variant]}`}>
      {(type === 'top' || type === 'hybrid') && renderTopAppBar()}
      {(type === 'drawer' || type === 'top' || type === 'hybrid') && renderDrawerNavigation()}
      {(type === 'bottom' || type === 'hybrid') && renderBottomNavigation()}
    </Box>
  );
};

MobileNavigation.propTypes = {
  type: PropTypes.oneOf(['bottom', 'top', 'drawer', 'hybrid']),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      route: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      roles: PropTypes.arrayOf(PropTypes.string),
      badge: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      children: PropTypes.array
    })
  ),
  currentRoute: PropTypes.string,
  onNavigate: PropTypes.func,
  user: PropTypes.shape({
    role: PropTypes.string,
    firstName: PropTypes.string,
    avatar: PropTypes.string
  }),
  notificationCount: PropTypes.number,
  title: PropTypes.string,
  showProfile: PropTypes.bool,
  onProfileClick: PropTypes.func,
  onLogout: PropTypes.func,
  customIcons: PropTypes.object,
  hideLabels: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'minimal', 'material']),
  persistent: PropTypes.bool
};

export default MobileNavigation;