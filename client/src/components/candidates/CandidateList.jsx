// src/components/candidates/CandidateList.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Pagination,
  Tooltip,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  VerifiedUser as VerifiedUserIcon,
  WorkOutline as WorkIcon,
  School as SchoolIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  PriorityHigh as PriorityHighIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Add as AddIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getCandidates, 
  toggleFavorite,
  exportCandidates,
  archiveCandidate
} from '../../store/actions/candidateActions';
import { format } from 'date-fns';
import CandidateImport from './CandidateImport';
import { HelpPanel } from '../documentation/HelpPanel';

const CandidateList = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse search params
  const searchParams = new URLSearchParams(location.search);
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSearch = searchParams.get('search') || '';
  const initialStatus = searchParams.get('status') || 'ALL';
  const initialSort = searchParams.get('sort') || 'createdAt_desc';
  
  // Local state
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [sort, setSort] = useState(initialSort);
  const [filters, setFilters] = useState({
    skills: [],
    experience: [],
    education: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionCandidate, setActionCandidate] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Redux state
  const { 
    candidates, 
    loading, 
    error, 
    totalCandidates, 
    totalPages 
  } = useSelector(state => state.candidates);
  
  // Fetch candidates
  useEffect(() => {
    dispatch(getCandidates({
      page,
      limit: rowsPerPage,
      search,
      status,
      sort,
      ...filters
    }));
    
    // Update URL params
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (search) params.set('search', search);
    if (status !== 'ALL') params.set('status', status);
    if (sort !== 'createdAt_desc') params.set('sort', sort);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [dispatch, page, rowsPerPage, search, status, sort, filters, navigate, location.pathname]);
  
  // Handle search
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };
  
  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };
  
  // Handle sort change
  const handleSortChange = (event) => {
    setSort(event.target.value);
    setPage(1);
  };
  
  // Handle status filter change
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };
  
  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = (candidateId) => {
    dispatch(toggleFavorite(candidateId));
  };
  
  // Handle candidate menu open
  const handleMenuOpen = (event, candidate) => {
    setAnchorEl(event.currentTarget);
    setActionCandidate(candidate);
  };
  
  // Handle candidate menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setActionCandidate(null);
  };
  
  // Handle archive candidate
  const handleArchiveCandidate = () => {
    if (actionCandidate) {
      dispatch(archiveCandidate(actionCandidate._id));
      handleMenuClose();
    }
  };
  
  // Handle export candidates
  const handleExport = () => {
    dispatch(exportCandidates({
      search,
      status,
      ...filters
    }));
  };
  
  // Toggle import dialog
  const toggleImportDialog = () => {
    setImportDialogOpen(!importDialogOpen);
  };
  
  // Status options
  const statusOptions = [
    { value: 'ALL', label: 'All Candidates' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'CONSIDERING', label: 'Considering' },
    { value: 'SHORTLISTED', label: 'Shortlisted' },
    { value: 'HIRED', label: 'Hired' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ARCHIVED', label: 'Archived' }
  ];
  
  // Sort options
  const sortOptions = [
    { value: 'createdAt_desc', label: 'Newest First' },
    { value: 'createdAt_asc', label: 'Oldest First' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'rating_desc', label: 'Highest Rated' }
  ];
  
  // Get verification badge
  const getVerificationBadge = (candidate) => {
    if (candidate.kycVerified) {
      return (
        <Tooltip title="Fully verified">
          <VerifiedUserIcon 
            color="success" 
            fontSize="small" 
            sx={{ verticalAlign: 'middle', ml: 0.5 }} 
          />
        </Tooltip>
      );
    } else if (candidate.identityVerified) {
      return (
        <Tooltip title="Identity verified">
          <VerifiedUserIcon 
            color="info" 
            fontSize="small" 
            sx={{ verticalAlign: 'middle', ml: 0.5 }} 
          />
        </Tooltip>
      );
    }
    return null;
  };
  
  return (
    <Box>
      <HelpPanel workflow="candidate-management" />
      
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1">
              Candidate Pool
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and find suitable candidates for your job positions
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="outlined"
              onClick={toggleImportDialog}
              startIcon={<AddIcon />}
              sx={{ mr: 1 }}
            >
              Import
            </Button>
            
            <Button
              variant="contained"
              onClick={handleExport}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              disabled={loading}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search input */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search candidates by name, skills or experience..."
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
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          {/* Status filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={status}
                onChange={handleStatusChange}
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
          
          {/* Sort options */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel id="sort-label">Sort By</InputLabel>
              <Select
                labelId="sort-label"
                value={sort}
                onChange={handleSortChange}
                label="Sort By"
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon />
                  </InputAdornment>
                }
              >
                {sortOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Search button */}
          <Grid item xs={12} sm={6} md={2}>
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
                onClick={() => setShowFilters(!showFilters)}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                <FilterIcon />
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        {/* Advanced filters - shown when showFilters is true */}
        {showFilters && (
          <Box mt={3}>
            <Divider sx={{ mb: 2 }}>
              <Chip label="Advanced Filters" />
            </Divider>
            
            <Grid container spacing={2}>
              {/* Add your advanced filters here */}
              {/* Example: Skills filter, Experience Level filter, Education filter */}
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Candidates list */}
      <Box mb={3}>
        {loading && !candidates.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : candidates.length > 0 ? (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Showing {candidates.length} of {totalCandidates} candidates
            </Typography>
            
            <Grid container spacing={2}>
              {candidates.map(candidate => (
                <Grid item xs={12} md={6} lg={4} key={candidate._id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      position: 'relative'
                    }}
                  >
                    {/* Favorite button */}
                    <IconButton
                      sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8,
                        zIndex: 1
                      }}
                      onClick={() => handleToggleFavorite(candidate._id)}
                    >
                      {candidate.favorite ? (
                        <StarIcon color="warning" />
                      ) : (
                        <StarBorderIcon />
                      )}
                    </IconButton>
                    
                    <CardContent sx={{ pb: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Avatar
                          src={candidate.profileImage}
                          alt={`${candidate.firstName} ${candidate.lastName}`}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        />
                        <Box>
                          <Typography variant="h6" component="div">
                            {candidate.firstName} {candidate.lastName}
                            {getVerificationBadge(candidate)}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {candidate.currentPosition || 'Not specified'}
                            {candidate.currentCompany && ` at ${candidate.currentCompany}`}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              size="small"
                              label={candidate.status}
                              color={
                                candidate.status === 'ACTIVE' ? 'primary' :
                                candidate.status === 'CONSIDERING' ? 'info' :
                                candidate.status === 'SHORTLISTED' ? 'success' :
                                candidate.status === 'HIRED' ? 'success' :
                                candidate.status === 'REJECTED' ? 'error' :
                                'default'
                              }
                            />
                            
                            {candidate.priority === 'HIGH' && (
                              <Tooltip title="High Priority Candidate">
                                <PriorityHighIcon color="error" fontSize="small" />
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          <WorkIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          Experience
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {candidate.totalExperience || 'Not specified'}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          <SchoolIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          Education
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {candidate.highestEducation || 'Not specified'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Skills
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {candidate.skills?.slice(0, 4).map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {candidate.skills?.length > 4 && (
                            <Chip
                              label={`+${candidate.skills.length - 4}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/candidates/${candidate._id}`}
                      >
                        View Profile
                      </Button>
                      
                      <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Email Candidate">
                          <IconButton size="small" color="primary">
                            <EmailIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Call Candidate">
                          <IconButton size="small" color="primary">
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, candidate)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No candidates found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Try adjusting your search criteria or import candidates to get started.
            </Typography>
            <Button
              variant="contained"
              onClick={toggleImportDialog}
              startIcon={<AddIcon />}
            >
              Import Candidates
            </Button>
          </Paper>
        )}
      </Box>
      
      {/* Candidate actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose} component={RouterLink} to={`/candidates/${actionCandidate?._id}`}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose} component={RouterLink} to={`/candidates/${actionCandidate?._id}/edit`}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Candidat