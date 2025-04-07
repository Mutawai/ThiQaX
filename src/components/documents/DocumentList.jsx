// src/components/documents/DocumentList.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material';
import {
  Visibility,
  Delete,
  CheckCircle,
  Cancel,
  Pending,
  AccessTime,
  Error,
  WarningAmber
} from '@mui/icons-material';
import { 
  getDocuments, 
  deleteDocument 
} from '../../redux/actions/documentActions';
import { formatDate } from '../../utils/dateUtils';

const DocumentList = () => {
  const dispatch = useDispatch();
  const { documents, loading, error } = useSelector((state) => state.documents);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  useEffect(() => {
    dispatch(getDocuments());
  }, [dispatch]);

  const getStatusChip = (status) => {
    switch (status) {
      case 'PENDING':
        return <Chip icon={<Pending />} label="Pending" color="warning" size="small" />;
      case 'VERIFIED':
        return <Chip icon={<CheckCircle />} label="Verified" color="success" size="small" />;
      case 'REJECTED':
        return <Chip icon={<Cancel />} label="Rejected" color="error" size="small" />;
      case 'EXPIRED':
        return <Chip icon={<Error />} label="Expired" color="error" size="small" />;
      default:
        return <Chip icon={<Pending />} label="Processing" color="info" size="small" />;
    }
  };

  const getDocumentTypeLabel = (type) => {
    const typeMap = {
      'identity': 'Identity Document',
      'education': 'Educational Certificate',
      'professional': 'Professional Certification',
      'employment': 'Employment History',
      'address': 'Proof of Address',
      'medical': 'Medical Certificate',
      'other': 'Other Document'
    };
    
    return typeMap[type] || 'Document';
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 30;
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (documentToDelete) {
      dispatch(deleteDocument(documentToDelete._id));
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleDeleteClick = (document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        My Documents
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : documents && documents.length > 0 ? (
        <Grid container spacing={2}>
          {documents.map((document) => (
            <Grid item xs={12} sm={6} md={4} key={document._id}>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  borderLeft: document.status === 'VERIFIED' 
                    ? '4px solid #4caf50' 
                    : document.status === 'REJECTED'
                    ? '4px solid #f44336'
                    : isExpiringSoon(document.expiryDate)
                    ? '4px solid #ff9800'
                    : '4px solid #2196f3'
                }}
              >
                {isExpiringSoon(document.expiryDate) && (
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Tooltip title="Document expiring soon">
                      <WarningAmber color="warning" />
                    </Tooltip>
                  </Box>
                )}
                
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {document.documentName}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {getDocumentTypeLabel(document.documentType)}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ mt: 1, mb: 2 }}>
                  {getStatusChip(document.status)}
                </Box>
                
                {document.expiryDate && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" display="flex" alignItems="center">
                      <AccessTime fontSize="small" sx={{ mr: 0.5 }} />
                      Expires: {formatDate(document.expiryDate)}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                  <Tooltip title="View Document">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleViewDocument(document)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Delete Document">
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteClick(document)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            textAlign: 'center', 
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderRadius: 2
          }}
        >
          <Typography variant="body1">
            You haven't uploaded any documents yet.
          </Typography>
        </Paper>
      )}
      
      {/* Document Preview Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDocument?.documentName}
          <Typography variant="subtitle2" color="textSecondary">
            {selectedDocument && getDocumentTypeLabel(selectedDocument.documentType)}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDocument?.fileUrl && (
            selectedDocument.fileUrl.endsWith('.pdf') ? (
              <Box sx={{ height: '70vh', width: '100%' }}>
                <iframe
                  src={selectedDocument.fileUrl}
                  title={selectedDocument.documentName}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              </Box>
            ) : (
              <Box
                component="img"
                src={selectedDocument.fileUrl}
                alt={selectedDocument.documentName}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            )
          )}
          
          {selectedDocument && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Document Details:
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {selectedDocument.status}
              </Typography>
              {selectedDocument.verificationDate && (
                <Typography variant="body2">
                  <strong>Verified on:</strong> {formatDate(selectedDocument.verificationDate)}
                </Typography>
              )}
              {selectedDocument.expiryDate && (
                <Typography variant="body2">
                  <strong>Expires on:</strong> {formatDate(selectedDocument.expiryDate)}
                </Typography>
              )}
              {selectedDocument.verificationNotes && (
                <Typography variant="body2">
                  <strong>Notes:</strong> {selectedDocument.verificationNotes}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Uploaded on:</strong> {formatDate(selectedDocument.createdAt)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Document?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{documentToDelete?.documentName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentList;
