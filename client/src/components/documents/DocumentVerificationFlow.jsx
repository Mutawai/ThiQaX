// src/components/documents/DocumentVerificationFlow.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  VerifiedUser as VerifiedUserIcon,
  Assignment as AssignmentIcon,
  PhotoCamera as PhotoCameraIcon,
  Check as CheckIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getDocuments } from '../../store/actions/documentActions';
import { getVerificationStatus } from '../../store/actions/profileActions';
import DocumentUploader from './DocumentUploader';
import DocumentVerificationStatus from './DocumentVerificationStatus';
import { useNavigate } from 'react-router-dom';
import { HelpPanel } from '../documentation/HelpPanel';

/**
 * DocumentVerificationFlow Component
 * Guides users through the document verification process for KYC
 */
const DocumentVerificationFlow = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const { documents, loading: documentsLoading } = useSelector(state => state.documents);
  const { verificationStatus, loading: statusLoading } = useSelector(state => state.profile);
  
  // Required document types for verification
  const requiredDocuments = [
    { type: 'identity', label: 'Identity Document (ID/Passport)', description: 'Upload a clear photo or scan of your government-issued ID or passport' },
    { type: 'address', label: 'Proof of Address', description: 'Upload a utility bill, bank statement, or government letter showing your address (less than 3 months old)' },
    { type: 'education', label: 'Educational Certificate', description: 'Upload your highest educational qualification' }
  ];
  
  // Steps in the verification process
  const steps = [
    { label: 'Upload Documents', description: 'Upload the required verification documents' },
    { label: 'Verification Process', description: 'Documents will be reviewed by our team' },
    { label: 'Verification Complete', description: 'Your account is verified and ready to use' }
  ];
  
  // Load documents and verification status
  useEffect(() => {
    dispatch(getDocuments());
    dispatch(getVerificationStatus());
  }, [dispatch]);
  
  // Handle next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Check if all required documents are uploaded
  const checkDocumentsUploaded = () => {
    if (!documents) return false;
    
    return requiredDocuments.every(reqDoc => 
      documents.some(doc => doc.documentType === reqDoc.type)
    );
  };
  
  // Check if verification is complete
  const isVerificationComplete = () => {
    if (!verificationStatus) return false;
    return verificationStatus.identityVerified && verificationStatus.addressVerified;
  };
  
  // Loading state
  if ((documentsLoading || statusLoading) && (!documents || !verificationStatus)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <HelpPanel workflow="document-verification" />
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Document Verification
        </Typography>
        <Typography variant="body1" paragraph>
          Complete the verification process to apply for jobs. This helps build trust with employers and ensures the security of all platform users.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Step content */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Required Documents
            </Typography>
            <Typography variant="body2" paragraph color="text.secondary">
              Please upload clear, high-quality images or scans of the following documents:
            </Typography>
            
            <Grid container spacing={3}>
              {requiredDocuments.map((doc) => {
                const uploaded = documents?.some(d => d.documentType === doc.type);
                const verified = documents?.some(d => d.documentType === doc.type && d.status === 'VERIFIED');
                
                return (
                  <Grid item xs={12} key={doc.type}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2,
                        borderColor: verified ? 'success.main' : uploaded ? 'primary.main' : 'divider',
                        borderWidth: uploaded ? 2 : 1,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {verified && (
                        <Box sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          bgcolor: 'success.main', 
                          color: 'white',
                          px: 2,
                          py: 0.5,
                          transform: 'rotate(45deg) translate(20%, -50%)',
                          transformOrigin: 'top right'
                        }}>
                          <Typography variant="caption" fontWeight="bold">
                            Verified
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          bgcolor: verified ? 'success.lighter' : uploaded ? 'primary.lighter' : 'grey.100',
                          color: verified ? 'success.main' : uploaded ? 'primary.main' : 'text.secondary',
                          mr: 2
                        }}>
                          {verified ? <VerifiedUserIcon /> : uploaded ? <CheckIcon /> : <AssignmentIcon />}
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            {doc.label}
                            {uploaded && !verified && <Typography component="span" variant="caption" color="primary" sx={{ ml: 1 }}>(Under Review)</Typography>}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {doc.description}
                          </Typography>
                          
                          {!uploaded ? (
                            <DocumentUploader 
                              onUploadComplete={() => dispatch(getDocuments())}
                              initialDocumentType={doc.type}
                            />
                          ) : (
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => navigate('/profile/documents')}
                            >
                              View Document
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
                disabled={!checkDocumentsUploaded()}
              >
                Continue
              </Button>
            </Box>
          </Box>
        )}
        
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Verification Process
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: 'primary.lighter', 
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}>
                <PhotoCameraIcon sx={{ fontSize: 40 }} />
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                {isVerificationComplete() ? 'Your documents have been verified!' : 'Your documents are being reviewed'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 560, mx: 'auto', mb: 3 }}>
                {isVerificationComplete() 
                  ? 'Congratulations! Your identity has been verified. You can now apply for jobs with full verification status.'
                  : 'Our team is reviewing your documents to verify your identity. This process typically takes 24-48 hours. You will be notified when the verification is complete.'}
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 2 }}>
                {documents?.filter(doc => requiredDocuments.some(req => req.type === doc.documentType))
                  .map((doc, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <DocumentVerificationStatus document={doc} />
                    </Grid>
                  ))}
              </Grid>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
                disabled={!isVerificationComplete()}
              >
                Continue
              </Button>
            </Box>
          </Box>
        )}
        
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Verification Complete
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: 'success.lighter', 
                color: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}>
                <VerifiedUserIcon sx={{ fontSize: 40 }} />
              </Box>
              
              <Typography variant="h5" gutterBottom>
                Account Verified
              </Typography>
              
              <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 560, mx: 'auto', mb: 3 }}>
                Your account is now fully verified. You can apply for jobs, communicate with employers, and access all platform features.
              </Typography>
              
              <Alert severity="success" sx={{ width: '100%', maxWidth: 560, mb: 3 }}>
                <Typography variant="subtitle2">
                  What this means for you:
                </Typography>
                <ul>
                  <li>Increased trust with employers</li>
                  <li>Priority in job application reviews</li>
                  <li>Access to premium job listings</li>
                  <li>Faster payment processing</li>
                </ul>
              </Alert>
              
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/profile')}
                >
                  View Profile
                </Button>
                
                <Button
                  variant="contained"
                  onClick={() => navigate('/jobs')}
                >
                  Find Jobs
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3 }}>
              <Button
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
              >
                Back
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DocumentVerificationFlow;