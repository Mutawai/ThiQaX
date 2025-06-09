// client/src/components/kyc/KYCStatus/KYCStatus.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import KYCStatus from './KYCStatus';

// Mock Redux actions
jest.mock('../../../redux/actions/profileActions', () => ({
  checkKYCStatus: jest.fn(() => ({ type: 'CHECK_KYC_STATUS' })),
  downloadKYCCertificate: jest.fn(() => ({ type: 'DOWNLOAD_KYC_CERTIFICATE' }))
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Create mock store
const createMockStore = (kycStatus = 'unverified', kycDetails = null) => {
  return configureStore({
    reducer: {
      auth: (state = {
        kycStatus,
        kycDetails,
        profile: { id: '123', name: 'John Doe' }
      }) => state
    }
  });
};

describe('KYCStatus Component', () => {
  const mockOnStartVerification = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const renderKYCStatus = (store, props = {}) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <KYCStatus {...props} />
        </BrowserRouter>
      </Provider>
    );
  };
  
  test('renders unverified status correctly', () => {
    const store = createMockStore('unverified');
    renderKYCStatus(store);
    
    expect(screen.getByText('KYC Verification Status')).toBeInTheDocument();
    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('You have not started the KYC verification process.')).toBeInTheDocument();
    expect(screen.getByText('Start Verification')).toBeInTheDocument();
  });
  
  test('renders pending status with progress bar', () => {
    const store = createMockStore('pending');
    renderKYCStatus(store);
    
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(screen.getByText('Your documents are being reviewed by our verification team.')).toBeInTheDocument();
    expect(screen.getByText('Verification Progress')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Estimated time: 1-2 business days')).toBeInTheDocument();
  });
  
  test('renders verified status with details', () => {
    const kycDetails = {
      verifiedAt: '2024-01-15T10:00:00Z',
      expiresAt: '2025-01-15T10:00:00Z',
      verificationId: 'VER123456'
    };
    const store = createMockStore('verified', kycDetails);
    renderKYCStatus(store);
    
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Your identity has been successfully verified.')).toBeInTheDocument();
    expect(screen.getByText('Download Certificate')).toBeInTheDocument();
    expect(screen.getByText('VER123456')).toBeInTheDocument();
  });
  
  test('renders rejected status with reason', () => {
    const kycDetails = {
      rejectionReason: 'ID document is not clear. Please upload a higher quality image.'
    };
    const store = createMockStore('rejected', kycDetails);
    renderKYCStatus(store);
    
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Your verification was rejected. Please review the feedback and resubmit.')).toBeInTheDocument();
    expect(screen.getByText('Rejection Reason:')).toBeInTheDocument();
    expect(screen.getByText('ID document is not clear. Please upload a higher quality image.')).toBeInTheDocument();
    expect(screen.getByText('Resubmit Documents')).toBeInTheDocument();
  });
  
  test('renders incomplete status with missing documents', () => {
    const kycDetails = {
      missingDocuments: ['Address Proof', 'Selfie with ID']
    };
    const store = createMockStore('incomplete', kycDetails);
    renderKYCStatus(store);
    
    expect(screen.getByText('Incomplete')).toBeInTheDocument();
    expect(screen.getByText('Additional documents are required to complete verification.')).toBeInTheDocument();
    expect(screen.getByText('Missing Documents:')).toBeInTheDocument();
    expect(screen.getByText('Address Proof')).toBeInTheDocument();
    expect(screen.getByText('Selfie with ID')).toBeInTheDocument();
    expect(screen.getByText('Upload Missing Documents')).toBeInTheDocument();
  });
  
  test('renders expired status', () => {
    const store = createMockStore('expired');
    renderKYCStatus(store);
    
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Your verification has expired. Please submit new documents.')).toBeInTheDocument();
    expect(screen.getByText('Renew Verification')).toBeInTheDocument();
  });
  
  test('handles refresh status action', async () => {
    const { checkKYCStatus } = require('../../../redux/actions/profileActions');
    checkKYCStatus.mockResolvedValue({ success: true });
    
    const store = createMockStore('pending');
    renderKYCStatus(store);
    
    const refreshButton = screen.getByLabelText('Refresh Status');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(checkKYCStatus).toHaveBeenCalled();
    });
  });
  
  test('handles download certificate action', async () => {
    const { downloadKYCCertificate } = require('../../../redux/actions/profileActions');
    downloadKYCCertificate.mockResolvedValue({ success: true });
    
    const kycDetails = {
      verifiedAt: '2024-01-15T10:00:00Z',
      expiresAt: '2025-01-15T10:00:00Z',
      verificationId: 'VER123456'
    };
    const store = createMockStore('verified', kycDetails);
    renderKYCStatus(store);
    
    const downloadButton = screen.getByText('Download Certificate');
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(downloadKYCCertificate).toHaveBeenCalled();
    });
  });
  
  test('calls onStartVerification when provided', () => {
    const store = createMockStore('unverified');
    renderKYCStatus(store, { onStartVerification: mockOnStartVerification });
    
    fireEvent.click(screen.getByText('Start Verification'));
    expect(mockOnStartVerification).toHaveBeenCalled();
  });
  
  test('navigates to KYC page when onStartVerification not provided', () => {
    const store = createMockStore('unverified');
    renderKYCStatus(store);
    
    fireEvent.click(screen.getByText('Start Verification'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile/kyc');
  });
  
  test('navigates to resubmit page for rejected status', () => {
    const store = createMockStore('rejected');
    renderKYCStatus(store);
    
    fireEvent.click(screen.getByText('Resubmit Documents'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile/kyc/resubmit');
  });
  
  test('renders compact mode correctly', () => {
    const store = createMockStore('verified');
    renderKYCStatus(store, { compact: true });
    
    expect(screen.queryByText('KYC Verification Status')).not.toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    // In compact mode, only chip and download icon are shown
    expect(screen.getByLabelText('Download Certificate')).toBeInTheDocument();
  });
  
  test('hides actions when showActions is false', () => {
    const store = createMockStore('unverified');
    renderKYCStatus(store, { showActions: false });
    
    expect(screen.queryByText('Start Verification')).not.toBeInTheDocument();
  });
  
  test('shows info alert for pending status', () => {
    const store = createMockStore('pending');
    renderKYCStatus(store);
    
    expect(screen.getByText(/We'll notify you via email once your verification is complete/)).toBeInTheDocument();
  });
  
  test('handles error in refresh status', async () => {
    const { checkKYCStatus } = require('../../../redux/actions/profileActions');
    checkKYCStatus.mockRejectedValue(new Error('Network error'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const store = createMockStore('pending');
    renderKYCStatus(store);
    
    const refreshButton = screen.getByLabelText('Refresh Status');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to refresh KYC status:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });
});