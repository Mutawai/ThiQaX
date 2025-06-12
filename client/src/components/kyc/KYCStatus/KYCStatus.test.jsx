import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import KYCStatus from './KYCStatus';
import * as documentActions from '../../../redux/actions/documentActions';
import * as integrationService from '../../../services/integrationService';

// Mock the dependencies
jest.mock('../../../redux/actions/documentActions');
jest.mock('../../../services/integrationService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ children, to, className, onClick }) => (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  )
}));

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

// Mock documents for testing
const mockDocuments = {
  passport: {
    _id: '1',
    documentType: 'passport',
    verificationStatus: 'VERIFIED',
    originalName: 'passport.jpg',
    uploadedAt: '2025-04-01T00:00:00Z'
  },
  nationalId: {
    _id: '2',
    documentType: 'national_id',
    verificationStatus: 'PENDING',
    originalName: 'national_id.jpg',
    uploadedAt: '2025-04-02T00:00:00Z'
  },
  addressProof: {
    _id: '3',
    documentType: 'address_proof',
    verificationStatus: 'VERIFIED',
    originalName: 'utility_bill.pdf',
    uploadedAt: '2025-04-03T00:00:00Z'
  },
  rejectedDoc: {
    _id: '4',
    documentType: 'passport',
    verificationStatus: 'REJECTED',
    originalName: 'passport_rejected.jpg',
    uploadedAt: '2025-04-04T00:00:00Z'
  },
  expiredDoc: {
    _id: '5',
    documentType: 'address_proof',
    verificationStatus: 'EXPIRED',
    originalName: 'expired_bill.pdf',
    uploadedAt: '2025-04-05T00:00:00Z'
  }
};

describe('KYCStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    documentActions.getDocuments = jest.fn(() => ({ type: 'GET_DOCUMENTS_REQUEST' }));
    documentActions.clearDocumentErrors = jest.fn(() => ({ type: 'CLEAR_DOCUMENT_ERRORS' }));
    
    integrationService.checkKycStatus = jest.fn(() => 
      Promise.resolve({ data: { status: 'pending', completionRate: 75 } })
    );
    integrationService.syncProfileVerification = jest.fn(() => 
      Promise.resolve({ data: { success: true } })
    );
  });

  describe('Loading and Error States', () => {
    it('shows loading spinner when documents are loading', () => {
      const initialState = {
        document: { loading: true, documents: [] }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByRole('generic')).toHaveClass('animate-spin');
    });

    it('displays error message when there is an error', () => {
      const initialState = {
        document: { error: 'Failed to load documents' }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Error Loading Status')).toBeInTheDocument();
      expect(screen.getByText('Failed to load documents')).toBeInTheDocument();
    });
  });

  describe('Status Calculation', () => {
    it('shows not started status when no documents are uploaded', () => {
      const initialState = {
        document: { documents: [] }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Not Started')).toBeInTheDocument();
      expect(screen.getByText('Begin your KYC verification process')).toBeInTheDocument();
      expect(screen.getByText('0% Complete')).toBeInTheDocument();
    });

    it('shows incomplete status when some required documents are missing', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Incomplete')).toBeInTheDocument();
      expect(screen.getByText('Some required documents are missing')).toBeInTheDocument();
    });

    it('shows pending status when documents are under review', () => {
      const initialState = {
        document: { 
          documents: [
            mockDocuments.passport,
            { ...mockDocuments.addressProof, verificationStatus: 'PENDING' }
          ] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Under Review')).toBeInTheDocument();
      expect(screen.getByText('Your documents are being verified')).toBeInTheDocument();
    });

    it('shows verified status when all required documents are verified', () => {
      const initialState = {
        document: { 
          documents: [
            mockDocuments.passport,
            mockDocuments.addressProof
          ] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Your identity has been successfully verified')).toBeInTheDocument();
    });

    it('shows rejected status when any document is rejected', () => {
      const initialState = {
        document: { 
          documents: [
            mockDocuments.rejectedDoc,
            mockDocuments.addressProof
          ] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(screen.getByText('Some documents were rejected and need to be resubmitted')).toBeInTheDocument();
    });

    it('shows expired status when any document is expired', () => {
      const initialState = {
        document: { 
          documents: [
            mockDocuments.passport,
            mockDocuments.expiredDoc
          ] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Documents Expired')).toBeInTheDocument();
      expect(screen.getByText('Some documents have expired and need renewal')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('calculates correct completion percentage for partial completion', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport] // 1 out of 2 required (identity + address)
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('50% Complete')).toBeInTheDocument();
    });

    it('handles both passport and national ID as single identity requirement', () => {
      const initialState = {
        document: { 
          documents: [
            mockDocuments.passport,
            mockDocuments.nationalId,
            mockDocuments.addressProof
          ] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      // Should be 100% complete as we have identity + address
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });
  });

  describe('Document Status Display', () => {
    it('displays correct status for each document type', () => {
      const initialState = {
        document: { 
          documents: [
            mockDocuments.passport,
            mockDocuments.nationalId,
            mockDocuments.addressProof
          ] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Passport')).toBeInTheDocument();
      expect(screen.getByText('National ID')).toBeInTheDocument();
      expect(screen.getByText('Address Proof')).toBeInTheDocument();
      
      // Check status badges
      expect(screen.getAllByText('Verified')).toHaveLength(2); // passport and address
      expect(screen.getByText('Pending')).toBeInTheDocument(); // national ID
    });

    it('shows "Not Uploaded" for missing documents', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Not Uploaded')).toBeInTheDocument(); // for address proof
    });

    it('displays additional documents section when present', () => {
      const educationDoc = {
        _id: '6',
        documentType: 'education_certificate',
        verificationStatus: 'VERIFIED',
        originalName: 'degree.pdf'
      };

      const initialState = {
        document: { 
          documents: [
            mockDocuments.passport,
            mockDocuments.addressProof,
            educationDoc
          ] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Additional Documents')).toBeInTheDocument();
      expect(screen.getByText('Education Certificate')).toBeInTheDocument();
    });
  });

  describe('Compact View', () => {
    it('renders compact view when compact prop is true', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus compact={true} />
        </TestWrapper>
      );

      expect(screen.getByText('KYC Status: Incomplete')).toBeInTheDocument();
      expect(screen.getByText('50% Complete')).toBeInTheDocument();
      
      // Should not show detailed document list in compact view
      expect(screen.queryByText('Document Status')).not.toBeInTheDocument();
    });

    it('shows action link in compact view when showActions is true', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus compact={true} showActions={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Complete Verification')).toBeInTheDocument();
    });

    it('hides action link in compact view when showActions is false', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus compact={true} showActions={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Complete Verification')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls syncProfileVerification when Refresh Status is clicked', async () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport, mockDocuments.addressProof] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      const refreshButton = screen.getByText('Refresh Status');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(integrationService.syncProfileVerification).toHaveBeenCalled();
      });
    });

    it('shows loading state when syncing verification', async () => {
      integrationService.syncProfileVerification.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const initialState = {
        document: { 
          documents: [mockDocuments.passport, mockDocuments.addressProof] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      const refreshButton = screen.getByText('Refresh Status');
      fireEvent.click(refreshButton);

      expect(screen.getByText('Syncing...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Refresh Status')).toBeInTheDocument();
      });
    });

    it('calls onStatusChange callback when status is loaded', async () => {
      const onStatusChange = jest.fn();
      const mockStatus = { status: 'verified', completionRate: 100 };
      
      integrationService.checkKycStatus.mockResolvedValue({ data: mockStatus });

      render(
        <TestWrapper>
          <KYCStatus onStatusChange={onStatusChange} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledWith(mockStatus);
      });
    });
  });

  describe('Navigation Links', () => {
    it('links to KYC page for incomplete verification', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      const actionLink = screen.getByText('Complete Verification');
      expect(actionLink.closest('a')).toHaveAttribute('href', '/kyc');
    });

    it('links to KYC page for rejected documents', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.rejectedDoc, mockDocuments.addressProof] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      const actionLink = screen.getByText('Fix Issues');
      expect(actionLink.closest('a')).toHaveAttribute('href', '/kyc');
    });

    it('does not show action button for verified status', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport, mockDocuments.addressProof] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.queryByText('Complete Verification')).not.toBeInTheDocument();
      expect(screen.queryByText('Fix Issues')).not.toBeInTheDocument();
      expect(screen.queryByText('Start Verification')).not.toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('displays progress bar for non-verified status', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Verification Progress')).toBeInTheDocument();
      expect(screen.getByText('50% Complete')).toBeInTheDocument();
    });

    it('hides progress bar for verified status', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport, mockDocuments.addressProof] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.queryByText('Verification Progress')).not.toBeInTheDocument();
    });
  });

  describe('Status Icons', () => {
    it('displays correct icons for different statuses', () => {
      // Test verified status
      const verifiedState = {
        document: { 
          documents: [mockDocuments.passport, mockDocuments.addressProof] 
        }
      };

      const { rerender } = render(
        <TestWrapper initialState={verifiedState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Verified')).toBeInTheDocument();
      
      // Test rejected status
      const rejectedState = {
        document: { 
          documents: [mockDocuments.rejectedDoc] 
        }
      };

      rerender(
        <TestWrapper initialState={rejectedState}>
          <KYCStatus />
        </TestWrapper>
      );

      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('loads documents and KYC status on mount', async () => {
      render(
        <TestWrapper>
          <KYCStatus />
        </TestWrapper>
      );

      expect(documentActions.getDocuments).toHaveBeenCalled();
      expect(integrationService.checkKycStatus).toHaveBeenCalled();
    });

    it('displays last updated timestamp', async () => {
      jest.useFakeTimers();
      const mockDate = new Date('2025-04-19T10:30:00Z');
      jest.setSystemTime(mockDate);

      render(
        <TestWrapper>
          <KYCStatus />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Props Configuration', () => {
    it('hides actions when showActions is false', () => {
      const initialState = {
        document: { 
          documents: [mockDocuments.passport] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus showActions={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Refresh Status')).not.toBeInTheDocument();
      expect(screen.queryByText('Complete Verification')).not.toBeInTheDocument();
    });

    it('handles error in status sync gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      integrationService.syncProfileVerification.mockRejectedValue(new Error('Sync failed'));

      const initialState = {
        document: { 
          documents: [mockDocuments.passport] 
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <KYCStatus />
        </TestWrapper>
      );

      const refreshButton = screen.getByText('Refresh Status');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to sync verification:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});