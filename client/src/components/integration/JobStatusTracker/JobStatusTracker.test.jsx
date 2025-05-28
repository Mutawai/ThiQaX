/**
 * @file Test suite for JobStatusTracker component
 * @description Unit tests for job status tracking functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import JobStatusTracker from './JobStatusTracker';

// Mock fetch
global.fetch = jest.fn();

// Mock Redux store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = initialState.auth || { user: null }, action) => state,
    },
    preloadedState: initialState,
  });
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('JobStatusTracker', () => {
  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    role: 'jobSeeker'
  };

  const mockJobStatusData = {
    success: true,
    data: {
      currentStatus: 'ACTIVE',
      lastUpdated: '2025-01-15T10:00:00Z',
      applicationsCount: 15,
      viewsCount: 150,
      shortlistedCount: 3,
      statusHistory: [
        {
          status: 'DRAFT',
          timestamp: '2025-01-14T09:00:00Z',
          reason: 'Job created'
        },
        {
          status: 'ACTIVE',
          timestamp: '2025-01-15T10:00:00Z',
          reason: 'Job published and live'
        }
      ]
    }
  };

  const renderComponent = (storeState = {}, props = {}) => {
    const store = createMockStore({
      auth: { user: mockUser },
      ...storeState
    });

    return render(
      <Provider store={store}>
        <JobStatusTracker jobId="job123" {...props} />
      </Provider>
    );
  };

  it('should render loading state initially', async () => {
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderComponent();
    
    expect(screen.getByText('Loading job status...')).toBeInTheDocument();
  });

  it('should display active job status correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Job Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('🟢')).toBeInTheDocument();
      expect(screen.getByText('Job is live and accepting applications')).toBeInTheDocument();
    });
  });

  it('should display applications count for non-job seeker roles', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent({}, { userRole: 'sponsor' });

    await waitFor(() => {
      expect(screen.getByText('15 applications received')).toBeInTheDocument();
      expect(screen.getByText('150 views')).toBeInTheDocument();
      expect(screen.getByText('3 shortlisted')).toBeInTheDocument();
    });
  });

  it('should hide metrics for job seeker role', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent({}, { userRole: 'jobSeeker' });

    await waitFor(() => {
      expect(screen.queryByText('15 applications received')).not.toBeInTheDocument();
      expect(screen.queryByText('150 views')).not.toBeInTheDocument();
    });
  });

  it('should display status history', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Status History')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Job created')).toBeInTheDocument();
      expect(screen.getByText('Job published and live')).toBeInTheDocument();
    });
  });

  it('should display filled job status correctly', async () => {
    const filledJobData = {
      ...mockJobStatusData,
      data: {
        ...mockJobStatusData.data,
        currentStatus: 'FILLED'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => filledJobData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Position Filled')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Position has been successfully filled')).toBeInTheDocument();
    });
  });

  it('should display cancelled job status correctly', async () => {
    const cancelledJobData = {
      ...mockJobStatusData,
      data: {
        ...mockJobStatusData.data,
        currentStatus: 'CANCELLED'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => cancelledJobData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('Job posting has been cancelled')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should handle HTTP error responses', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('HTTP error! status: 404')).toBeInTheDocument();
    });
  });

  it('should refresh status when refresh button is clicked', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Refresh'));

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should call onStatusChange callback when status changes', async () => {
    const mockCallback = jest.fn();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent({}, { onStatusChange: mockCallback });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(mockJobStatusData.data);
    });
  });

  it('should display correct action buttons for sponsor role', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent({}, { userRole: 'sponsor' });

    await waitFor(() => {
      expect(screen.getByText('View Applications')).toBeInTheDocument();
    });
  });

  it('should display correct action buttons for agent role', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent({}, { userRole: 'agent' });

    await waitFor(() => {
      expect(screen.getByText('Manage Job')).toBeInTheDocument();
    });
  });

  it('should display apply button for job seeker when job is active', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent({}, { userRole: 'jobSeeker' });

    await waitFor(() => {
      expect(screen.getByText('Apply Now')).toBeInTheDocument();
    });
  });

  it('should not display apply button for non-active jobs', async () => {
    const filledJobData = {
      ...mockJobStatusData,
      data: {
        ...mockJobStatusData.data,
        currentStatus: 'FILLED'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => filledJobData
    });

    renderComponent({}, { userRole: 'jobSeeker' });

    await waitFor(() => {
      expect(screen.queryByText('Apply Now')).not.toBeInTheDocument();
    });
  });

  it('should format date and time correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Last updated:')).toBeInTheDocument();
      expect(screen.getByText(/1\/15\/2025 at/)).toBeInTheDocument();
    });
  });

  it('should handle zero applications correctly', async () => {
    const noApplicationsData = {
      ...mockJobStatusData,
      data: {
        ...mockJobStatusData.data,
        applicationsCount: 0
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => noApplicationsData
    });

    renderComponent({}, { userRole: 'sponsor' });

    await waitFor(() => {
      expect(screen.getByText('No applications yet')).toBeInTheDocument();
    });
  });

  it('should handle single application correctly', async () => {
    const singleApplicationData = {
      ...mockJobStatusData,
      data: {
        ...mockJobStatusData.data,
        applicationsCount: 1
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => singleApplicationData
    });

    renderComponent({}, { userRole: 'sponsor' });

    await waitFor(() => {
      expect(screen.getByText('1 application received')).toBeInTheDocument();
    });
  });

  it('should poll for updates every 45 seconds', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent();

    // Initial load
    expect(fetch).toHaveBeenCalledTimes(1);

    // Fast-forward 45 seconds
    jest.advanceTimersByTime(45000);
    
    expect(fetch).toHaveBeenCalledTimes(2);

    // Fast-forward another 45 seconds
    jest.advanceTimersByTime(45000);
    
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should include authorization header in API requests', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobStatusData
    });

    renderComponent();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/integration/job-status/job123', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
    });
  });

  it('should show more button when there are more than 3 history items', async () => {
    const manyHistoryData = {
      ...mockJobStatusData,
      data: {
        ...mockJobStatusData.data,
        statusHistory: [
          ...mockJobStatusData.data.statusHistory,
          { status: 'REVIEWING', timestamp: '2025-01-16T10:00:00Z', reason: 'Starting review' },
          { status: 'SHORTLISTING', timestamp: '2025-01-17T10:00:00Z', reason: 'Creating shortlist' },
          { status: 'INTERVIEWING', timestamp: '2025-01-18T10:00:00Z', reason: 'Interviews started' }
        ]
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => manyHistoryData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Show 2 more status changes')).toBeInTheDocument();
    });
  });

  it('should navigate to correct pages when action buttons are clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobStatusData
    });

    // Mock window.location
    delete window.location;
    window.location = { href: '' };

    renderComponent({}, { userRole: 'sponsor' });

    await waitFor(() => {
      const viewButton = screen.getByText('View Applications');
      expect(viewButton).toBeInTheDocument();
      
      fireEvent.click(viewButton);
      expect(window.location.href).toBe('/jobs/job123/applications');
    });
  });
});