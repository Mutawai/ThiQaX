// client/src/components/kyc/VerificationSteps/VerificationSteps.jsx
import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  StepContent,
  Typography,
  Paper,
  Stack,
  Chip,
  LinearProgress,
  useMediaQuery,
  useTheme,
  styled
} from '@mui/material';
import {
  Person as PersonIcon,
  Home as HomeIcon,
  Description as DocumentIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
  Cancel as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import styles from './VerificationSteps.module.css';

// Custom styled components
const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
  '&.MuiStepConnector-root': {
    marginLeft: theme.spacing(3),
  },
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderLeftWidth: 3,
    minHeight: 50,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: theme.palette.primary.main,
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: theme.palette.success.main,
  },
}));

const CustomStepIcon = ({ icon, active, completed, error }) => {
  const iconMap = {
    1: <PersonIcon />,
    2: <HomeIcon />,
    3: <DocumentIcon />,
    4: <CheckIcon />
  };

  return (
    <Box
      className={`${styles.stepIcon} ${active ? styles.active : ''} ${completed ? styles.completed : ''} ${error ? styles.error : ''}`}
    >
      {completed ? <CheckIcon /> : iconMap[icon]}
    </Box>
  );
};

const VerificationSteps = ({ 
  currentStep = 0, 
  orientation = 'vertical',
  showDetails = true,
  compact = false,
  onStepClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { kycProgress } = useSelector(state => state.auth);
  
  // Use mobile orientation on small screens
  const actualOrientation = isMobile ? 'vertical' : orientation;

  const steps = [
    {
      label: 'Personal Information',
      description: 'Provide your basic personal details',
      status: kycProgress?.personalInfo || 'pending',
      completedAt: kycProgress?.personalInfoCompletedAt,
      estimatedTime: '2 minutes',
      fields: ['Full Name', 'Date of Birth', 'Nationality', 'ID Number']
    },
    {
      label: 'Address Details',
      description: 'Confirm your residential address',
      status: kycProgress?.address || 'pending',
      completedAt: kycProgress?.addressCompletedAt,
      estimatedTime: '1 minute',
      fields: ['Street Address', 'City', 'State/Province', 'Postal Code', 'Country']
    },
    {
      label: 'Document Upload',
      description: 'Upload verification documents',
      status: kycProgress?.documents || 'pending',
      completedAt: kycProgress?.documentsCompletedAt,
      estimatedTime: '5 minutes',
      fields: ['ID Document', 'Address Proof', 'Selfie with ID']
    },
    {
      label: 'Review & Submit',
      description: 'Review and submit for verification',
      status: kycProgress?.review || 'pending',
      completedAt: kycProgress?.reviewCompletedAt,
      estimatedTime: '1 minute',
      fields: ['Confirm Information', 'Accept Terms', 'Submit']
    }
  ];

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  const renderStepContent = (step, index) => {
    const status = getStepStatus(index);
    
    if (!showDetails || compact) return null;

    return (
      <StepContent>
        <Box className={styles.stepContent}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {step.description}
          </Typography>
          
          {status === 'active' && (
            <Stack spacing={2} mt={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Estimated time: {step.estimatedTime}
                </Typography>
              </Box>
              
              {step.fields && (
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Required fields:
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {step.fields.map((field) => (
                      <Chip
                        key={field}
                        label={field}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
          
          {status === 'completed' && step.completedAt && (
            <Typography variant="caption" color="success.main">
              Completed on {new Date(step.completedAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </StepContent>
    );
  };

  if (compact) {
    return (
      <Box className={styles.compactSteps}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Step {currentStep + 1} of {steps.length}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(currentStep / steps.length) * 100}
            sx={{ flex: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="body2" fontWeight="medium">
            {steps[currentStep]?.label}
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Paper className={styles.verificationSteps} elevation={0}>
      <Stepper 
        activeStep={currentStep} 
        orientation={actualOrientation}
        connector={<CustomStepConnector />}
      >
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isClickable = onStepClick && (status === 'completed' || status === 'active');
          
          return (
            <Step key={index} completed={status === 'completed'}>
              <StepLabel
                StepIconComponent={(props) => (
                  <CustomStepIcon 
                    {...props} 
                    icon={index + 1}
                    error={step.status === 'error'}
                  />
                )}
                onClick={isClickable ? () => onStepClick(index) : undefined}
                className={isClickable ? styles.clickableStep : ''}
              >
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    color={status === 'active' ? 'primary' : 'text.primary'}
                  >
                    {step.label}
                  </Typography>
                  {actualOrientation === 'horizontal' && !isMobile && (
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  )}
                </Box>
              </StepLabel>
              {actualOrientation === 'vertical' && renderStepContent(step, index)}
            </Step>
          );
        })}
      </Stepper>
      
      {showDetails && !compact && (
        <Box className={styles.progressSummary}>
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="center"
            mt={3}
          >
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {Math.round((currentStep / steps.length) * 100)}% Complete
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={(currentStep / steps.length) * 100}
            sx={{ mt: 1, height: 8, borderRadius: 4 }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default VerificationSteps;