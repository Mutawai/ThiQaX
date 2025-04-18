// src/components/jobs/ApplyModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Divider,
  FormHelperText,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Description as DescriptionIcon,
  CloudUpload as CloudUploadIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Business as BusinessIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { applyForJob } from '../../store/actions/applicationActions';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';

// Step validation schemas
const validationSchemas = [
  // Step 0: Verification & Requirements
  Yup.object({}),
  
  // Step 1: Application Details
  Yup.object({
    coverLetter: Yup.string()
      .required('Cover letter is required')
      .min(100, 'Cover letter should be at least 100 characters')
      .max(5000, 'Cover letter should not exceed 5000 characters'),
    relevantExperience: Yup.string()
      .required('Relevant experience is required')
      .min(50, 'Please provide more details about your relevant experience')
      .max(2000, 'Experience details should not exceed 2000 characters'),
    expectedSalary: Yup.number()
      .positive('Expected salary must be positive')
      .nullable(),
    availableFrom: Yup.date()
      .nullable()
      .min(new Date(), 'Availability date cannot be in the past')
      .required('Please specify when you can start'),
  }),
  
  // Step 2: Documents
  Yup.object({
    documents: Yup.array()
      .min(1, 'Please select at least one document')
  }),
  
  // Step 3: Terms & Submission
  Yup.object({
    agreeToTerms: Yup.boolean()
      .oneOf([true], 'You must agree to the terms and conditions')
  })
];

// Steps in the application process
const steps = [
  'Verification & Requirements',
  'Application Details',
  'Documents',
  'Review & Submit'
];

const ApplyModal = ({ open, onClose, job }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [agreementChecked, setAgreementChecked] = useState(false);
  
  const { loading, error, success } = useSelector(state => state.applications);
  const { documents } = useSelector(state => state.documents);
  const { eligibility } = useSelector(state => state.applications);
  
  // Reset step when modal opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSelectedDocuments([]);
      setAgreementChecked(false);
    }
  }, [open]);
  
  // Formik setup
  const formik = useFormik({
    initialValues: {
      coverLetter: '',
      relevantExperience: '',
      expectedSalary: '',
      availableFrom: null,
      documents: [],
      agreeToTerms: false
    },
    validationSchema: validationSchemas[activeStep],
    onSubmit: (values) => {
      if (activeStep === steps.length - 1) {
        handleSubmit(values);
      } else {
        handleNext();
      }
    }
  });
  
  // Handle next step
  const handleNext = async () => {
    const errors = await formik.validateForm();
    formik.setTouched(
      Object.keys(errors).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );
    
    if (Object.keys(errors).length === 0) {
      // If documents step, update documents array
      if (activeStep === 2) {
        formik.setFieldValue('documents', selectedDocuments);
      }
      
      // If terms step, update agreement
      if (activeStep === 3) {
        formik.setFieldValue('agreeToTerms', agreementChecked);
      }
      
      setActiveStep(prevStep => prevStep + 1);
    } else {
      formik.setErrors(errors);
    }
  };
  
  // Handle previous step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Handle document selection
  const handleDocumentToggle = (docId) => {
    const newSelectedDocs = selectedDocuments.includes(docId)
      ? selectedDocuments.filter(id => id !== docId)
      : [...selectedDocuments, docId];
    
    setSelectedDocuments(newSelectedDocs);
  };
  
  // Handle final submission
  const handleSubmit = (values) => {
    const applicationData = {
      job: job._id,
      coverLetter: values.coverLetter,
      relevantExperience: values.relevantExperience,
      expectedSalary: values.expectedSalary,
      availableFrom: values.availableFrom,
      documents: selectedDocuments,
      additionalNotes: values.additionalNotes
    };
    
    dispatch(applyForJob(applicationData));
  };
  
  // Render verification step
  const renderVerificationStep = () => {
    if (!eligibility) {
      return (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Checking eligibility...
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        {!eligibility.eligible ? (
          <Box>
            <Alert 
              severity="warning" 
              variant="outlined"
              sx={{ mb: 3 }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Profile Completion Required
              </Typography>
              <Typography variant="body2">
                You need to complete your profile before applying for this job.
              </Typography>
            </Alert>
            
            <Typography variant="subtitle1" gutterBottom>
              Missing Requirements:
            </Typography>
            
            <List>
              {eligibility.missingRequirements?.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  onClose();
                  navigate('/profile');
                }}
              >
                Complete Your Profile
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Alert 
              severity="success" 
              variant="outlined"
              sx={{ mb: 3 }}
            >
              <Typography variant="subtitle2" gutterBottom>
                You're Eligible to Apply
              </Typography>
              <Typography variant="body2">
                Great news! Your profile meets all the requirements for this position.
              </Typography>
            </Alert>
            
            <Typography variant="subtitle1" gutterBottom>
              Job Requirements:
            </Typography>
            
            <List>
              {job.requirements?.split('\n').filter(Boolean).map((requirement, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={requirement} />
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Please review the job details carefully before proceeding with your application.
                The next steps will ask you to provide a cover letter and select relevant documents.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    );
  };
  
  // Render application details step
  const renderApplicationDetailsStep = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Tell the employer why you're a great fit
        </Typography>
        
        <TextField
          fullWidth
          id="coverLetter"
          name="coverLetter"
          label="Cover Letter"
          multiline
          rows={6}
          value={formik.values.coverLetter}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.coverLetter && Boolean(formik.errors.coverLetter)}
          helperText={
            (formik.touched.coverLetter && formik.errors.coverLetter) ||
            "Introduce yourself and explain why you're interested in this position"
          }
          sx={{ mb: 3 }}
        />
        
        <TextField
          fullWidth
          id="relevantExperience"
          name="relevantExperience"
          label="Relevant Experience"
          multiline
          rows={4}
          value={formik.values.relevantExperience}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.relevantExperience && Boolean(formik.errors.relevantExperience)}
          helperText={
            (formik.touched.relevantExperience && formik.errors.relevantExperience) ||
            "Describe your experience related to this role"
          }
          sx={{ mb: 3 }}
        />
        
        <Grid container spacing={2}>
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
              helperText={
                (formik.touched.expectedSalary && formik.errors.expectedSalary) ||
                "Optional - Enter your salary expectation"
              }
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="availableFrom"
              name="availableFrom"
              label="Available From"
              type="date"
              value={formik.values.availableFrom || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.availableFrom && Boolean(formik.errors.availableFrom)}
              helperText={
                (formik.touched.availableFrom && formik.errors.availableFrom) ||
                "When can you start working?"
              }
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render documents step
  const renderDocumentsStep = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Select Documents to Include
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Choose documents that are relevant to this job application.
          Your CV/Resume will be included automatically.
        </Typography>
        
        {documents && documents.length > 0 ? (
          <List>
            {documents.map((doc) => (
              <ListItem 
                key={doc._id}
                secondaryAction={
                  <Checkbox
                    edge="end"
                    checked={selectedDocuments.includes(doc._id)}
                    onChange={() => handleDocumentToggle(doc._id)}
                  />
                }
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: selectedDocuments.includes(doc._id) ? 'action.selected' : 'transparent'
                }}
              >
                <ListItemIcon>
                  <DescriptionIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={doc.documentName} 
                  secondary={
                    <>
                      {doc.documentType}
                      {doc.verificationStatus === 'VERIFIED' && (
                        <Chip 
                          label="Verified" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </>
                  } 
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              You don't have any documents uploaded yet.
            </Alert>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CloudUploadIcon />}
              onClick={() => {
                onClose();
                navigate('/profile/documents');
              }}
            >
              Upload Documents
            </Button>
          </Box>
        )}
        
        {selectedDocuments.length === 0 && documents?.length > 0 && (
          <FormHelperText error>
            Please select at least one document
          </FormHelperText>
        )}
      </Box>
    );
  };
  
  // Render terms and submission step
  const renderSubmissionStep = () => {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Review Your Application
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Job Information
          </Typography>
          <List dense>
            <ListItem disablePadding>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <BusinessIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Position" 
                secondary={`${job.title} at ${job.company?.name || job.employer?.companyName}`} 
              />
            </ListItem>
          </List>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Your Cover Letter
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {formik.values.coverLetter.substring(0, 100)}
            {formik.values.coverLetter.length > 100 ? '...' : ''}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Documents
          </Typography>
          <List dense>
            {selectedDocuments.map((docId) => {
              const doc = documents.find(d => d._id === docId);
              return (
                <ListItem key={docId} disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <DescriptionIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={doc?.documentName} />
                </ListItem>
              );
            })}
          </List>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Additional Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Expected Salary:</strong> {formik.values.expectedSalary ? `$${formik.values.expectedSalary}` : 'Not specified'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Available From:</strong> {formik.values.availableFrom ? new Date(formik.values.availableFrom).toLocaleDateString() : 'Not specified'}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <FormControl error={formik.touched.agreeToTerms && Boolean(formik.errors.agreeToTerms)}>
          <FormControlLabel
            control={
              <Checkbox
                checked={agreementChecked}
                onChange={(e) => setAgreementChecked(e.target.checked)}
                color="primary"
              />
            }
            label="I confirm that all information provided is accurate and complete. I understand that any false information may result in my application being rejected."
          />
          {formik.touched.agreeToTerms && formik.errors.agreeToTerms && (
            <FormHelperText>{formik.errors.agreeToTerms}</FormHelperText>
          )}
        </FormControl>
      </Box>
    );
  };
  
  // Render success step
  const renderSuccessStep = () => {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Application Submitted Successfully!
        </Typography>
        <Typography variant="body1" paragraph>
          Your application for <strong>{job.title}</strong> has been submitted to {job.company?.name || job.employer?.companyName}.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          You can track the status of your application in the "My Applications" section of your dashboard.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            onClose();
            navigate('/applications');
          }}
          sx={{ mt: 2 }}
        >
          View My Applications
        </Button>
      </Box>
    );
  };
  
  // Render current step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderVerificationStep();
      case 1:
        return renderApplicationDetailsStep();
      case 2:
        return renderDocumentsStep();
      case 3:
        return renderSubmissionStep();
      case 4:
        return renderSuccessStep();
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={success ? onClose : null}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {success ? 'Application Submitted' : `Apply for ${job?.title}`}
          </Typography>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={onClose}
            disabled={loading}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      {/* Show stepper only before success */}
      {!success && (
        <Box sx={{ width: '100%', px: 3, pt: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}
      
      <DialogContent dividers sx={{ pb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success ? (
          // Show 