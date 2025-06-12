// src/components/documents/SmartUploadFlow/SmartUploadFlow.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
  Fade,
  Zoom,
  Collapse
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  PhotoCamera as CameraIcon,
  Scanner as ScanIcon,
  AutoAwesome as AIIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { uploadDocument } from '../../../redux/actions/documentActions';
import SecurityWatermark from '../SecurityWatermark/SecurityWatermark';
import { formatFileSize, detectDocumentType, validateDocument } from '../../../utils/documentUtils';
import styles from './SmartUploadFlow.module.css';

/**
 * SmartUploadFlow - Modern AI-powered document upload component
 * Features smart document type detection, mobile camera capture, and progressive upload
 */
const SmartUploadFlow = ({ 
  onUploadComplete, 
  onCancel,
  presetDocumentType = '',
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  showPreview = true,
  autoDetectType = true,
  className = ''
}) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.documents);
  const { user } = useSelector((state) => state.auth);
  
  // Component state
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [documentType, setDocumentType] = useState(presetDocumentType);
  const [documentName, setDocumentName] = useState('');
  const [detectedType, setDetectedType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Document types configuration
  const documentTypes = [
    { value: 'identity', label: 'Identity Document', icon: '🆔', description: 'Passport, National ID, Driver\'s License' },
    { value: 'education', label: 'Educational Certificate', icon: '🎓', description: 'Degree, Diploma, Transcript' },
    { value: 'professional', label: 'Professional Certification', icon: '💼', description: 'License, Certificate, Qualification' },
    { value: 'employment', label: 'Employment Document', icon: '📄', description: 'Contract, Reference Letter, CV' },
    { value: 'address', label: 'Proof of Address', icon: '🏠', description: 'Utility Bill, Bank Statement, Lease' },
    { value: 'medical', label: 'Medical Certificate', icon: '🏥', description: 'Health Certificate, Medical Report' },
    { value: 'financial', label: 'Financial Document', icon: '💰', description: 'Bank Statement, Income Proof' },
    { value: 'other', label: 'Other Document', icon: '📋', description: 'Any other supporting document' }
  ];

  // Upload steps
  const steps = ['Select File', 'Verify Details', 'Upload'];

  // File drop handler
  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setValidationErrors(rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map(e => e.message).join(', ')}`
      ));
      return;
    }

    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    await handleFileSelection(file);
  }, []);

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    multiple: false,
    disabled: loading
  });

  // Handle file selection (from drop or input)
  const handleFileSelection = async (file) => {
    setValidationErrors([]);
    
    // Validate file
    const validation = validateDocument(file, { maxSize: maxFileSize, allowedTypes });
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setSelectedFile(file);
    
    // Generate preview URL for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // Auto-detect document type if enabled
    if (autoDetectType && !presetDocumentType) {
      setIsAnalyzing(true);
      try {
        const detected = await detectDocumentType(file);
        setDetectedType(detected.type);
        setDocumentType(detected.type);
        setDocumentName(detected.suggestedName || file.name);
      } catch (error) {
        console.warn('Document type detection failed:', error);
        setDocumentName(file.name);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setDocumentName(file.name);
    }

    // Move to next step
    setActiveStep(1);
  };

  // Handle camera capture
  const handleCameraCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedFile || !documentType || !documentName.trim()) {
      setValidationErrors(['Please complete all required fields']);
      return;
    }

    setActiveStep(2);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', documentType);
    formData.append('documentName', documentName.trim());
    
    if (detectedType) {
      formData.append('detectedType', detectedType);
    }

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      await dispatch(uploadDocument(formData));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Cleanup
      setTimeout(() => {
        handleReset();
        if (onUploadComplete) {
          onUploadComplete();
        }
      }, 1500);
      
    } catch (error) {
      setValidationErrors([error.message || 'Upload failed. Please try again.']);
      setActiveStep(1); // Go back to verification step
    }
  };

  // Reset form
  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setPreviewUrl(null);
    setDocumentType(presetDocumentType);
    setDocumentName('');
    setDetectedType('');
    setUploadProgress(0);
    setValidationErrors([]);
    setIsAnalyzing(false);
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  // Get document type info
  const getDocumentTypeInfo = (type) => {
    return documentTypes.find(dt => dt.value === type) || documentTypes[documentTypes.length - 1];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Box className={`${styles.uploadFlow} ${className}`}>
      {/* Header */}
      <Box className={styles.header}>
        <Typography variant="h5" className={styles.title}>
          Upload Document
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Secure document upload with AI-powered verification
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Stepper activeStep={activeStep} className={styles.stepper}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Display */}
      {validationErrors.length > 0 && (
        <Alert severity="error" className={styles.errorAlert}>
          <Typography variant="subtitle2" gutterBottom>
            Please fix the following issues:
          </Typography>
          {validationErrors.map((error, index) => (
            <Typography key={index} variant="body2">
              • {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Step Content */}
      <Box className={styles.stepContent}>
        
        {/* Step 0: File Selection */}
        {activeStep === 0 && (
          <Fade in timeout={300}>
            <Box>
              {/* Main Drop Zone */}
              <Paper
                {...getRootProps()}
                className={`${styles.dropZone} ${isDragActive ? styles.dragActive : ''} ${isDragReject ? styles.dragReject : ''}`}
                elevation={0}
              >
                <input {...getInputProps()} ref={fileInputRef} />
                
                <Box className={styles.dropContent}>
                  {isDragActive ? (
                    <>
                      <UploadIcon className={styles.dropIcon} />
                      <Typography variant="h6">Drop your document here</Typography>
                    </>
                  ) : (
                    <>
                      <Avatar className={styles.uploadAvatar}>
                        <UploadIcon />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Drag & drop your document
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        or click to browse your files
                      </Typography>
                      <Button variant="contained" size="large" className={styles.browseButton}>
                        Browse Files
                      </Button>
                    </>
                  )}
                </Box>
              </Paper>

              {/* Alternative Upload Methods */}
              <Box className={styles.alternativeMethods}>
                <Typography variant="body2" color="text.secondary" align="center">
                  or use
                </Typography>
                
                <Box className={styles.methodButtons}>
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleCameraCapture}
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<CameraIcon />}
                    onClick={() => cameraInputRef.current?.click()}
                    className={styles.methodButton}
                  >
                    Camera
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<ScanIcon />}
                    className={styles.methodButton}
                    disabled
                  >
                    Scanner
                  </Button>
                </Box>
              </Box>

              {/* File Requirements */}
              <Card className={styles.requirementsCard} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    File Requirements:
                  </Typography>
                  <Box className={styles.requirements}>
                    <Chip label={`Max ${formatFileSize(maxFileSize)}`} size="small" />
                    <Chip label="PDF, JPG, PNG" size="small" />
                    <Chip label="Clear & Readable" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Fade>
        )}

        {/* Step 1: Document Details */}
        {activeStep === 1 && selectedFile && (
          <Fade in timeout={300}>
            <Box className={styles.detailsStep}>
              
              {/* File Preview */}
              <Card className={styles.previewCard} elevation={2}>
                <Box className={styles.previewHeader}>
                  <Typography variant="subtitle1">
                    Selected Document
                  </Typography>
                  <IconButton size="small" onClick={handleReset}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                
                <Box className={styles.previewContent}>
                  {previewUrl ? (
                    <Box className={styles.imagePreview}>
                      <img src={previewUrl} alt="Document preview" />
                      <SecurityWatermark status="pending" opacity={0.1} />
                    </Box>
                  ) : (
                    <Box className={styles.filePreview}>
                      <FileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    </Box>
                  )}
                  
                  <Box className={styles.fileInfo}>
                    <Typography variant="body2" noWrap>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </Typography>
                  </Box>
                </Box>
              </Card>

              {/* AI Analysis Results */}
              {isAnalyzing && (
                <Card className={styles.analysisCard} variant="outlined">
                  <CardContent>
                    <Box className={styles.analysisContent}>
                      <AIIcon className={styles.aiIcon} />
                      <Box>
                        <Typography variant="subtitle2">
                          AI Analysis in Progress...
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Detecting document type and extracting information
                        </Typography>
                      </Box>
                      <CircularProgress size={24} />
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Document Type Detection Results */}
              {detectedType && !isAnalyzing && (
                <Zoom in timeout={300}>
                  <Alert severity="info" className={styles.detectionAlert}>
                    <Box className={styles.detectionContent}>
                      <AIIcon />
                      <Box>
                        <Typography variant="subtitle2">
                          AI Detection: {getDocumentTypeInfo(detectedType).label}
                        </Typography>
                        <Typography variant="body2">
                          Confidence: High • Please verify the details below
                        </Typography>
                      </Box>
                    </Box>
                  </Alert>
                </Zoom>
              )}

              {/* Form Fields */}
              <Box className={styles.formFields}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Document Type *</InputLabel>
                  <Select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    label="Document Type *"
                  >
                    {documentTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box className={styles.typeOption}>
                          <span className={styles.typeIcon}>{type.icon}</span>
                          <Box>
                            <Typography variant="body2">{type.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {type.description}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Document Name *"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  variant="outlined"
                  placeholder="Enter a descriptive name for this document"
                  helperText="This will help you identify the document later"
                />

                {/* Advanced Options */}
                <Box>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    startIcon={<EditIcon />}
                  >
                    Advanced Options
                  </Button>
                  
                  <Collapse in={showAdvanced}>
                    <Box className={styles.advancedOptions}>
                      <TextField
                        fullWidth
                        label="Document Number"
                        placeholder="Enter document ID/number if applicable"
                        variant="outlined"
                        size="small"
                      />
                      <TextField
                        fullWidth
                        label="Issue Date"
                        type="date"
                        variant="outlined"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        fullWidth
                        label="Expiry Date"
                        type="date"
                        variant="outlined"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  </Collapse>
                </Box>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Step 2: Upload Progress */}
        {activeStep === 2 && (
          <Fade in timeout={300}>
            <Box className={styles.uploadStep}>
              <Box className={styles.uploadProgress}>
                <Avatar className={styles.progressAvatar}>
                  {uploadProgress === 100 ? <SuccessIcon /> : <UploadIcon />}
                </Avatar>
                
                <Typography variant="h6" gutterBottom>
                  {uploadProgress === 100 ? 'Upload Complete!' : 'Uploading Document...'}
                </Typography>
                
                <Box className={styles.progressContainer}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    className={styles.progressBar}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(uploadProgress)}% complete
                  </Typography>
                </Box>
                
                {uploadProgress === 100 && (
                  <Typography variant="body2" color="text.secondary">
                    Your document has been uploaded and will be reviewed shortly.
                  </Typography>
                )}
              </Box>
            </Box>
          </Fade>
        )}
      </Box>

      {/* Action Buttons */}
      <Box className={styles.actions}>
        {activeStep === 1 && (
          <>
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<BackIcon />}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!documentType || !documentName.trim() || loading}
              endIcon={loading ? <CircularProgress size={20} /> : <NextIcon />}
              className={styles.submitButton}
            >
              {loading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </>
        )}
        
        {activeStep !== 2 && onCancel && (
          <Button variant="text" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default SmartUploadFlow;