// client/src/components/integration/AdminAuditLogger/AdminAuditLogger.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AdminAuditLogger from './AdminAuditLogger';
import * as auditActions from '../../../redux/actions/auditActions';
import integrationService from '../../../services/integrationService';

// Mock dependencies
jest.mock('../../../redux/actions/auditActions');
jest.mock('../../../services/integrationService');

const mockStore = configureStore([thunk]);

// Mock audit log data
const mockAuditLogs = [
  {
    id: 'log1',
    action: 'USER_LOGIN',
    createdAt: '2025-04-19T10:00:00Z',
    user: {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com'
    },
    targetUser: null,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: {
      loginMethod: 'email',
      sessionId: 'sess_123'
    }
  },
  {
    id: 'log2',
    action: 'ROLE_CHANGE',
    createdAt: '2025-04-18T15:30:00Z',
    user: {
      id: 'admin1',
      name: 'Admin User',
      email: 'admin@example.com'
    },
    targetUser: {
      id: 'user2',
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    details: {
      previousRole: 'jobSeeker',
      newRole: 'agent',
      reason: 'Promotion'
    }
  },
  {
    id: 'log3',
    action: 'SECURITY_EVENT',
    createdAt: '2025-04-17T09:15:00Z',
    user: null,
    targetUser: {
      id: 'user3',
      name: 'Bob Wilson',
      email: 'bob@example.com'
    },
    ipAddress: '10.0.0.1',
    userAgent: null,
    details: {
      eventType: 'failed_login_attempt',
      attempts: 5
    }
  }
];

const mockPagination = {
  page: 1,
  limit: 20,
  total: 3,
  pages: 1
};

// Initial store state
const initialState = {
  audit: {
    auditLogs: mockAuditLogs,
    loading: false,
    error: null,
    pagination: mockPagination
  },
  auth: {
    user: {
      id: 'admin1',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@example.com'
    },
    token: 'mock-token'
  }
};

// Wrapper component with providers
const renderWithProviders = (component, store = mockStore(initialState)) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('AdminAuditLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redux actions
    auditActions.fetchAuditLogs = jest.fn().mockReturnValue(
      Promise.resolve({ type: 'FETCH_AUDIT_LOGS_SUCCESS' })
    );
    auditActions.exportAuditLogs = jest.fn().mockReturnValue(
      Promise.resolve({ type: 'EXPORT_AUDIT_LOGS_SUCCESS' })
    );
    auditActions.clearAuditError = jest.fn().mockReturnValue(
      { type: 'CLEAR_AUDIT_ERROR' }
    );

    // Mock integration service
    integrationService.logAuditEvent = jest.fn().mockResolvedValue({});

    // Mock timers for real-time updates
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders audit log viewer with title and controls', () => {
      renderWithProviders(<AdminAuditLogger />);

      expect(screen.getByText('Audit Log Viewer')).toBeInTheDocument();
      expect(screen.getByText('Real-time updates')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });

    test('renders audit logs table with correct headers', () => {
      renderWithProviders(<AdminAuditLogger />);

      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Target')).toBeInTheDocument();
      expect(screen.getByText('IP Address')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    test('renders audit log entries with formatted data', () => {
      renderWithProviders(<AdminAuditLogger />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    test('displays loading state when loading is true', () => {
      const loadingState = {
        ...initialState,
        audit: {
          ...initialState.audit,
          loading: true,
          auditLogs: []
        }
      };

      renderWithProviders(<AdminAuditLogger />, mockStore(loadingState));

      expect(screen.getByText('Loading audit logs...')).toBeInTheDocument();
    });

    test('displays error message when error exists', () => {
      const errorState = {
        ...initialState,
        audit: {
          ...initialState.audit,
          error: 'Failed to load audit logs'
        }
      };

      renderWithProviders(<AdminAuditLogger />, mockStore(errorState));

      expect(screen.getByText('Failed to load audit logs')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('filters by action when action dropdown changes', async () => {
      renderWithProviders(<AdminAuditLogger />);

      const actionSelect = screen.getByDisplayValue('All Actions');
      fireEvent.change(actionSelect, { target: { value: 'USER_LOGIN' } });

      await waitFor(() => {
        expect(auditActions.fetchAuditLogs).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          action: 'USER_LOGIN',
          userId: '',
          startDate: '',
          endDate: '',
          search: '',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });

    test('filters by date range when date inputs change', async () => {
      renderWithProviders(<AdminAuditLogger />);

      const startDateInput = screen.getByDisplayValue('');
      fireEvent.change(startDateInput, { target: { value: '2025-04-19' } });

      await waitFor(() => {
        expect(auditActions.fetchAuditLogs).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          action: '',
          userId: '',
          startDate: '2025-04-19T00:00:00.000Z',
          endDate: '',
          search: '',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });

    test('searches when search input changes', async () => {
      renderWithProviders(<AdminAuditLogger />);

      const searchInput = screen.getByPlaceholderText('Search logs...');
      fireEvent.change(searchInput, { target: { value: 'login' } });

      await waitFor(() => {
        expect(auditActions.fetchAuditLogs).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          action: '',
          userId: '',
          startDate: '',
          endDate: '',
          search: 'login',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });
  });

  describe('Quick Date Filters', () => {
    test('applies today filter when today button is clicked', async () => {
      renderWithProviders(<AdminAuditLogger />);

      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);

      await waitFor(() => {
        expect(auditActions.fetchAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: expect.stringMatching(/\d{4}-\d{2}-\d{2}T00:00:00.000Z/)
          })
        );
      });
    });

    test('applies last 7 days filter when week button is clicked', async () => {
      renderWithProviders(<AdminAuditLogger />);

      const weekButton = screen.getByText('Last 7 days');
      fireEvent.click(weekButton);

      await waitFor(() => {
        expect(auditActions.fetchAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
          })
        );
      });
    });

    test('clears date filter when all time button is clicked', async () => {
      renderWithProviders(<AdminAuditLogger />);

      const allTimeButton = screen.getByText('All time');
      fireEvent.click(allTimeButton);

      await waitFor(() => {
        expect(auditActions.fetchAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '',
            endDate: ''
          })
        );
      });
    });
  });

  describe('Export Functionality', () => {
    test('exports CSV when export CSV button is clicked', async () => {
      renderWithProviders(<AdminAuditLogger />);

      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(auditActions.exportAuditLogs).toHaveBeenCalledWith({
          format: 'csv',
          action: '',
          userId: '',
          startDate: '',
          endDate: '',
          search: '',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });

      expect(integrationService.logAuditEvent).toHaveBeenCalledWith({
        action: 'DATA_EXPORT',
        details: {
          exportType: 'audit_logs',
          format: 'csv',
          filters: expect.any(Object),
          exportedBy: 'admin1'
        }
      });
    });

    test('exports JSON when export JSON button is clicked', async () => {
      renderWithProviders(<AdminAuditLogger />);

      const exportButton = screen.getByText('Export JSON');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(auditActions.exportAuditLogs).toHaveBeenCalledWith({
          format: 'json',
          action: '',
          userId: '',
          startDate: '',
          endDate: '',
          search: '',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });

    test('shows loading state during export', async () => {
      auditActions.exportAuditLogs.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders(<AdminAuditLogger />);

      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    test('enables real-time polling when checkbox is checked', async () => {
      renderWithProviders(<AdminAuditLogger />);

      const realTimeCheckbox = screen.getByRole('checkbox');
      fireEvent.click(realTimeCheckbox);

      // Fast-forward time to trigger polling
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(auditActions.fetchAuditLogs).toHaveBeenCalledTimes(2); // Initial load + polling
      });
    });

    test('disables real-time polling when checkbox is unchecked', async () => {
      renderWithProviders(<AdminAuditLogger />);

      const realTimeCheckbox = screen.getByRole('checkbox');
      
      // Enable then disable
      fireEvent.click(realTimeCheckbox);
      fireEvent.click(realTimeCheckbox);

      // Fast-forward time
      jest.advanceTimersByTime(20000);

      await waitFor(() => {
        expect(auditActions.fetchAuditLogs).toHaveBeenCalledTimes(1); // Only initial load
      });
    });
  });

  describe('Log Detail Modal', () => {
    test('opens detail modal when view button is clicked', () => {
      renderWithProviders(<AdminAuditLogger />);

      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);

      expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    test('displays log details in modal', () => {
      renderWithProviders(<AdminAuditLogger />);

      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);

      expect(screen.getByText('log1')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).toBeInTheDocument();
    });

    test('displays target user information when available', () => {
      renderWithProviders(<AdminAuditLogger />);

      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[1]); // Second log has target user

      expect(screen.getByText('Target User')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    test('displays additional details as JSON when available', () => {
      renderWithProviders(<AdminAuditLogger />);

      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);

      expect(screen.getByText('Additional Details')).toBeInTheDocument();
      expect(screen.getByText(/"loginMethod": "email"/)).toBeInTheDocument();
    });

    test('closes modal when close button is clicked', () => {
      renderWithProviders(<AdminAuditLogger />);

      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Audit Log Details')).not.toBeInTheDocument();
    });

    test('closes modal when close modal button is clicked', () => {
      renderWithProviders(<AdminAuditLogger />);

      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Audit Log Details')).not.toBeInTheDocument();
    });
  });

  describe('Action Badges', () => {
    test('renders action badges with correct text', () => {
      renderWithProviders(<AdminAuditLogger />);

      expect(screen.getByText('USER LOGIN')).toBeInTheDocument();
      expect(screen.getByText('ROLE CHANGE')).toBeInTheDocument();
      expect(screen.getByText('SECURITY EVENT')).toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    test('formats timestamps correctly', () => {
      renderWithProviders(<AdminAuditLogger />);

      // Check that formatted timestamps are displayed
      expect(screen.getByText(/Apr \d{2}, \d{4}/)).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    test('renders pagination controls', () => {
      renderWithProviders(<AdminAuditLogger />);

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 1 (3 total)')).toBeInTheDocument();
    });

    test('disables previous button on first page', () => {
      renderWithProviders(<AdminAuditLogger />);

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    test('disables next button on last page', () => {
      renderWithProviders(<AdminAuditLogger />);

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    test('changes page when next button is clicked', async () => {
      const multiPageState = {
        ...initialState,
        audit: {
          ...initialState.audit,
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            pages: 2
          }
        }
      };

      renderWithProviders(<AdminAuditLogger />, mockStore(multiPageState));

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(auditActions.fetchAuditLogs).toHaveBeenCalledWith({
          page: 2,
          limit: 20,
          action: '',
          userId: '',
          startDate: '',
          endDate: '',
          search: '',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });
  });

  describe('User Display', () => {
    test('displays system for logs without user', () => {
      renderWithProviders(<AdminAuditLogger />);

      // Third log has no user
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    test('displays user information when available', () => {
      renderWithProviders(<AdminAuditLogger />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    test('displays target user when available', () => {
      renderWithProviders(<AdminAuditLogger />);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      auditActions.fetchAuditLogs.mockRejectedValue(new Error('Fetch failed'));

      renderWithProviders(<AdminAuditLogger />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load audit logs:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    test('handles export error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      auditActions.exportAuditLogs.mockRejectedValue(new Error('Export failed'));

      renderWithProviders(<AdminAuditLogger />);

      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to export audit logs:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    test('handles real-time update error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      auditActions.fetchAuditLogs.mockResolvedValueOnce({ type: 'SUCCESS' })
        .mockRejectedValue(new Error('Polling failed'));

      renderWithProviders(<AdminAuditLogger />);

      const realTimeCheckbox = screen.getByRole('checkbox');
      fireEvent.click(realTimeCheckbox);

      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to refresh audit logs:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Component Cleanup', () => {
    test('clears error on unmount', () => {
      const { unmount } = renderWithProviders(<AdminAuditLogger />);

      unmount();

      expect(auditActions.clearAuditError).toHaveBeenCalled();
    });

    test('clears polling interval on unmount', () => {
      const { unmount } = renderWithProviders(<AdminAuditLogger />);

      const realTimeCheckbox = screen.getByRole('checkbox');
      fireEvent.click(realTimeCheckbox);

      unmount();

      // Verify no more polling after unmount
      jest.advanceTimersByTime(20000);
      expect(auditActions.fetchAuditLogs).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for form controls', () => {
      renderWithProviders(<AdminAuditLogger />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    test('modal is properly accessible', () => {
      renderWithProviders(<AdminAuditLogger />);

      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});