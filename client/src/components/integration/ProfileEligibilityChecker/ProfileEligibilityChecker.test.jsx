/**
 * @file Test suite for ProfileEligibilityChecker component
 * @description Unit tests for profile eligibility checking functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProfileEligibilityChecker from './ProfileEligibilityChecker';

// Mock fetch
global.fetch = jest.fn();

// Mock Redux store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = initialState.auth || { user: null }, action) => state,
      profile: (state = initialState.profile || { profile: null }, action) => state,
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

describe('ProfileEligibilityChecker', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
  });

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    role: 'jobSeeker'
  };

  const mockProfile = {
    lastUpdated: '2025-01-15T10:00:00Z',
    completeness: 80
  };

  const renderComponent = (storeState = {}, props = {}) => {
    const store = createMockStore({
      auth: { user: mockUser },
      profile: { profile: mockProfile },
      ...storeState
    });

    return render(
      <Provider store={store}>
        <ProfileEligibilityChecker jobId="job123" {...props} />
      </Provider>
    );
  };

  it('should render loading state initially', async () => {
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderComponent();
    
    expect(screen.getByText('Checking eligibility...')).toBeInTheDocument();
  });

  it('should display eligible status when user is eligible', async () => {
    const mockEligibilityResponse = {
      success: true,
      data: {
        eligible: true,
        reasons: [],
        missingRequirements: [],
        warnings: []
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEligibilityResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Eligible to Apply')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });
  });

  it('should display ineligible status with reasons when user is not eligible', async () => {
    const mockEligibilityResponse = {
      success: true,
      data: {
        eligible: false,
        reasons: ['Profile incomplete', 'KYC not verified'],
        missingRequirements: ['Contact information', 'Work experience'],
        warnings: []
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEligibilityResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Not Eligible')).toBeInTheDocument();
      expect(screen.getByText('Profile incomplete')).toBeInTheDocument();
      expect(screen.getByText('KYC not verified')).toBeInTheDocument();
      expect(screen.getByText('Contact information')).toBeInTheDocument();
      expect(screen.getByText('Work experience')).toBeInTheDocument();
    });
  });

  it('should display warnings when present', async () => {
    const mockEligibilityResponse = {
      success: true,
      data: {
        eligible: true,
        reasons: [],
        missingRequirements: [],
        warnings: ['Document expires soon']
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEligibilityResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Document expires soon')).toBeInTheDocument();
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

  it('should retry eligibility check when retry button is clicked', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    const mockSuccessResponse = {
      success: true,
      data: { eligible: true, reasons: [], missingRequirements: [], warnings: [] }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Eligible to Apply')).toBeInTheDocument();
    });
  });

  it('should refresh status when refresh button is clicked', async () => {
    const mockEligibilityResponse = {
      success: true,
      data: {
        eligible: true,
        reasons: [],
        missingRequirements: [],
        warnings: []
      }
    };

    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockEligibilityResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Refresh Status')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Refresh Status'));

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should call onEligibilityChange callback when eligibility changes', async () => {
    const mockCallback = jest.fn();
    const mockEligibilityResponse = {
      success: true,
      data: {
        eligible: true,
        reasons: [],
        missingRequirements: [],
        warnings: []
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEligibilityResponse
    });

    renderComponent({}, { onEligibilityChange: mockCallback });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(mockEligibilityResponse.data);
    });
  });

  it('should not render when user or jobId is missing', () => {
    const { container } = renderComponent({
      auth: { user: null }
    });

    expect(container.firstChild).toBeNull();
  });

  it('should include authorization header in API requests', async () => {
    const mockEligibilityResponse = {
      success: true,
      data: { eligible: true, reasons: [], missingRequirements: [], warnings: [] }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEligibilityResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/integration/check-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          userId: mockUser.id,
          jobId: 'job123'
        })
      });
    });
  });

  it('should show Complete Profile button when not eligible', async () => {
    const mockEligibilityResponse = {
      success: true,
      data: {
        eligible: false,
        reasons: ['Profile incomplete'],
        missingRequirements: [],
        warnings: []
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEligibilityResponse
    });

    // Mock window.location
    delete window.location;
    window.location = { href: '' };

    renderComponent();

    await waitFor(() => {
      const completeButton = screen.getByText('Complete Profile');
      expect(completeButton).toBeInTheDocument();
      
      fireEvent.click(completeButton);
      expect(window.location.href).toBe('/profile/complete');
    });
  });
});