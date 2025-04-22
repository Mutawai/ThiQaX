// src/components/verification/VerificationComparison/VerificationComparison.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VerificationComparison from './VerificationComparison';

// Mock the responsive hook
jest.mock('../../../utils/responsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  })
}));

// Mock verification results for testing
const mockVerificationResults = [
  {
    id: 'ver_12345',
    verified: true,
    confidenceScore: 92,
    timestamp: '2025-02-10T09:30:00Z',
    method: 'AI-Enhanced',
    verifier: 'System',
    documentType: 'Passport',
    expiryDate: '2030-02-10T00:00:00Z',
    isPreferred: true,
    checks: [
      {
        name: 'Document Authenticity',
        description: 'Checks if the document has valid security features',
        result: true
      },
      {
        name: 'Identity Match',
        description: 'Confirms that the document belongs to the applicant',
        result: 0.89
      },
      {
        name: 'Data Consistency',
        description: 'Checks if all data fields are consistent',
        result: true
      }
    ],
    extractedData: {
      'Full Name': 'John Smith',
      'Date of Birth': '1990-05-15',
      'Document Number': 'AB123456',
      'Issuing Country': 'United Kingdom'
    }
  },
  {
    id: 'ver_67890',
    verified: false,
    confidenceScore: 65,
    timestamp: '2025-02-09T14:20:00Z',
    method: 'Standard',
    verifier: 'System',
    documentType: 'ID Card',
    expiryDate: '2030-02-10T00:00:00Z',
    isPreferred: false,
    checks: [
      {
        name: 'Document Authenticity',
        description: 'Checks if the document has valid security features',
        result: false
      },
      {
        name: 'Identity Match',
        description: 'Confirms that the document belongs to the applicant',
        result: 0.75
      },
      {
        name: 'Tamper Detection',
        description: 'Checks for signs of document tampering',
        result: false
      }
    ],
    extractedData: {
      'Full Name': 'John Smyth',
      'Date of Birth': '1990-05-15',
      'Document Number': 'XY789012',
      'Nationality': 'British'
    }
  },
  {
    id: 'ver_24680',
    verified: true,
    confidenceScore: 88,
    timestamp: '2025-02-08T11:15:00Z',
    method: 'Manual',
    verifier: 'Admin User',
    documentType: 'Passport',
    isPreferred: false,
    checks: [
      {
        name: 'Document Authenticity',
        description: 'Checks if the document has valid security features',
        result: true
      },
      {
        name: 'Identity Match',
        description: 'Confirms that the document belongs to the applicant',
        result: 0.92
      }
    ],
    extractedData: {
      'Full Name': 'John Smith',
      'Date of Birth': '1990-05-15',
      'Document Number': 'AB123456'
    }
  }
];

describe('VerificationComparison Component', () => {
  test('renders loading state correctly', () => {
    render(<VerificationComparison loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders message when less than 2 verification results', () => {
    const onBackFn = jest.fn();
    render(
      <VerificationComparison 
        verificationResults={[mockVerificationResults[0]]} 
        onBack={onBackFn}
      />
    );
    
    expect(screen.getByText(/At least two verification results are needed/i)).toBeInTheDocument();
    
    // Test back button
    const backButton = screen.getByRole('button', { name: /Back to Document Details/i });
    fireEvent.click(backButton);
    expect(onBackFn).toHaveBeenCalled();
  });

  test('renders comparison with two results correctly', () => {
    render(
      <VerificationComparison 
        verificationResults={mockVerificationResults} 
        documentId="doc_12345"
      />
    );
    
    // Check for component title
    expect(screen.getByText('Verification Comparison')).toBeInTheDocument();
    
    // Check for result headers
    expect(screen.getByText('Result 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Result 2 of 3')).toBeInTheDocument();
    
    // Check for status chips
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Not Verified')).toBeInTheDocument();
    
    // Check for tabs
    expect(screen.getByRole('tab', { name: 'Overview Comparison' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Detailed Checks' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Extracted Data' })).toBeInTheDocument();
    
    // Check for table data in overview tab
    expect(screen.getByText('Verification Method')).toBeInTheDocument();
    expect(screen.getByText('AI-Enhanced')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
  });

  test('changes tabs correctly', async () => {
    render(
      <VerificationComparison 
        verificationResults={mockVerificationResults} 
        documentId="doc_12345"
      />
    );
    
    // By default, Overview tab should be active
    expect(screen.getByText('Overall Confidence')).toBeInTheDocument();
    
    // Click on Detailed Checks tab
    const detailedChecksTab = screen.getByRole('tab', { name: 'Detailed Checks' });
    fireEvent.click(detailedChecksTab);
    
    // Should show detailed checks content
    await waitFor(() => {
      expect(screen.getByText('Document Authenticity')).toBeInTheDocument();
      expect(screen.getByText('Identity Match')).toBeInTheDocument();
      expect(screen.getByText('Data Consistency')).toBeInTheDocument();
      expect(screen.getByText('Tamper Detection')).toBeInTheDocument();
    });
    
    // Click on Extracted Data tab
    const extractedDataTab = screen.getByRole('tab', { name: 'Extracted Data' });
    fireEvent.click(extractedDataTab);
    
    // Should show extracted data content
    await waitFor(() => {
      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('John Smyth')).toBeInTheDocument();
      expect(screen.getByText('Document Number')).toBeInTheDocument();
      expect(screen.getByText('AB123456')).toBeInTheDocument();
      expect(screen.getByText('XY789012')).toBeInTheDocument();
    });
  });

  test('navigates between results', () => {
    render(
      <VerificationComparison 
        verificationResults={mockVerificationResults} 
        documentId="doc_12345"
      />
    );
    
    // Initially should show result 1 and 2
    expect(screen.getByText('Result 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Result 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('AI-Enhanced')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    
    // Navigate to next result in second column
    const nextButton = screen.getAllByRole('button', { name: 'Next result' })[1];
    fireEvent.click(nextButton);
    
    // Should now show result 1 and 3
    expect(screen.getByText('Result 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Result 3 of 3')).toBeInTheDocument();
    expect(screen.getByText('AI-Enhanced')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
    
    // Navigate to previous result in first column
    const prevButton = screen.getAllByRole('button', { name: 'Previous result' })[0];
    fireEvent.click(prevButton);
    
    // Should now be disabled since we're at result 1
    expect(prevButton).toBeDisabled();
  });

  test('calls onSelectResult when selecting a result', async () => {
    const selectResultFn = jest.fn().mockResolvedValue({});
    render(
      <VerificationComparison 
        verificationResults={mockVerificationResults} 
        documentId="doc_12345"
        onSelectResult={selectResultFn}
      />
    );
    
    // The first result should show as preferred already
    expect(screen.getByText('Preferred Result')).toBeInTheDocument();
    
    // Click to select the second result
    const selectButton = screen.getByText('Select as Preferred');
    fireEvent.click(selectButton);
    
    // Check that onSelectResult was called with correct params
    await waitFor(() => {
      expect(selectResultFn).toHaveBeenCalledWith('doc_12345', 'ver_67890');
    });
  });

  test('displays "Not specified" for missing data', () => {
    // Create a version with missing data
    const resultsWithMissingData = [
      {
        ...mockVerificationResults[0],
        documentType: null,
        extractedData: {}
      },
      mockVerificationResults[1]
    ];
    
    render(
      <VerificationComparison 
        verificationResults={resultsWithMissingData} 
        documentId="doc_12345"
      />
    );
    
    // Check for "Not specified" text
    expect(screen.getByText('Not specified')).toBeInTheDocument();
  });

  test('shows alert when no extracted data available', async () => {
    // Create a version with no extracted data
    const resultsWithNoExtractedData = [
      {
        ...mockVerificationResults[0],
        extractedData: null
      },
      {
        ...mockVerificationResults[1],
        extractedData: null
      }
    ];
    
    render(
      <VerificationComparison 
        verificationResults={resultsWithNoExtractedData} 
        documentId="doc_12345"
      />
    );
    
    // Navigate to extracted data tab
    const extractedDataTab = screen.getByRole('tab', { name: 'Extracted Data' });
    fireEvent.click(extractedDataTab);
    
    // Should show alert about no extracted data
    await waitFor(() => {
      expect(screen.getByText('No data was extracted from the document in these verification results.')).toBeInTheDocument();
    });
  });
});