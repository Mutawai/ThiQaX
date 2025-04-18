// src/components/auth/RegisterForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Link,
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Google as GoogleIcon,
  LinkedIn as LinkedInIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import useAuth from './useAuth';
import UserTypeSelection from './UserTypeSelection';

// Validation schemas for each step
const validationSchemas = [
  // Step 0: User Type
  Yup.object({
    userType: Yup.string()
      .oneOf(['jobSeeker', 'agent', 'sponsor'], 'Please select a valid user type')
      .required('Please select a user type')
  }),
  
  // Step 1: Personal Information
  Yup.object({
    firstName: Yup.string()
      .required('First name is required')
      .min(2, 'First name must be at least 2 characters'),
    lastName: Yup.string()
      .required('Last name is required')
      .min(2, 'Last name must be at least 2 characters'),
    email: Yup.string()
      .email('Enter a valid email')
      .required('Email is required'),
    phone: Yup.string()
      .matches(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number')
      .required('Phone number is required')
  }),
  
  // Step 2: Security
  Yup.object({
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      )
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Please confirm your password'),
    acceptTerms: Yup.boolean()
      .oneOf([true], 'You must accept the terms and conditions')
  })
];

const RegisterForm = () => {
  const { register, isAuthenticated, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Get the current validation schema based on active step
  const currentValidationSchema = validationSchemas[activeStep];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when unmounting
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Set up formik for form handling
  const formik = useFormik({
    initialValues: {
      userType: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    },
    validationSchema: currentValidationSchema,
    // We'll handle submit manually for multi-step form
    onSubmit: () => {},
    validateOnChange: false
  });

  // Toggle password visibility
  const handleTogglePassword = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

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
      // If this is the final step, submit the form
      if (activeStep === validationSchemas.length - 1) {
        handleSubmit();
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    } else {
      formik.setErrors(errors);
    }
  };

  // Handle going back to previous step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle social registration
  const handleSocialRegistration = (provider) => {
    // This would integrate with your social registration implementation
    console.log(`Social registration with ${provider} - to be implemented`);
  };

  // Handle form submission (final step)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const userData = {
        firstName: formik.values.firstName,
        lastName: formik.values.lastName,
        email: formik.values.email,
        phone: formik.values.phone,
        password: formik.values.password,
        role: formik.values.userType
      };
      
      await register(userData);
      // Success will redirect via the useEffect above
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setActiveStep(1); // Go back to personal info step on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Error message from auth context or local state */}
      {(error || authError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || authError}
        </Alert>
      )}

      {/* Stepper to show progress */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Select Role</StepLabel>
        </Step>
        <Step>
          <StepLabel>Personal Info</StepLabel>
        </Step>
        <Step>
          <StepLabel>Security</StepLabel>
        </Step>
      </Stepper>

      {/* Step content */}
      <Box component="form">
        {/* Step 0: User Type Selection */}
        {activeStep === 0 && (
          <Box>
            <UserTypeSelection
              value={formik.values.userType}
              onChange={(value) => formik.setFieldValue('userType', value)}
              error={formik.touched.userType && Boolean(formik.errors.userType)}
              helperText={formik.touched.userType && formik.errors.userType}
            />
            
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={() => handleSocialRegistration('google')}
                  size="large"
                >
                  Google
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LinkedInIcon />}
                  onClick={() => handleSocialRegistration('linkedin')}
                  size="large"
                >
                  LinkedIn
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 1: Personal Information */}
        {activeStep === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="firstName"
                name="firstName"
                label="First Name"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="phone"
                name="phone"
                label="Phone Number"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={
                  (formik.touched.phone && formik.errors.phone) || 
                  "Include country code (e.g., +254 for Kenya)"
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        )}

        {/* Step 2: Security */}
        {activeStep === 2 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => handleTogglePassword('password')}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => handleTogglePassword('confirmPassword')}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formik.values.acceptTerms}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <Link component={RouterLink} to="/terms" underline="hover" color="primary">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link component={RouterLink} to="/privacy" underline="hover" color="primary">
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                />
                {formik.touched.acceptTerms && formik.errors.acceptTerms && (
                  <Typography variant="caption" color="error">
                    {formik.errors.acceptTerms}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={isSubmitting}
            endIcon={
              isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : activeStep === validationSchemas.length - 1 ? (
                <PersonAddIcon />
              ) : (
                <ArrowForwardIcon />
              )
            }
          >
            {isSubmitting
              ? 'Creating Account...'
              : activeStep === validationSchemas.length - 1
              ? 'Create Account'
              : 'Next'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <Link 
            component={RouterLink} 
            to="/auth/login" 
            underline="hover"
            color="primary"
            fontWeight="medium"
          >
            Sign In
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm;