// src/components/jobs/JobPostingForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  FormHelperText,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Autocomplete,
  Switch,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Work as WorkIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  BusinessCenter as BusinessCenterIcon,
  Money as MoneyIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Info as InfoIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as ArrowBackIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createJob, 
  updateJob, 
  getJobDetails, 
  validateJob 
} from '../../store/actions/jobActions';
import { getSponsorList } from '../../store/actions/sponsorActions';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { addDays, format } from 'date-fns';
import { HelpPanel } from '../documentation/HelpPanel';
import { Tooltip } from '../documentation/Tooltip';
import JobPreview from './JobPreview';

// Validation schema
const validationSchema = Yup.object({
  sponsorId: Yup.string()
    .required('Sponsor company is required'),
  title: Yup.string()
    .required('Job title is required')
    .min(5, 'Job title must be at least 5 characters')
    .max(100, 'Job title must be less than 100 characters'),
  jobType: Yup.string()
    .required('Job type is required'),
  location: Yup.string()
    .required('Job location is required'),
  description: Yup.string()
    .required('Job description is required')
    .min(100, 'Job description must be at least 100 characters'),
  requirements: Yup.string()
    .required('Job requirements are required')
    .min(50, 'Requirements must be at least 50 characters'),
  responsibilities: Yup.string()
    .required('Job responsibilities are required')
    .min(50, 'Responsibilities must be at least 50 characters'),
  benefits: Yup.string(),
  experience: Yup.string()
    .required('Experience requirement is required'),
  salaryMin: Yup.number()
    .positive('Minimum salary must be positive')
    .required('Minimum salary is required'),
  salaryMax: Yup.number()
    .positive('Maximum salary must be positive')
    .moreThan(Yup.ref('salaryMin'), 'Maximum salary must be greater than minimum salary')
    .required('Maximum salary is required'),
  contractDuration: Yup.string()
    .required('Contract duration is required'),
  deadline: Yup.date()
    .min(new Date(), 'Deadline cannot be in the past')
    .required('Application deadline is required'),
  skills: Yup.array()
    .min(1, 'At least one skill is required')
    .required('Skills are required'),
  featured: Yup.boolean(),
  additionalInfo: Yup.string()
});

// Job types
const jobTypes = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'INTERNSHIP', label: 'Internship' }
];

// Experience levels
const experienceLevels = [
  { value: 'ENTRY_LEVEL', label: 'Entry Level (0-2 years)' },
  { value: 'MID_LEVEL', label: 'Mid Level (2-5 years)' },
  { value: 'SENIOR_LEVEL', label: 'Senior Level (5+ years)' },
  { value: 'MANAGER', label: 'Manager (Team Lead)' },
  { value: 'EXECUTIVE', label: 'Executive (Director, C-Suite)' }
];

// Contract durations
const contractDurations = [
  { value: '3_MONTHS', label: '3 Months' },
  { value: '6_MONTHS', label: '6 Months' },
  { value: '1_YEAR', label: '1 Year' },
  { value: '2_YEARS', label: '2 Years' },
  { value: 'PERMANENT', label: 'Permanent' }
];

// Common skills
const commonSkills = [
  'Customer Service', 'Communication', 'English', 'Arabic', 'Hospitality',
  'Healthcare', 'Nursing', 'Driving', 'Cooking', 'Cleaning',
  'Security', 'Administration', 'Office Management', 'Reception',
  'Sales', 'Retail', 'Manufacturing', 'Construction', 'Engineering',
  'Teaching', 'Childcare', 'IT Support', 'Accounting', 'Management'
];

const JobPostingForm = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Redux state
  const { 
    job,
    loading: jobLoading, 
    error: jobError,
    validationErrors
  } = useSelector(state => state.jobs);
  
  const { 
    sponsors, 
    loading: sponsorsLoading, 
    error: sponsorsError 
  } = useSelector(state => state.sponsors);
  
  const isEditing = Boolean(id);
  
  // Fetch job details for editing
  useEffect(() => {
    if (isEditing && id) {
      dispatch(getJobDetails(id));
    }
    
    // Fetch sponsors list for the dropdown
    dispatch(getSponsorList());
  }, [dispatch, id, isEditing]);
  
  // Initialize form with job data or defaults
  const formik = useFormik({
    initialValues: isEditing && job ? {
      sponsorId: job.sponsorId,
      title: job.title,
      jobType: job.jobType,
      location: job.location,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      benefits: job.benefits || '',
      experience: job.experience,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      contractDuration: job.contractDuration,
      deadline: job.deadline ? new Date(job.deadline) : addDays(new Date(), 30),
      skills: job.skills || [],
      featured: job.featured || false,
      additionalInfo: job.additionalInfo || ''
    } : {
      sponsorId: '',
      title: '',
      jobType: 'FULL_TIME',
      location: '',
      description: '',
      requirements: '',
      responsibilities: '',
      benefits: '',
      experience: 'MID_LEVEL',
      salaryMin: '',
      salaryMax: '',
      contractDuration: '1_YEAR',
      deadline: addDays(new Date(), 30),
      skills: [],
      featured: false,
      additionalInfo: ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      const jobData = {
        ...values,
        deadline: format(values.deadline, 'yyyy-MM-dd')
      };
      
      if (isEditing) {
        dispatch(updateJob(id, jobData))
          .then(() => {
            navigate(`/jobs/${id}`);
          });
      } else {
        dispatch(createJob(jobData))
          .then((response) => {
            navigate(`/jobs/${response.data._id}`);
          });
      }
    }
  });
  
  // Handle job validation
  const handleValidate = () => {
    dispatch(validateJob(formik.values));
  };
  
  // Handle next step in stepper
  const handleNext = async () => {
    const errors = await formik.validateForm();
    const touchedFields = {};
    
    // Get all field names for the current step
    const stepFields = getStepFields(activeStep);
    
    // Mark all fields in the current step as touched
    stepFields.forEach(field => {
      touchedFields[field] = true;
    });
    
    formik.setTouched({ ...formik.touched, ...touchedFields });
    
    // Check if there are any errors in the current step fields
    const hasStepErrors = stepFields.some(field => errors[field]);
    
    if (!hasStepErrors) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  
  // Handle going back in stepper
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Get fields for current step
  const getStepFields = (step) => {
    switch(step) {
      case 0: // Basic Details
        return ['sponsorId', 'title', 'jobType', 'location', 'experience', 'contractDuration', 'deadline'];
      case 1: // Job Description
        return ['description', 'requirements', 'responsibilities', 'benefits'];
      case 2: // Compensation & Skills
        return ['salaryMin', 'salaryMax', 'skills', 'additionalInfo', 'featured'];
      default:
        return [];
    }
  };
  
  // Handle open/close of job preview
  const handlePreviewToggle = () => {
    setPreviewOpen(!previewOpen);
  };
  
  // Create a job object from current form values for preview
  const getPreviewData = () => {
    return {
      ...formik.values,
      sponsor: sponsors?.find(s => s._id === formik.values.sponsorId),
      deadline: formik.values.deadline ? new Date(formik.values.deadline) : null,
      createdAt: new Date(),
      status: 'ACTIVE'
    };
  };

  return (
    <Box>
      <HelpPanel workflow="job-posting" />
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            {isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}
          </Typography>
          
          <Box>
            <Tooltip componentId="job-preview" placement="left">
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={handlePreviewToggle}
                sx={{ mr: 1 }}
              >
                Preview
              </Button>
            </Tooltip>
            
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              component={RouterLink}
              to={isEditing ? `/jobs/${id}` : "/jobs/manage"}
            >
              Cancel
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Error messages */}
        {(jobError || sponsorsError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {jobError || sponsorsError}
          </Alert>
        )}
        
        {/* Validation errors */}
        {validationErrors && validationErrors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Please fix the following issues:
            </Typography>
            <ul style={{ marginTop: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}
        
        <Box component="form" onSubmit={formik.handleSubmit}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Basic Details */}
            <Step key="basic-details">
              <StepLabel>Basic Details</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl 
                      fullWidth 
                      required
                      error={formik.touched.sponsorId && Boolean(formik.errors.sponsorId)}
                    >
                      <InputLabel id="sponsor-label">Sponsor Company</InputLabel>
                      <Select
                        labelId="sponsor-label"
                        id="sponsorId"
                        name="sponsorId"
                        value={formik.values.sponsorId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Sponsor Company"
                        disabled={sponsorsLoading}
                        startAdornment={
                          <InputAdornment position="start">
                            <BusinessCenterIcon />
                          </InputAdornment>
                        }
                      >
                        {sponsors?.map(sponsor => (
                          <MenuItem key={sponsor._id} value={sponsor._id}>
                            {sponsor.companyName}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.sponsorId && formik.errors.sponsorId && (
                        <FormHelperText>{formik.errors.sponsorId}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="title"
                      name="title"
                      label="Job Title"
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.title && Boolean(formik.errors.title)}
                      helperText={formik.touched.title && formik.errors.title}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WorkIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl 
                      fullWidth 
                      required
                      error={formik.touched.jobType && Boolean(formik.errors.jobType)}
                    >
                      <InputLabel id="job-type-label">Job Type</InputLabel>
                      <Select
                        labelId="job-type-label"
                        id="jobType"
                        name="jobType"
                        value={formik.values.jobType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Job Type"
                      >
                        {jobTypes.map(type => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.jobType && formik.errors.jobType && (
                        <FormHelperText>{formik.errors.jobType}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="location"
                      name="location"
                      label="Location"
                      value={formik.values.location}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.location && Boolean(formik.errors.location)}
                      helperText={formik.touched.location && formik.errors.location}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl 
                      fullWidth 
                      required
                      error={formik.touched.experience && Boolean(formik.errors.experience)}
                    >
                      <InputLabel id="experience-label">Experience Level</InputLabel>
                      <Select
                        labelId="experience-label"
                        id="experience"
                        name="experience"
                        value={formik.values.experience}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Experience Level"
                      >
                        {experienceLevels.map(level => (
                          <MenuItem key={level.value} value={level.value}>
                            {level.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.experience && formik.errors.experience && (
                        <FormHelperText>{formik.errors.experience}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl 
                      fullWidth 
                      required
                      error={formik.touched.contractDuration && Boolean(formik.errors.contractDuration)}
                    >
                      <InputLabel id="contract-duration-label">Contract Duration</InputLabel>
                      <Select
                        labelId="contract-duration-label"
                        id="contractDuration"
                        name="contractDuration"
                        value={formik.values.contractDuration}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Contract Duration"
                      >
                        {contractDurations.map(duration => (
                          <MenuItem key={duration.value} value={duration.value}>
                            {duration.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.contractDuration && formik.errors.contractDuration && (
                        <FormHelperText>{formik.errors.contractDuration}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Application Deadline"
                        value={formik.values.deadline}
                        onChange={(value) => formik.setFieldValue('deadline', value)}
                        format="MM/dd/yyyy"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: formik.touched.deadline && Boolean(formik.errors.deadline),
                            helperText: formik.touched.deadline && formik.errors.deadline,
                            InputProps: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CalendarIcon />
                                </InputAdornment>
                              )
                            }
                          }
                        }}
                        disablePast
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<CheckCircleIcon />}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            {/* Step 2: Job D