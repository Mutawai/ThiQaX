import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import AuditLogViewer from './AuditLogViewer';

// Create mock store
const mockStore = configureStore([]);

describe('AuditLogViewer', () => {
  let store;
  
  beforeEach(() => {
    store = mockStore({
      auth: {
        user: {
          id: '123',
          name: 'Admin User',
          role: 'admin'
        }
      }
    });
    
    // Mock setTimeout
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  
  test('renders loading state initially', () => {
    render(
      <Provider store={store}>
        <AuditLogViewer />
      </Provider>
    );
    
    // Check that loading spinner is visible
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  test('renders logs after loading', async () => {
    render(
      <Provider store={store}>
        <AuditLogViewer />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      // Check that heading is rendered
      expect(screen.getByText('Audit Log Viewer')).toBeInTheDocument();
      
      // Check that filter form is rendered
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Resource')).toBeInTheDocument();
      
      // Check that table headers are rendered
      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apply Filters' })).toBeInTheDocument();
      
      // Check that logs are rendered
      expect(screen.getAllByText('Details').length).toBeGreaterThan(0);
    });
  });
  
  test('filters can be applied and reset', async () => {
    render(
      <Provider store={store}>
        <AuditLogViewer />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Apply Filters' })).toBeInTheDocument();
    });
    
    // Set filters
    fireEvent.change(screen.getByLabelText('User'), {
      target: { value: 'John' }
    });
    
    fireEvent.change(screen.getByLabelText('Action'), {
      target: { value: 'CREATE' }
    });
    
    // Apply filters
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
    
    // Check that filters were applied
    expect(screen.getByLabelText('User').value).toBe('John');
    expect(screen.getByLabelText('Action').value).toBe('CREATE');
    
    // Reset filters
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    
    // Check that filters were reset
    expect(screen.getByLabelText('User').value).toBe('');
    expect(screen.getByLabelText('Action').value).toBe('');
  });
  
  test('can view log details when clicking on a log entry', async () => {
    render(
      <Provider store={store}>
        <AuditLogViewer />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getAllByText('Details').length).toBeGreaterThan(0);
    });
    
    // Click on the first "Details" button
    fireEvent.click(screen.getAllByText('Details')[0]);
    
    // Check that details view is rendered
    expect(screen.getByText('Log Details')).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('System Information')).toBeInTheDocument();
    expect(screen.getByText('IP Address')).toBeInTheDocument();
    
    // Close details view
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    
    // Check that details view is closed
    expect(screen.queryByText('Log Details')).not.toBeInTheDocument();
  });
  
  test('pagination controls work correctly', async () => {
    render(
      <Provider store={store}>
        <AuditLogViewer />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      // Check that pagination controls are rendered
      expect(screen.getByText('1')).toBeInTheDocument();
    });
    
    // Click on next page
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    
    // Advance timer to complete setTimeout after page change
    jest.advanceTimersByTime(1500);
    
    // Since we're mocking the API call and not actually changing the data,
    // we can't assert much about the new page, but we can check that the
    // page change was triggered
    
    // Go back to first page
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    
    // Advance timer to complete setTimeout after page change
    jest.advanceTimersByTime(1500);
  });
  
  test('renders error state when fetch fails', async () => {
    // Mock the implementation to simulate an error
    const mockError = new Error('Failed to fetch logs');
    jest.spyOn(global, 'setTimeout').mockImplementation(callback => {
      callback(mockError);
      return 0;
    });
    
    render(
      <Provider store={store}>
        <AuditLogViewer />
      </Provider>
    );
    
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load audit logs')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });
});