// src/components/jobs/JobList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Pagination, 
  CircularProgress, 
  Alert,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import { 
  TravelExplore as TravelExploreIcon,
  FilterList as FilterListIcon,
  FilterAlt as FilterAltIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchJobs } from '../../store/actions/jobActions';
import JobCard from './JobCard';
import { useResponsive } from '../../utils/responsive';
import MobileJobCard from '../mobile/MobileJobCard';
import EmptyState from '../common/EmptyState';

/**
 * JobList Component
 * Displays a paginated list of jobs based on search/filter criteria
 */
const JobList = ({ searchParams = {} }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();
  
  const { jobs, loading, error, totalJobs, totalPages } = useSelector(state => state.jobs);
  
  // Local state for pagination and sorting
  const [page, setPage] = useState(searchParams.page || 1);
  const [sortBy, setSortBy] = useState(searchParams.sort || 'recent');
  
  // Fetch jobs when component mounts or search params change
  useEffect(() => {
    const params = {
      page,
      limit: 10,
      sort: sortBy,
      ...searchParams
    };
    
    dispatch(searchJobs(params));
  }, [dispatch, page, sortBy, searchParams]);
  
  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
    // Update URL with new page number
    const params = new URLSearchParams(location.search);
    params.set('page', value);
    navigate(`${location.pathname}?${params.toString()}`);
  };
  
  // Handle sort change
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(1); // Reset to first page when sorting changes
    
    // Update URL with new sort parameter
    const params = new URLSearchParams(location.search);
    params.set('sort', event.target.value);
    params.delete('page'); // Reset page parameter
    navigate(`${location.pathname}?${params.toString()}`);
  };
  
  // If loading and no jobs yet, show loading indicator
  if (loading && !jobs.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }
  
  // If no jobs found, show empty state
  if (!jobs.length) {
    return (
      <EmptyState
        icon={<TravelExploreIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />}
        title="No jobs found"
        description="Try adjusting your search criteria or check back later for new opportunities."
        action={
          <Button 
            variant="contained" 
            onClick={() => navigate('/jobs')}
          >
            Clear Filters
          </Button>
        }
      />
    );
  }
  
  return (
    <Box>
      {/* Results header with sorting and counts */}
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={2}>
        <Typography variant="subtitle1" gutterBottom={isMobile}>
          Showing {jobs.length} of {totalJobs} jobs
          {searchParams.keyword && <> matching "{searchParams.keyword}"</>}
          {searchParams.location && <> in {searchParams.location}</>}
        </Typography>
        
        <Box display="flex" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              id="sort-by"
              value={sortBy}
              label="Sort By"
              onChange={handleSortChange}
              startAdornment={<FilterAltIcon fontSize="small" sx={{ mr: 1 }} />}
            >
              <MenuItem value="recent">Most Recent</MenuItem>
              <MenuItem value="relevant">Most Relevant</MenuItem>
              <MenuItem value="salary_high">Highest Salary</MenuItem>
              <MenuItem value="salary_low">Lowest Salary</MenuItem>
              <MenuItem value="alphabetical">A-Z</MenuItem>
            </Select>
          </FormControl>
          
          {isMobile && (
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />} 
              sx={{ ml: 1 }}
              onClick={() => navigate('/jobs/filters')}
            >
              Filters
            </Button>
          )}
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Job cards */}
      <Grid container spacing={2}>
        {jobs.map(job => (
          <Grid item xs={12} key={job._id}>
            {isMobile ? <MobileJobCard job={job} /> : <JobCard job={job} />}
          </Grid>
        ))}
      </Grid>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4} mb={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
            siblingCount={isMobile ? 0 : 1}
          />
        </Box>
      )}
    </Box>
  );
};

export default JobList;