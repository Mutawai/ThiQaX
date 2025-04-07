// src/components/admin/verification/VerificationDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Paper, Tabs, Tab, Divider,
  CircularProgress, Badge, Alert, Chip
} from '@mui/material';
import VerificationQueue from './VerificationQueue';
import DocumentPreview from './DocumentPreview';
import VerificationStats from './VerificationStats';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchVerificationQueue, 
  fetchVerificationStats 
} from '../../../store/actions/verificationActions';

const VerificationDashboard = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  const { 
    queue, 
    stats, 
    loading, 
    error 
  } = useSelector(state => state.verification);
  
  // Define queues based on document status
  const pendingQueue = queue.filter(doc => doc.status === 'PENDING');
  const rejectedQueue = queue.filter(doc => doc.status === 'REJECTED');
  
  useEffect(() => {
    dispatch(fetchVerificationQueue());
    dispatch(fetchVerificationStats());
    
    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      dispatch(fetchVerificationQueue());
      dispatch(fetchVerificationStats());
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [dispatch]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedDocument(null);
  };
  
  const handleDocumentSelect = (document) => {
    setSelectedDocument(document);
  };
  
  if (loading && !queue.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Document Verification Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Overview */}
        <Grid item xs={12}>
          <VerificationStats stats={stats} />
        </Grid>
        
        {/* Verification Workspace */}
        <Grid item xs={12} md={5} lg={4}>
          <Paper elevation={2}>
            <Box p={2}>
              <Typography variant="h6">Verification Queue</Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Select a document to verify
              </Typography>
              
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ mb: 2 }}
              >
                <Tab 
                  label={
                    <Badge 
                      badgeContent={pendingQueue.length} 
                      color="primary"
                      max={99}
                      showZero
                    >
                      Pending
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge 
                      badgeContent={rejectedQueue.length} 
                      color="error"
                      max={99}
                      showZero
                    >
                      Rejected
                    </Badge>
                  } 
                />
              </Tabs>
              
              <VerificationQueue 
                documents={activeTab === 0 ? pendingQueue : rejectedQueue}
                onSelectDocument={handleDocumentSelect}
                selectedDocumentId={selectedDocument?._id}
                queueType={activeTab === 0 ? 'pending' : 'rejected'}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7} lg={8}>
          <Paper elevation={2}>
            <Box p={2}>
              <Typography variant="h6">Document Preview & Verification</Typography>
              
              {selectedDocument ? (
                <DocumentPreview 
                  document={selectedDocument}
                  onDocumentVerified={() => {
                    dispatch(fetchVerificationQueue());
                    dispatch(fetchVerificationStats());
                    setSelectedDocument(null);
                  }}
                />
              ) : (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  minHeight="400px"
                  textAlign="center"
                >
                  <Typography color="textSecondary">
                    Select a document from the queue to review
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VerificationDashboard;

// src/components/admin/verification/VerificationQueue.js
import React from 'react';
import {
  List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction,
  Avatar, Typography, IconButton, Box, Chip, Tooltip,
  ListItemButton
} from '@mui/material';
import { 
  InsertDriveFile, 
  AccessTime, 
  PriorityHigh, 
  CheckCircle, 
  Cancel 
} from '@mui/icons-material';
import { format, differenceInHours } from 'date-fns';

const getDocumentIcon = (mimetype) => {
  if (mimetype.includes('image')) {
    return <InsertDriveFile style={{ color: '#4CAF50' }} />;
  } else if (mimetype.includes('pdf')) {
    return <InsertDriveFile style={{ color: '#F44336' }} />;
  } else {
    return <InsertDriveFile />;
  }
};

const getPriorityChip = (document) => {
  const hoursSinceUpload = differenceInHours(
    new Date(), 
    new Date(document.uploadedAt)
  );
  
  if (hoursSinceUpload > 48) {
    return (
      <Chip 
        icon={<PriorityHigh />} 
        label="High" 
        size="small" 
        color="error"
      />
    );
  } else if (hoursSinceUpload > 24) {
    return (
      <Chip 
        icon={<AccessTime />} 
        label="Medium" 
        size="small" 
        color="warning"
      />
    );
  } else {
    return (
      <Chip 
        icon={<AccessTime />} 
        label="Normal" 
        size="small" 
        color="primary"
      />
    );
  }
};

const VerificationQueue = ({ 
  documents, 
  onSelectDocument, 
  selectedDocumentId,
  queueType 
}) => {
  if (!documents || documents.length === 0) {
    return (
      <Box textAlign="center" p={2}>
        <Typography variant="body2" color="textSecondary">
          No documents in the {queueType} queue
        </Typography>
      </Box>
    );
  }
  
  return (
    <List>
      {documents.map((document) => (
        <ListItemButton
          key={document._id}
          selected={selectedDocumentId === document._id}
          onClick={() => onSelectDocument(document)}
          divider
        >
          <ListItemAvatar>
            <Avatar>
              {getDocumentIcon(document.mimetype)}
            </Avatar>
          </ListItemAvatar>
          
          <ListItemText
            primary={document.documentType}
            secondary={
              <>
                <Typography component="span" variant="body2" color="textPrimary">
                  {document.user?.fullName || 'Unknown User'}
                </Typography>
                {' — '}
                {format(new Date(document.uploadedAt), 'MMM d, yyyy')}
              </>
            }
          />
          
          <ListItemSecondaryAction>
            {getPriorityChip(document)}
          </ListItemSecondaryAction>
        </ListItemButton>
      ))}
    </List>
  );
};

export default VerificationQueue;

// src/components/admin/verification/DocumentPreview.js
import React, { useState } from 'react';
import {
  Box, Grid, Typography, Button, TextField, Stack,
  Chip, Divider, Paper, MenuItem, FormControl, InputLabel,
  Select, FormHelperText, Alert, CircularProgress
} from '@mui/material';
import {
  CheckCircle, Cancel, Person, CalendarToday,
  FileUpload, Description, History
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { verifyDocument, rejectDocument } from '../../../store/actions/verificationActions';

const DocumentPreview = ({ document, onDocumentVerified }) => {
  const dispatch = useDispatch();
  const [verificationStatus, setVerificationStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await dispatch(verifyDocument(document._id, notes));
      onDocumentVerified();
    } catch (err) {
      setError('Failed to verify document. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReject = async () => {
    if (!rejectionReason) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await dispatch(rejectDocument(document._id, rejectionReason, notes));
      onDocumentVerified();
    } catch (err) {
      setError('Failed to reject document. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box 
            sx={{ 
              height: '500px', 
              bgcolor: 'background.default',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >
            {document.mimetype.includes('image') ? (
              <img 
                src={document.url} 
                alt={document.documentType} 
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            ) : document.mimetype.includes('pdf') ? (
              <iframe
                src={`${document.url}#toolbar=0`}
                title={document.documentType}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            ) : (
              <Typography>
                Preview not available for this document type
              </Typography>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Document Details</Typography>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Document Type
                </Typography>
                <Typography variant="body1">
                  <Description fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {document.documentType}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Uploaded By
                </Typography>
                <Typography variant="body1">
                  <Person fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {document.user?.fullName || 'Unknown User'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Upload Date
                </Typography>
                <Typography variant="body1">
                  <CalendarToday fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {format(new Date(document.uploadedAt), 'MMM d, yyyy h:mm a')}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Document ID
                </Typography>
                <Typography variant="body1">
                  {document._id}
                </Typography>
              </Box>
              
              {document.expiryDate && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Expiry Date
                  </Typography>
                  <Typography variant="body1">
                    <CalendarToday fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {format(new Date(document.expiryDate), 'MMM d, yyyy')}
                  </Typography>
                </Box>
              )}
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Status
                </Typography>
                <Box>
                  <Chip 
                    label={document.status} 
                    color={
                      document.status === 'VERIFIED' ? 'success' :
                      document.status === 'REJECTED' ? 'error' :
                      'warning'
                    }
                    size="small"
                    icon={
                      document.status === 'VERIFIED' ? <CheckCircle /> :
                      document.status === 'REJECTED' ? <Cancel /> :
                      <History />
                    }
                  />
                </Box>
              </Box>
              
              {document.rejectionReason && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Rejection Reason
                  </Typography>
                  <Typography variant="body2" color="error">
                    {document.rejectionReason}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>Verification Action</Typography>
          
          {document.status === 'PENDING' && (
            <Box>
              <Stack spacing={2}>
                <TextField
                  label="Verification Notes"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this document (optional)"
                  fullWidth
                />
                
                <FormControl error={!!(error && !rejectionReason)} fullWidth>
                  <InputLabel id="rejection-reason-label">
                    Rejection Reason (if rejecting)
                  </InputLabel>
                  <Select
                    labelId="rejection-reason-label"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    label="Rejection Reason (if rejecting)"
                  >
                    <MenuItem value="">None (Approving)</MenuItem>
                    <MenuItem value="DOCUMENT_UNCLEAR">Document is unclear or illegible</MenuItem>
                    <MenuItem value="DOCUMENT_EXPIRED">Document is expired</MenuItem>
                    <MenuItem value="INFORMATION_MISMATCH">Information doesn't match user profile</MenuItem>
                    <MenuItem value="SUSPECTED_FRAUD">Suspected fraudulent document</MenuItem>
                    <MenuItem value="WRONG_DOCUMENT_TYPE">Wrong document type uploaded</MenuItem>
                    <MenuItem value="OTHER">Other (specify in notes)</MenuItem>
                  </Select>
                  {error && !rejectionReason && (
                    <FormHelperText>Please select a rejection reason</FormHelperText>
                  )}
                </FormControl>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleVerify}
                    disabled={loading}
                    startIcon={<CheckCircle />}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Verify'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleReject}
                    disabled={loading}
                    startIcon={<Cancel />}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Reject'}
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}
          
          {document.status !== 'PENDING' && (
            <Alert severity="info">
              This document has already been {document.status.toLowerCase()}. 
              Select another document to verify.
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentPreview;

// src/components/admin/verification/VerificationStats.js
import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  AccessTime,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';

const StatCard = ({ title, value, subtitle, icon, color, progress }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h6" component="div">
            {value}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {title}
          </Typography>
        </Box>
        <Box sx={{ 
          backgroundColor: `${color}.light`, 
          p: 1, 
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
      </Box>
      
      {progress !== undefined && (
        <Box mt={2}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color={color} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box display="flex" justifyContent="space-between" mt={0.5}>
            <Typography variant="caption" color="textSecondary">
              {subtitle}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {progress}%
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

const VerificationStats = ({ stats }) => {
  if (!stats) {
    return null;
  }
  
  const {
    totalDocuments,
    pendingDocuments,
    verifiedDocuments,
    rejectedDocuments,
    verificationRate,
    dailyVerifications,
    dailyTrend
  } = stats;
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Documents"
          value={totalDocuments || 0}
          icon={<AccessTime sx={{ color: 'primary.main' }} />}
          color="primary"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pending Verification"
          value={pendingDocuments || 0}
          subtitle="Of total documents"
          icon={<AccessTime sx={{ color: 'warning.main' }} />}
          color="warning"
          progress={totalDocuments ? Math.round((pendingDocuments / totalDo
