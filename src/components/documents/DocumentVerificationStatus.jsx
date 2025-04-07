// src/components/documents/DocumentVerificationStatus.jsx
import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent,
  StepConnector,
  styled
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  CloudUpload,
  Verified,
  HourglassEmpty
} from '@mui/icons-material';
import { formatDate } from '../../utils/dateUtils';

const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.divider,
    borderLeftWidth: 2,
  },
}));

const DocumentVerificationStatus = ({ document }) => {
  if (!document) return null;
  
  const getActiveStep = () => {
    switch (document.status) {
      case 'VERIFIED':
        return 2;
      case 'REJECTED':
        return 1;
      case 'PENDING':
        return 1;
      default:
        return 0;
    }
  };
  
  const getStatusIcon = (step) => {
    if (step === 0) {
      return <CloudUpload color="primary" />;
    }
    
    if (step === 1) {
      if (document.status === 'PENDING') {
        return <HourglassEmpty color="warning" />;
      }
      if (document.status === 'REJECTED') {
        return <Cancel color="error" />;
      }
    }
    
    if (step === 2 && document.status === 'VERIFIED') {
      return <CheckCircle color="success" />;
    }
    
    return <Pending color="disabled" />;
  };
  
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Verification Status
      </Typography>
      
      <Box sx={{ my: 2 }}>
        <Typography variant="subtitle1">
          {document.documentName}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Document ID: {document._id}
        </Typography>
      </Box>
      
      <Stepper activeStep={getActiveStep()} orientation="vertical" connector={<CustomStepConnector />}>
        <Step>
          <StepLabel StepIconComponent={() => getStatusIcon(0)}>
            <Typography variant="subtitle2">Document Uploaded</Typography>
          </StepLabel>
          <StepContent>
            <Typography variant="body2">
              You uploaded this document on {formatDate(document.createdAt)}.
            </Typography>
          </StepContent>
        </Step>
        
        <Step>
          <StepLabel StepIconComponent={() => getStatusIcon(1)}>
            <Typography variant="subtitle2">Verification Process</Typography>
          </StepLabel>
          <StepContent>
            {document.status === 'PENDING' && (
              <Typography variant="body2">
                Your document is currently being reviewed. This process typically takes 1-2 business days.
              </Typography>
            )}
            {document.status === 'REJECTED' && document.verificationNotes && (
              <Typography variant="body2">
                Your document was rejected: {document.verificationNotes}
              </Typography>
            )}
            {document.status === 'REJECTED' && !document.verificationNotes && (
              <Typography variant="body2">
                Your document was rejected. Please upload a clearer or more recent document.
              </Typography>
            )}
          </StepContent>
        </Step>
        
        <Step>
          <StepLabel StepIconComponent={() => getStatusIcon(2)}>
            <Typography variant="subtitle2">Verification Complete</Typography>
          </StepLabel>
          <StepContent>
            {document.status === 'VERIFIED' && (
              <Typography variant="body2">
                Your document was verified on {formatDate(document.verificationDate)}.
                {document.expiryDate && (
                  <> This document is valid until {formatDate(document.expiryDate)}.</>
                )}
              </Typography>
            )}
          </StepContent>
        </Step>
      </Stepper>
      
      {document.status === 'REJECTED' && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="error.main">
            Next Steps:
          </Typography>
          <Typography variant="body2">
            Please upload a new document that addresses the issues mentioned in the rejection reason.
          </Typography>
        </Box>
      )}
      
      {document.status === 'VERIFIED' && document.expiryDate && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="success.main">
            Document Verified
          </Typography>
          <Typography variant="body2">
            This document is now verified and will be valid until {formatDate(document.expiryDate)}.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DocumentVerificationStatus;
