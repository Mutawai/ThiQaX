// src/components/documents/VerificationHistoryLog/VerificationHistoryLog.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VerificationHistoryLog from './VerificationHistoryLog';
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

// Sample history data for testing
const mockHistory = [
  {
    status: 'uploaded',
    timestamp: '2023-01-01T10:00:00.000Z',
    performedBy: '123456789abcdef',
    notes: 'Document uploaded by user'
  },
  {
    status: 'pending',
    timestamp: '2023-01-02T11:30:00.000Z',
    performedBy: '123456789abcdef',
    notes: 'Pending verification'
  },
  {
    status: 'underReview',
    timestamp: '2023-01-03T14:15:00.000Z',
    performedBy: '987654321fedcba',
    performedByName: 'Admin User',
    notes: 'Document is being reviewed by admin'
  },
  {
    status: 'verified',
    timestamp: '2023-01-04T16:45:00.000Z',
    performedBy: '987654321fedcba',
    performedByName: 'Admin User',
    notes: 'Document has been verified'
  },
  {
    status: 'expired',
    timestamp: '2023-06-01T00:00:00.000Z',
    notes: 'Document automatically marked as expired by system'
  }
];

describe('VerificationHistoryLog', () => {
  test('renders empty state when no history is provided', () => {
    renderWithProviders(<VerificationHistoryLog />);
    expect(screen.getByText('No verification history available')).toBeInTheDocument();
  });

  test('renders custom empty message when provided', () => {
    const emptyMessage = 'No history found';
    renderWithProviders(<VerificationHistoryLog emptyMessage={emptyMessage} />);
    expect(screen.getByText(emptyMessage)).toBeInTheDocument();
  });

  test('renders only maxVisible items when collapsed', () => {
    const maxVisible = 2;
    renderWithProviders(
      <VerificationHistoryLog 
        history={mockHistory} 
        maxVisible={maxVisible} 
      />
    );
    
    // Should show only the first 2 entries (sorted by timestamp descending)
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.queryByText('Under Review')).not.toBeInTheDocument();
  });

  test('shows more items when expand button is clicked', () => {
    renderWithProviders(
      <VerificationHistoryLog 
        history={mockHistory} 
        maxVisible={2} 
      />
    );
    
    // Initially show only 2 items
    expect(screen.queryByText('Under Review')).not.toBeInTheDocument();
    
    // Click Show More button
    fireEvent.click(screen.getByText('Show 3 More'));
    
    // Now it should show all items
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
  });

  test('collapses expanded list when Show Less is clicked', () => {
    renderWithProviders(
      <VerificationHistoryLog 
        history={mockHistory} 
        maxVisible={2} 
      />
    );
    
    // Expand
    fireEvent.click(screen.getByText('Show 3 More'));
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    
    // Collapse
    fireEvent.click(screen.getByText('Show Less'));
    expect(screen.queryByText('Under Review')).not.toBeInTheDocument();
  });

  test('renders user information when showUserInfo is true', () => {
    renderWithProviders(
      <VerificationHistoryLog 
        history={mockHistory} 
        maxVisible={5}
        showUserInfo={true}
      />
    );
    
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  test('hides user information when showUserInfo is false', () => {
    renderWithProviders(
      <VerificationHistoryLog 
        history={mockHistory} 
        maxVisible={5}
        showUserInfo={false}
      />
    );
    
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
  });

  test('renders in compact mode correctly', () => {
    renderWithProviders(
      <VerificationHistoryLog 
        history={mockHistory} 
        maxVisible={5}
        compact={true}
      />
    );
    
    // In compact mode, dates should be in shorter format
    expect(screen.getByText('1/4/2023')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const className = 'custom-class';
    const { container } = renderWithProviders(
      <VerificationHistoryLog 
        history={mockHistory} 
        className={className}
      />
    );
    
    expect(container.firstChild).toHaveClass(className);
  });
});