// src/components/profile/ProfileCompletion.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Divider,
  Grid,
  Tooltip,
  Skeleton,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Language as LanguageIcon,
  Description as DescriptionIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getProfileCompleteness } from '../../store/actions/profileActions';
import useAuth from '../auth/useAuth';

const ProfileCompletionSection = ({ title, items, icon: Icon, linkTo }) => {
  // Calculate completion percentage for this section
  const completedItems = items.filter(item => item.completed).length;
  const percentage = Math.round((completedItems / items.length) * 100);

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Box
          sx={{
            backgroundColor: 'primary.light',
            color: 'primary.main',
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2
          }}
        >
          <Icon />
        </Box>
        <Typography variant="h6">{title}</Typography>
        <Box sx={{ ml: 'auto' }}>
          <Chip 
            label={`${percentage}%`} 
            color={
              percentage === 100 ? 'success' :
              percentage >= 50 ? 'primary' : 
              'warning'
            }
            size="small"
          />
        </Box>
      </Box>

      <List dense disablePadding>
        {items.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ py: 0.75 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              {item.completed ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : (
                <CancelIcon color="error" fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                variant: 'body2',
                color: item.completed ? 'text.primary' : 'text.secondary'
              }}
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          component={RouterLink}
          to={linkTo}
          size="small"
          endIcon={<ArrowForwardIcon />}
        >
          Complete Section
        </Button>
      </Box>
    </Paper>
  );
};

const ProfileCompletion = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { profileCompleteness, loading, error } = useSelector(state => state.profile);

  useEffect(() => {
    dispatch(getProfileCompleteness());
  }, [dispatch]);

  // Organize missing items by section
  const getSectionItems = (section) => {
    if (!profileCompleteness) return [];

    // Map of section identifiers to their expected fields
    const sectionToFields = {
      personal: ['firstName', 'lastName', 'phone', 'dateOfBirth', 'nationality', 'profileImage'],
      contact: ['address', 'city', 'country'],
      education: ['education'],
      experience: ['experience'],
      skills: ['skills'],
      languages: ['languages'],
      documents: ['identityDocument', 'educationCertificate', 'professionalCertificate']
    };

    const expectedFields = sectionToFields[section] || [];
    const missingFields = profileCompleteness.missingItems || [];

    // Create items list for the section
    return expectedFields.map(field => {
      // Check if this field is in the missing fields list
      const isMissing = missingFields.some(item => 
        item.toLowerCase().includes(field.toLowerCase())
      );

      return {
        label: field
          .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
          .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
          .replace('Identity Document', 'ID/Passport')
          .replace('Education Certificate', 'Education Certificates')
          .replace('Professional Certificate', 'Professional Certificates'),
        completed: !isMissing
      };
    });
  };

  if (loading && !profileCompleteness) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" width="100%" height={20} sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" width="100%" height={200} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" width="100%" height={200} />
          </Grid>
        </Grid>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!profileCompleteness) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Profile completeness information is currently unavailable. Please try again later.
      </Alert>
    );
  }

  // Profile verification status
  const isProfileVerified = user?.kycVerified;

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom>
              Profile Completion: {profileCompleteness.percentage}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={profileCompleteness.percentage} 
              sx={{ height: 10, borderRadius: 5, mb: 2 }} 
            />
            
            {profileCompleteness.percentage < 100 ? (
              <Typography variant="body2" color="text.secondary">
                Complete your profile to increase your chances of getting hired. Employers are more
                likely to consider candidates with complete profiles.
              </Typography>
            ) : (
              <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ mr: 1 }} />
                Your profile is complete! This gives you the best chance of being noticed by employers.
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
              <Chip 
                icon={isProfileVerified ? <VerifiedUserIcon /> : <WarningIcon />}
                label={isProfileVerified ? "Profile Verified" : "Verification Required"}
                color={isProfileVerified ? "success" : "warning"}
                sx={{ mb: 1 }}
              />
              
              <Button
                variant="contained"
                color={profileCompleteness.percentage < 100 ? "primary" : "success"}
                component={RouterLink}
                to="/profile"
                sx={{ mt: 1 }}
              >
                {profileCompleteness.percentage < 100 ? "Complete Profile" : "View Profile"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <ProfileCompletionSection 
            title="Personal Information" 
            items={getSectionItems('personal')}
            icon={PersonIcon}
            linkTo="/profile"
          />
        </Grid>
        
        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <ProfileCompletionSection 
            title="Contact Information" 
            items={getSectionItems('contact')}
            icon={DescriptionIcon}
            linkTo="/profile"
          />
        </Grid>
        
        {/* Education */}
        <Grid item xs={12} md={6}>
          <ProfileCompletionSection 
            title="Education" 
            items={getSectionItems('education')}
            icon={SchoolIcon}
            linkTo="/profile"
          />
        </Grid>
        
        {/* Work Experience */}
        <Grid item xs={12} md={6}>
          <ProfileCompletionSection 
            title="Work Experience" 
            items={getSectionItems('experience')}
            icon={WorkIcon}
            linkTo="/profile"
          />
        </Grid>
        
        {/* Skills & Languages */}
        <Grid item xs={12} md={6}>
          <ProfileCompletionSection 
            title="Skills & Languages" 
            items={[...getSectionItems('skills'), ...getSectionItems('languages')]}
            icon={LanguageIcon}
            linkTo="/profile"
          />
        </Grid>
        
        {/* Documents & Verification */}
        <Grid item xs={12} md={6}>
          <ProfileCompletionSection 
            title="Documents & Verification" 
            items={getSectionItems('documents')}
            icon={VerifiedUserIcon}
            linkTo="/profile/documents"
          />
        </Grid>
      </Grid>

      {profileCompleteness.percentage < 100 && (
        <Alert 
          severity="info" 
          variant="outlined"
          sx={{ mt: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Why is profile completion important?
          </Typography>
          <Typography variant="body2">
            Employers on ThiQaX prioritize candidates with complete profiles. A complete profile increases your visibility
            in search results and demonstrates your professionalism and commitment to potential employers.
            Complete your profile to stand out from other candidates.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default ProfileCompletion;