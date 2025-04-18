import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

const MessagingCenter = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  
  const dispatch = useDispatch();
  
  // In a real implementation, you would get this from redux state
  const currentUser = useSelector(state => state.auth?.user || {});
  
  // Load conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // In a real implementation, you would dispatch an action to fetch conversations
        // Example: await dispatch(fetchConversations());
        console.log('Fetching conversations');
        
        // Simulate API call with mock data
        setTimeout(() => {
          const mockConversations = [
            {
              id: 'conv1',
              participants: [
                { id: 'user1', name: 'John Doe', role: 'jobSeeker' },
                { id: 'user2', name: 'Al Faisal Hospitality', role: 'sponsor' }
              ],
              lastMessage: {
                id: 'msg1',
                senderId: 'user2',
                content: 'Thank you for your application. We would like to schedule an interview.',
                timestamp: '2025-04-15T14:30:00Z',
                read: true
              },
              unreadCount: 0
            },
            {
              id: 'conv2',
              participants: [
                { id: 'user1', name: 'John Doe', role: 'jobSeeker' },
                { id: 'user3', name: 'Mohamed Recruitment Agency', role: 'agent' }
              ],
              lastMessage: {
                id: 'msg2',
                senderId: 'user3',
                content: 'I have a new job opportunity that matches your profile.',
                timestamp: '2025-04-16T09:15:00Z',
                read: false
              },
              unreadCount: 2
            },
            {
              id: 'conv3',
              participants: [
                { id: 'user1', name: 'John Doe', role: 'jobSeeker' },
                { id: 'user4', name: 'Sarah Wilson', role: 'admin' }
              ],
              lastMessage: {
                id: 'msg3',
                senderId: 'user4',
                content: 'Your verification process has been completed successfully.',
                timestamp: '2025-04-14T11:45:00Z',
                read: true
              },
              unreadCount: 0
            }
          ];
          
          setConversations(mockConversations);
          setIsLoading(false);
          
          // Select the first conversation by default
          if (mockConversations.length > 0) {
            handleSelectConversation(mockConversations[0]);
          }
        }, 1000);
      } catch (err) {
        setIsLoading(false);
        setError(err.message || 'Failed to load conversations. Please try again.');
      }
    };
    
    fetchConversations();
  }, [dispatch]);
  
  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setIsLoading(true);
    setError('');
    
    try {
      // In a real implementation, you would dispatch an action to fetch messages
      // Example: await dispatch(fetchMessages(conversation.id));
      console.log('Fetching messages for conversation:', conversation.id);
      
      // Simulate API call with mock data
      setTimeout(() => {
        const mockMessages = [
          {
            id: 'msg1',
            conversationId: conversation.id,
            senderId: conversation.participants.find(p => p.id !== 'user1')?.id,
            senderName: conversation.participants.find(p => p.id !== 'user1')?.name,
            content: 'Hello! I saw your profile and I think you would be a great fit for a position we have available.',
            timestamp: '2025-04-15T14:00:00Z',
            read: true
          },
          {
            id: 'msg2',
            conversationId: conversation.id,
            senderId: 'user1',
            senderName: 'John Doe',
            content: 'Hi! Thank you for reaching out. I am definitely interested in learning more about the position.',
            timestamp: '2025-04-15T14:10:00Z',
            read: true
          },
          {
            id: 'msg3',
            conversationId: conversation.id,
            senderId: conversation.participants.find(p => p.id !== 'user1')?.id,
            senderName: conversation.participants.find(p => p.id !== 'user1')?.name,
            content: 'Great! The position is for a Senior Housekeeper at a 5-star hotel in Dubai. The salary is $1,200 per month with free accommodation and meals provided.',
            timestamp: '2025-04-15T14:20:00Z',
            read: true
          },
          {
            id: 'msg4',
            conversationId: conversation.id,
            senderId: 'user1',
            senderName: 'John Doe',
            content: 'That sounds interesting. What qualifications are required for the position?',
            timestamp: '2025-04-15T14:25:00Z',
            read: true
          },
          {
            id: 'msg5',
            conversationId: conversation.id,
            senderId: conversation.participants.find(p => p.id !== 'user1')?.id,
            senderName: conversation.participants.find(p => p.id !== 'user1')?.name,
            content: 'We are looking for candidates with at least 2 years of experience in housekeeping, preferably in a hotel setting. Good communication skills in English are also required.',
            timestamp: '2025-04-15T14:30:00Z',
            read: true
          }
        ];
        
        setMessages(mockMessages);
        setIsLoading(false);
        
        // Mark conversation as read if it has unread messages
        if (conversation.unreadCount > 0) {
          // In a real implementation, you would dispatch an action to mark conversation as read
          // Example: dispatch(markConversationAsRead(conversation.id));
          
          setConversations(prevConversations => 
            prevConversations.map(conv => 
              conv.id === conversation.id 
                ? { ...conv, unreadCount: 0, lastMessage: { ...conv.lastMessage, read: true } }
                : conv
            )
          );
        }
      }, 800);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Failed to load messages. Please try again.');
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;
    
    setIsSending(true);
    
    try {
      // In a real implementation, you would dispatch an action to send a message
      // Example: await dispatch(sendMessage(selectedConversation.id, newMessage));
      console.log('Sending message to conversation:', selectedConversation.id, newMessage);
      
      // Simulate API call
      setTimeout(() => {
        const newMsg = {
          id: `msg${Date.now()}`,
          conversationId: selectedConversation.id,
          senderId: 'user1',
          senderName: 'John Doe',
          content: newMessage,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        setMessages(prevMessages => [...prevMessages, newMsg]);
        
        // Update the conversation with the new last message
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === selectedConversation.id 
              ? { 
                  ...conv, 
                  lastMessage: {
                    id: newMsg.id,
                    senderId: newMsg.senderId,
                    content: newMsg.content,
                    timestamp: newMsg.timestamp,
                    read: newMsg.read
                  }
                }
              : conv
          )
        );
        
        setNewMessage('');
        setIsSending(false);
      }, 500);
    } catch (err) {
      setIsSending(false);
      setError(err.message || 'Failed to send message. Please try again.');
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If the message is from today, don't show the date
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // If the message is from yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise, show the date
    return date.toLocaleDateString();
  };
  
  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p.id !== 'user1');
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="flex h-screen max-h-[800px]">
        {/* Conversation List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Messages</h2>
          </div>
          
          {isLoading && !selectedConversation ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error && !selectedConversation ? (
            <div className="p-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-700 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No conversations yet.</p>
              <Link
                to="/messaging/new"
                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Start a Conversation
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {conversations.map(conversation => {
                const otherParticipant = getOtherParticipant(conversation);
                return (
                  <li
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.id === conversation.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="px-4 py-4 flex items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {otherParticipant.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(conversation.lastMessage.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                            {conversation.lastMessage.content}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {otherParticipant.role === 'sponsor' ? 'Employer' : 
                           otherParticipant.role === 'agent' ? 'Recruitment Agent' : 
                           otherParticipant.role === 'admin' ? 'ThiQaX Admin' : 'Job Seeker'}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        {/* Message Area */}
        <div className="w-2/3 flex flex-col">
          {/* Selected Conversation Header */}
          {selectedConversation && (
            <div className="px-4 py-3 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {getOtherParticipant(selectedConversation).name}
                </h3>
                <p className="text-sm text-gray-500">
                  {getOtherParticipant(selectedConversation).role === 'sponsor' ? 'Employer' : 
                   getOtherParticipant(selectedConversation).role === 'agent' ? 'Recruitment Agent' : 
                   getOtherParticipant(selectedConversation).role === 'admin' ? 'ThiQaX Admin' : 'Job Seeker'}
                </p>
              </div>
              <div>
                <Link
                  to={`/profile/${getOtherParticipant(selectedConversation).id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  View Profile
                </Link>
              </div>
            </div>
          )}
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: '#f7f7f9' }}>
            {!selectedConversation ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Select a conversation to view messages</p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-full">
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-700">{error}</p>
                  <button
                    onClick={() => handleSelectConversation(selectedConversation)}
                    className="mt-2 text-sm text-red-700 underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isCurrentUser = message.senderId === 'user1';
                  const showDate = index === 0 || 
                    formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);
                  
                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isCurrentUser ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 text-right ${
                            isCurrentUser ? 'text-indigo-200' : 'text-gray-500'
                          }`}>
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Message Input */}
          {selectedConversation && (
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <span>Send</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingCenter;