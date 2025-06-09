// client/src/components/kyc/DocumentVerification/DocumentVerification.jsx
import React, { useState, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  ZoomIn as ZoomIcon,
  Info as InfoIcon,
  CameraAlt as CameraIcon,
  InsertDriveFile as FileIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import MobileDocumentCapture from '../../mobile/MobileDocumentCapture/MobileDocumentCapture';
import styles from './DocumentVerification.module.css';

const documentTypes = {
  idDocument: {
    label: 'ID Document',
    description: 'Passport, National ID, or Driver\'s License',
    acceptedFormats: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    maxSize: 5 * 1024 * 1024, // 5MB
    requirements: [
      'Document must be valid and not expired',
      'All four corners must be visible',
      'Text must be clearly readable',
      'No glare or shadows obscuring information'
    ]
  },
  addressProof: {
    label: 'Address Proof',
    description: 'Utility bill, bank statement, or rental agreement',
    acceptedFormats: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    maxSize: 5 * 1024 * 1024, // 5MB
    requirements: [
      'Document must be dated within last 3 months',
      'Your name and address must be clearly visible',
      'Official letterhead or logo must be present',
      'All text must be legible'
    ]
  },
  selfie: {
    label: 'Selfie with ID',
    description: 'Photo of yourself holding your ID document',
    acceptedFormats: ['image/jpeg', 'image/png', 'image/jpg'],
    maxSize: 5 * 1024 * 1024, // 5MB
    requirements: [
      'Your face must be clearly visible',
      'ID document must be held next to your face',
      'Both your face and ID must be in focus',
      'Good lighting with no shadows on face or ID'
    ]
  }
};

const DocumentVerification = ({ onUpload, uploadedDocuments, uploadProgress }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRefs = useRef({});
  
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewDialog, setPreviewDialog] = useState({ open: false, document: null });
  const [cameraDialog, setCameraDialog] = useState({ open: false, type: null });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState({});

  const handleFileSelect = (type, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const config = documentTypes[type];
    const error = validateFile(file, config);
    
    if (error) {
      setErrors(prev => ({ ...prev, [type]: error }));
      return;
    }

    setErrors(prev => ({ ...prev, [type]: null }));
    handleUpload(type, file);
  };

  const validateFile = (file, config) => {
    if (!config.acceptedFormats.includes(file.type)) {
      return 'Invalid file format. Please upload a valid image or PDF.';
    }
    
    if (file.size > config.maxSize) {
      return `File too large. Maximum size is ${config.maxSize / (1024 * 1024)}MB.`;
    }
    
    return null;
  };

  const handleUpload = async (type, file) => {
    setUploading(prev => ({ ...prev, [type]: true }));
    
    try {
      await onUpload(type, file);
      setUploading(prev => ({ ...prev, [type]: false }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [type]: error.message }));
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleCapture = async (type, imageData) => {
    setCameraDialog({ open: false, type: null });
    
    // Convert base64 to blob
    const response = await fetch(imageData);
    const blob = await response.blob();
    const file = new File([blob], `${type}_capture.jpg`, { type: 'image/jpeg' });
    
    handleUpload(type, file);
  };

  const handleDelete = (type) => {
    if (uploadedDocuments[type]) {
      // Call parent's delete handler if available
      if (onUpload) {
        onUpload(type, null);
      }
    }
  };

  const handlePreview = (document) => {
    setPreviewDialog({ open: true, document });
  };

  const renderDocumentCard = (type) => {
    const config = documentTypes[type];
    const document = uploadedDocuments[type];
    const isUploading = uploading[type];
    const error = errors[type];

    return (
      <Card 
        className={`${styles.documentCard} ${document ? styles.uploaded : ''}`}
        elevation={2}
      >
        <CardContent>
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6" gutterBottom>
                  {config.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {config.description}
                </Typography>
              </Box>
              {document && (
                <Chip
                  icon={<CheckIcon />}
                  label="Uploaded"
                  color="success"
                  size="small"
                />
              )}
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setErrors(prev => ({ ...prev, [type]: null }))}>
                {error}
              </Alert>
            )}

            {isUploading && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Uploading...
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            {!document && !isUploading && (
              <Box>
                <input
                  ref={el => fileInputRefs.current[type] = el}
                  type="file"
                  accept={config.acceptedFormats.join(',')}
                  onChange={(e) => handleFileSelect(type, e)}
                  style={{ display: 'none' }}
                  id={`file-input-${type}`}
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRefs.current[type].click()}
                    size="small"
                  >
                    Choose File
                  </Button>
                  {isMobile && type !== 'addressProof' && (
                    <Button
                      variant="outlined"
                      startIcon={<CameraIcon />}
                      onClick={() => setCameraDialog({ open: true, type })}
                      size="small"
                    >
                      Camera
                    </Button>
                  )}
                </Stack>
              </Box>
            )}

            {document && !isUploading && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<ZoomIcon />}
                  onClick={() => handlePreview(document)}
                  size="small"
                >
                  Preview
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(type)}
                  size="small"
                >
                  Remove
                </Button>
              </Stack>
            )}

            <Box
              className={styles.requirements}
              onClick={() => setSelectedDocument(selectedDocument === type ? null : type)}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <InfoIcon fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Requirements
                </Typography>
              </Stack>
              {selectedDocument === type && (
                <List dense className={styles.requirementsList}>
                  {config.requirements.map((req, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={req} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box className={styles.documentVerification}>
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          Please upload clear, readable copies of your documents. All information must be visible and unobscured.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderDocumentCard('idDocument')}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderDocumentCard('addressProof')}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderDocumentCard('selfie')}
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, document: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          {previewDialog.document && (
            <Box className={styles.previewContainer}>
              {previewDialog.document.type === 'application/pdf' ? (
                <embed
                  src={previewDialog.document.url}
                  type="application/pdf"
                  width="100%"
                  height="500px"
                />
              ) : (
                <img
                  src={previewDialog.document.url}
                  alt="Document preview"
                  className={styles.previewImage}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, document: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile Camera Dialog */}
      {isMobile && (
        <MobileDocumentCapture
          open={cameraDialog.open}
          onClose={() => setCameraDialog({ open: false, type: null })}
          onCapture={(imageData) => handleCapture(cameraDialog.type, imageData)}
          documentType={documentTypes[cameraDialog.type]?.label || ''}
        />
      )}
    </Box>
  );
};

export default DocumentVerification;