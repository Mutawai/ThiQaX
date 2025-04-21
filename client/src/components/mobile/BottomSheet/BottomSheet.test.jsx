// client/src/components/mobile/BottomSheet/BottomSheet.test.jsx
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import BottomSheet from './BottomSheet';

// Mock window.innerHeight since it's used for calculations
Object.defineProperty(window, 'innerHeight', {
  configurable: true,
  value: 1000
});

// Mock getBoundingClientRect for sheet height calculations
Element.prototype.getBoundingClientRect = jest.fn(() => {
  return {
    width: 500,
    height: 500,
    top: 500,
    left: 0,
    bottom: 1000,
    right: 500
  };
});

// Mock touch events
const createTouchEvent = (y) => ({
  touches: [{ clientY: y }]
});

describe('BottomSheet Component', () => {
  // Mock callback function
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    mockOnClose.mockReset();
  });
  
  test('renders correctly when open', () => {
    render(
      <BottomSheet 
        open={true}
        onClose={mockOnClose}
        title="Test Sheet"
      >
        <div>Test Content</div>
      </BottomSheet>
    );
    
    // Title should be present
    expect(screen.getByText('Test Sheet')).toBeInTheDocument();
    
    // Content should be present
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    
    // Close button should be present
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });
  
  test('does not render when closed', () => {
    const { container } = render(
      <BottomSheet 
        open={false}
        onClose={mockOnClose}
        title="Test Sheet"
      >
        <div>Test Content</div>
      </BottomSheet>
    );
    
    // Sheet should not be in the document
    expect(screen.queryByText('Test Sheet')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });
  
  test('calls onClose when backdrop is clicked', () => {
    render(
      <BottomSheet 
        open={true}
        onClose={mockOnClose}
        title="Test Sheet"
      >
        <div>Test Content</div>
      </BottomSheet>
    );
    
    // Click the backdrop
    fireEvent.click(document.querySelector('.backdrop'));
    
    // onClose should be called
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('calls onClose when close button is clicked', () => {
    render(
      <BottomSheet 
        open={true}
        onClose={mockOnClose}
        title="Test Sheet"
      >
        <div>Test Content</div>
      </BottomSheet>
    );
    
    // Click the close button
    fireEvent.click(screen.getByLabelText('Close'));
    
    // onClose should be called
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('handles drag gestures correctly', () => {
    render(
      <BottomSheet 
        open={true}
        onClose={mockOnClose}
        title="Test Sheet"
      >
        <div>Test Content</div>
      </BottomSheet>
    );
    
    const sheetHeader = document.querySelector('.sheetHeader');
    
    // Start dragging
    fireEvent.touchStart(sheetHeader, createTouchEvent(500));
    
    // Move slightly
    fireEvent.touchMove(sheetHeader, createTouchEvent(550));
    
    // End dragging
    fireEvent.touchEnd(sheetHeader);
    
    // onClose should not be called for small movements
    expect(mockOnClose).not.toHaveBeenCalled();
    
    // Start dragging again
    fireEvent.touchStart(sheetHeader, createTouchEvent(500));
    
    // Move a lot (more than 20% of screen height)
    fireEvent.touchMove(sheetHeader, createTouchEvent(750));
    
    // End dragging
    fireEvent.touchEnd(sheetHeader);
    
    // onClose should be called for large downward movement
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('respects disableDrag prop', () => {
    render(
      <BottomSheet 
        open={true}
        onClose={mockOnClose}
        title="Test Sheet"
        disableDrag={true}
      >
        <div>Test Content</div>
      </BottomSheet>
    );
    
    const sheetHeader = document.querySelector('.sheetHeader');
    const sheet = document.querySelector('.bottomSheet');
    const initialHeight = sheet.style.height;
    
    // Start dragging
    fireEvent.touchStart(sheetHeader, createTouchEvent(500));
    
    // Move a lot
    fireEvent.touchMove(sheetHeader, createTouchEvent(700));
    
    // End dragging
    fireEvent.touchEnd(sheetHeader);
    
    // Height should not change
    expect(sheet.style.height).toBe(initialHeight);
    
    // onClose should not be called
    expect(mockOnClose).not.toHaveBeenCalled();
  });
  
  test('uses provided snapPoints', () => {
    render(
      <BottomSheet 
        open={true}
        onClose={mockOnClose}
        title="Test Sheet"
        snapPoints="25%,75%"
      >
        <div>Test Content</div>
      </BottomSheet>
    );
    
    const sheet = document.querySelector('.bottomSheet');
    
    // Initial height should be first snap point
    expect(sheet.style.height).toBe('25%');
  });
  
  test('uses fullHeight prop correctly', () => {
    render(
      <BottomSheet 
        open={true}
        onClose={mockOnClose}
        title="Test Sheet"
        fullHeight={true}
      >
        <div>Test Content</div>
      </BottomSheet>
    );
    
    const sheet = document.querySelector('.bottomSheet');
    
    // Height should be 90% for fullHeight
    expect(sheet.style.height).toBe('90%');
  });
});