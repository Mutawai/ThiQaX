// src/components/jobs/JobSearch.js
import React, { useState, useEffect } from 'react';
import {
  Box, TextField, InputAdornment, Grid, Paper, Typography,
  Button, FormControl, InputLabel, Select, MenuItem, Chip,
  CircularProgress, Pagination, IconButton, Divider, Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  WorkOutline as WorkIcon,
  AttachMoney as SalaryIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TravelExplore as ExploreIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { searchJobs, clearJobSearch } from '../../store/actions/jobActions';
import JobCard from './JobCard';
import { Tooltip } from '../documentation/Tooltip';
import { HelpPanel } from '../documentation/HelpPanel';

const JobSearch = () => {
  const dispatch = useDispatch();
  const { jobs, loading, error, totalJobs, totalPages } = useSelector(state => state.jobs);
  
  // Search parameters
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [activeSearch, setActiveSearch] = useState(false);

  // Available filters
  const jobTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP'];
  const salaryRanges = [
    { label: 'Under $500', value: '0-500' },
    { label: '$500 - $1,000', value: '500-1000' },
    { label: '$1,000 - $2,000', value: '1000-2000' },
    { label: '$2,000 - $3,000', value: '2000-3000' },
    { label: 'Over $3,000', value: '3000-999999' }
  ];
  
  // Effect to perform search when parameters change
  useEffect(() => {
    if (activeSearch) {
      const params = {
        page,
        limit: 10,
        ...(searchTerm && { keyword: searchTerm }),
        ...(location && { location }),
        ...(jobType && { jobType }),
        ...(salaryRange && { salaryRange })
      };
      
      dispatch(searchJobs(params));
    }
  }, [dispatch, searchTerm, location, jobType, salaryRange, page, activeSearch]);
  
  // Clear search results when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearJobSearch());
    };
  }, [dispatch]);
  
  const handleSearch = () => {
    setActiveSearch(true);
    setPage(1);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setJobType('');
    setSalaryRange('');
    setPage(1);
    
    if (activeSearch) {
      dispatch(searchJobs({ page: 1, limit: 10 }));
    }
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  return (
    <Box>
      <HelpPanel workflow="job-search" />
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="Job Title, Keywords, or Company"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon />
                  </InputAdornment>
                ),
                endAdornment: location && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setLocation('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSearch}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                Search
              </Button>
              
              <Tooltip componentId="job-search-filters">
                <IconButton 
                  color={showFilters ? "primary" : "default"}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FilterIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
          
          {showFilters && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Chip label="Additional Filters" />
                </Divider>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="job-type-label">Job Type</InputLabel>
                  <Select
                    labelId="job-type-label"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    label="Job Type"
                    startAdornment={
                      <InputAdornment position="start">
                        <WorkIcon />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="">Any Type</MenuItem>
                    {jobTypes.map(type => (
                      <MenuItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="salary-range-label">Salary Range</InputLabel>
                  <Select
                    labelId="salary-range-label"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    label="Salary Range"
                    startAdornment={
                      <InputAdornment position="start">
                        <SalaryIcon />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="">Any Salary</MenuItem>
                    {salaryRanges.map(range => (
                      <MenuItem key={range.value} value={range.value}>
                        {range.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      
      {/* Search Results */}
      <Box mb={3}>
        {activeSearch && (
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography>
              {loading ? (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              ) : (
                <>
                  Found <strong>{totalJobs || 0}</strong> jobs
                  {searchTerm && <> matching "<strong>{searchTerm}</strong>"</>}
                  {location && <> in <strong>{location}</strong></>}
                </>
              )}
            </Typography>
            
            {(searchTerm || location || jobType || salaryRange) && (
              <Button 
                size="small" 
                startIcon={<ClearIcon />}
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {!activeSearch ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ExploreIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Find Your Perfect Job
            </Typography>
            <Typography color="textSecondary" paragraph>
              Enter a job title, keyword, or location to start your search
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              sx={{ mt: 2 }}
            >
              Browse All Jobs
            </Button>
          </Paper>
        ) : loading && !jobs.length ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : jobs.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No jobs found
            </Typography>
            <Typography color="textSecondary" paragraph>
              Try adjusting your search criteria or browse all available jobs
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={clearFilters}
            >
              Browse All Jobs
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={2}>
              {jobs.map(job => (
                <Grid item xs={12} key={job._id}>
                  <JobCard job={job} />
                </Grid>
              ))}
            </Grid>
            
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default JobSearch;

// src/components/jobs/JobCard.js
import React from 'react';
import {
  Card, CardContent, Typography, Box, Chip, Button,
  Divider, Stack, Avatar
} from '@mui/material';
import {
  LocationOn, WorkOutline, AttachMoney, BusinessCenter,
  Event, VerifiedUser, Flag
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { Tooltip } from '../documentation/Tooltip';

const JobCard = ({ job }) => {
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
  
  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box display="flex" alignItems="center" mb={1}>
            <Avatar
              src={job.company?.logo || ''}
              alt={job.company?.name || job.employer?.companyName || 'Company'}
              sx={{
                width: 50,
                height: 50,
                mr: 2,
                bgcolor: 'primary.main'
              }}
            >
              {(job.company?.name || job.employer?.companyName || 'C').charAt(0)}
            </Avatar>
            
            <Box>
              <Typography variant="h6" component={RouterLink} to={`/jobs/${job._id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                {job.title}
              </Typography>
              
              <Typography variant="body2" color="textSecondary">
                {job.company?.name || job.employer?.companyName || 'Company Name'}
                {job.verified && (
                  <Tooltip componentId="verified-job">
                    <VerifiedUser
                      fontSize="small"
                      color="primary"
                      sx={{ ml: 0.5, verticalAlign: 'middle' }}
                    />
                  </Tooltip>
                )}
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography variant="caption" color="textSecondary" display="block" textAlign="right">
              Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
            </Typography>
            
            {job.featured && (
              <Chip
                label="Featured"
                color="primary"
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Box>
        
        <Divider sx={{ my: 1.5 }} />
        
        <Box mb={2}>
          <Typography variant="body2" color="textSecondary" paragraph>
            {job.description?.substring(0, 150)}
            {job.description?.length > 150 ? '...' : ''}
          </Typography>
        </Box>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <Box display="flex" alignItems="center">
            <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2">
              {job.location || 'Location not specified'}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center">
            <WorkOutline fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2">
              {formatJobType()}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center">
            <AttachMoney fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2">
              {formatSalary()}
            </Typography>
          </Box>
          
          {job.experience && (
            <Box display="flex" alignItems="center">
              <BusinessCenter fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                {job.experience} experience
              </Typography>
            </Box>
          )}
          
          {job.deadline && (
            <Box display="flex" alignItems="center">
              <Event fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                Deadline: {format(new Date(job.deadline), 'MMM d, yyyy')}
              </Typography>
            </Box>
          )}
        </Stack>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            {job.tags && job.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
          
          <Box>
            {job.status === 'CLOSED' ? (
              <Chip
                label="Closed"
                color="error"
                size="small"
                icon={<Flag />}
              />
            ) : (
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to={`/jobs/${job._id}`}
              >
                View Job
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default JobCard;

// src/components/jobs/JobDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Divider, Chip, Button, Grid,
  Stack, Avatar, Alert, CircularProgress, List, ListItem,
  ListItemIcon, ListItemText, Card, CardContent
} from '@mui/material';
import {
  LocationOn, WorkOutline, AttachMoney, BusinessCenter,
  Event, CheckCircle, Person, Assignment, CalendarToday,
  VerifiedUser, ArrowBack, Check, Flag
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getJobDetails, clearJobDetails } from '../../store/actions/jobActions';
import { format, differenceInDays } from 'date-fns';
import { HelpPanel } from '../documentation/HelpPanel';
import { Tooltip } from '../documentation/Tooltip';
import ApplyModal from './ApplyModal';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { job, loading, error } = useSelector(state => state.jobs);
  const { user } = useSelector(state => state.auth);
  
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  
  useEffect(() => {
    dispatch(getJobDetails(id));
    
    return () => {
      dispatch(clearJobDetails());
    };
  }, [dispatch, id]);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }
  
  if (!job) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Job not found. It may have been removed or you don't have permission to view it.
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/jobs')}
          sx={{ mt: 2 }}
        >
          Back to Jobs
        </Button>
      </Box>
    );
  }
  
  // Check if job is closed or deadline passed
  const isJobClosed = job.status === 'CLOSED';
  const isDeadlinePassed = job.deadline && (new Date(job.deadline) < new Date());
  const daysToDeadline = job.deadline ? differenceInDays(new Date(job.deadline), new Date()) : null;
  
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
  
  const handleApplyClick = () => {
    if (!user) {
      navigate('/auth/login', { 
        state: { from: `/jobs/${id}`, message: 'Please log in to apply for this job' } 
      });
      return;
    }
    
    setApplyModalOpen(true);
  };
  
  return (
    <Box>
      <HelpPanel workflow="job-application" />
      
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/jobs')}
        sx={{ mb: 2 }}
      >
        Back to Jobs
      </Button>
      
 
