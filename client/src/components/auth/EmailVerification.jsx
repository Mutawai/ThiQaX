// src/components/auth/EmailVerification.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from './useAuth';
import { HelpPanel } from '../documentation/HelpPanel';

const EmailVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, verifyEmail, resendVerificationEmail, error, clearError } = useAuth();
  
  // Extract token from URL if present
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  // Local state
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);
  
  // Automatically attempt to verify if token is present
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        setVerifying(true);
        try {
          await verifyEmail(token);
          setVerified(true);
        } catch (err) {
          setVerificationError(err.message || 'Verification failed. The token may be invalid or expired.');
        } finally {
          setVerifying(false);
        }
      }
    };
    
    verifyToken();
  }, [token, verifyEmail]);
  
  // Pre-fill email field with user's email if available
  useEffect(() => {
    if (user && user.email) {
      setResendEmail(user.email);
    }
  }, [user]);
  
  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!resendEmail) return;
    
    setResending(true);
    setResendSuccess(false);
    
    try {
      await resendVerificationEmail(resendEmail);
      setResendSuccess(true);
    } catch (err) {
      // Error is handled by auth context
    } finally {
      setResending(false);
    }
  };
  
  // Render verification result
  const renderVerificationResult = () => {
    if (verifying) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" align="center">
            Verifying your email...
          </Typography>
        </Box>
      );
    }
    
    if (verified) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 3 }} />
          <Typography variant="h6" align="center" gutterBottom>
            Email Successfully Verified!
          </Typography>
          <Typography variant="body1" align="center" paragraph>
            Your email has been verified. You can now access all features of ThiQaX.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/dashboard"
              sx={{ mr: 2 }}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/profile"
            >
              Complete Your Profile
            </Button>
          </Box>
        </Box>
      );
    }
    
    if (verificationError) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <ErrorIcon color="error" sx={{ fontSize: 60, mb: 3 }} />
          <Typography variant="h6" align="center" gutterBottom>
            Verification Failed
          </Typography>
          <Typography variant="body1" align="center" color="error" paragraph>
            {verificationError}
          </Typography>
          <Typography variant="body2" align="center" paragraph>
            The verification link may have expired or is invalid. Please request a new verification email.
          </Typography>
        </Box>
      );
    }
    
    return null;
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
      <HelpPanel workflow="email-verification" />
      
      <Paper elevation={3} sx={{ width: '100%', p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton
            component={RouterLink}
            to={token ? "/auth/login" : "/dashboard"}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Email Verification
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Show verification result if token was provided */}
        {token && renderVerificationResult()}
        
        {/* Show resend form if no token or verification failed */}
        {(!token || verificationError) && (
          <Box sx={{ mt: token ? 3 : 0 }}>
            <Typography variant="body1" paragraph>
              {!token 
                ? "Please verify your email address to access all features of ThiQaX. Check your inbox for a verification link, or request a new one below."
                : "Request a new verification link using the form below."}
            </Typography>
            
            {resendSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Verification email sent! Please check your inbox and click the verification link.
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 2 }}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mr: 2 }}
              />
              
              <Button
                variant="contained"
                color="primary"
                startIcon={resending ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={handleResendVerification}
                disabled={resending || !resendEmail}
                sx={{ height: 56 }}
              >
                Send
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              If you don't receive the email within a few minutes, check your spam folder or make sure the email address is correct.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default EmailVerification;