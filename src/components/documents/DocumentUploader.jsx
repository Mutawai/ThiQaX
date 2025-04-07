// src/components/documents/DocumentUploader.jsx
import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert
} from '@mui/material';
import { CloudUpload, Delete, CheckCircle } from '@mui/icons-material';
import { uploadDocument } from '../../redux/actions/documentActions';

const DocumentUploader = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  const documentTypes = [
    { value: 'identity', label: 'Identity Document (ID, Passport)' },
    { value: 'education', label: 'Educational Certificate' },
    { value: 'professional', label: 'Professional Certification' },
    { value: 'employment', label: 'Employment History' },
    { value: 'address', label: 'Proof of Address' },
    { value: 'medical', label: 'Medical Certificate' },
    { value: 'other', label: 'Other Document' }
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('File type not supported. Please upload a PDF, JPG, or PNG file.');
      return;
    }
    
    setError('');
    setFile(selectedFile);
    
    // Create a preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Same validation as handleFileChange
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
      if (!allowedTypes.includes(droppedFile.type)) {
        setError('File type not supported. Please upload a PDF, JPG, or PNG file.');
        return;
      }
      
      setError('');
      setFile(droppedFile);
      
      if (droppedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(droppedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!documentType) {
      setError('Please select a document type');
      return;
    }
    
    if (!documentName) {
      setError('Please provide a document name');
      return;
    }
    
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('documentName', documentName);
    
    try {
      await dispatch(uploadDocument(formData));
      setUploading(false);
      setFile(null);
      setPreview(null);
      setDocumentType('');
      setDocumentName('');
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error uploading document');
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2
      }}
    >
      <Typography variant="h6" gutterBottom>
        Upload Document
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="document-type-label">Document Type</InputLabel>
          <Select
            labelId="document-type-label"
            value={documentType}
            label="Document Type"
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={uploading}
          >
            {documentTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          label="Document Name"
          variant="outlined"
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          disabled={uploading}
          sx={{ mb: 2 }}
        />
      </Box>
      
      <Box
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          mb: 2,
          backgroundColor: file ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept="image/jpeg,image/png,application/pdf,image/jpg"
          disabled={uploading}
        />
        
        {!file ? (
          <>
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="body1" gutterBottom>
              Drag and drop a file here, or click to select a file
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supported formats: PDF, JPG, PNG (Max: 10MB)
            </Typography>
          </>
        ) : (
          <Box>
            {preview ? (
              <Box
                component="img"
                src={preview}
                alt="Document preview"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  mb: 2
                }}
              />
            ) : (
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            )}
            <Typography variant="body1" gutterBottom>
              {file.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </Box>
        )}
      </Box>
      
      {file && (
        <Chip
          label={file.name}
          onDelete={handleRemoveFile}
          disabled={uploading}
          deleteIcon={<Delete />}
          variant="outlined"
          sx={{ mb: 2 }}
        />
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!file || uploading || !documentType || !documentName}
          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </Box>
    </Paper>
  );
};

export default DocumentUploader;
