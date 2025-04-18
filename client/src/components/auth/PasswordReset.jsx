// src/components/auth/PasswordReset.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import useAuth from './useAuth';
import { HelpPanel } from '../documentation/HelpPanel';

const PasswordReset = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestPasswordReset, resetPassword, error, clearError } = useAuth();
  
  // Extract token from URL if present
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  // Local state
  const [activeStep, setActiveStep] = useState(token ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Clear any existing errors when component mounts or unmounts
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  // Validation schemas for each step
  const validationSchemas = [
    // Step 0: Request reset email
    Yup.object({
      email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    }),
    // Step 1: Reset with token
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
    }),
  ];

  // Request password reset form
  const requestFormik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: validationSchemas[0],
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        await requestPasswordReset(values.email);
        setSuccessMessage('If an account exists with this email, you will receive password reset instructions shortly.');
        // Don't advance to next step - user needs to check email
      } catch (err) {
        // Error is handled by auth context
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Reset password form
  const resetFormik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: validationSchemas[1],
    onSubmit: async (values) => {
      if (!token) {
        return; // Shouldn't happen, but just in case
      }
      
      setIsSubmitting(true);
      try {
        await resetPassword(token, values.password);
        setSuccessMessage('Your password has been successfully reset.');
        setActiveStep(2); // Move to success step
      } catch (err) {
        // Error is handled by auth context
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Toggle password visibility
  const handleTogglePassword = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Render appropriate step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" onSubmit={requestFormik.handleSubmit}>
            <Typography variant="body1" paragraph>
              Enter your email address below, and we'll send you instructions to reset your password.
            </Typography>
            
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              value={requestFormik.values.email}
              onChange={requestFormik.handleChange}
              onBlur={requestFormik.handleBlur}
              error={requestFormik.touched.email && Boolean(requestFormik.errors.email)}
              helperText={requestFormik.touched.email && requestFormik.errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
              margin="normal"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 3, mb: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Send Reset Instructions'}
            </Button>
          </Box>
        );
      case 1:
        return (
          <Box component="form" onSubmit={resetFormik.handleSubmit}>
            <Typography variant="body1" paragraph>
              Enter your new password below.
            </Typography>
            
            <TextField
              fullWidth
              id="password"
              name="password"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={resetFormik.values.password}
              onChange={resetFormik.handleChange}
              onBlur={resetFormik.handleBlur}
              error={resetFormik.touched.password && Boolean(resetFormik.errors.password)}
              helperText={resetFormik.touched.password && resetFormik.errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => handleTogglePassword('password')}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              margin="normal"
            />
            
            <TextField
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={resetFormik.values.confirmPassword}
              onChange={resetFormik.handleChange}
              onBlur={resetFormik.handleBlur}
              error={resetFormik.touched.confirmPassword && Boolean(resetFormik.errors.confirmPassword)}
              helperText={resetFormik.touched.confirmPassword && resetFormik.errors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => handleTogglePassword('confirmPassword')}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              margin="normal"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 3, mb: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Password Reset Complete
            </Typography>
            <Typography variant="body1" paragraph>
              Your password has been successfully reset.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/auth/login"
              sx={{ mt: 2 }}
            >
              Log In with New Password
            </Button>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 600,
        mx: 'auto',
        p: 2
      }}
    >
      <HelpPanel workflow="password-reset" />
      
      <Paper elevation={3} sx={{ width: '100%', p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton
            component={RouterLink}
            to="/auth/login"
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Reset Your Password
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Request Reset</StepLabel>
          </Step>
          <Step>
            <StepLabel>Set New Password</StepLabel>
          </Step>
          <Step>
            <StepLabel>Complete</StepLabel>
          </Step>
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}
        
        {getStepContent(activeStep)}
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Remember your password?{' '}
            <RouterLink to="/auth/login" style={{ textDecoration: 'none' }}>
              Sign In
            </RouterLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default PasswordReset;