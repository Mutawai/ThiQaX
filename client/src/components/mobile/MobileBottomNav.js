// src/components/mobile/MobileBottomNav.js
import React from 'react';
import { 
  Paper, BottomNavigation, BottomNavigationAction, 
  Badge, useTheme, styled
} from '@mui/material';
import {
  Home as HomeIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useResponsive } from '../../utils/responsive';

const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  '& .MuiBottomNavigationAction-root': {
    minWidth: 'auto',
    padding: theme.spacing(1, 0),
  },
  '& .Mui-selected': {
    paddingTop: theme.spacing(0.5),
  }
}));

/**
 * Mobile Bottom Navigation Component
 * Shows navigation icons fixed to bottom of screen on mobile devices
 */
const MobileBottomNav = ({ toggleDrawer }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  // Get unread notification count from Redux store
  const { unreadCount } = useSelector(state => state.notifications);
  
  // Determine current active route
  const getActiveRoute = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path.startsWith('/jobs')) return 'jobs';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/notifications')) return 'notifications';
    return '';
  };
  
  // Handle navigation
  const handleNavigation = (event, newRoute) => {
    if (newRoute === 'menu') {
      toggleDrawer();
    } else {
      navigate(`/${newRoute}`);
    }
  };
  
  // Don't show on larger screens
  if (!isMobile) {
    return null;
  }
  
  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: theme.zIndex.appBar,
        elevation: 8
      }} 
      elevation={3}
    >
      <StyledBottomNavigation
        value={getActiveRoute()}
        onChange={handleNavigation}
        showLabels
      >
        <BottomNavigationAction 
          label="Home" 
          value="dashboard" 
          icon={<HomeIcon />} 
        />
        <BottomNavigationAction 
          label="Jobs" 
          value="jobs" 
          icon={<WorkIcon />} 
        />
        <BottomNavigationAction 
          label="Profile" 
          value="profile" 
          icon={<PersonIcon />} 
        />
        <BottomNavigationAction 
          label="Alerts" 
          value="notifications" 
          icon={
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              max={99}
            >
              <NotificationsIcon />
            </Badge>
          } 
        />
        <BottomNavigationAction 
          label="Menu" 
          value="menu" 
          icon={<MenuIcon />} 
        />
      </StyledBottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;

// src/components/mobile/MobileHeader.js
import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, 
  Box, Avatar, Menu, MenuItem, ListItemIcon,
  ListItemText, useTheme, styled, Badge
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/actions/authActions';
import { useResponsive } from '../../utils/responsive';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary
}));

/**
 * Mobile Header Component
 * Shows a simplified header optimized for mobile screens
 */
const MobileHeader = ({ toggleDrawer }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isMobile } = useResponsive();
  
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  
  // Get user and notification data from Redux
  const { user } = useSelector(state => state.auth);
  const { unreadCount } = useSelector(state => state.notifications);
  
  // Handle menu open
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    handleMenuClose();
    dispatch(logout());
    navigate('/auth/login');
  };
  
  // Handle navigation
  const handleNavigation = (path) => {
    handleMenuClose();
    navigate(path);
  };
  
  // Determine page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/jobs') return 'Find Jobs';
    if (path === '/jobs/manage') return 'Manage Jobs';
    if (path === '/applications') return 'My Applications';
    if (path === '/profile') return 'My Profile';
    if (path === '/profile/documents') return 'My Documents';
    if (path === '/notifications') return 'Notifications';
    if (path.startsWith('/jobs/') && path !== '/jobs/create') return 'Job Details';
    if (path === '/jobs/create') return 'Post a Job';
    if (path.startsWith('/applications/')) return 'Application Details';
    if (path.startsWith('/admin/')) return 'Admin Panel';
    return 'ThiQaX';
  };
  
  // Determine if back button should be shown
  const shouldShowBackButton = () => {
    const path = location.pathname;
    return path !== '/dashboard' && 
           path !== '/jobs' && 
           path !== '/applications' && 
           path !== '/profile' && 
           path !== '/notifications';
  };
  
  // Don't show on larger screens
  if (!isMobile) {
    return null;
  }
  
  return (
    <StyledAppBar position="fixed">
      <Toolbar>
        {shouldShowBackButton() ? (
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
        ) : (
          <IconButton edge="start" color="inherit" onClick={toggleDrawer}>
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
          {getPageTitle()}
        </Typography>
        
        <Box>
          <IconButton 
            color="inherit" 
            onClick={() => navigate('/notifications')}
            edge="end"
          >
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem'
              }}
            >
              {user?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Box>
      </Toolbar>
      
      {/* User Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
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
    </StyledAppBar>
  );
};

export default MobileHeader;

// src/components/mobile/MobileLayout.js
import React, { useState } from 'react';
import { 
  Box, Drawer, List, ListItem, ListItemIcon, 
  ListItemText, Divider, Toolbar, Typography, 
  useTheme
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
import { logout } from '../../store/actions/authActions';
import { useResponsive } from '../../utils/responsive';
import MobileHeader from './MobileHeader';
import MobileBottomNav from './MobileBottomNav';

// Drawer width
const drawerWidth = 240;

/**
 * Mobile Layout Component
 * Provides mobile-optimized layout with header, drawer and bottom navigation
 */
const MobileLayout = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isMobile } = useResponsive();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Get user from Redux store
  const { user } = useSelector(state => state.auth);
  
  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Handle navigation from drawer
  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };
  
  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
    setDrawerOpen(false);
  };
  
  // Get navigation items based on user role
  const getNavigationItems = () => {
    const items = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Find Jobs', icon: <WorkIcon />, path: '/jobs' },
      { text: 'My Applications', icon: <ApplicationIcon />, path: '/applications' },
      { text: 'My Profile', icon: <PersonIcon />, path: '/profile' }
    ];
    
    // Add role-specific items
    if (user?.role === 'jobSeeker') {
      items.push({ 
        text: 'My Documents', 
        icon: <DocumentIcon />, 
        path: '/profile/documents' 
      });
    }
    
    if (user?.role === 'agent') {
      items.push({ 
        text: 'Manage Jobs', 
        icon: <WorkIcon />, 
        path: '/jobs/manage' 
      });
      items.push({ 
        text: 'Post a Job', 
        icon: <WorkIcon />, 
        path: '/jobs/create' 
      });
    }
    
    if (user?.role === 'sponsor') {
      items.push({ 
        text: 'My Company', 
        icon: <CompanyIcon />, 
        path: '/company' 
      });
    }
    
    if (user?.role === 'admin') {
      items.push({ 
        text: 'Admin Panel', 
        icon: <AdminIcon />, 
        path: '/admin' 
      });
      items.push({ 
        text: 'Verification', 
        icon: <DocumentIcon />, 
        path: '/admin/verification' 
      });
    }
    
    // Add common items at the end
    items.push({ text: 'Settings', icon: <SettingsIcon />, path: '/settings' });
    items.push({ text: 'Help & Support', icon: <HelpIcon />, path: '/help' });
    
    return items;
  };
  
  // If not mobile, render children directly
  if (!isMobile) {
    return children;
  }
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Mobile Header */}
      <MobileHeader toggleDrawer={toggleDrawer} />
      
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
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
        <Toolbar sx={{ justifyContent: 'center' }}>
          <Typography variant="h6" color="primary">
            ThiQaX
          </Typography>
        </Toolbar>
        <Divider />
        
        <List>
          {getNavigationItems().map((item) => (
            <ListItem 
              button 
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        
        <Divider />
        
        <List>
          <ListItem button onClick={handleLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: '64px', // Height of the header
          pb: '56px', // Height of the bottom nav
          px: 2
        }}
      >
        {children}
      </Box>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav toggleDrawer={toggleDrawer} />
    </Box>
  );
};

export default MobileLayout;

// src/components/mobile/MobileJobCard.js
import React from 'react';
import {
  Card, CardContent, Typography, Box, Chip, Button,
  CardActions, Avatar, styled
} from '@mui/material';
import {
  LocationOn, WorkOutline, AttachMoney, AccessTime
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const CompactCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(1.5),
  '&:last-child': {
    paddingBottom: theme.spacing(1.5),
  },
}));

const CompactCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(0, 1.5, 1.5, 1.5),
  justifyContent: 'space-between'
}));

/**
 * Mobile-optimized Job Card Component
 * A compact version of the job card for mobile screens
 */
const MobileJobCard = ({ job }) => {
  const navigate = useNavigate();
  
  // Format salary range
  const formatSalary = () => {
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    } else if (job.salaryMin) {
      return `From $${job.salaryMin.toLocaleString()}`;
    } else if (job.salaryMax) {
      return `Up to $${job.salaryMax.toLocaleString()}`;
    } else {
      return 'Salary not specified';
    }
  };
  
  // Format job type
  const formatJobType = () => {
    return job.jobType ? job.jobType.replace('_', ' ') : 'Not specified';
  };
  
  // Handle click
  const handleClick = () => {
    navigate(`/jobs/${job._id}`);
  };
  
  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CompactCardContent>
        <Box display="flex" alignItems="center">
          <Avatar
            src={job.company?.logo || ''}
            alt={job.company?.name || job.employer?.companyName || 'Company'}
            sx={{ width: 40, height: 40, mr: 1.5 }}
          >
            {(job.company?.name || job.employer?.companyName || 'C').charAt(0)}
          </Avatar>
          
          <Box>
            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium', lineHeight: 1.3 }}>
              {job.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {job.company?.name || job.employer?.companyName || 'Company Name'}
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" flexWrap="wrap" mt={1.5} gap={1}>
          <Chip
            icon={<LocationOn fontSize="small" />}
            label={job.location}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<WorkOutline fontSize="small" />}
            label={formatJobType()}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<AttachMoney fontSize="small" />}
            label={formatSalary()}
            size="small"
            variant="outlined"
          />
        </Box>
      </CompactCardContent>
      
      <CompactCardActions>
        <Box display="flex" alignItems="center">
          <AccessTime fontSize="small" color="action" sx={{ mr: 0.5 }} />
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
          </Typography>
        </Box>
        
        <Button 
          size="small" 
          variant="contained"
          onClick={handleClick}
        >
          View
        </Button>
      </CompactCardActions>
    </Card>
  );
};

export default MobileJobCard;

// src/components/mobile/MobileFormField.js
import React from 'react';
import {
  TextField, FormControl, InputLabel, Select,
  MenuItem, FormHelperText, Checkbox, FormControlLabel,
  Typography, Box, styled
} from '@mui/material';

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiInputBase-input': {
    fontSize: '0.9rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.9rem',
  },
  '& .MuiFormHelperText-root': {
    marginTop: 0,
    fontSize: '0.75rem',
  }
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiInputLabel-root': {
    fontSize: '0.9rem',
  },
  '& .MuiSelect-select': {
    fontSize: '0.9rem',
  },
  '& .MuiFormHelperText-root': {
    marginTop: 0,
    fontSize: '0.75rem',
  }
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiFormControlLabel-label': {
    fontSize: '0.9rem',
  }
}));

/**
 * Mobile Form Field Component
 * A responsive form field that adjusts for mobile screens
 * @param {Object} props - Component props
 * @param {string} props.type - Field type (text, select, checkbox, etc.)
 * @param {string} props.name - Field name
 * @param {string} props.label - Field label
 * @param {any} props.value - Field value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.error - Whether field has error
 * @param {string} props.helperText - Helper text or error message
 * @param {Object} props.options - Options for select fields
 */
const MobileFormField = ({
  type = 'text',
  name,
  label,
  value,
  onChange,
  error = false,
  helperText = '',
  options = [],
  fullWidth = true,
  required = false,
  ...props
}) => {
  // Render text, email, password, number, date fields
  if (['text', 'email', 'password', 'number', 'date', 'tel'].includes(type)) {
    return (
      <StyledTextField
        type={type}
        name={name}
        label={label}
        value={value}
        onChange={onChange}
        error={error}
        helperText={helperText}
        fullWidth={fullWidth}
        required={required}
        size="small"
        {...props}
      />
    );
  }
  
  // Render textarea
  if (type === 'textarea') {
    return (
      <StyledTextField
        name={name}
        label={label}
        value={value}
        onChange={onChange}
  
