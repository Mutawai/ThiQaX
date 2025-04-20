import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApplicationFeedback from './ApplicationFeedback';
import applicationService from '../../services/applicationService';

// Mock the application service
jest.mock('../../services/applicationService');

describe('ApplicationFeedback Component', () => {
  const mockApplicationId = '12345';
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('does not render when application is not completed', () => {
    const { container } = render(
      <ApplicationFeedback 
        applicationId={mockApplicationId} 
        isCompleted={false} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    expect(container).toBeEmptyDOMElement();
  });
  
  test('renders feedback form when application is completed', () => {
    render(
      <ApplicationFeedback 
        applicationId={mockApplicationId} 
        isCompleted={true} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    expect(screen.getByText('Application Feedback')).toBeInTheDocument();
    expect(screen.getByText('Rate your overall experience:')).toBeInTheDocument();
    expect(screen.getByText('Share your thoughts (optional):')).toBeInTheDocument();
    expect(screen.getByText('Submit Feedback')).toBeInTheDocument();
    expect(screen.getByText('No rating selected')).toBeInTheDocument();
  });
  
  test('allows rating selection', () => {
    render(
      <ApplicationFeedback 
        applicationId={mockApplicationId} 
        isCompleted={true} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    // Find all star buttons
    const starButtons = screen.getAllByRole('button');
    expect(starButtons.length).toBe(5);
    
    // Click on the fourth star
    fireEvent.click(starButtons[3]);
    
    expect(screen.getByText('4 stars')).toBeInTheDocument();
  });
  
  test('handles feedback text input', () => {
    render(
      <ApplicationFeedback 
        applicationId={mockApplicationId} 
        isCompleted={true} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    const textarea = screen.getByPlaceholderText('What worked well? What could be improved? Any other comments or suggestions?');
    fireEvent.change(textarea, { target: { value: 'This was a great experience!' } });
    
    expect(textarea.value).toBe('This was a great experience!');
  });
  
  test('displays error when trying to submit without rating', () => {
    render(
      <ApplicationFeedback 
        applicationId={mockApplicationId} 
        isCompleted={true} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    const submitButton = screen.getByText('Submit Feedback');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Please select a rating.')).toBeInTheDocument();
    expect(applicationService.submitFeedback).not.toHaveBeenCalled();
  });
  
  test('submits feedback successfully', async () => {
    applicationService.submitFeedback.mockResolvedValue({ data: { success: true } });
    
    render(
      <ApplicationFeedback 
        applicationId={mockApplicationId} 
        isCompleted={true} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    // Select rating
    const starButtons = screen.getAllByRole('button');
    fireEvent.click(starButtons[4]); // 5 stars
    
    // Add feedback
    const textarea = screen.getByPlaceholderText('What worked well? What could be improved? Any other comments or suggestions?');
    fireEvent.change(textarea, { target: { value: 'Excellent platform, very user-friendly!' } });
    
    // Submit the form
    const submitButton = screen.getByText('Submit Feedback');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(applicationService.submitFeedback).toHaveBeenCalledWith(
        '12345', 
        { 
          rating: 5, 
          feedback: 'Excellent platform, very user-friendly!' 
        }
      );
      expect(mockOnSubmit).toHaveBeenCalledWith({ 
        rating: 5, 
        feedback: 'Excellent platform, very user-friendly!' 
      });
      expect(screen.getByText(/Thank you for your feedback/)).toBeInTheDocument();
    });
  });
  
  test('displays error message on API failure', async () => {
    applicationService.submitFeedback.mockRejectedValue({ 
      response: { data: { message: 'Server error. Please try again later.' } } 
    });
    
    render(
      <ApplicationFeedback 
        applicationId={mockApplicationId} 
        isCompleted={true} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    // Select rating
    const starButtons = screen.getAllByRole('button');
    fireEvent.click(starButtons[2]); // 3 stars
    
    // Submit the form
    const submitButton = screen.getByText('Submit Feedback');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(applicationService.submitFeedback).toHaveBeenCalledWith(
        '12345', 
        { 
          rating: 3, 
          feedback: '' 
        }
      );
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
  
  test('handles hover state on rating stars', () => {
    render(
      <ApplicationFeedback 
        applicationId={mockApplicationId} 
        isCompleted={true} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    const starButtons = screen.getAllByRole('button');
    
    // Hover over the third star
    fireEvent.mouseEnter(starButtons[2]);
    
    // Check that the first three stars have the "filled" class
    const stars = document.querySelectorAll(`.${CSS.escape('star')}`);
    expect(stars[0]).toHaveClass('filled');
    expect(stars[1]).toHaveClass('filled');
    expect(stars[2]).toHaveClass('filled');
    expect(stars[3]).not.toHaveClass('filled');
    expect(stars[4]).not.toHaveClass('filled');
    
    // Mouse leave the stars container
    fireEvent.mouseLeave(document.querySelector(`.${CSS.escape('starsContainer')}`));
    
    // Now none should be filled since we haven't selected any
    expect(stars[0]).not.toHaveClass('filled');
    expect(stars[1]).not.toHaveClass('filled');
    expect(stars[2]).not.toHaveClass('filled');
    expect(stars[3]).not.toHaveClass('filled');
    expect(stars[4]).not.toHaveClass('filled');
  });
});