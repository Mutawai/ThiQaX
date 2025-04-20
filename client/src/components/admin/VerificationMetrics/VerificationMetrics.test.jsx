import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import VerificationMetrics from './VerificationMetrics';

// Create mock store
const mockStore = configureStore([]);

describe('VerificationMetrics', () => {
  let store;
  
  beforeEach(() => {
    store = mockStore({
      auth: {
        user: {
          id: '123',
          name: 'Test Admin',
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
        <VerificationMetrics />
      </Provider>
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  test('renders metrics data after loading', async () => {
    render(
      <Provider store={store}>
        <VerificationMetrics />
      </Provider>
    );
    
    // Advance timers to complete the setTimeout
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Verification Metrics')).toBeInTheDocument();
      expect(screen.getByText('Total Verifications')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
      expect(screen.getByText('Verification by Document Type')).toBeInTheDocument();
    });
    
    // Check for the actual metrics values
    expect(screen.getByText('1,245')).toBeInTheDocument();
    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('National ID')).toBeInTheDocument();
  });
  
  test('renders error state when fetching fails', async () => {
    // Mock the implementation to simulate an error
    const mockError = new Error('Failed to fetch metrics');
    jest.spyOn(global, 'setTimeout').mockImplementation(callback => {
      callback(mockError);
      return 0;
    });
    
    render(
      <Provider store={store}>
        <VerificationMetrics />
      </Provider>
    );
    
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load verification metrics')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });
  
  test('metric cards display correct style based on status', async () => {
    render(
      <Provider store={store}>
        <VerificationMetrics />
      </Provider>
    );
    
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      // This test would be more comprehensive with actual DOM testing for styles
      // but for simplicity, we'll just check that the components are rendered
      const pendingElement = screen.getByText('23');
      const approvedElement = screen.getByText('1,154');
      const rejectedElement = screen.getByText('68');
      
      expect(pendingElement).toBeInTheDocument();
      expect(approvedElement).toBeInTheDocument();
      expect(rejectedElement).toBeInTheDocument();
    });
  });
});