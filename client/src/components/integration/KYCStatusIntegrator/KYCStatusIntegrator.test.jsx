/**
 * @file Test suite for KYCStatusIntegrator component
 * @description Unit tests for KYC status integration functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import KYCStatusIntegrator from './KYCStatusIntegrator';

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

describe('KYCStatusIntegrator', () => {
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
    kycVerified: false
  };

  const renderComponent = (storeState = {}, props = {}) => {
    const store = createMockStore({
      auth: { user: mockUser },
      profile: { profile: mockProfile },
      ...storeState
    });

    return render(
      <Provider store={store}>
        <KYCStatusIntegrator {...props} />
      </Provider>
    );
  };

  it('should render loading state initially', async () => {
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderComponent();
    
    expect(screen.getByText('Loading KYC status...')).toBeInTheDocument();
  });

  it('should display verified status correctly', async () => {
    const mockKYCResponse = {
      success: true,
      data: {
        overallStatus: 'VERIFIED',
        identityDocument: { status: 'VERIFIED' },
        addressDocument: { status: 'VERIFIED' },
        lastUpdated: '2025-01-15T10:00:00Z',
        nextActionRequired: null
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockKYCResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Your identity has been successfully verified')).toBeInTheDocument();
    });
  });

  it('should display pending status correctly', async () => {
    const mockKYCResponse = {
      success: true,
      data: {
        overallStatus: 'PENDING',
        identityDocument: { status: 'PENDING' },
        addressDocument: { status: 'PENDING' },
        lastUpdated: '2025-01-15T10:00:00Z',
        nextActionRequired: 'Wait for review completion'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockKYCResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('🔄')).toBeInTheDocument();
      expect(screen.getByText('Your documents are being reviewed')).toBeInTheDocument();
      expect(screen.getByText('Wait for review completion')).toBeInTheDocument();
    });
  });

  it('should display rejected status with resubmit option', async () => {
    const mockKYCResponse = {
      success: true,
      data: {
        overallStatus: 'REJECTED',
        identityDocument: { status: 'REJECTED' },
        addressDocument: { status: 'VERIFIED' },
        lastUpdated: '2025-01-15T10:00:00Z',
        nextActionRequired: 'Resubmit identity document'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockKYCResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Rejected')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('Resubmit Documents')).toBeInTheDocument();
    });
  });

  it('should display not started status with start verification option', async () => {
    const mockKYCResponse = {
      success: true,
      data: {
        overallStatus: 'NOT_STARTED',
        identityDocument: null,
        addressDocument: null,
        lastUpdated: null,
        nextActionRequired: 'Upload identity and address documents'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockKYCResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Not Started')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('Start Verification')).toBeInTheDocument();
    });
  });

  it('should display document status details when available', async () => {
    const mockKYCResponse = {
      success: true,
      data: {
        overallStatus: 'INCOMPLETE',
        identityDocument: { status: 'VERIFIED' },
        addressDocument: { status: 'PENDING' },
        lastUpdated: '2025-01-15T10:00:00Z',
        nextActionRequired: 'Address document under review'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockKYCResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Identity Document:')).toBeInTheDocument();
      expect(screen.getByText('Address Document:')).toBeInTheDocument();
      expect(screen.getAllByText('✅')[1]).toBeInTheDocument(); // Second ✅ for verified identity
      expect(screen.getByText('🔄')).toBeInTheDocument(); // Pending address doc
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

  it('should handle profile sync successfully', async () => {
    const mockKYCResponse = {
      success: true,
      data: {
        overallStatus: 'VERIFIED',
        identityDocument: { status: 'VERIFIED' },
        addressDocument: { status: 'VERIFIED' },
        lastUpdated: '2025-01-15T10:00:00Z'
      }
    };

    const mockSyncResponse = {
      success: true,
      message: 'Profile synced successfully'
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockKYCResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSyncResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockKYCResponse
      });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Sync Profile')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sync Profile'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/integration/sync-kyc-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({ userId: mockUser.id })
      });
    });
  });

  it('should call onStatusChange callback when status changes', async () => {
    const mockCallback = jest.fn();
    const mockKYCResponse = {
      success: true,
      data: {
        overallStatus: 'VERIFIED',
        identityDocument: { status: 'VERIFIED' },
        addressDocument: { status: 'VERIFIED' }
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockKYCResponse
    });

    renderComponent({}, { onStatusChange: mockCallback });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(mockKYCResponse.data);
    });
  });

  it('should not show details when showDetails is false', async () => {
    const mockKYCResponse = {
      success: true,
      data: {
        overallStatus: 'VERIFIED',
        identityDocument: { status: 'VERIFIED' },
        addressDocument: { status: 'VERIFIED' },
        lastUpdated: '2025-01-15T10:00:00Z'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockKYCResponse
    });

    renderComponent({}, { showDetails: false });

    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.queryByText('Document Status:')).not.toBeInTheDocument();
    });
  });

  it('should refresh status when refresh button is clicked', async () => {
    const mockKYCResponse = {
      success: true,
      data: {
        overallStatus: 'VERIFIED',
        identityDocument: { status: 'VERIFIED' },
        addressDocument: { status: 'VERIFIED' }
      }
    };

    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockKYCResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Refresh Status')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Refresh Status'));

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should navigate to verification page when start verification is clicked', async () => {
    const mockKYCResponse = {
      success: true,
      data: {
        overallStatus: 'NOT_STARTED',
        identityDocument: null,
        addressDocument: null
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockKYCResponse
    });

    // Mock window.location
    delete window.location;
    window.location = { href: '' };

    renderComponent();

    await waitFor(() => {
      const startButton = screen.getByText('Start Verification');
      expect(startButton).toBeInTheDocument();
      
      fireEvent.click(startButton);
      expect(window.location.href).toBe('/kyc/verify');
    });
  });

  it('should display last updated time correctly', async () => {
    const mockKYCResponse = {
      success: true,
      data: {
        overallStatus: 'VERIFIED',
        lastUpdated: '2025-01-15T10:30:00Z'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockKYCResponse
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Last Updated:')).toBeInTheDocument();
      expect(screen.getByText(/1\/15\/2025 at/)).toBeInTheDocument();
    });
  });
});