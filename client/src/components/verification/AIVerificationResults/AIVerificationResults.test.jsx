// src/components/verification/AIVerificationResults/AIVerificationResults.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIVerificationResults from './AIVerificationResults';

// Mock the responsive hook
jest.mock('../../../utils/responsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  })
}));

// Mock data for testing
const mockVerificationData = {
  id: 'ver_12345',
  timestamp: '2025-01-15T10:30:00Z',
  documentType: 'identity',
  checks: [
    {
      name: 'Document Authenticity',
      description: 'Checks if the document has valid security features',
      confidenceScore: 0.92,
      details: [
        { type: 'success', message: 'All security features verified successfully' },
        { type: 'info', message: 'Document appears to be a valid passport' }
      ]
    },
    {
      name: 'Identity Match',
      description: 'Confirms that the document belongs to the applicant',
      confidenceScore: 0.78,
      details: [
        { type: 'warning', message: 'Facial recognition confidence is below threshold' },
        { type: 'info', message: 'Name on document matches provided information' }
      ],
      imageResults: [
        { label: 'Face match', confidence: 0.78 }
      ]
    },
    {
      name: 'Tampering Detection',
      description: 'Checks for signs of document manipulation',
      confidenceScore: 0.95,
      details: [
        { type: 'success', message: 'No signs of digital manipulation detected' }
      ]
    },
    {
      name: 'Text Extraction',
      description: 'Extracts and validates document text fields',
      confidenceScore: 0.88,
      extracted: {
        'Name': 'John Doe',
        'Date of Birth': '1990-05-15',
        'Document Number': 'AB123456',
        'Expiry Date': '2030-05-14'
      }
    }
  ]
};

// Mock low confidence data
const mockLowConfidenceData = {
  id: 'ver_67890',
  timestamp: '2025-01-16T14:20:00Z',
  documentType: 'identity',
  checks: [
    {
      name: 'Document Authenticity',
      description: 'Checks if the document has valid security features',
      confidenceScore: 0.45,
      details: [
        { type: 'error', message: 'Failed to identify security features' },
        { type: 'error', message: 'Document pattern does not match known templates' }
      ]
    },
    {
      name: 'Identity Match',
      description: 'Confirms that the document belongs to the applicant',
      confidenceScore: 0.60,
      details: [
        { type: 'error', message: 'Facial recognition failed' }
      ],
      imageResults: [
        { label: 'Face match', confidence: 0.60 }
      ]
    }
  ]
};

describe('AIVerificationResults Component', () => {
  test('renders loading state correctly', () => {
    render(<AIVerificationResults loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders verification results correctly', () => {
    render(<AIVerificationResults verificationData={mockVerificationData} />);
    
    // Check that the component title is displayed
    expect(screen.getByText('AI Verification Results')).toBeInTheDocument();
    
    // Check that the overall score is displayed
    expect(screen.getByText('88%')).toBeInTheDocument();
    
    // Check that the verification status is displayed
    expect(screen.getByText('Verified')).toBeInTheDocument();
    
    // Check that individual checks are displayed
    expect(screen.getByText('Document Authenticity')).toBeInTheDocument();
    expect(screen.getByText('Identity Match')).toBeInTheDocument();
    expect(screen.getByText('Tampering Detection')).toBeInTheDocument();
    expect(screen.getByText('Text Extraction')).toBeInTheDocument();
  });

  test('expands accordion when clicked', async () => {
    render(<AIVerificationResults verificationData={mockVerificationData} />);
    
    // Get the Identity Match accordion
    const identityMatchAccordion = screen.getByText('Identity Match').closest('div[role="button"]');
    fireEvent.click(identityMatchAccordion);
    
    // Check that the accordion content is displayed
    await waitFor(() => {
      expect(screen.getByText('Facial recognition confidence is below threshold')).toBeInTheDocument();
    });
  });

  test('displays correct status for low confidence scores', () => {
    render(<AIVerificationResults verificationData={mockLowConfidenceData} />);
    
    // Check that the overall score reflects the lower confidence
    expect(screen.getByText('53%')).toBeInTheDocument();
    
    // Check that the verification status indicates failure
    expect(screen.getByText('Needs Review')).toBeInTheDocument();
  });

  test('calls onReviewComplete when approve button is clicked', () => {
    const handleReviewComplete = jest.fn();
    render(
      <AIVerificationResults 
        verificationData={mockVerificationData} 
        onReviewComplete={handleReviewComplete} 
      />
    );
    
    // Click the approve button
    const approveButton = screen.getByText('Approve Verification');
    fireEvent.click(approveButton);
    
    // Check that the onReviewComplete function was called with the expected params
    expect(handleReviewComplete).toHaveBeenCalledWith({
      approved: true,
      score: 88,
      documentType: 'identity',
      verificationId: 'ver_12345',
      timestamp: expect.any(String)
    });
  });

  test('disables approve button for low scores', () => {
    const handleReviewComplete = jest.fn();
    render(
      <AIVerificationResults 
        verificationData={mockLowConfidenceData} 
        onReviewComplete={handleReviewComplete} 
      />
    );
    
    // The approve button should be disabled
    const approveButton = screen.getByText('Approve Verification');
    expect(approveButton).toBeDisabled();
    
    // The reject button should still be enabled
    const rejectButton = screen.getByText('Reject Verification');
    expect(rejectButton).not.toBeDisabled();
  });

  test('shows extracted data when available', async () => {
    render(<AIVerificationResults verificationData={mockVerificationData} />);
    
    // Get the Text Extraction accordion
    const textExtractionAccordion = screen.getByText('Text Extraction').closest('div[role="button"]');
    fireEvent.click(textExtractionAccordion);
    
    // Check that the extracted data is displayed
    await waitFor(() => {
      expect(screen.getByText('Extracted Data')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('AB123456')).toBeInTheDocument();
    });
  });

  test('displays image analysis results when available', async () => {
    render(<AIVerificationResults verificationData={mockVerificationData} />);
    
    // Get the Identity Match accordion
    const identityMatchAccordion = screen.getByText('Identity Match').closest('div[role="button"]');
    fireEvent.click(identityMatchAccordion);
    
    // Check that the image analysis results are displayed
    await waitFor(() => {
      expect(screen.getByText('Image Analysis')).toBeInTheDocument();
      expect(screen.getByText('Face match')).toBeInTheDocument();
      expect(screen.getByText('78% confidence')).toBeInTheDocument();
    });
  });
});