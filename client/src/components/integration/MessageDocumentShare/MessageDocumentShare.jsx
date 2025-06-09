// client/src/components/integration/MessageDocumentShare/MessageDocumentShare.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Checkbox,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  InputAdornment,
  Paper
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Share as ShareIcon,
  Search as SearchIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Send as SendIcon,
  CheckCircle as VerifiedIcon,
  Warning as UnverifiedIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import styles from './MessageDocumentShare.module.css';

/**
 * MessageDocumentShare Component
 * 
 * Enables sharing of verified documents within message conversations
 * Integrates with the messaging system and document management
 * 
 * @param {Object} props - Component props
 * @param {string} props.conversationId - ID of the current conversation
 * @param {string} props.recipientId - ID of the message recipient
 * @param {Function} props.onDocumentShare - Callback when documents are shared
 * @param {boolean} props.disabled - Whether the component is disabled
 */
const MessageDocumentShare = ({
  conversationId,
  recipientId,
  onDocumentShare,
  disabled = false
}) => {
  const dispatch = useDispatch();
  
  // Local state
  const [open, setOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  
  // Redux state
  const { user } = useSelector(state => state.auth);
  const { documents, loading } = useSelector(state => state.documents);
  const { currentConversation } = useSelector(state => state.messages);
  
  // Fetch user documents when dialog opens
  useEffect(() => {
    if (open && user) {
      // Dispatch action to fetch user's verified documents
      // dispatch(fetchUserDocuments({ status: 'VERIFIED' }));
    }
  }, [open, user, dispatch]);
  
  // Filter documents based on search term
  const filteredDocuments = documents?.filter(doc => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      doc.description.toLowerCase().includes(searchLower) ||
      doc.documentType.toLowerCase().includes(searchLower) ||
      doc.originalname.toLowerCase().includes(searchLower)
    );
  });
  
  // Get verified documents only
  const verifiedDocuments = filteredDocuments?.filter(doc => doc.status === 'VERIFIED') || [];
  
  // Handle dialog open/close
  const handleOpen = () => {
    setOpen(true);
    setSelectedDocuments([]);
    setSearchTerm('');
    setShareMessage('');
    setError('');
  };
  
  const handleClose = () => {
    setOpen(false);
    setSelectedDocuments([]);
    setError('');
  };
  
  // Handle document selection
  const handleDocumentToggle = (document) => {
    const isSelected = selectedDocuments.some(doc => doc._id === document._id);
    
    if (isSelected) {
      setSelectedDocuments(selectedDocuments.filter(doc => doc._id !== document._id));
    } else {
      setSelectedDocuments([...selectedDocuments, document]);
    }
  };
  
  // Handle share documents
  const handleShare = async () => {
    if (selectedDocuments.length === 0) {
      setError('Please select at least one document to share');
      return;
    }
    
    setSharing(true);
    setError('');
    
    try {
      const shareData = {
        conversationId,
        recipientId,
        documents: selectedDocuments.map(doc => ({
          documentId: doc._id,
          documentType: doc.documentType,
          description: doc.description,
          filename: doc.originalname,
          url: doc.url
        })),
        message: shareMessage || `Shared ${selectedDocuments.length} document${selectedDocuments.length > 1 ? 's' : ''}`
      };
      
      // Call the parent callback
      if (onDocumentShare) {
        await onDocumentShare(shareData);
      }
      
      // Close dialog and reset state
      handleClose();
      
    } catch (err) {
      setError(err.message || 'Failed to share documents. Please try again.');
    } finally {
      setSharing(false);
    }
  };
  
  // Get document icon based on type
  const getDocumentIcon = (document) => {
    const extension = document.originalname.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <ImageIcon className={styles.documentIcon} />;
    } else if (extension === 'pdf') {
      return <PdfIcon className={styles.documentIcon} style={{ color: '#F40F02' }} />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <DocIcon className={styles.documentIcon} style={{ color: '#295498' }} />;
    } else {
      return <FileIcon className={styles.documentIcon} />;
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format document type for display
  const formatDocumentType = (type) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };
  
  return (
    <>
      <Tooltip title="Share Documents">
        <IconButton
          onClick={handleOpen}
          disabled={disabled}
          className={styles.shareButton}
          aria-label="Share documents"
        >
          <AttachFileIcon />
        </IconButton>
      </Tooltip>
      
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        className={styles.dialog}
      >
        <DialogTitle className={styles.dialogTitle}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <ShareIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Share Documents</Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent className={styles.dialogContent}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          
          {/* Document List */}
          <Paper variant="outlined" className={styles.documentList}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : verifiedDocuments.length === 0 ? (
              <Box textAlign="center" p={4}>
                <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  {searchTerm ? 'No documents found matching your search' : 'No verified documents available'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Only verified documents can be shared in messages
                </Typography>
              </Box>
            ) : (
              <List>
                {verifiedDocuments.map((document, index) => {
                  const isSelected = selectedDocuments.some(doc => doc._id === document._id);
                  
                  return (
                    <React.Fragment key={document._id}>
                      <ListItem 
                        dense 
                        button 
                        onClick={() => handleDocumentToggle(document)}
                        className={`${styles.documentItem} ${isSelected ? styles.selected : ''}`}
                      >
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={isSelected}
                            tabIndex={-1}
                            disableRipple
                          />
                        </ListItemIcon>
                        
                        <ListItemIcon>
                          {getDocumentIcon(document)}
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center">
                              <Typography variant="subtitle2" noWrap>
                                {document.description || document.originalname}
                              </Typography>
                              <VerifiedIcon 
                                sx={{ ml: 1, fontSize: 16, color: 'success.main' }} 
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {formatDocumentType(document.documentType)} • {formatFileSize(document.size)}
                              </Typography>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                Verified {formatDistanceToNow(new Date(document.verifiedAt), { addSuffix: true })}
                              </Typography>
                            </Box>
                          }
                        />
                        
                        <ListItemSecondaryAction>
                          <Tooltip title="Preview document">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(document.url, '_blank');
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      {index < verifiedDocuments.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Paper>
          
          {/* Selected Documents Summary */}
          {selectedDocuments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Documents ({selectedDocuments.length})
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedDocuments.map((doc) => (
                  <Chip
                    key={doc._id}
                    label={doc.description || doc.originalname}
                    size="small"
                    onDelete={() => handleDocumentToggle(doc)}
                    className={styles.selectedChip}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {/* Share Message */}
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Add a message (optional)..."
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
            inputProps={{ maxLength: 500 }}
            helperText={`${shareMessage.length}/500 characters`}
          />
        </DialogContent>
        
        <DialogActions className={styles.dialogActions}>
          <Button onClick={handleClose} disabled={sharing}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            variant="contained"
            disabled={selectedDocuments.length === 0 || sharing}
            startIcon={sharing ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {sharing ? 'Sharing...' : `Share ${selectedDocuments.length} Document${selectedDocuments.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

MessageDocumentShare.propTypes = {
  conversationId: PropTypes.string.isRequired,
  recipientId: PropTypes.string.isRequired,
  onDocumentShare: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default MessageDocumentShare;