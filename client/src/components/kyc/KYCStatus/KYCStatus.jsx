// client/src/components/kyc/KYCStatus/KYCStatus.jsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Alert,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Description as DocumentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { checkKYCStatus, downloadKYCCertificate } from '../../../redux/actions/profileActions';
import styles from './KYCStatus.module.css';

const statusConfig = {
  unverified: {
    label: 'Not Started',
    color: 'default',
    icon: <ErrorIcon />,
    description: 'You have not started the KYC verification process.'
  },
  pending: {
    label: 'Pending Review',
    color: 'warning',
    icon: <PendingIcon />,
    description: 'Your documents are being reviewed by our verification team.'
  },
  verified: {
    label: 'Verified',
    color: 'success',
    icon: <CheckIcon />,
    description: 'Your identity has been successfully verified.'
  },
  rejected: {
    label: 'Rejected',
    color: 'error',
    icon: <CancelIcon />,
    description: 'Your verification was rejected. Please review the feedback and resubmit.'
  },
  expired: {
    label: 'Expired',
    color: 'error',
    icon: <ErrorIcon />,
    description: 'Your verification has expired. Please submit new documents.'
  },
  incomplete: {
    label: 'Incomplete',
    color: 'warning',
    icon: <WarningIcon />,
    description: 'Additional documents are required to complete verification.'
  }
};

const KYCStatus = ({ showActions = true, compact = false, onStartVerification }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { kycStatus, kycDetails, profile } = useSelector(state => state.auth);
  const [refreshing, setRefreshing] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  const status = kycStatus || 'unverified';
  const config = statusConfig[status] || statusConfig.unverified;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(checkKYCStatus());
    } catch (error) {
      console.error('Failed to refresh KYC status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadCertificate = async () => {
    setDownloading(true);
    try {
      await dispatch(downloadKYCCertificate());
    } catch (error) {
      console.error('Failed to download certificate:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleStartVerification = () => {
    if (onStartVerification) {
      onStartVerification();
    } else {
      navigate('/profile/kyc');
    }
  };

  const handleResubmit = () => {
    navigate('/profile/kyc/resubmit');
  };

  if (compact) {
    return (
      <Box className={styles.compactStatus}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            icon={config.icon}
            label={config.label}
            color={config.color}
            size="small"
          />
          {status === 'verified' && (
            <Tooltip title="Download Certificate">
              <IconButton size="small" onClick={handleDownloadCertificate} disabled={downloading}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Paper className={styles.kycStatus}>
      <Box className={styles.header}>
        <Typography variant="h6" component="h2">
          KYC Verification Status
        </Typography>
        <Tooltip title="Refresh Status">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon className={refreshing ? styles.rotating : ''} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box className={styles.statusDisplay}>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Box className={`${styles.statusIcon} ${styles[status]}`}>
            {config.icon}
          </Box>
          <Box flex={1}>
            <Typography variant="h5" component="div">
              {config.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {config.description}
            </Typography>
          </Box>
        </Stack>

        {status === 'pending' && (
          <Box mt={3}>
            <Typography variant="body2" gutterBottom>
              Verification Progress
            </Typography>
            <LinearProgress variant="indeterminate" />
            <Typography variant="caption" color="text.secondary" mt={1}>
              Estimated time: 1-2 business days
            </Typography>
          </Box>
        )}

        {status === 'rejected' && kycDetails?.rejectionReason && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Rejection Reason:
            </Typography>
            <Typography variant="body2">
              {kycDetails.rejectionReason}
            </Typography>
          </Alert>
        )}

        {status === 'incomplete' && kycDetails?.missingDocuments && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Missing Documents:
            </Typography>
            <List dense>
              {kycDetails.missingDocuments.map((doc, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <DocumentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={doc} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {status === 'verified' && kycDetails && (
          <Box mt={3}>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Verified On:
                </Typography>
                <Typography variant="body2">
                  {new Date(kycDetails.verifiedAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Valid Until:
                </Typography>
                <Typography variant="body2">
                  {new Date(kycDetails.expiresAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Verification ID:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {kycDetails.verificationId}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Box>

      {showActions && (
        <Box className={styles.actions}>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {status === 'unverified' && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartVerification}
                startIcon={<InfoIcon />}
              >
                Start Verification
              </Button>
            )}
            
            {status === 'rejected' && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleResubmit}
                startIcon={<RefreshIcon />}
              >
                Resubmit Documents
              </Button>
            )}
            
            {status === 'incomplete' && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartVerification}
                startIcon={<DocumentIcon />}
              >
                Upload Missing Documents
              </Button>
            )}
            
            {status === 'expired' && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartVerification}
                startIcon={<RefreshIcon />}
              >
                Renew Verification
              </Button>
            )}
            
            {status === 'verified' && (
              <Button
                variant="outlined"
                onClick={handleDownloadCertificate}
                startIcon={<DownloadIcon />}
                disabled={downloading}
              >
                {downloading ? 'Downloading...' : 'Download Certificate'}
              </Button>
            )}
          </Stack>
        </Box>
      )}

      {status === 'pending' && (
        <Box className={styles.infoBox}>
          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="body2">
              We'll notify you via email once your verification is complete. 
              You can also check back here for updates.
            </Typography>
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default KYCStatus;