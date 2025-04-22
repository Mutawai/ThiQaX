// src/components/verification/BlockchainVerificationDetails/BlockchainVerificationDetails.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BlockchainVerificationDetails from './BlockchainVerificationDetails';

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve())
  }
});

// Mock data for testing
const mockVerifiedBlockchainData = {
  status: 'VERIFIED',
  documentHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
  transactionHash: '0xabc123def456ghi789jkl012mno345pqr678stu',
  timestamp: '2025-01-20T14:30:45Z',
  network: 'Ethereum',
  documentId: 'doc_12345',
  documentType: 'identity',
  issuerId: 'thiqax_system',
  expiryDate: '2030-01-01T00:00:00Z',
  explorerUrl: 'https://etherscan.io/tx/0xabc123def456ghi789jkl012mno345pqr678stu',
  verificationUrl: 'https://verify.thiqax.com/document/doc_12345',
  publicVerificationUrl: 'https://public.thiqax.com/verify',
  verificationCode: 'THQX-1234-ABCD',
  qrCodeUrl: 'https://api.thiqax.com/qrcode/THQX-1234-ABCD',
  blockData: {
    number: 14567890,
    timestamp: '2025-01-20T14:35:12Z'
  },
  verificationData: {
    issuerName: 'ThiQaX Identity Verification',
    verifierName: 'System',
    documentName: 'Kenya National ID',
    verificationLevel: 'ENHANCED'
  }
};

const mockPendingBlockchainData = {
  status: 'PENDING',
  documentHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
  transactionHash: '0xabc123def456ghi789jkl012mno345pqr678stu',
  timestamp: '2025-01-20T14:30:45Z',
  network: 'Ethereum',
  documentId: 'doc_12345',
  documentType: 'identity',
  issuerId: 'thiqax_system'
};

describe('BlockchainVerificationDetails Component', () => {
  test('renders loading state correctly', () => {
    render(<BlockchainVerificationDetails loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders unverified state correctly', () => {
    const verifyFn = jest.fn();
    render(<BlockchainVerificationDetails onVerify={verifyFn} documentId="doc_12345" />);
    
    expect(screen.getByText('Not Verified On Blockchain')).toBeInTheDocument();
    
    const verifyButton = screen.getByRole('button', { name: /verify document/i });
    expect(verifyButton).toBeInTheDocument();
    
    fireEvent.click(verifyButton);
    expect(verifyFn).toHaveBeenCalledWith('doc_12345');
  });

  test('renders verified blockchain data correctly', () => {
    render(
      <BlockchainVerificationDetails 
        blockchainData={mockVerifiedBlockchainData} 
        documentId="doc_12345" 
      />
    );
    
    // Check that the component title is displayed
    expect(screen.getByText('Blockchain Verification')).toBeInTheDocument();
    
    // Check that the verification status is correct
    expect(screen.getByText('Verified')).toBeInTheDocument();
    
    // Check that transaction hash is displayed
    expect(screen.getByText('0xabc123def456ghi789jkl012mno345pqr678stu')).toBeInTheDocument();
    
    // Check that block number is displayed
    expect(screen.getByText('14567890')).toBeInTheDocument();
  });

  test('renders pending blockchain data correctly', () => {
    render(
      <BlockchainVerificationDetails 
        blockchainData={mockPendingBlockchainData} 
        documentId="doc_12345" 
      />
    );
    
    // Check that the verification status is correct
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  test('expands accordion when clicked', async () => {
    render(
      <BlockchainVerificationDetails 
        blockchainData={mockVerifiedBlockchainData} 
        documentId="doc_12345" 
      />
    );
    
    // The first accordion should be expanded by default
    expect(screen.getByText('Blockchain Transaction Details')).toBeInTheDocument();
    
    // Get the Document Record Details accordion
    const recordAccordion = screen.getByText('Document Record Details').closest('div[role="button"]');
    fireEvent.click(recordAccordion);
    
    // Check that the accordion content is displayed
    await waitFor(() => {
      expect(screen.getByText('Document Hash')).toBeInTheDocument();
      expect(screen.getByText('Verification Metadata')).toBeInTheDocument();
    });
  });

  test('copies text to clipboard when copy button is clicked', async () => {
    render(
      <BlockchainVerificationDetails 
        blockchainData={mockVerifiedBlockchainData} 
        documentId="doc_12345" 
      />
    );
    
    // Find and click a copy button
    const copyButtons = screen.getAllByRole('button', { name: /copy to clipboard/i });
    fireEvent.click(copyButtons[0]); // Transaction Hash copy button
    
    // Verify clipboard API was called with correct text
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockVerifiedBlockchainData.transactionHash);
  });

  test('opens verification code modal when button is clicked', async () => {
    render(
      <BlockchainVerificationDetails 
        blockchainData={mockVerifiedBlockchainData} 
        documentId="doc_12345" 
      />
    );
    
    // Find and click the verification code button
    const codeButton = screen.getByRole('button', { name: /verification code/i });
    fireEvent.click(codeButton);
    
    // Check that the modal is displayed
    await waitFor(() => {
      expect(screen.getByText('Blockchain Verification Code')).toBeInTheDocument();
      expect(screen.getByText('THQX-1234-ABCD')).toBeInTheDocument();
      expect(screen.getByAltText('Verification QR Code')).toBeInTheDocument();
    });
    
    // Close the modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Check that the modal is closed
    await waitFor(() => {
      expect(screen.queryByText('Blockchain Verification Code')).not.toBeInTheDocument();
    });
  });

  test('calls onVerify when refresh button is clicked', () => {
    const verifyFn = jest.fn();
    render(
      <BlockchainVerificationDetails 
        blockchainData={mockVerifiedBlockchainData} 
        onVerify={verifyFn}
        documentId="doc_12345" 
      />
    );
    
    // Find and click the refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh verification/i });
    fireEvent.click(refreshButton);
    
    // Verify onVerify function was called
    expect(verifyFn).toHaveBeenCalledWith('doc_12345');
  });
});