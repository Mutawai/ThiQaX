import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Link,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import PaymentIcon from '@mui/icons-material/Payment';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockIcon from '@mui/icons-material/Lock';

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const features = [
    {
      icon: <ShieldIcon fontSize="large" color="primary" />,
      title: 'Blockchain Verification',
      description: 'Secure, immutable verification of credentials and documents using blockchain technology.'
    },
    {
      icon: <PaymentIcon fontSize="large" color="primary" />,
      title: 'Secure Payments',
      description: 'Transparent escrow payment system ensures fair transactions for all parties.'
    },
    {
      icon: <VerifiedUserIcon fontSize="large" color="primary" />,
      title: 'Trusted Network',
      description: 'Verified agents, job seekers, and sponsors with ratings and reviews you can trust.'
    },
    {
      icon: <LockIcon fontSize="large" color="primary" />,
      title: 'Data Security',
      description: 'Your personal information and documents are encrypted and securely stored.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Account',
      description: 'Sign up as a job seeker, agent, or sponsor in minutes.'
    },
    {
      number: '02',
      title: 'Complete Profile',
      description: 'Upload documents and verify your identity securely.'
    },
    {
      number: '03',
      title: 'Connect',
      description: 'Find the right jobs, candidates, or agents through our trusted network.'
    },
    {
      number: '04',
      title: 'Secure Transactions',
      description: 'Use our escrow system for safe and transparent payments.'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Trust in Recruitment Reimagined
              </Typography>
              <Typography variant="h5" paragraph>
                ThiQaX is the blockchain-powered platform that's revolutionizing Middle Eastern job recruitment with transparency and trust.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  size="large"
                  color="secondary"
                >
                  Get Started
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  Log In
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              {/* Placeholder for hero image */}
              <Box
                sx={{
                  height: { xs: 250, md: 400 },
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="body1" color="white">
                  Hero Image Placeholder
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6 }}
          >
            Why Choose ThiQaX?
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h5" component="h3" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.100' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6 }}
          >
            How It Works
          </Typography>
          <Grid container spacing={4}>
            {steps.map((step, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box
                  sx={{
                    p: 3,
                    position: 'relative',
                    height: '100%'
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      color: 'rgba(0,0,0,0.04)',
                      fontWeight: 'bold',
                      fontSize: { xs: '4rem', md: '5rem' }
                    }}
                  >
                    {step.number}
                  </Typography>
                  <Box sx={{ position: 'relative', mt: 4 }}>
                    <Typography variant="h5" component="h3" gutterBottom>
                      {step.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {step.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              color="primary"
            >
              Join ThiQaX Today
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'primary.dark', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" gutterBottom>
                ThiQaX
              </Typography>
              <Typography variant="body2">
                Revolutionizing recruitment with trust, transparency, and technology.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Link component={RouterLink} to="/register" color="inherit" display="block" sx={{ mb: 1 }}>
                Register
              </Link>
              <Link component={RouterLink} to="/login" color="inherit" display="block" sx={{ mb: 1 }}>
                Login
              </Link>
              <Link component={RouterLink} to="/about" color="inherit" display="block" sx={{ mb: 1 }}>
                About Us
              </Link>
              <Link component={RouterLink} to="/contact" color="inherit" display="block">
                Contact
              </Link>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" gutterBottom>
                Legal
              </Typography>
              <Link component={RouterLink} to="/terms" color="inherit" display="block" sx={{ mb: 1 }}>
                Terms of Service
              </Link>
              <Link component={RouterLink} to="/privacy" color="inherit" display="block" sx={{ mb: 1 }}>
                Privacy Policy
              </Link>
              <Link component={RouterLink} to="/cookies" color="inherit" display="block">
                Cookie Policy
              </Link>
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <Typography variant="body2">
              © {new Date().getFullYear()} ThiQaX. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default LandingPage;
