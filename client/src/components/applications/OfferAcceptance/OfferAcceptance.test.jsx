import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OfferAcceptance from './OfferAcceptance';
import applicationService from '../../services/applicationService';

// Mock the application service
jest.mock('../../services/applicationService');

describe('OfferAcceptance Component', () => {
  const mockApplication = {
    id: '12345',
    jobTitle: 'Senior Housekeeper',
    employer: 'Al Faisal Hospitality',
    location: 'Dubai, UAE',
    salary: '$1,500 per month',
    startDate: '2025-06-01',
    offerExpiryDate: '2025-05-15',
    offerLetter: 'https://example.com/offer-letter.pdf',
    hasOffer: true
  };
  
  const mockOnComplete = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders offer details correctly', () => {
    render(<OfferAcceptance application={mockApplication} onComplete={mockOnComplete} />);
    
    expect(screen.getByText('Job Offer')).toBeInTheDocument();
    expect(screen.getByText('Senior Housekeeper')).toBeInTheDocument();
    expect(screen.getByText('Al Faisal Hospitality')).toBeInTheDocument();
    expect(screen.getByText('Dubai, UAE')).toBeInTheDocument();
    expect(screen.getByText('$1,500 per month')).toBeInTheDocument();
    expect(screen.getByText('2025-06-01')).toBeInTheDocument();
    expect(screen.getByText('This offer is valid until:')).toBeInTheDocument();
    expect(screen.getByText('2025-05-15')).toBeInTheDocument();
    expect(screen.getByText('View Offer Letter')).toBeInTheDocument();
  });
  
  test('does not render if no offer exists', () => {
    const applicationWithoutOffer = { ...mockApplication, hasOffer: false };
    const { container } = render(
      <OfferAcceptance application={applicationWithoutOffer} onComplete={mockOnComplete} />
    );
    
    expect(container).toBeEmptyDOMElement();
  });
  
  test('opens acceptance confirmation modal', () => {
    render(<OfferAcceptance application={mockApplication} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByText('Accept Offer'));
    
    expect(screen.getByText('Accept Offer', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to accept this job offer/)).toBeInTheDocument();
    expect(screen.getByText('Confirm Acceptance')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
  
  test('opens decline confirmation modal with reason field', () => {
    render(<OfferAcceptance application={mockApplication} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByText('Decline Offer'));
    
    expect(screen.getByText('Decline Offer', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to decline this job offer/)).toBeInTheDocument();
    expect(screen.getByText('Please provide a reason (optional):')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Please let us know why you're declining this offer...")).toBeInTheDocument();
    expect(screen.getByText('Confirm Decline')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
  
  test('handles offer acceptance successfully', async () => {
    applicationService.acceptOffer.mockResolvedValue({ data: { success: true } });
    
    render(<OfferAcceptance application={mockApplication} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByText('Accept Offer'));
    fireEvent.click(screen.getByText('Confirm Acceptance'));
    
    await waitFor(() => {
      expect(applicationService.acceptOffer).toHaveBeenCalledWith('12345');
      expect(mockOnComplete).toHaveBeenCalled();
      expect(screen.getByText(/Offer accepted successfully/)).toBeInTheDocument();
    });
  });
  
  test('handles offer decline with reason', async () => {
    applicationService.declineOffer.mockResolvedValue({ data: { success: true } });
    
    render(<OfferAcceptance application={mockApplication} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByText('Decline Offer'));
    
    const reasonTextarea = screen.getByPlaceholderText("Please let us know why you're declining this offer...");
    fireEvent.change(reasonTextarea, { target: { value: 'Found another position' } });
    
    fireEvent.click(screen.getByText('Confirm Decline'));
    
    await waitFor(() => {
      expect(applicationService.declineOffer).toHaveBeenCalledWith('12345', 'Found another position');
      expect(mockOnComplete).toHaveBeenCalled();
      expect(screen.getByText(/Offer declined/)).toBeInTheDocument();
    });
  });
  
  test('displays error message on API failure', async () => {
    applicationService.acceptOffer.mockRejectedValue({ 
      response: { data: { message: 'Server error. Please try again later.' } } 
    });
    
    render(<OfferAcceptance application={mockApplication} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByText('Accept Offer'));
    fireEvent.click(screen.getByText('Confirm Acceptance'));
    
    await waitFor(() => {
      expect(applicationService.acceptOffer).toHaveBeenCalledWith('12345');
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });
});