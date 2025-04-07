// src/components/dashboard/JobSeekerDashboard.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Grid, Typography, Paper, Divider, CircularProgress,
  Button, List, ListItem, ListItemText, ListItemIcon,
  Chip, Card, CardContent, CardActions, Alert
} from '@mui/material';
import {
  WorkOutline, CheckCircle, CancelOutlined, NotificationsActive,
  Assignment, Search, School, Description, MoreHoriz
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  getApplicationStats, 
  getRecentApplications 
} from '../../store/actions/applicationActions';
import { 
  getProfileCompleteness,
  getVerificationStatus 
} from '../../store/actions/profileActions';
import { getRecentJobs } from '../../store/actions/jobActions';
import { getNotifications, markNotificationsAsRead } from '../../store/actions/notificationActions';
import { formatDistanceToNow } from 'date-fns';
import { HelpPanel } from '../documentation/HelpPanel';
import { Tooltip } from '../documentation/Tooltip';
import ResponsiveGrid from '../layout/ResponsiveGrid';
import { useResponsive } from '../../utils/responsive';

const JobSeekerDashboard = () => {
  const dispatch = useDispatch();
  const { isMobile } = useResponsive();
  
  // Redux state
  const { user } = useSelector(state => state.auth);
  const { 
    stats: applicationStats, 
    recentApplications, 
    loading: applicationsLoading 
  } = useSelector(state => state.applications);
  const { 
    profileCompleteness, 
    verificationStatus, 
    loading: profileLoading 
  } = useSelector(state => state.profile);
  const { 
    recentJobs, 
    loading: jobsLoading 
  } = useSelector(state => state.jobs);
  const { 
    notifications, 
    loading: notificationsLoading 
  } = useSelector(state => state.notifications);
  
  const [expanded, setExpanded] = useState(false);
  
  // Fetch dashboard data
  useEffect(() => {
    dispatch(getApplicationStats());
    dispatch(getRecentApplications());
    dispatch(getProfileCompleteness());
    dispatch(getVerificationStatus());
    dispatch(getRecentJobs());
    dispatch(getNotifications());
  }, [dispatch]);
  
  // Handle notification expansion
  const handleExpandClick = () => {
    setExpanded(!expanded);
    
    // Mark notifications as read when expanded
    if (!expanded && notifications?.unreadCount > 0) {
      dispatch(markNotificationsAsRead());
    }
  };
  
  // Loading state
  const isLoading = applicationsLoading || profileLoading || jobsLoading || notificationsLoading;
  
  if (isLoading && !recentApplications && !profileCompleteness) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <HelpPanel workflow="jobseeker-dashboard" />
      
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName || 'User'}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's what's happening with your job search
        </Typography>
      </Box>
      
      {/* Profile Completion Status */}
      {profileCompleteness && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" flexWrap="wrap" justifyContent="space-between">
            <Box width={isMobile ? '100%' : 'auto'} mb={isMobile ? 2 : 0}>
              <Typography variant="h6" gutterBottom>
                Profile Completion
                <Tooltip componentId="profile-completion-indicator">
                  <Box component="span" ml={1} display="inline-flex" alignItems="center">
                    <InfoIcon color="action" fontSize="small" />
                  </Box>
                </Tooltip>
              </Typography>
              <Box display="flex" alignItems="center">
                <Box width="100%" mr={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={profileCompleteness.percentage} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Box minWidth={35}>
                  <Typography variant="body2" color="textSecondary">
                    {profileCompleteness.percentage}%
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box>
              {profileCompleteness.percentage < 100 && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={RouterLink} 
                  to="/profile"
                >
                  Complete Profile
                </Button>
              )}
            </Box>
          </Box>
          
          {profileCompleteness.percentage < 100 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Missing items:
              </Typography>
              <List dense disablePadding>
                {profileCompleteness.missingItems.map((item, index) => (
                  <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CancelOutlined fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Verification Status */}
      {verificationStatus && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Verification Status
            <Tooltip componentId="verification-status">
              <Box component="span" ml={1} display="inline-flex" alignItems="center">
                <InfoIcon color="action" fontSize="small" />
              </Box>
            </Tooltip>
          </Typography>
          
          <ResponsiveGrid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    bgcolor: user?.emailVerified ? 'success.light' : 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 1
                  }}
                >
                  {user?.emailVerified ? (
                    <CheckCircle color="success" />
                  ) : (
                    <CancelOutlined color="error" />
                  )}
                </Box>
                <Typography variant="subtitle1">Email</Typography>
                <Typography variant="body2" color="textSecondary">
                  {user?.emailVerified ? 'Verified' : 'Not Verified'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    bgcolor: user?.phoneVerified ? 'success.light' : 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 1
                  }}
                >
                  {user?.phoneVerified ? (
                    <CheckCircle color="success" />
                  ) : (
                    <CancelOutlined color="error" />
                  )}
                </Box>
                <Typography variant="subtitle1">Phone</Typography>
                <Typography variant="body2" color="textSecondary">
                  {user?.phoneVerified ? 'Verified' : 'Not Verified'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    bgcolor: verificationStatus.identityVerified ? 'success.light' : 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 1
                  }}
                >
                  {verificationStatus.identityVerified ? (
                    <CheckCircle color="success" />
                  ) : (
                    <CancelOutlined color="error" />
                  )}
                </Box>
                <Typography variant="subtitle1">Identity</Typography>
                <Typography variant="body2" color="textSecondary">
                  {verificationStatus.identityVerified ? 'Verified' : 'Not Verified'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    bgcolor: user?.kycVerified ? 'success.light' : 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 1
                  }}
                >
                  {user?.kycVerified ? (
                    <CheckCircle color="success" />
                  ) : (
                    <CancelOutlined color="error" />
                  )}
                </Box>
                <Typography variant="subtitle1">KYC Status</Typography>
                <Typography variant="body2" color="textSecondary">
                  {user?.kycVerified ? 'Verified' : 'Not Verified'}
                </Typography>
              </Box>
            </Grid>
          </ResponsiveGrid>
          
          {(!user?.kycVerified || !verificationStatus.identityVerified) && (
            <Box mt={2} textAlign="center">
              <Button 
                variant="contained" 
                color="primary" 
                component={RouterLink} 
                to="/profile/documents"
              >
                Complete Verification
              </Button>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Your account must be fully verified to apply for jobs
              </Typography>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Application Stats */}
      <ResponsiveGrid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <Assignment color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Applications</Typography>
            </Box>
            <Typography variant="h3" sx={{ my: 2 }}>
              {applicationStats?.total || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total job applications
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Active</Typography>
            </Box>
            <Typography variant="h3" sx={{ my: 2 }}>
              {applicationStats?.active || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Applications in progress
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <School color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Interviews</Typography>
            </Box>
            <Typography variant="h3" sx={{ my: 2 }}>
              {applicationStats?.interviews || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Scheduled interviews
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <Description color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Documents</Typography>
            </Box>
            <Typography variant="h3" sx={{ my: 2 }}>
              {verificationStatus?.documentCount || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Uploaded documents
            </Typography>
          </Paper>
        </Grid>
      </ResponsiveGrid>
      
      <Box mt={4}>
        <ResponsiveGrid>
          {/* Recent Applications */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Applications</Typography>
                <Button 
                  component={RouterLink} 
                  to="/applications" 
                  size="small"
                >
                  View All
                </Button>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {recentApplications?.length > 0 ? (
                <List disablePadding>
                  {recentApplications.slice(0, 5).map((application) => (
                    <ListItem 
                      key={application._id} 
                      divider 
                      component={RouterLink} 
                      to={`/applications/${application._id}`} 
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'inherit',
                        transition: 'background-color 0.3s',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <ListItemIcon>
                        <WorkOutline />
                      </ListItemIcon>
                      <ListItemText
                        primary={application.job?.title || 'Job Title'}
                        secondary={
                          <>
                            {application.job?.company?.name || application.job?.employer?.companyName || 'Company'}
                            <Box component="span" sx={{ display: 'block' }}>
                              Applied {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                            </Box>
                          </>
                        }
                      />
                      <Chip
                        label={application.status.replace('_', ' ')}
                        size="small"
                        color={
                          application.status === 'SUBMITTED' ? 'default' :
                          application.status === 'UNDER_REVIEW' ? 'primary' :
                          application.status === 'SHORTLISTED' ? 'secondary' :
                          application.status === 'INTERVIEW_SCHEDULED' ? 'info' :
                          application.status === 'OFFER_EXTENDED' ? 'success' :
                          application.status === 'HIRED' ? 'success' :
                          application.status === 'REJECTED' ? 'error' : 'default'
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Assignment color="action" sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1" gutterBottom>
                    No applications yet
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    component={RouterLink} 
                    to="/jobs" 
                    startIcon={<Search />}
                    sx={{ mt: 2 }}
                  >
                    Find Jobs
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Recommended Jobs */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recommended Jobs</Typography>
                <Button 
                  component={RouterLink} 
                  to="/jobs" 
                  size="small"
                >
                  View All
                </Button>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {recentJobs?.length > 0 ? (
                <Grid container spacing={2}>
                  {recentJobs.slice(0, 3).map((job) => (
                    <Grid item xs={12} key={job._id}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: 1 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            {job.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            {job.company?.name || job.employer?.companyName || 'Company'}
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1} mt={1} mb={1}>
                            <Chip 
                              label={job.location} 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              label={job.jobType?.replace('_', ' ')} 
                              size="small" 
                              variant="outlined"
                            />
                            {job.featured && (
                              <Chip 
                                label="Featured" 
                                size="small"
                                color="primary" 
                              />
                            )}
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            component={RouterLink} 
                            to={`/jobs/${job._id}`}
                          >
                            View Details
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box textAlign="center" py={3}>
                  <Search color="action" sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                  <Typography v
