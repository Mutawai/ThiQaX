// src/components/messaging/AgentMessageCenter.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  IconButton,
  Divider,
  Badge,
  CircularProgress,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Videocam as VideocamIcon,
  Phone as PhoneIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PersonAdd as PersonAddIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteConversation,
  archiveConversation
} from '../../store/actions/messageActions';
import { formatDistanceToNow, format } from 'date-fns';
import { useResponsive } from '../../utils/responsive';
import { HelpPanel } from '../documentation/HelpPanel';
import useAuth from '../auth/useAuth';
import ConversationItem from './ConversationItem';
import MessageBubble from './MessageBubble';
import AlertDialog from '../common/AlertDialog';

/**
 * AgentMessageCenter Component
 * Messaging interface for recruitment agents to communicate with job seekers and sponsors
 */
const AgentMessageCenter = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  
  // Local state
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [messageInput, setMessageInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filter, setFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Redux state
  const {
    conversations,
    currentMessages,
    loading,
    sendingMessage,
    error
  } = useSelector(state => state.messages);
  
  // Fetch conversations on component mount
  useEffect(() => {
    dispatch(getConversations({ filter }));
  }, [dispatch, filter]);
  
  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      dispatch(getMessages(selectedConversation._id));
      dispatch(markAsRead(selectedConversation._id));
      
      if (isMobile) {
        setShowMobileChat(true);
      }
    }
  }, [dispatch, selectedConversation, isMobile]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setFilter(newValue === 0 ? 'all' : newValue === 1 ? 'jobseekers' : 'sponsors');
  };
  
  // Handle message send
  const handleSendMessage = () => {
    if (!messageInput.trim() && attachments.length === 0) return;
    
    const formData = new FormData();
    formData.append('content', messageInput);
    formData.append('recipientId', selectedConversation.participant._id);
    
    // Add attachments
    attachments.forEach(file => {
      formData.append('attachments', file);
    });
    
    dispatch(sendMessage(formData, selectedConversation._id));
    setMessageInput('');
    setAttachments([]);
  };
  
  // Handle key press (Enter to send)
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle file selection
  const handleFileSelect = (event) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };
  
  // Handle attachment remove
  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  // Handle conversation menu
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle filter menu
  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Handle delete conversation
  const handleDeleteConversation = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (selectedConversation) {
      dispatch(deleteConversation(selectedConversation._id));
      setSelectedConversation(null);
      setDeleteDialogOpen(false);
      if (isMobile) {
        setShowMobileChat(false);
      }
    }
  };
  
  // Handle archive conversation
  const handleArchiveConversation = () => {
    if (selectedConversation) {
      dispatch(archiveConversation(selectedConversation._id));
      handleMenuClose();
    }
  };
  
  // Filter conversations by search term
  const filteredConversations = conversations?.filter(convo => {
    if (!searchTerm) return true;
    
    const participantName = `${convo.participant.firstName} ${convo.participant.lastName}`.toLowerCase();
    return participantName.includes(searchTerm.toLowerCase());
  });
  
  // Format time for messages
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return format(date, 'h:mm a');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };
  
  // Render conversation list
  const renderConversationList = () => {
    if (loading && !conversations?.length) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!conversations?.length) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No conversations found
          </Typography>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            sx={{ mt: 2 }}
          >
            Start New Conversation
          </Button>
        </Box>
      );
    }
    
    return (
      <List sx={{ width: '100%', p: 0 }}>
        {filteredConversations.map(conversation => (
          <ConversationItem
            key={conversation._id}
            conversation={conversation}
            isSelected={selectedConversation?._id === conversation._id}
            onClick={() => setSelectedConversation(conversation)}
          />
        ))}
      </List>
    );
  };
  
  // Render message area
  const renderMessageArea = () => {
    if (!selectedConversation) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            p: 3
          }}
        >
          <SendIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Select a conversation
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Choose a conversation from the list to start messaging
          </Typography>
        </Box>
      );
    }
    
    if (loading && !currentMessages?.length) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    return (
      <>
        {/* Message header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && showMobileChat && (
              <IconButton edge="start" onClick={() => setShowMobileChat(false)} sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
            )}
            
            <Avatar
              src={selectedConversation.participant.profileImage}
              alt={`${selectedConversation.participant.firstName} ${selectedConversation.participant.lastName}`}
              sx={{ mr: 2 }}
            />
            <Box>
              <Typography variant="subtitle1">
                {selectedConversation.participant.firstName} {selectedConversation.participant.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedConversation.participant.role === 'jobSeeker' ? 'Job Seeker' : 'Sponsor'}
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <IconButton>
              <PhoneIcon />
            </IconButton>
            <IconButton>
              <VideocamIcon />
            </IconButton>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Message list */}
        <Box
          sx={{
            height: 'calc(100% - 130px)',
            overflow: 'auto',
            px: 2,
            py: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {currentMessages && currentMessages.length > 0 ? (
            currentMessages.map((message, index) => (
              <MessageBubble
                key={message._id}
                message={message}
                isSelf={message.sender === user?._id}
                showTime={
                  index === 0 ||
                  message.sender !== currentMessages[index - 1].sender ||
                  new Date(message.createdAt).getTime() - new Date(currentMessages[index - 1].createdAt).getTime() > 5 * 60 * 1000
                }
                formatTime={formatMessageTime}
              />
            ))
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>
        
        {/* Message input */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                mb: 2
              }}
            >
              {attachments.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'relative',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {file.type.includes('image') ? (
                    <ImageIcon fontSize="small" sx={{ mr: 1 }} />
                  ) : (
                    <FileIcon fontSize="small" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                    {file.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveAttachment(index)}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      p: 0.5
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <IconButton onClick={() => fileInputRef.current?.click()}>
              <AttachFileIcon />
            </IconButton>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              multiple
            />
            
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              sx={{ mx: 1 }}
              InputProps={{
                sx: { borderRadius: 3, py: 1 }
              }}
            />
            
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={sendingMessage || (!messageInput.trim() && attachments.length === 0)}
              sx={{ borderRadius: 3, px: 3, py: 1.5 }}
            >
              {sendingMessage ? <CircularProgress size={24} /> : 'Send'}
            </Button>
          </Box>
        </Box>
      </>
    );
  };
  
  return (
    <Box>
      <HelpPanel workflow="agent-messaging" />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper
        elevation={2}
        sx={{
          display: 'flex',
          height: 'calc(100vh - 200px)',
          minHeight: 500,
          overflow: 'hidden'
        }}
      >
        {/* Conversation list */}
        {(!isMobile || !showMobileChat) && (
          <Box
            sx={{
              width: isMobile ? '100%' : 320,
              borderRight: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'hidden'
            }}
          >
            {/* Search and filter */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <TextField
                fullWidth
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Tab label="All" />
              <Tab label="Job Seekers" />
              <Tab label="Sponsors" />
            </Tabs>
            
            {/* Conversations */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto'
              }}
            >
              {renderConversationList()}
            </Box>
          </Box>
        )}
        
        {/* Message area */}
        {(!isMobile || showMobileChat) && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {renderMessageArea()}
          </Box>
        )}
      </Paper>
      
      {/* Conversation menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleArchiveConversation}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive Conversation</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteConversation}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete Conversation</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Conversation"
        content="Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently lost."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default AgentMessageCenter;