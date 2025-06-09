// client/src/components/integration/AdminVerificationQueue/AdminVerificationQueue.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AdminVerificationQueue from './AdminVerificationQueue';
import { VerificationProvider } from '../../utils/context/VerificationContext';
import * as verificationActions from '../../../redux/actions/verificationActions';
import integrationService from '../../../services/integrationService';

// Mock dependencies
jest.mock('../../../redux/actions/verificationActions');
jest.mock('../../../services/integrationService');

const mockStore = configureStore([thunk]);

// Mock verification data
const mockVerifications = [
  {
    id: '1',
    status: 'pending',
    createdAt: '2025-04-19T10:00:00Z',
    user: {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com'
    },
    document: {
      id: 'doc1',
      type: 'PASSPORT',
      name: 'passport.pdf'
    },
    assignedTo: null
  },
  {
    id: '2',
    status: 'approved',
    createdAt: '2025-04-18T10:00:00Z',
    user: {
      id: 'user2',
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    document: {
      id: 'doc2',
      type: 'NATIONAL_ID',
      name: 'id.jpg'
    },
    assignedTo: {
      id: 'admin1',
      name: 'Admin User'
    }
  }
];

const mockPagination = {
  page: 1,
  limit: 10,
  total: 2,
  pages: 1
};

const mockVerificationStats = {
  pending: 5,
  verified: 10,
  rejected: 2,
  total: 17
};

// Initial store state
const initialState = {
  verification: {
    verifications: mockVerifications,
    loading: false,
    error: null,
    pagination: mockPagination
  },
  auth: {
    user: {
      id: 'admin1',
      name: 'Admin User',
      role: 'admin'
    },
    token: 'mock-token'
  }
};

// Wrapper component with providers
const renderWithProviders = (component, store = mockStore(initialState)) => {
  const mockVerificationContext = {
    verifications: mockVerifications,
    verificationStats: mockVerificationStats,
    loadVerifications: jest.fn(),
    updateVerificationStatus: jest.fn(),
    isLoading: false,
    error: null
  };

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <VerificationProvider value={mockVerificationContext}>
          {component}
        </VerificationProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('AdminVerificationQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redux actions
    verificationActions.fetchVerifications = jest.fn().mockReturnValue(
      Promise.resolve({ type: 'FETCH_VERIFICATIONS_SUCCESS' })
    );
    verificationActions.verifyDocument = jest.fn().mockReturnValue(
      Promise.resolve({ type: 'UPDATE_VERIFICATION_SUCCESS' })
    );
    verificationActions.assignVerificationToSelf = jest.fn().mockReturnValue(
      Promise.resolve({ type: 'UPDATE_VERIFICATION_SUCCESS' })
    );
    verificationActions.clearVerificationError = jest.fn().mockReturnValue(
      { type: 'CLEAR_VERIFICATION_ERROR' }
    );

    // Mock integration service
    integrationService.sendJobStatusNotification = jest.fn().mockResolvedValue({});
  });

  describe('Component Rendering', () => {
    test('renders verification queue with title and stats', () => {
      renderWithProviders(<AdminVerificationQueue />);

      expect(screen.getByText('Verification Queue')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    test('renders verification table with correct headers', () => {
      renderWithProviders(<AdminVerificationQueue />);

      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Document Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Submitted')).toBeInTheDocument();
      expect(screen.getByText('Assigned To')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    test('renders verification rows with user data', () => {
      renderWithProviders(<AdminVerificationQueue />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('PASSPORT')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('NATIONAL_ID')).toBeInTheDocument();
    });

    test('displays loading state when loading is true', () => {
      const loadingState = {
        ...initialState,
        verification: {
          ...initialState.verification,
          loading: true,
          verifications: []
        }
      };

      renderWithProviders(<AdminVerificationQueue />, mockStore(loadingState));

      expect(screen.getByText('Loading verification queue...')).toBeInTheDocument();
    });

    test('displays error message when error exists', () => {
      const errorState = {
        ...initialState,
        verification: {
          ...initialState.verification,
          error: 'Failed to load verifications'
        }
      };

      renderWithProviders(<AdminVerificationQueue />, mockStore(errorState));

      expect(screen.getByText('Failed to load verifications')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('filters by status when status dropdown changes', async () => {
      renderWithProviders(<AdminVerificationQueue />);

      const statusSelect = screen.getByDisplayValue('Pending Review');
      fireEvent.change(statusSelect, { target: { value: 'approved' } });

      await waitFor(() => {
        expect(verificationActions.fetchVerifications).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          status: 'approved',
          documentType: '',
          search: '',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });

    test('filters by document type when document type dropdown changes', async () => {
      renderWithProviders(<AdminVerificationQueue />);

      const documentTypeSelect = screen.getByDisplayValue('All Types');
      fireEvent.change(documentTypeSelect, { target: { value: 'PASSPORT' } });

      await waitFor(() => {
        expect(verificationActions.fetchVerifications).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          status: 'pending',
          documentType: 'PASSPORT',
          search: '',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });

    test('searches when search input changes', async () => {
      renderWithProviders(<AdminVerificationQueue />);

      const searchInput = screen.getByPlaceholderText('Search by user name or document...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(verificationActions.fetchVerifications).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          status: 'pending',
          documentType: '',
          search: 'John',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });
  });

  describe('Verification Actions', () => {
    test('approves verification when approve button is clicked', async () => {
      renderWithProviders(<AdminVerificationQueue />);

      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);

      await waitFor(() => {
        expect(verificationActions.verifyDocument).toHaveBeenCalledWith('1', {
          status: 'approved',
          notes: ''
        });
      });

      expect(integrationService.sendJobStatusNotification).toHaveBeenCalledWith('1', {
        status: 'approved',
        message: 'Verification approved',
        adminId: 'admin1'
      });
    });

    test('assigns verification when assign button is clicked', async () => {
      renderWithProviders(<AdminVerificationQueue />);

      const assignButtons = screen.getAllByText('Assign to Me');
      fireEvent.click(assignButtons[0]);

      await waitFor(() => {
        expect(verificationActions.assignVerificationToSelf).toHaveBeenCalledWith('1');
      });
    });

    test('disables actions when processing', async () => {
      renderWithProviders(<AdminVerificationQueue />);

      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);

      // Button should be disabled during processing
      expect(approveButtons[0]).toBeDisabled();
    });
  });

  describe('Bulk Actions', () => {
    test('shows bulk actions when verifications are selected', () => {
      renderWithProviders(<AdminVerificationQueue />);

      const checkboxes = screen.getAllByRole('checkbox');
      // Select first verification (skip the "select all" checkbox)
      fireEvent.click(checkboxes[1]);

      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByText('Bulk Approve')).toBeInTheDocument();
      expect(screen.getByText('Bulk Assign')).toBeInTheDocument();
    });

    test('selects all verifications when select all is checked', () => {
      renderWithProviders(<AdminVerificationQueue />);

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    test('performs bulk approve action', async () => {
      renderWithProviders(<AdminVerificationQueue />);

      // Select first verification
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      // Click bulk approve
      const bulkApproveButton = screen.getByText('Bulk Approve');
      fireEvent.click(bulkApproveButton);

      await waitFor(() => {
        expect(verificationActions.verifyDocument).toHaveBeenCalledWith('1', {
          status: 'approved',
          notes: 'Bulk approval'
        });
      });
    });
  });

  describe('Pagination', () => {
    test('renders pagination controls', () => {
      renderWithProviders(<AdminVerificationQueue />);

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });

    test('disables previous button on first page', () => {
      renderWithProviders(<AdminVerificationQueue />);

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    test('disables next button on last page', () => {
      renderWithProviders(<AdminVerificationQueue />);

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    test('changes page when next button is clicked', async () => {
      const multiPageState = {
        ...initialState,
        verification: {
          ...initialState.verification,
          pagination: {
            page: 1,
            limit: 10,
            total: 20,
            pages: 2
          }
        }
      };

      renderWithProviders(<AdminVerificationQueue />, mockStore(multiPageState));

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(verificationActions.fetchVerifications).toHaveBeenCalledWith({
          page: 2,
          limit: 10,
          status: 'pending',
          documentType: '',
          search: '',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });
  });

  describe('Status Badge Rendering', () => {
    test('renders correct status badges', () => {
      renderWithProviders(<AdminVerificationQueue />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles verification update error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      verificationActions.verifyDocument.mockRejectedValue(new Error('Update failed'));

      renderWithProviders(<AdminVerificationQueue />);

      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update verification:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    test('handles assignment error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      verificationActions.assignVerificationToSelf.mockRejectedValue(new Error('Assignment failed'));

      renderWithProviders(<AdminVerificationQueue />);

      const assignButtons = screen.getAllByText('Assign to Me');
      fireEvent.click(assignButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to assign verification:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Component Cleanup', () => {
    test('clears error on unmount', () => {
      const { unmount } = renderWithProviders(<AdminVerificationQueue />);

      unmount();

      expect(verificationActions.clearVerificationError).toHaveBeenCalled();
    });
  });
});