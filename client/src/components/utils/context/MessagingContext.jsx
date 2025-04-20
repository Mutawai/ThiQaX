// src/components/utils/context/MessagingContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import io from 'socket.io-client';
import config from '../../../config';
import useMessageStatus from '../hooks/useMessageStatus';

// Create the context
const MessagingContext = createContext();

/**
 * Messaging Provider Component
 * Provides messaging functionality throughout the application
 */
export const MessagingProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  
  const { user, token } = useSelector(state => state.auth);
  
  // Use the message status hook for the active conversation
  const messageStatus = useMessageStatus(
    activeConversation?.id,
    null
  );
  
  // Initialize socket connection
  useEffect(() => {
    if (!token) return;
    
    // Connect to WebSocket server
    const newSocket = io(config.wsBaseUrl, {
      auth: {
        token
      },
      transports: ['websocket'],
      reconnection: true
    });
    
    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('WebSocket connected for messaging');
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log(`WebSocket disconnected: ${reason}`);
    });
    
    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      setError(`WebSocket connection error: ${error.message}`);
    });
    
    // Handle incoming messages
    newSocket.on('message', (data) => {
      // If message belongs to active conversation, add it to messages
      if (data.conversationId === activeConversation?.id) {
        setMessages(prev => [...prev, data]);
        
        // Mark as delivered
        markMessageAsDelivered(data.id);
      }
      
      // Update conversation list with new message
      updateConversationWithMessage(data);
      
      // Update unread count if message is not from current user
      if (data.senderId !== user?.id) {
        setUnreadCount(prev => prev + 1);
      }
    });
    
    // Handle typing indicators
    newSocket.on('typing', (data) => {
      // Update conversation with typing status
      setConversations(prev => 
        prev.map(conv => 
          conv.id === data.conversationId 
            ? { 
                ...conv, 
                typingUsers: data.isTyping 
                  ? [...(conv.typingUsers || []), data.userId]
                  : (conv.typingUsers || []).filter(id => id !== data.userId) 
              }
            : conv
        )
      );
    });
    
    // Handle read receipts
    newSocket.on('message_read', (data) => {
      // Update message status
      messageStatus.refreshStatuses();
    });
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [token, activeConversation?.id, user?.id, messageStatus]);
  
  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${config.apiBaseUrl}/api/v1/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setConversations(response.data.data);
      
      // Get unread count
      const unreadResponse = await axios.get(
        `${config.apiBaseUrl}/api/v1/messages/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setUnreadCount(unreadResponse.data.data.count);
      setIsLoading(false);
    } catch (err) {
      setError(`Error loading conversations: ${err.message}`);
      setIsLoading(false);
    }
  }, [token]);
  
  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!token || !conversationId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${config.apiBaseUrl}/api/v1/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setMessages(response.data.data);
      
      // Mark conversation as read
      await axios.put(
        `${config.apiBaseUrl}/api/v1/conversations/${conversationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update conversation list to reflect read status
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
      
      // Update global unread count
      loadUnreadCount();
      
      setIsLoading(false);
    } catch (err) {
      setError(`Error loading messages: ${err.message}`);
      setIsLoading(false);
    }
  }, [token, loadUnreadCount]);
  
  // Set active conversation and load its messages
  const setConversationActive = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    
    if (conversation) {
      // Join conversation room in socket
      if (socket) {
        socket.emit('join_conversation', conversation.id);
      }
      
      await loadMessages(conversation.id);
    }
  }, [socket, loadMessages]);
  
  // Send a message
  const sendMessage = useCallback(async (conversationId, content, attachments = []) => {
    if (!token || !conversationId || !content) return null;
    
    try {
      setSendingMessage(true);
      setError(null);
      
      // Prepare message data
      const messageData = {
        content,
        attachments: attachments.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          data: file // For actual implementation, use FormData for file upload
        }))
      };
      
      // Send message to API
      const response = await axios.post(
        `${config.apiBaseUrl}/api/v1/conversations/${conversationId}/messages`,
        messageData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const newMessage = response.data.data;
      
      // Add message to local state
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation with new message
      updateConversationWithMessage(newMessage);
      
      setSendingMessage(false);
      return newMessage;
    } catch (err) {
      setError(`Error sending message: ${err.message}`);
      setSendingMessage(false);
      return null;
    }
  }, [token]);
  
  // Create a new conversation
  const createConversation = useCallback(async (participants, initialMessage = null) => {
    if (!token || !participants || participants.length === 0) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create conversation
      const response = await axios.post(
        `${config.apiBaseUrl}/api/v1/conversations`,
        { participants },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const newConversation = response.data.data;
      
      // Add to conversations list
      setConversations(prev => [newConversation, ...prev]);
      
      // Send initial message if provided
      if (initialMessage) {
        await sendMessage(newConversation.id, initialMessage);
      }
      
      setIsLoading(false);
      return newConversation;
    } catch (err) {
      setError(`Error creating conversation: ${err.message}`);
      setIsLoading(false);
      return null;
    }
  }, [token, sendMessage]);
  
  // Delete a message
  const deleteMessage = useCallback(async (messageId) => {
    if (!token || !messageId) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Delete message via API
      await axios.delete(
        `${config.apiBaseUrl}/api/v1/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update messages list
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // If the message was the last in conversation, update conversation
      if (activeConversation) {
        const conversationMessages = messages.filter(msg => msg.conversationId === activeConversation.id);
        if (conversationMessages.length > 0 && conversationMessages[conversationMessages.length - 1].id === messageId) {
          // Get previous message
          const previousMessage = conversationMessages[conversationMessages.length - 2];
          
          // Update conversation
          if (previousMessage) {
            setConversations(prev => 
              prev.map(conv => 
                conv.id === activeConversation.id
                  ? { 
                      ...conv, 
                      lastMessage: {
                        id: previousMessage.id,
                        content: previousMessage.content,
                        senderId: previousMessage.senderId,
                        timestamp: previousMessage.createdAt
                      }
                    }
                  : conv
              )
            );
          }
        }
      }
      
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(`Error deleting message: ${err.message}`);
      setIsLoading(false);
      return false;
    }
  }, [token, activeConversation, messages]);
  
  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(
        `${config.apiBaseUrl}/api/v1/messages/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setUnreadCount(response.data.data.count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, [token]);
  
  // Mark a message as delivered
  const markMessageAsDelivered = useCallback(async (messageId) => {
    if (!token || !messageId) return;
    
    try {
      await axios.put(
        `${config.apiBaseUrl}/api/v1/messages/${messageId}/delivered`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // No need to update state, as the WebSocket will handle this
    } catch (err) {
      console.error('Error marking message as delivered:', err);
    }
  }, [token]);
  
  // Update a conversation with a new message
  const updateConversationWithMessage = useCallback((message) => {
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === message.conversationId) {
          // Calculate unread count increment
          const unreadIncrement = 
            activeConversation?.id !== conv.id && message.senderId !== user?.id 
              ? 1 
              : 0;
          
          return {
            ...conv,
            lastMessage: {
              id: message.id,
              content: message.content,
              senderId: message.senderId,
              timestamp: message.createdAt,
              read: activeConversation?.id === conv.id
            },
            unreadCount: conv.unreadCount + unreadIncrement
          };
        }
        return conv;
      })
    );
  }, [activeConversation?.id, user?.id]);
  
  // Send typing indicator
  const sendTypingStatus = useCallback((conversationId, isTyping) => {
    if (!socket || !conversationId) return;
    
    socket.emit('typing', {
      conversationId,
      isTyping
    });
  }, [socket]);
  
  // Load initial data
  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token, loadConversations]);
  
  // Get other participants for a conversation
  const getOtherParticipants = useCallback((conversation) => {
    if (!user || !conversation) return [];
    
    return conversation.participants.filter(p => p.id !== user.id);
  }, [user]);
  
  // Format conversation title based on participants
  const getConversationTitle = useCallback((conversation) => {
    if (!conversation) return '';
    
    const others = getOtherParticipants(conversation);
    
    if (others.length === 0) return 'No participants';
    if (others.length === 1) return others[0].name;
    
    // For group conversations
    return `${others[0].name} and ${others.length - 1} others`;
  }, [getOtherParticipants]);
  
  // Context value
  const contextValue = {
    conversations,
    activeConversation,
    messages,
    unreadCount,
    isLoading,
    sendingMessage,
    error,
    loadConversations,
    loadMessages,
    setConversationActive,
    sendMessage,
    createConversation,
    deleteMessage,
    markMessageAsDelivered,
    sendTypingStatus,
    getOtherParticipants,
    getConversationTitle,
    messageStatus
  };
  
  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
    </MessagingContext.Provider>
  );
};

// Custom hook for using the messaging context
export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

export default MessagingContext;