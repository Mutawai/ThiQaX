// src/components/documents/SmartUploadFlow/SmartUploadFlow.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SmartUploadFlow from './SmartUploadFlow';

// Mock the SecurityWatermark component
jest.mock('../SecurityWatermark/SecurityWatermark', () => {
  return function MockSecurityWatermark({ status, opacity }) {
    return <div data-testid="security-watermark">{status}</div>;
  };
});

// Mock document utilities
jest.mock('../../../utils/documentUtils', () => ({
  formatFileSize: jest.fn((size) => {
    if (size >= 1048576) return `${(size / 1048576).toFixed(1)} MB`;
    if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${size} B`;
  }),
  detectDocumentType: jest.fn(() => Promise.resolve({
    type: 'identity',
    suggestedName: 'Passport Document',
    confidence: 0.95
  })),
  validateDocument: jest.fn((file, options) => ({
    isValid: file.size <= options.maxSize && options.allowedTypes.includes(file.type),
    errors: file.size > options.maxSize ? ['File too large'] : 
           !options.allowedTypes.includes(file.type) ? ['Invalid file type'] : []
  }))
}));

// Mock redux actions
jest.mock('../../../redux/actions/documentActions', () => ({
  uploadDocument: jest.fn(() => ({
    type: 'UPLOAD_DOCUMENT_SUCCESS',
    payload: { id: 'doc123', status: 'uploaded' }
  }))
}));

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(({ onDrop, accept, maxSize, multiple, disabled }) => ({
    getRootProps: () => ({
      'data-testid': 'dropzone',
      onClick: jest.fn()
    }),
    getInputProps: () => ({
      'data-testid': 'file-input',
      type: 'file'
    }),
    isDragActive: false,
    isDragReject: false
  }))
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Create theme for testing
const theme = createTheme();

// Mock store setup
const createMockStore = (initialState = {}) => {
  const defaultState = {
    documents: {
      loading: false,
      error: null
    },
    auth: {
      user: {
        name: 'Test User',
        email: 'test@example.com'
      }
    },
    ...initialState
  };

  return configureStore({
    reducer: {
      documents: (state = defaultState.documents) => state,
      auth: (state = defaultState.auth) => state
    },
    preloadedState: defaultState
  });
};

// Helper to render with providers
const renderWithProviders = (ui, { initialState, ...renderOptions } = {}) => {
  const store = createMockStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          {ui}
        </ThemeProvider>
      </Provider>,
      renderOptions
    ),
    store
  };
};

// Mock file creation helper
const createMockFile = (name, size, type) => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('SmartUploadFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('renders initial upload interface', () => {
    renderWithProviders(<SmartUploadFlow />);
    
    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByText('Secure document upload with AI-powered verification')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop your document')).toBeInTheDocument();
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
  });

  test('displays progress stepper with correct steps', () => {
    renderWithProviders(<SmartUploadFlow />);
    
    expect(screen.getByText('Select File')).toBeInTheDocument();
    expect(screen.getByText('Verify Details')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  test('shows file requirements', () => {
    renderWithProviders(<SmartUploadFlow />);
    
    expect(screen.getByText('File Requirements:')).toBeInTheDocument();
    expect(screen.getByText('Max 10.0 MB')).toBeInTheDocument();
    expect(screen.getByText('PDF, JPG, PNG')).toBeInTheDocument();
    expect(screen.getByText('Clear & Readable')).toBeInTheDocument();
  });

  test('handles file selection and moves to verification step', async () => {
    const mockFile = createMockFile('test.jpg', 1000000, 'image/jpeg');
    
    renderWithProviders(<SmartUploadFlow />);
    
    // Mock the dropzone onDrop callback
    const { useDropzone } = require('react-dropzone');
    const mockOnDrop = useDropzone.mock.calls[0][0].onDrop;
    
    await act(async () => {
      await mockOnDrop([mockFile], []);
    });

    await waitFor(() => {
      expect(screen.getByText('Selected Document')).toBeInTheDocument();
      expect(screen.getByText('Document Type *')).toBeInTheDocument();
      expect(screen.getByText('Document Name *')).toBeInTheDocument();
    });
  });

  test('displays AI detection results', async () => {
    const mockFile = createMockFile('passport.jpg', 1000000, 'image/jpeg');
    
    renderWithProviders(<SmartUploadFlow autoDetectType={true} />);
    
    const { useDropzone } = require('react-dropzone');
    const mockOnDrop = useDropzone.mock.calls[0][0].onDrop;
    
    await act(async () => {
      await mockOnDrop([mockFile], []);
    });

    await waitFor(() => {
      expect(screen.getByText(/AI Detection:/)).toBeInTheDocument();
      expect(screen.getByText(/Identity Document/)).toBeInTheDocument();
    });
  });

  test('handles file validation errors', async () => {
    const oversizedFile = createMockFile('huge.jpg', 20000000, 'image/jpeg'); // 20MB
    
    renderWithProviders(<SmartUploadFlow />);
    
    const { useDropzone } = require('react-dropzone');
    const mockOnDrop = useDropzone.mock.calls[0][0].onDrop;
    
    await act(async () => {
      await mockOnDrop([], [{ file: oversizedFile, errors: [{ message: 'File too large' }] }]);
    });

    await waitFor(() => {
      expect(screen.getByText('Please fix the following issues:')).toBeInTheDocument();
      expect(screen.getByText(/File too large/)).toBeInTheDocument();
    });
  });

  test('renders document type options correctly', async () => {
    const mockFile = createMockFile('test.pdf', 1000000, 'application/pdf');
    
    renderWithProviders(<SmartUploadFlow />);
    
    const { useDropzone } = require('react-dropzone');
    const mockOnDrop = useDropzone.mock.calls[0][0].onDrop;
    
    await act(async () => {
      await mockOnDrop([mockFile], []);
    });

    // Click on the document type select
    const select = screen.getByRole('button', { name: /Document Type/ });
    fireEvent.mouseDown(select);

    await waitFor(() => {
      expect(screen.getByText('Identity Document')).toBeInTheDocument();
      expect(screen.getByText('Educational Certificate')).toBeInTheDocument();
      expect(screen.getByText('Professional Certification')).toBeInTheDocument();
      expect(screen.getByText('Medical Certificate')).toBeInTheDocument();
    });
  });

  test('shows advanced options when toggled', async () => {
    const mockFile = createMockFile('test.pdf', 1000000, 'application/pdf');
    
    renderWithProviders(<SmartUploadFlow />);
    
    const { useDropzone } = require('react-dropzone');
    const mockOnDrop = useDropzone.mock.calls[0][0].onDrop;
    
    await act(async () => {
      await mockOnDrop([mockFile], []);
    });

    // Click advanced options
    fireEvent.click(screen.getByText('Advanced Options'));

    await waitFor(() => {
      expect(screen.getByLabelText('Document Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Issue Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Expiry Date')).toBeInTheDocument();
    });
  });

  test('validates required fields before upload', async () => {
    const mockFile = createMockFile('test.pdf', 1000000, 'application/pdf');
    
    renderWithProviders(<SmartUploadFlow />);
    
    const { useDropzone } = require('react-dropzone');
    const mockOnDrop = useDropzone.mock.calls[0][0].onDrop;
    
    await act(async () => {
      await mockOnDrop([mockFile], []);
    });

    // Try to upload without filling required fields
    const uploadButton = screen.getByRole('button', { name: /Upload Document/ });
    expect(uploadButton).toBeDisabled();
  });

  test('enables upload button when form is valid', async () => {
    const mockFile = createMockFile('test.pdf', 1000000, 'application/pdf');
    
    renderWithProviders(<SmartUploadFlow />);
    
    const { useDropzone } = require('react-dropzone');
    const mockOnDrop = useDropzone.mock.calls[0][0].onDrop;
    
    await act(async () => {
      await mockOnDrop([mockFile], []);
    });

    // Fill required fields
    const typeSelect = screen.getByRole('button', { name: /Document Type/ });
    fireEvent.mouseDown(typeSelect);
    fireEvent.click(screen.getByText('Identity Document'));

    const nameInput = screen.getByLabelText('Document Name *');
    fireEvent.change(nameInput, { target: { value: 'My Passport' } });

    await waitFor(() => {
      const uploadButton = screen.getByRole('button', { name: /Upload Document/ });
      expect(uploadButton).not.toBeDisabled();
    });
  });

  test('handles successful upload flow', async () => {
    jest.useFakeTimers();
    
    const mockFile = createMockFile('test.pdf', 1000000, 'application/pdf');
    const mockOnUploadComplete = jest.fn();
    
    renderWithProviders(<SmartUploadFlow onUploadComplete={mockOnUploadComplete} />);
    
    const { useDropzone } = require('react-dropzone');
    const mockOnDrop = useDropzone.mock.calls[0][0].onDrop;
    
    await act(async () => {
      await mockOnDrop([mockFile], []);
    });

    // Fill form
    const typeSelect = screen.getByRole('button', { name: /Document Type/ });
    fireEvent.mouseDown(typeSelect);
    fireEvent.click(screen.getByText('Identity Document'));

    const nameInput = screen.getByLabelText('Document Name *');
    fireEvent.change(nameInput, { target: { value: 'My Passport' } });

    // Submit form
    const uploadButton = screen.getByRole('button', { name: /Upload Document/ });
    fireEvent.click(uploadButton);

    // Should show upload progress
    await waitFor(() => {
      expect(screen.getByText('Uploading Document...')).toBeInTheDocument();
    });

    // Fast-forward timers to complete upload
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText('Upload Complete!')).toBeInTheDocument();
    });

    // Fast-forward to trigger onUploadComplete
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalled();
    });
    
    jest.useRealTimers();
  });

  test('handles upload failure', async () => {
    const mockFile = createMockFile('test.pdf', 1000000, 'application/pdf');
    
    // Mock upload failure
    const { uploadDocument } = require('../../../redux/actions/documentActions');
    uploadDocument.mockImplementation(() => {
      throw new Error('Upload failed');
    });
    
    renderWithProviders(<SmartUploadFlow />);
    
    const { useDropzone } = require('react-dropzone');
    const mockOnDrop = useDropzone.mock.calls[0][0].onDrop;
    
    await act(async () => {
      await mockOnDrop([mockFile], []);
    });

    // Fill form
    const typeSelect = screen.getByRole('button', { name: /Document Type/ });
    fireEvent.mouseDown(typeSelect);
    fireEvent.click(screen.getByText('Identity Document'));

    const nameInput = screen.getByLabelText('Document Name *');
    fireEvent.change(nameInput, { target: { value: 'My Passport' } });

    // Submit form
    const uploadButton = screen.getByRole('button', { name: /Upload Document/ });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Please fix the following issues:')).toBeInTheDocument();
      expect(screen.getByText(/Upload failed/)).toBeInTheDocument();
    });
  });

  test('handles back navigation', async () => {
    const mockFile = createMockFile('test.pdf', 1000000, 'application/pdf');
    
    renderWithProviders(<SmartUploadFlow />);
    
    const { useDropzone } = require('react-dropzone');
    const mockOnDrop = useDropzone.mock.calls[0][0].onDrop;
    
    await act(async () => {
      await mockOnDrop([mockFile], []);
    });

    // Should be on step 1 (details)
    expect(screen.getByText('Selected Document')).toBeInTheDocument();

    // Click back button
    const backButton = screen.getByRole('button', { name: /Back/ });
    fireEvent.click(backButton);

    // Should return to step 0 (file selection)
    await waitFor(() => {
      expect(screen.getByText('Drag & drop your document')).toBeInTheDocument();
    });
  });

  test('handles cancel action', () => {
    const mockOnCancel = jest.fn();
    
    renderWithProviders(<SmartUploadFlow onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('handles camera capture', async () => {
    renderWithProviders(<SmartUploadFlow />);
    
    const cameraButton = screen.getByRole('button', { name: /Camera/ });
    fireEvent.click(cameraButton);
    
    // Simulate camera input change
    const cameraInput = document.querySelector('input[capture="environment"]');
    const mockFile = createMockFile('camera-capture.jpg', 1000000, 'image/jpeg');
    
    Object.defineProperty(cameraInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    
    fireEvent.change(cameraInput);

    await waitFor(() => {
      expect(screen.getByText('Selected Document')).toBeInTheDocument();
    });
  });

  test('respects preset document type', () => {
    renderWithProviders(<SmartUploadFlow presetDocumentType="education" />);
    
    // Should not auto-detect when preset is provided
    expect(screen.queryByText('AI Analysis in Progress')).not.toBeInTheDocument();
  });

  test('handles custom props correctly', () => {
    renderWithProviders(
      <SmartUploadFlow 
        maxFileSize={5000000}
        allowedTypes={['application/pdf']}
        showPreview={false}
        autoDetectType={false}
        className="custom-class"
      />
    );
    
    expect(screen.getByText('Max 4.8 MB')).toBeInTheDocument();
  });

  test('cleans up preview URL on unmount', () => {
    const { unmount } = renderWithProviders(<SmartUploadFlow />);
    
    unmount();
    
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  test('displays security watermark on image preview', async () => {
    const mockFile = createMockFile('test.jpg', 1000000, 'image/jpeg');
    
    renderWithProviders(<SmartUploadFlow />);
    
    const { useDropzone } = require('react-dropzone');
    const mockOnDrop = useDropzone.mock.calls[0][0].onDrop;
    
    await act(async () => {
      await mockOnDrop([mockFile], []);
    });

    await waitFor(() => {
      expect(screen.getByTestId('security-watermark')).toBeInTheDocument();
    });
  });
});