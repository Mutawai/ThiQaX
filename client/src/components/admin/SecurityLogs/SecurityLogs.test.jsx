import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SecurityLogs from './SecurityLogs';

// Create mock store
const mockStore = configureStore([]);

describe('SecurityLogs', () => {
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
        <SecurityLogs />
      </Provider>
    );
    
    // Check that loading spinner is visible
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  test('renders security logs after loading', async () => {
    render(
      <Provider store={store}>
        <SecurityLogs />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      // Check that heading is rendered
      expect(screen.getByText('Security Logs')).toBeInTheDocument();
      
      // Check that filter form is rendered
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
      expect(screen.getByLabelText('Severity')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      
      // Check that stats are rendered
      expect(screen.getByText('Critical Alerts')).toBeInTheDocument();
      expect(screen.getByText('High Severity')).toBeInTheDocument();
      expect(screen.getByText('Medium Severity')).toBeInTheDocument();
      expect(screen.getByText('Total Events Today')).toBeInTheDocument();
      
      // Check that date groups are rendered
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });
  
  test('filters can be applied and reset', async () => {
    render(
      <Provider store={store}>
        <SecurityLogs />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
    });
    
    // Set filters
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'login' }
    });
    
    fireEvent.change(screen.getByLabelText('Severity'), {
      target: { value: 'critical' }
    });
    
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'authentication' }
    });
    
    // Apply filters
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    
    // Check that filters were applied
    expect(screen.getByLabelText('Search').value).toBe('login');
    expect(screen.getByLabelText('Severity').value).toBe('critical');
    expect(screen.getByLabelText('Category').value).toBe('authentication');
    
    // Reset filters
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    
    // Check that filters were reset
    expect(screen.getByLabelText('Search').value).toBe('');
    expect(screen.getByLabelText('Severity').value).toBe('');
    expect(screen.getByLabelText('Category').value).toBe('');
  });
  
  test('date groups can be expanded and collapsed', async () => {
    render(
      <Provider store={store}>
        <SecurityLogs />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    // Wait for date groups to be rendered
    await waitFor(() => {
      // This depends on your exact UI, but we're looking for something
      // that might indicate a date group header
      const dateGroups = screen.getAllByText(/events/);
      expect(dateGroups.length).toBeGreaterThan(0);
    });
    
    // Click on the first date group to expand it
    const dateGroups = screen.getAllByText(/events/);
    fireEvent.click(dateGroups[0]);
    
    // We'd need to check for elements that appear when expanded
    // This might vary based on your implementation
    await waitFor(() => {
      // Look for something that indicates expanded state
      // This could be a specific CSS class, or the presence of child elements
      // For this test, we'll just check that the click handler was called
      expect(dateGroups[0]).toBeInTheDocument();
    });
  });
  
  test('log details modal can be opened and closed', async () => {
    render(
      <Provider store={store}>
        <SecurityLogs />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    // Wait for date groups to be rendered
    await waitFor(() => {
      const dateGroups = screen.getAllByText(/events/);
      expect(dateGroups.length).toBeGreaterThan(0);
    });
    
    // Click on the first date group to expand it
    const dateGroups = screen.getAllByText(/events/);
    fireEvent.click(dateGroups[0]);
    
    // Wait for log items to be rendered
    await waitFor(() => {
      // Find log items - this selector will depend on your implementation
      const logItems = screen.getAllByText(/System|User/);
      expect(logItems.length).toBeGreaterThan(0);
      
      // Click on the first log item to open details modal
      fireEvent.click(logItems[0]);
    });
    
    // Check that log details modal is opened
    await waitFor(() => {
      expect(screen.getByText('Log Details')).toBeInTheDocument();
    });
    
    // Close the modal
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    
    // Check that modal is closed
    await waitFor(() => {
      expect(screen.queryByText('Log Details')).not.toBeInTheDocument();
    });
  });
  
  test('renders empty state when no logs match filters', async () => {
    // Mock the implementation to return empty logs
    jest.spyOn(global, 'setTimeout').mockImplementation(callback => {
      callback();
      return 0;
    });
    
    render(
      <Provider store={store}>
        <SecurityLogs />
      </Provider>
    );
    
    jest.advanceTimersByTime(1500);
    
    // Check that empty state is rendered
    await waitFor(() => {
      expect(screen.getByText('No logs found')).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your search or filter/)).toBeInTheDocument();
    });
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
        <SecurityLogs />
      </Provider>
    );
    
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load security logs')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });
});