// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  IconButton,
  Collapse,
  Tooltip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Assignment as ApplicationIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
  Business as CompanyIcon,
  Settings as SettingsIcon,
  SupervisorAccount as AdminIcon,
  Help as HelpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import { useResponsive } from '../../utils/responsive';

// Drawer width in expanded state
const drawerWidth = 240;

const Sidebar = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();
  
  const [expanded, setExpanded] = useState(true);
  const [openSubMenu, setOpenSubMenu] = useState('');

  // Toggle sidebar expansion
  const toggleExpanded = () => {
    setExpanded(!expanded);
    // Close submenu when collapsing
    if (expanded) {
      setOpenSubMenu('');
    }
  };

  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      // TODO: Close mobile drawer
    }
  };

  // Toggle submenu
  const handleToggleSubmenu = (menu) => {
    setOpenSubMenu(openSubMenu === menu ? '' : menu);
  };

  // Check if route is active
  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    
    if (path !== '/dashboard' && location.pathname.startsWith(path)) {
      return true;
    }
    
    return false;
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const items = [
      { 
        title: 'Dashboard', 
        icon: <DashboardIcon />, 
        path: '/dashboard',
        roles: ['jobSeeker', 'agent', 'sponsor', 'admin']
      },
      { 
        title: 'Jobs', 
        icon: <WorkIcon />, 
        path: '/jobs',
        roles: ['jobSeeker', 'agent', 'sponsor']
      }
    ];

    // Add items for job seekers
    if (hasRole('jobSeeker')) {
      items.push({ 
        title: 'Applications', 
        icon: <ApplicationIcon />, 
        path: '/applications',
        roles: ['jobSeeker']
      });
      items.push({ 
        title: 'Documents', 
        icon: <DocumentIcon />, 
        path: '/profile/documents',
        roles: ['jobSeeker']
      });
    }

    // Add items for agents
    if (hasRole('agent')) {
      items.push({ 
        title: 'Manage Jobs', 
        icon: <WorkIcon />, 
        path: '/jobs/manage',
        roles: ['agent']
      });
      items.push({ 
        title: 'Candidates', 
        icon: <PersonIcon />, 
        path: '/candidates',
        roles: ['agent']
      });
    }

    // Add items for sponsors
    if (hasRole('sponsor')) {
      items.push({ 
        title: 'My Company', 
        icon: <CompanyIcon />, 
        path: '/company',
        roles: ['sponsor']
      });
      items.push({ 
        title: 'Hiring', 
        icon: <PersonIcon />, 
        path: '/hiring',
        roles: ['sponsor']
      });
    }

    // Add items for admins
    if (hasRole('admin')) {
      items.push({ 
        title: 'Admin Panel', 
        icon: <AdminIcon />, 
        path: '/admin',
        subItems: [
          { title: 'Dashboard', path: '/admin/dashboard' },
          { title: 'Users', path: '/admin/users' },
          { title: 'Jobs', path: '/admin/jobs' },
          { title: 'Verification', path: '/admin/verification' }
        ],
        roles: ['admin']
      });
    }

    // Add profile and settings items for all users
    items.push({ 
      title: 'Profile', 
      icon: <PersonIcon />, 
      path: '/profile',
      roles: ['jobSeeker', 'agent', 'sponsor', 'admin']
    });
    
    items.push({ 
      title: 'Settings', 
      icon: <SettingsIcon />, 
      path: '/settings',
      roles: ['jobSeeker', 'agent', 'sponsor', 'admin']
    });

    // Add help item
    items.push({ 
      title: 'Help & Support', 
      icon: <HelpIcon />, 
      path: '/help',
      roles: ['jobSeeker', 'agent', 'sponsor', 'admin']
    });

    return items;
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? false : true} // This will be controlled by parent component in mobile view
      sx={{
        width: expanded ? drawerWidth : 72,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: expanded ? drawerWidth : 72,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: theme => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <IconButton onClick={toggleExpanded}>
          {expanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      
      <Divider />
      
      <List component="nav" sx={{ mt: 1 }}>
        {getNavigationItems().map((item) => (
          <React.Fragment key={item.title}>
            {item.subItems ? (
              // Menu with submenu
              <>
                <ListItem 
                  button
                  onClick={() => handleToggleSubmenu(item.title)}
                  sx={{
                    backgroundColor: openSubMenu === item.title ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    pl: expanded ? 2 : 1,
                    py: 1,
                  }}
                >
                  <Tooltip title={!expanded ? item.title : ''} placement="right">
                    <ListItemIcon
                      sx={{
                        minWidth: expanded ? 36 : 'auto',
                        color: isActive(item.path) ? 'primary.main' : 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                  </Tooltip>
                  
                  {expanded && (
                    <>
                      <ListItemText 
                        primary={item.title}
                        primaryTypographyProps={{
                          color: isActive(item.path) ? 'primary' : 'inherit',
                          fontWeight: isActive(item.path) ? '500' : 'normal',
                        }}
                      />
                      {openSubMenu === item.title ? <ExpandLess /> : <ExpandMore />}
                    </>
                  )}
                </ListItem>
                
                {expanded && (
                  <Collapse in={openSubMenu === item.title} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <ListItem 
                          key={subItem.path}
                          button
                          onClick={() => handleNavigate(subItem.path)}
                          sx={{
                            pl: 4,
                            py: 0.5,
                            backgroundColor: isActive(subItem.path) ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                          }}
                        >
                          <ListItemText 
                            primary={subItem.title}
                            primaryTypographyProps={{
                              color: isActive(subItem.path) ? 'primary' : 'inherit',
                              fontWeight: isActive(subItem.path) ? '500' : 'normal',
                              fontSize: '0.875rem',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </>
            ) : (
              // Simple menu item
              <ListItem 
                button
                onClick={() => handleNavigate(item.path)}
                sx={{
                  backgroundColor: isActive(item.path) ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  pl: expanded ? 2 : 1,
                  py: 1,
                }}
              >
                <Tooltip title={!expanded ? item.title : ''} placement="right">
                  <ListItemIcon
                    sx={{
                      minWidth: expanded ? 36 : 'auto',
                      color: isActive(item.path) ? 'primary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </Tooltip>
                
                {expanded && (
                  <ListItemText 
                    primary={item.title}
                    primaryTypographyProps={{
                      color: isActive(item.path) ? 'primary' : 'inherit',
                      fontWeight: isActive(item.path) ? '500' : 'normal',
                    }}
                  />
                )}
              </ListItem>
            )}
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;