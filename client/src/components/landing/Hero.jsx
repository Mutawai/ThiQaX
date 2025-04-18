// src/components/landing/Hero.jsx
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Stack,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Security as SecurityIcon, 
  Verified as VerifiedIcon,
  Payment as PaymentIcon,
  TravelExplore as TravelExploreIcon
} from '@mui/icons-material';
import useAuth from '../auth/useAuth';

const Hero = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();

  return (
    <Box
      sx={{
        background: `linear-gradient(to bottom right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        color: 'white',
        pt: { xs: 8, md: 12 },
        pb: { xs: 10, md: 14 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background elements for visual interest */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          zIndex: 0
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                fontWeight: 700,
                mb: 2,
                lineHeight: 1.2
              }}
            >
              Building Trust in <br />
              Middle Eastern Recruitment
            </Typography>

            <Typography
              variant="h2"
              component="p"
              sx={{
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                fontWeight: 400,
                mb: 4,
                opacity: 0.9,
                maxWidth: '90%'
              }}
            >
              ThiQaX connects Kenyan job seekers with trusted
              Middle Eastern employers through blockchain verification.
            </Typography>

            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
              sx={{ mb: 6 }}
            >
              {!isAuthenticated ? (
                <>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    component={RouterLink}
                    to="/register"
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      backgroundColor: 'white',
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      }
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    component={RouterLink}
                    to="/login"
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  >
                    Sign In
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={RouterLink}
                  to="/dashboard"
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    backgroundColor: 'white',
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    }
                  }}
                >
                  Go to Dashboard
                </Button>
              )}
            </Stack>

            {/* Trust indicators */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VerifiedIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">Verified Employers</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">Secure Blockchain</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PaymentIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">Protected Payments</Typography>
              </Box>
            </Box>
          </Grid>

          {/* Hero graphic/illustration */}
          <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box 
              sx={{ 
                position: 'relative',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Paper
                elevation={6}
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  transform: 'perspective(1500px) rotateY(-15deg)',
                  width: '100%',
                  maxWidth: 450,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1
                  }
                }}
              >
                <Box 
                  component="img"
                  src="/images/dashboard-preview.png"
                  alt="ThiQaX Dashboard Preview"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
                
                {/* We'll use a fallback in case the image isn't available */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: theme.palette.primary.light,
                    zIndex: 0
                  }}
                >
                  <TravelExploreIcon sx={{ fontSize: 80, opacity: 0.2 }} />
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Hero;