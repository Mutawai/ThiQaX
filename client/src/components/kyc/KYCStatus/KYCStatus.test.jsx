/**
 * @file Tests for KYCStatus component - Sonnet style
 * @description Unit tests for KYC status display component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import KYCStatus from './KYCStatus';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock window.URL for downloads
global.URL.createObjectURL = jest.fn(() => 'blob:url');
global.URL.revokeObjectURL = jest.fn();

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { kycStatus: 'unverified', kycDetails: null, profile: null }, action) => {
        switch (action.type) {
          case 'KYC_STATUS_SUCCESS':
            return {
              ...state,
              kycStatus: action.payload.status,
              kycDetails: action.payload.details
            };
          default:
            return state;
        }
      }
    },
    preloadedState: initialState
  });
};

const renderWithProviders = (component, initialState = {}) => {
  const store = createMockStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    ),
    store
  };
};

describe('KYCStatus - Sonnet Style', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('Default State', () => {
    it('should render unverified status by default', () => {
      renderWithProviders(<KYCStatus />);

      expect(screen.getByText('Not Started')).toBeInTheDocument();
      expect(screen.getByText('You have not started the KYC verification process.')).toBeInTheDocument();
      expect(screen.getByText('Start Verification')).toBeInTheDocument();
    });
  });

  describe('Different Status States', () => {
    it('should render pending status correctly', () => {
      const initialState = {
        auth: {
          kycStatus: 'pending',
          kycDetails: null,
          profile: null
        }
      };

      renderWithProviders(<KYCStatus />, initialState);

      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('Your documents are being reviewed by our verification team.')).toBeInTheDocument();
      expect(screen.getByText('Estimated time: 1-2 business days')).toBeInTheDocument();
    });

    it('should render verified status with details', () => {
      const initialState = {
        auth: {
          kycStatus: 'verified',
          kycDetails: {
            verifiedAt: '2025-01-15T10:00:00Z',
            expiresAt: '2026-01-15T10:00:00Z',
            verificationId: 'KYC-123456789'
          },
          profile: null
        }
      };

      renderWithProviders(<KYCStatus />, initialState);

      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Your identity has been successfully verified.')).toBeInTheDocument();
      expect(screen.getByText('Download Certificate')).toBeInTheDocument();
      expect(screen.getByText('KYC-123456789')).toBeInTheDocument();
    });

    it('should render rejected status with reason', () => {
      const initialState = {
        auth: {
          kycStatus: 'rejected',
          kycDetails: {
            rejectionReason: 'Document quality is poor. Please upload clearer images.'
          },
          profile: null
        }
      };

      renderWithProviders(<KYCStatus />, initialState);

      expect(screen.getByText('Rejected')).toBeInTheDocument();
      expect(screen.getByText('Document quality is poor. Please upload clearer images.')).toBeInTheDocument();
      expect(screen.getByText('Resubmit Documents')).toBeInTheDocument();
    });

    it('should render incomplete status with missing documents', () => {
      const initialState = {
        auth: {
          kycStatus: 'incomplete',
          kycDetails: {
            missingDocuments: ['Passport', 'Utility Bill']
          },
          profile: null
        }
      };

      renderWithProviders(<KYCStatus />, initialState);

      expect(screen.getByText('Incomplete')).toBeInTheDocument();
      expect(screen.getByText('Passport')).toBeInTheDocument();
      expect(screen.getByText('Utility Bill')).toBeInTheDocument();
      expect(screen.getByText('Upload Missing Documents')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render compact view when compact prop is true', () => {
      const initialState = {
        auth: {
          kycStatus: 'verified',
          kycDetails: null,
          profile: null
        }
      };

      renderWithProviders(<KYCStatus compact={true} />, initialState);

      // Should show compact badge
      expect(screen.getByText('Verified')).toBeInTheDocument();
      // Should not show full description
      expect(screen.queryByText('Your identity has been successfully verified.')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call refresh when refresh button is clicked', async () => {
      const initialState = {
        auth: {
          kycStatus: 'verified',
          kycDetails: null,
          profile: null
        }
      };

      renderWithProviders(<KYCStatus />, initialState);

      const refreshButton = screen.getByRole('button', { name: /refresh status/i });
      fireEvent.click(refreshButton);

      // Button should be disabled during refresh
      expect(refreshButton).toBeDisabled();
    });

    it('should handle certificate download', async () => {
      const initialState = {
        auth: {
          kycStatus: 'verified',
          kycDetails: {
            verifiedAt: '2025-01-15T10:00:00Z',
            expiresAt: '2026-01-15T10:00:00Z',
            verificationId: 'KYC-123456789'
          },
          profile: null
        }
      };

      // Mock successful blob response
      fetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock pdf content'], { type: 'application/pdf' }))
      });

      // Mock document.createElement and appendChild
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      renderWithProviders(<KYCStatus />, initialState);

      const downloadButton = screen.getByText('Download Certificate');
      fireEvent.click(downloadButton);

      // Verify the download process
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(fetch).toHaveBeenCalledWith('/api/kyc/certificate', expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      }));

      // Cleanup mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should call onStartVerification when provided', () => {
      const mockStartVerification = jest.fn();
      const initialState = {
        auth: {
          kycStatus: 'unverified',
          kycDetails: null,
          profile: null
        }
      };

      renderWithProviders(<KYCStatus onStartVerification={mockStartVerification} />, initialState);

      const startButton = screen.getByText('Start Verification');
      fireEvent.click(startButton);

      expect(mockStartVerification).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error and allow dismissal', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const initialState = {
        auth: {
          kycStatus: 'verified',
          kycDetails: null,
          profile: null
        }
      };

      renderWithProviders(<KYCStatus />, initialState);

      const refreshButton = screen.getByRole('button', { name: /refresh status/i });
      fireEvent.click(refreshButton);

      // Wait for error to appear
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if error is displayed
      expect(screen.getByText(/network error/i)).toBeInTheDocument();

      // Dismiss error
      const dismissButton = screen.getByText('✕');
      fireEvent.click(dismissButton);

      // Error should be gone
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });
  });

  describe('Actions Hidden', () => {
    it('should not show action buttons when showActions is false', () => {
      const initialState = {
        auth: {
          kycStatus: 'unverified',
          kycDetails: null,
          profile: null
        }
      };

      renderWithProviders(<KYCStatus showActions={false} />, initialState);

      expect(screen.queryByText('Start Verification')).not.toBeInTheDocument();
    });
  });
});