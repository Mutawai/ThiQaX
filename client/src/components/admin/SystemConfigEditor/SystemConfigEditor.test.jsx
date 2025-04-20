import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SystemConfigEditor from './SystemConfigEditor';

// Create mock store
const mockStore = configureStore([]);

describe('SystemConfigEditor', () => {
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
        <SystemConfigEditor />
      </Provider>
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  test('renders config sections after loading', async () => {
    render(
      <Provider store={store}>
        <SystemConfigEditor />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('System Configuration')).toBeInTheDocument();
      
      // Check that section navigation is rendered
      expect(screen.getByText('Security Settings')).toBeInTheDocument();
      expect(screen.getByText('Email Configuration')).toBeInTheDocument();
      expect(screen.getByText('Verification Settings')).toBeInTheDocument();
      expect(screen.getByText('Payment Settings')).toBeInTheDocument();
      expect(screen.getByText('System Settings')).toBeInTheDocument();
      
      // Check that default section content is rendered
      expect(screen.getByText('Maximum Login Attempts')).toBeInTheDocument();
      expect(screen.getByText('Enable Multi-Factor Authentication')).toBeInTheDocument();
    });
  });
  
  test('can navigate between config sections', async () => {
    render(
      <Provider store={store}>
        <SystemConfigEditor />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Security Settings')).toBeInTheDocument();
    });
    
    // Security section should be active by default
    expect(screen.getByText('Maximum Login Attempts')).toBeInTheDocument();
    
    // Switch to Email section
    fireEvent.click(screen.getByText('Email Configuration'));
    
    // Email section content should be visible
    expect(screen.getByText('SMTP Server')).toBeInTheDocument();
    expect(screen.getByText('From Email Address')).toBeInTheDocument();
    
    // Security section content should not be visible
    expect(screen.queryByText('Maximum Login Attempts')).not.toBeInTheDocument();
  });
  
  test('tracks changes to configuration fields', async () => {
    render(
      <Provider store={store}>
        <SystemConfigEditor />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Security Settings')).toBeInTheDocument();
    });
    
    // Make a change to a field
    const loginAttemptsInput = screen.getByLabelText('Maximum Login Attempts');
    fireEvent.change(loginAttemptsInput, { target: { value: '3' } });
    
    // Save/Discard buttons should appear
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Discard Changes')).toBeInTheDocument();
    
    // Discard changes
    fireEvent.click(screen.getByText('Discard Changes'));
    
    // Buttons should disappear
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    expect(screen.queryByText('Discard Changes')).not.toBeInTheDocument();
  });
  
  test('shows restart warning for fields that require restart', async () => {
    render(
      <Provider store={store}>
        <SystemConfigEditor />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Security Settings')).toBeInTheDocument();
    });
    
    // Check a field that requires restart
    const mfaCheckbox = screen.getByLabelText('Enable Multi-Factor Authentication');
    fireEvent.click(mfaCheckbox);
    
    // Restart warning should appear
    expect(screen.getByText('Restart Required')).toBeInTheDocument();
    expect(screen.getByText(/Some of the changes you are making will require a system restart/)).toBeInTheDocument();
  });
  
  test('handles saving configuration changes', async () => {
    // Mock global.alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <Provider store={store}>
        <SystemConfigEditor />
      </Provider>
    );
    
    // Advance timer to complete setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Security Settings')).toBeInTheDocument();
    });
    
    // Make a change to a field
    const loginAttemptsInput = screen.getByLabelText('Maximum Login Attempts');
    fireEvent.change(loginAttemptsInput, { target: { value: '3' } });
    
    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Button should show loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    // Advance timer to complete save operation
    jest.advanceTimersByTime(2000);
    
    // Success message should be shown
    expect(mockAlert).toHaveBeenCalledWith('Configuration saved successfully');
    
    // Save/Discard buttons should disappear
    await waitFor(() => {
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
      expect(screen.queryByText('Discard Changes')).not.toBeInTheDocument();
    });
    
    mockAlert.mockRestore();
  });
  
  test('renders error state when fetch fails', async () => {
    // Mock the implementation to simulate an error
    const mockError = new Error('Failed to fetch configuration');
    jest.spyOn(global, 'setTimeout').mockImplementation(callback => {
      callback(mockError);
      return 0;
    });
    
    render(
      <Provider store={store}>
        <SystemConfigEditor />
      </Provider>
    );
    
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load system configuration')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });
});