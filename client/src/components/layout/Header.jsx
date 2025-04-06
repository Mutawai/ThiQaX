import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'How It Works', path: '/how-it-works' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

const Header = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isHomePage = location.pathname === '/';
  const isLoggedIn = false; // Replace with actual authentication state

  // Determine if we're on an auth page (login, register)
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  
  // Don't show header on auth pages
  if (isAuthPage) return null;

  const drawer = (
    <Box sx={{ width: 250, pt: 2 }} role="presentation" onClick={handleDrawerToggle}>
      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} pb={2}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          ThiQaX
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <List>
        {navItems.map((item) => (
          <ListItem 
            key={item.name} 
            component={RouterLink} 
            to={item.path}
            selected={location.pathname === item.path}
            sx={{ 
              color: 'inherit',
              '&.Mui-selected': {
                bgcolor: 'rgba(21, 101, 192, 0.1)',
                color: 'primary.main',
              },
              '&:hover': {
                bgcolor: 'rgba(21, 101, 192, 0.05)',
              }
            }}
          >
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', p: 2, gap: 1 }}>
        <Button
          component={RouterLink}
          to="/login"
          variant="outlined"
          color="primary"
          fullWidth
        >
          Login
        </Button>
        <Button
          component={RouterLink}
          to="/register"
          variant="contained"
          color="primary"
          fullWidth
        >
          Register
        </Button>
      </Box>
    </Box>
  );

  return (
    <AppBar 
      position="static" 
      color={isHomePage ? 'transparent' : 'primary'}
      elevation={isHomePage ? 0 : 4}
      sx={{
        bgcolor: isHomePage ? 'transparent' : 'primary.main',
        position: isHomePage ? 'absolute' : 'static',
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              fontWeight: 'bold',
              color: isHomePage ? 'white' : 'inherit',
              textDecoration: 'none',
              flexGrow: { xs: 1, md: 0 },
            }}
          >
            ThiQaX
          </Typography>

          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={mobileOpen}
                onClose={handleDrawerToggle}
              >
                {drawer}
              </Drawer>
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexGrow: 1, ml: 4 }}>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    component={RouterLink}
                    to={item.path}
                    color={isHomePage ? 'white' : 'inherit'}
                    sx={{
                      mx: 2,
                      display: 'block',
                      textDecoration: 'none',
                      fontWeight: location.pathname === item.path ? 'bold' : 'medium',
                      borderBottom: location.pathname === item.path ? '2px solid' : 'none',
                      paddingBottom: '4px',
                      '&:hover': {
                        borderBottom: '2px solid',
                      },
                    }}
                  >
                    {item.name}
                  </Link>
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {isLoggedIn ? (
                  <Button
                    component={RouterLink}
                    to="/dashboard"
                    variant="contained"
                    color={isHomePage ? 'secondary' : 'primary'}
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="outlined"
                      color={isHomePage ? 'inherit' : 'secondary'}
                      sx={{
                        borderColor: isHomePage ? 'white' : undefined,
                        color: isHomePage ? 'white' : undefined,
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/register"
                      variant="contained"
                      color="secondary"
                    >
                      Register
                    </Button>
                  </>
                )}
              </Box>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
