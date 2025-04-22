// src/components/verification/TrustScoreExplanation/TrustScoreExplanation.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrustScoreExplanation from './TrustScoreExplanation';

// Mock the responsive hook
jest.mock('../../../utils/responsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  })
}));

// Mock data for testing
const mockTrustScoreData = {
  score: 85,
  timestamp: '2025-03-15T14:30:00Z',
  trend: 'up',
  trendValue: 5,
  summary: 'This document has a high trust score based on strong verification results and consistent data.',
  highlights: [
    {
      type: 'success',
      message: 'All security features verified successfully'
    },
    {
      type: 'warning',
      message: 'Document is close to expiration date'
    }
  ],
  factors: [
    {
      id: 'auth_factor',
      name: 'Authentication',
      type: 'authentication',
      score: 90,
      maxScore: 100,
      weight: 30,
      impact: 'high',
      description: 'Measures the authenticity of the document based on security features.',
      details: [
        { text: 'All security features present and valid', positive: true },
        { text: 'Digital signature verified', positive: true }
      ]
    },
    {
      id: 'data_factor',
      name: 'Data Quality',
      type: 'data_quality',
      score: 80,
      maxScore: 100,
      weight: 25,
      impact: 'medium',
      description: 'Evaluates the consistency and quality of extracted data.',
      details: [
        { text: 'Data fields are consistent across the document', positive: true },
        { text: 'Minor OCR issues detected in some fields', negative: true }
      ]
    },
    {
      id: 'history_factor',
      name: 'Document History',
      type: 'history',
      score: 85,
      maxScore: 100,
      weight: 20,
      impact: 'medium',
      description: 'Examines the document\'s verification history and changes.',
      details: [
        { text: 'Multiple successful verifications in the past', positive: true }
      ]
    }
  ],
  recommendations: [
    {
      title: 'Renew Document Soon',
      description: 'This document is approaching its expiration date. Consider renewal to maintain a high trust score.',
      priority: 'medium',
      factorId: 'history_factor',
      impact: 'Will prevent trust score degradation in the coming months'
    },
    {
      title: 'Improve Image Quality',
      description: 'A clearer scan would improve data extraction quality.',
      priority: 'low',
      factorId: 'data_factor',
      impact: 'Could increase trust score by 3-5 points'
    }
  ],
  history: [
    {
      timestamp: '2025-03-15T14:30:00Z',
      score: 85,
      change: 5,
      reason: 'Additional verification completed'
    },
    {
      timestamp: '2025-02-20T09:15:00Z',
      score: 80,
      change: 0,
      reason: 'Initial verification'
    }
  ]
};

describe('TrustScoreExplanation Component', () => {
  test('renders loading state correctly', () => {
    render(<TrustScoreExplanation loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders empty state when no data is available', () => {
    const onRefreshMock = jest.fn();
    render(<TrustScoreExplanation onRefresh={onRefreshMock} />);
    
    expect(screen.getByText(/No trust score data is available/i)).toBeInTheDocument();
    
    // Test refresh button
    const refreshButton = screen.getByRole('button', { name: /Check for Trust Score/i });
    fireEvent.click(refreshButton);
    expect(onRefreshMock).toHaveBeenCalled();
  });

  test('renders trust score data correctly', () => {
    render(<TrustScoreExplanation trustScoreData={mockTrustScoreData} />);
    
    // Check for component title
    expect(screen.getByText('Trust Score Explanation')).toBeInTheDocument();
    
    // Check for score display
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('High Trust')).toBeInTheDocument();
    
    // Check for trend indicator
    expect(screen.getByText('+5')).toBeInTheDocument();
    
    // Check for summary
    expect(screen.getByText(/This document has a high trust score/i)).toBeInTheDocument();
    
    // Check for highlights
    expect(screen.getByText('All security features verified successfully')).toBeInTheDocument();
    expect(screen.getByText('Document is close to expiration date')).toBeInTheDocument();
  });

  test('displays factor details correctly', () => {
    render(<TrustScoreExplanation trustScoreData={mockTrustScoreData} />);
    
    // Factors should be visible by default (expanded)
    expect(screen.getByText('Trust Score Factors')).toBeInTheDocument();
    
    // Check for factor cards
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getByText('Data Quality')).toBeInTheDocument();
    expect(screen.getByText('Document History')).toBeInTheDocument();
    
    // Check for factor details
    expect(screen.getByText('All security features present and valid')).toBeInTheDocument();
    expect(screen.getByText('Minor OCR issues detected in some fields')).toBeInTheDocument();
    
    // Check for weight percentages
    expect(screen.getByText('Weight: 40%')).toBeInTheDocument();
    expect(screen.getByText('Weight: 33%')).toBeInTheDocument();
    expect(screen.getByText('Weight: 27%')).toBeInTheDocument();
  });

  test('expands recommendation accordion when clicked', async () => {
    render(<TrustScoreExplanation trustScoreData={mockTrustScoreData} />);
    
    // Click on Recommendations accordion
    const recommendationsHeader = screen.getByText('Recommendations');
    fireEvent.click(recommendationsHeader);
    
    // Check that recommendations content is displayed
    await waitFor(() => {
      expect(screen.getByText('Renew Document Soon')).toBeInTheDocument();
      expect(screen.getByText('Improve Image Quality')).toBeInTheDocument();
      expect(screen.getByText(/This document is approaching its expiration date/i)).toBeInTheDocument();
    });
  });

  test('expands history accordion when clicked', async () => {
    render(<TrustScoreExplanation trustScoreData={mockTrustScoreData} />);
    
    // Click on Trust Score History accordion
    const historyHeader = screen.getByText('Trust Score History');
    fireEvent.click(historyHeader);
    
    // Check that history content is displayed
    await waitFor(() => {
      expect(screen.getByText('Additional verification completed')).toBeInTheDocument();
      expect(screen.getByText('Initial verification')).toBeInTheDocument();
    });
    
    // Check for history data in table
    const historyRows = screen.getAllByRole('row');
    expect(historyRows.length).toBe(3); // Header + 2 history rows
  });

  test('calls onExport when export button is clicked', () => {
    const onExportMock = jest.fn();
    render(
      <TrustScoreExplanation 
        trustScoreData={mockTrustScoreData} 
        onExport={onExportMock} 
      />
    );
    
    // Click export button
    const exportButton = screen.getByRole('button', { name: /Export Report/i });
    fireEvent.click(exportButton);
    
    // Check that onExport was called
    expect(onExportMock).toHaveBeenCalled();
  });

  test('calls onRefresh when refresh button is clicked', () => {
    const onRefreshMock = jest.fn();
    render(
      <TrustScoreExplanation 
        trustScoreData={mockTrustScoreData} 
        onRefresh={onRefreshMock} 
      />
    );
    
    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /Refresh Trust Score/i });
    fireEvent.click(refreshButton);
    
    // Check that onRefresh was called
    expect(onRefreshMock).toHaveBeenCalled();
  });

  test('correctly formats and displays dates', () => {
    render(<TrustScoreExplanation trustScoreData={mockTrustScoreData} />);
    
    // Check for formatted timestamp
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    
    // Click on Trust Score History accordion to see dates
    const historyHeader = screen.getByText('Trust Score History');
    fireEvent.click(historyHeader);
    
    // We can't check the exact formatted string as it depends on the formatDateTime implementation
    // But we can check that the dates are displayed
    expect(screen.getAllByRole('cell')[4]).toHaveTextContent(/202[0-9]/); // First history entry date
    expect(screen.getAllByRole('cell')[8]).toHaveTextContent(/202[0-9]/); // Second history entry date
  });

  test('calculates and displays correct factor weight percentages', () => {
    // Create a modified version with different weights to test calculation
    const modifiedData = {
      ...mockTrustScoreData,
      factors: mockTrustScoreData.factors.map((factor, index) => ({
        ...factor,
        weight: 10 * (index + 1) // Weights of 10, 20, 30
      }))
    };
    
    render(<TrustScoreExplanation trustScoreData={modifiedData} />);
    
    // Check weight percentages (10/60=17%, 20/60=33%, 30/60=50%)
    expect(screen.getByText('Weight: 17%')).toBeInTheDocument();
    expect(screen.getByText('Weight: 33%')).toBeInTheDocument();
    expect(screen.getByText('Weight: 50%')).toBeInTheDocument();
  });
});