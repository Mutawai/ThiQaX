// src/components/documents/DocumentGrouping/DocumentGrouping.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentGrouping from './DocumentGrouping';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a theme for testing
const theme = createTheme();

// Helper function to wrap component with necessary providers
const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

// Sample documents for testing
const mockDocuments = [
  {
    _id: 'doc1',
    documentName: 'Passport',
    documentType: 'identity',
    status: 'VERIFIED',
    fileUrl: 'https://example.com/passport.pdf',
    verificationDate: '2023-01-15T12:30:00.000Z'
  },
  {
    _id: 'doc2',
    documentName: 'Degree Certificate',
    documentType: 'education',
    status: 'PENDING',
    fileUrl: 'https://example.com/degree.pdf'
  },
  {
    _id: 'doc3',
    documentName: 'Employment Letter',
    documentType: 'professional',
    status: 'VERIFIED',
    fileUrl: 'https://example.com/employment.pdf',
    verificationDate: '2023-02-01T09:45:00.000Z'
  },
  {
    _id: 'doc4',
    documentName: 'Medical Certificate',
    documentType: 'other',
    status: 'REJECTED',
    fileUrl: 'https://example.com/medical.pdf'
  }
];

describe('DocumentGrouping', () => {
  test('renders empty state when no documents are provided', () => {
    renderWithProviders(<DocumentGrouping />);
    expect(screen.getByText('No documents available')).toBeInTheDocument();
  });

  test('renders custom empty message when provided', () => {
    const emptyMessage = 'Upload some documents';
    renderWithProviders(<DocumentGrouping emptyMessage={emptyMessage} />);
    expect(screen.getByText(emptyMessage)).toBeInTheDocument();
  });

  test('groups documents by type correctly', () => {
    renderWithProviders(
      <DocumentGrouping 
        documents={mockDocuments} 
        groupBy="type"
      />
    );
    
    expect(screen.getByText('Identity Documents')).toBeInTheDocument();
    expect(screen.getByText('Educational Documents')).toBeInTheDocument();
    expect(screen.getByText('Professional Documents')).toBeInTheDocument();
    expect(screen.getByText('Other Documents')).toBeInTheDocument();
  });

  test('groups documents by status correctly', () => {
    renderWithProviders(
      <DocumentGrouping 
        documents={mockDocuments} 
        groupBy="status"
      />
    );
    
    expect(screen.getByText('Verified Documents')).toBeInTheDocument();
    expect(screen.getByText('Pending Documents')).toBeInTheDocument();
    expect(screen.getByText('Rejected Documents')).toBeInTheDocument();
  });

  test('accepts custom function for grouping', () => {
    const customGroupingFunction = (doc) => {
      return doc.status === 'VERIFIED' ? 'valid' : 'invalid';
    };
    
    renderWithProviders(
      <DocumentGrouping 
        documents={mockDocuments} 
        groupBy={customGroupingFunction}
      />
    );
    
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('Invalid')).toBeInTheDocument();
  });

  test('toggles group expansion when clicked', () => {
    renderWithProviders(
      <DocumentGrouping 
        documents={mockDocuments} 
        groupBy="type"
        initiallyExpanded={false}
      />
    );
    
    // Check that document is not initially visible
    expect(screen.queryByText('Passport')).not.toBeInTheDocument();
    
    // Click to expand the group
    fireEvent.click(screen.getByText('Identity Documents'));
    
    // Now the document should be visible
    expect(screen.getByText('Passport')).toBeInTheDocument();
  });

  test('renders with custom document renderer', () => {
    const customRenderer = (doc) => (
      <div key={doc._id} data-testid="custom-document">
        {doc.documentName} - Custom Rendered
      </div>
    );
    
    renderWithProviders(
      <DocumentGrouping 
        documents={mockDocuments} 
        renderDocument={customRenderer}
      />
    );
    
    expect(screen.getAllByTestId('custom-document')).toHaveLength(4);
    expect(screen.getByText('Passport - Custom Rendered')).toBeInTheDocument();
  });

  test('calls onGroupActionClick when action buttons are clicked', () => {
    const handleActionClick = jest.fn();
    
    renderWithProviders(
      <DocumentGrouping 
        documents={mockDocuments} 
        onGroupActionClick={handleActionClick}
        showGroupActions={true}
      />
    );
    
    // Click info button for Identity Documents group
    const infoButtons = screen.getAllByTitle('Group Information');
    fireEvent.click(infoButtons[0]);
    
    expect(handleActionClick).toHaveBeenCalledWith(
      'info', 
      'identity', 
      expect.arrayContaining([mockDocuments[0]])
    );
    
    // Click menu button for Educational Documents group
    const menuButtons = screen.getAllByTitle('More Options');
    fireEvent.click(menuButtons[1]);
    
    expect(handleActionClick).toHaveBeenCalledWith(
      'menu', 
      'education', 
      expect.arrayContaining([mockDocuments[1]])
    );
  });

  test('does not show action buttons when showGroupActions is false', () => {
    renderWithProviders(
      <DocumentGrouping 
        documents={mockDocuments} 
        showGroupActions={false}
      />
    );
    
    expect(screen.queryByTitle('Group Information')).not.toBeInTheDocument();
    expect(screen.queryByTitle('More Options')).not.toBeInTheDocument();
  });

  test('applies custom className', () => {
    const className = 'custom-class';
    const { container } = renderWithProviders(
      <DocumentGrouping 
        documents={mockDocuments} 
        className={className}
      />
    );
    
    expect(container.firstChild).toHaveClass(className);
  });
});