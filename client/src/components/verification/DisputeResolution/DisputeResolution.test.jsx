// src/components/verification/DisputeResolution/DisputeResolution.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DisputeResolution from './DisputeResolution';

// Mock data for testing
const mockDisputeData = {
  id: 'dispute_12345',
  status: 'UNDER_REVIEW',
  reason: 'Incorrect verification result',
  details: 'The document was incorrectly marked as invalid.',
  disputeType: 'VERIFICATION_ERROR',
  createdAt: '2025-02-15T10:30:00Z',
  lastUpdated: '2025-02-16T14:20:00Z',
  mediatorCommunication: [
    {
      message: 'We are reviewing your dispute. We'll get back to you shortly.',
      timestamp: '2025-02-15T14:30:00Z',
      fromUser: false
    },
    {
      message: 'Thank you for your patience. I've provided the additional information requested.',
      timestamp: '2025-02-16T09:15:00Z',
      fromUser: true
    }
  ]
};

const mockResolvedDisputeData = {
  ...mockDisputeData,
  status: 'RESOLVED',
  resolution: 'Your dispute has been verified and the document has been marked as valid.',
  resolvedAt: '2025-02-18T16:45:00Z'
};

const mockNeedsInfoDisputeData = {
  ...mockDisputeData,
  status: 'NEEDS_INFORMATION',
  mediatorNotes: 'Please provide a clearer image of the document expiration date.'
};

const mockDisputeHistory = [
  {
    id: 'dispute_54321',
    status: 'RESOLVED',
    reason: 'Previous dispute reason',
    details: 'Details about a previous dispute',
    createdAt: '2025-01-10T08:30:00Z',
    resolvedAt: '2025-01-12T11:45:00Z',
    resolution: 'This dispute was resolved in your favor.'
  }
];

describe('DisputeResolution Component', () => {
  test('renders dispute form when no active dispute exists', () => {
    render(<DisputeResolution documentId="doc_12345" />);
    
    expect(screen.getByText('Submit a Dispute')).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason for Dispute/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dispute Details/i)).toBeInTheDocument();
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Dispute/i })).toBeInTheDocument();
  });

  test('renders active dispute details with correct step', () => {
    render(<DisputeResolution disputeData={mockDisputeData} documentId="doc_12345" />);
    
    expect(screen.getByText('Active Dispute')).toBeInTheDocument();
    expect(screen.getByText('UNDER REVIEW')).toBeInTheDocument();
    expect(screen.getByText(mockDisputeData.reason)).toBeInTheDocument();
    expect(screen.getByText(mockDisputeData.details)).toBeInTheDocument();
    expect(screen.getByText('Your dispute is currently being reviewed by our resolution team.')).toBeInTheDocument();
  });

  test('renders resolved dispute with resolution message', () => {
    render(<DisputeResolution disputeData={mockResolvedDisputeData} documentId="doc_12345" />);
    
    expect(screen.getByText('RESOLVED')).toBeInTheDocument();
    expect(screen.getByText('Dispute Resolved')).toBeInTheDocument();
    expect(screen.getByText(mockResolvedDisputeData.resolution)).toBeInTheDocument();
  });

  test('renders needs information status with mediator notes', () => {
    render(<DisputeResolution disputeData={mockNeedsInfoDisputeData} documentId="doc_12345" />);
    
    expect(screen.getByText('NEEDS INFORMATION')).toBeInTheDocument();
    expect(screen.getByText('Additional Information Requested')).toBeInTheDocument();
    expect(screen.getByText(mockNeedsInfoDisputeData.mediatorNotes)).toBeInTheDocument();
    expect(screen.getByLabelText('Your Response')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Response/i })).toBeInTheDocument();
  });

  test('shows dispute history button and dialog when history exists', async () => {
    render(<DisputeResolution disputeHistory={mockDisputeHistory} documentId="doc_12345" />);
    
    // Check that history button exists
    const historyButton = screen.getByRole('button', { name: /View Dispute History/i });
    expect(historyButton).toBeInTheDocument();
    
    // Click the button to open dialog
    fireEvent.click(historyButton);
    
    // Check that dialog and history content is shown
    await waitFor(() => {
      expect(screen.getByText('Dispute History')).toBeInTheDocument();
      expect(screen.getByText('Previous dispute reason')).toBeInTheDocument();
      expect(screen.getByText(/This dispute was resolved in your favor/i)).toBeInTheDocument();
    });
    
    // Close the dialog
    const closeButton = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeButton);
    
    // Check that dialog is closed
    await waitFor(() => {
      expect(screen.queryByText('Dispute History')).not.toBeInTheDocument();
    });
  });

  test('validates form inputs before submission', async () => {
    const mockSubmitDispute = jest.fn();
    render(
      <DisputeResolution 
        onSubmitDispute={mockSubmitDispute} 
        documentId="doc_12345" 
      />
    );
    
    // Submit form without filling in required fields
    const submitButton = screen.getByRole('button', { name: /Submit Dispute/i });
    fireEvent.click(submitButton);
    
    // Check that validation errors are shown
    await waitFor(() => {
      expect(screen.getByText('Reason is required')).toBeInTheDocument();
      expect(screen.getByText('Details are required')).toBeInTheDocument();
    });
    
    // Check that the submit function was not called
    expect(mockSubmitDispute).not.toHaveBeenCalled();
  });

  test('calls onSubmitDispute with correct data when form is submitted', async () => {
    const mockSubmitDispute = jest.fn().mockResolvedValue({});
    render(
      <DisputeResolution 
        onSubmitDispute={mockSubmitDispute} 
        documentId="doc_12345" 
      />
    );
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/Reason for Dispute/i), {
      target: { value: 'Test reason' }
    });
    
    fireEvent.change(screen.getByLabelText(/Dispute Details/i), {
      target: { value: 'Test details about the dispute' }
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Submit Dispute/i });
    fireEvent.click(submitButton);
    
    // Check that the submit function was called with correct data
    await waitFor(() => {
      expect(mockSubmitDispute).toHaveBeenCalledWith({
        documentId: 'doc_12345',
        reason: 'Test reason',
        details: 'Test details about the dispute',
        disputeType: 'VERIFICATION_ERROR',
        files: []
      });
    });
  });

  test('handles file selection and removal', () => {
    render(<DisputeResolution documentId="doc_12345" />);
    
    // Mock file selection
    const file = new File(['file content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText('Upload Files');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    
    fireEvent.change(fileInput);
    
    // Check that file is displayed in the list
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    
    // Remove the file
    const removeButton = screen.getByRole('button', { name: '' }); // Clear button has no accessible name
    fireEvent.click(removeButton);
    
    // Check that file is removed
    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });

  test('calls onRespondToMediator with correct data', async () => {
    const mockRespondToMediator = jest.fn().mockResolvedValue({});
    render(
      <DisputeResolution 
        disputeData={mockNeedsInfoDisputeData}
        onRespondToMediator={mockRespondToMediator}
        documentId="doc_12345" 
      />
    );
    
    // Fill in response
    fireEvent.change(screen.getByLabelText('Your Response'), {
      target: { value: 'Here is the additional information you requested.' }
    });
    
    // Submit response
    const sendButton = screen.getByRole('button', { name: /Send Response/i });
    fireEvent.click(sendButton);
    
    // Check that the function was called with correct data
    await waitFor(() => {
      expect(mockRespondToMediator).toHaveBeenCalledWith({
        disputeId: 'dispute_12345',
        response: 'Here is the additional information you requested.',
        files: []
      });
    });
  });

  test('calls onCancelDispute when cancel button is clicked', async () => {
    // Mock window.confirm to always return true
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    
    const mockCancelDispute = jest.fn().mockResolvedValue({});
    render(
      <DisputeResolution 
        disputeData={mockDisputeData}
        onCancelDispute={mockCancelDispute}
        documentId="doc_12345" 
      />
    );
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /Cancel Dispute/i });
    fireEvent.click(cancelButton);
    
    // Check that onCancelDispute was called
    await waitFor(() => {
      expect(mockCancelDispute).toHaveBeenCalledWith('dispute_12345');
    });
    
    // Restore original implementation
    window.confirm.mockRestore();
  });

  test('calls onRefreshDispute when refresh button is clicked', () => {
    const mockRefreshDispute = jest.fn();
    render(
      <DisputeResolution 
        disputeData={mockDisputeData}
        onRefreshDispute={mockRefreshDispute}
        documentId="doc_12345" 
      />
    );
    
    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /Refresh Status/i });
    fireEvent.click(refreshButton);
    
    // Check that onRefreshDispute was called
    expect(mockRefreshDispute).toHaveBeenCalledWith('dispute_12345');
  });

  test('displays communication history when available', () => {
    render(<DisputeResolution disputeData={mockDisputeData} documentId="doc_12345" />);
    
    expect(screen.getByText('Communication History')).toBeInTheDocument();
    expect(screen.getByText('We are reviewing your dispute. We'll get back to you shortly.')).toBeInTheDocument();
    expect(screen.getByText('Thank you for your patience. I've provided the additional information requested.')).toBeInTheDocument();
    
    // Check sender labels
    expect(screen.getAllByText('Mediator')[0]).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });
});