// client/src/components/integration/DocumentExpirationMonitor/DocumentExpirationMonitor.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import DocumentExpirationMonitor from './DocumentExpirationMonitor';
import integrationService from '../../../services/integration.service';
import documentService from '../../../services/document.service';

jest.mock('../../../services/integration.service');
jest.mock('../../../services/document.service');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 'user123', role: 'jobSeeker' } }) => state
    }
  });
};

// Test data
const createMockDocument = (title, type, daysUntilExpiry) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);
  
  return {
    _id: `doc_${title.replace(/\s+/g, '_').toLowerCase()}`,
    title,
    type,
    expiryDate: expiryDate.toISOString(),
    description: `${title} document`,
    fileUrl: `https://example.com/${title.toLowerCase()}.pdf`
  };
};

const mockDocuments = [
  createMockDocument('Passport', 'IDENTIFICATION', -5), // Expired 5 days ago
  createMockDocument('Work Permit', 'LEGAL', 3), // Expires in 3 days (critical)
  createMockDocument('Medical Certificate', 'MEDICAL', 15), // Expires in 15 days (high)
  createMockDocument('Degree Certificate', 'EDUCATION', 45), // Expires in 45 days (medium)
  createMockDocument('Experience Letter', 'EXPERIENCE', 90) // Expires in 90 days (not shown)
];

describe('DocumentExpirationMonitor', () => {
  let store;
  let mockOnExpirationFound;

  beforeEach(() => {
    store = createMockStore();
    mockOnExpirationFound = jest.fn();
    
    documentService.getUserDocuments.mockResolvedValue({
      data: mockDocuments
    });
    
    integrationService.checkDocumentExpirations.mockResolvedValue({
      data: { checked: 5, notified: 2 }
    });
    
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onExpirationFound: mockOnExpirationFound
    };

    return render(
      <Provider store={store}>
        <DocumentExpirationMonitor {...defaultProps} {...props} />
      </Provider>
    );
  };

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      renderComponent();
      expect(screen.getByText('Checking document expirations...')).toBeInTheDocument();
    });

    it('should render document expiration warnings', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Passport')).toBeInTheDocument();
        expect(screen.getByText('Work Permit')).toBeInTheDocument();
        expect(screen.getByText('Medical Certificate')).toBeInTheDocument();
        expect(screen.getByText('Degree Certificate')).toBeInTheDocument();
      });
    });

    it('should not show documents expiring beyond 60 days', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.queryByText('Experience Letter')).not.toBeInTheDocument();
      });
    });

    it('should show alert badge when documents need attention', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/document\(s\) need attention/)).toBeInTheDocument();
      });
    });
  });

  describe('Urgency Classification', () => {
    it('should classify expired documents correctly', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Expired 5 day(s) ago')).toBeInTheDocument();
      });
    });

    it('should classify critical documents (≤7 days)', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Expires in 3 day(s)')).toBeInTheDocument();
      });
    });

    it('should classify high urgency documents (≤30 days)', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Expires in 15 day(s)')).toBeInTheDocument();
      });
    });

    it('should sort documents by urgency (most urgent first)', async () => {
      renderComponent();
      
      await waitFor(() => {
        const documentCards = screen.getAllByText(/Expires|Expired/);
        expect(documentCards[0]).toHaveTextContent('Expired 5 day(s) ago'); // Most urgent
        expect(documentCards[1]).toHaveTextContent('Expires in 3 day(s)'); // Second most urgent
      });
    });
  });

  describe('Manual Expiration Check', () => {
    it('should trigger manual expiration check', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Check Now')).toBeInTheDocument();
      });

      const checkButton = screen.getByText('Check Now');
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(integrationService.checkDocumentExpirations).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          'Expiration check complete: 2 notifications sent'
        );
      });
    });

    it('should show loading state during check', async () => {
      let resolvePromise;
      const checkPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      integrationService.checkDocumentExpirations.mockReturnValue(checkPromise);
      
      renderComponent();
      
      await waitFor(() => {
        const checkButton = screen.getByText('Check Now');
        fireEvent.click(checkButton);
      });

      expect(screen.getByText('Checking...')).toBeInTheDocument();
      
      resolvePromise({ data: { checked: 5, notified: 2 } });
    });

    it('should handle check errors gracefully', async () => {
      integrationService.checkDocumentExpirations.mockRejectedValue(
        new Error('Check failed')
      );
      
      renderComponent();
      
      await waitFor(() => {
        const checkButton = screen.getByText('Check Now');
        fireEvent.click(checkButton);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to check document expirations');
      });
    });
  });

  describe('Auto Refresh', () => {
    it('should auto-refresh when enabled', async () => {
      renderComponent({ autoRefresh: true, refreshInterval: 1000 });
      
      await waitFor(() => {
        expect(documentService.getUserDocuments).toHaveBeenCalledTimes(1);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(documentService.getUserDocuments).toHaveBeenCalledTimes(2);
      });
    });

    it('should not auto-refresh when disabled', async () => {
      renderComponent({ autoRefresh: false });
      
      await waitFor(() => {
        expect(documentService.getUserDocuments).toHaveBeenCalledTimes(1);
      });

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(documentService.getUserDocuments).toHaveBeenCalledTimes(1);
    });
  });

  describe('Notifications', () => {
    it('should display and dismiss notifications', async () => {
      renderComponent();
      
      await waitFor(() => {
        const checkButton = screen.getByText('Check Now');
        fireEvent.click(checkButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Checked 5 documents, sent 2 notifications/)).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      expect(screen.queryByText(/Checked 5 documents/)).not.toBeInTheDocument();
    });

    it('should call onExpirationFound callback', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(mockOnExpirationFound).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              title: 'Passport',
              urgency: 'expired'
            }),
            expect.objectContaining({
              title: 'Work Permit',
              urgency: 'critical'
            })
          ])
        );
      });
    });
  });

  describe('Good News State', () => {
    it('should show good news when no documents are expiring', async () => {
      documentService.getUserDocuments.mockResolvedValue({
        data: [] // No documents
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('All documents are up to date')).toBeInTheDocument();
        expect(screen.getByText('No documents are expiring in the next 60 days.')).toBeInTheDocument();
      });
    });

    it('should show monitoring count', async () => {
      documentService.getUserDocuments.mockResolvedValue({
        data: [createMockDocument('Valid Document', 'OTHER', 120)] // Expires beyond 60 days
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Monitoring 1 document(s)')).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('should show action buttons when enabled', async () => {
      renderComponent({ showActions: true });
      
      await waitFor(() => {
        expect(screen.getAllByText('View Document').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Replace|Renew/).length).toBeGreaterThan(0);
      });
    });

    it('should hide action buttons when disabled', async () => {
      renderComponent({ showActions: false });
      
      await waitFor(() => {
        expect(screen.queryByText('View Document')).not.toBeInTheDocument();
        expect(screen.queryByText(/Replace|Renew/)).not.toBeInTheDocument();
      });
    });

    it('should handle view document action', async () => {
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', { value: mockOpen, writable: true });
      
      renderComponent({ showActions: true });
      
      await waitFor(() => {
        const viewButtons = screen.getAllByText('View Document');
        fireEvent.click(viewButtons[0]);
      });

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('.pdf'),
        '_blank'
      );
    });

    it('should handle renew/replace action', async () => {
      renderComponent({ showActions: true });
      
      await waitFor(() => {
        const renewButtons = screen.getAllByText(/Replace|Renew/);
        fireEvent.click(renewButtons[0]);
      });

      expect(toast.info).toHaveBeenCalledWith('Navigate to document renewal page');
    });
  });

  describe('Summary Statistics', () => {
    it('should display correct statistics', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Total documents
        expect(screen.getByText('3')).toBeInTheDocument(); // Expiring soon (not expired)
        expect(screen.getByText('1')).toBeInTheDocument(); // Expired
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      documentService.getUserDocuments.mockRejectedValue(new Error('API Error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      renderComponent();
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load documents:',
          expect.any(Error)
        );
        expect(toast.error).toHaveBeenCalledWith('Failed to load documents');
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', async () => {
      const { container } = renderComponent({ compact: true });
      
      await waitFor(() => {
        expect(container.querySelector('.compact')).toBeInTheDocument();
      });
    });
  });

  describe('Custom User ID', () => {
    it('should use provided user ID', async () => {
      renderComponent({ userId: 'custom-user-123' });
      
      await waitFor(() => {
        expect(documentService.getUserDocuments).toHaveBeenCalledWith('custom-user-123');
      });
    });

    it('should use current user ID when none provided', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(documentService.getUserDocuments).toHaveBeenCalledWith('user123');
      });
    });
  });
});