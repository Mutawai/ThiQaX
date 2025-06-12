import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import KYCForm from './KYCForm';
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
        expiringDocuments: [],
        actionLoading: false,
        ...initialState.document
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

describe('KYCForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    documentActions.uploadDocument = jest.fn(() => ({ type: 'UPLOAD_DOCUMENT_REQUEST' }));
    documentActions.getDocuments = jest.fn(() => ({ type: 'GET_DOCUMENTS_REQUEST' }));
    documentActions.clearDocumentErrors = jest.fn(() => ({ type: 'CLEAR_DOCUMENT_ERRORS' }));
    
    integrationService.checkKycStatus = jest.fn(() => 
      Promise.resolve({ data: { status: 'pending' } })
    );
  });

  it('renders the KYC form with correct initial state', () => {
    render(
      <TestWrapper>
        <KYCForm />
      </TestWrapper>
    );

    expect(screen.getByText('KYC Verification')).toBeInTheDocument();
    expect(screen.getByText('Complete your identity verification to access all platform features')).toBeInTheDocument();
    expect(screen.getByText('Identity Documents')).toBeInTheDocument();
    expect(screen.getByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('National ID')).toBeInTheDocument();
  });

  it('displays progress steps correctly', () => {
    render(
      <TestWrapper>
        <KYCForm />
      </TestWrapper>
    );

    expect(screen.getByText('Identity Documents')).toBeInTheDocument();
    expect(screen.getByText('Address Verification')).toBeInTheDocument();
    expect(screen.getByText('Professional Documents')).toBeInTheDocument();
    
    // Check that step 1 is currently active
    const step1 = screen.getByText('1');
    expect(step1).toHaveClass('bg-indigo-500');
  });

  it('shows loading spinner when documents are loading', () => {
    const initialState = {
      document: { loading: true }
    };

    render(
      <TestWrapper initialState={initialState}>
        <KYCForm />
      </TestWrapper>
    );

    expect(screen.getByRole('generic')).toHaveClass('animate-spin');
  });

  it('displays error message when there is an error', () => {
    const initialState = {
      document: { error: 'Upload failed' }
    };

    render(
      <TestWrapper initialState={initialState}>
        <KYCForm />
      </TestWrapper>
    );

    expect(screen.getByText('Upload Error')).toBeInTheDocument();
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('displays success message when upload is successful', () => {
    const initialState = {
      document: { success: true }
    };

    render(
      <TestWrapper initialState={initialState}>
        <KYCForm />
      </TestWrapper>
    );

    expect(screen.getByText('Document uploaded successfully!')).toBeInTheDocument();
  });

  it('handles file upload via drag and drop', async () => {
    const mockDispatch = jest.fn();
    documentActions.uploadDocument.mockReturnValue({ type: 'UPLOAD_DOCUMENT_REQUEST' });

    render(
      <TestWrapper>
        <KYCForm />
      </TestWrapper>
    );

    const dropZone = screen.getAllByText('Click to upload')[0].closest('div');
    const file = createMockFile('passport.jpg', 2048, 'image/jpeg');

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

  it('handles file upload via file input', async () => {
    render(
      <TestWrapper>
        <KYCForm />
      </TestWrapper>
    );

    const file = createMockFile('passport.jpg', 2048, 'image/jpeg');
    const fileInput = document.querySelector('input[type="file"]');

    fireEvent.change(fileInput, {
      target: { files: [file] }
    });

    await waitFor(() => {
      expect(documentActions.uploadDocument).toHaveBeenCalled();
    });
  });

  it('validates file type and size', async () => {
    render(
      <TestWrapper>
        <KYCForm />
      </TestWrapper>
    );

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

  it('disables Next button when required documents are not uploaded', () => {
    render(
      <TestWrapper>
        <KYCForm />
      </TestWrapper>
    );

    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('enables Next button when step is complete', () => {
    const initialState = {
      document: {
        documents: [{
          _id: '1',
          documentType: 'passport',
          verificationStatus: 'PENDING',
          originalName: 'passport.jpg'
        }]
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <KYCForm />
      </TestWrapper>
    );

    const nextButton = screen.getByText('Next');
    expect(nextButton).not.toBeDisabled();
  });

  it('navigates to next step when Next button is clicked', async () => {
    const initialState = {
      document: {
        documents: [{
          _id: '1',
          documentType: 'passport',
          verificationStatus: 'PENDING',
          originalName: 'passport.jpg'
        }]
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <KYCForm />
      </TestWrapper>
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Address Verification')).toBeVisible();
      expect(screen.getByText('Address Proof')).toBeInTheDocument();
    });
  });

  it('navigates to previous step when Previous button is clicked', async () => {
    const initialState = {
      document: {
        documents: [{
          _id: '1',
          documentType: 'passport',
          verificationStatus: 'PENDING',
          originalName: 'passport.jpg'
        }]
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <KYCForm initialStep={2} />
      </TestWrapper>
    );

    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(screen.getByText('Identity Documents')).toBeVisible();
    });
  });

  it('disables Previous button on first step', () => {
    render(
      <TestWrapper>
        <KYCForm />
      </TestWrapper>
    );

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('shows Complete Verification button on last step', () => {
    const initialState = {
      document: {
        documents: [
          {
            _id: '1',
            documentType: 'passport',
            verificationStatus: 'VERIFIED',
            originalName: 'passport.jpg'
          },
          {
            _id: '2',
            documentType: 'address_proof',
            verificationStatus: 'VERIFIED',
            originalName: 'utility_bill.pdf'
          }
        ]
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <KYCForm initialStep={3} />
      </TestWrapper>
    );

    expect(screen.getByText('Complete Verification')).toBeInTheDocument();
  });

  it('calls onComplete callback when verification is completed', async () => {
    const onComplete = jest.fn();
    const initialState = {
      document: {
        documents: [
          {
            _id: '1',
            documentType: 'passport',
            verificationStatus: 'VERIFIED',
            originalName: 'passport.jpg'
          },
          {
            _id: '2',
            documentType: 'address_proof',
            verificationStatus: 'VERIFIED',
            originalName: 'utility_bill.pdf'
          }
        ]
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <KYCForm initialStep={3} onComplete={onComplete} />
      </TestWrapper>
    );

    const completeButton = screen.getByText('Complete Verification');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(integrationService.checkKycStatus).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('displays existing documents with correct status', () => {
    const initialState = {
      document: {
        documents: [{
          _id: '1',
          documentType: 'passport',
          verificationStatus: 'VERIFIED',
          originalName: 'passport.jpg'
        }]
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <KYCForm />
      </TestWrapper>
    );

    expect(screen.getByText('passport.jpg')).toBeInTheDocument();
    expect(screen.getByText('Status: VERIFIED')).toBeInTheDocument();
    expect(screen.getByText('VERIFIED')).toHaveClass('bg-green-100');
  });

  it('handles drag over and drag leave events', () => {
    render(
      <TestWrapper>
        <KYCForm />
      </TestWrapper>
    );

    const dropZone = screen.getAllByText('Click to upload')[0].closest('div');

    // Test drag over
    fireEvent.dragOver(dropZone);
    expect(dropZone).toHaveClass('border-indigo-400');

    // Test drag leave
    fireEvent.dragLeave(dropZone);
    expect(dropZone).not.toHaveClass('border-indigo-400');
  });

  it('fetches documents and KYC status on mount', async () => {
    render(
      <TestWrapper>
        <KYCForm />
      </TestWrapper>
    );

    expect(documentActions.getDocuments).toHaveBeenCalled();
    expect(integrationService.checkKycStatus).toHaveBeenCalled();
  });

  it('clears success state after timeout', async () => {
    jest.useFakeTimers();
    
    const initialState = {
      document: { success: true }
    };

    render(
      <TestWrapper initialState={initialState}>
        <KYCForm />
      </TestWrapper>
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(documentActions.clearDocumentErrors).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  it('handles click on upload area to trigger file input', () => {
    render(
      <TestWrapper>
        <KYCForm />
      </TestWrapper>
    );

    const fileInput = document.querySelector('input[type="file"]');
    const clickSpy = jest.spyOn(fileInput, 'click');

    const dropZone = screen.getAllByText('Click to upload')[0].closest('div');
    fireEvent.click(dropZone);

    expect(clickSpy).toHaveBeenCalled();
  });
});