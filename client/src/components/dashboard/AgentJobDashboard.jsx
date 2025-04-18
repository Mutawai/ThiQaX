// src/components/dashboard/AgentJobDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Business as BusinessIcon,
  PeopleAlt as PeopleAltIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  getAgentJobs, 
  deleteJob, 
  toggleJobStatus 
} from '../../store/actions/jobActions';
import { format, isAfter } from 'date-fns';
import JobStatCard from '../jobs/JobStatCard';
import { HelpPanel } from '../documentation/HelpPanel';
import { useResponsive } from '../../utils/responsive';
import AlertDialog from '../common/AlertDialog';

/**
 * AgentJobDashboard Component
 * Dashboard for recruitment agents to manage job postings
 */
const AgentJobDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // Redux state
  const { 
    jobs, 
    loading, 
    error, 
    stats 
  } = useSelector(state => state.jobs);
  
  // Tabs configuration
  const tabs = [
    { value: 0, label: 'Active Jobs', status: 'ACTIVE' },
    { value: 1, label: 'Draft Jobs', status: 'DRAFT' },
    { value: 2, label: 'Closed Jobs', status: 'CLOSED' },
    { value: 3, label: 'All Jobs', status: 'ALL' }
  ];
  
  // Fetch jobs on component mount
  useEffect(() => {
    const currentTab = tabs[tabValue];
    dispatch(getAgentJobs({ status: currentTab.status, filter }));
  }, [dispatch, tabValue, filter]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearch('');
  };
  
  // Handle search
  const handleSearch = (event) => {
    setSearch(event.target.value);
  };
  
  // Filter jobs based on search
  const filteredJobs = jobs?.filter(job => {
    if (!search) return true;
    
    return (
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
      job.location?.toLowerCase().includes(search.toLowerCase())
    );
  });
  
  // Handle job menu open
  const handleMenuOpen = (event, job) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };
  
  // Handle job menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedJob(null);
  };
  
  // Handle filter menu open
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };
  
  // Handle filter menu close
  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };
  
  // Handle filter selection
  const handleFilterSelect = (newFilter) => {
    setFilter(newFilter);
    handleFilterMenuClose();
  };
  
  // Handle job status toggle
  const handleToggleStatus = () => {
    if (selectedJob) {
      const newStatus = selectedJob.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
      dispatch(toggleJobStatus(selectedJob._id, newStatus));
      handleMenuClose();
    }
  };
  
  // Handle job delete
  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (selectedJob) {
      dispatch(deleteJob(selectedJob._id));
      setDeleteDialogOpen(false);
    }
  };
  
  // Check if job is expired
  const isJobExpired = (job) => {
    if (!job.deadline) return false;
    return isAfter(new Date(), new Date(job.deadline));
  };
  
  // Get company filter options
  const getCompanyOptions = () => {
    const companies = jobs?.map(job => job.company?.name).filter(Boolean);
    return [...new Set(companies)];
  };
  
  // Filters
  const filters = [
    { value: 'all', label: 'All Companies' },
    ...getCompanyOptions().map(company => ({ value: company, label: company }))
  ];
  
  return (
    <Box>
      <HelpPanel workflow="job-management" />
      
      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <JobStatCard
            title="Active Jobs"
            value={stats?.activeCount || 0}
            color="primary"
            icon={<AssignmentTurnedInIcon />}
          />
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <JobStatCard
            title="Total Applicants"
            value={stats?.applicantsCount || 0}
            color="success"
            icon={<PeopleAltIcon />}
          />
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <JobStatCard
            title="Companies"
            value={stats?.companiesCount || 0}
            color="info"
            icon={<BusinessIcon />}
          />
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <JobStatCard
            title="Placements"
            value={stats?.placementsCount || 0}
            color="warning"
            icon={<CheckIcon />}
          />
        </Grid>
      </Grid>
      
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6">
            Manage Job Postings
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/jobs/create"
          >
            Post New Job
          </Button>
        </Box>
        
        <Divider />
        
        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
        >
          {tabs.map((tab) => (
            <Tab 
              key={tab.value} 
              label={tab.label} 
              id={`job-tab-${tab.value}`} 
              aria-controls={`job-tabpanel-${tab.value}`}
            />
          ))}
        </Tabs>
        
        <Divider />
        
        {/* Search and filters */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            placeholder="Search jobs..."
            value={search}
            onChange={handleSearch}
            size="small"
            variant="outlined"
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          
          <Button
            startIcon={<FilterListIcon />}
            onClick={handleFilterMenuOpen}
            size="small"
            variant="outlined"
          >
            {filter === 'all' ? 'All Companies' : filter}
          </Button>
          
          <Menu
            anchorEl={filterMenuAnchorEl}
            open={Boolean(filterMenuAnchorEl)}
            onClose={handleFilterMenuClose}
          >
            {filters.map((option) => (
              <MenuItem
                key={option.value}
                selected={filter === option.value}
                onClick={() => handleFilterSelect(option.value)}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
        
        {/* Error state */}
        {error && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Loading state */}
        {loading && !jobs?.length && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* Empty state */}
        {!loading && (!filteredJobs || filteredJobs.length === 0) && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              No jobs found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {search ? 'Try adjusting your search criteria' : 'Start by posting a new job'}
            </Typography>
            {!search && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                component={RouterLink}
                to="/jobs/create"
              >
                Post New Job
              </Button>
            )}
          </Box>
        )}
        
        {/* Job list */}
        {!loading && filteredJobs && filteredJobs.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Job Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Company</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Location</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Posted Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Deadline</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Applicants</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {job.featured && (
                          <Chip size="small" label="Featured" color="primary" sx={{ mr: 1 }} />
                        )}
                        <Typography variant="subtitle2">{job.title}</Typography>
                      </Box>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {job.company?.name || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {job.location || 'Remote'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {format(new Date(job.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {job.deadline ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color={isJobExpired(job) ? 'error' : 'textPrimary'}>
                            {format(new Date(job.deadline), 'MMM d, yyyy')}
                          </Typography>
                          {isJobExpired(job) && (
                            <Chip size="small" label="Expired" color="error" sx={{ ml: 1 }} />
                          )}
                        </Box>
                      ) : 'No deadline'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Button
                        size="small"
                        variant="text"
                        component={RouterLink}
                        to={`/jobs/${job._id}/applications`}
                      >
                        {job.applications || 0} applicants
                      </Button>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Chip
                        size="small"
                        label={job.status}
                        color={
                          job.status === 'ACTIVE' ? 'success' :
                          job.status === 'DRAFT' ? 'default' :
                          'error'
                        }
                      />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={(event) => handleMenuOpen(event, job)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Paper>
      
      {/* Job action menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          component={RouterLink} 
          to={`/jobs/${selectedJob?._id}`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Job</ListItemText>
        </MenuItem>
        
        <MenuItem 
          component={RouterLink} 
          to={`/jobs/${selectedJob?._id}/edit`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Job</ListItemText>
        </MenuItem>
        
        <MenuItem 
          component={RouterLink} 
          to={`/jobs/${selectedJob?._id}/applications`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <PeopleAltIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Applicants</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleToggleStatus}>
          <ListItemIcon>
            {selectedJob?.status === 'ACTIVE' ? (
              <CloseIcon fontSize="small" color="error" />
            ) : (
              <CheckIcon fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedJob?.status === 'ACTIVE' ? 'Close Job' : 'Activate Job'}
          </ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete Job</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Job Posting"
        content="Are you sure you want to delete this job posting? This action cannot be undone, and all associated applications will be lost."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default AgentJobDashboard;