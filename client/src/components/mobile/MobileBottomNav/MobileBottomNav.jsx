// client/src/components/mobile/MobileBottomNav/MobileBottomNav.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Paper, 
  BottomNavigation, 
  BottomNavigationAction, 
  Badge, 
  Box,
  Fab,
  Zoom,
  useTheme, 
  styled 
} from '@mui/material';
import {
  Home as HomeIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as ApplicationIcon,
  Add as AddIcon,
  MoreHoriz as MoreIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useResponsive } from '../../../utils/responsive';
import styles from './MobileBottomNav.module.css';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper
}));

const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  '& .MuiBottomNavigationAction-root': {
    minWidth: 'auto',
    padding: theme.spacing(1, 0),
    transition: 'all 0.2s ease-in-out',
    '&.Mui-selected': {
      paddingTop: theme.spacing(0.5),
      transform: 'translateY(-2px)',
      '& .MuiBottomNavigationAction-label': {
        fontSize: '0.75rem',
        fontWeight: 600
      }
    }
  },
  '& .MuiBottomNavigationAction-label': {
    fontSize: '0.7rem',
    fontWeight: 500,
    marginTop: theme.spacing(0.5)
  }
}));

/**
 * MobileBottomNav Component
 * 
 * A mobile-optimized bottom navigation component that provides quick access
 * to main app sections with badge support and customizable actions
 * 
 * @param {Object} props - Component props
 * @param {Function} props.toggleDrawer - Function to toggle the navigation drawer
 * @param {Function} props.onNavigate - Custom navigation handler
 * @param {Array} props.customItems - Custom navigation items to override defaults
 * @param {boolean} props.showLabels - Whether to show labels under icons
 * @param {boolean} props.showBadges - Whether to show notification badges
 * @param {boolean} props.showFab - Whether to show floating action button
 * @param {Object} props.fabAction - FAB configuration { icon, onClick, label }
 * @param {string} props.variant - Navigation variant: 'default', 'minimal', 'icons-only'
 * @param {number} props.maxItems - Maximum number of items to show (3-5)
 * @param {boolean} props.hideOnScroll - Whether to hide nav on scroll down
 * @param {string} props.className - Additional CSS class
 * @param {Object} props.customIcons - Custom icons for navigation items
 * @param {boolean} props.disabled - Whether navigation is disabled
 */
const MobileBottomNav = ({
  toggleDrawer,
  onNavigate,
  customItems = [],
  showLabels = true,
  showBadges = true,
  showFab = false,
  fabAction = null,
  variant = 'default',
  maxItems = 5,
  hideOnScroll = false,
  className = '',
  customIcons = {},
  disabled = false
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  // Local state
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Redux state
  const { user } = useSelector(state => state.auth || { user: null });
  const { unreadCount } = useSelector(state => state.notifications || { unreadCount: 0 });
  
  // Handle scroll behavior
  useEffect(() => {
    if (!hideOnScroll) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollThreshold = 100;
      
      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) return;
      
      setIsVisible(!scrollingDown || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, hideOnScroll]);
  
  // Get default navigation items based on user role
  const getDefaultItems = () => {
    const baseItems = [
      {
        id: 'dashboard',
        label: 'Home',
        value: 'dashboard',
        icon: 'dashboard',
        route: '/dashboard',
        roles: ['all']
      },
      {
        id: 'jobs',
        label: 'Jobs',
        value: 'jobs',
        icon: 'work',
        route: '/jobs',
        roles: ['all']
      }
    ];
    
    // Add role-specific items
    if (user?.role === 'jobSeeker') {
      baseItems.push({
        id: 'applications',
        label: 'Applications',
        value: 'applications',
        icon: 'applications',
        route: '/applications',
        roles: ['jobSeeker']
      });
    }
    
    if (user?.role === 'agent') {
      baseItems.push({
        id: 'manage',
        label: 'Manage',
        value: 'jobs-manage',
        icon: 'work',
        route: '/jobs/manage',
        roles: ['agent']
      });
    }
    
    // Common items
    baseItems.push(
      {
        id: 'notifications',
        label: 'Alerts',
        value: 'notifications',
        icon: 'notifications',
        route: '/notifications',
        roles: ['all'],
        badge: showBadges && unreadCount > 0 ? unreadCount : null
      },
      {
        id: 'profile',
        label: 'Profile',
        value: 'profile',
        icon: 'person',
        route: '/profile',
        roles: ['all']
      }
    );
    
    // Add menu if we have more items than maxItems or if toggleDrawer is provided
    if (baseItems.length >= maxItems - 1 || toggleDrawer) {
      baseItems.push({
        id: 'menu',
        label: 'Menu',
        value: 'menu',
        icon: 'menu',
        action: 'drawer',
        roles: ['all']
      });
    }
    
    return baseItems.slice(0, maxItems);
  };
  
  // Get navigation items (use custom items or generate defaults)
  const navigationItems = customItems.length > 0 ? customItems : getDefaultItems();
  
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
      applications: <ApplicationIcon />,
      menu: <MenuIcon />,
      more: <MoreIcon />
    };
    
    return iconMap[iconName] || <HomeIcon />;
  };
  
  // Determine current active route
  const getActiveRoute = () => {
    const path = location.pathname;
    
    // Exact matches
    if (path === '/dashboard') return 'dashboard';
    if (path === '/profile') return 'profile';
    if (path === '/notifications') return 'notifications';
    if (path === '/applications') return 'applications';
    
    // Partial matches
    if (path.startsWith('/jobs/manage')) return 'jobs-manage';
    if (path.startsWith('/jobs')) return 'jobs';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/applications')) return 'applications';
    
    return '';
  };
  
  // Handle navigation
  const handleNavigation = (event, newValue) => {
    if (disabled) return;
    
    const item = getFilteredItems().find(item => item.value === newValue);
    if (!item) return;
    
    // Handle special actions
    if (item.action === 'drawer' && toggleDrawer) {
      toggleDrawer();
      return;
    }
    
    // Handle navigation
    if (item.route) {
      if (onNavigate) {
        onNavigate(item.route, item);
      } else {
        navigate(item.route);
      }
    }
  };
  
  // Handle FAB click
  const handleFabClick = () => {
    if (fabAction && fabAction.onClick) {
      fabAction.onClick();
    }
  };
  
  // Don't render on larger screens
  if (!isMobile) {
    return null;
  }
  
  // Get filtered items
  const filteredItems = getFilteredItems();
  
  return (
    <>
      {/* Bottom Navigation */}
      <Zoom in={isVisible}>
        <StyledPaper 
          elevation={variant === 'minimal' ? 1 : 8}
          className={`${styles.bottomNav} ${styles[variant]} ${className} ${disabled ? styles.disabled : ''}`}
        >
          <StyledBottomNavigation
            value={getActiveRoute()}
            onChange={handleNavigation}
            showLabels={showLabels && variant !== 'icons-only'}
            className={styles.navigation}
          >
            {filteredItems.map((item) => (
              <BottomNavigationAction
                key={item.id}
                label={showLabels && variant !== 'icons-only' ? item.label : undefined}
                value={item.value}
                disabled={disabled}
                className={styles.navigationAction}
                icon={
                  item.badge ? (
                    <Badge 
                      badgeContent={item.badge} 
                      color="error" 
                      max={99}
                      className={styles.badge}
                    >
                      {getIcon(item.icon, item.id)}
                    </Badge>
                  ) : (
                    getIcon(item.icon, item.id)
                  )
                }
              />
            ))}
          </StyledBottomNavigation>
        </StyledPaper>
      </Zoom>
      
      {/* Floating Action Button */}
      {showFab && fabAction && (
        <Zoom in={isVisible}>
          <Fab
            color="primary"
            aria-label={fabAction.label || 'Action'}
            onClick={handleFabClick}
            disabled={disabled}
            className={styles.fab}
          >
            {fabAction.icon || <AddIcon />}
          </Fab>
        </Zoom>
      )}
    </>
  );
};

MobileBottomNav.propTypes = {
  toggleDrawer: PropTypes.func,
  onNavigate: PropTypes.func,
  customItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      route: PropTypes.string,
      action: PropTypes.string,
      roles: PropTypes.arrayOf(PropTypes.string),
      badge: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  ),
  showLabels: PropTypes.bool,
  showBadges: PropTypes.bool,
  showFab: PropTypes.bool,
  fabAction: PropTypes.shape({
    icon: PropTypes.node,
    onClick: PropTypes.func.isRequired,
    label: PropTypes.string
  }),
  variant: PropTypes.oneOf(['default', 'minimal', 'icons-only']),
  maxItems: PropTypes.number,
  hideOnScroll: PropTypes.bool,
  className: PropTypes.string,
  customIcons: PropTypes.object,
  disabled: PropTypes.bool
};

export default MobileBottomNav;