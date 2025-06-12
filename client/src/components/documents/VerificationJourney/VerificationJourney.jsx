// src/components/documents/VerificationJourney/VerificationJourney.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Grid,
  Alert,
  LinearProgress,
  Avatar,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Zoom,
  Fade
} from '@mui/material';
import {
  VerifiedUser as VerifiedIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as ProgressIcon,
  Star as StarIcon,
  Badge as BadgeIcon,
  School as EducationIcon,
  Work as WorkIcon,
  LocalHospital as MedicalIcon,
  AccountBalance as FinancialIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Celebration as CelebrationIcon
} from '@mui/icons-material';
import { getDocuments } from '../../../redux/actions/documentActions';
import { getVerificationStatus } from '../../../redux/actions/profileActions';
import VerificationHistoryLog from '../VerificationHistoryLog/VerificationHistoryLog';
import DocumentCardModern from '../DocumentCardModern/DocumentCardModern';
import SmartUploadFlow from '../SmartUploadFlow/SmartUploadFlow';
import { formatDate } from '../../../utils/dateUtils';
import styles from './VerificationJourney.module.css';

/**
 * VerificationJourney - Modern verification experience component
 * Provides a visual journey through the document verification process
 */
const VerificationJourney = ({
  onComplete,
  onDocumentUpload,
  showHistory = true,
  showRecommendations = true,
  compact = false,
  className = ''
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { documents, loading: documentsLoading } = useSelector(state => state.documents);
  const { verificationStatus, loading: statusLoading } = useSelector(state => state.profile);
  const { user } = useSelector(state => state.auth);

  // Component state
  const [activeStep, setActiveStep] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showHistory, setShowHistoryExpanded] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Required document types for verification
  const verificationRequirements = [
    {
      type: 'identity',
      label: 'Identity Verification',
      description: 'Government-issued ID or Passport',
      icon: <BadgeIcon />,
      priority: 'critical',
      points: 40,
      tips: [
        'Ensure all text is clearly visible',
        'Include all corners of the document',
        'Avoid glare or shadows'
      ]
    },
    {
      type: 'address',
      label: 'Address Verification',
      description: 'Utility bill or bank statement (last 3 months)',
      icon: <AssignmentIcon />,
      priority: 'critical',
      points: 30,
      tips: [
        'Document must be recent (within 3 months)',
        'Your name and address must be clearly visible',
        'Use official documents only'
      ]
    },
    {
      type: 'education',
      label: 'Educational Credentials',
      description: 'Highest educational qualification',
      icon: <EducationIcon />,
      priority: 'recommended',
      points: 20,
      tips: [
        'Original certificates preferred',
        'Include graduation date',
        'Professional certifications also accepted'
      ]
    },
    {
      type: 'professional',
      label: 'Professional Certification',
      description: 'Work permits, licenses, or certifications',
      icon: <WorkIcon />,
      priority: 'optional',
      points: 10,
      tips: [
        'Include expiry dates if applicable',
        'Professional body certifications boost trust',
        'Work permits for specific countries'
      ]
    }
  ];

  // Load data on mount
  useEffect(() => {
    dispatch(getDocuments());
    dispatch(getVerificationStatus());
  }, [dispatch]);

  // Calculate verification progress
  const verificationProgress = useMemo(() => {
    if (!documents) return { completed: 0, total: 4, percentage: 0, score: 0 };

    let completed = 0;
    let score = 0;
    
    verificationRequirements.forEach(req => {
      const doc = documents.find(d => d.documentType === req.type && d.status === 'VERIFIED');
      if (doc) {
        completed++;
        score += req.points;
      }
    });

    const percentage = Math.round((completed / verificationRequirements.length) * 100);
    
    return { completed, total: verificationRequirements.length, percentage, score };
  }, [documents]);

  // Get requirement status
  const getRequirementStatus = (requirement) => {
    if (!documents) return 'missing';
    
    const docs = documents.filter(d => d.documentType === requirement.type);
    const verified = docs.find(d => d.status === 'VERIFIED');
    const pending = docs.find(d => d.status === 'PENDING');
    const rejected = docs.find(d => d.status === 'REJECTED');
    
    if (verified) return 'verified';
    if (pending) return 'pending';
    if (rejected) return 'rejected';
    if (docs.length > 0) return 'uploaded';
    return 'missing';
  };

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'verified':
        return { icon: <CheckIcon />, color: 'success', label: 'Verified' };
      case 'pending':
        return { icon: <PendingIcon />, color: 'warning', label: 'Under Review' };
      case 'rejected':
        return { icon: <ErrorIcon />, color: 'error', label: 'Needs Attention' };
      case 'uploaded':
        return { icon: <UploadIcon />, color: 'info', label: 'Uploaded' };
      default:
        return { icon: <WarningIcon />, color: 'default', label: 'Required' };
    }
  };

  // Handle upload completion
  const handleUploadComplete = () => {
    setShowUploadDialog(false);
    dispatch(getDocuments());
    setSelectedRequirement(null);
  };

  // Handle verification completion
  useEffect(() => {
    if (verificationProgress.completed === verificationRequirements.length && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        if (onComplete) {
          onComplete(verificationProgress);
        }
      }, 3000);
    }
  }, [verificationProgress.completed, verificationRequirements.length, showCelebration, onComplete, verificationProgress]);

  // Get next recommended action
  const getNextAction = () => {
    const missing = verificationRequirements.find(req => getRequirementStatus(req) === 'missing');
    const rejected = verificationRequirements.find(req => getRequirementStatus(req) === 'rejected');
    
    if (rejected) return { action: 'reupload', requirement: rejected };
    if (missing) return { action: 'upload', requirement: missing };
    return { action: 'complete', requirement: null };
  };

  const nextAction = getNextAction();
  const isComplete = verificationProgress.completed === verificationRequirements.length;

  return (
    <Box className={`${styles.journey} ${compact ? styles.compact : ''} ${className}`}>
      {/* Header Section */}
      <Paper className={styles.header} elevation={2}>
        <Box className={styles.headerContent}>
          <Box className={styles.headerLeft}>
            <Avatar className={styles.journeyAvatar}>
              <VerifiedIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" className={styles.title}>
                Verification Journey
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Build trust with verified credentials
              </Typography>
            </Box>
          </Box>
          
          <Box className={styles.headerRight}>
            <Tooltip title="Trust Score">
              <Chip
                icon={<StarIcon />}
                label={`${verificationProgress.score}/100`}
                color={verificationProgress.score >= 80 ? 'success' : verificationProgress.score >= 60 ? 'warning' : 'default'}
                className={styles.trustChip}
              />
            </Tooltip>
            <IconButton onClick={() => dispatch(getDocuments())}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Progress Overview */}
        <Box className={styles.progressOverview}>
          <Box className={styles.progressHeader}>
            <Typography variant="subtitle1">
              Verification Progress
            </Typography>
            <Typography variant="h6" color="primary">
              {verificationProgress.completed}/{verificationProgress.total} Complete
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={verificationProgress.percentage}
            className={styles.progressBar}
            color={isComplete ? 'success' : 'primary'}
          />
          
          <Typography variant="caption" color="text.secondary">
            {verificationProgress.percentage}% of verification requirements met
          </Typography>
        </Box>
      </Paper>

      {/* Celebration Animation */}
      {showCelebration && (
        <Zoom in timeout={300}>
          <Paper className={styles.celebration} elevation={4}>
            <CelebrationIcon className={styles.celebrationIcon} />
            <Typography variant="h6" gutterBottom>
              Verification Complete!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your account is now fully verified and trusted.
            </Typography>
          </Paper>
        </Zoom>
      )}

      {/* Next Action Card */}
      {!isComplete && (
        <Fade in timeout={500}>
          <Card className={styles.nextActionCard} elevation={2}>
            <CardContent>
              <Box className={styles.nextActionContent}>
                <Box className={styles.nextActionLeft}>
                  <Typography variant="h6" gutterBottom>
                    {nextAction.action === 'reupload' ? 'Action Required' : 'Next Step'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {nextAction.action === 'reupload' 
                      ? `Reupload your ${nextAction.requirement?.label}`
                      : `Upload your ${nextAction.requirement?.label}`
                    }
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color={nextAction.action === 'reupload' ? 'warning' : 'primary'}
                  onClick={() => {
                    setSelectedRequirement(nextAction.requirement);
                    setShowUploadDialog(true);
                  }}
                  className={styles.nextActionButton}
                >
                  {nextAction.action === 'reupload' ? 'Fix Document' : 'Upload Now'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Requirements Grid */}
      <Grid container spacing={3} className={styles.requirementsGrid}>
        {verificationRequirements.map((requirement, index) => {
          const status = getRequirementStatus(requirement);
          const statusInfo = getStatusInfo(status);
          const docs = documents?.filter(d => d.documentType === requirement.type) || [];
          
          return (
            <Grid item xs={12} md={6} key={requirement.type}>
              <Card 
                className={`${styles.requirementCard} ${styles[`status-${status}`]}`}
                elevation={2}
              >
                <CardContent>
                  <Box className={styles.requirementHeader}>
                    <Box className={styles.requirementLeft}>
                      <Avatar 
                        className={styles.requirementIcon}
                        sx={{ bgcolor: `${statusInfo.color}.main` }}
                      >
                        {requirement.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {requirement.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {requirement.description}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box className={styles.requirementRight}>
                      <Chip
                        icon={statusInfo.icon}
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                        className={styles.statusChip}
                      />
                      <Typography variant="caption" className={styles.pointsBadge}>
                        +{requirement.points} pts
                      </Typography>
                    </Box>
                  </Box>

                  {/* Requirement Status Details */}
                  {status !== 'missing' && docs.length > 0 && (
                    <Box className={styles.requirementDetails}>
                      {docs.map((doc, docIndex) => (
                        <DocumentCardModern
                          key={doc._id}
                          document={doc}
                          compact={true}
                          showActions={false}
                          className={styles.embeddedCard}
                        />
                      ))}
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Box className={styles.requirementActions}>
                    {status === 'missing' && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                          setSelectedRequirement(requirement);
                          setShowUploadDialog(true);
                        }}
                        startIcon={<UploadIcon />}
                      >
                        Upload Document
                      </Button>
                    )}
                    
                    {status === 'rejected' && (
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={() => {
                          setSelectedRequirement(requirement);
                          setShowUploadDialog(true);
                        }}
                        startIcon={<RefreshIcon />}
                      >
                        Reupload
                      </Button>
                    )}
                    
                    {requirement.tips && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setSelectedRequirement(
                          selectedRequirement?.type === requirement.type ? null : requirement
                        )}
                        startIcon={<HelpIcon />}
                      >
                        Tips
                      </Button>
                    )}
                  </Box>

                  {/* Tips Collapse */}
                  <Collapse in={selectedRequirement?.type === requirement.type}>
                    <Box className={styles.requirementTips}>
                      <Typography variant="subtitle2" gutterBottom>
                        Upload Tips:
                      </Typography>
                      {requirement.tips.map((tip, tipIndex) => (
                        <Typography key={tipIndex} variant="body2" className={styles.tip}>
                          • {tip}
                        </Typography>
                      ))}
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Verification History */}
      {showHistory && documents && documents.length > 0 && (
        <Paper className={styles.historySection} elevation={1}>
          <Box className={styles.historyHeader}>
            <Typography variant="h6">
              Verification History
            </Typography>
            <IconButton
              onClick={() => setShowHistoryExpanded(!showHistory)}
              size="small"
            >
              {showHistory ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={showHistory}>
            <Box className={styles.historyContent}>
              {documents.map(doc => {
                // Generate mock history for demonstration
                const history = [
                  {
                    status: 'uploaded',
                    timestamp: doc.createdAt,
                    performedBy: user?._id,
                    performedByName: user?.name,
                    notes: 'Document uploaded successfully'
                  }
                ];
                
                if (doc.status === 'VERIFIED' && doc.verificationDate) {
                  history.push({
                    status: 'verified',
                    timestamp: doc.verificationDate,
                    performedBy: 'admin',
                    performedByName: 'System Admin',
                    notes: doc.verificationNotes || 'Document verified'
                  });
                }
                
                if (doc.status === 'REJECTED') {
                  history.push({
                    status: 'rejected',
                    timestamp: new Date().toISOString(),
                    performedBy: 'admin',
                    performedByName: 'System Admin',
                    notes: doc.verificationNotes || 'Document requires attention'
                  });
                }

                return (
                  <Box key={doc._id} className={styles.documentHistory}>
                    <Typography variant="subtitle2" gutterBottom>
                      {doc.documentName}
                    </Typography>
                    <VerificationHistoryLog
                      history={history}
                      compact={true}
                      maxVisible={2}
                      className={styles.historyLog}
                    />
                  </Box>
                );
              })}
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        maxWidth="md"
        fullWidth
        className={styles.uploadDialog}
      >
        <DialogTitle>
          Upload {selectedRequirement?.label}
        </DialogTitle>
        <DialogContent>
          <SmartUploadFlow
            presetDocumentType={selectedRequirement?.type}
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUploadDialog(false)}
            showPreview={true}
            autoDetectType={false}
          />
        </DialogContent>
      </Dialog>

      {/* Quick Upload FAB */}
      {!isComplete && (
        <Fab
          color="primary"
          aria-label="quick upload"
          className={styles.fab}
          onClick={() => setShowUploadDialog(true)}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Completion Actions */}
      {isComplete && (
        <Paper className={styles.completionActions} elevation={2}>
          <Box className={styles.completionContent}>
            <VerifiedIcon className={styles.completionIcon} />
            <Box className={styles.completionText}>
              <Typography variant="h6" gutterBottom>
                Verification Complete!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your account is fully verified. You can now access all platform features.
              </Typography>
            </Box>
            <Box className={styles.completionButtons}>
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
        </Paper>
      )}
    </Box>
  );
};

export default VerificationJourney;