// client/src/components/integration/MobileWebSyncHandler/MobileWebSyncHandler.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import MobileWebSyncHandler from './MobileWebSyncHandler';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
});

// Mock data
const mockUser = {
  _id: 'user1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
};

const mockProfile = {
  phoneNumber: '+254700123456',
  location: 'Nairobi'
};

const mockApplications = [
  { _id: 'app1', title: 'Software Developer', status: 'SUBMITTED' }
];

const mockDocuments = [
  { _id: 'doc1', type: 'IDENTITY', status: 'VERIFIED' }
];

// Mock functions
const mockOnSyncComplete = jest.fn();
const mockOnConflict = jest.fn();

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: mockUser }, action) => state,
      profile: (state = { profile: mockProfile }, action) => state,
      applications: (state = { applications: mockApplications }, action) => state,
      documents: (state = { documents: mockDocuments }, action) => state
    },
    preloadedState: initialState
  });
};

// Test wrapper component
const TestWrapper = ({ store, ...props }) => (
  <Provider store={store}>
    <MobileWebSyncHandler {...props} />
  </Provider>
);

describe('MobileWebSyncHandler Component', () => {
  let store;
  
  beforeEach(() => {
    store = createMockStore();
    mockOnSyncComplete.mockClear();
    mockOnConflict.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  const defaultProps = {
    onSyncComplete: mockOnSyncComplete,
    onConflict: mockOnConflict
  };
  
  test('renders mobile-web sync handler correctly', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    expect(screen.getByText('Mobile-Web Sync')).toBeInTheDocument();
    expect(screen.getByText('WEB')).toBeInTheDocument();
  });
  
  test('detects mobile device correctly', () => {
    // Mock mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    });
    
    render(<TestWrapper store={store} {...defaultProps} />);
    
    expect(screen.getByText('MOBILE')).toBeInTheDocument();
  });
  
  test('shows sync progress when enabled', () => {
    render(<TestWrapper store={store} {...defaultProps} showProgress={true} />);
    
    // Progress should be hidden initially
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
  
  test('hides sync progress when disabled', () => {
    render(<TestWrapper store={store} {...defaultProps} showProgress={false} />);
    
    // Should not show progress bar even during sync
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
  
  test('handles online/offline status changes', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Initially online
    expect(screen.getByText('Ready')).toBeInTheDocument();
    
    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });
    
    // Should show offline status
    expect(screen.getByText('Offline')).toBeInTheDocument();
    
    // Simulate going back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });
    
    // Should show ready status
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
  
  test('performs manual sync when refresh button clicked', async () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Find and click refresh button
    const refreshButton = screen.getByTitle('Manual sync');
    fireEvent.click(refreshButton);
    
    // Should show syncing status
    expect(screen.getByText('Syncing')).toBeInTheDocument();
    
    // Fast-forward sync completion
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(mockOnSyncComplete).toHaveBeenCalled();
    });
  });
  
  test('disables sync when offline', () => {
    // Set offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    render(<TestWrapper store={store} {...defaultProps} />);
    
    const refreshButton = screen.getByTitle('Manual sync');
    expect(refreshButton).toBeDisabled();
  });
  
  test('expands and collapses content', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Initially collapsed
    expect(screen.queryByText('Sync Settings')).not.toBeInTheDocument();
    
    // Click expand button
    const expandButton = document.querySelector('[data-testid="ExpandMoreIcon"]')?.closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
      
      // Should show expanded content
      expect(screen.getByText('Sync Settings')).toBeInTheDocument();
      expect(screen.getByText('Auto-sync')).toBeInTheDocument();
    }
  });
  
  test('toggles auto-sync setting', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Expand content
    const expandButton = document.querySelector('[data-testid="ExpandMoreIcon"]')?.closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
      
      // Find auto-sync toggle
      const autoSyncToggle = screen.getByText('Auto-sync').closest('label').querySelector('input');
      
      // Should be enabled by default
      expect(autoSyncToggle).toBeChecked();
      
      // Toggle off
      fireEvent.click(autoSyncToggle);
      
      // Should be disabled
      expect(autoSyncToggle).not.toBeChecked();
    }
  });
  
  test('opens and closes settings dialog', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Click settings button
    const settingsButton = document.querySelector('[data-testid="SettingsIcon"]')?.closest('button');
    if (settingsButton) {
      fireEvent.click(settingsButton);
      
      // Should open settings dialog
      expect(screen.getByText('Sync Settings')).toBeInTheDocument();
      expect(screen.getByText('Conflict Resolution')).toBeInTheDocument();
      
      // Close dialog
      fireEvent.click(screen.getByText('Close'));
      
      // Should close
      expect(screen.queryByText('Conflict Resolution')).not.toBeInTheDocument();
    }
  });
  
  test('updates conflict resolution setting', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Open settings
    const settingsButton = document.querySelector('[data-testid="SettingsIcon"]')?.closest('button');
    if (settingsButton) {
      fireEvent.click(settingsButton);
      
      // Find conflict resolution dropdown
      const dropdown = screen.getByLabelText('Conflict Resolution');
      fireEvent.change(dropdown, { target: { value: 'local' } });
      
      // Value should be updated
      expect(dropdown.value).toBe('local');
    }
  });
  
  test('updates sync interval setting', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Open settings
    const settingsButton = document.querySelector('[data-testid="SettingsIcon"]')?.closest('button');
    if (settingsButton) {
      fireEvent.click(settingsButton);
      
      // Find sync interval input
      const intervalInput = screen.getByLabelText('Sync Interval (seconds)');
      fireEvent.change(intervalInput, { target: { value: '60' } });
      
      // Value should be updated
      expect(intervalInput.value).toBe('60');
    }
  });
  
  test('shows conflict alert when conflicts exist', async () => {
    // Mock sync with conflicts
    const originalMath = global.Math.random;
    global.Math.random = () => 0.5; // Force conflict generation
    
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Trigger sync
    const refreshButton = screen.getByTitle('Manual sync');
    fireEvent.click(refreshButton);
    
    // Wait for sync to complete
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      // Should show conflict alert
      expect(screen.getByText(/sync conflict/)).toBeInTheDocument();
      expect(screen.getByText('Resolve')).toBeInTheDocument();
    });
    
    // Restore Math.random
    global.Math.random = originalMath;
  });
  
  test('opens conflict resolution dialog', async () => {
    // Mock sync with conflicts
    global.Math.random = () => 0.5;
    
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Trigger sync and wait for conflicts
    const refreshButton = screen.getByTitle('Manual sync');
    fireEvent.click(refreshButton);
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      // Click resolve in alert
      const resolveButton = screen.getByText('Resolve');
      fireEvent.click(resolveButton);
      
      // Should open conflict dialog
      expect(screen.getByText('Resolve Sync Conflict')).toBeInTheDocument();
    });
    
    global.Math.random = Math.random;
  });
  
  test('resolves conflict with local value', async () => {
    global.Math.random = () => 0.5;
    
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Trigger sync and open conflict dialog
    const refreshButton = screen.getByTitle('Manual sync');
    fireEvent.click(refreshButton);
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      const resolveButton = screen.getByText('Resolve');
      fireEvent.click(resolveButton);
    });
    
    // Resolve with local value
    const useLocalButton = screen.getByText('Use Local');
    fireEvent.click(useLocalButton);
    
    // Dialog should close
    expect(screen.queryByText('Resolve Sync Conflict')).not.toBeInTheDocument();
    
    global.Math.random = Math.random;
  });
  
  test('resolves conflict with remote value', async () => {
    global.Math.random = () => 0.5;
    
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Trigger sync and open conflict dialog
    const refreshButton = screen.getByTitle('Manual sync');
    fireEvent.click(refreshButton);
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      const resolveButton = screen.getByText('Resolve');
      fireEvent.click(resolveButton);
    });
    
    // Resolve with remote value
    const useRemoteButton = screen.getByText('Use Remote');
    fireEvent.click(useRemoteButton);
    
    // Dialog should close
    expect(screen.queryByText('Resolve Sync Conflict')).not.toBeInTheDocument();
    
    global.Math.random = Math.random;
  });
  
  test('auto-syncs at specified interval', () => {
    render(<TestWrapper store={store} {...defaultProps} autoSync={true} syncInterval={5000} />);
    
    // Fast-forward past sync interval
    act(() => {
      jest.advanceTimersByTime(6000);
    });
    
    // Should have triggered auto-sync
    expect(screen.getByText('Syncing')).toBeInTheDocument();
  });
  
  test('does not auto-sync when disabled', () => {
    render(<TestWrapper store={store} {...defaultProps} autoSync={false} />);
    
    // Fast-forward past any interval
    act(() => {
      jest.advanceTimersByTime(60000);
    });
    
    // Should not have synced
    expect(screen.queryByText('Syncing')).not.toBeInTheDocument();
  });
  
  test('syncs on window focus when enabled', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Expand to enable sync on focus
    const expandButton = document.querySelector('[data-testid="ExpandMoreIcon"]')?.closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
      
      // Ensure sync on focus is enabled (should be by default)
      const syncOnFocusToggle = screen.getByText('Sync on focus').closest('label').querySelector('input');
      expect(syncOnFocusToggle).toBeChecked();
    }
    
    // Simulate window focus
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    
    // Should trigger sync
    expect(screen.getByText('Syncing')).toBeInTheDocument();
  });
  
  test('displays last sync time', async () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Perform sync
    const refreshButton = screen.getByTitle('Manual sync');
    fireEvent.click(refreshButton);
    
    // Wait for sync completion
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      // Expand to see last sync
      const expandButton = document.querySelector('[data-testid="ExpandMoreIcon"]')?.closest('button');
      if (expandButton) {
        fireEvent.click(expandButton);
        
        // Should show last sync time
        expect(screen.getByText('Last Sync')).toBeInTheDocument();
      }
    });
  });
  
  test('shows sync error state', async () => {
    // Mock console.error to avoid test output
    const originalError = console.error;
    console.error = jest.fn();
    
    // Mock sync failure
    global.Math.random = () => 0; // Force error
    
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Trigger sync
    const refreshButton = screen.getByTitle('Manual sync');
    fireEvent.click(refreshButton);
    
    // Wait for error
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Sync Failed')).toBeInTheDocument();
    });
    
    // Restore console.error
    console.error = originalError;
    global.Math.random = Math.random;
  });
  
  test('toggles data type sync settings', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Expand content
    const expandButton = document.querySelector('[data-testid="ExpandMoreIcon"]')?.closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
      
      // Find data type toggles
      const dataTypeToggles = screen.getAllByRole('checkbox');
      const profileToggle = dataTypeToggles.find(toggle => 
        toggle.closest('li')?.textContent?.includes('Profile Data')
      );
      
      if (profileToggle) {
        // Should be enabled by default
        expect(profileToggle).toBeChecked();
        
        // Toggle off
        fireEvent.click(profileToggle);
        
        // Should be disabled
        expect(profileToggle).not.toBeChecked();
      }
    }
  });
  
  test('handles sync completion callback', async () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Trigger sync
    const refreshButton = screen.getByTitle('Manual sync');
    fireEvent.click(refreshButton);
    
    // Wait for completion
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(mockOnSyncComplete).toHaveBeenCalled();
    });
  });
  
  test('handles conflict callback', async () => {
    global.Math.random = () => 0.5;
    
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Trigger sync
    const refreshButton = screen.getByTitle('Manual sync');
    fireEvent.click(refreshButton);
    
    // Wait for conflicts
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(mockOnConflict).toHaveBeenCalled();
    });
    
    global.Math.random = Math.random;
  });
});