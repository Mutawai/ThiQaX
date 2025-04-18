// src/components/candidates/CandidateManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  PersonAdd as PersonAddIcon,
  FileUpload as FileUploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
  VerifiedUser as VerifiedUserIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
  AssignmentInd as AssignmentIndIcon,
  Block as BlockIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  getCandidates,
  toggleFavorite,
  deleteCandidate,
  exportCandidates,
  importCandidates
} from '../../store/actions/candidateActions';
import { HelpPanel } from '../documentation/HelpPanel';
import { useResponsive } from '../../utils/responsive';
import AlertDialog from '../common/AlertDialog';
import CandidateCard from './CandidateCard';

/**
 * CandidateManagement Component
 * Provides an interface for agents to manage their candidate pool
 */
const CandidateManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();
  
  // Parse URL params
  const queryParams = new URLSearchParams(location.search);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(queryParams.get('search') || '');
  const [tabValue, setTabValue] = useState(0);
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);
  const [statusFilter, setStatusFilter] = useState(queryParams.get('status') || 'ALL');
  const [skillsFilter, setSkillsFilter] = useState([]);
  const [experienceFilter, setExperienceFilter] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [page, setPage] = useState(parseInt(queryParams.get('page') || '1', 10));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  
  // Redux state
  const {
    candidates,
    loading,
    error,
    totalCandidates,
    totalPages
  } = useSelector(state => state.candidates);
  
  // Effect to fetch candidates
  useEffect(() => {
    const params = {
      page,
      limit: 9,
      search: searchTerm,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      skills: skillsFilter.length > 0 ? skillsFilter.join(',') : undefined,
      experience: experienceFilter || undefined
    };
    
    dispatch(getCandidates(params));
    
    // Update URL with search params
    const urlParams = new URLSearchParams();
    if (page > 1) urlParams.set('page', page.toString());
    if (searchTerm) urlParams.set('search', searchTerm);
    if (statusFilter !== 'ALL') urlParams.set('status', statusFilter);
    
    const url = `${location.pathname}?${urlParams.toString()}`;
    navigate(url, { replace: true });
  }, [dispatch, page, searchTerm, statusFilter, skillsFilter, experienceFilter, navigate, location.pathname]);
  
  // Tab configuration
  const tabs = [
    { value: 0, label: 'All Candidates' },
    { value: 1, label: 'Favorites' },
    { value: 2, label: 'Recent' },
    { value: 3, label: 'Placed' }
  ];
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Update filters based on tab
    switch (newValue) {
      case 1: // Favorites
        setStatusFilter('ALL');
        // Apply favorites filter
        break;
      case 2: // Recent
        setStatusFilter('ALL');
        // Apply recent filter (last 7 days)
        break;
      case 3: // Placed
        setStatusFilter('HIRED');
        break;
      default:
        setStatusFilter('ALL');
    }
    
    setPage(1);
  };
  
  // Handle search
  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };
  
  // Handle filter menu
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };
  
  // Handle candidate menu
  const handleCandidateMenuOpen = (event, candidate) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedCandidate(candidate);
  };
  
  const handleCandidateMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedCandidate(null);
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = (id) => {
    dispatch(toggleFavorite(id));
  };
  
  // Handle delete candidate
  const handleDeleteCandidate = () => {
    setDeleteDialogOpen(true);
    handleCandidateMenuClose();
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (selectedCandidate) {
      dispatch(deleteCandidate(selectedCandidate._id));
      setDeleteDialogOpen(false);
    }
  };
  
  // Handle export candidates
  const handleExport = () => {
    const params = {
      search: searchTerm,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      skills: skillsFilter.length > 0 ? skillsFilter.join(',') : undefined,
      experience: experienceFilter || undefined
    };
    
    dispatch(exportCandidates(params));
  };
  
  // Handle import dialog
  const handleImportDialogOpen = () => {
    setImportDialogOpen(true);
  };
  
  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setImportFile(null);
  };
  
  // Handle file selection
  const handleFileChange = (event) => {
    setImportFile(event.target.files[0]);
  };
  
  // Handle import submission
  const handleImport = () => {
    if (importFile) {
      const formData = new FormData();
      formData.append('file', importFile);
      dispatch(importCandidates(formData));
      handleImportDialogClose();
    }
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setStatusFilter('ALL');
    setSkillsFilter([]);
    setExperienceFilter('');
    setPage(1);
  };
  
  // Get status options
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'CONSIDERING', label: 'Considering' },
    { value: 'SHORTLISTED', label: 'Shortlisted' },
    { value: 'HIRED', label: 'Hired' },
    { value: 'REJECTED', label: 'Rejected' },
  ];
  
  // Get experience options
  const experienceOptions = [
    { value: '', label: 'Any Experience' },
    { value: '0-1', label: 'Less than 1 year' },
    { value: '1-3', label: '1-3 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5-10', label: '5-10 years' },
    { value: '10+', label: '10+ years' }
  ];
  
  return (
    <Box>
      <HelpPanel workflow="candidate-management" />
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Candidate Management
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={handleImportDialogOpen}
              sx={{ mr: 1 }}
            >
              Import
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
            
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              component={RouterLink}
              to="/candidates/create"
              sx={{ ml: 1 }}
            >
              Add Candidate
            </Button>
          </Box>
        </Box>
        
        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{ mb: 2 }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              id={`candidate-tab-${tab.value}`}
              aria-controls={`candidate-tabpanel-${tab.value}`}
            />
          ))}
        </Tabs>
        
        {/* Search and filters */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name, skills, or experience..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchInput && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchInput('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel id="experience-label">Experience</InputLabel>
              <Select
                labelId="experience-label"
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                label="Experience"
              >
                {experienceOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSearch}
                fullWidth
                disabled={loading}
              >
                Search
              </Button>
              
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleFilterMenuOpen}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                <FilterListIcon />
              </Button>
            </Box>
          </Grid>
          
          {/* Filter chips */}
          {(searchTerm || statusFilter !== 'ALL' || experienceFilter) && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {searchTerm && (
                  <Chip
                    label={`Search: ${searchTerm}`}
                    onDelete={() => {
                      setSearchTerm('');
                      setSearchInput('');
                    }}
                    size="small"
                  />
                )}
                
                {statusFilter !== 'ALL' && (
                  <Chip
                    label={`Status: ${statusOptions.find(o => o.value === statusFilter)?.label}`}
                    onDelete={() => setStatusFilter('ALL')}
                    size="small"
                  />
                )}
                
                {experienceFilter && (
                  <Chip
                    label={`Experience: ${experienceOptions.find(o => o.value === experienceFilter)?.label}`}
                    onDelete={() => setExperienceFilter('')}
                    size="small"
                  />
                )}
                
                {(searchTerm || statusFilter !== 'ALL' || experienceFilter) && (
                  <Chip
                    label="Clear All Filters"
                    onDelete={handleClearFilters}
                    size="small"
                    color="primary"
                  />
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Loading state */}
      {loading && !candidates.length && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Empty state */}
      {!loading && (!candidates || candidates.length === 0) && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No candidates found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm || statusFilter !== 'ALL' || experienceFilter ? 
              'Try adjusting your search criteria or clear filters.' : 
              'Start by adding candidates to your pool.'}
          </Typography>
          
          {searchTerm || statusFilter !== 'ALL' || experienceFilter ? (
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              sx={{ mr: 1 }}
            >
              Clear Filters
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              component={RouterLink}
              to="/candidates/create"
            >
              Add Candidate
            </Button>
          )}
        </Paper>
      )}
      
      {/* Candidates Grid */}
      {!loading && candidates && candidates.length > 0 && (
        <>
          <Grid container spacing={3}>
            {candidates.map(candidate => (
              <Grid item xs={12} sm={6} md={4} key={candidate._id}>
                <CandidateCard 
                  candidate={candidate}
                  onMenuOpen={handleCandidateMenuOpen}
                  onFavoriteToggle={() => handleToggleFavorite(candidate._id)}
                />
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              sx={{ mx: 1 }}
            >
              Previous
            </Button>
            <Typography variant="body1" sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>
              Page {page} of {totalPages || 1}
            </Typography>
            <Button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(page + 1)}
              sx={{ mx: 1 }}
            >
              Next
            </Button>
          </Box>
        </>
      )}
      
      {/* Candidate action menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCandidateMenuClose}
      >
        <MenuItem 
          component={RouterLink} 
          to={`/candidates/${selectedCandidate?._id}`}
          onClick={handleCandidateMenuClose}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Profile</ListItemText>
        </MenuItem>
        
        <MenuItem 
          component={RouterLink} 
          to={`/candidates/${selectedCandidate?._id}/edit`}
          onClick={handleCandidateMenuClose}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Candidate</ListItemText>
        </MenuItem>
        
        <MenuItem 
          component={RouterLink} 
          to={`/candidates/${selectedCandidate?._id}/jobs`}
          onClick={handleCandidateMenuClose}
        >
          <ListItemIcon>
            <AssignmentIndIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Match to Jobs</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (selectedCandidate) {
            handleToggleFavorite(selectedCandidate._id);
            handleCandidateMenuClose();
          }
        }}>
          <ListItemIcon>
            {selectedCandidate?.favorite ? (
              <StarIcon fontSize="small" color="warning" />
            ) : (
              <StarBorderIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedCandidate?.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleCandidateMenuClose}>
          <ListItemIcon>
            <SendIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send Message</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleDeleteCandidate}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete Candidate</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Candidate"
        content="Are you sure you want to delete this candidate? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
      />
      
      {/* Import dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Candidates</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Upload a CSV file containing candidate information. The file should include columns for name, email, phone number, and other candidate details.
          </Typography>
          
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="import-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="import-file">
              <Button
                variant="outlined"
                component="sp