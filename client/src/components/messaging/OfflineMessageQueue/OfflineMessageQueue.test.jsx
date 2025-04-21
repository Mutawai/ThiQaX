// client/src/components/messaging/OfflineMessageQueue/OfflineMessageQueue.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OfflineMessageQueue from './OfflineMessageQueue';

describe('OfflineMessageQueue Component', () => {
  // Mock messages
  const mockQueuedMessages = [
    {
      id: 'msg1',
      content: 'Hello, this is a test message',
      timestamp: '2025-04-18T10:30:00Z',
      status: 'pending'
    },
    {
      id: 'msg2',
      content: 'Another message with a really long text that should be truncated in the preview',
      timestamp: '2025-04-18T10:35:00Z',
      status: 'failed'
    },
    {
      id: 'msg3',
      content: 'Message with attachments',
      timestamp: '2025-04-18T10:40:00Z',
      status: 'sending',
      attachments: [{ name: 'image.jpg', size: 1024 }]
    }
  ];
  
  // Mock callback functions
  const mockOnRetryAll = jest.fn(() => Promise.resolve());
  const mockOnRetryMessage = jest.fn(() => Promise.resolve());
  const mockOnDeleteMessage = jest.fn();
  const mockOnClearQueue = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    mockOnRetryAll.mockClear();
    mockOnRetryMessage.mockClear();
    mockOnDeleteMessage.mockClear();
    mockOnClearQueue.mockClear();
  });
  
  test('renders correctly with offline status', () => {
    render(
      <OfflineMessageQueue 
        isOnline={false}
        queuedMessages={mockQueuedMessages}
        onRetryAll={mockOnRetryAll}
        onRetryMessage={mockOnRetryMessage}
        onDeleteMessage={mockOnDeleteMessage}
        onClearQueue={mockOnClearQueue}
      />
    );
    
    // Offline message should be displayed
    expect(screen.getByText(/You're offline/)).toBeInTheDocument();
    expect(screen.getByText(/3 messages will be sent when online/)).toBeInTheDocument();
  });
  
  test('renders correctly with online status', () => {
    render(
      <OfflineMessageQueue 
        isOnline={true}
        queuedMessages={mockQueuedMessages}
        onRetryAll={mockOnRetryAll}
        onRetryMessage={mockOnRetryMessage}
        onDeleteMessage={mockOnDeleteMessage}
        onClearQueue={mockOnClearQueue}
      />
    );
    
    // Online message should be displayed
    expect(screen.getByText(/3 messages waiting to be sent/)).toBeInTheDocument();
  });
  
  test('expands and collapses when clicked', () => {
    render(
      <OfflineMessageQueue 
        isOnline={true}
        queuedMessages={mockQueuedMessages}
        onRetryAll={mockOnRetryAll}
        onRetryMessage={mockOnRetryMessage}
        onDeleteMessage={mockOnDeleteMessage}
        onClearQueue={mockOnClearQueue}
      />
    );
    
    // Initially collapsed
    expect(screen.queryByText('Retry All')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(screen.getByText(/3 messages waiting to be sent/));
    
    // Now Retry All button should be visible
    expect(screen.getByText('Retry All')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(screen.getByLabelText('Show less'));
    
    // Now Retry All button should be hidden
    expect(screen.queryByText('Retry All')).not.toBeInTheDocument();
  });
  
  test('calls onRetryAll when Retry All button is clicked', async () => {
    render(
      <OfflineMessageQueue 
        isOnline={true}
        queuedMessages={mockQueuedMessages}
        onRetryAll={mockOnRetryAll}
        onRetryMessage={mockOnRetryMessage}
        onDeleteMessage={mockOnDeleteMessage}
        onClearQueue={mockOnClearQueue}
      />
    );
    
    // Expand the queue
    fireEvent.click(screen.getByText(/3 messages waiting to be sent/));
    
    // Click Retry All button
    fireEvent.click(screen.getByText('Retry All'));
    
    // Check if onRetryAll was called
    expect(mockOnRetryAll).toHaveBeenCalled();
    
    // Button should be disabled during retry
    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });
  });
  
  test('calls onRetryMessage when retry button is clicked', async () => {
    render(
      <OfflineMessageQueue 
        isOnline={true}
        queuedMessages={mockQueuedMessages}
        onRetryAll={mockOnRetryAll}
        onRetryMessage={mockOnRetryMessage}
        onDeleteMessage={mockOnDeleteMessage}
        onClearQueue={mockOnClearQueue}
      />
    );
    
    // Expand the queue
    fireEvent.click(screen.getByText(/3 messages waiting to be sent/));
    
    // Get all retry buttons (there should be 2 - for pending and failed messages)
    const retryButtons = screen.getAllByTitle('Retry sending');
    
    // Click the first retry button
    fireEvent.click(retryButtons[0]);
    
    // Check if onRetryMessage was called with the correct ID
    expect(mockOnRetryMessage).toHaveBeenCalledWith('msg1');
  });
  
  test('calls onDeleteMessage when delete button is clicked', () => {
    render(
      <OfflineMessageQueue 
        isOnline={true}
        queuedMessages={mockQueuedMessages}
        onRetryAll={mockOnRetryAll}
        onRetryMessage={mockOnRetryMessage}
        onDeleteMessage={mockOnDeleteMessage}
        onClearQueue={mockOnClearQueue}
      />
    );
    
    // Expand the queue
    fireEvent.click(screen.getByText(/3 messages waiting to be sent/));
    
    // Get all delete buttons
    const deleteButtons = screen.getAllByTitle('Delete message');
    
    // Click the first delete button
    fireEvent.click(deleteButtons[0]);
    
    // Check if onDeleteMessage was called with the correct ID
    expect(mockOnDeleteMessage).toHaveBeenCalledWith('msg1');
  });
  
  test('calls onClearQueue when Clear Queue button is clicked', () => {
    render(
      <OfflineMessageQueue 
        isOnline={true}
        queuedMessages={mockQueuedMessages}
        onRetryAll={mockOnRetryAll}
        onRetryMessage={mockOnRetryMessage}
        onDeleteMessage={mockOnDeleteMessage}
        onClearQueue={mockOnClearQueue}
      />
    );
    
    // Expand the queue
    fireEvent.click(screen.getByText(/3 messages waiting to be sent/));
    
    // Click Clear Queue button
    fireEvent.click(screen.getByText('Clear Queue'));
    
    // Check if onClearQueue was called
    expect(mockOnClearQueue).toHaveBeenCalled();
  });
  
  test('formats message previews correctly', () => {
    render(
      <OfflineMessageQueue 
        isOnline={true}
        queuedMessages={mockQueuedMessages}
        onRetryAll={mockOnRetryAll}
        onRetryMessage={mockOnRetryMessage}
        onDeleteMessage={mockOnDeleteMessage}
        onClearQueue={mockOnClearQueue}
      />
    );
    
    // Expand the queue
    fireEvent.click(screen.getByText(/3 messages waiting to be sent/));
    
    // Short message should be displayed in full
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    
    // Long message should be truncated
    expect(screen.getByText(/Another message with a really long/)).toBeInTheDocument();
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
    
    // Message with attachment should show attachment info
    expect(screen.getByText(/Message with attachments \(1 attachment\)/)).toBeInTheDocument();
  });
  
  test('renders nothing when queuedMessages is empty', () => {
    const { container } = render(
      <OfflineMessageQueue 
        isOnline={true}
        queuedMessages={[]}
        onRetryAll={mockOnRetryAll}
        onRetryMessage={mockOnRetryMessage}
        onDeleteMessage={mockOnDeleteMessage}
        onClearQueue={mockOnClearQueue}
      />
    );
    
    // Component should render nothing
    expect(container).toBeEmptyDOMElement();
  });
});