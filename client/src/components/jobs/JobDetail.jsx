// src/components/jobs/JobDetail.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Stack,
  useTheme,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  WorkOutline as WorkIcon,
  AttachMoney as SalaryIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  VerifiedUser as VerifiedUserIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Check as CheckIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getJobDetails, saveJob, unsaveJob } from '../../store/actions/jobActions';
import { checkApplicationEligibility } from '../../store/actions/applicationActions';
import { format, differenceInDays, formatDistanceToNow } from 'date-fns';
import ApplyModal from './ApplyModal';
import useAuth from '../auth/useAuth';
import { HelpPanel } from '../documentation/HelpPanel';
import { Tooltip } from '../documentation/Tooltip';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { isAuthenticated, user } = useAuth();
  
  const { job, loading, error, saved } = useSelector(state => state.jobs);
  const { eligibility, loading: eligibilityLoading } = useSelector(state => state.applications);
  
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Load job data
  useEffect(() => {
    if (id) {
      dispatch(getJobDetails(id));
    }
    
    // Check if the job is saved
    if (saved && Array.isArray(saved)) {
      setIsSaved(saved.includes(id));
    }
  }, [dispatch, id, saved]);
  
  // Check eligibility to apply if authenticated
  useEffect(() => {
    if (isAuthenticated && job && user.role === 'jobSeeker') {
      dispatch(checkApplicationEligibility(job._id));
    }
  }, [dispatch, isAuthenticated, job, user]);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/jobs')}
        >
          Back to Jobs
        </Button>
      </Box>
    );
  }
  
  if (!job) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Job not found. It may have been removed or you don't have permission to view it.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/jobs')}
          sx={{ mt: 2 }}
        >
          Back to Jobs
        </Button>
      </Box>
    );
  }
  
  // Format dates
  const formattedPostedDate = job.createdAt ? format(new Date(job.createdAt), 'MMM d, yyyy') : 'N/A';
  const formattedDeadline = job.deadline ? format(new Date(job.deadline), 'MMM d, yyyy') : 'N/A';
  
  // Days remaining until deadline
  const daysRemaining = job.deadline ? differenceInDays(new Date(job.deadline), new Date()) : null;
  
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
  
  // Check if job is expired
  const isJobExpired = job.status === 'CLOSED' || (job.deadline && new Date(job.deadline) < new Date());
  
  // Handle apply button click
  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate('/auth/login', { 
        state: { from: `/jobs/${id}`, message: 'Please log in to apply for this job' } 
      });
      return;
    }
    
    setApplyModalOpen(true);
  };
  
  // Handle save/unsave job
  const handleSaveToggle = () => {
    if (!isAuthenticated) {
      navigate('/auth/login', {
        state: { from: `/jobs/${id}`, message: 'Please log in to save jobs' }
      });
      return;
    }
    
    if (isSaved) {
      dispatch(unsaveJob(job._id));
    } else {
      dispatch(saveJob(job._id));
    }
    
    setIsSaved(!isSaved);
  };
  
  // Handle share job
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job: ${job.title} at ${job.company?.name || job.employer?.companyName}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You would normally show a toast notification here
      alert('Link copied to clipboard');
    }
  };
  
  // Requirements list
  const requirements = job.requirements?.split('\n').filter(Boolean) || [];
  
  // Responsibilities list
  const responsibilities = job.responsibilities?.split('\n').filter(Boolean) || [];
  
  // Benefits list
  const benefits = job.benefits?.split('\n').filter(Boolean) || [];
  
  return (
    <Box>
      <HelpPanel workflow="job-application" />
      
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} underline="hover" color="inherit" to="/jobs">
          Jobs
        </Link>
        <Typography color="text.primary">{job.title}</Typography>
      </Breadcrumbs>
      
      {/* Job Header Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" mb={1}>
              <Avatar
                src={job.company?.logo || ''}
                alt={job.company?.name || job.employer?.companyName || 'Company'}
                sx={{
                  width: 64,
                  height: 64,
                  mr: 2,
                  bgcolor: theme.palette.primary.main
                }}
              >
                {(job.company?.name || job.employer?.companyName || 'C').charAt(0)}
              </Avatar>
              
              <Box>
                <Typography variant="h4" component="h1">{job.title}</Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {job.company?.name || job.employer?.companyName || 'Company'}
                  {job.verified && (
                    <Tooltip componentId="verified-job-tooltip">
                      <VerifiedUserIcon
                        fontSize="small"
                        color="primary"
                        sx={{ ml: 0.5, verticalAlign: 'middle' }}
                      />
                    </Tooltip>
                  )}
                </Typography>
              </Box>
            </Box>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3, flexWrap: 'wrap' }}>
              <Box display="flex" alignItems="center">
                <LocationIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  {job.location || 'Location not specified'}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center">
                <WorkIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  {job.jobType?.replace('_', ' ') || 'Full Time'}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center">
                <SalaryIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  {formatSalary()}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center">
                <CalendarIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  Posted {formattedPostedDate}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, mb: 2 }}>
              {job.deadline && (
                <Typography variant="body2" color={daysRemaining <= 3 ? 'error.main' : 'text.secondary'} gutterBottom>
                  <CalendarIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                  {daysRemaining > 0 
                    ? `${daysRemaining} days remaining` 
                    : 'Deadline passed'}
                </Typography>
              )}
              
              {job.featured && (
                <Chip
                  label="Featured"
                  color="primary"
                  size="small"
                  sx={{ mb: 1 }}
                />
              )}
              
              {isJobExpired && (
                <Chip
                  label="Closed"
                  color="error"
                  size="small"
                  sx={{ mb: 1 }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 'auto', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="outlined"
                startIcon={isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                onClick={handleSaveToggle}
                color={isSaved ? 'primary' : 'inherit'}
              >
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={handleShare}
              >
                Share
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyClick}
                disabled={isJobExpired}
              >
                Apply Now
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Eligibility Alert */}
      {eligibility && user?.role === 'jobSeeker' && (
        <Box mb={3}>
          {!eligibility.eligible ? (
            <Alert 
              severity="warning" 
              variant="outlined"
              sx={{ mb: 3 }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Complete your profile to apply
              </Typography>
              <Typography variant="body2" paragraph>
                You need to complete your profile before applying for this job. Missing requirements:
              </Typography>
              <List dense disablePadding>
                {eligibility.missingRequirements?.map((item, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CheckIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item} 
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              <Button 
                component={RouterLink} 
                to="/profile" 
                size="small" 
                sx={{ mt: 1 }}
                variant="outlined"
              >
                Complete Profile
              </Button>
            </Alert>
          ) : (
            <Alert 
              severity="success" 
              variant="outlined"
              sx={{ mb: 3 }}
            >
              <Typography variant="subtitle2">
                You're eligible to apply for this job
              </Typography>
              <Typography variant="body2">
                Your profile meets all the requirements for this position. Apply now to express your interest.
              </Typography>
            </Alert>
          )}
        </Box>
      )}
      
      {/* Job Description Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Description
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body1" paragraph>
              {job.description || 'No job description provided.'}
            </Typography>
            
            {/* Requirements */}
            {requirements.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Requirements
                </Typography>
                <List>
                  {requirements.map((requirement, index) => (
                    <ListItem key={index} alignItems="flex-start" sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30, mt: 0.5 }}>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={requirement} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {/* Responsibilities */}
            {responsibilities.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Responsibilities
                </Typography>
                <List>
                  {responsibilities.map((responsibility, index) => (
                    <ListItem key={index} alignItems="flex-start" sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30, mt: 0.5 }}>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={responsibility} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {/* Benefits */}
            {benefits.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Benefits
                </Typography>
                <List>
                  {benefits.map((benefit, index) => (
                    <ListItem key={index} alignItems="flex-start" sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30, mt: 0.5 }}>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={benefit} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {job.skills.map((skill, index) => (
                    <Chip key={index} label={skill} variant="outlined" size="small" />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Additional Information */}
            {job.additionalInfo && (
              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Additional Information
                </Typography>
                <Typography variant="body1" paragraph>
                  {job.additionalInfo}
                </Typography>
              </Box>
            )}
          </Paper>
          
          {/* Apply Button (Bottom) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/jobs')}
            >
              Back to Jobs
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleApplyClick}
              disabled={isJobExpired}
              size="large"
            >
              Apply Now
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* Company Info */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Company Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={job.company?.logo || ''}
                alt={job.company?.name || job.employer?.companyName || 'Company'}
                sx={{
                  width: 50,
                  height: 50,
                  mr: 2,
                  bgcolor: theme.palette.primary.main
                }}
              >
                {(job.company?.name || job.employer?.companyName || 'C').charAt(0)}
              </Avatar>
              <Typography variant="subtitle1">
                {job.company?.name || job.employer?.companyName || 'Company'}
              </Typography>
            </Box>
            
            <List dense>
              {job.company?.industry && (
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <BusinessIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Industry" 
                    secondary={job.company.industry}
                  />
                </ListItem>
              )}
              
              {job.company?.size && (
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Company Size" 
                    secondary={job.company.size}
                  />
                </ListItem>
              )}
              
              {job.company?.website && (
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <DescriptionIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Website" 
                    secondary={
                      <Link 
                        href={job.company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {job.company.website}
                      </Link>
                    }
                  />
                </ListItem>
              )}
              
              {job.company?.location && (
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ min