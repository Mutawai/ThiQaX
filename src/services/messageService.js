import axios from 'axios';

// Create an axios instance with base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Message service methods
const messageService = {
  // Get all conversations for current user
  getConversations: async () => {
    try {
      const response = await api.get('/messages/conversations');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch conversations' };
    }
  },

  // Get messages for a specific conversation
  getMessages: async (conversationId, page = 1, limit = 20) => {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch messages' };
    }
  },

  // Start a new conversation
  startConversation: async (recipientId, initialMessage) => {
    try {
      const response = await api.post('/messages/conversations', {
        recipientId,
        message: initialMessage
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to start conversation' };
    }
  },

  // Send a message in an existing conversation
  sendMessage: async (conversationId, content, attachments = []) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      // Handle file attachments if any
      attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await api.post(`/messages/conversations/${conversationId}`, formData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send message' };
    }
  },

  // Mark conversation as read
  markConversationAsRead: async (conversationId) => {
    try {
      const response = await api.put(`/messages/conversations/${conversationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark conversation as read' };
    }
  },

  // Get unread message count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/messages/unread');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch unread count' };
    }
  },

  // Archive a conversation
  archiveConversation: async (conversationId) => {
    try {
      const response = await api.put(`/messages/conversations/${conversationId}/archive`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to archive conversation' };
    }
  },

  // Get message attachment
  getAttachment: async (attachmentId) => {
    try {
      const response = await api.get(`/messages/attachments/${attachmentId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to download attachment' };
    }
  }
};

export default messageService;
