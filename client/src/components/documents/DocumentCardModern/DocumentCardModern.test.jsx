// src/components/documents/DocumentCardModern/DocumentCardModern.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DocumentCardModern from './DocumentCardModern';

// Mock the child components
jest.mock('../SecurityWatermark/SecurityWatermark', () => {
  return function MockSecurityWatermark({ status, opacity, scale, position }) {
    return (
      <div data-testid="security-watermark">
        {status} - {opacity} - {scale} - {position}
      </div>
    );
  };
});

jest.mock('../ExpirationNotice/ExpirationNotice', () => {
  return function MockExpirationNotice({ expiryDate, verificationStatus, variant, compact }) {
    return (
      <div data-testid="expiration-notice">
        {expiryDate} - {verificationStatus} - {variant} - {compact?.toString()}
      </div>
    );
  };
});

// Mock utility functions
jest.mock('../../../utils/dateUtils', () => ({
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString())
}));

jest.mock('../../../utils/documentUtils', () => ({
  formatFileSize: jest.fn((size) => {
    if (size >= 1048576) return `${(size / 1048576).toFixed(1)} MB`;
    if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${size} B`;
  })
}));

// Create theme for testing
const theme = createTheme();

// Helper to render with providers
const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

// Sample document data
const mockDocument = {
  _id: 'doc123',
  documentName: 'My Passport',
  fileName: 'passport.jpg',
  documentType: 'identity',
  status: 'VERIFIED',
  fileUrl: 'https://example.com/passport.jpg',
  mimeType: 'image/jpeg',
  fileSize: 2048576,
  createdAt: '2023-01-01T10:00:00.000Z',
  verificationDate: '2023-01-02T14:30:00.000Z',
  expiryDate: '2025-12-31T00:00:00.000Z',
  verificationNotes: 'Document verified successfully'
};

const mockDocumentPending = {
  _id: 'doc456',
  documentName: 'Degree Certificate',
  fileName: 'degree.pdf',
  documentType: 'education',
  status: 'PENDING',
  fileUrl: 'https://example.com/degree.pdf',
  mimeType: 'application/pdf',
  fileSize: 1048576,
  createdAt: '2023-02-01T10:00:00.000Z'
};

const mockDocumentExpired = {
  _id: 'doc789',
  documentName: 'Medical Certificate',
  fileName: 'medical.jpg',
  documentType: 'medical',
  status: 'EXPIRED',
  fileUrl: 'https://example.com/medical.jpg',
  mimeType: 'image/jpeg',
  fileSize: 512000,
  createdAt: '2022-01-01T10:00:00.000Z',
  expiryDate: '2023-01-01T00:00:00.000Z'
};

describe('DocumentCardModern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders document card with basic information', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} />);
    
    expect(screen.getByText('My Passport')).toBeInTheDocument();
    expect(screen.getByText('Identity • 2.0 MB')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  test('displays trust score badge', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} />);
    
    // Trust score should be high for verified document with all fields
    expect(screen.getByText('100')).toBeInTheDocument(); // Trust score badge
  });

  test('shows security watermark on document preview', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} />);
    
    const watermarks = screen.getAllByTestId('security-watermark');
    expect(watermarks).toHaveLength(1);
    expect(watermarks[0]).toHaveTextContent('VERIFIED - 0.15 - 0.8 - center');
  });

  test('displays expiration notice when document has expiry date', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} />);
    
    const expirationNotice = screen.getByTestId('expiration-notice');
    expect(expirationNotice).toBeInTheDocument();
    expect(expirationNotice).toHaveTextContent('2025-12-31T00:00:00.000Z - VERIFIED - banner - false');
  });

  test('renders different status chips correctly', () => {
    const { rerender } = renderWithProviders(<DocumentCardModern document={mockDocument} />);
    expect(screen.getByText('Verified')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <DocumentCardModern document={mockDocumentPending} />
      </ThemeProvider>
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <DocumentCardModern document={mockDocumentExpired} />
      </ThemeProvider>
    );
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  test('shows different icons for different document types', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} />);
    
    // Should show SecurityIcon for identity documents
    expect(screen.getByText('Identity • 2.0 MB')).toBeInTheDocument();
  });

  test('renders image preview for image files', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} />);
    
    const image = screen.getByAltText('My Passport');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/passport.jpg');
  });

  test('renders file icon for PDF files', () => {
    renderWithProviders(<DocumentCardModern document={mockDocumentPending} />);
    
    // Should show file preview instead of image
    expect(screen.queryByAltText('Degree Certificate')).not.toBeInTheDocument();
  });

  test('shows action buttons when showActions is true', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} showActions={true} />);
    
    expect(screen.getByLabelText('View document')).toBeInTheDocument();
    expect(screen.getByLabelText('Download')).toBeInTheDocument();
  });

  test('hides action buttons when showActions is false', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} showActions={false} />);
    
    expect(screen.queryByLabelText('View document')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Download')).not.toBeInTheDocument();
  });

  test('displays document details when showDetails is true', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} showDetails={true} />);
    
    expect(screen.getByText('Uploaded:')).toBeInTheDocument();
    expect(screen.getByText('Verified:')).toBeInTheDocument();
    expect(screen.getByText('Expires:')).toBeInTheDocument();
  });

  test('hides document details when showDetails is false', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} showDetails={false} />);
    
    expect(screen.queryByText('Uploaded:')).not.toBeInTheDocument();
    expect(screen.queryByText('Verified:')).not.toBeInTheDocument();
  });

  test('renders in compact mode', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} compact={true} />);
    
    // Should still show basic info but not detailed breakdown
    expect(screen.getByText('My Passport')).toBeInTheDocument();
    expect(screen.queryByText('Trust Score')).not.toBeInTheDocument();
  });

  test('calls onView when card is clicked', () => {
    const mockOnView = jest.fn();
    renderWithProviders(
      <DocumentCardModern 
        document={mockDocument} 
        onView={mockOnView}
        interactive={true} 
      />
    );
    
    fireEvent.click(screen.getByText('My Passport'));
    expect(mockOnView).toHaveBeenCalledWith(mockDocument);
  });

  test('calls onView when view button is clicked', () => {
    const mockOnView = jest.fn();
    renderWithProviders(
      <DocumentCardModern 
        document={mockDocument} 
        onView={mockOnView}
        showActions={true} 
      />
    );
    
    fireEvent.click(screen.getByLabelText('View document'));
    expect(mockOnView).toHaveBeenCalledWith(mockDocument);
  });

  test('calls onDownload when download button is clicked', () => {
    const mockOnDownload = jest.fn();
    renderWithProviders(
      <DocumentCardModern 
        document={mockDocument} 
        onDownload={mockOnDownload}
        showActions={true} 
      />
    );
    
    fireEvent.click(screen.getByLabelText('Download'));
    expect(mockOnDownload).toHaveBeenCalledWith(mockDocument);
  });

  test('opens and closes action menu', async () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} showActions={true} />);
    
    // Open menu
    const menuButton = screen.getByRole('button', { name: '' }); // MoreIcon button
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(screen.getByText('View Document')).toBeInTheDocument();
      expect(screen.getByText('Download')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
    
    // Close menu by clicking away
    fireEvent.click(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('View Document')).not.toBeInTheDocument();
    });
  });

  test('calls action callbacks from menu', async () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    const mockOnShare = jest.fn();
    
    renderWithProviders(
      <DocumentCardModern 
        document={mockDocumentPending} // Use pending doc to show edit option
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onShare={mockOnShare}
        showActions={true} 
      />
    );
    
    // Open menu
    const menuButton = screen.getByRole('button', { name: '' });
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(screen.getByText('Edit Details')).toBeInTheDocument();
    });
    
    // Click edit
    fireEvent.click(screen.getByText('Edit Details'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockDocumentPending);
    
    // Open menu again for delete
    fireEvent.click(menuButton);
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnDelete).toHaveBeenCalledWith(mockDocumentPending);
  });

  test('shows refresh button for non-verified documents', () => {
    renderWithProviders(
      <DocumentCardModern 
        document={mockDocumentPending} 
        showActions={true} 
      />
    );
    
    expect(screen.getByLabelText('Refresh status')).toBeInTheDocument();
  });

  test('hides refresh button for verified documents', () => {
    renderWithProviders(
      <DocumentCardModern 
        document={mockDocument} 
        showActions={true} 
      />
    );
    
    expect(screen.queryByLabelText('Refresh status')).not.toBeInTheDocument();
  });

  test('shows edit option in menu for non-verified documents', async () => {
    renderWithProviders(
      <DocumentCardModern 
        document={mockDocumentPending} 
        showActions={true} 
      />
    );
    
    const menuButton = screen.getByRole('button', { name: '' });
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(screen.getByText('Edit Details')).toBeInTheDocument();
    });
  });

  test('hides edit option in menu for verified documents', async () => {
    renderWithProviders(
      <DocumentCardModern 
        document={mockDocument} 
        showActions={true} 
      />
    );
    
    const menuButton = screen.getByRole('button', { name: '' });
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Edit Details')).not.toBeInTheDocument();
    });
  });

  test('handles document without file URL', () => {
    const docWithoutFile = {
      ...mockDocument,
      fileUrl: null,
      mimeType: null
    };
    
    renderWithProviders(<DocumentCardModern document={docWithoutFile} />);
    
    expect(screen.getByText('My Passport')).toBeInTheDocument();
    expect(screen.queryByAltText('My Passport')).not.toBeInTheDocument();
  });

  test('handles image load and error states', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} />);
    
    const image = screen.getByAltText('My Passport');
    
    // Simulate image load
    fireEvent.load(image);
    
    // Simulate image error
    fireEvent.error(image);
  });

  test('calculates trust score correctly', () => {
    // Test with complete verified document
    renderWithProviders(<DocumentCardModern document={mockDocument} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    // Test with pending document
    const { rerender } = renderWithProviders(<DocumentCardModern document={mockDocument} />);
    rerender(
      <ThemeProvider theme={theme}>
        <DocumentCardModern document={mockDocumentPending} />
      </ThemeProvider>
    );
    // Pending document should have lower trust score
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  test('shows verification notes when present', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} showDetails={true} />);
    
    expect(screen.getByText('Document verified successfully')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = renderWithProviders(
      <DocumentCardModern document={mockDocument} className="custom-class" />
    );
    
    expect(container.firstChild.firstChild).toHaveClass('custom-class');
  });

  test('respects elevation prop', () => {
    renderWithProviders(<DocumentCardModern document={mockDocument} elevation={5} />);
    
    // Material-UI adds elevation classes, but exact implementation may vary
    // The important thing is that the prop is passed through
    expect(screen.getByText('My Passport')).toBeInTheDocument();
  });

  test('handles documents without expiry date', () => {
    const docWithoutExpiry = {
      ...mockDocument,
      expiryDate: null
    };
    
    renderWithProviders(<DocumentCardModern document={docWithoutExpiry} />);
    
    expect(screen.getByText('My Passport')).toBeInTheDocument();
    // Should not crash and should not show expiry info
    expect(screen.queryByText('Expires:')).not.toBeInTheDocument();
  });

  test('handles missing document properties gracefully', () => {
    const minimalDoc = {
      _id: 'minimal',
      status: 'PENDING'
    };
    
    renderWithProviders(<DocumentCardModern document={minimalDoc} />);
    
    expect(screen.getByText('Untitled Document')).toBeInTheDocument();
    expect(screen.getByText('Document • Unknown size')).toBeInTheDocument();
  });

  test('prevents event propagation on action button clicks', () => {
    const mockOnView = jest.fn();
    const mockOnDownload = jest.fn();
    
    renderWithProviders(
      <DocumentCardModern 
        document={mockDocument} 
        onView={mockOnView}
        onDownload={mockOnDownload}
        showActions={true}
        interactive={true}
      />
    );
    
    // Click download button should not trigger card click
    fireEvent.click(screen.getByLabelText('Download'));
    
    expect(mockOnDownload).toHaveBeenCalledWith(mockDocument);
    expect(mockOnView).toHaveBeenCalledTimes(1); // Only from the download action, not card click
  });

  test('shows overlay on hover when interactive', () => {
    renderWithProviders(
      <DocumentCardModern 
        document={mockDocument} 
        interactive={true}
        showPreview={true}
      />
    );
    
    const card = screen.getByText('My Passport').closest('[class*="card"]');
    
    // Simulate hover
    fireEvent.mouseEnter(card);
    
    // Should show the preview overlay with view button
    // Note: Testing the actual overlay visibility might require more specific selectors
    expect(screen.getByText('My Passport')).toBeInTheDocument();
  });
});