// client/src/components/integration/MessageDocumentShare/MessageDocumentShare.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import MessageDocumentShare from './MessageDocumentShare';

// Mock data
const mockDocuments = [
  {
    _id: 'doc1',
    description: 'National ID Card',
    documentType: 'IDENTITY',
    originalname: 'national-id.jpg',
    size: 1024000,
    status: 'VERIFIED',
    verifiedAt: '2025-04-15T10:00:00Z',
    url: '/uploads/doc1.jpg'
  },
  {
    _id: 'doc2',
    description: 'University Diploma',
    documentType: 'EDUCATIONAL',
    originalname: 'diploma.pdf',
    size: 2048000,
    status: 'VERIFIED',
    verifiedAt: '2025-04-14T09:00:00Z',
    url: '/uploads/doc2.pdf'
  },
  {
    _id: 'doc3',
    description: 'Utility Bill',
    documentType: 'ADDRESS_PROOF',
    originalname: 'utility-bill.pdf',
    size: 512000,
    status: 'PENDING',
    url: '/uploads/doc3.pdf'
  }
];

const mockUser = {
  _id: 'user1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
};

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: mockUser }, action) => state,
      documents: (state = { documents: mockDocuments, loading: false }, action) => state,
      messages: (state = { currentConversation: null }, action) => state
    },
    preloadedState: initialState
  });
};

// Mock functions
const mockOnDocumentShare = jest.fn(() => Promise.resolve());

// Test wrapper component
const TestWrapper = ({ store, ...props }) => (
  <Provider store={store}>
    <MessageDocumentShare {...props} />
  </Provider>
);

describe('MessageDocumentShare Component', () => {
  let store;
  
  beforeEach(() => {
    store = createMockStore();
    mockOnDocumentShare.mockClear();
  });
  
  const defaultProps = {
    conversationId: 'conv1',
    recipientId: 'user2',
    onDocumentShare: mockOnDocumentShare
  };
  
  test('renders share button correctly', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    const shareButton = screen.getByLabelText('Share documents');
    expect(shareButton).toBeInTheDocument();
  });
  
  test('opens dialog when share button is clicked', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Initially dialog should not be visible
    expect(screen.queryByText('Share Documents')).not.toBeInTheDocument();
    
    // Click share button
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Dialog should now be visible
    expect(screen.getByText('Share Documents')).toBeInTheDocument();
  });
  
  test('displays only verified documents', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Open dialog
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Should show verified documents
    expect(screen.getByText('National ID Card')).toBeInTheDocument();
    expect(screen.getByText('University Diploma')).toBeInTheDocument();
    
    // Should not show pending document
    expect(screen.queryByText('Utility Bill')).not.toBeInTheDocument();
  });
  
  test('filters documents based on search term', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Open dialog
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Search for "diploma"
    const searchInput = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(searchInput, { target: { value: 'diploma' } });
    
    // Should show only diploma
    expect(screen.getByText('University Diploma')).toBeInTheDocument();
    expect(screen.queryByText('National ID Card')).not.toBeInTheDocument();
  });
  
  test('selects and deselects documents correctly', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Open dialog
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Get checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    
    // Initially no documents should be selected
    expect(screen.queryByText('Selected Documents')).not.toBeInTheDocument();
    
    // Select first document
    fireEvent.click(checkboxes[0]);
    
    // Should show selected documents section
    expect(screen.getByText('Selected Documents (1)')).toBeInTheDocument();
    expect(screen.getByText('National ID Card')).toBeInTheDocument();
    
    // Select second document
    fireEvent.click(checkboxes[1]);
    
    // Should show 2 selected documents
    expect(screen.getByText('Selected Documents (2)')).toBeInTheDocument();
    
    // Deselect first document
    fireEvent.click(checkboxes[0]);
    
    // Should show 1 selected document
    expect(screen.getByText('Selected Documents (1)')).toBeInTheDocument();
  });
  
  test('removes documents using chip delete', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Open dialog
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Select a document
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    
    // Should show selected document chip
    expect(screen.getByText('Selected Documents (1)')).toBeInTheDocument();
    
    // Click delete on chip
    const chipDeleteButton = document.querySelector('.MuiChip-deleteIcon');
    fireEvent.click(chipDeleteButton);
    
    // Selected documents section should disappear
    expect(screen.queryByText('Selected Documents')).not.toBeInTheDocument();
  });
  
  test('calls onDocumentShare when share button is clicked', async () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Open dialog
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Select a document
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    
    // Add share message
    const messageInput = screen.getByPlaceholderText('Add a message (optional)...');
    fireEvent.change(messageInput, { target: { value: 'Here are my documents' } });
    
    // Click share button
    const shareButton = screen.getByRole('button', { name: /Share 1 Document/ });
    fireEvent.click(shareButton);
    
    // Should call onDocumentShare with correct data
    await waitFor(() => {
      expect(mockOnDocumentShare).toHaveBeenCalledWith({
        conversationId: 'conv1',
        recipientId: 'user2',
        documents: [{
          documentId: 'doc1',
          documentType: 'IDENTITY',
          description: 'National ID Card',
          filename: 'national-id.jpg',
          url: '/uploads/doc1.jpg'
        }],
        message: 'Here are my documents'
      });
    });
  });
  
  test('shows error when trying to share without selecting documents', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Open dialog
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Try to share without selecting documents
    const shareButton = screen.getByRole('button', { name: /Share 0 Documents/ });
    fireEvent.click(shareButton);
    
    // Should show error message
    expect(screen.getByText('Please select at least one document to share')).toBeInTheDocument();
  });
  
  test('handles share error correctly', async () => {
    const mockOnDocumentShareError = jest.fn(() => Promise.reject(new Error('Share failed')));
    
    render(<TestWrapper store={store} {...defaultProps} onDocumentShare={mockOnDocumentShareError} />);
    
    // Open dialog
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Select a document
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    
    // Click share button
    const shareButton = screen.getByRole('button', { name: /Share 1 Document/ });
    fireEvent.click(shareButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Share failed')).toBeInTheDocument();
    });
  });
  
  test('shows loading state when documents are being fetched', () => {
    const loadingStore = createMockStore({
      auth: { user: mockUser },
      documents: { documents: [], loading: true },
      messages: { currentConversation: null }
    });
    
    render(<TestWrapper store={loadingStore} {...defaultProps} />);
    
    // Open dialog
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Should show loading spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('shows empty state when no verified documents available', () => {
    const emptyStore = createMockStore({
      auth: { user: mockUser },
      documents: { documents: [], loading: false },
      messages: { currentConversation: null }
    });
    
    render(<TestWrapper store={emptyStore} {...defaultProps} />);
    
    // Open dialog
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Should show empty state message
    expect(screen.getByText('No verified documents available')).toBeInTheDocument();
    expect(screen.getByText('Only verified documents can be shared in messages')).toBeInTheDocument();
  });
  
  test('opens document preview when view button is clicked', () => {
    // Mock window.open
    const mockOpen = jest.fn();
    window.open = mockOpen;
    
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Open dialog
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Click preview button for first document
    const previewButtons = screen.getAllByTitle('Preview document');
    fireEvent.click(previewButtons[0]);
    
    // Should call window.open with document URL
    expect(mockOpen).toHaveBeenCalledWith('/uploads/doc1.jpg', '_blank');
  });
  
  test('disables component when disabled prop is true', () => {
    render(<TestWrapper store={store} {...defaultProps} disabled={true} />);
    
    const shareButton = screen.getByLabelText('Share documents');
    expect(shareButton).toBeDisabled();
  });
  
  test('closes dialog when close button is clicked', () => {
    render(<TestWrapper store={store} {...defaultProps} />);
    
    // Open dialog
    fireEvent.click(screen.getByLabelText('Share documents'));
    
    // Dialog should be visible
    expect(screen.getByText('Share Documents')).toBeInTheDocument();
    
    // Click close button
    const closeButton = screen.getByRole('button', { name: '' }); // Close icon button
    fireEvent.click(closeButton);
    
    // Dialog should be closed
    expect(screen.queryByText('Share Documents')).not.toBeInTheDocument();
  });
});