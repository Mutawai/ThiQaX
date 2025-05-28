/**
 * @file Test suite for ApplicationMilestoneTracker component
 * @description Unit tests for application milestone tracking functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ApplicationMilestoneTracker from './ApplicationMilestoneTracker';

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

describe('ApplicationMilestoneTracker', () => {
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

  const mockMilestonesData = {
    success: true,
    data: {
      milestones: [
        {
          milestone: 'APPLICATION_SUBMITTED',
          timestamp: '2025-01-15T10:00:00Z',
          details: 'Application submitted successfully'
        },
        {
          milestone: 'DOCUMENTS_UPLOADED',
          timestamp: '2025-01-15T11:00:00Z',
          details: 'All required documents uploaded'
        },
        {
          milestone: 'DOCUMENTS_VERIFIED',
          timestamp: '2025-01-15T14:00:00Z',
          details: 'Documents verified by admin'
        }
      ],
      currentStage: 'Document Verification Complete'
    }
  };

  const renderComponent = (storeState = {}, props = {}) => {
    const store = createMockStore({
      auth: { user: mockUser },
      ...storeState
    });

    return render(
      <Provider store={store}>
        <ApplicationMilestoneTracker applicationId="app123" {...props} />
      </Provider>
    );
  };

  it('should render loading state initially', async () => {
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderComponent();
    
    expect(screen.getByText('Loading application progress...')).toBeInTheDocument();
  });

  it('should display milestones timeline correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMilestonesData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Application Progress')).toBeInTheDocument();
      expect(screen.getByText('Documents Verified')).toBeInTheDocument();
      expect(screen.getByText('Your documents have been verified')).toBeInTheDocument();
      expect(screen.getByText('Documents verified by admin')).toBeInTheDocument();
    });
  });

  it('should display timeline when showTimeline is true', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMilestonesData
    });

    renderComponent({}, { showTimeline: true });

    await waitFor(() => {
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Application Submitted')).toBeInTheDocument();
      expect(screen.getByText('Documents Uploaded')).toBeInTheDocument();
      expect(screen.getByText('Documents Verified')).toBeInTheDocument();
    });
  });

  it('should hide timeline when showTimeline is false', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMilestonesData
    });

    renderComponent({}, { showTimeline: false });

    await waitFor(() => {
      expect(screen.getByText('Application Progress')).toBeInTheDocument();
      expect(screen.queryByText('Timeline')).not.toBeInTheDocument();
    });
  });

  it('should display current stage information', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMilestonesData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Current Stage:')).toBeInTheDocument();
      expect(screen.getByText('Document Verification Complete')).toBeInTheDocument();
    });
  });

  it('should format dates and times correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMilestonesData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/1\/15\/2025/)).toBeInTheDocument();
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

  it('should display no milestones message when empty', async () => {
    const emptyMilestonesData = {
      success: true,
      data: {
        milestones: [],
        currentStage: null
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyMilestonesData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No milestones recorded yet')).toBeInTheDocument();
    });
  });

  it('should refresh milestones when refresh button is clicked', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockMilestonesData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Refresh'));

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should call onMilestoneUpdate callback when milestones change', async () => {
    const mockCallback = jest.fn();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMilestonesData
    });

    renderComponent({}, { onMilestoneUpdate: mockCallback });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(mockMilestonesData.data);
    });
  });

  it('should handle rejected application milestone', async () => {
    const rejectedMilestonesData = {
      success: true,
      data: {
        milestones: [
          {
            milestone: 'APPLICATION_SUBMITTED',
            timestamp: '2025-01-15T10:00:00Z',
            details: 'Application submitted successfully'
          },
          {
            milestone: 'REJECTED',
            timestamp: '2025-01-16T10:00:00Z',
            details: 'Application rejected due to incomplete documentation'
          }
        ],
        currentStage: 'Application Rejected'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => rejectedMilestonesData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Application Rejected')).toBeInTheDocument();
      expect(screen.getByText('Application was not successful')).toBeInTheDocument();
      expect(screen.getByText('Application rejected due to incomplete documentation')).toBeInTheDocument();
    });
  });

  it('should handle offer made milestone', async () => {
    const offerMilestonesData = {
      success: true,
      data: {
        milestones: [
          {
            milestone: 'APPLICATION_SUBMITTED',
            timestamp: '2025-01-15T10:00:00Z',
            details: 'Application submitted successfully'
          },
          {
            milestone: 'OFFER_MADE',
            timestamp: '2025-01-20T10:00:00Z',
            details: 'Job offer extended with salary of $2000/month'
          }
        ],
        currentStage: 'Offer Extended'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => offerMilestonesData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Offer Made')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.getByText('Job offer has been extended')).toBeInTheDocument();
    });
  });

  it('should poll for updates every 30 seconds', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockMilestonesData
    });

    renderComponent();

    // Initial load
    expect(fetch).toHaveBeenCalledTimes(1);

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);
    
    expect(fetch).toHaveBeenCalledTimes(2);

    // Fast-forward another 30 seconds
    jest.advanceTimersByTime(30000);
    
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should include authorization header in API requests', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMilestonesData
    });

    renderComponent();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/integration/application-milestones/app123', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
    });
  });

  it('should handle milestones without details', async () => {
    const milestonesWithoutDetails = {
      success: true,
      data: {
        milestones: [
          {
            milestone: 'APPLICATION_SUBMITTED',
            timestamp: '2025-01-15T10:00:00Z'
          }
        ],
        currentStage: 'Application Submitted'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => milestonesWithoutDetails
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Application Submitted')).toBeInTheDocument();
      expect(screen.getByText('Your application has been submitted successfully')).toBeInTheDocument();
    });
  });

  it('should handle unknown milestone types', async () => {
    const unknownMilestoneData = {
      success: true,
      data: {
        milestones: [
          {
            milestone: 'CUSTOM_MILESTONE',
            timestamp: '2025-01-15T10:00:00Z',
            details: 'Custom milestone reached'
          }
        ],
        currentStage: 'Custom Stage'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => unknownMilestoneData
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Custom Milestone')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
      expect(screen.getByText('Milestone updated')).toBeInTheDocument();
    });
  });
});