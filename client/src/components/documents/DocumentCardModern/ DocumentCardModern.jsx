// src/components/documents/DocumentCardModern/DocumentCardModern.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  LinearProgress,
  Fade,
  Zoom,
  Badge,
  Divider
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  Verified as VerifiedIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Security as SecurityIcon,
  TrendingUp as TrustIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import SecurityWatermark from '../SecurityWatermark/SecurityWatermark';
import ExpirationNotice from '../ExpirationNotice/ExpirationNotice';
import { formatDate } from '../../../utils/dateUtils';
import { formatFileSize } from '../../../utils/documentUtils';
import styles from './DocumentCardModern.module.css';

/**
 * DocumentCardModern - Modern document card component
 * Features trust indicators, security watermarks, and modern interactions
 */
const DocumentCardModern = ({
  document,
  onView,
  onDownload,
  onEdit,
  onDelete,
  onShare,
  onRefresh,
  showActions = true,
  showDetails = true,
  showPreview = true,
  compact = false,
  elevation = 2,
  interactive = true,
  className = ''
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Handle menu actions
  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action, callback) => {
    handleMenuClose();
    if (callback) {
      callback(document);
    }
  };

  // Get document type info
  const getDocumentTypeInfo = () => {
    const typeMap = {
      identity: { icon: <SecurityIcon />, label: 'Identity', color: 'primary' },
      education: { icon: <DocIcon />, label: 'Education', color: 'secondary' },
      professional: { icon: <VerifiedIcon />, label: 'Professional', color: 'success' },
      employment: { icon: <DocIcon />, label: 'Employment', color: 'info' },
      address: { icon: <DocIcon />, label: 'Address', color: 'warning' },
      medical: { icon: <DocIcon />, label: 'Medical', color: 'error' },
      financial: { icon: <TrustIcon />, label: 'Financial', color: 'primary' },
      other: { icon: <FileIcon />, label: 'Document', color: 'default' }
    };
    
    return typeMap[document.documentType] || typeMap.other;
  };

  // Get status info
  const getStatusInfo = () => {
    switch (document.status?.toLowerCase()) {
      case 'verified':
        return { 
          icon: <VerifiedIcon />, 
          label: 'Verified', 
          color: 'success',
          description: 'Document has been verified' 
        };
      case 'pending':
        return { 
          icon: <PendingIcon />, 
          label: 'Pending', 
          color: 'warning',
          description: 'Verification in progress' 
        };
      case 'rejected':
        return { 
          icon: <ErrorIcon />, 
          label: 'Rejected', 
          color: 'error',
          description: 'Document needs attention' 
        };
      case 'expired':
        return { 
          icon: <WarningIcon />, 
          label: 'Expired', 
          color: 'error',
          description: 'Document has expired' 
        };
      default:
        return { 
          icon: <PendingIcon />, 
          label: 'Processing', 
          color: 'default',
          description: 'Processing document' 
        };
    }
  };

  // Get file type icon
  const getFileIcon = () => {
    if (!document.fileUrl && !document.mimeType) return <FileIcon />;
    
    const mimeType = document.mimeType || '';
    const fileName = document.fileName || document.documentName || '';
    
    if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp)$/i.test(fileName)) {
      return <ImageIcon />;
    }
    if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      return <PdfIcon />;
    }
    return <DocIcon />;
  };

  // Calculate trust score
  const getTrustScore = () => {
    let score = 0;
    if (document.status === 'VERIFIED' || document.status === 'verified') score += 40;
    if (document.verificationDate) score += 20;
    if (document.expiryDate && new Date(document.expiryDate) > new Date()) score += 20;
    if (document.fileUrl) score += 10;
    if (document.documentType !== 'other') score += 10;
    return Math.min(100, score);
  };

  const typeInfo = getDocumentTypeInfo();
  const statusInfo = getStatusInfo();
  const trustScore = getTrustScore();
  const isExpiringSoon = document.expiryDate && 
    Math.ceil((new Date(document.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 30;

  return (
    <Fade in timeout={300}>
      <Card
        className={`${styles.card} ${compact ? styles.compact : ''} ${interactive ? styles.interactive : ''} ${className}`}
        elevation={isHovered && interactive ? elevation + 2 : elevation}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => interactive && onView && onView(document)}
      >
        {/* Header with Status and Actions */}
        <Box className={styles.cardHeader}>
          <Box className={styles.headerLeft}>
            <Badge
              badgeContent={
                <Tooltip title={`Trust Score: ${trustScore}%`}>
                  <Box className={styles.trustBadge}>
                    {trustScore}
                  </Box>
                </Tooltip>
              }
              color="primary"
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Avatar 
                className={styles.typeAvatar}
                sx={{ bgcolor: `${statusInfo.color}.main` }}
              >
                {typeInfo.icon}
              </Avatar>
            </Badge>
            
            <Box className={styles.headerInfo}>
              <Typography variant="subtitle1" className={styles.documentName} noWrap>
                {document.documentName || document.fileName || 'Untitled Document'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {typeInfo.label} • {document.fileSize ? formatFileSize(document.fileSize) : 'Unknown size'}
              </Typography>
            </Box>
          </Box>

          {showActions && (
            <Box className={styles.headerActions}>
              <Tooltip title={statusInfo.description}>
                <Chip
                  icon={statusInfo.icon}
                  label={statusInfo.label}
                  size="small"
                  color={statusInfo.color}
                  variant="outlined"
                  className={styles.statusChip}
                />
              </Tooltip>
              
              <IconButton
                size="small"
                onClick={handleMenuClick}
                className={styles.menuButton}
              >
                <MoreIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Document Preview */}
        {showPreview && (
          <Box className={styles.previewContainer}>
            {document.fileUrl && (document.mimeType?.startsWith('image/') || 
              /\.(jpg|jpeg|png|gif|bmp)$/i.test(document.fileName || '')) ? (
              <Box className={styles.imagePreview}>
                <img
                  src={document.fileUrl}
                  alt={document.documentName}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  className={styles.previewImage}
                />
                <SecurityWatermark 
                  status={document.status} 
                  opacity={0.15}
                  scale={0.8}
                  position="center"
                />
                {!imageLoaded && !imageError && (
                  <Box className={styles.imageLoading}>
                    <LinearProgress variant="indeterminate" />
                  </Box>
                )}
              </Box>
            ) : (
              <Box className={styles.filePreview}>
                <Box className={styles.fileIcon}>
                  {getFileIcon()}
                </Box>
                <SecurityWatermark 
                  status={document.status} 
                  opacity={0.1}
                  scale={0.6}
                  position="center"
                />
              </Box>
            )}
            
            {/* Overlay for interactions */}
            {interactive && (
              <Zoom in={isHovered}>
                <Box className={styles.previewOverlay}>
                  <IconButton
                    className={styles.overlayButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onView && onView(document);
                    }}
                  >
                    <ViewIcon />
                  </IconButton>
                </Box>
              </Zoom>
            )}
          </Box>
        )}

        {/* Content */}
        <CardContent className={compact ? styles.compactContent : styles.content}>
          {/* Expiration Notice */}
          {document.expiryDate && (
            <ExpirationNotice
              expiryDate={document.expiryDate}
              verificationStatus={document.status}
              variant="banner"
              compact={compact}
              className={styles.expirationNotice}
            />
          )}

          {/* Document Details */}
          {showDetails && !compact && (
            <Box className={styles.details}>
              <Box className={styles.detailRow}>
                <Typography variant="body2" color="text.secondary">
                  Uploaded:
                </Typography>
                <Typography variant="body2">
                  {formatDate(document.createdAt)}
                </Typography>
              </Box>
              
              {document.verificationDate && (
                <Box className={styles.detailRow}>
                  <Typography variant="body2" color="text.secondary">
                    Verified:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(document.verificationDate)}
                  </Typography>
                </Box>
              )}
              
              {document.expiryDate && (
                <Box className={styles.detailRow}>
                  <Typography variant="body2" color="text.secondary">
                    Expires:
                  </Typography>
                  <Typography 
                    variant="body2"
                    color={isExpiringSoon ? 'warning.main' : 'text.primary'}
                  >
                    {formatDate(document.expiryDate)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Trust Score Progress */}
          {!compact && (
            <Box className={styles.trustScore}>
              <Box className={styles.trustHeader}>
                <Typography variant="caption" color="text.secondary">
                  Trust Score
                </Typography>
                <Typography variant="caption" color="primary.main" fontWeight="bold">
                  {trustScore}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={trustScore}
                className={styles.trustProgress}
                color={trustScore >= 80 ? 'success' : trustScore >= 60 ? 'warning' : 'error'}
              />
            </Box>
          )}

          {/* Verification Notes */}
          {document.verificationNotes && !compact && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary" className={styles.notes}>
                {document.verificationNotes}
              </Typography>
            </>
          )}
        </CardContent>

        {/* Actions */}
        {showActions && !compact && (
          <CardActions className={styles.actions}>
            <Tooltip title="View document">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onView && onView(document);
                }}
              >
                <ViewIcon />
              </IconButton>
            </Tooltip>
            
            {document.fileUrl && (
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload && onDownload(document);
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {document.status !== 'VERIFIED' && (
              <Tooltip title="Refresh status">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh && onRefresh(document);
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
          </CardActions>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => handleAction('view', onView)}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} />
            View Document
          </MenuItem>
          
          {document.fileUrl && (
            <MenuItem onClick={() => handleAction('download', onDownload)}>
              <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
              Download
            </MenuItem>
          )}
          
          <MenuItem onClick={() => handleAction('share', onShare)}>
            <ShareIcon fontSize="small" sx={{ mr: 1 }} />
            Share
          </MenuItem>
          
          {document.status !== 'VERIFIED' && (
            <MenuItem onClick={() => handleAction('edit', onEdit)}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit Details
            </MenuItem>
          )}
          
          <Divider />
          
          <MenuItem 
            onClick={() => handleAction('delete', onDelete)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </Card>
    </Fade>
  );
};

DocumentCardModern.propTypes = {
  /** Document object with properties like documentName, status, fileUrl, etc. */
  document: PropTypes.shape({
    _id: PropTypes.string,
    documentName: PropTypes.string,
    fileName: PropTypes.string,
    documentType: PropTypes.string,
    status: PropTypes.string,
    fileUrl: PropTypes.string,
    mimeType: PropTypes.string,
    fileSize: PropTypes.number,
    createdAt: PropTypes.string,
    verificationDate: PropTypes.string,
    expiryDate: PropTypes.string,
    verificationNotes: PropTypes.string
  }).isRequired,
  /** Callback when user clicks to view document */
  onView: PropTypes.func,
  /** Callback when user clicks to download document */
  onDownload: PropTypes.func,
  /** Callback when user clicks to edit document */
  onEdit: PropTypes.func,
  /** Callback when user clicks to delete document */
  onDelete: PropTypes.func,
  /** Callback when user clicks to share document */
  onShare: PropTypes.func,
  /** Callback when user clicks to refresh document status */
  onRefresh: PropTypes.func,
  /** Whether to show action buttons and menu */
  showActions: PropTypes.bool,
  /** Whether to show detailed document information */
  showDetails: PropTypes.bool,
  /** Whether to show document preview */
  showPreview: PropTypes.bool,
  /** Whether to use compact layout */
  compact: PropTypes.bool,
  /** Card elevation (shadow depth) */
  elevation: PropTypes.number,
  /** Whether the card responds to hover and click interactions */
  interactive: PropTypes.bool,
  /** Additional CSS class name */
  className: PropTypes.string
};

export default DocumentCardModern;