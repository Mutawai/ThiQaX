// src/components/landing/Features.jsx
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  useTheme,
  Avatar,
  Button
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  AccountBalance as AccountBalanceIcon,
  DocumentScanner as DocumentScannerIcon,
  SupportAgent as SupportAgentIcon,
  PhoneAndroid as PhoneAndroidIcon
} from '@mui/icons-material';
import ResponsiveGrid from '../layout/ResponsiveGrid';

const FeatureCard = ({ icon, title, description }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <Avatar
        sx={{
          bgcolor: `${theme.palette.primary.main}15`,
          color: theme.palette.primary.main,
          width: 60,
          height: 60,
          mb: 2
        }}
      >
        {icon}
      </Avatar>
      <Typography variant="h6" component="h3" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
        {description}
      </Typography>
    </Paper>
  );
};

const Features = () => {
  const theme = useTheme();
  
  const features = [
    {
      icon: <VerifiedIcon fontSize="large" />,
      title: "Blockchain-Verified Information",
      description: "All credentials, job contracts, and transactions are secured on an immutable blockchain ledger, ensuring authenticity and preventing fraud."
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      title: "AI-Powered Verification",
      description: "Advanced artificial intelligence algorithms detect potentially fraudulent activities and validate document authenticity."
    },
    {
      icon: <AccountBalanceIcon fontSize="large" />,
      title: "Escrow-based Payment System",
      description: "Secure financial transactions with real-time auditing ensure fair compensation and protect both employers and job seekers."
    },
    {
      icon: <DocumentScannerIcon fontSize="large" />,
      title: "KYC-based Digital Identity",
      description: "Comprehensive Know Your Customer verification process establishes trust through validated digital identities for all participants."
    },
    {
      icon: <SupportAgentIcon fontSize="large" />,
      title: "Automated Dispute Resolution",
      description: "Fair and efficient conflict mediation through our transparent resolution system protects all stakeholders' interests."
    },
    {
      icon: <PhoneAndroidIcon fontSize="large" />,
      title: "Mobile-First Experience",
      description: "Intuitive, responsive design optimized for Kenyan Gen Z job seekers provides access anywhere, even with limited connectivity."
    }
  ];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: theme.palette.background.default
      }}
    >
      <Container maxWidth="lg">
        <Box textAlign="center" mb={8}>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 2
            }}
          >
            Key Platform Features
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{
              fontSize: { xs: '1rem', md: '1.25rem' },
              fontWeight: 400,
              color: 'text.secondary',
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            ThiQaX leverages cutting-edge technology to create a 
            transparent and secure recruitment ecosystem.
          </Typography>
        </Box>

        <ResponsiveGrid>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <FeatureCard {...feature} />
            </Grid>
          ))}
        </ResponsiveGrid>

        <Box textAlign="center" mt={8}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={RouterLink}
            to="/register"
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            Join ThiQaX Today
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Features;