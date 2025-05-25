// client/src/components/integration/DocumentApplicationLinker/DocumentApplicationLinker.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import DocumentApplicationLinker from './DocumentApplicationLinker';
import integrationService from '../../../services/integration.service';
import documentService from '../../../services/document.service';
import applicationService from '../../../services/application.service';

// Mock services
jest.mock('../../../services/integration.service');
jest.mock('../../../services/document.service');
jest.mock('../../../services/application.service');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 'user123', role: 'jobSeeker' } }) => state
    },
    preloadedState: initialState
  });
};

// Test data
const mockApplication = {
  _id: 'app123',
  job: {
    _id: 'job123',
    title: 'Software Engineer'
  },
  documents: []
};

const mockDocuments = [
  {
    _id: 'doc1',
    title: 'National ID',
    type: 'IDENTIFICATION',
    description: 'Kenyan national identification card',
    verificationStatus: 'VERIFIED',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    _id: 'doc2',
    title: 'University Degree',
    type: 'EDUCATION',
    description: 'Bachelor of Computer Science',
    verificationStatus: 'PENDING',
    createdAt: '2024-01-16T10:00:00Z'
  }
];

describe('DocumentApplicationLinker', () => {
  let store;
  let mockOnSuccess;
  let mockOnError;

  beforeEach(() => {
    store = createMockStore();
    mockOnSuccess = jest.fn();
    mockOnError = jest.fn();
    
    // Setup default service mocks
    applicationService.getApplicationById.mockResolvedValue({
      data: mockApplication
    });
    documentService.getUserDocuments.mockResolvedValue({
      data: mockDocuments
    });
    
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      applicationId: 'app123',
      onSuccess: mockOnSuccess,
      onError: mockOnError
    };

    return render(
      <Provider store={store}>
        <DocumentApplicationLinker {...defaultProps} {...props} />
      </Provider>
    );
  };

  describe('Component Rendering', () => {
    it('should render with loading state initially', () => {
      renderComponent();
      expect(screen.getByText('Loading documents...')).toBeInTheDocument();
    });

    it('should render document cards after loading', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('National ID')).toBeInTheDocument();
        expect(screen.getByText('University Degree')).toBeInTheDocument();
      });
    });

    it('should display application info in header', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('App #app123'.slice(-6))).toBeInTheDocument();
      });
    });

    it('should show empty state when no documents available', async () => {
      documentService.getUserDocuments.mockResolvedValue({ data: [] });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('No documents available to link to this application.')).toBeInTheDocument();
      });
    });
  });

  describe('Document Selection', () => {
    it('should allow single document selection', async () => {
      renderComponent({ allowMultipleSelection: false });
      
      await waitFor(() => {
        expect(screen.getByText('National ID')).toBeInTheDocument();
      });

      const firstDocCard = screen.getByLabelText('Select National ID document');
      fireEvent.click(firstDocCard);

      const checkbox = screen.getByDisplayValue('doc1') || screen.getByRole('radio', { checked: true });
      expect(checkbox).toBeChecked();
    });

    it('should allow multiple document selection', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('National ID')).toBeInTheDocument();
      });

      const firstDocCard = screen.getByLabelText('Select National ID document');
      const secondDocCard = screen.getByLabelText('Select University Degree document');
      
      fireEvent.click(firstDocCard);
      fireEvent.click(secondDocCard);

      await waitFor(() => {
        expect(screen.getByText('2 document(s) selected')).toBeInTheDocument();
      });
    });

    it('should handle keyboard navigation', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('National ID')).toBeInTheDocument();
      });

      const firstDocCard = screen.getByLabelText('Select National ID document');
      fireEvent.keyPress(firstDocCard, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('1 document(s) selected')).toBeInTheDocument();
      });
    });
  });

  describe('Document Linking', () => {
    it('should successfully link documents', async () => {
      const mockResponse = { data: { ...mockApplication, documents: mockDocuments } };
      integrationService.linkDocumentsToApplication.mockResolvedValue(mockResponse);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('National ID')).toBeInTheDocument();
      });

      // Select a document
      const firstDocCard = screen.getByLabelText('Select National ID document');
      fireEvent.click(firstDocCard);

      // Click link button
      const linkButton = screen.getByText('Link 1 Document(s)');
      fireEvent.click(linkButton);

      await waitFor(() => {
        expect(integrationService.linkDocumentsToApplication).toHaveBeenCalledWith(
          'app123',
          ['doc1']
        );
        expect(toast.success).toHaveBeenCalledWith(
          'Successfully linked 1 document(s) to application'
        );
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse.data);
      });
    });

    it('should handle linking errors', async () => {
      const errorResponse = {
        response: {
          data: {
            error: { message: 'Failed to link documents' }
          }
        }
      };
      integrationService.linkDocumentsToApplication.mockRejectedValue(errorResponse);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('National ID')).toBeInTheDocument();
      });

      // Select a document and try to link
      const firstDocCard = screen.getByLabelText('Select National ID document');
      fireEvent.click(firstDocCard);

      const linkButton = screen.getByText('Link 1 Document(s)');
      fireEvent.click(linkButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to link documents');
        expect(mockOnError).toHaveBeenCalledWith(errorResponse);
      });
    });

    it('should validate selection before linking', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('National ID')).toBeInTheDocument();
      });

      // Try to link without selecting any documents
      const linkButton = screen.getByText('Link 0 Document(s)');
      expect(linkButton).toBeDisabled();
    });

    it('should show loading state during linking', async () => {
      // Make the service return a pending promise
      let resolvePromise;
      const linkPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      integrationService.linkDocumentsToApplication.mockReturnValue(linkPromise);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('National ID')).toBeInTheDocument();
      });

      // Select and link
      const firstDocCard = screen.getByLabelText('Select National ID document');
      fireEvent.click(firstDocCard);

      const linkButton = screen.getByText('Link 1 Document(s)');
      fireEvent.click(linkButton);

      // Should show loading state
      expect(screen.getByText('Linking...')).toBeInTheDocument();
      expect(linkButton).toBeDisabled();

      // Resolve the promise
      resolvePromise({ data: mockApplication });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors during data loading', async () => {
      const errorResponse = {
        response: {
          data: {
            error: { message: 'Failed to load application' }
          }
        }
      };
      applicationService.getApplicationById.mockRejectedValue(errorResponse);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load application')).toBeInTheDocument();
        expect(mockOnError).toHaveBeenCalledWith(errorResponse);
      });
    });

    it('should handle network errors gracefully', async () => {
      applicationService.getApplicationById.mockRejectedValue(new Error('Network error'));
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('should clear selection when Clear Selection is clicked', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('National ID')).toBeInTheDocument();
      });

      // Select documents
      const firstDocCard = screen.getByLabelText('Select National ID document');
      fireEvent.click(firstDocCard);

      await waitFor(() => {
        expect(screen.getByText('1 document(s) selected')).toBeInTheDocument();
      });

      // Clear selection
      const clearButton = screen.getByText('Clear Selection');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByText('1 document(s) selected')).not.toBeInTheDocument();
      });
    });

    it('should disable Clear Selection when no documents selected', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Clear Selection')).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Select National ID document')).toBeInTheDocument();
        expect(screen.getByLabelText('Select University Degree document')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      renderComponent();
      
      await waitFor(() => {
        const docCard = screen.getByLabelText('Select National ID document');
        expect(docCard).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Preselected Documents', () => {
    it('should handle preselected documents', async () => {
      renderComponent({ preSelectedDocuments: ['doc1'] });
      
      await waitFor(() => {
        expect(screen.getByText('1 document(s) selected')).toBeInTheDocument();
      });
    });

    it('should update when preselected documents change', async () => {
      const { rerender } = renderComponent({ preSelectedDocuments: ['doc1'] });
      
      await waitFor(() => {
        expect(screen.getByText('1 document(s) selected')).toBeInTheDocument();
      });

      rerender(
        <Provider store={store}>
          <DocumentApplicationLinker
            applicationId="app123"
            onSuccess={mockOnSuccess}
            onError={mockOnError}
            preSelectedDocuments={['doc1', 'doc2']}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('2 document(s) selected')).toBeInTheDocument();
      });
    });
  });
});