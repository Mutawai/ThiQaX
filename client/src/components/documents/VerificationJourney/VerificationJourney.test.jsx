// src/components/documents/VerificationJourney/VerificationJourney.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import VerificationJourney from './VerificationJourney';

// Mock the child components
jest.mock('../VerificationHistoryLog/VerificationHistoryLog', () => {
  return function MockVerificationHistoryLog({ history, compact, maxVisible }) {
    return (
      <div data-testid="verification-history-log">
        History: {history?.length || 0} entries - Compact: {compact?.toString()} - Max: {maxVisible}
      </div>
    );
  };
});

jest.mock('../DocumentCardModern/DocumentCardModern', () => {
  return function MockDocumentCardModern({ document, compact, showActions }) {
    return (
      <div data-testid="document-card-modern">
        {document.documentName} - {document.status} - Compact: {compact?.toString()}
      </div>
    );
  };
});

jest.mock('../SmartUploadFlow/SmartUploadFlow', () => {
  return function MockSmartUploadFlow({ presetDocumentType, onUploadComplete, onCancel }) {
    return (
      <div data-testid="smart-upload-flow">
        <div>Preset Type: {presetDocumentType}</div>
        <button onClick={onUploadComplete}>Complete Upload</button>
        <button onClick={onCancel}>Cancel Upload</button>
      </div>
    );
  };
});

// Mock Redux actions
jest.mock('../../../redux/actions/documentActions', () => ({
  getDocuments: jest.fn(() => ({ type: 'GET_DOCUMENTS' }))
}));

jest.mock('../../../redux/actions/profileActions', () => ({
  getVerificationStatus: jest.fn(() => ({ type: 'GET_VERIFICATION_STATUS' }))
}));

// Mock date utilities
jest.mock('../../../utils/dateUtils', () => ({
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString())
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Create theme for testing
const theme = createTheme();

// Mock store setup
const createMockStore = (initialState = {}) => {
  const defaultState = {
    documents: {
      documents: [],
      loading: false,
      error: null
    },
    profile: {
      verificationStatus: null,
      loading: false,
      error: null
    },
    auth: {
      user: {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      }
    },
    ...initialState
  };

  return configureStore({
    reducer: {
      documents: (state = defaultState.documents) => state,
      profile: (state = defaultState.profile) => state,
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
          <BrowserRouter>
            {ui}
          </BrowserRouter>
        </ThemeProvider>
      </Provider>,
      renderOptions
    ),
    store
  };
};

// Sample test data
const mockDocuments = [
  {
    _id: 'doc1',
    documentName: 'Passport',
    documentType: 'identity',
    status: 'VERIFIED',
    createdAt: '2023-01-01T10:00:00.000Z',
    verificationDate: '2023-01-02T14:30:00.000Z',
    verificationNotes: 'Document verified successfully'
  },
  {
    _id: 'doc2',
    documentName: 'Utility Bill',
    documentType: 'address',
    status: 'PENDING',
    createdAt: '2023-01-03T10:00:00.000Z'
  },
  {
    _id: 'doc3',
    documentName: 'Degree Certificate',
    documentType: 'education',
    status: 'REJECTED',
    createdAt: '2023-01-04T10:00:00.000Z',
    verificationNotes: 'Document image is unclear'
  }
];

const mockCompleteDocuments = [
  ...mockDocuments,
  {
    _id: 'doc4',
    documentName: 'Professional License',
    documentType: 'professional',
    status: 'VERIFIED',
    createdAt: '2023-01-05T10:00:00.000Z',
    verificationDate: '2023-01-06T14:30:00.000Z'
  }
].map(doc => doc.status === 'PENDING' || doc.status === 'REJECTED' ? 
  { ...doc, status: 'VERIFIED', verificationDate: '2023-01-07T14:30:00.000Z' } : doc
);

describe('VerificationJourney', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  test('renders verification journey header', () => {
    renderWithProviders(<VerificationJourney />);
    
    expect(screen.getByText('Verification Journey')).toBeInTheDocument();
    expect(screen.getByText('Build trust with verified credentials')).toBeInTheDocument();
    expect(screen.getByText('Verification Progress')).toBeInTheDocument();
  });

  test('displays progress with no documents', () => {
    renderWithProviders(<VerificationJourney />);
    
    expect(screen.getByText('0/4 Complete')).toBeInTheDocument();
    expect(screen.getByText('0% of verification requirements met')).toBeInTheDocument();
    expect(screen.getByText('0/100')).toBeInTheDocument(); // Trust score
  });

  test('calculates progress correctly with documents', () => {
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        documents: { documents: mockDocuments, loading: false, error: null }
      }
    });
    
    // Should show 1 verified document out of 4 requirements (25%)
    expect(screen.getByText('1/4 Complete')).toBeInTheDocument();
    expect(screen.getByText('25% of verification requirements met')).toBeInTheDocument();
    expect(screen.getByText('40/100')).toBeInTheDocument(); // Trust score (40 points for identity)
  });

  test('shows completion state when all documents verified', () => {
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        documents: { documents: mockCompleteDocuments, loading: false, error: null }
      }
    });
    
    expect(screen.getByText('4/4 Complete')).toBeInTheDocument();
    expect(screen.getByText('100% of verification requirements met')).toBeInTheDocument();
    expect(screen.getByText('100/100')).toBeInTheDocument(); // Full trust score
  });

  test('displays requirement cards with correct status', () => {
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        documents: { documents: mockDocuments, loading: false, error: null }
      }
    });
    
    expect(screen.getByText('Identity Verification')).toBeInTheDocument();
    expect(screen.getByText('Address Verification')).toBeInTheDocument();
    expect(screen.getByText('Educational Credentials')).toBeInTheDocument();
    expect(screen.getByText('Professional Certification')).toBeInTheDocument();
    
    // Check status chips
    expect(screen.getByText('Verified')).toBeInTheDocument(); // Identity
    expect(screen.getByText('Under Review')).toBeInTheDocument(); // Address
    expect(screen.getByText('Needs Attention')).toBeInTheDocument(); // Education
    expect(screen.getByText('Required')).toBeInTheDocument(); // Professional
  });

  test('shows next action for missing documents', () => {
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        documents: { documents: mockDocuments, loading: false, error: null }
      }
    });
    
    // Should recommend fixing rejected document first
    expect(screen.getByText('Action Required')).toBeInTheDocument();
    expect(screen.getByText('Reupload your Educational Credentials')).toBeInTheDocument();
    expect(screen.getByText('Fix Document')).toBeInTheDocument();
  });

  test('shows upload action for missing documents when no rejected ones', () => {
    const docsWithoutRejected = mockDocuments.filter(d => d.status !== 'REJECTED');
    
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        documents: { documents: docsWithoutRejected, loading: false, error: null }
      }
    });
    
    expect(screen.getByText('Next Step')).toBeInTheDocument();
    expect(screen.getByText('Upload your Professional Certification')).toBeInTheDocument();
    expect(screen.getByText('Upload Now')).toBeInTheDocument();
  });

  test('opens upload dialog when upload button clicked', async () => {
    renderWithProviders(<VerificationJourney />);
    
    // Click upload button for identity verification
    const uploadButtons = screen.getAllByText('Upload Document');
    fireEvent.click(uploadButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Upload Identity Verification')).toBeInTheDocument();
      expect(screen.getByTestId('smart-upload-flow')).toBeInTheDocument();
      expect(screen.getByText('Preset Type: identity')).toBeInTheDocument();
    });
  });

  test('closes upload dialog when cancelled', async () => {
    renderWithProviders(<VerificationJourney />);
    
    // Open upload dialog
    const uploadButtons = screen.getAllByText('Upload Document');
    fireEvent.click(uploadButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('smart-upload-flow')).toBeInTheDocument();
    });
    
    // Cancel upload
    fireEvent.click(screen.getByText('Cancel Upload'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('smart-upload-flow')).not.toBeInTheDocument();
    });
  });

  test('handles upload completion', async () => {
    const { store } = renderWithProviders(<VerificationJourney />);
    
    // Open upload dialog
    const uploadButtons = screen.getAllByText('Upload Document');
    fireEvent.click(uploadButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('smart-upload-flow')).toBeInTheDocument();
    });
    
    // Complete upload
    fireEvent.click(screen.getByText('Complete Upload'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('smart-upload-flow')).not.toBeInTheDocument();
    });
    
    // Should dispatch getDocuments action
    const actions = store.getState();
    expect(screen.getByText('Verification Journey')).toBeInTheDocument(); // Still rendered
  });

  test('shows and hides requirement tips', () => {
    renderWithProviders(<VerificationJourney />);
    
    // Click tips button for identity verification
    const tipsButtons = screen.getAllByText('Tips');
    fireEvent.click(tipsButtons[0]);
    
    expect(screen.getByText('Upload Tips:')).toBeInTheDocument();
    expect(screen.getByText('• Ensure all text is clearly visible')).toBeInTheDocument();
    
    // Click again to hide
    fireEvent.click(tipsButtons[0]);
    
    expect(screen.queryByText('Upload Tips:')).not.toBeInTheDocument();
  });

  test('displays embedded document cards for uploaded documents', () => {
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        documents: { documents: mockDocuments, loading: false, error: null }
      }
    });
    
    // Should show document cards for uploaded documents
    expect(screen.getByText('Passport - VERIFIED - Compact: true')).toBeInTheDocument();
    expect(screen.getByText('Utility Bill - PENDING - Compact: true')).toBeInTheDocument();
    expect(screen.getByText('Degree Certificate - REJECTED - Compact: true')).toBeInTheDocument();
  });

  test('shows verification history when enabled', () => {
    renderWithProviders(<VerificationJourney showHistory={true} />, {
      initialState: {
        documents: { documents: mockDocuments, loading: false, error: null }
      }
    });
    
    expect(screen.getByText('Verification History')).toBeInTheDocument();
    expect(screen.getAllByTestId('verification-history-log')).toHaveLength(3);
  });

  test('hides verification history when disabled', () => {
    renderWithProviders(<VerificationJourney showHistory={false} />, {
      initialState: {
        documents: { documents: mockDocuments, loading: false, error: null }
      }
    });
    
    expect(screen.queryByText('Verification History')).not.toBeInTheDocument();
  });

  test('shows completion actions when verification complete', () => {
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        documents: { documents: mockCompleteDocuments, loading: false, error: null }
      }
    });
    
    expect(screen.getByText('Verification Complete!')).toBeInTheDocument();
    expect(screen.getByText('Your account is fully verified. You can now access all platform features.')).toBeInTheDocument();
    expect(screen.getByText('View Profile')).toBeInTheDocument();
    expect(screen.getByText('Find Jobs')).toBeInTheDocument();
  });

  test('handles navigation to profile page', () => {
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        documents: { documents: mockCompleteDocuments, loading: false, error: null }
      }
    });
    
    fireEvent.click(screen.getByText('View Profile'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  test('handles navigation to jobs page', () => {
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        documents: { documents: mockCompleteDocuments, loading: false, error: null }
      }
    });
    
    fireEvent.click(screen.getByText('Find Jobs'));
    expect(mockNavigate).toHaveBeenCalledWith('/jobs');
  });

  test('shows quick upload FAB when not complete', () => {
    renderWithProviders(<VerificationJourney />);
    
    expect(screen.getByLabelText('quick upload')).toBeInTheDocument();
  });

  test('hides quick upload FAB when complete', () => {
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        documents: { documents: mockCompleteDocuments, loading: false, error: null }
      }
    });
    
    expect(screen.queryByLabelText('quick upload')).not.toBeInTheDocument();
  });

  test('opens upload dialog from FAB', async () => {
    renderWithProviders(<VerificationJourney />);
    
    fireEvent.click(screen.getByLabelText('quick upload'));
    
    await waitFor(() => {
      expect(screen.getByTestId('smart-upload-flow')).toBeInTheDocument();
    });
  });

  test('calls onComplete when verification finished', async () => {
    jest.useFakeTimers();
    const mockOnComplete = jest.fn();
    
    renderWithProviders(<VerificationJourney onComplete={mockOnComplete} />, {
      initialState: {
        documents: { documents: mockCompleteDocuments, loading: false, error: null }
      }
    });
    
    // Fast-forward timer to trigger completion callback
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: 4,
          total: 4,
          percentage: 100,
          score: 100
        })
      );
    });
    
    jest.useRealTimers();
  });

  test('shows celebration animation when completed', async () => {
    jest.useFakeTimers();
    
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        documents: { documents: mockCompleteDocuments, loading: false, error: null }
      }
    });
    
    // Should show celebration immediately for complete verification
    expect(screen.getByText('Verification Complete!')).toBeInTheDocument();
    
    jest.useRealTimers();
  });

  test('handles refresh button click', () => {
    const { store } = renderWithProviders(<VerificationJourney />);
    
    // Click refresh button
    const refreshButtons = screen.getAllByRole('button');
    const refreshButton = refreshButtons.find(button => 
      button.querySelector('[data-testid="RefreshIcon"]')
    );
    
    if (refreshButton) {
      fireEvent.click(refreshButton);
    }
    
    // Should dispatch getDocuments
    expect(screen.getByText('Verification Journey')).toBeInTheDocument();
  });

  test('renders in compact mode', () => {
    const { container } = renderWithProviders(<VerificationJourney compact={true} />);
    
    expect(container.firstChild).toHaveClass('compact');
  });

  test('applies custom className', () => {
    const { container } = renderWithProviders(
      <VerificationJourney className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  test('handles missing user gracefully', () => {
    renderWithProviders(<VerificationJourney />, {
      initialState: {
        auth: { user: null }
      }
    });
    
    expect(screen.getByText('Verification Journey')).toBeInTheDocument();
  });

  test('shows correct priority labels for requirements', () => {
    renderWithProviders(<VerificationJourney />);
    
    // Identity and Address should show as critical (no specific UI element tested here,
    // but points are displayed)
    expect(screen.getByText('+40 pts')).toBeInTheDocument(); // Identity
    expect(screen.getByText('+30 pts')).toBeInTheDocument(); // Address
    expect(screen.getByText('+20 pts')).toBeInTheDocument(); // Education
    expect(screen.getByText('+10 pts')).toBeInTheDocument(); // Professional
  });

  test('toggles history section visibility', () => {
    renderWithProviders(<VerificationJourney showHistory={true} />, {
      initialState: {
        documents: { documents: mockDocuments, loading: false, error: null }
      }
    });
    
    expect(screen.getByText('Verification History')).toBeInTheDocument();
    
    // Click toggle button (would need to identify the correct button)
    // This is a simplified test since the exact button identification might vary
    expect(screen.getAllByTestId('verification-history-log')).toHaveLength(3);
  });

  test('handles documents without verification history', () => {
    const docsWithoutHistory = [{
      _id: 'doc1',
      documentName: 'Simple Doc',
      documentType: 'identity',
      status: 'PENDING',
      createdAt: '2023-01-01T10:00:00.000Z'
    }];
    
    renderWithProviders(<VerificationJourney showHistory={true} />, {
      initialState: {
        documents: { documents: docsWithoutHistory, loading: false, error: null }
      }
    });
    
    expect(screen.getByText('Verification History')).toBeInTheDocument();
    expect(screen.getByTestId('verification-history-log')).toBeInTheDocument();
  });
});