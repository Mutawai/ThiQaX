import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Container,
  Grid,
  Link,
  Paper,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardActionArea,
  Checkbox,
  FormControlLabel,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';

// Step 1: User Type Selection
const userTypes = [
  {
    id: 'jobSeeker',
    title: 'Job Seeker',
    icon: <PersonIcon sx={{ fontSize: 48 }} />,
    description: 'Looking for job opportunities in the Middle East'
  },
  {
    id: 'agent',
    title: 'Agent/Recruiter',
    icon: <WorkIcon sx={{ fontSize: 48 }} />,
    description: 'Helping connect job seekers with opportunities'
  },
  {
    id: 'sponsor',
    title: 'Sponsor/Employer',
    icon: <BusinessIcon sx={{ fontSize: 48 }} />,
    description: 'Looking to hire qualified candidates'
  }
];

// Step 2: Registration Form validation schema
const RegistrationSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  acceptTerms: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [userType, setUserType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setActiveStep(1);
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Here you would typically call an API service
      console.log('Registration data:', { userType, ...values });
      
      // Simulate registration delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, let's simulate a successful registration
      // Navigate to the next step (KYC verification) or dashboard
      navigate('/dashboard');
      
      setSubmitting(false);
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationError('An error occurred during registration. Please try again.');
      setSubmitting(false);
    }
  };

  const steps = ['Select User Type', 'Create Account'];

  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          mb: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Join ThiQaX
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {activeStep === 0 ? (
          <Box sx={{ width: '100%' }}>
            <Typography variant="h6" align="center" gutterBottom>
              Select your role on ThiQaX
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" paragraph>
              Choose the option that best describes your purpose on our platform.
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {userTypes.map((type) => (
                <Grid item xs={12} md={4} key={type.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      border: userType === type.id ? '2px solid' : '1px solid',
                      borderColor: userType === type.id ? 'primary.main' : 'divider',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 3
                      }
                    }}
                  >
                    <CardActionArea 
                      sx={{ height: '100%' }}
                      onClick={() => handleUserTypeSelect(type.id)}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        <Box sx={{ color: 'primary.main', mb: 2 }}>
                          {type.icon}
                        </Box>
                        <Typography variant="h5" component="h3" gutterBottom>
                          {type.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {type.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Create Your Account
            </Typography>
            
            {registrationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {registrationError}
              </Alert>
            )}
            
            <Formik
              initialValues={{
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
                acceptTerms: false,
              }}
              validationSchema={RegistrationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        variant="outlined"
                        fullWidth
                        id="firstName"
                        label="First Name"
                        name="firstName"
                        autoComplete="given-name"
                        error={touched.firstName && Boolean(errors.firstName)}
                        helperText={touched.firstName && errors.firstName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        variant="outlined"
                        fullWidth
                        id="lastName"
                        label="Last Name"
                        name="lastName"
                        autoComplete="family-name"
                        error={touched.lastName && Boolean(errors.lastName)}
                        helperText={touched.lastName && errors.lastName}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        variant="outlined"
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email && errors.email}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        variant="outlined"
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="new-password"
                        error={touched.password && Boolean(errors.password)}
                        helperText={touched.password && errors.password}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleShowPassword}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        variant="outlined"
                        fullWidth
                        name="confirmPassword"
                        label="Confirm Password"
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                        helperText={touched.confirmPassword && errors.confirmPassword}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={FormControlLabel}
                        control={<Checkbox color="primary" />}
                        label={
                          <Typography variant="body2">
                            I agree to the{' '}
                            <Link component={RouterLink} to="/terms" target="_blank">
                              Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link component={RouterLink} to="/privacy" target="_blank">
                              Privacy Policy
                            </Link>
                          </Typography>
                        }
                        name="acceptTerms"
                      />
                      {touched.acceptTerms && errors.acceptTerms && (
                        <Typography color="error" variant="caption">
                          {errors.acceptTerms}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button
                      onClick={handleBack}
                      variant="outlined"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" variant="body2">
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default RegisterPage;
