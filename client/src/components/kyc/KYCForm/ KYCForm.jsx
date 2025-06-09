// client/src/components/kyc/KYCForm/KYCForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  TextField,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Stack
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { uploadDocument } from '../../../redux/actions/documentActions';
import { updateKYCStatus, submitKYCVerification } from '../../../redux/actions/profileActions';
import DocumentVerification from '../DocumentVerification/DocumentVerification';
import styles from './KYCForm.module.css';

// Validation schema for personal information
const personalInfoSchema = Yup.object({
  fullName: Yup.string().required('Full name is required'),
  dateOfBirth: Yup.date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future'),
  nationality: Yup.string().required('Nationality is required'),
  idNumber: Yup.string().required('ID number is required'),
  idType: Yup.string().required('ID type is required'),
  phoneNumber: Yup.string()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Invalid phone number')
    .required('Phone number is required')
});

// Validation schema for address information
const addressSchema = Yup.object({
  addressLine1: Yup.string().required('Address is required'),
  addressLine2: Yup.string(),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State/Province is required'),
  postalCode: Yup.string().required('Postal code is required'),
  country: Yup.string().required('Country is required')
});

const steps = [
  'Personal Information',
  'Address Details',
  'Document Upload',
  'Review & Submit'
];

const KYCForm = ({ onComplete, onCancel }) => {
  const dispatch = useDispatch();
  const { user, kycStatus } = useSelector(state => state.auth);
  const { uploadProgress } = useSelector(state => state.documents);
  
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState({
    idDocument: null,
    addressProof: null,
    selfie: null
  });

  // Initialize formik for personal info
  const personalInfoFormik = useFormik({
    initialValues: {
      fullName: user?.fullName || '',
      dateOfBirth: user?.dateOfBirth || '',
      nationality: user?.nationality || '',
      idNumber: '',
      idType: '',
      phoneNumber: user?.phoneNumber || ''
    },
    validationSchema: personalInfoSchema,
    onSubmit: (values) => {
      handleNext();
    }
  });

  // Initialize formik for address
  const addressFormik = useFormik({
    initialValues: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    validationSchema: addressSchema,
    onSubmit: (values) => {
      handleNext();
    }
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDocumentUpload = async (documentType, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('category', 'kyc');

      const uploadedDoc = await dispatch(uploadDocument(formData));
      
      setUploadedDocuments(prev => ({
        ...prev,
        [documentType]: uploadedDoc
      }));
    } catch (error) {
      setError(`Failed to upload ${documentType}: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const kycData = {
        personalInfo: personalInfoFormik.values,
        address: addressFormik.values,
        documents: {
          idDocument: uploadedDocuments.idDocument?.id,
          addressProof: uploadedDocuments.addressProof?.id,
          selfie: uploadedDocuments.selfie?.id
        }
      };

      await dispatch(submitKYCVerification(kycData));
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      setError(error.message || 'Failed to submit KYC verification');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" onSubmit={personalInfoFormik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="fullName"
                  label="Full Name"
                  value={personalInfoFormik.values.fullName}
                  onChange={personalInfoFormik.handleChange}
                  onBlur={personalInfoFormik.handleBlur}
                  error={personalInfoFormik.touched.fullName && Boolean(personalInfoFormik.errors.fullName)}
                  helperText={personalInfoFormik.touched.fullName && personalInfoFormik.errors.fullName}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  value={personalInfoFormik.values.dateOfBirth}
                  onChange={personalInfoFormik.handleChange}
                  onBlur={personalInfoFormik.handleBlur}
                  error={personalInfoFormik.touched.dateOfBirth && Boolean(personalInfoFormik.errors.dateOfBirth)}
                  helperText={personalInfoFormik.touched.dateOfBirth && personalInfoFormik.errors.dateOfBirth}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="nationality"
                  label="Nationality"
                  value={personalInfoFormik.values.nationality}
                  onChange={personalInfoFormik.handleChange}
                  onBlur={personalInfoFormik.handleBlur}
                  error={personalInfoFormik.touched.nationality && Boolean(personalInfoFormik.errors.nationality)}
                  helperText={personalInfoFormik.touched.nationality && personalInfoFormik.errors.nationality}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>ID Type</InputLabel>
                  <Select
                    name="idType"
                    value={personalInfoFormik.values.idType}
                    onChange={personalInfoFormik.handleChange}
                    onBlur={personalInfoFormik.handleBlur}
                    error={personalInfoFormik.touched.idType && Boolean(personalInfoFormik.errors.idType)}
                  >
                    <MenuItem value="passport">Passport</MenuItem>
                    <MenuItem value="nationalId">National ID</MenuItem>
                    <MenuItem value="driverLicense">Driver's License</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="idNumber"
                  label="ID Number"
                  value={personalInfoFormik.values.idNumber}
                  onChange={personalInfoFormik.handleChange}
                  onBlur={personalInfoFormik.handleBlur}
                  error={personalInfoFormik.touched.idNumber && Boolean(personalInfoFormik.errors.idNumber)}
                  helperText={personalInfoFormik.touched.idNumber && personalInfoFormik.errors.idNumber}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="phoneNumber"
                  label="Phone Number"
                  value={personalInfoFormik.values.phoneNumber}
                  onChange={personalInfoFormik.handleChange}
                  onBlur={personalInfoFormik.handleBlur}
                  error={personalInfoFormik.touched.phoneNumber && Boolean(personalInfoFormik.errors.phoneNumber)}
                  helperText={personalInfoFormik.touched.phoneNumber && personalInfoFormik.errors.phoneNumber}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box component="form" onSubmit={addressFormik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="addressLine1"
                  label="Address Line 1"
                  value={addressFormik.values.addressLine1}
                  onChange={addressFormik.handleChange}
                  onBlur={addressFormik.handleBlur}
                  error={addressFormik.touched.addressLine1 && Boolean(addressFormik.errors.addressLine1)}
                  helperText={addressFormik.touched.addressLine1 && addressFormik.errors.addressLine1}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="addressLine2"
                  label="Address Line 2 (Optional)"
                  value={addressFormik.values.addressLine2}
                  onChange={addressFormik.handleChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="city"
                  label="City"
                  value={addressFormik.values.city}
                  onChange={addressFormik.handleChange}
                  onBlur={addressFormik.handleBlur}
                  error={addressFormik.touched.city && Boolean(addressFormik.errors.city)}
                  helperText={addressFormik.touched.city && addressFormik.errors.city}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="state"
                  label="State/Province"
                  value={addressFormik.values.state}
                  onChange={addressFormik.handleChange}
                  onBlur={addressFormik.handleBlur}
                  error={addressFormik.touched.state && Boolean(addressFormik.errors.state)}
                  helperText={addressFormik.touched.state && addressFormik.errors.state}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="postalCode"
                  label="Postal Code"
                  value={addressFormik.values.postalCode}
                  onChange={addressFormik.handleChange}
                  onBlur={addressFormik.handleBlur}
                  error={addressFormik.touched.postalCode && Boolean(addressFormik.errors.postalCode)}
                  helperText={addressFormik.touched.postalCode && addressFormik.errors.postalCode}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="country"
                  label="Country"
                  value={addressFormik.values.country}
                  onChange={addressFormik.handleChange}
                  onBlur={addressFormik.handleBlur}
                  error={addressFormik.touched.country && Boolean(addressFormik.errors.country)}
                  helperText={addressFormik.touched.country && addressFormik.errors.country}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <DocumentVerification
            onUpload={handleDocumentUpload}
            uploadedDocuments={uploadedDocuments}
            uploadProgress={uploadProgress}
          />
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Information
            </Typography>
            
            <Paper className={styles.reviewSection}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Full Name</Typography>
                  <Typography variant="body1">{personalInfoFormik.values.fullName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                  <Typography variant="body1">{personalInfoFormik.values.dateOfBirth}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">ID Type</Typography>
                  <Typography variant="body1">{personalInfoFormik.values.idType}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">ID Number</Typography>
                  <Typography variant="body1">{personalInfoFormik.values.idNumber}</Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper className={styles.reviewSection}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Address
              </Typography>
              <Typography variant="body1">
                {addressFormik.values.addressLine1}<br />
                {addressFormik.values.addressLine2 && <>{addressFormik.values.addressLine2}<br /></>}
                {addressFormik.values.city}, {addressFormik.values.state} {addressFormik.values.postalCode}<br />
                {addressFormik.values.country}
              </Typography>
            </Paper>
            
            <Paper className={styles.reviewSection}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Documents
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" alignItems="center">
                  {uploadedDocuments.idDocument ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                  <Typography variant="body1" ml={1}>ID Document</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  {uploadedDocuments.addressProof ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                  <Typography variant="body1" ml={1}>Address Proof</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  {uploadedDocuments.selfie ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                  <Typography variant="body1" ml={1}>Selfie with ID</Typography>
                </Box>
              </Stack>
            </Paper>
            
            <FormControlLabel
              control={
                <Checkbox
                  name="consent"
                  color="primary"
                />
              }
              label="I confirm that all information provided is accurate and true"
            />
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Box className={styles.kycForm}>
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              {getStepContent(index)}
              
              <Box sx={{ mb: 2, mt: 3 }}>
                <Stack direction="row" spacing={2}>
                  {activeStep > 0 && (
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      startIcon={<BackIcon />}
                    >
                      Back
                    </Button>
                  )}
                  
                  {activeStep < steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (activeStep === 0) {
                          personalInfoFormik.handleSubmit();
                        } else if (activeStep === 1) {
                          addressFormik.handleSubmit();
                        } else {
                          handleNext();
                        }
                      }}
                      endIcon={<NextIcon />}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={submitting || !uploadedDocuments.idDocument || !uploadedDocuments.addressProof}
                      startIcon={submitting && <CircularProgress size={20} />}
                    >
                      {submitting ? 'Submitting...' : 'Submit for Verification'}
                    </Button>
                  )}
                  
                  {onCancel && (
                    <Button variant="text" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                </Stack>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default KYCForm;