// client/src/components/messaging/FileAttachmentPreview/FileAttachmentPreview.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  IconButton, 
  CircularProgress,
  Tooltip,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Close as CloseIcon,
  CloudDownload as DownloadIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import styles from './FileAttachmentPreview.module.css';

/**
 * FileAttachmentPreview Component
 * 
 * Displays previews for file attachments in messages
 * 
 * @param {Object} props - Component props
 * @param {Object|File} props.file - File object with metadata or actual File object
 * @param {boolean} props.uploading - Whether the file is currently uploading
 * @param {number} props.progress - Upload progress (0-100)
 * @param {boolean} props.showRemove - Whether to show remove button
 * @param {Function} props.onRemove - Callback when remove button is clicked
 * @param {Function} props.onDownload - Callback when download button is clicked
 * @param {Function} props.onPreview - Callback when preview button is clicked
 */
const FileAttachmentPreview = ({ 
  file, 
  uploading = false, 
  progress = 0, 
  showRemove = false,
  onRemove,
  onDownload,
  onPreview
}) => {
  const [previewError, setPreviewError] = useState(false);
  
  // Get file extension from name
  const getFileExtension = (fileName) => {
    return fileName.split('.').pop().toLowerCase();
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Determine if file is an image
  const isImage = (file) => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const ext = getFileExtension(file.name);
    return imageTypes.includes(ext) || (file.type && file.type.startsWith('image/'));
  };
  
  // Get appropriate icon based on file type
  const getFileIcon = () => {
    if (isImage(file)) return <ImageIcon className={styles.fileIcon} />;
    
    const extension = getFileExtension(file.name);
    
    switch(extension) {
      case 'pdf':
        return <PdfIcon className={styles.fileIcon} style={{ color: '#F40F02' }} />;
      case 'doc':
      case 'docx':
        return <DocIcon className={styles.fileIcon} style={{ color: '#295498' }} />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'webm':
        return <VideoIcon className={styles.fileIcon} style={{ color: '#FF6D00' }} />;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return <AudioIcon className={styles.fileIcon} style={{ color: '#7C4DFF' }} />;
      default:
        return <FileIcon className={styles.fileIcon} />;
    }
  };
  
  // Get URL for the file
  const getFileUrl = () => {
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    
    return file.url || '';
  };
  
  // Handle image load error
  const handleImageError = () => {
    setPreviewError(true);
  };
  
  return (
    <Paper elevation={1} className={styles.container}>
      {/* File Preview */}
      <div className={styles.previewContainer}>
        {isImage(file) && !previewError ? (
          <div className={styles.imagePreview}>
            <img 
              src={getFileUrl()} 
              alt={file.name} 
              className={styles.previewImage}
              onError={handleImageError} 
            />
            {onPreview && (
              <IconButton 
                className={styles.zoomButton}
                onClick={() => onPreview(file)}
                size="small"
                aria-label="Preview image"
              >
                <ZoomInIcon />
              </IconButton>
            )}
          </div>
        ) : (
          <div className={styles.fileIconContainer}>
            {getFileIcon()}
          </div>
        )}
      </div>
      
      {/* File Info */}
      <Box className={styles.fileInfo}>
        <Tooltip title={file.name} placement="top">
          <Typography variant="body2" className={styles.fileName} noWrap>
            {file.name}
          </Typography>
        </Tooltip>
        
        <Typography variant="caption" color="textSecondary">
          {formatFileSize(file.size || 0)}
        </Typography>
        
        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ width: '100%', mt: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              className={styles.progressBar}
            />
          </Box>
        )}
      </Box>
      
      {/* Action Buttons */}
      <Box className={styles.actions}>
        {showRemove && (
          <IconButton 
            size="small" 
            onClick={() => onRemove(file)}
            aria-label="Remove file"
            className={styles.actionButton}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
        
        {!uploading && onDownload && (
          <IconButton 
            size="small" 
            onClick={() => onDownload(file)}
            aria-label="Download file"
            className={styles.actionButton}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        )}
        
        {uploading && (
          <CircularProgress 
            size={24} 
            thickness={5}
            className={styles.uploadingIndicator} 
          />
        )}
      </Box>
    </Paper>
  );
};

FileAttachmentPreview.propTypes = {
  file: PropTypes.shape({
    name: PropTypes.string.isRequired,
    size: PropTypes.number,
    type: PropTypes.string,
    url: PropTypes.string
  }).isRequired,
  uploading: PropTypes.bool,
  progress: PropTypes.number,
  showRemove: PropTypes.bool,
  onRemove: PropTypes.func,
  onDownload: PropTypes.func,
  onPreview: PropTypes.func
};

export default FileAttachmentPreview;