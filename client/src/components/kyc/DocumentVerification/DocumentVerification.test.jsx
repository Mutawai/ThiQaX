import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import DocumentVerification from './DocumentVerification';
import * as documentActions from '../../../redux/actions/documentActions';
import * as integrationService from '../../../services/integrationService';

// Mock the dependencies
jest.mock('../../../redux/actions/documentActions');
jest.mock('../../../services/integrationService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock file for testing
const createMockFile = (name = 'test.jpg', size = 1024, type = 'image/jpeg') => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock document data
const mockDocument = {
  _id: 'doc123',
  documentType: 'passport',
  originalName: 'passport.jpg',
  fileUrl: 'https://example.com/passport.jpg',
  previewUrl: 'https://example.com/passport_preview.jpg',
  mimeType: 'image/jpeg',
  fileSize: 2048576,
  verificationStatus: 'PENDING',
  verificationNotes: 'Document appears clear and readable',
  uploadedAt: '2025-04-01T00:00:00Z',
  expiryDate: '2030-04-01T00:00:00Z',
  verifiedAt: null,
  verifiedBy: null
};

const mockExpiredDocument = {
  ...mockDocument,
  _id: 'doc456',
  verificationStatus: 'EXPIRED',
  expiryDate: '2024-04-01T00:00:00Z' // Expired
};

const mockPDFDocument = {
  ...mockDocument,
  _id: 'doc789',
  originalName: 'diploma.pdf',
  mimeType: 'application/pdf',
  documentType: 'education_certificate'
};

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      document: (state = {
        documents: [],
        document: null,
        loading: false,
        error: null,
        success: false,
        actionLoading: false,
        ...initialState.document
      }) => state,
      auth: (state = {
        user: { _id: 'user123', name: 'Admin User', role: 'admin' },
        ...initialState.auth
      }) => state
    },
    preloadedState: initialState
  });
};

// Wrapper component for testing
const TestWrapper = ({ children, initialState = {} }) => {
  const store = createMockStore(initialState);
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

describe('DocumentVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    documentActions.getDocument = jest.fn(() => ({ type: 'GET_DOCUMENT_REQUEST' }));
    documentActions.getDocuments = jest.fn(() => ({ type: 'GET_DOCUMENTS_REQUEST' }));
    documentActions.uploadDocument = jest.fn(() => ({ type: 'UPLOAD_DOCUMENT_REQUEST' }));
    documentActions.deleteDocument = jest.fn(() => ({ type: 'DELETE_DOCUMENT_REQUEST' }));
    documentActions.updateDocumentStatus = jest.fn(() => ({ type: 'UPDATE_DOCUMENT_STATUS_REQUEST' }));
    documentActions.clearDocumentErrors = jest.fn(() => ({ type: 'CLEAR_DOCUMENT_ERRORS' }));
    
    integrationService.updateDocumentVerification = jest.fn(() => 
      Promise.resolve({ data: { success: true } })
    );
    integrationService.checkDocumentExpirations = jest.fn(() => 
      Promise.resolve({ data: { expiringDocuments: [] } })
    );
    integrationService.linkDocumentsToApplication = jest.fn(() => 
      Promise.resolve({ data: { success: true } })
    );

    // Mock window.open
    global.open = jest.fn();
    // Mock window.confirm
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading and Error States', () => {
    it('shows loading spinner when document is loading', () => {
      const initialState = {
        document: { loading: true }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      expect(screen.getByRole('generic')).toHaveClass('animate-spin');
    });

    it('displays error message when there is an error', () => {
      const initialState = {
        document: { error: 'Failed to load document' }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      expect(screen.getByText('Error Loading Document')).toBeInTheDocument();
      expect(screen.getByText('Failed to load document')).toBeInTheDocument();
    });

    it('shows no documents message when no documents available', () => {
      const initialState = {
        document: { documents: [] }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification />
        </TestWrapper>
      );

      expect(screen.getByText('No documents found')).toBeInTheDocument();
      expect(screen.getByText('Get started by uploading a document for verification.')).toBeInTheDocument();
    });
  });

  describe('Document Loading', () => {
    it('loads specific document when documentId is provided', () => {
      render(
        <TestWrapper>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      expect(documentActions.getDocument).toHaveBeenCalledWith('doc123');
    });

    it('loads all documents when no documentId is provided', () => {
      render(
        <TestWrapper>
          <DocumentVerification />
        </TestWrapper>
      );

      expect(documentActions.getDocuments).toHaveBeenCalled();
    });
  });

  describe('Document Display', () => {
    it('displays document metadata correctly', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      expect(screen.getByText('Document Information')).toBeInTheDocument();
      expect(screen.getByText('Passport')).toBeInTheDocument();
      expect(screen.getByText('passport.jpg')).toBeInTheDocument();
      expect(screen.getByText('1.95 MB')).toBeInTheDocument();
      expect(screen.getByText('4/1/2025')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('displays verification notes when available', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      expect(screen.getByText('Verification Notes')).toBeInTheDocument();
      expect(screen.getByText('Document appears clear and readable')).toBeInTheDocument();
    });

    it('displays expiration warning for expired documents', () => {
      const initialState = {
        document: { document: mockExpiredDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc456" />
        </TestWrapper>
      );

      expect(screen.getByText('This document has expired')).toBeInTheDocument();
    });

    it('displays expiration warning for documents expiring soon', () => {
      const soonToExpireDoc = {
        ...mockDocument,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days from now
      };

      const initialState = {
        document: { document: soonToExpireDoc }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      expect(screen.getByText(/This document expires in \d+ days/)).toBeInTheDocument();
    });
  });

  describe('Document Preview', () => {
    it('displays image preview for image documents', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      const image = screen.getByAltText('passport.jpg');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockDocument.fileUrl);
    });

    it('displays PDF placeholder for PDF documents', () => {
      const initialState = {
        document: { document: mockPDFDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc789" />
        </TestWrapper>
      );

      expect(screen.getByText('PDF Document')).toBeInTheDocument();
      expect(screen.getByText('diploma.pdf')).toBeInTheDocument();
      expect(screen.getByText('Open PDF')).toBeInTheDocument();
    });

    it('opens full screen preview when image is clicked', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      const image = screen.getByAltText('passport.jpg');
      fireEvent.click(image);

      // Check for modal elements
      expect(screen.getAllByAltText('passport.jpg')).toHaveLength(2); // Original + modal
    });

    it('closes full screen preview when close button is clicked', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      // Open modal
      const image = screen.getByAltText('passport.jpg');
      fireEvent.click(image);

      // Close modal
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(screen.getAllByAltText('passport.jpg')).toHaveLength(1); // Only original
    });

    it('opens PDF in new window when Open PDF is clicked', () => {
      const initialState = {
        document: { document: mockPDFDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc789" />
        </TestWrapper>
      );

      const openPDFButton = screen.getByText('Open PDF');
      fireEvent.click(openPDFButton);

      expect(global.open).toHaveBeenCalledWith(mockPDFDocument.fileUrl, '_blank');
    });
  });

  describe('File Upload and Replacement', () => {
    it('shows upload interface when Replace Document is clicked', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      const replaceButton = screen.getByText('Replace Document');
      fireEvent.click(replaceButton);

      expect(screen.getByText('Replace Document')).toBeInTheDocument();
      expect(screen.getByText('Click to upload')).toBeInTheDocument();
    });

    it('handles file upload via file input', async () => {
      const initialState = {
        document: { document: mockDocument }
      };

      documentActions.uploadDocument.mockReturnValue({
        type: 'UPLOAD_DOCUMENT_SUCCESS',
        payload: { ...mockDocument, _id: 'newDoc123' }
      });

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      // Open replace mode
      const replaceButton = screen.getByText('Replace Document');
      fireEvent.click(replaceButton);

      const file = createMockFile('new_passport.jpg', 2048, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]');

      fireEvent.change(fileInput, {
        target: { files: [file] }
      });

      await waitFor(() => {
        expect(documentActions.uploadDocument).toHaveBeenCalled();
      });
    });

    it('handles file upload via drag and drop', async () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      // Open replace mode
      const replaceButton = screen.getByText('Replace Document');
      fireEvent.click(replaceButton);

      const dropZone = screen.getByText('Click to upload').closest('div');
      const file = createMockFile('new_passport.jpg', 2048, 'image/jpeg');

      // Simulate drag and drop
      fireEvent.dragOver(dropZone);
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      });

      await waitFor(() => {
        expect(documentActions.uploadDocument).toHaveBeenCalled();
      });
    });

    it('validates file type and size', async () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      // Open replace mode
      const replaceButton = screen.getByText('Replace Document');
      fireEvent.click(replaceButton);

      // Test invalid file type
      const invalidFile = createMockFile('document.txt', 1024, 'text/plain');
      const fileInput = document.querySelector('input[type="file"]');

      fireEvent.change(fileInput, {
        target: { files: [invalidFile] }
      });

      await waitFor(() => {
        expect(screen.getByText('Please upload a valid file type (JPEG, PNG, or PDF)')).toBeInTheDocument();
      });

      // Test file too large
      const largeFile = createMockFile('large.jpg', 6 * 1024 * 1024, 'image/jpeg');
      
      fireEvent.change(fileInput, {
        target: { files: [largeFile] }
      });

      await waitFor(() => {
        expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
      });
    });

    it('links document to application when applicationId is provided', async () => {
      const initialState = {
        document: { document: mockDocument }
      };

      const mockResult = { payload: { ...mockDocument, _id: 'newDoc123' } };
      documentActions.uploadDocument.mockReturnValue(mockResult);

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" applicationId="app123" />
        </TestWrapper>
      );

      // Open replace mode and upload file
      const replaceButton = screen.getByText('Replace Document');
      fireEvent.click(replaceButton);

      const file = createMockFile('new_passport.jpg', 2048, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]');

      fireEvent.change(fileInput, {
        target: { files: [file] }
      });

      await waitFor(() => {
        expect(integrationService.linkDocumentsToApplication).toHaveBeenCalledWith('app123', ['newDoc123']);
      });
    });

    it('cancels upload mode when Cancel button is clicked', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      // Open replace mode
      const replaceButton = screen.getByText('Replace Document');
      fireEvent.click(replaceButton);

      expect(screen.getByText('Replace Document')).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Replace Document')).not.toBeInTheDocument();
    });
  });

  describe('Admin Verification Actions', () => {
    it('shows verification actions when showAdminActions is true', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" showAdminActions={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Verification Actions')).toBeInTheDocument();
      expect(screen.getByText('Approve')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
      expect(screen.getByText('Reset to Pending')).toBeInTheDocument();
    });

    it('hides verification actions when showAdminActions is false', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" showAdminActions={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Verification Actions')).not.toBeInTheDocument();
    });

    it('handles document approval', async () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" showAdminActions={true} />
        </TestWrapper>
      );

      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(integrationService.updateDocumentVerification).toHaveBeenCalledWith(
          'doc123',
          expect.objectContaining({
            verificationStatus: 'VERIFIED'
          })
        );
      });
    });

    it('handles document rejection', async () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" showAdminActions={true} />
        </TestWrapper>
      );

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(integrationService.updateDocumentVerification).toHaveBeenCalledWith(
          'doc123',
          expect.objectContaining({
            verificationStatus: 'REJECTED'
          })
        );
      });
    });

    it('includes verification notes in verification update', async () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" showAdminActions={true} />
        </TestWrapper>
      );

      const notesTextarea = screen.getByPlaceholderText('Add notes about the verification decision...');
      fireEvent.change(notesTextarea, { target: { value: 'Document quality is excellent' } });

      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(integrationService.updateDocumentVerification).toHaveBeenCalledWith(
          'doc123',
          expect.objectContaining({
            verificationStatus: 'VERIFIED',
            verificationNotes: 'Document quality is excellent'
          })
        );
      });
    });

    it('calls onVerificationComplete callback when verification is updated', async () => {
      const onVerificationComplete = jest.fn();
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification 
            documentId="doc123" 
            showAdminActions={true} 
            onVerificationComplete={onVerificationComplete}
          />
        </TestWrapper>
      );

      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(onVerificationComplete).toHaveBeenCalledWith(mockDocument, 'VERIFIED');
      });
    });
  });

  describe('Document Actions', () => {
    it('shows document actions for existing document', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      expect(screen.getByText('Document Actions')).toBeInTheDocument();
      expect(screen.getByText('Replace Document')).toBeInTheDocument();
      expect(screen.getByText('Download')).toBeInTheDocument();
      expect(screen.getByText('Delete Document')).toBeInTheDocument();
    });

    it('handles document download', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      const downloadLink = screen.getByText('Download');
      expect(downloadLink.closest('a')).toHaveAttribute('href', mockDocument.fileUrl);
      expect(downloadLink.closest('a')).toHaveAttribute('download', mockDocument.originalName);
    });

    it('handles document deletion with confirmation', async () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      const deleteButton = screen.getByText('Delete Document');
      fireEvent.click(deleteButton);

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this document?');
      
      await waitFor(() => {
        expect(documentActions.deleteDocument).toHaveBeenCalledWith('doc123');
      });
    });

    it('does not delete document when confirmation is cancelled', () => {
      global.confirm.mockReturnValue(false);
      
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      const deleteButton = screen.getByText('Delete Document');
      fireEvent.click(deleteButton);

      expect(documentActions.deleteDocument).not.toHaveBeenCalled();
    });

    it('calls onDocumentUpdate callback when document is updated', async () => {
      const onDocumentUpdate = jest.fn();
      const initialState = {
        document: { document: mockDocument }
      };

      const mockResult = { payload: { ...mockDocument, _id: 'newDoc123' } };
      documentActions.uploadDocument.mockReturnValue(mockResult);

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification 
            documentId="doc123" 
            onDocumentUpdate={onDocumentUpdate}
          />
        </TestWrapper>
      );

      // Upload new document
      const replaceButton = screen.getByText('Replace Document');
      fireEvent.click(replaceButton);

      const file = createMockFile('new_passport.jpg', 2048, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]');

      fireEvent.change(fileInput, {
        target: { files: [file] }
      });

      await waitFor(() => {
        expect(onDocumentUpdate).toHaveBeenCalledWith(mockResult.payload);
      });
    });
  });

  describe('Drag and Drop Interactions', () => {
    it('handles drag over events', () => {
      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      // Open replace mode
      const replaceButton = screen.getByText('Replace Document');
      fireEvent.click(replaceButton);

      const dropZone = screen.getByText('Click to upload').closest('div');

      // Test drag over
      fireEvent.dragOver(dropZone);
      expect(dropZone).toHaveClass('border-indigo-400');

      // Test drag leave
      fireEvent.dragLeave(dropZone);
      expect(dropZone).not.toHaveClass('border-indigo-400');
    });
  });

  describe('Status Badge Display', () => {
    it('displays correct status badge colors', () => {
      const testCases = [
        { status: 'VERIFIED', expectedColor: 'text-green-800' },
        { status: 'PENDING', expectedColor: 'text-yellow-800' },
        { status: 'REJECTED', expectedColor: 'text-red-800' },
        { status: 'EXPIRED', expectedColor: 'text-orange-800' }
      ];

      testCases.forEach(({ status, expectedColor }) => {
        const docWithStatus = { ...mockDocument, verificationStatus: status };
        const initialState = {
          document: { document: docWithStatus }
        };

        const { rerender } = render(
          <TestWrapper initialState={initialState}>
            <DocumentVerification documentId="doc123" />
          </TestWrapper>
        );

        const statusBadge = screen.getByText(status);
        expect(statusBadge).toHaveClass(expectedColor);

        // Clean up for next test
        rerender(<div />);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles verification update errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      integrationService.updateDocumentVerification.mockRejectedValue(new Error('Verification failed'));

      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" showAdminActions={true} />
        </TestWrapper>
      );

      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update verification:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('handles upload errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      documentActions.uploadDocument.mockRejectedValue(new Error('Upload failed'));

      const initialState = {
        document: { document: mockDocument }
      };

      render(
        <TestWrapper initialState={initialState}>
          <DocumentVerification documentId="doc123" />
        </TestWrapper>
      );

      const replaceButton = screen.getByText('Replace Document');
      fireEvent.click(replaceButton);

      const file = createMockFile('passport.jpg', 2048, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]');

      fireEvent.change(fileInput, {
        target: { files: [file] }
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Upload failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});