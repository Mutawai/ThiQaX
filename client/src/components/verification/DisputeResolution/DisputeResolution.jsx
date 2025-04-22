// src/components/verification/DisputeResolution/DisputeResolution.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  Divider,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  FormHelperText,
  Alert,
  AlertTitle,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Send as SendIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  AccessTime as AccessTimeIcon,
  Flag as FlagIcon,
  UploadFile as UploadFileIcon,
  Description as DescriptionIcon,
  ArrowDropDown as ArrowDropDownIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Message as MessageIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import styles from './DisputeResolution.module.css';
import { formatDateTime } from '../../../utils/dateUtils';
import LoadingSpinner from '../../common/LoadingSpinner';

/**
 * DisputeResolution component allows users to submit and track disputes for verification results
 * 
 * @param {Object} props
 * @param {Object} props.disputeData - Current dispute data if a dispute exists
 * @param {Object} props.verificationData - Verification data that is being disputed
 * @param {Array} props.disputeHistory - History of past disputes
 * @param {Function} props.onSubmitDispute - Function to submit a new dispute
 * @param {Function} props.onSubmitEvidence - Function to submit additional evidence
 * @param {Function} props.onCancelDispute - Function to cancel a dispute
 * @param {Function} props.onRespondToMediator - Function to respond to mediator requests
 * @param {Function} props.onRefreshDispute - Function to refresh dispute data
 * @param {boolean} props.loading - Loading state
 * @param {string} props.documentId - ID of the document
 */
const DisputeResolution = ({
  disputeData,
  verificationData,
  disputeHistory = [],
  onSubmitDispute,
  onSubmitEvidence,
  onCancelDispute,
  onRespondToMediator,
  onRefreshDispute,
  loading = false,
  documentId
}) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [disputeType, setDisputeType] = useState('VERIFICATION_ERROR');
  const [mediatorResponse, setMediatorResponse] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Get active step based on dispute status
  const getActiveStep = () => {
    if (!disputeData) return -1;
    
    switch (disputeData.status) {
      case 'SUBMITTED':
        return 0;
      case 'UNDER_REVIEW':
        return 1;
      case 'NEEDS_INFORMATION':
        return 1;
      case 'RESOLVED':
      case 'REJECTED':
        return 2;
      default:
        return 0;
    }
  };

  // Handle file selection
  const handleFileChange = (event) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  // Remove a file from the list
  const handleRemoveFile = (fileToRemove) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };
// Handle form submission
  const handleSubmitDispute = async (event) => {
    event.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!reason.trim()) newErrors.reason = 'Reason is required';
    if (!details.trim()) newErrors.details = 'Details are required';
    if (!disputeType) newErrors.disputeType = 'Dispute type is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (onSubmitDispute) {
        await onSubmitDispute({
          documentId,
          reason,
          details,
          disputeType,
          files
        });
      }
      
      // Reset form
      setReason('');
      setDetails('');
      setDisputeType('VERIFICATION_ERROR');
      setFiles([]);
      setErrors({});
    } catch (error) {
      console.error('Error submitting dispute:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle submitting additional evidence
  const handleSubmitEvidence = async () => {
    if (!evidenceDescription.trim() && files.length === 0) {
      setErrors({...errors, evidence: 'Please provide a description or upload files'});
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (onSubmitEvidence) {
        await onSubmitEvidence({
          disputeId: disputeData.id,
          description: evidenceDescription,
          files
        });
      }
      
      // Reset form
      setEvidenceDescription('');
      setFiles([]);
      setErrors({});
    } catch (error) {
      console.error('Error submitting evidence:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle responding to mediator
  const handleRespondToMediator = async () => {
    if (!mediatorResponse.trim()) {
      setErrors({...errors, mediatorResponse: 'Response is required'});
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (onRespondToMediator) {
        await onRespondToMediator({
          disputeId: disputeData.id,
          response: mediatorResponse,
          files
        });
      }
      
      // Reset form
      setMediatorResponse('');
      setFiles([]);
      setErrors({});
    } catch (error) {
      console.error('Error responding to mediator:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle canceling dispute
  const handleCancelDispute = async () => {
    if (window.confirm('Are you sure you want to cancel this dispute? This action cannot be undone.')) {
      setIsSubmitting(true);
      
      try {
        if (onCancelDispute) {
          await onCancelDispute(disputeData.id);
        }
      } catch (error) {
        console.error('Error canceling dispute:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Get status chip color based on dispute status
  const getStatusChipProps = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return { color: 'info', icon: <FlagIcon /> };
      case 'UNDER_REVIEW':
        return { color: 'warning', icon: <AccessTimeIcon /> };
      case 'NEEDS_INFORMATION':
        return { color: 'warning', icon: <InfoIcon /> };
      case 'RESOLVED':
        return { color: 'success', icon: <CheckIcon /> };
      case 'REJECTED':
        return { color: 'error', icon: <ClearIcon /> };
      default:
        return { color: 'default', icon: <FlagIcon /> };
    }
  };

  // If loading, show loading indicator
  if (loading) {
    return <LoadingSpinner />;
  }

  // Render dispute form if no active dispute exists
  if (!disputeData) {
    return (
      <Paper elevation={2} className={styles.container}>
        <Box className={styles.header}>
          <Box className={styles.titleRow}>
            <Box className={styles.iconContainer}>
              <GavelIcon fontSize="large" />
            </Box>
            <Typography variant="h5" component="h2">
              Dispute Resolution
            </Typography>
          </Box>
          
          {disputeHistory.length > 0 && (
            <Box className={styles.historyBox}>
              <Button
                startIcon={<HistoryIcon />}
                onClick={() => setHistoryDialogOpen(true)}
                size="small"
                className={styles.historyButton}
              >
                View Dispute History ({disputeHistory.length})
              </Button>
            </Box>
          )}
        </Box>

        <Divider />

        <Box component="form" onSubmit={handleSubmitDispute} className={styles.disputeForm}>
          <Typography variant="subtitle1" gutterBottom>
            Submit a Dispute
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            If you believe there is an error in the verification results, you can submit a dispute. Our team will review your case and provide a resolution.
          </Typography>
          
          <Box className={styles.formField}>
            <FormControl fullWidth error={!!errors.disputeType}>
              <InputLabel id="dispute-type-label">Dispute Type</InputLabel>
              <Select
                labelId="dispute-type-label"
                id="dispute-type"
                value={disputeType}
                label="Dispute Type"
                onChange={(e) => setDisputeType(e.target.value)}
              >
                <MenuItem value="VERIFICATION_ERROR">Verification Error</MenuItem>
                <MenuItem value="DOCUMENT_MISCLASSIFIED">Document Misclassified</MenuItem>
                <MenuItem value="INFORMATION_INCORRECT">Information Incorrect</MenuItem>
                <MenuItem value="SYSTEM_ERROR">System Error</MenuItem>
                <MenuItem value="OTHER">Other Issue</MenuItem>
              </Select>
              {errors.disputeType && <FormHelperText>{errors.disputeType}</FormHelperText>}
            </FormControl>
          </Box>
          
          <Box className={styles.formField}>
            <TextField
              fullWidth
              label="Reason for Dispute"
              placeholder="Brief explanation of why you're disputing the verification"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={!!errors.reason}
              helperText={errors.reason}
              required
            />
          </Box>
          
          <Box className={styles.formField}>
            <TextField
              fullWidth
              label="Dispute Details"
              placeholder="Provide specific details about the issue..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              multiline
              rows={4}
              error={!!errors.details}
              helperText={errors.details}
              required
            />
          </Box>
          
          <Box className={styles.fileUploadSection}>
            <Typography variant="subtitle2" gutterBottom>
              Supporting Evidence
            </Typography>
            
            <Box className={styles.fileInputContainer}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                className={styles.uploadButton}
              >
                Upload Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  hidden
                />
              </Button>
              
              <Typography variant="caption" color="textSecondary">
                Upload any relevant documents or screenshots (max 5MB per file)
              </Typography>
            </Box>
            
            {files.length > 0 && (
              <Stack spacing={1} className={styles.fileList}>
                {files.map((file, index) => (
                  <Box key={index} className={styles.fileItem}>
                    <DescriptionIcon fontSize="small" className={styles.fileIcon} />
                    <Typography variant="body2" className={styles.fileName}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {(file.size / 1024).toFixed(1)} KB
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleRemoveFile(file)}
                      className={styles.removeFileButton}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
          
          <Box className={styles.formActions}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </Box>
        </Box>

        {/* Dispute History Dialog */}
        <Dialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Dispute History
            <IconButton
              onClick={() => setHistoryDialogOpen(false)}
              className={styles.closeButton}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {disputeHistory.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No dispute history available
              </Typography>
            ) : (
              <List>
                {disputeHistory.map((dispute, index) => {
                  const statusProps = getStatusChipProps(dispute.status);
                  
                  return (
                    <ListItem key={index} alignItems="flex-start" divider={index < disputeHistory.length - 1}>
                      <ListItemIcon>
                        <GavelIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box className={styles.historyItemHeader}>
                            <Typography variant="subtitle2">
                              {dispute.reason}
                            </Typography>
                            <Chip
                              size="small"
                              label={dispute.status.replace('_', ' ')}
                              color={statusProps.color}
                              icon={statusProps.icon}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span" display="block">
                              {dispute.details}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Submitted on {formatDateTime(dispute.createdAt)}
                              {dispute.resolvedAt && ` • Resolved on ${formatDateTime(dispute.resolvedAt)}`}
                            </Typography>
                            {dispute.resolution && (
                              <Box className={styles.resolutionBox}>
                                <Typography variant="caption" fontWeight="bold">
                                  Resolution:
                                </Typography>
                                <Typography variant="body2">
                                  {dispute.resolution}
                                </Typography>
                              </Box>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    );
  }
// Render active dispute with stepper
  const activeStep = getActiveStep();
  const statusProps = getStatusChipProps(disputeData.status);

  return (
    <Paper elevation={2} className={styles.container}>
      <Box className={styles.header}>
        <Box className={styles.titleRow}>
          <Box className={styles.iconContainer}>
            <GavelIcon fontSize="large" />
          </Box>
          <Typography variant="h5" component="h2">
            Active Dispute
          </Typography>
          <Chip
            label={disputeData.status.replace('_', ' ')}
            color={statusProps.color}
            icon={statusProps.icon}
            className={styles.statusChip}
          />
        </Box>
        
        <Typography variant="body2" color="textSecondary" className={styles.subtitle}>
          Dispute ID: {disputeData.id} • Submitted on {formatDateTime(disputeData.createdAt)}
        </Typography>
        
        <Box className={styles.actionButtons}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => onRefreshDispute && onRefreshDispute(disputeData.id)}
            size="small"
          >
            Refresh Status
          </Button>
          
          {disputeData.status !== 'RESOLVED' && disputeData.status !== 'REJECTED' && (
            <Button
              startIcon={<CancelIcon />}
              onClick={handleCancelDispute}
              color="error"
              size="small"
              disabled={isSubmitting}
            >
              Cancel Dispute
            </Button>
          )}
        </Box>
      </Box>

      <Divider />

      <Box className={styles.disputeContent}>
        <Box className={styles.disputeSummary}>
          <Typography variant="subtitle1" gutterBottom>
            {disputeData.reason}
          </Typography>
          <Typography variant="body2" paragraph>
            {disputeData.details}
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            Dispute Type: <span className={styles.disputeType}>{disputeData.disputeType.replace('_', ' ')}</span>
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} orientation="vertical" className={styles.stepper}>
          <Step>
            <StepLabel>Dispute Submitted</StepLabel>
            <StepContent>
              <Typography variant="body2">
                Your dispute has been submitted and will be reviewed by our team. You will be notified of any updates.
              </Typography>
              <Box className={styles.stepperButtonContainer}>
                <Typography variant="caption" color="textSecondary">
                  Submitted on {formatDateTime(disputeData.createdAt)}
                </Typography>
              </Box>
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>Under Review</StepLabel>
            <StepContent>
              {disputeData.status === 'NEEDS_INFORMATION' ? (
                <>
                  <Alert severity="info" className={styles.mediatorAlert}>
                    <AlertTitle>Additional Information Requested</AlertTitle>
                    <Typography variant="body2">
                      {disputeData.mediatorNotes}
                    </Typography>
                  </Alert>
                  
                  <Box className={styles.mediatorResponseForm}>
                    <TextField
                      fullWidth
                      label="Your Response"
                      placeholder="Provide the requested information..."
                      value={mediatorResponse}
                      onChange={(e) => setMediatorResponse(e.target.value)}
                      multiline
                      rows={3}
                      error={!!errors.mediatorResponse}
                      helperText={errors.mediatorResponse}
                      margin="normal"
                    />
                    
                    <Box className={styles.fileInputContainer}>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        size="small"
                      >
                        Attach Files
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          hidden
                        />
                      </Button>
                      
                      {files.length > 0 && (
                        <Typography variant="caption">
                          {files.length} file(s) selected
                        </Typography>
                      )}
                    </Box>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                      onClick={handleRespondToMediator}
                      disabled={isSubmitting}
                      className={styles.responseButton}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Response'}
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="body2">
                    Your dispute is currently being reviewed by our resolution team. This process typically takes 1-3 business days.
                  </Typography>
                  
                  <Box className={styles.additionalEvidenceForm}>
                    <Typography variant="subtitle2" gutterBottom>
                      Submit Additional Evidence (Optional)
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Evidence Description"
                      placeholder="Describe the additional evidence you're providing..."
                      value={evidenceDescription}
                      onChange={(e) => setEvidenceDescription(e.target.value)}
                      margin="normal"
                      error={!!errors.evidence}
                      helperText={errors.evidence}
                    />
                    
                    <Box className={styles.fileInputContainer}>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        size="small"
                      >
                        Attach Files
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          hidden
                        />
                      </Button>
                      
                      {files.length > 0 && (
                        <Typography variant="caption">
                          {files.length} file(s) selected
                        </Typography>
                      )}
                    </Box>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                      onClick={handleSubmitEvidence}
                      disabled={isSubmitting}
                      className={styles.evidenceButton}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
                    </Button>
                  </Box>
                </>
              )}
              
              {disputeData.lastUpdated && (
                <Box className={styles.stepperButtonContainer}>
                  <Typography variant="caption" color="textSecondary">
                    Last updated on {formatDateTime(disputeData.lastUpdated)}
                  </Typography>
                </Box>
              )}
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>Resolution</StepLabel>
            <StepContent>
              {disputeData.status === 'RESOLVED' ? (
                <Alert severity="success" className={styles.resolutionAlert}>
                  <AlertTitle>Dispute Resolved</AlertTitle>
                  <Typography variant="body2">
                    {disputeData.resolution}
                  </Typography>
                </Alert>
              ) : disputeData.status === 'REJECTED' ? (
                <Alert severity="error" className={styles.resolutionAlert}>
                  <AlertTitle>Dispute Rejected</AlertTitle>
                  <Typography variant="body2">
                    {disputeData.resolution}
                  </Typography>
                </Alert>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Waiting for resolution...
                </Typography>
              )}
              
              {disputeData.resolvedAt && (
                <Box className={styles.stepperButtonContainer}>
                  <Typography variant="caption" color="textSecondary">
                    Resolved on {formatDateTime(disputeData.resolvedAt)}
                  </Typography>
                </Box>
              )}
            </StepContent>
          </Step>
        </Stepper>
        
        {disputeData.mediatorCommunication && disputeData.mediatorCommunication.length > 0 && (
          <Box className={styles.communicationHistory}>
            <Typography variant="subtitle2" gutterBottom className={styles.sectionTitle}>
              <MessageIcon fontSize="small" className={styles.sectionIcon} />
              Communication History
            </Typography>
            
            <List className={styles.communicationList}>
              {disputeData.mediatorCommunication.map((comm, index) => (
                <ListItem key={index} className={styles.communicationItem}>
                  <ListItemText
                    primary={
                      <Box className={styles.communicationHeader}>
                        <Typography variant="body2" fontWeight={500}>
                          {comm.fromUser ? 'You' : 'Mediator'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDateTime(comm.timestamp)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" className={styles.communicationMessage}>
                        {comm.message}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

DisputeResolution.propTypes = {
  disputeData: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'RESOLVED', 'REJECTED']).isRequired,
    reason: PropTypes.string.isRequired,
    details: PropTypes.string.isRequired,
    disputeType: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    lastUpdated: PropTypes.string,
    resolvedAt: PropTypes.string,
    resolution: PropTypes.string,
    mediatorNotes: PropTypes.string,
    mediatorCommunication: PropTypes.arrayOf(
      PropTypes.shape({
        message: PropTypes.string.isRequired,
        timestamp: PropTypes.string.isRequired,
        fromUser: PropTypes.bool.isRequired
      })
    )
  }),
  verificationData: PropTypes.object,
  disputeHistory: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      reason: PropTypes.string.isRequired,
      details: PropTypes.string,
      createdAt: PropTypes.string.isRequired,
      resolvedAt: PropTypes.string,
      resolution: PropTypes.string
    })
  ),
  onSubmitDispute: PropTypes.func,
  onSubmitEvidence: PropTypes.func,
  onCancelDispute: PropTypes.func,
  onRespondToMediator: PropTypes.func,
  onRefreshDispute: PropTypes.func,
  loading: PropTypes.bool,
  documentId: PropTypes.string
};

export default DisputeResolution;