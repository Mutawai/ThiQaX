// src/components/verification/AIVerificationResults/AIVerificationResults.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Grid,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Image as ImageIcon,
  FindInPage as FindInPageIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';
import styles from './AIVerificationResults.module.css';
import { useResponsive } from '../../../utils/responsive';
import LoadingSpinner from '../../common/LoadingSpinner';

/**
 * Component that displays the results of AI-powered document verification
 * 
 * @param {Object} props - Component props
 * @param {Object} props.verificationData - AI verification result data
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onReviewComplete - Callback when review is completed
 * @param {string} props.documentType - Type of document being verified
 */
const AIVerificationResults = ({ 
  verificationData, 
  loading = false, 
  onReviewComplete,
  documentType = 'identity'
}) => {
  const { isMobile } = useResponsive();
  const [expanded, setExpanded] = useState('panel1');
  const [reviewCompleted, setReviewCompleted] = useState(false);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  // If data is loading, show loading indicator
  if (loading || !verificationData) {
    return <LoadingSpinner />;
  }

  // Calculate overall confidence score - average of all checks
  const calculateOverallScore = () => {
    if (!verificationData.checks || verificationData.checks.length === 0) {
      return 0;
    }
    
    const sum = verificationData.checks.reduce((total, check) => total + check.confidenceScore, 0);
    return Math.round((sum / verificationData.checks.length) * 100);
  };

  const overallScore = calculateOverallScore();
  
  // Determine the verification status and color based on the overall score
  const getVerificationStatus = (score) => {
    if (score >= 85) {
      return { status: 'Verified', color: 'success', icon: <CheckIcon /> };
    } else if (score >= 65) {
      return { status: 'Needs Review', color: 'warning', icon: <WarningIcon /> };
    } else {
      return { status: 'Failed Verification', color: 'error', icon: <ErrorIcon /> };
    }
  };
  
  const verificationStatus = getVerificationStatus(overallScore);

  // Complete the review process
  const handleCompleteReview = (approved) => {
    setReviewCompleted(true);
    if (onReviewComplete) {
      onReviewComplete({
        approved,
        score: overallScore,
        documentType,
        verificationId: verificationData.id,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <Paper elevation={2} className={styles.container}>
      {/* Header Section */}
      <Box className={styles.header}>
        <Box className={styles.titleRow}>
          <Box className={styles.iconContainer}>
            <SmartToyIcon fontSize="large" />
          </Box>
          <Typography variant="h5" component="h2">
            AI Verification Results
          </Typography>
        </Box>
        
        <Typography variant="body2" color="textSecondary" className={styles.subtitle}>
          Document analyzed on {new Date(verificationData.timestamp).toLocaleDateString()} at {new Date(verificationData.timestamp).toLocaleTimeString()}
        </Typography>
      </Box>

      <Divider />

      {/* Overall Score Section */}
      <Box className={styles.scoreSection}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box className={styles.scoreBox}>
              <Typography variant="body1" gutterBottom>
                Overall Verification Score
              </Typography>
              
              <Box className={styles.scoreValue}>
                <Box className={styles.circularProgressContainer}>
                  <CircularProgress
                    variant="determinate"
                    value={overallScore}
                    size={80}
                    thickness={4}
                    className={styles[`progress${verificationStatus.color}`]}
                  />
                  <Box className={styles.circularProgressLabel}>
                    <Typography variant="h5" component="div" color={`${verificationStatus.color}.main`}>
                      {overallScore}%
                    </Typography>
                  </Box>
                </Box>
                
                <Box className={styles.statusBox}>
                  <Chip
                    icon={verificationStatus.icon}
                    label={verificationStatus.status}
                    color={verificationStatus.color}
                    className={styles.statusChip}
                  />
                  <Typography variant="body2" className={styles.statusDescription}>
                    {verificationStatus.status === 'Verified' 
                      ? 'The document passed all verification checks with high confidence.' 
                      : verificationStatus.status === 'Needs Review'
                        ? 'Some checks require human verification.' 
                        : 'The document failed critical verification checks.'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box className={styles.checksSummaryBox}>
              <Typography variant="body1" gutterBottom>
                Verification Checks
              </Typography>
              
              <Box className={styles.checksGrid}>
                {verificationData.checks.map((check, index) => (
                  <Box key={index} className={styles.checkItem}>
                    <Box className={styles.checkNameRow}>
                      <Typography variant="body2">{check.name}</Typography>
                      <Tooltip title={check.description}>
                        <InfoIcon fontSize="small" color="action" />
                      </Tooltip>
                    </Box>
                    
                    <Box className={styles.progressRow}>
                      <LinearProgress 
                        variant="determinate" 
                        value={check.confidenceScore * 100} 
                        className={styles[`linear${check.confidenceScore >= 0.85 
                          ? 'Success' 
                          : check.confidenceScore >= 0.65 
                            ? 'Warning' 
                            : 'Error'}`]} 
                      />
                      <Typography variant="caption" color="textSecondary">
                        {Math.round(check.confidenceScore * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Detailed Verification Section */}
      <Box className={styles.detailedSection}>
        <Typography variant="h6" gutterBottom>
          Detailed Verification Results
        </Typography>
        
        {verificationData.checks.map((check, index) => (
          <Accordion 
            key={index} 
            expanded={expanded === `panel${index + 1}`} 
            onChange={handleAccordionChange(`panel${index + 1}`)}
            className={styles.accordion}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index + 1}-content`}
              id={`panel${index + 1}-header`}
              className={styles.accordionSummary}
            >
              <Box className={styles.checkSummary}>
                <Box className={styles.checkSummaryIcon}>
                  {check.confidenceScore >= 0.85 ? (
                    <CheckIcon color="success" />
                  ) : check.confidenceScore >= 0.65 ? (
                    <WarningIcon color="warning" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle1">{check.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Confidence: {Math.round(check.confidenceScore * 100)}%
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails className={styles.accordionDetails}>
              <Typography variant="body2" paragraph>
                {check.description}
              </Typography>
              
              {check.details && (
                <Box className={styles.checkDetailsBox}>
                  {check.details.map((detail, detailIndex) => (
                    <Alert 
                      key={detailIndex} 
                      severity={detail.type || 'info'} 
                      className={styles.detailAlert}
                    >
                      <Typography variant="body2">
                        {detail.message}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              )}
              
              {check.imageResults && (
                <Box className={styles.imageResultsBox}>
                  <Typography variant="subtitle2" gutterBottom>
                    <ImageIcon fontSize="small" className={styles.inlineIcon} /> 
                    Image Analysis
                  </Typography>
                  <Grid container spacing={2}>
                    {check.imageResults.map((result, imgIndex) => (
                      <Grid item xs={12} md={6} key={imgIndex}>
                        <Paper variant="outlined" className={styles.imageResultItem}>
                          <Typography variant="body2" gutterBottom>
                            {result.label}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={result.confidence * 100} 
                            className={styles.imageResultProgress} 
                          />
                          <Typography variant="caption" color="textSecondary">
                            {Math.round(result.confidence * 100)}% confidence
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {check.extracted && (
                <Box className={styles.extractedDataBox}>
                  <Typography variant="subtitle2" gutterBottom>
                    <FindInPageIcon fontSize="small" className={styles.inlineIcon} /> 
                    Extracted Data
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(check.extracted).map(([key, value], extIndex) => (
                      <Grid item xs={12} sm={6} key={extIndex}>
                        <Paper variant="outlined" className={styles.extractedDataItem}>
                          <Typography variant="caption" color="textSecondary">
                            {key}
                          </Typography>
                          <Typography variant="body2">
                            {value}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Action Buttons */}
      {!reviewCompleted && onReviewComplete && (
        <Box className={styles.actionButtons}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleCompleteReview(false)}
            className={styles.rejectButton}
            disabled={loading}
          >
            Reject Verification
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleCompleteReview(true)}
            className={styles.approveButton}
            disabled={loading || overallScore < 65}
          >
            Approve Verification
          </Button>
        </Box>
      )}
    </Paper>
  );
};

AIVerificationResults.propTypes = {
  verificationData: PropTypes.shape({
    id: PropTypes.string,
    timestamp: PropTypes.string,
    documentType: PropTypes.string,
    checks: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        confidenceScore: PropTypes.number.isRequired,
        details: PropTypes.arrayOf(
          PropTypes.shape({
            type: PropTypes.oneOf(['success', 'info', 'warning', 'error']),
            message: PropTypes.string.isRequired
          })
        ),
        imageResults: PropTypes.arrayOf(
          PropTypes.shape({
            label: PropTypes.string.isRequired,
            confidence: PropTypes.number.isRequired
          })
        ),
        extracted: PropTypes.object
      })
    ).isRequired
  }),
  loading: PropTypes.bool,
  onReviewComplete: PropTypes.func,
  documentType: PropTypes.string
};

export default AIVerificationResults;