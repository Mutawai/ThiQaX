// client/src/components/integration/ApplicationVerificationStatus/ApplicationVerificationStatus.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ApplicationVerificationStatus from './ApplicationVerificationStatus';
import integrationService from '../../../services/integration.service';

jest.mock('../../../services/integration.service');

const createMockStore = (userRole = 'jobSeeker') => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 'user123', role: userRole } }) => state
    }
  });
};

const mockDocuments = [
  {
    _id: 'doc1',
    title: 'National ID',
    type: 'IDENTIFICATION',
    verificationStatus: 'VERIFIED',
    verificationNotes: 'Document verified successfully',
    createdAt: '2024-01-15T10:00:00Z',
    verifiedAt: '2024-01-16T10:00:00Z'
  },
  {
    _id: 'doc2',
    title: 'University Degree',
    type: 'EDUCATION',
    verificationStatus: 'PENDING',
    createdAt: '2024-01-15T11:00:00Z'
  },
  {
    _id: 'doc3',
    title: 'Work Experience Letter',
    type: 'EXPERIENCE',
    verificationStatus: 'REJECTED',
    rejectionReason: 'Document is unclear',
    createdAt: '2024-01-15T12:00:00Z',
    verifiedAt: '2024-01-16T12:00:00Z'
  }
];

describe('ApplicationVerificationStatus', () => {
  let store;
  let mockOnStatusUpdate;

  beforeEach(() => {
    store = createMockStore();
    mockOnStatusUpdate = jest.fn();
    
    integrationService.checkKycStatus.mockResolvedValue({
      data: { verified: true, documentsCount: 3 }
    });
    
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      applicationId: 'app123',
      documents: mockDocuments,
      onStatusUpdate: mockOnStatusUpdate
    };

    return render(
      <Provider store={store}>
        <ApplicationVerificationStatus {...defaultProps} {...props} />
      </Provider>
    );
  };

  describe('Component Rendering', () => {
    it('should render verification status for all documents', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('National ID')).toBeInTheDocument();
        expect(screen.getByText('University Degree')).toBeInTheDocument();
        expect(screen.getByText('Work Experience Letter')).toBeInTheDocument();
      });
    });

    it('should display overall status', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('ISSUES FOUND')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      renderComponent();
      expect(screen.getByText('Loading verification status...')).toBeInTheDocument();
    });

    it('should render in compact mode', async () => {
      const { container } = renderComponent({ compact: true });
      
      await waitFor(() => {
        expect(container.querySelector('.compact')).toBeInTheDocument();
      });
    });
  });

  describe('Status Display', () => {
    it('should show correct status badges', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('VERIFIED')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.getByText('REJECTED')).toBeInTheDocument();
      });
    });

    it('should display verification notes', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Document verified successfully')).toBeInTheDocument();
      });
    });

    it('should display rejection reason', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Document is unclear')).toBeInTheDocument();
      });
    });

    it('should calculate overall status correctly for fully verified', async () => {
      const verifiedDocs = mockDocuments.map(doc => ({
        ...doc,
        verificationStatus: 'VERIFIED'
      }));
      
      renderComponent({ documents: verifiedDocs });
      
      await waitFor(() => {
        expect(screen.getByText('FULLY VERIFIED')).toBeInTheDocument();
      });
    });
  });

  describe('Timeline Display', () => {
    it('should show timeline when enabled', async () => {
      renderComponent({ showTimeline: true });
      
      await waitFor(() => {
        expect(screen.getByText('Document Uploaded')).toBeInTheDocument();
        expect(screen.getByText('Document Verified')).toBeInTheDocument();
      });
    });

    it('should hide timeline when disabled', async () => {
      renderComponent({ showTimeline: false });
      
      await waitFor(() => {
        expect(screen.queryByText('Document Uploaded')).not.toBeInTheDocument();
      });
    });
  });

  describe('Status Updates', () => {
    it('should show update buttons for admin users', async () => {
      store = createMockStore('admin');
      renderComponent({ allowStatusUpdate: true });
      
      await waitFor(() => {
        const updateButtons = screen.getAllByText('Update Status');
        expect(updateButtons.length).toBeGreaterThan(0);
      });
    });

    it('should not show update buttons for regular users', async () => {
      renderComponent({ allowStatusUpdate: true });
      
      await waitFor(() => {
        expect(screen.queryByText('Update Status')).not.toBeInTheDocument();
      });
    });

    it('should open update form when update button is clicked', async () => {
      store = createMockStore('admin');
      renderComponent({ allowStatusUpdate: true });
      
      await waitFor(() => {
        const updateButton = screen.getAllByText('Update Status')[0];
        fireEvent.click(updateButton);
      });

      expect(screen.getByText('Update Verification Status')).toBeInTheDocument();
      expect(screen.getByLabelText('New Status:')).toBeInTheDocument();
    });

    it('should handle status update submission', async () => {
      store = createMockStore('admin');
      integrationService.updateDocumentVerification.mockResolvedValue({
        data: { ...mockDocuments[0], verificationStatus: 'VERIFIED' }
      });
      
      renderComponent({ allowStatusUpdate: true });
      
      await waitFor(() => {
        const updateButton = screen.getAllByText('Update Status')[0];
        fireEvent.click(updateButton);
      });

      // Fill form
      const statusSelect = screen.getByLabelText('New Status:');
      fireEvent.change(statusSelect, { target: { value: 'VERIFIED' } });

      const notesTextarea = screen.getByLabelText('Verification Notes:');
      fireEvent.change(notesTextarea, { target: { value: 'Looks good' } });

      // Submit
      const submitButton = screen.getByText('Update Status');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(integrationService.updateDocumentVerification).toHaveBeenCalledWith(
          'doc1',
          {
            verificationStatus: 'VERIFIED',
            verificationNotes: 'Looks good'
          }
        );
      });
    });

    it('should require rejection reason when rejecting', async () => {
      store = createMockStore('admin');
      renderComponent({ allowStatusUpdate: true });
      
      await waitFor(() => {
        const updateButton = screen.getAllByText('Update Status')[0];
        fireEvent.click(updateButton);
      });

      // Select rejected status
      const statusSelect = screen.getByLabelText('New Status:');
      fireEvent.change(statusSelect, { target: { value: 'REJECTED' } });

      // Rejection reason field should appear
      expect(screen.getByLabelText('Rejection Reason:')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no documents provided', async () => {
      renderComponent({ documents: [] });
      
      await waitFor(() => {
        expect(screen.getByText('No documents to verify')).toBeInTheDocument();
        expect(screen.getByText('Upload documents to begin verification process')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      integrationService.checkKycStatus.mockRejectedValue(new Error('API Error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      renderComponent();
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load verification data:',
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle update errors gracefully', async () => {
      store = createMockStore('admin');
      integrationService.updateDocumentVerification.mockRejectedValue(new Error('Update failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      renderComponent({ allowStatusUpdate: true });
      
      await waitFor(() => {
        const updateButton = screen.getAllByText('Update Status')[0];
        fireEvent.click(updateButton);
      });

      const statusSelect = screen.getByLabelText('New Status:');
      fireEvent.change(statusSelect, { target: { value: 'VERIFIED' } });

      const submitButton = screen.getByText('Update Status');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to update verification status:',
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', async () => {
      store = createMockStore('admin');
      renderComponent({ allowStatusUpdate: true });
      
      await waitFor(() => {
        const updateButton = screen.getAllByText('Update Status')[0];
        fireEvent.click(updateButton);
      });

      expect(screen.getByLabelText('New Status:')).toBeInTheDocument();
      expect(screen.getByLabelText('Verification Notes:')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should call onStatusUpdate callback', async () => {
      store = createMockStore('admin');
      integrationService.updateDocumentVerification.mockResolvedValue({
        data: mockDocuments[0]
      });
      
      renderComponent({ allowStatusUpdate: true });
      
      await waitFor(() => {
        const updateButton = screen.getAllByText('Update Status')[0];
        fireEvent.click(updateButton);
      });

      const statusSelect = screen.getByLabelText('New Status:');
      fireEvent.change(statusSelect, { target: { value: 'VERIFIED' } });

      const submitButton = screen.getByText('Update Status');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnStatusUpdate).toHaveBeenCalledWith('doc1', 'VERIFIED');
      });
    });
  });
});