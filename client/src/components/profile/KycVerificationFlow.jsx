// src/components/profile/KycVerificationFlow.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar
} from '@mui/material';
import {
  VerifiedUser as VerifiedUserIcon,
  AddAPhoto as AddAPhotoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Fingerprint as FingerprintIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { getVerificationStatus } from '../../store/actions/profileActions';
import DocumentUploader from '../documents/DocumentUploader';
import { getDocuments } from '../../store/actions/documentActions';
import useAuth from '../auth/useAuth';
import { HelpPanel } from '../documentation/HelpPanel';

/**
 * KYC Verification Flow Component
 * A step-by-step process for users to complete their KYC verification
 */
const KycVerificationFlow = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Local state
  const [activeStep, setActiveStep] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  
  // Redux state
  const { verificationStatus, loading: statusLoading } = useSelector(state => state.profile);
  const { documents, loading: documentsLoading } = useSelector(state => state.documents);
  
  // Fetch verification status and documents
  useEffect(() => {
    dispatch(getVerificationStatus());
    dispatch(getDocuments());
  }, [dispatch]);
  
  // Check if required documents are uploaded
  useEffect(() => {
    if (documents && documents.length > 0) {
      const hasIdentity = documents.some(doc => doc.documentType === 'identity');
      const hasAddress = documents.some(doc => doc.documentType === 'address');
      
      if (hasIdentity && hasAddress) {
        setUploadComplete(true);
      }
    }
  }, [documents]);
  
  // Calculate initial step based on verification status
  useEffect(() => {
    if (verificationStatus) {
      if (verificationStatus.identityVerified && verificationStatus.addressVerified) {
        // If already verified, go to final step
        setActiveStep(2);
      } else if (uploadComplete) {
        // If documents uploaded but not verified, go to verification step
        setActiveStep(1);
      } else {
        // Start at document upload step
        setActiveStep(0);
      }
    }
  }, [verificationStatus, uploadComplete]);
  
  // Handle next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Handle document upload complete
  const handleUploadComplete = () => {
    dispatch(getDocuments());
    setUploadComplete(true);
  };
  
  // Check if specific document type exists and is verified
  const getDocumentStatus = (type) => {
    if (!documents) return { exists: false, verified: false };
    
    const doc = documents.find(d => d.documentType === type);
    if (!doc) return { exists: false, verified: false };
    
    return { 
      exists: true, 
      verified: doc.status === 'VERIFIED',
      rejected: doc.status === 'REJECTED',
      pending: doc.status === 'PENDING'
    };
  };
  
  const identityDoc = getDocumentStatus('identity');
  const addressDoc = getDocumentStatus('address');
  
  // Loading state
  if ((statusLoading || documentsLoading) && !verificationStatus) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <HelpPanel workflow="kyc-verification" />
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          KYC Verification
        </Typography>
        <Typography variant="body1" paragraph>
          Complete the verification process to unlock all platform features. This verification ensures security and builds trust with employers.
        </Typography>
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Document Upload */}
          <Step key="document-upload">
            <StepLabel StepIconComponent={() => (
              <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28 }}>
                <DescriptionIcon sx={{ fontSize: 16 }} />
              </Avatar>
            )}>
              Document Upload
            </StepLabel>
            <StepContent>
              <Typography variant="body2" paragraph>
                Please upload clear, high-quality images of the following documents:
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{
                    borderColor: identityDoc.exists 
                      ? identityDoc.verified 
                        ? 'success.main' 
                        : identityDoc.rejected 
                          ? 'error.main' 
                          : 'primary.main'
                      : 'divider'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', mr: 2 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">Identity Document</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Passport, National ID, or Driver's License
                          </Typography>
                          
                          {identityDoc.exists && (
                            <Chip 
                              icon={identityDoc.verified ? <CheckCircleIcon /> : identityDoc.rejected ? <CancelIcon /> : null}
                              label={identityDoc.verified ? 'Verified' : identityDoc.rejected ? 'Rejected' : 'Pending'}
                              color={identityDoc.verified ? 'success' : identityDoc.rejected ? 'error' : 'primary'}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {!identityDoc.exists && (
                        <DocumentUploader 
                          initialDocumentType="identity"
                          onUploadComplete={handleUploadComplete}
                        />
                      )}
                      
                      {identityDoc.rejected && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          Your document was rejected. Please upload a clearer image.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{
                    borderColor: addressDoc.exists 
                      ? addressDoc.verified 
                        ? 'success.main' 
                        : addressDoc.rejected 
                          ? 'error.main' 
                          : 'primary.main'
                      : 'divider'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', mr: 2 }}>
                          <DescriptionIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">Proof of Address</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Utility Bill, Bank Statement, or Government Letter (less than 3 months old)
                          </Typography>
                          
                          {addressDoc.exists && (
                            <Chip 
                              icon={addressDoc.verified ? <CheckCircleIcon /> : addressDoc.rejected ? <CancelIcon /> : null}
                              label={addressDoc.verified ? 'Verified' : addressDoc.rejected ? 'Rejected' : 'Pending'}
                              color={addressDoc.verified ? 'success' : addressDoc.rejected ? 'error' : 'primary'}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {!addressDoc.exists && (
                        <DocumentUploader 
                          initialDocumentType="address"
                          onUploadComplete={handleUploadComplete}
                        />
                      )}
                      
                      {addressDoc.rejected && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          Your document was rejected. Please upload a clearer image.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, mb: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!uploadComplete}
                  endIcon={<ArrowForwardIcon />}
                >
                  Continue
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Both document types are required to proceed to the next step.
              </Typography>
            </StepContent>
          </Step>
          
          {/* Step 2: Verification Process */}
          <Step key="verification-process">
            <StepLabel StepIconComponent={() => (
              <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28 }}>
                <FingerprintIcon sx={{ fontSize: 16 }} />
              </Avatar>
            )}>
              Verification Process
            </StepLabel>
            <StepContent>
              <Box sx={{ py: 2 }}>
                <Typography variant="body1" paragraph>
                  Your documents are being reviewed by our verification team. This process typically takes 24-48 hours.
                </Typography>
                
                <Alert severity="info" sx={{ mb: 3 }}>