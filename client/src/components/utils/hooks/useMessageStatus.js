// src/components/utils/hooks/useMessageStatus.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import config from '../../../config';

/**
 * Custom hook for tracking message delivery and read status
 * @param {string} conversationId - ID of the conversation
 * @param {string} messageId - ID of the message to track (optional)
 * @returns {Object} Message status utilities
 */
const useMessageStatus = (conversationId, messageId = null) => {
  const [messageStatuses, setMessageStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { token } = useSelector(state => state.auth);
  
  // Fetch message statuses for the conversation
  const fetchMessageStatuses = useCallback(async () => {
    if (!conversationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const url = messageId 
        ? `${config.apiBaseUrl}/api/v1/messages/${messageId}/status`
        : `${config.apiBaseUrl}/api/v1/conversations/${conversationId}/message-statuses`;
        
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Transform to object with messageId as keys
      const statusMap = {};
      response.data.data.forEach(status => {
        statusMap[status.messageId] = {
          delivered: status.delivered,
          deliveredAt: status.deliveredAt,
          read: status.read,
          readAt: status.readAt
        };
      });
      
      setMessageStatuses(statusMap);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch message statuses');
      setLoading(false);
    }
  }, [conversationId, messageId, token]);
  
  // Mark a message as read
  const markAsRead = useCallback(async (msgId = messageId) => {
    if (!msgId) return;
    
    try {
      await axios.put(
        `${config.apiBaseUrl}/api/v1/messages/${msgId}/mark-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setMessageStatuses(prev => ({
        ...prev,
        [msgId]: {
          ...(prev[msgId] || {}),
          read: true,
          readAt: new Date().toISOString()
        }
      }));
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to mark message as read');
      return false;
    }
  }, [messageId, token]);
  
  // Mark a message as delivered
  const markAsDelivered = useCallback(async (msgId = messageId) => {
    if (!msgId) return;
    
    try {
      await axios.put(
        `${config.apiBaseUrl}/api/v1/messages/${msgId}/mark-delivered`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setMessageStatuses(prev => ({
        ...prev,
        [msgId]: {
          ...(prev[msgId] || {}),
          delivered: true,
          deliveredAt: new Date().toISOString()
        }
      }));
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to mark message as delivered');
      return false;
    }
  }, [messageId, token]);
  
  // Get status for a specific message
  const getMessageStatus = useCallback((msgId = messageId) => {
    if (!msgId) return null;
    return messageStatuses[msgId] || { delivered: false, read: false };
  }, [messageId, messageStatuses]);
  
  // Listen for WebSocket updates for message statuses
  useEffect(() => {
    if (!conversationId) return;
    
    const socket = new WebSocket(`${config.wsBaseUrl}/message-status`);
    
    socket.onopen = () => {
      // Subscribe to status updates for this conversation
      socket.send(JSON.stringify({
        type: 'subscribe',
        conversationId
      }));
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message_status_update') {
        setMessageStatuses(prev => ({
          ...prev,
          [data.messageId]: {
            delivered: data.delivered,
            deliveredAt: data.deliveredAt,
            read: data.read,
            readAt: data.readAt
          }
        }));
      }
    };
    
    // Initial fetch
    fetchMessageStatuses();
    
    return () => {
      socket.close();
    };
  }, [conversationId, fetchMessageStatuses]);
  
  return {
    messageStatuses,
    getMessageStatus,
    markAsRead,
    markAsDelivered,
    refreshStatuses: fetchMessageStatuses,
    loading,
    error
  };
};

export default useMessageStatus;