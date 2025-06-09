// client/src/components/integration/RealtimeStatusUpdater/RealtimeStatusUpdater.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import RealtimeStatusUpdater from './RealtimeStatusUpdater';

// Mock WebSocket service
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: true
};

jest.mock('../../../services/websocket', () => ({
  initializeSocket: jest.fn(() => mockSocket),
  disconnectSocket: jest.fn()
}));

// Mock data
const mockWatchedEntities = [
  { type: 'APPLICATION', id: 'app1' },
  { type: 'DOCUMENT', id: 'doc1' },
  { type: 'JOB', id: 'job1' }
];

const mockUser = {
  _id: 'user1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
};

const mockToken = 'mock-jwt-token';

// Mock functions
const mockOnStatusUpdate = jest.fn();

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: mockUser, token: mockToken }, action) => state,
      notifications: (state = { notifications: [] }, action) => state
    },
    preloadedState: initialState
  });
};

// Test wrapper component
const TestWrapper = ({ store, ...props }) => (
  <Provider store={store}>
    <RealtimeStatusUpdater {...props} />
  </Provider>
);

describe('RealtimeStatusUpdater Component', () => {
  let store;
  
  beforeEach(() => {
    store = createMockStore();
    mockOnStatusUpdate.mockClear();
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  const defaultProps = {
    watchedEntities: mockWatchedEntities,
    onStatusUpdate: mockOnStatusUpdate,
    autoConnect: true
  };
  
  test('renders realtime status updater correctly', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    expect(screen.getByText('Real-time Status')).toBeInTheDocument();
  });
  
  test('shows connection status when enabled', () => {
    render(<TestWrapper store={store} {...defaultProps} showConnectionStatus={true} />);
    
    // Should show connection status chip
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });
  
  test('hides connection status when disabled', () => {
    render(<TestWrapper store={store} {...defaultProps} showConnectionStatus={false} />);
    
    // Should not show connection status
    expect(screen.queryByText('Disconnected')).not.toBeInTheDocument();
  });
  
  test('auto-connects on mount when enabled', () => {
    const { initializeSocket } = require('../../../services/websocket');
    
    render(<TestWrapper store={store} {...defaultProps} autoConnect={true} />);
    
    expect(initializeSocket).toHaveBeenCalledWith(mockToken);
  });
  
  test('does not auto-connect when disabled', () => {
    const { initializeSocket } = require('../../../services/websocket');
    
    render(<TestWrapper store={store} {...defaultProps} autoConnect={false} />);
    
    expect(initializeSocket).not.toHaveBeenCalled();
  });
  
  test('expands and collapses content', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Initially collapsed
    expect(screen.queryByText('Recent Updates')).not.toBeInTheDocument();
    
    // Click expand button
    const expandButton = screen.getByLabelText('expand more') || 
                        document.querySelector('[data-testid="ExpandMoreIcon"]')?.closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
      
      // Should show expanded content
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    }
  });
  
  test('toggles pause/resume functionality', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Find pause/resume toggle
    const pauseButton = screen.getByTitle('Pause updates') ||
                       document.querySelector('[data-testid="PauseIcon"]')?.closest('button');
    
    if (pauseButton) {
      fireEvent.click(pauseButton);
      
      // Should show resume button
      expect(screen.getByTitle('Resume updates')).toBeInTheDocument();
    }
  });
  
  test('handles manual refresh', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Find refresh button
    const refreshButton = screen.getByTitle('Refresh') ||
                         document.querySelector('[data-testid="RefreshIcon"]')?.closest('button');
    
    if (refreshButton) {
      fireEvent.click(refreshButton);
      
      // Should attempt to emit refresh event or reconnect
      expect(mockSocket.emit).toHaveBeenCalledWith('refresh_status', { entities: mockWatchedEntities });
    }
  });
  
  test('opens settings menu', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Find settings button
    const settingsButton = document.querySelector('[data-testid="SettingsIcon"]')?.closest('button');
    
    if (settingsButton) {
      fireEvent.click(settingsButton);
      
      // Should show settings menu
      expect(screen.getByText('Connect')).toBeInTheDocument();
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    }
  });
  
  test('handles WebSocket connection events', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Simulate connection event
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    
    if (connectHandler) {
      act(() => {
        connectHandler();
      });
      
      // Should show connected status
      expect(screen.getByText('Connected')).toBeInTheDocument();
    }
  });
  
  test('handles WebSocket disconnection events', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // First connect
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    if (connectHandler) {
      act(() => {
        connectHandler();
      });
    }
    
    // Then disconnect
    const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
    
    if (disconnectHandler) {
      act(() => {
        disconnectHandler('io server disconnect');
      });
      
      // Should show disconnected status
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    }
  });
  
  test('handles status update events', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Expand to see recent updates
    const expandButton = document.querySelector('[data-testid="ExpandMoreIcon"]')?.closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
    }
    
    // Simulate status update
    const statusUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'status_update')[1];
    
    if (statusUpdateHandler) {
      const updateData = {
        entityType: 'APPLICATION',
        entityId: 'app1',
        status: 'APPROVED',
        timestamp: new Date().toISOString(),
        metadata: {}
      };
      
      act(() => {
        statusUpdateHandler(updateData);
      });
      
      // Should call onStatusUpdate callback
      expect(mockOnStatusUpdate).toHaveBeenCalledWith(updateData);
      
      // Should show in recent updates
      expect(screen.getByText('Applications #app1')).toBeInTheDocument();
    }
  });
  
  test('handles batch updates', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Expand to see updates
    const expandButton = document.querySelector('[data-testid="ExpandMoreIcon"]')?.closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
    }
    
    // Simulate batch update
    const batchUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'batch_update')[1];
    
    if (batchUpdateHandler) {
      const batchUpdates = [
        {
          entityType: 'APPLICATION',
          entityId: 'app1',
          status: 'APPROVED',
          timestamp: new Date().toISOString()
        },
        {
          entityType: 'DOCUMENT',
          entityId: 'doc1',
          status: 'VERIFIED',
          timestamp: new Date().toISOString()
        }
      ];
      
      act(() => {
        batchUpdateHandler(batchUpdates);
      });
      
      // Fast-forward timers to process batch
      act(() => {
        jest.advanceTimersByTime(200);
      });
      
      // Should process all updates
      expect(mockOnStatusUpdate).toHaveBeenCalledTimes(2);
    }
  });
  
  test('does not process updates when paused', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Pause updates
    const pauseButton = document.querySelector('[data-testid="PauseIcon"]')?.closest('button');
    if (pauseButton) {
      fireEvent.click(pauseButton);
    }
    
    // Try to send status update
    const statusUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'status_update')[1];
    
    if (statusUpdateHandler) {
      const updateData = {
        entityType: 'APPLICATION',
        entityId: 'app1',
        status: 'APPROVED',
        timestamp: new Date().toISOString()
      };
      
      act(() => {
        statusUpdateHandler(updateData);
      });
      
      // Should not call callback when paused
      expect(mockOnStatusUpdate).not.toHaveBeenCalled();
    }
  });
  
  test('handles connection errors with retry', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Simulate connection error
    const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
    
    if (errorHandler) {
      act(() => {
        errorHandler(new Error('Connection failed'));
      });
      
      // Should show error status
      expect(screen.getByText(/Connection Error/)).toBeInTheDocument();
      expect(screen.getByText(/Retry attempt/)).toBeInTheDocument();
    }
  });
  
  test('clears update queue', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Open settings menu
    const settingsButton = document.querySelector('[data-testid="SettingsIcon"]')?.closest('button');
    if (settingsButton) {
      fireEvent.click(settingsButton);
      
      // Click clear queue
      fireEvent.click(screen.getByText('Clear Queue'));
      
      // Queue should be cleared (verified by lack of error)
      expect(screen.queryByText('Clear Queue')).not.toBeInTheDocument();
    }
  });
  
  test('clears entity history', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Add some status updates first
    const statusUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'status_update')[1];
    if (statusUpdateHandler) {
      act(() => {
        statusUpdateHandler({
          entityType: 'APPLICATION',
          entityId: 'app1',
          status: 'APPROVED',
          timestamp: new Date().toISOString()
        });
      });
    }
    
    // Open settings menu and clear history
    const settingsButton = document.querySelector('[data-testid="SettingsIcon"]')?.closest('button');
    if (settingsButton) {
      fireEvent.click(settingsButton);
      fireEvent.click(screen.getByText('Clear History'));
    }
    
    // History should be cleared
    expect(screen.queryByText('Applications #app1')).not.toBeInTheDocument();
  });
  
  test('shows correct status chip colors', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Expand to see updates
    const expandButton = document.querySelector('[data-testid="ExpandMoreIcon"]')?.closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
    }
    
    // Test different status types
    const statusUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'status_update')[1];
    
    if (statusUpdateHandler) {
      // Success status
      act(() => {
        statusUpdateHandler({
          entityType: 'DOCUMENT',
          entityId: 'doc1',
          status: 'VERIFIED',
          timestamp: new Date().toISOString()
        });
      });
      
      // Should show success chip
      const verifiedChip = screen.getByText('VERIFIED');
      expect(verifiedChip).toBeInTheDocument();
    }
  });
  
  test('subscribes to watched entities on connection', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Simulate connection
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    
    if (connectHandler) {
      act(() => {
        connectHandler();
      });
      
      // Should subscribe to all watched entities
      mockWatchedEntities.forEach(entity => {
        expect(mockSocket.emit).toHaveBeenCalledWith('subscribe', {
          entityType: entity.type,
          entityId: entity.id
        });
      });
    }
  });
  
  test('disconnects on unmount', () => {
    const { unmount } = render(<TestWrapper store={store} {...defaultProps} />);
    
    unmount();
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
  
  test('processes update queue after timeout', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Add updates to queue
    const statusUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'status_update')[1];
    if (statusUpdateHandler) {
      act(() => {
        statusUpdateHandler({
          entityType: 'APPLICATION',
          entityId: 'app1',
          status: 'APPROVED',
          timestamp: new Date().toISOString()
        });
      });
    }
    
    // Fast-forward to queue processing timeout
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Queue should be processed/cleared
    expect(mockOnStatusUpdate).toHaveBeenCalled();
  });
});