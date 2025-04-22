// src/components/verification/VerificationComparison/VerificationComparison.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Grid,
  Tabs,
  Tab,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Compare as CompareIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  HighlightOff as HighlightOffIcon,
  ShowChart as ShowChartIcon,
  Cached as CachedIcon,
  Image as ImageIcon,
  FindInPage as FindInPageIcon
} from '@mui/icons-material';
import styles from './VerificationComparison.module.css';
import { formatDateTime } from '../../../utils/dateUtils';
import { useResponsive } from '../../../utils/responsive';
import LoadingSpinner from '../../common/LoadingSpinner';

/**
 * Component that compares multiple verification results for a document
 * 
 * @param {Object} props
 * @param {Array} props.verificationResults - Array of verification results to compare
 * @param {Function} props.onSelectResult - Callback when a result is selected as preferred
 * @param {boolean} props.loading - Loading state
 * @param {string} props.documentId - Document ID
 * @param {Function} props.onBack - Function to go back to previous screen
 */
const VerificationComparison = ({
  verificationResults = [],
  onSelectResult,
  loading = false,
  documentId,
  onBack
}) => {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState(0);
  const [activeResults, setActiveResults] = useState([0, 1]);
  const [selecting, setSelecting] = useState(false);

  // If no results or less than 2, show message
  if (!loading && (!verificationResults || verificationResults.length < 2)) {
    return (
      <Paper elevation={2} className={styles.container}>
        <Box className={styles.header}>
          <Box className={styles.titleRow}>
            <Box className={styles.iconContainer}>
              <CompareIcon fontSize="large" />
            </Box>
            <Typography variant="h5" component="h2">
              Verification Comparison
            </Typography>
          </Box>
        </Box>
        <Divider />
        <Box className={styles.emptyState}>
          <Alert severity="info">
            <Typography variant="body1">
              At least two verification results are needed for comparison. This document has {verificationResults?.length || 0} verification results.
            </Typography>
          </Alert>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={onBack}
            className={styles.backButton}
          >
            Back to Document Details
          </Button>
        </Box>
      </Paper>
    );
  }

  // If loading, show loading indicator
  if (loading) {
    return <LoadingSpinner />;
  }

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle selecting a verification result as preferred
  const handleSelectResult = async (resultId) => {
    setSelecting(true);
    try {
      if (onSelectResult) {
        await onSelectResult(documentId, resultId);
      }
    } finally {
      setSelecting(false);
    }
  };

  // Change which results are being compared
  const handleChangeComparedResult = (index, direction) => {
    const newResults = [...activeResults];
    const currentIdx = newResults[index];
    
    if (direction === 'next' && currentIdx < verificationResults.length - 1) {
      newResults[index] = currentIdx + 1;
    } else if (direction === 'prev' && currentIdx > 0) {
      newResults[index] = currentIdx - 1;
    }
    
    setActiveResults(newResults);
  };

  // Get status color based on result
  const getStatusColor = (result) => {
    if (!result) return 'default';
    return result.verified ? 'success' : 'error';
  };

  // Get status icon based on result
  const getStatusIcon = (result) => {
    if (!result) return <InfoIcon />;
    return result.verified ? <CheckCircleIcon /> : <CancelIcon />;
  };

  // Get confidence score color
  const getConfidenceColor = (score) => {
    if (score >= 85) return 'success';
    if (score >= 65) return 'warning';
    return 'error';
  };

  // Format check result for display
  const formatCheckResult = (check) => {
    if (!check) return 'N/A';
    if (typeof check === 'boolean') return check ? 'Pass' : 'Fail';
    if (typeof check === 'number') return `${Math.round(check * 100)}%`;
    return check.toString();
  };

  // Get background color for comparison cells to highlight differences
  const getComparisonBackground = (left, right) => {
    // If values are the same
    if (JSON.stringify(left) === JSON.stringify(right)) {
      return '';
    }
    
    // Boolean or numeric comparisons
    if (typeof left === 'boolean' && typeof right === 'boolean') {
      return left === true ? styles.betterResult : styles.worseResult;
    }
    
    if (typeof left === 'number' && typeof right === 'number') {
      return left > right ? styles.betterResult : styles.worseResult;
    }
    
    // Default highlighting for differences
    return styles.diffResult;
  };

  const result1 = verificationResults[activeResults[0]];
  const result2 = verificationResults[activeResults[1]];
  
  return (
    <Paper elevation={2} className={styles.container}>
      <Box className={styles.header}>
        <Box className={styles.titleRow}>
          <Box className={styles.iconContainer}>
            <CompareIcon fontSize="large" />
          </Box>
          <Typography variant="h5" component="h2">
            Verification Comparison
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" className={styles.subtitle}>
          Compare verification results to identify discrepancies and select the preferred result.
        </Typography>
      </Box>

      <Divider />

      <Box className={styles.tabsContainer}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          className={styles.tabs}
        >
          <Tab label="Overview Comparison" />
          <Tab label="Detailed Checks" />
          <Tab label="Extracted Data" />
        </Tabs>
      </Box>

      <Box className={styles.comparisonContainer}>
        {/* Result Headers */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box className={styles.resultHeader}>
              <Box className={styles.resultNavigation}>
                <Tooltip title="Previous result">
                  <span>
                    <IconButton 
                      size="small" 
                      disabled={activeResults[0] === 0}
                      onClick={() => handleChangeComparedResult(0, 'prev')}
                    >
                      <ArrowBackIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Typography variant="subtitle1">
                  Result {activeResults[0] + 1} of {verificationResults.length}
                </Typography>
                <Tooltip title="Next result">
                  <span>
                    <IconButton 
                      size="small" 
                      disabled={activeResults[0] === verificationResults.length - 1}
                      onClick={() => handleChangeComparedResult(0, 'next')}
                    >
                      <ArrowForwardIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              
              <Box className={styles.resultMeta}>
                <Chip 
                  icon={getStatusIcon(result1)} 
                  label={result1.verified ? 'Verified' : 'Not Verified'} 
                  color={getStatusColor(result1)}
                  size="small"
                  className={styles.statusChip}
                />
                <Typography variant="caption" color="textSecondary">
                  {formatDateTime(result1.timestamp)}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSelectResult(result1.id)}
                disabled={selecting || result1.isPreferred}
                startIcon={selecting ? <CircularProgress size={20} /> : null}
                className={styles.selectButton}
              >
                {result1.isPreferred ? 'Preferred Result' : 'Select as Preferred'}
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box className={styles.resultHeader}>
              <Box className={styles.resultNavigation}>
                <Tooltip title="Previous result">
                  <span>
                    <IconButton 
                      size="small" 
                      disabled={activeResults[1] === 0}
                      onClick={() => handleChangeComparedResult(1, 'prev')}
                    >
                      <ArrowBackIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Typography variant="subtitle1">
                  Result {activeResults[1] + 1} of {verificationResults.length}
                </Typography>
                <Tooltip title="Next result">
                  <span>
                    <IconButton 
                      size="small" 
                      disabled={activeResults[1] === verificationResults.length - 1}
                      onClick={() => handleChangeComparedResult(1, 'next')}
                    >
                      <ArrowForwardIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              
              <Box className={styles.resultMeta}>
                <Chip 
                  icon={getStatusIcon(result2)} 
                  label={result2.verified ? 'Verified' : 'Not Verified'} 
                  color={getStatusColor(result2)}
                  size="small"
                  className={styles.statusChip}
                />
                <Typography variant="caption" color="textSecondary">
                  {formatDateTime(result2.timestamp)}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSelectResult(result2.id)}
                disabled={selecting || result2.isPreferred}
                startIcon={selecting ? <CircularProgress size={20} /> : null}
                className={styles.selectButton}
              >
                {result2.isPreferred ? 'Preferred Result' : 'Select as Preferred'}
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        <Divider className={styles.divider} />
        
        {/* Tab Content */}
        <Box className={styles.tabContent}>
          {/* Overview Comparison */}
          {activeTab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size={isMobile ? "small" : "medium"}>
                    <TableHead>
                      <TableRow>
                        <TableCell width="30%">Attribute</TableCell>
                        <TableCell width="35%">Result {activeResults[0] + 1}</TableCell>
                        <TableCell width="35%">Result {activeResults[1] + 1}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Verification Method</TableCell>
                        <TableCell>{result1.method || 'Standard'}</TableCell>
                        <TableCell>{result2.method || 'Standard'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Verification Status</TableCell>
                        <TableCell className={result1.verified ? styles.successCell : styles.errorCell}>
                          {result1.verified ? 'Verified' : 'Not Verified'}
                        </TableCell>
                        <TableCell className={result2.verified ? styles.successCell : styles.errorCell}>
                          {result2.verified ? 'Verified' : 'Not Verified'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Overall Confidence</TableCell>
                        <TableCell className={styles[getConfidenceColor(result1.confidenceScore)]}>
                          {Math.round(result1.confidenceScore)}%
                        </TableCell>
                        <TableCell className={styles[getConfidenceColor(result2.confidenceScore)]}>
                          {Math.round(result2.confidenceScore)}%
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Verification Time</TableCell>
                        <TableCell>{formatDateTime(result1.timestamp)}</TableCell>
                        <TableCell>{formatDateTime(result2.timestamp)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Verification ID</TableCell>
                        <TableCell>{result1.id}</TableCell>
                        <TableCell>{result2.id}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Verified By</TableCell>
                        <TableCell>{result1.verifier || 'System'}</TableCell>
                        <TableCell>{result2.verifier || 'System'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Document Type</TableCell>
                        <TableCell 
                          className={getComparisonBackground(
                            result1.documentType, 
                            result2.documentType
                          )}
                        >
                          {result1.documentType || 'Not specified'}
                        </TableCell>
                        <TableCell 
                          className={getComparisonBackground(
                            result2.documentType, 
                            result1.documentType
                          )}
                        >
                          {result2.documentType || 'Not specified'}
                        </TableCell>
                      </TableRow>
                      {result1.expiryDate || result2.expiryDate ? (
                        <TableRow>
                          <TableCell>Expiry Date</TableCell>
                          <TableCell 
                            className={getComparisonBackground(
                              result1.expiryDate, 
                              result2.expiryDate
                            )}
                          >
                            {result1.expiryDate ? formatDateTime(result1.expiryDate) : 'Not specified'}
                          </TableCell>
                          <TableCell 
                            className={getComparisonBackground(
                              result2.expiryDate, 
                              result1.expiryDate
                            )}
                          >
                            {result2.expiryDate ? formatDateTime(result2.expiryDate) : 'Not specified'}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
          
          {/* Detailed Checks */}
          {activeTab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size={isMobile ? "small" : "medium"}>
                    <TableHead>
                      <TableRow>
                        <TableCell width="30%">Check</TableCell>
                        <TableCell width="35%">Result {activeResults[0] + 1}</TableCell>
                        <TableCell width="35%">Result {activeResults[1] + 1}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result1.checks?.map((check, index) => {
                        const matchingCheck = result2.checks?.find(c => c.name === check.name);
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Box className={styles.checkName}>
                                <Typography variant="body2">{check.name}</Typography>
                                {check.description && (
                                  <Tooltip title={check.description}>
                                    <InfoIcon fontSize="small" color="action" className={styles.infoIcon} />
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell 
                              className={getComparisonBackground(
                                check.result, 
                                matchingCheck?.result
                              )}
                            >
                              {formatCheckResult(check.result)}
                            </TableCell>
                            <TableCell 
                              className={getComparisonBackground(
                                matchingCheck?.result, 
                                check.result
                              )}
                            >
                              {matchingCheck ? formatCheckResult(matchingCheck.result) : 'Not checked'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Show checks that are only in result2 */}
                      {result2.checks?.filter(check => !result1.checks?.some(c => c.name === check.name))
                        .map((check, index) => (
                          <TableRow key={`unique-${index}`}>
                            <TableCell>
                              <Box className={styles.checkName}>
                                <Typography variant="body2">{check.name}</Typography>
                                {check.description && (
                                  <Tooltip title={check.description}>
                                    <InfoIcon fontSize="small" color="action" className={styles.infoIcon} />
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>Not checked</TableCell>
                            <TableCell 
                              className={getComparisonBackground(
                                check.result, 
                                null
                              )}
                            >
                              {formatCheckResult(check.result)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
          
          {/* Extracted Data */}
          {activeTab === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {(result1.extractedData || result2.extractedData) ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow>
                          <TableCell width="30%">Field</TableCell>
                          <TableCell width="35%">Result {activeResults[0] + 1}</TableCell>
                          <TableCell width="35%">Result {activeResults[1] + 1}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Combine all keys from both results */}
                        {[...new Set([
                          ...Object.keys(result1.extractedData || {}),
                          ...Object.keys(result2.extractedData || {})
                        ])].map((field, index) => (
                          <TableRow key={index}>
                            <TableCell>{field}</TableCell>
                            <TableCell 
                              className={getComparisonBackground(
                                result1.extractedData?.[field], 
                                result2.extractedData?.[field]
                              )}
                            >
                              {result1.extractedData?.[field] || 'Not extracted'}
                            </TableCell>
                            <TableCell 
                              className={getComparisonBackground(
                                result2.extractedData?.[field], 
                                result1.extractedData?.[field]
                              )}
                            >
                              {result2.extractedData?.[field] || 'Not extracted'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    No data was extracted from the document in these verification results.
                  </Alert>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>

      <Box className={styles.footer}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={onBack}
        >
          Back to Document Details
        </Button>
        
        <Box className={styles.infoBox}>
          <InfoIcon color="action" fontSize="small" />
          <Typography variant="caption" color="textSecondary">
            Highlighted cells indicate differences between verification results.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

VerificationComparison.propTypes = {
  verificationResults: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      verified: PropTypes.bool.isRequired,
      confidenceScore: PropTypes.number.isRequired,
      timestamp: PropTypes.string.isRequired,
      method: PropTypes.string,
      verifier: PropTypes.string,
      documentType: PropTypes.string,
      expiryDate: PropTypes.string,
      isPreferred: PropTypes.bool,
      checks: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          description: PropTypes.string,
          result: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.number,
            PropTypes.string
          ]).isRequired
        })
      ),
      extractedData: PropTypes.object
    })
  ),
  onSelectResult: PropTypes.func,
  loading: PropTypes.bool,
  documentId: PropTypes.string,
  onBack: PropTypes.func
};

export default VerificationComparison;