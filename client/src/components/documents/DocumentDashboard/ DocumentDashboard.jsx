// src/components/documents/DocumentDashboard/DocumentDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Fab,
  Divider,
  Card,
  CardContent,
  LinearProgress,
  Badge,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as UploadIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  InsightOutlined as InsightsIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getDocuments } from '../../../redux/actions/documentActions';
import DocumentGrouping from '../DocumentGrouping/DocumentGrouping';
import ExpirationNotice from '../ExpirationNotice/ExpirationNotice';
import SecurityWatermark from '../SecurityWatermark/SecurityWatermark';
import DocumentCardModern from '../DocumentCardModern/DocumentCardModern';
import { formatDate } from '../../../utils/dateUtils';
import styles from './DocumentDashboard.module.css';

/**
 * DocumentDashboard - Unified document management interface
 * Combines document listing, grouping, stats, and quick actions
 */
const DocumentDashboard = () => {
  const dispatch = useDispatch();
  const { documents, loading, error } = useSelector((state) => state.documents);
  const { user } = useSelector((state) => state.auth);
  
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped', 'list', 'grid'
  const [groupBy, setGroupBy] = useState('type'); // 'type', 'status', 'date'
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);

  useEffect(() => {
    dispatch(getDocuments());
  }, [dispatch]);

  // Calculate document statistics
  const documentStats = useMemo(() => {
    if (!documents || !documents.length) {
      return {
        total: 0,
        verified: 0,
        pending: 0,
        rejected: 0,
        expired: 0,
        expiringSoon: 0,
        completionRate: 0,
        trustScore: 0
      };
    }

    const stats = documents.reduce((acc, doc) => {
      acc.total++;
      
      switch (doc.status?.toLowerCase()) {
        case 'verified':
          acc.verified++;
          break;
        case 'pending':
          acc.pending++;
          break;
        case 'rejected':
          acc.rejected++;
          break;
        case 'expired':
          acc.expired++;
          break;
      }

      // Check if expiring soon (within 30 days)
      if (doc.expiryDate) {
        const daysUntilExpiry = Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
          acc.expiringSoon++;
        }
      }

      return acc;
    }, {
      total: 0,
      verified: 0,
      pending: 0,
      rejected: 0,
      expired: 0,
      expiringSoon: 0
    });

    // Calculate completion rate (verified / total)
    stats.completionRate = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;
    
    // Calculate trust score based on verification status and expiry
    const activeVerified = stats.verified - stats.expired;
    stats.trustScore = stats.total > 0 ? Math.round((activeVerified / stats.total) * 100) : 0;

    return stats;
  }, [documents]);

  // Filter documents for expiring soon view
  const filteredDocuments = useMemo(() => {
    if (!showExpiringOnly || !documents) return documents;
    
    return documents.filter(doc => {
      if (!doc.expiryDate) return false;
      const daysUntilExpiry = Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });
  }, [documents, showExpiringOnly]);

  // Render document card with modern styling
  const renderDocumentCard = (document, index) => (
    <DocumentCardModern
      key={document._id || index}
      document={document}
      showActions={true}
      elevation={2}
    />
  );

  // Get status color for chips
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': return <VerifiedIcon fontSize="small" />;
      case 'pending': return <PendingIcon fontSize="small" />;
      case 'rejected': return <ErrorIcon fontSize="small" />;
      case 'expired': return <WarningIcon fontSize="small" />;
      default: return <PendingIcon fontSize="small" />;
    }
  };

  return (
    <Box className={styles.dashboard}>
      {/* Header Section */}
      <Box className={styles.header}>
        <Box className={styles.titleSection}>
          <Box className={styles.titleWithAvatar}>
            <Avatar 
              sx={{ 
                width: 48, 
                height: 48, 
                bgcolor: 'primary.main',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ ml: 2 }}>
              <Typography variant="h4" className={styles.title}>
                My Documents
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your verification documents securely
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box className={styles.headerActions}>
          <Tooltip title="Refresh documents">
            <IconButton onClick={() => dispatch(getDocuments())}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter documents">
            <IconButton>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Search documents">
            <IconButton>
              <SearchIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Trust Score & Quick Stats */}
      <Grid container spacing={3} className={styles.statsGrid}>
        <Grid item xs={12} md={6} lg={3}>
          <Card className={styles.statCard} elevation={2}>
            <CardContent>
              <Box className={styles.statContent}>
                <Box className={styles.statIcon} sx={{ bgcolor: 'primary.light' }}>
                  <SecurityIcon color="primary" />
                </Box>
                <Box>
                  <Typography variant="h3" className={styles.statNumber}>
                    {documentStats.trustScore}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trust Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card className={styles.statCard} elevation={2}>
            <CardContent>
              <Box className={styles.statContent}>
                <Box className={styles.statIcon} sx={{ bgcolor: 'success.light' }}>
                  <VerifiedIcon color="success" />
                </Box>
                <Box>
                  <Typography variant="h3" className={styles.statNumber}>
                    {documentStats.verified}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verified
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card className={styles.statCard} elevation={2}>
            <CardContent>
              <Box className={styles.statContent}>
                <Box className={styles.statIcon} sx={{ bgcolor: 'warning.light' }}>
                  <PendingIcon color="warning" />
                </Box>
                <Box>
                  <Typography variant="h3" className={styles.statNumber}>
                    {documentStats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card className={styles.statCard} elevation={2}>
            <CardContent>
              <Box className={styles.statContent}>
                <Box className={styles.statIcon} sx={{ bgcolor: 'error.light' }}>
                  <WarningIcon color="error" />
                </Box>
                <Box>
                  <Typography variant="h3" className={styles.statNumber}>
                    {documentStats.expiringSoon}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expiring Soon
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Verification Progress */}
      <Paper className={styles.progressCard} elevation={2}>
        <Box className={styles.progressHeader}>
          <Box>
            <Typography variant="h6">
              Verification Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {documentStats.verified} of {documentStats.total} documents verified
            </Typography>
          </Box>
          <Chip 
            label={`${documentStats.completionRate}% Complete`}
            color={documentStats.completionRate >= 80 ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={documentStats.completionRate}
          className={styles.progressBar}
        />
      </Paper>

      {/* Expiring Documents Alert */}
      {documentStats.expiringSoon > 0 && (
        <Alert 
          severity="warning" 
          className={styles.expiryAlert}
          action={
            <Chip
              label={`${documentStats.expiringSoon} expiring`}
              size="small"
              color="warning"
              variant="outlined"
            />
          }
        >
          <Typography variant="subtitle2">
            You have documents expiring within 30 days
          </Typography>
          <Typography variant="body2">
            Please renew these documents to maintain your verification status.
          </Typography>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" className={styles.errorAlert}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && !documents && (
        <Box className={styles.loadingState}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading your documents...
          </Typography>
        </Box>
      )}

      {/* Documents Section */}
      <Paper className={styles.documentsSection} elevation={1}>
        <Box className={styles.sectionHeader}>
          <Typography variant="h6">
            Document Library
          </Typography>
          <Box className={styles.viewControls}>
            <Chip
              label={`Group by ${groupBy}`}
              onClick={() => setGroupBy(groupBy === 'type' ? 'status' : 'type')}
              variant="outlined"
              size="small"
            />
            <Chip
              label={showExpiringOnly ? 'Expiring Only' : 'All Documents'}
              onClick={() => setShowExpiringOnly(!showExpiringOnly)}
              color={showExpiringOnly ? 'warning' : 'default'}
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
        
        <Divider />
        
        <Box className={styles.documentsContent}>
          {filteredDocuments && filteredDocuments.length > 0 ? (
            <DocumentGrouping
              documents={filteredDocuments}
              groupBy={groupBy}
              renderDocument={renderDocumentCard}
              className={styles.documentGrouping}
              showGroupActions={true}
              onGroupActionClick={(action, groupName, docs) => {
                console.log('Group action:', action, groupName, docs);
              }}
            />
          ) : (
            <Box className={styles.emptyState}>
              <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No documents uploaded yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload your first document to start the verification process
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="upload document"
        className={styles.fab}
        onClick={() => {
          // Navigate to upload flow
          console.log('Navigate to upload');
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default DocumentDashboard;