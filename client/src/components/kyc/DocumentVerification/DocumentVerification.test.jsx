// client/src/components/kyc/DocumentVerification/DocumentVerification.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import DocumentVerification from './DocumentVerification';

// Mock MobileDocumentCapture
jest.mock('../../mobile/MobileDocumentCapture/MobileDocumentCapture', () => {
  return function MockMobileDocumentCapture({ open, onClose, onCapture, documentType }) {
    if (!open) return null;
    return (
      <div data-testid="mobile-camera">
        <div>Capture {documentType}</div>
        <button onClick={() => onCapture('data:image/jpeg;base64,test')}>
          Capture
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock window.matchMedia for responsive testing
const createMatchMedia = (matches) => {
  return (query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
};

describe('DocumentVerification Component', () => {
  const mockOnUpload = jest.fn();
  const defaultProps = {
    onUpload: mockOnUpload,
    uploadedDocuments: {},
    uploadProgress: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = createMatchMedia(false); // Default to desktop
  });

  const renderComponent = (props = {}) => {
    return render(<DocumentVerification {...defaultProps} {...props} />);
  };

  test('renders all document upload cards', () => {
    renderComponent();
    
    expect(screen.getByText('ID Document')).toBeInTheDocument();
    expect(screen.getByText('Address Proof')).toBeInTheDocument();
    expect(screen.getByText('Selfie with ID')).toBeInTheDocument();
  });

  test('shows upload buttons for each document type', () => {
    renderComponent();
    
    const uploadButtons = screen.getAllByText('Choose File');
    expect(uploadButtons).toHaveLength(3);
  });

  test('displays document requirements when clicked', () => {
    renderComponent();
    
    const requirementsButtons = screen.getAllByText('Requirements');
    fireEvent.click(requirementsButtons[0]);
    
    expect(screen.getByText('Document must be valid and not expired')).toBeInTheDocument();
    expect(screen.getByText('All four corners must be visible')).toBeInTheDocument();
  });

  test('handles file upload with valid file', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#file-input-idDocument');
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith('idDocument', file);
    });
  });

  test('shows error for invalid file format', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('#file-input-idDocument');
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid file format. Please upload a valid image or PDF.')).toBeInTheDocument();
    });
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  test('shows error for oversized file', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#file-input-idDocument');
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText('File too large. Maximum size is 5MB.')).toBeInTheDocument();
    });
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  test('shows uploaded status when document is present', () => {
    const uploadedDocs = {
      idDocument: { id: '123', url: 'http://test.com/doc.jpg', type: 'image/jpeg' }
    };
    renderComponent({ uploadedDocuments: uploadedDocs });
    
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  test('shows upload progress', () => {
    renderComponent({ 
      uploadProgress: 50,
      uploading: { idDocument: true }
    });
    
    // Since uploading state is internal, we'll test by simulating upload
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#file-input-idDocument');
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Progress bar should be rendered (though actual progress is controlled by parent)
    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  test('handles document preview', async () => {
    const uploadedDocs = {
      idDocument: { id: '123', url: 'http://test.com/doc.jpg', type: 'image/jpeg' }
    };
    renderComponent({ uploadedDocuments: uploadedDocs });
    
    fireEvent.click(screen.getByText('Preview'));
    
    await waitFor(() => {
      expect(screen.getByText('Document Preview')).toBeInTheDocument();
    });
  });

  test('handles document removal', () => {
    const uploadedDocs = {
      idDocument: { id: '123', url: 'http://test.com/doc.jpg', type: 'image/jpeg' }
    };
    renderComponent({ uploadedDocuments: uploadedDocs });
    
    fireEvent.click(screen.getByText('Remove'));
    
    expect(mockOnUpload).toHaveBeenCalledWith('idDocument', null);
  });

  test('shows camera button on mobile for ID and selfie', () => {
    window.matchMedia = createMatchMedia(true); // Mobile view
    renderComponent();
    
    const cameraButtons = screen.getAllByText('Camera');
    expect(cameraButtons).toHaveLength(2); // ID document and selfie
  });

  test('opens camera dialog when camera button clicked', async () => {
    window.matchMedia = createMatchMedia(true); // Mobile view
    renderComponent();
    
    const cameraButtons = screen.getAllByText('Camera');
    fireEvent.click(cameraButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('mobile-camera')).toBeInTheDocument();
    });
  });

  test('handles camera capture', async () => {
    window.matchMedia = createMatchMedia(true); // Mobile view
    renderComponent();
    
    const cameraButtons = screen.getAllByText('Camera');
    fireEvent.click(cameraButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('mobile-camera')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Capture'));
    
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(
        'idDocument',
        expect.objectContaining({
          name: 'idDocument_capture.jpg',
          type: 'image/jpeg'
        })
      );
    });
  });

  test('closes error alert when dismissed', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('#file-input-idDocument');
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid file format. Please upload a valid image or PDF.')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Invalid file format. Please upload a valid image or PDF.')).not.toBeInTheDocument();
    });
  });

  test('handles upload error from parent', async () => {
    mockOnUpload.mockRejectedValue(new Error('Upload failed'));
    
    const user = userEvent.setup();
    renderComponent();
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#file-input-idDocument');
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  test('displays PDF in preview for PDF documents', async () => {
    const uploadedDocs = {
      addressProof: { id: '123', url: 'http://test.com/doc.pdf', type: 'application/pdf' }
    };
    renderComponent({ uploadedDocuments: uploadedDocs });
    
    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);
    
    await waitFor(() => {
      expect(document.querySelector('embed[type="application/pdf"]')).toBeInTheDocument();
    });
  });

  test('shows all requirements for each document type', () => {
    renderComponent();
    
    const requirementsButtons = screen.getAllByText('Requirements');
    
    // Check ID document requirements
    fireEvent.click(requirementsButtons[0]);
    expect(screen.getByText('Document must be valid and not expired')).toBeInTheDocument();
    
    // Check address proof requirements
    fireEvent.click(requirementsButtons[1]);
    expect(screen.getByText('Document must be dated within last 3 months')).toBeInTheDocument();
    
    // Check selfie requirements
    fireEvent.click(requirementsButtons[2]);
    expect(screen.getByText('Your face must be clearly visible')).toBeInTheDocument();
  });
});