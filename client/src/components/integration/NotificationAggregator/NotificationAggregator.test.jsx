// client/src/components/integration/NotificationAggregator/NotificationAggregator.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import NotificationAggregator from './NotificationAggregator';

// Mock data
const mockNotifications = [
  {
    _id: 'notif1',
    type: 'APPLICATION',
    title: 'Application Shortlisted',
    message: 'Your application for Software Developer has been shortlisted',
    read: false,
    priority: 'HIGH',
    createdAt: '2025-04-18T10:00:00Z'
  },
  {
    _id: 'notif2',
    type: 'DOCUMENT',
    title: 'Document Verified',
    message: 'Your identity document has been verified successfully',
    read: true,
    priority: 'NORMAL',
    createdAt: '2025-04-17T15:30:00Z'
  },
  {
    _id: 'notif3',
    type: 'JOB',
    title: 'New Job Match',
    message: 'A new job matching your profile: Senior Developer',
    read: false,
    priority: 'NORMAL',
    createdAt: '2025-04-16T09:15:00Z'
  },
  {
    _id: 'notif4',
    type: 'PAYMENT',
    title: 'Payment Completed',
    message: 'Your payment of $500 has been completed successfully',
    read: true,
    priority: 'LOW',
    createdAt: '2025-04-15T14:20:00Z'
  },
  {
    _id: 'notif5',
    type: 'SYSTEM',
    title: 'System Update',
    message: 'Platform maintenance scheduled for tonight',
    read: false,
    priority: 'NORMAL',
    createdAt: '2025-04-14T11:45:00Z'
  }
];

const mockUser = {
  _id: 'user1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
};

// Mock actions
const mockActions = {
  getNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  deleteNotification: jest.fn()
};

// Mock the notification actions
jest.mock('../../../store/actions/notificationActions', () => ({
  getNotifications: () => mockActions.getNotifications,
  markNotificationAsRead: (id) => mockActions.markNotificationAsRead(id),
  markAllNotificationsAsRead: () => mockActions.markAllNotificationsAsRead,
  deleteNotification: (id) => mockActions.deleteNotification(id)
}));

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: mockUser }, action) => state,
      notifications: (state = { 
        notifications: mockNotifications, 
        unreadCount: 3, 
        loading: false, 
        error: null 
      }, action) => {
        switch (action.type) {
          case 'MARK_NOTIFICATION_READ':
            return {
              ...state,
              notifications: state.notifications.map(n => 
                n._id === action.payload ? { ...n, read: true } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1)
            };
          case 'DELETE_NOTIFICATION':
            return {
              ...state,
              notifications: state.notifications.filter(n => n._id !== action.payload),
              unreadCount: state.notifications.find(n => n._id === action.payload && !n.read) 
                ? Math.max(0, state.unreadCount - 1) 
                : state.unreadCount
            };
          case 'MARK_ALL_READ':
            return {
              ...state,
              notifications: state.notifications.map(n => ({ ...n, read: true })),
              unreadCount: 0
            };
          default:
            return state;
        }
      }
    },
    preloadedState: initialState
  });
};

// Test wrapper component
const TestWrapper = ({ store, ...props }) => (
  <Provider store={store}>
    <NotificationAggregator {...props} />
  </Provider>
);

describe('NotificationAggregator Component', () => {
  let store;
  const mockOnNotificationClick = jest.fn();
  
  beforeEach(() => {
    store = createMockStore();
    mockOnNotificationClick.mockClear();
    Object.values(mockActions).forEach(action => action.mockClear());
  });
  
  test('renders notification aggregator correctly', () => {
    render(<TestWrapper store={store} />);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
  });
  
  test('displays notification count badge', () => {
    render(<TestWrapper store={store} />);
    
    // Should show unread count badge
    const badges = document.querySelectorAll('.MuiBadge-badge');
    expect(badges.length).toBeGreaterThan(0);
  });
  
  test('filters notifications by tab selection', () => {
    render(<TestWrapper store={store} />);
    
    // Initially should show all notifications
    expect(screen.getByText('Application Shortlisted')).toBeInTheDocument();
    expect(screen.getByText('Document Verified')).toBeInTheDocument();
    
    // Click unread tab
    fireEvent.click(screen.getByText('Unread'));
    
    // Should show only unread notifications
    expect(screen.getByText('Application Shortlisted')).toBeInTheDocument();
    expect(screen.queryByText('Document Verified')).not.toBeInTheDocument();
  });
  
  test('filters notifications by type tab', () => {
    render(<TestWrapper store={store} />);
    
    // Click Applications tab
    fireEvent.click(screen.getByText('Applications'));
    
    // Should show only application notifications
    expect(screen.getByText('Application Shortlisted')).toBeInTheDocument();
    expect(screen.queryByText('Document Verified')).not.toBeInTheDocument();
    expect(screen.queryByText('New Job Match')).not.toBeInTheDocument();
  });
  
  test('searches notifications by text', () => {
    render(<TestWrapper store={store} />);
    
    // Search for "verified"
    const searchInput = screen.getByPlaceholderText('Search notifications...');
    fireEvent.change(searchInput, { target: { value: 'verified' } });
    
    // Should show only matching notifications
    expect(screen.getByText('Document Verified')).toBeInTheDocument();
    expect(screen.queryByText('Application Shortlisted')).not.toBeInTheDocument();
  });
  
  test('clears search when clear button is clicked', () => {
    render(<TestWrapper store={store} />);
    
    // Enter search term
    const searchInput = screen.getByPlaceholderText('Search notifications...');
    fireEvent.change(searchInput, { target: { value: 'verified' } });
    
    // Click clear button
    const clearButton = document.querySelector('[data-testid="clear-search"]') || 
                       document.querySelector('.MuiInputAdornment-root button');
    if (clearButton) {
      fireEvent.click(clearButton);
    }
    
    // Search should be cleared
    expect(searchInput.value).toBe('');
  });
  
  test('groups notifications by type when showGrouping is true', () => {
    render(<TestWrapper store={store} showGrouping={true} />);
    
    // Should show group headers
    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });
  
  test('does not group notifications when showGrouping is false', () => {
    render(<TestWrapper store={store} showGrouping={false} />);
    
    // Should not show group headers, just notifications
    expect(screen.queryByText('Applications')).not.toBeInTheDocument();
    expect(screen.getByText('Application Shortlisted')).toBeInTheDocument();
  });
  
  test('expands and collapses notification groups', () => {
    render(<TestWrapper store={store} showGrouping={true} />);
    
    // Find Applications group header and click it
    const applicationsHeader = screen.getByText('Applications').closest('li');
    fireEvent.click(applicationsHeader);
    
    // Check if expand/collapse icon changes
    const expandIcon = document.querySelector('[data-testid="ExpandLessIcon"]') ||
                      document.querySelector('[data-testid="ExpandMoreIcon"]');
    expect(expandIcon).toBeInTheDocument();
  });
  
  test('calls onNotificationClick when notification is clicked', () => {
    render(<TestWrapper store={store} onNotificationClick={mockOnNotificationClick} />);
    
    // Click on a notification
    fireEvent.click(screen.getByText('Application Shortlisted'));
    
    // Should call the callback
    expect(mockOnNotificationClick).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'notif1',
        title: 'Application Shortlisted'
      })
    );
  });
  
  test('marks notification as read when clicked', () => {
    render(<TestWrapper store={store} />);
    
    // Click on unread notification
    fireEvent.click(screen.getByText('Application Shortlisted'));
    
    // Should dispatch mark as read action
    expect(mockActions.markNotificationAsRead).toHaveBeenCalledWith('notif1');
  });
  
  test('opens context menu on right click', () => {
    render(<TestWrapper store={store} />);
    
    // Right click on notification
    const notification = screen.getByText('Application Shortlisted').closest('li');
    fireEvent.contextMenu(notification);
    
    // Should show context menu
    expect(screen.getByText('Mark as read')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
  
  test('marks notification as read from context menu', () => {
    render(<TestWrapper store={store} />);
    
    // Right click on unread notification
    const notification = screen.getByText('Application Shortlisted').closest('li');
    fireEvent.contextMenu(notification);
    
    // Click mark as read
    fireEvent.click(screen.getByText('Mark as read'));
    
    // Should dispatch mark as read action
    expect(mockActions.markNotificationAsRead).toHaveBeenCalledWith('notif1');
  });
  
  test('deletes notification from context menu', () => {
    render(<TestWrapper store={store} />);
    
    // Right click on notification
    const notification = screen.getByText('Application Shortlisted').closest('li');
    fireEvent.contextMenu(notification);
    
    // Click delete
    fireEvent.click(screen.getByText('Delete'));
    
    // Should dispatch delete action
    expect(mockActions.deleteNotification).toHaveBeenCalledWith('notif1');
  });
  
  test('marks all notifications as read', () => {
    render(<TestWrapper store={store} />);
    
    // Click mark all as read button
    const markAllButton = screen.getByTitle('Mark all as read') || 
                         document.querySelector('[aria-label="Mark all as read"]');
    if (markAllButton) {
      fireEvent.click(markAllButton);
    }
    
    // Should dispatch mark all as read action
    expect(mockActions.markAllNotificationsAsRead).toHaveBeenCalled();
  });
  
  test('opens and closes filter menu', () => {
    render(<TestWrapper store={store} />);
    
    // Click filter button
    const filterButton = screen.getByTitle('Filter') || 
                        document.querySelector('[aria-label="Filter"]');
    if (filterButton) {
      fireEvent.click(filterButton);
      
      // Should show filter options
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Timeframe')).toBeInTheDocument();
    }
  });
  
  test('filters by priority', () => {
    render(<TestWrapper store={store} />);
    
    // Open filter menu
    const filterButton = screen.getByTitle('Filter') || 
                        document.querySelector('[aria-label="Filter"]');
    if (filterButton) {
      fireEvent.click(filterButton);
      
      // Click HIGH priority filter
      fireEvent.click(screen.getByText('HIGH'));
      
      // Should show only high priority notifications
      expect(screen.getByText('Application Shortlisted')).toBeInTheDocument();
      expect(screen.queryByText('Document Verified')).not.toBeInTheDocument();
    }
  });
  
  test('shows loading state', () => {
    const loadingStore = createMockStore({
      auth: { user: mockUser },
      notifications: { notifications: [], unreadCount: 0, loading: true, error: null }
    });
    
    render(<TestWrapper store={loadingStore} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('shows error state', () => {
    const errorStore = createMockStore({
      auth: { user: mockUser },
      notifications: { 
        notifications: [], 
        unreadCount: 0, 
        loading: false, 
        error: 'Failed to load notifications' 
      }
    });
    
    render(<TestWrapper store={errorStore} />);
    
    expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
  });
  
  test('shows empty state when no notifications', () => {
    const emptyStore = createMockStore({
      auth: { user: mockUser },
      notifications: { notifications: [], unreadCount: 0, loading: false, error: null }
    });
    
    render(<TestWrapper store={emptyStore} />);
    
    expect(screen.getByText('No notifications')).toBeInTheDocument();
    expect(screen.getByText('You have no notifications at this time')).toBeInTheDocument();
  });
  
  test('renders in compact mode', () => {
    render(<TestWrapper store={store} compact={true} />);
    
    // Component should still render all notifications
    expect(screen.getByText('Application Shortlisted')).toBeInTheDocument();
    expect(screen.getByText('Document Verified')).toBeInTheDocument();
  });
  
  test('respects maxHeight prop', () => {
    render(<TestWrapper store={store} maxHeight={400} />);
    
    const container = document.querySelector('.container');
    expect(container).toHaveStyle('max-height: 400px');
  });
  
  test('fetches notifications on mount', () => {
    render(<TestWrapper store={store} />);
    
    expect(mockActions.getNotifications).toHaveBeenCalled();
  });
});