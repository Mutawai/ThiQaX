// client/src/components/mobile/MobileLayout/MobileLayout.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Drawer, 
  List, 
  ListItemButton,
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Toolbar, 
  Typography, 
  useTheme,
  styled
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Assignment as ApplicationIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
  Business as CompanyIcon,
  SupervisorAccount as AdminIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../../store/actions/authActions';
import { useResponsive } from '../../../utils/responsive';
import MobileHeader from '../MobileHeader/MobileHeader';
import MobileBottomNav from '../MobileBottomNav/MobileBottomNav';
import styles from './MobileLayout.module.css';

// Styled components
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh'
}));

/**
 * MobileLayout Component
 * 
 * Provides mobile-optimized layout with header, drawer and bottom navigation
 * Automatically adapts between mobile and desktop layouts
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render in the main area
 * @param {boolean} props.showHeader - Whether to show the mobile header
 * @param {boolean} props.showBottomNav - Whether to show bottom navigation
 * @param {boolean} props.showDrawer - Whether drawer navigation is enabled
 * @param {Function} props.onNavigate - Custom navigation handler
 * @param {Function} props.onLogout - Custom logout handler
 * @param {Array} props.customNavigationItems - Custom navigation items
 * @param {string} props.drawerTitle - Title to display in drawer header
 * @param {boolean} props.persistent - Whether drawer should be persistent
 * @param {string} props.className - Additional CSS class
 */
const MobileLayout = ({
  children,
  showHeader = true,
  showBottomNav = true,
  showDrawer = true,
  onNavigate,
  onLogout,
  customNavigationItems = [],
  drawerTitle = 'ThiQaX',
  persistent = false,
  className = ''
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isMobile } = useResponsive();
  
  // Local state
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Get user from Redux store
  const { user } = useSelector(state => state.auth);
  
  // Auto-close drawer on route change (mobile only)
  useEffect(() => {
    if (isMobile && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Handle navigation from drawer
  const handleNavigation = (path, item) => {
    if (onNavigate) {
      onNavigate(path, item);
    } else {
      navigate(path);
    }
    
    if (isMobile) {
      setDrawerOpen(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      dispatch(logout());
      navigate('/auth/login');
    }
    
    if (isMobile) {
      setDrawerOpen(false);
    }
  };
  
  // Get navigation items based on user role
  const getNavigationItems = () => {
    // Use custom items if provided
    if (customNavigationItems.length > 0) {
      return customNavigationItems;
    }
    
    const items = [
      { 
        id: 'dashboard',
        text: 'Dashboard', 
        icon: <DashboardIcon />, 
        path: '/dashboard',
        roles: ['all']
      },
      { 
        id: 'jobs',
        text: 'Find Jobs', 
        icon: <WorkIcon />, 
        path: '/jobs',
        roles: ['all']
      },
      { 
        id: 'applications',
        text: 'My Applications', 
        icon: <ApplicationIcon />, 
        path: '/applications',
        roles: ['jobSeeker', 'agent']
      },
      { 
        id: 'profile',
        text: 'My Profile', 
        icon: <PersonIcon />, 
        path: '/profile',
        roles: ['all']
      }
    ];
    
    // Add role-specific items
    if (user?.role === 'jobSeeker') {
      items.push({ 
        id: 'documents',
        text: 'My Documents', 
        icon: <DocumentIcon />, 
        path: '/profile/documents',
        roles: ['jobSeeker']
      });
    }
    
    if (user?.role === 'agent') {
      items.push({ 
        id: 'manage-jobs',
        text: 'Manage Jobs', 
        icon: <WorkIcon />, 
        path: '/jobs/manage',
        roles: ['agent']
      });
      items.push({ 
        id: 'post-job',
        text: 'Post a Job', 
        icon: <WorkIcon />, 
        path: '/jobs/create',
        roles: ['agent']
      });
    }
    
    if (user?.role === 'sponsor') {
      items.push({ 
        id: 'company',
        text: 'My Company', 
        icon: <CompanyIcon />, 
        path: '/company',
        roles: ['sponsor']
      });
    }
    
    if (user?.role === 'admin') {
      items.push({ 
        id: 'admin',
        text: 'Admin Panel', 
        icon: <AdminIcon />, 
        path: '/admin',
        roles: ['admin']
      });
      items.push({ 
        id: 'verification',
        text: 'Verification', 
        icon: <DocumentIcon />, 
        path: '/admin/verification',
        roles: ['admin']
      });
    }
    
    // Add common items at the end
    items.push({ 
      id: 'settings',
      text: 'Settings', 
      icon: <SettingsIcon />, 
      path: '/settings',
      roles: ['all']
    });
    items.push({ 
      id: 'help',
      text: 'Help & Support', 
      icon: <HelpIcon />, 
      path: '/help',
      roles: ['all']
    });
    
    return items;
  };
  
  // Filter items based on user role
  const getFilteredNavigationItems = () => {
    const items = getNavigationItems();
    
    return items.filter(item => {
      if (!item.roles) return true;
      if (item.roles.includes('all')) return true;
      return user?.role && item.roles.includes(user.role);
    });
  };
  
  // Check if current path is active
  const isPathActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  // Render drawer content
  const renderDrawerContent = () => (
    <>
      <Toolbar className={styles.drawerHeader}>
        <Typography variant="h6" className={styles.drawerTitle}>
          {drawerTitle}
        </Typography>
      </Toolbar>
      
      <Divider />
      
      <List className={styles.navigationList}>
        {getFilteredNavigationItems().map((item) => (
          <ListItemButton
            key={item.id}
            onClick={() => handleNavigation(item.path, item)}
            selected={isPathActive(item.path)}
            className={`${styles.navigationItem} ${isPathActive(item.path) ? styles.activeItem : ''}`}
          >
            <ListItemIcon className={styles.navigationIcon}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              className={styles.navigationText}
            />
          </ListItemButton>
        ))}
      </List>
      
      <Divider />
      
      <List className={styles.actionsList}>
        <ListItemButton 
          onClick={handleLogout}
          className={styles.logoutItem}
        >
          <ListItemIcon className={styles.navigationIcon}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            className={styles.navigationText}
          />
        </ListItemButton>
      </List>
    </>
  );
  
  // If not mobile, render children directly (or implement desktop layout)
  if (!isMobile) {
    return (
      <Box className={`${styles.desktopLayout} ${className}`}>
        {children}
      </Box>
    );
  }
  
  return (
    <Box className={`${styles.mobileLayout} ${className}`}>
      {/* Mobile Header */}
      {showHeader && (
        <MobileHeader 
          toggleDrawer={showDrawer ? toggleDrawer : undefined}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
      )}
      
      {/* Mobile Drawer */}
      {showDrawer && (
        <StyledDrawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer}
          variant={persistent ? 'persistent' : 'temporary'}
          className={styles.drawer}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
        >
          {renderDrawerContent()}
        </StyledDrawer>
      )}
      
      {/* Main Content */}
      <MainContent 
        component="main" 
        className={styles.mainContent}
        style={{
          paddingTop: showHeader ? '64px' : 0,
          paddingBottom: showBottomNav ? '56px' : 0,
        }}
      >
        <Box className={styles.contentArea}>
          {children}
        </Box>
      </MainContent>
      
      {/* Mobile Bottom Navigation */}
      {showBottomNav && (
        <MobileBottomNav 
          toggleDrawer={showDrawer ? toggleDrawer : undefined}
          onNavigate={onNavigate}
        />
      )}
    </Box>
  );
};

MobileLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showHeader: PropTypes.bool,
  showBottomNav: PropTypes.bool,
  showDrawer: PropTypes.bool,
  onNavigate: PropTypes.func,
  onLogout: PropTypes.func,
  customNavigationItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
      path: PropTypes.string.isRequired,
      roles: PropTypes.arrayOf(PropTypes.string)
    })
  ),
  drawerTitle: PropTypes.string,
  persistent: PropTypes.bool,
  className: PropTypes.string
};

export default MobileLayout;