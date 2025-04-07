// src/components/documents/DocumentUpload.js

import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useSelector, useDispatch } from 'react-redux';
import { uploadDocument, removeDocument } from '../../actions/documentActions';

const DocumentUpload = ({ documentType, allowedTypes, maxSize = 10485760, requiredForKyc = false }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);
  
  const { loading, documents, error: documentError } = useSelector(state => state.documents);
  
  // Filter documents by type
  const typeDocuments = documents.filter(doc => doc.documentType === documentType);
  
  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    // Reset error state
    setError(null);
    
    const file = acceptedFiles[0];
    
    // Check if file size is within limits
    if (file.size > maxSize) {
      setError(`File size exceeds the maximum limit of ${maxSize / 1048576} MB`);
      return;
    }
    
    // Check if file type is allowed
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      setError(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }
    
    // Create form data with file and metadata
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    // Dispatch upload action
    dispatch(uploadDocument(formData));
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false
  });
  
  const handleRemoveDocument = (documentId) => {
    dispatch(removeDocument(documentId));
  };
  
  const handlePreview = (document) => {
    setPreviewFile(document);
    setShowPreview(true);
  };
  
  const closePreview = () => {
    setShowPreview(false);
    setPreviewFile(null);
  };
  
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {documentType} Upload
        {requiredForKyc && (
          <Typography component="span" color="error" sx={{ ml: 1 }}>
            (Required for KYC)
          </Typography>
        )}
      </Typography>
      
      {/* Display error message if any */}
      {(error || documentError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || documentError}
        </Alert>
      )}
      
      {/* Drag & Drop area */}
      {typeDocuments.length === 0 ? (
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed #cccccc',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? '#f0f8ff' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="body1" gutterBottom>
            {isDragActive ? 'Drop the file here' : 'Drag and drop a file here, or click to select'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Accepted file types: {allowedTypes.join(', ')} (Max: {maxSize / 1048576} MB)
          </Typography>
          
          {loading && (
            <CircularProgress size={24} sx={{ mt: 2 }} />
          )}
        </Box>
      ) : (
        <List>
          {typeDocuments.map(document => (
            <ListItem 
              key={document._id} 
              sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                mb: 1,
                backgroundColor: document.status === 'VERIFIED' ? '#f1f8e9' : 'white'
              }}
            >
              <ListItemIcon>
                <FileIcon />
              </ListItemIcon>
              <ListItemText 
                primary={document.originalName}
                secondary={`Status: ${document.status} | Uploaded: ${new Date(document.createdAt).toLocaleDateString()}`}
              />
              {document.status === 'VERIFIED' && (
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              )}
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handlePreview(document)}>
                  <FileIcon />
                </IconButton>
                {document.status !== 'VERIFIED' && (
                  <IconButton edge="end" onClick={() => handleRemoveDocument(document._id)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          
          {/* Add new document button */}
          {typeDocuments.length > 0 && typeDocuments.every(doc => doc.status !== 'PENDING') && (
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mt: 2 }}
            >
              Upload New Document
            </Button>
          )}
        </List>
      )}
      
      {/* Document preview dialog */}
      <Dialog open={showPreview} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          {previewFile && (
            previewFile.mimeType.startsWith('image/') ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <img 
                  src={previewFile.url} 
                  alt={previewFile.originalName}
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                <FileIcon sx={{ fontSize: 72, mb: 2 }} />
                <Typography variant="body1">
                  {previewFile.mimeType === 'application/pdf' ? 
                    'PDF document preview is not available' : 
                    'Document preview is not available'}
                </Typography>
                <Button 
                  variant="contained" 
                  href={previewFile.url} 
                  target="_blank" 
                  sx={{ mt: 2 }}
                >
                  Open Document
                </Button>
              </Box>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DocumentUpload;
