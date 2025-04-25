import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton, 
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  Slide,
  Fab,
  Backdrop
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  FlipCameraIos as FlipCameraIcon,
  Close as CloseIcon,
  Photo as GalleryIcon,
  Check as CheckIcon,
  Crop as CropIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as ResetIcon,
  Delete as DeleteIcon,
  BrightnessLow as BrightnessIcon,
  Contrast as ContrastIcon,
  Collections as ImagesIcon,
  TouchApp as TouchIcon
} from '@mui/icons-material';
import styles from './MobileDocumentCapture.module.css';

// Slide transition for dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});
/**
 * MobileDocumentCapture Component
 * 
 * A mobile-optimized component for capturing document images using the device camera
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the capture dialog is open
 * @param {Function} props.onClose - Callback when the dialog is closed
 * @param {Function} props.onCapture - Callback when a document is captured with the image data
 * @param {string} props.documentType - Type of document being captured (e.g., "ID Card", "Passport")
 * @param {boolean} props.withCropping - Whether to enable cropping tool
 * @param {boolean} props.withEnhancements - Whether to enable image enhancement tools
 * @param {Array} props.capturedImages - Previously captured images
 * @param {boolean} props.loading - Whether a capture operation is in progress
 * @param {string} props.errorMessage - Error message to display
 */
const MobileDocumentCapture = ({
  open,
  onClose,
  onCapture,
  documentType = 'Document',
  withCropping = true,
  withEnhancements = true,
  capturedImages = [],
  loading = false,
  errorMessage = ''
}) => {
  // Capture states
  const [activeCamera, setActiveCamera] = useState('environment'); // 'environment' or 'user'
  const [captureMode, setCaptureMode] = useState('camera'); // 'camera' or 'gallery'
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Enhancement states
  const [editMode, setEditMode] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isAdjusting, setIsAdjusting] = useState(null); // 'brightness' or 'contrast' or null
  
  // Cropping states
  const [cropMode, setCropMode] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [cropActive, setCropActive] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaStreamRef = useRef(null);
// Initialize camera when dialog opens
  useEffect(() => {
    if (open && captureMode === 'camera') {
      initializeCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open, activeCamera, captureMode]);
  
  // Initialize camera
  const initializeCamera = async () => {
    try {
      stopCamera(); // Stop any existing stream
      
      const constraints = {
        video: {
          facingMode: activeCamera,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to gallery mode if camera fails
      setCaptureMode('gallery');
    }
  };
  
  // Stop camera stream
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      const tracks = mediaStreamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };
  
  // Switch camera
  const handleSwitchCamera = () => {
    setActiveCamera(prevCamera => 
      prevCamera === 'environment' ? 'user' : 'environment'
    );
  };
  
  // Toggle flash
  const handleToggleFlash = () => {
    setFlashEnabled(prev => !prev);
    
    // Apply flash to track if available
    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      if (track && track.getCapabilities && track.getCapabilities().torch) {
        track.applyConstraints({
          advanced: [{ torch: !flashEnabled }]
        }).catch(e => console.error("Error toggling flash:", e));
      }
    }
  };
// Capture image from camera
  const handleCaptureImage = () => {
    if (!videoRef.current) return;
    
    setProcessing(true);
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const data = canvas.toDataURL('image/jpeg', 0.95);
      setImageData(data);
      
      // Stop camera after capture
      stopCamera();
    } catch (error) {
      console.error('Error capturing image:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle file input change (gallery mode)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageData(event.target.result);
      setProcessing(false);
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      setProcessing(false);
    };
    
    reader.readAsDataURL(file);
  };
  
  // Open file picker (gallery mode)
  const handleOpenGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Switch between camera and gallery mode
  const handleSwitchMode = (mode) => {
    setCaptureMode(mode);
    setImageData(null);
    
    if (mode === 'camera') {
      initializeCamera();
    } else {
      stopCamera();
    }
  };
// Save captured image
  const handleSaveImage = () => {
    if (!imageData || loading) return;
    
    // Apply any edits if needed
    const finalImage = withEnhancements && (brightness !== 100 || contrast !== 100)
      ? applyEnhancements(imageData)
      : imageData;
      
    if (onCapture) {
      onCapture(finalImage);
    }
    
    // Reset state
    resetCaptureState();
  };
  
  // Retake the image
  const handleRetake = () => {
    setImageData(null);
    setEditMode(false);
    setCropMode(false);
    setBrightness(100);
    setContrast(100);
    
    if (captureMode === 'camera') {
      initializeCamera();
    }
  };
  
  // Reset capture state
  const resetCaptureState = () => {
    setImageData(null);
    setEditMode(false);
    setCropMode(false);
    setBrightness(100);
    setContrast(100);
    
    if (open && captureMode === 'camera') {
      initializeCamera();
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    resetCaptureState();
    stopCamera();
    
    if (onClose) {
      onClose();
    }
  };
  
  // Toggle edit mode
  const handleToggleEditMode = () => {
    setEditMode(prev => !prev);
    setCropMode(false);
  };
  
  // Toggle crop mode
  const handleToggleCropMode = () => {
    setCropMode(prev => !prev);
    setEditMode(false);
  };
// Handle crop start
  const handleCropStart = (e) => {
    if (!cropMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setCropStart({ x, y });
    setCropEnd({ x, y });
    setCropActive(true);
  };
  
  // Handle crop move
  const handleCropMove = (e) => {
    if (!cropMode || !cropActive) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    setCropEnd({ x, y });
  };
  
  // Handle crop end
  const handleCropEnd = () => {
    if (!cropMode || !cropActive) return;
    
    setCropActive(false);
    
    // Apply crop
    if (Math.abs(cropStart.x - cropEnd.x) > 0.05 && Math.abs(cropStart.y - cropEnd.y) > 0.05) {
      applyImageCrop();
    }
  };
  
  // Apply image crop
  const applyImageCrop = () => {
    if (!imageData) return;
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate crop dimensions
      const x1 = Math.min(cropStart.x, cropEnd.x) * img.width;
      const y1 = Math.min(cropStart.y, cropEnd.y) * img.height;
      const x2 = Math.max(cropStart.x, cropEnd.x) * img.width;
      const y2 = Math.max(cropStart.y, cropEnd.y) * img.height;
      
      const cropWidth = x2 - x1;
      const cropHeight = y2 - y1;
      
      // Set canvas dimensions
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      // Draw cropped image
      ctx.drawImage(img, x1, y1, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      
      // Get cropped image data
      const croppedImage = canvas.toDataURL('image/jpeg', 0.95);
      setImageData(croppedImage);
      
      // Reset crop state
      setCropMode(false);
    };
    
    img.src = imageData;
  };
// Apply brightness and contrast adjustments
  const applyEnhancements = (imgData) => {
    if (!imgData) return imgData;
    
    const img = new Image();
    img.src = imgData;
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply brightness and contrast
    const brightnessValue = (brightness - 100) / 100 * 255;
    const contrastFactor = (contrast / 100) ** 2;
    
    for (let i = 0; i < data.length; i += 4) {
      // Brightness
      data[i] += brightnessValue;     // Red
      data[i + 1] += brightnessValue; // Green
      data[i + 2] += brightnessValue; // Blue
      
      // Contrast
      data[i] = ((data[i] - 128) * contrastFactor) + 128;     // Red
      data[i + 1] = ((data[i + 1] - 128) * contrastFactor) + 128; // Green
      data[i + 2] = ((data[i + 2] - 128) * contrastFactor) + 128; // Blue
      
      // Ensure values are within 0-255 range
      data[i] = Math.max(0, Math.min(255, data[i]));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
    }
    
    // Put modified image data back
    ctx.putImageData(imageData, 0, 0);
    
    // Return as data URL
    return canvas.toDataURL('image/jpeg', 0.95);
  };
  
  // Handle slider change for brightness/contrast
  const handleSliderChange = (event, type) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const value = Math.max(50, Math.min(150, 
      50 + ((event.clientX - rect.left) / rect.width) * 100
    ));
    
    if (type === 'brightness') {
      setBrightness(value);
    } else if (type === 'contrast') {
      setContrast(value);
    }
  };
  
  // Start adjusting brightness/contrast
  const handleStartAdjusting = (type) => {
    setIsAdjusting(type);
  };
  
  // Stop adjusting brightness/contrast
  const handleStopAdjusting = () => {
    setIsAdjusting(null);
  };
// Reset brightness and contrast
  const handleResetEnhancements = () => {
    setBrightness(100);
    setContrast(100);
  };
  
  // Render the document outline overlay for camera
  const renderDocumentOutline = () => {
    return (
      <Box className={styles.documentOutline}>
        <Box className={styles.documentCorners}>
          <div className={styles.corner} style={{ top: 0, left: 0 }}></div>
          <div className={styles.corner} style={{ top: 0, right: 0 }}></div>
          <div className={styles.corner} style={{ bottom: 0, left: 0 }}></div>
          <div className={styles.corner} style={{ bottom: 0, right: 0 }}></div>
        </Box>
        <Typography variant="caption" className={styles.documentGuide}>
          Position {documentType} within the frame
        </Typography>
      </Box>
    );
  };
  
  // Render camera view
  const renderCameraView = () => {
    return (
      <Box className={styles.cameraContainer}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={styles.videoPreview}
        />
        
        {renderDocumentOutline()}
        
        {/* Camera controls */}
        <Box className={styles.cameraControls}>
          <IconButton 
            className={styles.cameraButton}
            onClick={handleToggleFlash}
            disabled={processing}
          >
            <BrightnessIcon className={flashEnabled ? styles.activeIcon : ''} />
          </IconButton>
          
          <Fab
            color="primary"
            className={styles.captureButton}
            onClick={handleCaptureImage}
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : <CameraIcon />}
          </Fab>
          
          <IconButton 
            className={styles.cameraButton}
            onClick={handleSwitchCamera}
            disabled={processing}
          >
            <FlipCameraIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };
// Render gallery view
  const renderGalleryView = () => {
    return (
      <Box className={styles.galleryContainer}>
        <Box className={styles.galleryPrompt}>
          <ImagesIcon className={styles.galleryIcon} />
          <Typography variant="body1" gutterBottom>
            Select a {documentType} image from your gallery
          </Typography>
          <Button
            variant="contained"
            startIcon={<GalleryIcon />}
            onClick={handleOpenGallery}
            className={styles.galleryButton}
            disabled={processing}
          >
            Choose Image
          </Button>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className={styles.fileInput}
          />
        </Box>
      </Box>
    );
  };
  
  // Render image preview
  const renderImagePreview = () => {
    return (
      <Box className={styles.previewContainer}>
        <Box 
          className={`${styles.imageContainer} ${cropMode ? styles.cropMode : ''}`}
          onMouseDown={handleCropStart}
          onMouseMove={handleCropMove}
          onMouseUp={handleCropEnd}
          onMouseLeave={handleCropEnd}
          onTouchStart={(e) => handleCropStart({ ...e, clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })}
          onTouchMove={(e) => handleCropMove({ ...e, clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })}
          onTouchEnd={handleCropEnd}
        >
          <img 
            src={imageData} 
            alt="Captured document" 
            className={styles.previewImage}
            style={{
              filter: editMode ? `brightness(${brightness}%) contrast(${contrast}%)` : 'none'
            }}
          />
          
          {cropMode && cropActive && (
            <Box 
              className={styles.cropBox}
              style={{
                left: `${Math.min(cropStart.x, cropEnd.x) * 100}%`,
                top: `${Math.min(cropStart.y, cropEnd.y) * 100}%`,
                width: `${Math.abs(cropEnd.x - cropStart.x) * 100}%`,
                height: `${Math.abs(cropEnd.y - cropStart.y) * 100}%`
              }}
            />
          )}
          
          {cropMode && !cropActive && (
            <Box className={styles.cropInstructions}>
              <TouchIcon />
              <Typography variant="body2">
                Draw to crop the image
              </Typography>
            </Box>
          )}
        </Box>
{/* Edit controls */}
        {withEnhancements && editMode && (
          <Box className={styles.enhancementControls}>
            <Box className={styles.enhancementControl}>
              <Typography variant="caption">Brightness</Typography>
              <Box 
                className={styles.slider}
                onClick={(e) => handleSliderChange(e, 'brightness')}
              >
                <Box 
                  className={styles.sliderTrack}
                  style={{ width: `${((brightness - 50) / 100) * 100}%` }}
                />
                <Box 
                  className={styles.sliderThumb}
                  style={{ left: `${((brightness - 50) / 100) * 100}%` }}
                  onMouseDown={() => handleStartAdjusting('brightness')}
                  onTouchStart={() => handleStartAdjusting('brightness')}
                />
              </Box>
            </Box>
            
            <Box className={styles.enhancementControl}>
              <Typography variant="caption">Contrast</Typography>
              <Box 
                className={styles.slider}
                onClick={(e) => handleSliderChange(e, 'contrast')}
              >
                <Box 
                  className={styles.sliderTrack}
                  style={{ width: `${((contrast - 50) / 100) * 100}%` }}
                />
                <Box 
                  className={styles.sliderThumb}
                  style={{ left: `${((contrast - 50) / 100) * 100}%` }}
                  onMouseDown={() => handleStartAdjusting('contrast')}
                  onTouchStart={() => handleStartAdjusting('contrast')}
                />
              </Box>
            </Box>
            
            <Button 
              size="small"
              startIcon={<ResetIcon />}
              onClick={handleResetEnhancements}
              className={styles.resetButton}
            >
              Reset
            </Button>
          </Box>
        )}
        
        {/* Action buttons */}
        <Box className={styles.previewActions}>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={handleRetake}
            className={styles.actionButton}
            disabled={loading}
          >
            Retake
          </Button>
          
          <Box className={styles.editButtons}>
            {withCropping && (
              <IconButton 
                onClick={handleToggleCropMode}
                className={`${styles.editButton} ${cropMode ? styles.activeEditButton : ''}`}
                disabled={loading}
              >
                <CropIcon />
              </IconButton>
            )}
            
            {withEnhancements && (
              <IconButton 
                onClick={handleToggleEditMode}
                className={`${styles.editButton} ${editMode ? styles.activeEditButton : ''}`}
                disabled={loading}
              >
                <ContrastIcon />
              </IconButton>
            )}
          </Box>
<Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
            onClick={handleSaveImage}
            className={styles.actionButton}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Save'}
          </Button>
        </Box>
      </Box>
    );
  };
  
  // Render mode switch tabs
  const renderModeSwitchTabs = () => {
    return (
      <Box className={styles.modeSwitchTabs}>
        <Button
          className={`${styles.modeTab} ${captureMode === 'camera' ? styles.activeTab : ''}`}
          onClick={() => handleSwitchMode('camera')}
          startIcon={<CameraIcon />}
          disabled={processing || loading}
        >
          Camera
        </Button>
        <Button
          className={`${styles.modeTab} ${captureMode === 'gallery' ? styles.activeTab : ''}`}
          onClick={() => handleSwitchMode('gallery')}
          startIcon={<GalleryIcon />}
          disabled={processing || loading}
        >
          Gallery
        </Button>
      </Box>
    );
  };
  
  // Main render
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
    >
      <Paper className={styles.root}>
        {/* Header */}
        <Box className={styles.header}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleClose}
            disabled={processing || loading}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" className={styles.title}>
            Capture {documentType}
          </Typography>
          <div style={{ width: 48 }}></div> {/* For centering title */}
        </Box>
        
        {/* Error message */}
        {errorMessage && (
          <Alert severity="error" className={styles.errorAlert}>
            {errorMessage}
          </Alert>
        )}
        
        {/* Mode switch tabs */}
        {!imageData && renderModeSwitchTabs()}
        
        {/* Main content */}
        <DialogContent className={styles.content}>
          {!imageData && captureMode === 'camera' && renderCameraView()}
          {!imageData && captureMode === 'gallery' && renderGalleryView()}
          {imageData && renderImagePreview()}
        </DialogContent>
      </Paper>
      
      {/* Global adjustments overlay */}
      {isAdjusting && (
        <Backdrop
          open={true}
          className={styles.adjustBackdrop}
          onMouseUp={handleStopAdjusting}
          onTouchEnd={handleStopAdjusting}
        ></Backdrop>
      )}
    </Dialog>
  );
};

MobileDocumentCapture.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCapture: PropTypes.func.isRequired,
  documentType: PropTypes.string,
  withCropping: PropTypes.bool,
  withEnhancements: PropTypes.bool,
  capturedImages: PropTypes.array,
  loading: PropTypes.bool,
  errorMessage: PropTypes.string
};

export default MobileDocumentCapture;