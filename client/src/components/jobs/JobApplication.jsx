// src/components/jobs/JobApplication.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import {
  Description as DescriptionIcon,
  CloudUpload as CloudUploadIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getJobDetails, 
  getRelatedJobs 
} from '../../store/actions/jobActions';
import { 
  submitApplication, 
  checkApplicationEligibility 
} from '../../store/actions/applicationActions';
import { getDocuments } from '../../store/actions/documentActions';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, addDays } from 'date-fns';
import useAuth from '../auth/useAuth';
import { HelpPanel } from '../documentation/HelpPanel';

// Validation schema
const validationSchema = Yup.object({
  coverLetter: Yup.string()
    .required('Cover letter is required')
    .min(100, 'Cover letter should be at least 100 characters')
    .max(5000, 'Cover letter should not exceed 5000 characters'),
  expectedSalary: Yup.number()
    .positive('Expected salary must be positive')
    .nullable(),
  availableFromDate: Yup.date()
    .required('Availability date is required')
    .min(new Date(), 'Availability date cannot be in the past'),
  noticePeriod: Yup.string()
    .nullable(),
  relocate: Yup.boolean()
    .required('Please indicate your willingness to relocate'),
  documents: Yup.array()
    .min(1, 'Please select at least one document')
    .required('Please select at least one document'),
  additionalNotes: Yup.string()
    .max(1000, 'Additional notes should not exceed 1000 characters'),
  agreeToTerms: Yup.boolean()
    .oneOf([true], 'You must agree to the terms and conditions')
});

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { isAuthenticated, user } = useAuth();
  
  const { job, loading: jobLoading, error: jobError, relatedJobs } = useSelector(state => state.jobs);
  const { documents, loading: documentsLoading } = useSelector(state => state.documents);
  const { 
    eligibility, 
    loading: eligibilityLoading, 
    submitting, 
    error: applicationError, 
    success 
  } = useSelector(state => state.applications);
  
  const [activeStep, setActiveStep] = useState(0);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Number of days in notice period options
  const noticePeriodOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: '1week', label: '1 Week' },
    { value: '2weeks', label: '2 Weeks' },
    { value: '1month', label: '1 Month' },
    { value: 'more', label: 'More than 1 Month' }
  ];
  
  // Load job details and documents
  useEffect(() => {
    if (jobId) {
      dispatch(getJobDetails(jobId));
      dispatch(getDocuments());
      dispatch(getRelatedJobs(jobId, 4));
    }
  }, [dispatch, jobId]);
  
  // Check eligibility when job is loaded
  useEffect(() => {
    if (job && isAuthenticated) {
      dispatch(checkApplicationEligibility(job._id));
    }
  }, [dispatch, job, isAuthenticated]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login', { 
        state: { from: `/jobs/${jobId}/apply`, message: 'Please log in to apply for this job' } 
      });
    }
  }, [isAuthenticated, navigate, jobId]);
  
  // Redirect on successful application
  useEffect(() => {
    if (success) {
      // Allow the success message to be visible briefly before redirecting
      const timer = setTimeout(() => {
        navigate('/applications');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);
  
  // Formik for form handling
  const formik = useFormik({
    initialValues: {
      coverLetter: '',
      expectedSalary: '',
      availableFromDate: addDays(new Date(), 14), // Default to 2 weeks from now
      noticePeriod: '2weeks',
      relocate: true,
      documents: [],
      additionalNotes: '',
      agreeToTerms: false
    },
    validationSchema,
    onSubmit: (values) => {
      const applicationData = {
        job: jobId,
        coverLetter: values.coverLetter,
        expectedSalary: values.expectedSalary || null,
        availableFromDate: format(values.availableFromDate, 'yyyy-MM-dd'),
        noticePeriod: values.noticePeriod,
        relocate: values.relocate,
        documents: values.documents,
        additionalNotes: values.additionalNotes,
      };
      
      dispatch(submitApplication(applicationData));
    }
  });
  
  // Handle document selection
  const handleDocumentToggle = (docId) => {
    const currentDocs = formik.values.documents;
    const newDocs = currentDocs.includes(docId)
      ? currentDocs.filter(id => id !== docId)
      : [...currentDocs, docId];
    
    formik.setFieldValue('documents', newDocs);
  };
  
  // Handle document preview
  const handleDocumentPreview = (doc) => {
    setPreviewDocument(doc);
    setPreviewOpen(true);
  };
  
  // Handle step navigation
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Check if job is closed or expired
  const isJobClosed = job?.status === 'CLOSED' || 
    (job?.deadline && new Date(job.deadline) < new Date());
  
  // Show loading if data is being fetched
  if ((jobLoading || !job) && !jobError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }
  
  // Show error message if job is not found
  if (jobError) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {jobError}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          component={RouterLink}
          to="/jobs"
        >
          Back to Jobs
        </Button>
      </Paper>
    );
  }
  
  // Show error if job is closed
  if (isJobClosed) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          This job is no longer accepting applications. The position has been closed or the application deadline has passed.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          component={RouterLink}
          to={`/jobs/${jobId}`}
        >
          Back to Job Details
        </Button>
      </Paper>
    );
  }
  
  return (
    <Box>
      <HelpPanel workflow="job-application" />
      
      {/* Success message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your application has been submitted successfully! Redirecting to your applications...
        </Alert>
      )}
      
      {/* Error messages */}
      {applicationError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {applicationError}
        </Alert>
      )}
      
      {/* Eligibility check */}
      {eligibility && !eligibility.eligible && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Alert severity="warning" variant="outlined" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Complete your profile to apply
            </Typography>
            <Typography variant="body2">
              You need to complete your profile before applying for this job.
            </Typography>
          </Alert>
          
          <Typography variant="subtitle1" gutterBottom>
            Missing requirements:
          </Typography>
          
          <List dense>
            {eligibility.missingRequirements?.map((item, index) => (
              <ListItem key={index} disablePadding>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <CancelIcon color="error" />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              component={RouterLink}
              to={`/jobs/${jobId}`}
            >
              Back to Job Details
            </Button>
            
            <Button
              variant="contained"
              component={RouterLink}
              to="/profile"
            >
              Complete Profile
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Application form - only show if eligible */}
      {eligibility && eligibility.eligible && (
        <Box component="form" onSubmit={formik.handleSubmit}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            {/* Job overview */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <Typography variant="h5" component="h1" gutterBottom>
                    Application for {job.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {job.company?.name || job.employer?.companyName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    component={RouterLink}
                    to={`/jobs/${jobId}`}
                    sx={{ mb: { xs: 1, sm: 0 } }}
                  >
                    Back to Job
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Stepper */}
            <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
              {/* Step 1: Cover Letter */}
              <Step key="coverLetter">
                <StepLabel>Cover Letter</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Introduce yourself and explain why you're interested in this position.
                    Highlight relevant skills and experience that make you a strong candidate.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    id="coverLetter"
                    name="coverLetter"
                    label="Cover Letter"
                    multiline
                    rows={10}
                    value={formik.values.coverLetter}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.coverLetter && Boolean(formik.errors.coverLetter)}
                    helperText={formik.touched.coverLetter && formik.errors.coverLetter}
                    placeholder="Dear Hiring Manager,

I am writing to express my interest in the [Job Title] position at [Company Name]. With my background in [relevant experience], I believe I would be a valuable addition to your team.

[Highlight your relevant skills and experiences that match the job requirements]

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experiences align with your needs.

Sincerely,
[Your Name]"
                  />
                  
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ mt: 1, mr: 1 }}
                      disabled={!formik.values.coverLetter || (formik.touched.coverLetter && Boolean(formik.errors.coverLetter))}
                    >
                      Continue
                    </Button>
                  </Box>
                </StepContent>
              </Step>
              
              {/* Step 2: Additional Details */}
              <Step key="additionalDetails">
                <StepLabel>Additional Details</StepLabel>
                <StepContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="expectedSalary"
                        name="expectedSalary"
                        label="Expected Salary (USD)"
                        type="number"
                        value={formik.values.expectedSalary}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.expectedSalary && Boolean(formik.errors.expectedSalary)}
                        helperText={formik.touched.expectedSalary && formik.errors.expectedSalary}
                        InputProps={{
                          startAdornment: (
                            <AttachMoneyIcon color="action" sx={{ mr: 1 }} />
                          )
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Available From"
                          value={formik.values.availableFromDate}
                          onChange={(value) => formik.setFieldValue('availableFromDate', value)}
                          format="MM/dd/yyyy"
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: formik.touched.availableFromDate && Boolean(formik.errors.availableFromDate),
                              helperText: formik.touched.availableFromDate && formik.errors.availableFromDate,
                              InputProps: {
                                startAdornment: (
                                  <CalendarIcon color="action" sx={{ mr: 1 }} />
                                )
                              }
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="notice-period-label">Notice Period</InputLabel>
                        <Select
                          labelId="notice-period-label"
                          id="noticePeriod"
                          name="noticePeriod"
                          value={formik.values.noticePeriod}
                          onChange={formik.handleChange}
                          label="Notice Period"
                          startAdornment={
                            <WorkIcon color="action" sx={{ mr: 1 }} />
                          }
                        >
                          {noticePeriodOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="relocate-label">Willing to Relocate</InputLabel>
                        <Select
                          labelId="relocate-label"
                          id="relocate"
                          name="relocate"
                          value={formik.values.relocate}
                          onChange={formik.handleChange}
                          label="Willing to Relocate"
                          startAdornment={
                            <PersonIcon color="action" sx={{ mr: 1 }} />
                          }
                        >
                          <MenuItem value={true}>Yes</MenuItem>
                          <MenuItem value={false}>No</MenuItem>
                        </Select>
                        <FormHelperText>
                          {job.location ? `This job is located in ${job.location}` : 'Location may require relocation'}
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="additionalNotes"
                        name="additionalNotes"
                        label="Additional Notes (Optional)"
                        multiline
                        rows={4}
                        value={formik.values.additionalNotes}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.additionalNotes && Boolean(formik.errors.additionalNotes)}
                        helperText={formik.touched.additionalNotes && formik.errors.additionalNotes}
                        placeholder="Add any additional information you'd like the employer to know about your application."
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Continue
                    </Button>
                  </Box>
                </StepContent>
              </Step>
              
              {/* Step 3: Select Documents */}
              <Step key="documents">
                <StepLabel>Select Documents</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Select the documents you want to include with your application.
                    We recommend including your CV/resume and any relevant certificates.
                  </Typography>
                  
                  {documentsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
         