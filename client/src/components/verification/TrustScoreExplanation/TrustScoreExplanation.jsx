// src/components/verification/TrustScoreExplanation/TrustScoreExplanation.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tooltip,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Shield as ShieldIcon,
  VerifiedUser as VerifiedUserIcon,
  BugReport as BugReportIcon,
  History as HistoryIcon,
  LocationOn as LocationOnIcon,
  SecurityUpdateGood as SecurityUpdateGoodIcon,
  DataUsage as DataUsageIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Info as InfoIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import styles from './TrustScoreExplanation.module.css';
import { formatDateTime } from '../../../utils/dateUtils';
import { useResponsive } from '../../../utils/responsive';
import LoadingSpinner from '../../common/LoadingSpinner';

/**
 * Component that explains the Trust Score calculation and provides details on 
 * the factors that contribute to the score.
 * 
 * @param {Object} props
 * @param {Object} props.trustScoreData - The trust score data to display
 * @param {Function} props.onExport - Callback when user exports the report
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onRefresh - Function to refresh the trust score data
 */
const TrustScoreExplanation = ({
  trustScoreData,
  onExport,
  loading = false,
  onRefresh
}) => {
  const { isMobile } = useResponsive();
  const [expandedPanel, setExpandedPanel] = useState('factors');

  const handlePanelChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  // If loading, show loading indicator
  if (loading) {
    return <LoadingSpinner />;
  }

  // Calculate status color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  // Get icon for trend
  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUpIcon color="success" />;
    if (trend === 'down') return <TrendingDownIcon color="error" />;
    return <TrendingFlatIcon color="action" />;
  };

  // Get icon for factor type
  const getFactorIcon = (type) => {
    switch (type) {
      case 'authentication':
        return <VerifiedUserIcon />;
      case 'security':
        return <SecurityUpdateGoodIcon />;
      case 'location':
        return <LocationOnIcon />;
      case 'history':
        return <HistoryIcon />;
      case 'data_quality':
        return <DataUsageIcon />;
      case 'anomaly':
        return <BugReportIcon />;
      default:
        return <InfoIcon />;
    }
  };

  // Get the impact icon and color for a factor
  const getImpactDisplay = (impact) => {
    if (impact === 'high') {
      return { icon: <TrendingUpIcon />, color: 'success', label: 'High Impact' };
    } else if (impact === 'medium') {
      return { icon: <TrendingFlatIcon />, color: 'warning', label: 'Medium Impact' };
    } else {
      return { icon: <TrendingDownIcon />, color: 'error', label: 'Low Impact' };
    }
  };
// If no trust score data, show message
  if (!trustScoreData) {
    return (
      <Paper elevation={2} className={styles.container}>
        <Box className={styles.header}>
          <Box className={styles.titleRow}>
            <Box className={styles.iconContainer}>
              <ShieldIcon fontSize="large" />
            </Box>
            <Typography variant="h5" component="h2">
              Trust Score Explanation
            </Typography>
          </Box>
        </Box>
        <Divider />
        <Box className={styles.emptyState}>
          <Alert severity="info" className={styles.alert}>
            <Typography variant="body1">
              No trust score data is available for this document. Trust scores are calculated when a document is verified.
            </Typography>
          </Alert>
          {onRefresh && (
            <Button
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={onRefresh}
              className={styles.refreshButton}
            >
              Check for Trust Score
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  // Calculate weight percentage for each factor
  const factorWeightTotal = trustScoreData.factors.reduce((sum, factor) => sum + factor.weight, 0);
  
  // Get factor by id
  const getFactorById = (id) => {
    return trustScoreData.factors.find(factor => factor.id === id);
  };

  return (
    <Paper elevation={2} className={styles.container}>
      <Box className={styles.header}>
        <Box className={styles.titleRow}>
          <Box className={styles.iconContainer}>
            <ShieldIcon fontSize="large" />
          </Box>
          <Typography variant="h5" component="h2">
            Trust Score Explanation
          </Typography>
          {onExport && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={onExport}
              className={styles.exportButton}
              size="small"
            >
              Export Report
            </Button>
          )}
        </Box>
        <Typography variant="body2" color="textSecondary" className={styles.subtitle}>
          Last updated: {formatDateTime(trustScoreData.timestamp)}
        </Typography>
      </Box>

      <Divider />

      <Box className={styles.scoreOverview}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4} className={styles.scoreContainer}>
            <Box className={styles.scoreBox}>
              <Typography variant="h6" gutterBottom>
                Overall Trust Score
              </Typography>
              <Box className={styles.scoreCircleContainer}>
                <Box className={styles.scoreCircleWrapper}>
                  <CircularProgress
                    variant="determinate"
                    value={trustScoreData.score}
                    size={120}
                    thickness={8}
                    className={styles[`score${getScoreColor(trustScoreData.score)}`]}
                  />
                  <Box className={styles.scoreValue}>
                    <Typography
                      variant="h4"
                      component="div"
                      color={`${getScoreColor(trustScoreData.score)}.main`}
                      fontWeight="bold"
                    >
                      {trustScoreData.score}
                    </Typography>
                  </Box>
                </Box>
                <Box className={styles.scoreTrend}>
                  {trustScoreData.trend && (
                    <Chip
                      icon={getTrendIcon(trustScoreData.trend)}
                      label={`${trustScoreData.trend === 'up' ? '+' : trustScoreData.trend === 'down' ? '-' : ''}${trustScoreData.trendValue || 0}`}
                      color={trustScoreData.trend === 'up' ? 'success' : trustScoreData.trend === 'down' ? 'error' : 'default'}
                      size="small"
                    />
                  )}
                  <Chip
                    label={
                      trustScoreData.score >= 80
                        ? 'High Trust'
                        : trustScoreData.score >= 60
                        ? 'Medium Trust'
                        : 'Low Trust'
                    }
                    color={getScoreColor(trustScoreData.score)}
                    className={styles.trustLevelChip}
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box className={styles.scoreSummary}>
              <Typography variant="subtitle1" gutterBottom>
                Score Summary
              </Typography>
              <Typography variant="body2" paragraph>
                {trustScoreData.summary || 'This document has been assigned a trust score based on multiple verification factors.'}
              </Typography>
              
              <Box className={styles.scoreHighlights}>
                {trustScoreData.highlights && trustScoreData.highlights.map((highlight, index) => (
                  <Alert 
                    key={index} 
                    severity={highlight.type || 'info'} 
                    icon={
                      highlight.type === 'success' ? <VerifiedUserIcon /> : 
                      highlight.type === 'warning' ? <InfoIcon /> : 
                      <BugReportIcon />
                    }
                    variant="outlined"
                    className={styles.highlightAlert}
                  >
                    <Typography variant="body2">{highlight.message}</Typography>
                  </Alert>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider className={styles.divider} />
<Box className={styles.factorsSection}>
        <Accordion
          expanded={expandedPanel === 'factors'}
          onChange={handlePanelChange('factors')}
          className={styles.accordion}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            className={styles.accordionSummary}
          >
            <Typography variant="h6">Trust Score Factors</Typography>
          </AccordionSummary>
          <AccordionDetails className={styles.accordionDetails}>
            <Typography variant="body2" paragraph>
              The trust score is calculated based on the following weighted factors:
            </Typography>
            
            <Grid container spacing={3} className={styles.factorsGrid}>
              {trustScoreData.factors.map((factor, index) => {
                const weightPercentage = Math.round((factor.weight / factorWeightTotal) * 100);
                const impactDisplay = getImpactDisplay(factor.impact);
                
                return (
                  <Grid item xs={12} md={6} key={index}>
                    <Card variant="outlined" className={styles.factorCard}>
                      <CardHeader
                        avatar={
                          <Box className={styles.factorIconContainer}>
                            {getFactorIcon(factor.type)}
                          </Box>
                        }
                        title={factor.name}
                        subheader={
                          <Box className={styles.factorMeta}>
                            <Typography variant="caption" color="textSecondary">
                              Weight: {weightPercentage}%
                            </Typography>
                            <Chip
                              icon={impactDisplay.icon}
                              label={impactDisplay.label}
                              color={impactDisplay.color}
                              size="small"
                              className={styles.impactChip}
                            />
                          </Box>
                        }
                        className={styles.factorHeader}
                      />
                      <CardContent>
                        <Box className={styles.factorScore}>
                          <Typography variant="body2" gutterBottom>
                            Score: {factor.score}/{factor.maxScore}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(factor.score / factor.maxScore) * 100} 
                            className={styles[getScoreColor(factor.score / factor.maxScore * 100)]}
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary" className={styles.factorDescription}>
                          {factor.description}
                        </Typography>
                        {factor.details && (
                          <Box className={styles.factorDetails}>
                            {factor.details.map((detail, detailIndex) => (
                              <Typography 
                                key={detailIndex} 
                                variant="body2" 
                                className={styles.factorDetail}
                                color={detail.positive ? 'success.main' : detail.negative ? 'error.main' : 'textSecondary'}
                              >
                                • {detail.text}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {trustScoreData.recommendations && (
          <Accordion
            expanded={expandedPanel === 'recommendations'}
            onChange={handlePanelChange('recommendations')}
            className={styles.accordion}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className={styles.accordionSummary}
            >
              <Typography variant="h6">Recommendations</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Based on the trust score analysis, the following recommendations are provided:
              </Typography>
              
              <Box className={styles.recommendationsContainer}>
                {trustScoreData.recommendations.map((recommendation, index) => {
                  const relatedFactor = recommendation.factorId ? getFactorById(recommendation.factorId) : null;
                  
                  return (
                    <Alert
                      key={index}
                      severity={recommendation.priority === 'high' ? 'error' : recommendation.priority === 'medium' ? 'warning' : 'info'}
                      variant="outlined"
                      className={styles.recommendationAlert}
                    >
                      <Box className={styles.recommendationHeader}>
                        <Typography variant="subtitle2">
                          {recommendation.title}
                        </Typography>
                        {relatedFactor && (
                          <Tooltip title={`Related to: ${relatedFactor.name}`}>
                            <Chip
                              label={relatedFactor.name}
                              size="small"
                              className={styles.relatedFactorChip}
                              variant="outlined"
                            />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="body2">
                        {recommendation.description}
                      </Typography>
                      {recommendation.impact && (
                        <Typography variant="body2" className={styles.recommendationImpact}>
                          <strong>Potential impact:</strong> {recommendation.impact}
                        </Typography>
                      )}
                    </Alert>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {trustScoreData.history && trustScoreData.history.length > 0 && (
          <Accordion
            expanded={expandedPanel === 'history'}
            onChange={handlePanelChange('history')}
            className={styles.accordion}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className={styles.accordionSummary}
            >
              <Typography variant="h6">Trust Score History</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                How this document's trust score has changed over time:
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Score</TableCell>
                      <TableCell>Change</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trustScoreData.history.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDateTime(record.timestamp)}</TableCell>
                        <TableCell align="center">
                          <Box className={styles.historyScore}>
                            <Typography
                              variant="body2"
                              component="span"
                              color={`${getScoreColor(record.score)}.main`}
                              fontWeight="medium"
                            >
                              {record.score}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {record.change !== 0 && (
                            <Chip
                              size="small"
                              label={`${record.change > 0 ? '+' : ''}${record.change}`}
                              color={record.change > 0 ? 'success' : record.change < 0 ? 'error' : 'default'}
                              icon={record.change > 0 ? <TrendingUpIcon /> : record.change < 0 ? <TrendingDownIcon /> : <TrendingFlatIcon />}
                            />
                          )}
                          {record.change === 0 && (
                            <Typography variant="body2" color="textSecondary">
                              No change
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{record.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>

      {onRefresh && (
        <Box className={styles.footer}>
          <Button
            variant="outlined"
            startIcon={<InfoIcon />}
            onClick={onRefresh}
            className={styles.refreshButton}
          >
            Refresh Trust Score
          </Button>
        </Box>
      )}
    </Paper>
  );
};

TrustScoreExplanation.propTypes = {
  trustScoreData: PropTypes.shape({
    score: PropTypes.number.isRequired,
    timestamp: PropTypes.string.isRequired,
    trend: PropTypes.oneOf(['up', 'down', 'flat']),
    trendValue: PropTypes.number,
    summary: PropTypes.string,
    highlights: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(['success', 'warning', 'error', 'info']),
        message: PropTypes.string.isRequired
      })
    ),
    factors: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        score: PropTypes.number.isRequired,
        maxScore: PropTypes.number.isRequired,
        weight: PropTypes.number.isRequired,
        impact: PropTypes.oneOf(['high', 'medium', 'low']),
        description: PropTypes.string,
        details: PropTypes.arrayOf(
          PropTypes.shape({
            text: PropTypes.string.isRequired,
            positive: PropTypes.bool,
            negative: PropTypes.bool
          })
        )
      })
    ).isRequired,
    recommendations: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        priority: PropTypes.oneOf(['high', 'medium', 'low']),
        factorId: PropTypes.string,
        impact: PropTypes.string
      })
    ),
    history: PropTypes.arrayOf(
      PropTypes.shape({
        timestamp: PropTypes.string.isRequired,
        score: PropTypes.number.isRequired,
        change: PropTypes.number,
        reason: PropTypes.string
      })
    )
  }),
  onExport: PropTypes.func,
  loading: PropTypes.bool,
  onRefresh: PropTypes.func
};

export default TrustScoreExplanation;