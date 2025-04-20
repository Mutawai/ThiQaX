// src/components/jobs/ComparisonModal/ComparisonModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  CircularProgress,
  Box,
  Chip,
  Alert,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  AttachMoney as SalaryIcon,
  BusinessCenter as JobTypeIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Verified as VerifiedIcon,
  Save as SaveIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getJobDetails, saveJob, unsaveJob } from '../../../store/actions/jobActions';
import { format } from 'date-fns';
import styles from './ComparisonModal.module.css';
import useAuth from '../../auth/useAuth';
import VerificationBadge from '../VerificationBadge/VerificationBadge';

/**
 * Modal for comparing multiple job listings side by side
 * @param {Object} props Component props
 * @param {boolean} props.open Whether the modal is open
 * @param {Function} props.onClose Function to close the modal
 * @param {Array<string>} props.jobIds IDs of the jobs to compare
 */
const ComparisonModal = ({ open, onClose, jobIds = [] }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const { saved } = useSelector(state => state.jobs);
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load job details for comparison
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Reset jobs when jobIds change
        setJobs([]);
        
        // Create a promise for each job fetch
        const jobPromises = jobIds.map(id => 
          new Promise(resolve => {
            dispatch(getJobDetails(id)).then(action => {
              if (action.payload && !action.error) {
                resolve(action.payload);
              } else {
                resolve(null); // Handle failed requests
              }
            });
          })
        );
        
        // Wait for all jobs to be fetched
        const jobResults = await Promise.all(jobPromises);
        
        // Filter out any null results (failed requests)
        const validJobs = jobResults.filter(job => job !== null);
        setJobs(validJobs);
      } catch (err) {
        setError('Failed to fetch job details for comparison');
        console.error('Error fetching jobs for comparison:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (open && jobIds.length > 0) {
      fetchJobs();
    }
  }, [dispatch, jobIds, open]);
  
  // Handle save/unsave job toggle
  const handleSaveToggle = (jobId) => {
    if (!isAuthenticated) return;
    
    const isSaved = saved?.includes(jobId);
    
    if (isSaved) {
      dispatch(unsaveJob(jobId));
    } else {
      dispatch(saveJob(jobId));
    }
  };
  
  // Format salary range
  const formatSalary = (job) => {
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    } else if (job.salaryMin) {
      return `From $${job.salaryMin.toLocaleString()}`;
    } else if (job.salaryMax) {
      return `Up to $${job.salaryMax.toLocaleString()}`;
    } else {
      return 'Not specified';
    }
  };
  
  // Format job type
  const formatJobType = (type) => {
    return type?.replace('_', ' ') || 'Full Time';
  };
  
  // Handle share job
  const handleShare = (job) => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job: ${job.title} at ${job.company?.name || job.employer?.companyName}`,
        url: `${window.location.origin}/jobs/${job._id}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/jobs/${job._id}`);
      // You would normally show a toast notification here
      alert('Link copied to clipboard');
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      aria-labelledby="job-comparison-title"
      className={styles.comparisonModal}
    >
      <DialogTitle id="job-comparison-title" className={styles.modalTitle}>
        Job Comparison
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : jobs.length === 0 ? (
          <Alert severity="info">
            No jobs selected for comparison.
          </Alert>
        ) : (
          <Grid container spacing={2} className={styles.comparisonGrid}>
            {/* Header Row - Job Titles */}
            <Grid item xs={12}>
              <Grid container spacing={1}>
                <Grid item xs={3} className={styles.categoryColumn}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Job Details
                  </Typography>
                </Grid>
                
                {jobs.map((job) => (
                  <Grid item xs key={job._id} className={styles.jobColumn}>
                    <Paper elevation={2} className={styles.jobHeader}>
                      <Box className={styles.jobTitle}>
                        <Typography variant="h6" noWrap title={job.title}>
                          {job.title}
                        </Typography>
                        {job.verified && <VerificationBadge size="small" tooltip="Verified Job" />}
                      </Box>
                      
                      <Typography variant="subtitle2" color="text.secondary" noWrap>
                        {job.company?.name || job.employer?.companyName}
                      </Typography>
                      
                      <Box className={styles.jobActions}>
                        <Tooltip title={saved?.includes(job._id) ? "Unsave" : "Save"}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleSaveToggle(job._id)}
                            color={saved?.includes(job._id) ? "primary" : "default"}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Share">
                          <IconButton 
                            size="small"
                            onClick={() => handleShare(job)}
                          >
                            <ShareIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Button 
                          variant="contained" 
                          size="small"
                          component="a" 
                          href={`/jobs/${job._id}`}
                          target="_blank"
                        >
                          View
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {/* Comparison Categories */}
            {/* Salary */}
            <Grid item xs={12}>
              <Grid container spacing={1} className={styles.comparisonRow}>
                <Grid item xs={3} className={styles.categoryColumn}>
                  <Box className={styles.categoryLabel}>
                    <SalaryIcon color="action" />
                    <Typography variant="body1">Salary</Typography>
                  </Box>
                </Grid>
                
                {jobs.map((job) => (
                  <Grid item xs key={`${job._id}-salary`} className={styles.jobColumn}>
                    <Typography variant="body2">{formatSalary(job)}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {/* Job Type */}
            <Grid item xs={12}>
              <Grid container spacing={1} className={styles.comparisonRow}>
                <Grid item xs={3} className={styles.categoryColumn}>
                  <Box className={styles.categoryLabel}>
                    <JobTypeIcon color="action" />
                    <Typography variant="body1">Job Type</Typography>
                  </Box>
                </Grid>
                
                {jobs.map((job) => (
                  <Grid item xs key={`${job._id}-type`} className={styles.jobColumn}>
                    <Typography variant="body2">{formatJobType(job.jobType)}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {/* Location */}
            <Grid item xs={12}>
              <Grid container spacing={1} className={styles.comparisonRow}>
                <Grid item xs={3} className={styles.categoryColumn}>
                  <Box className={styles.categoryLabel}>
                    <LocationIcon color="action" />
                    <Typography variant="body1">Location</Typography>
                  </Box>
                </Grid>
                
                {jobs.map((job) => (
                  <Grid item xs key={`${job._id}-location`} className={styles.jobColumn}>
                    <Typography variant="body2">{job.location || 'Not specified'}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {/* Posted Date */}
            <Grid item xs={12}>
              <Grid container spacing={1} className={styles.comparisonRow}>
                <Grid item xs={3} className={styles.categoryColumn}>
                  <Box className={styles.categoryLabel}>
                    <CalendarIcon color="action" />
                    <Typography variant="body1">Posted</Typography>
                  </Box>
                </Grid>
                
                {jobs.map((job) => (
                  <Grid item xs key={`${job._id}-posted`} className={styles.jobColumn}>
                    <Typography variant="body2">
                      {job.createdAt ? format(new Date(job.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {/* Deadline */}
            <Grid item xs={12}>
              <Grid container spacing={1} className={styles.comparisonRow}>
                <Grid item xs={3} className={styles.categoryColumn}>
                  <Box className={styles.categoryLabel}>
                    <CalendarIcon color="action" />
                    <Typography variant="body1">Deadline</Typography>
                  </Box>
                </Grid>
                
                {jobs.map((job) => (
                  <Grid item xs key={`${job._id}-deadline`} className={styles.jobColumn}>
                    <Typography variant="body2">
                      {job.deadline ? format(new Date(job.deadline), 'MMM d, yyyy') : 'N/A'}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {/* Requirements */}
            <Grid item xs={12}>
              <Grid container spacing={1} className={styles.comparisonRow}>
                <Grid item xs={3} className={styles.categoryColumn}>
                  <Box className={styles.categoryLabel}>
                    <Typography variant="body1">Requirements</Typography>
                  </Box>
                </Grid>
                
                {jobs.map((job) => {
                  const requirements = job.requirements?.split('\n').filter(Boolean) || [];
                  return (
                    <Grid item xs key={`${job._id}-requirements`} className={styles.jobColumn}>
                      {requirements.length > 0 ? (
                        <List dense className={styles.listItems}>
                          {requirements.slice(0, 3).map((req, index) => (
                            <ListItem key={index} disablePadding className={styles.listItem}>
                              <ListItemIcon className={styles.listItemIcon}>
                                <CheckIcon fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={req} 
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                          {requirements.length > 3 && (
                            <Typography variant="body2" color="primary">
                              +{requirements.length - 3} more
                            </Typography>
                          )}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not specified
                        </Typography>
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
            
            {/* Skills */}
            <Grid item xs={12}>
              <Grid container spacing={1} className={styles.comparisonRow}>
                <Grid item xs={3} className={styles.categoryColumn}>
                  <Box className={styles.categoryLabel}>
                    <Typography variant="body1">Skills</Typography>
                  </Box>
                </Grid>
                
                {jobs.map((job) => (
                  <Grid item xs key={`${job._id}-skills`} className={styles.jobColumn}>
                    {job.skills && job.skills.length > 0 ? (
                      <Box className={styles.skillsContainer}>
                        {job.skills.slice(0, 5).map((skill, index) => (
                          <Chip 
                            key={index} 
                            label={skill} 
                            size="small" 
                            variant="outlined" 
                            className={styles.skillChip}
                          />
                        ))}
                        {job.skills.length > 5 && (
                          <Typography variant="body2" color="primary">
                            +{job.skills.length - 5} more
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not specified
                      </Typography>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          variant="contained" 
          disabled={loading || jobs.length === 0}
          component="a"
          href="/jobs"
        >
          Browse More Jobs
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComparisonModal;