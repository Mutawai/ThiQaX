// client/src/components/mobile/SwipeableListItem/SwipeableListItem.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SwipeableListItem from './SwipeableListItem';
import { Archive as ArchiveIcon, Delete as DeleteIcon, Star as StarIcon } from '@mui/icons-material';

// Mock touch events
const createTouchEventObject = (x, y = 0) => ({
  touches: [
    {
      clientX: x,
      clientY: y
    }
  ]
});

describe('SwipeableListItem Component', () => {
  // Mock actions
  const leftActions = [
    {
      icon: <ArchiveIcon />,
      onClick: jest.fn(),
      label: 'Archive',
      color: '#4caf50'
    }
  ];
  
  const rightActions = [
    {
      icon: <StarIcon />,
      onClick: jest.fn(),
      label: 'Star',
      color: '#2196f3'
    },
    {
      icon: <DeleteIcon />,
      onClick: jest.fn(),
      label: 'Delete',
      color: '#f44336'
    }
  ];
  
  // Mock callbacks
  const mockOnSwipeStart = jest.fn();
  const mockOnSwipeEnd = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    leftActions[0].onClick.mockReset();
    rightActions[0].onClick.mockReset();
    rightActions[1].onClick.mockReset();
    mockOnSwipeStart.mockReset();
    mockOnSwipeEnd.mockReset();
  });
  
  test('renders children correctly', () => {
    render(
      <SwipeableListItem>
        <div>Test Content</div>
      </SwipeableListItem>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
  
  test('renders with action buttons', () => {
    render(
      <SwipeableListItem
        leftActions={leftActions}
        rightActions={rightActions}
      >
        <div>Test Content</div>
      </SwipeableListItem>
    );
    
    // Actions should be in the document
    expect(screen.getByLabelText('Archive')).toBeInTheDocument();
    expect(screen.getByLabelText('Star')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
  });
  
  test('handles swipe gestures', () => {
    render(
      <SwipeableListItem
        leftActions={leftActions}
        rightActions={rightActions}
        onSwipeStart={mockOnSwipeStart}
        onSwipeEnd={mockOnSwipeEnd}
        threshold={80}
      >
        <div>Test Content</div>
      </SwipeableListItem>
    );
    
    const content = document.querySelector('.content');
    
    // Swipe right to reveal left actions
    fireEvent.touchStart(content, createTouchEventObject(0));
    expect(mockOnSwipeStart).toHaveBeenCalled();
    
    // Move to the right
    fireEvent.touchMove(content, createTouchEventObject(100));
    
    // End swipe
    fireEvent.touchEnd(content);
    expect(mockOnSwipeEnd).toHaveBeenCalled();
    
    // The content should be transformed to reveal the left action
    expect(content.style.transform).toBe('translateX(80px)');
    
    // Click on the Archive action
    fireEvent.click(screen.getByLabelText('Archive'));
    expect(leftActions[0].onClick).toHaveBeenCalled();
    
    // After clicking, the item should reset
    setTimeout(() => {
      expect(content.style.transform).toBe('translateX(0px)');
    }, 300);
  });
  
  test('respects threshold for snapping', () => {
    render(
      <SwipeableListItem
        leftActions={leftActions}
        rightActions={rightActions}
        threshold={80}
      >
        <div>Test Content</div>
      </SwipeableListItem>
    );
    
    const content = document.querySelector('.content');
    
    // Swipe right but not enough to trigger action
    fireEvent.touchStart(content, createTouchEventObject(0));
    fireEvent.touchMove(content, createTouchEventObject(50)); // Less than threshold
    fireEvent.touchEnd(content);
    
    // Should reset to original position
    setTimeout(() => {
      expect(content.style.transform).toBe('translateX(0px)');
    }, 300);
    
    // Swipe left enough to trigger first right action
    fireEvent.touchStart(content, createTouchEventObject(0));
    fireEvent.touchMove(content, createTouchEventObject(-100)); // More than threshold
    fireEvent.touchEnd(content);
    
    // Should snap to first right action
    setTimeout(() => {
      expect(content.style.transform).toBe('translateX(-80px)');
    }, 300);
  });
  
  test('handles disabled state', () => {
    render(
      <SwipeableListItem
        leftActions={leftActions}
        rightActions={rightActions}
        disabled={true}
      >
        <div>Test Content</div>
      </SwipeableListItem>
    );
    
    const content = document.querySelector('.content');
    
    // Try to swipe
    fireEvent.touchStart(content, createTouchEventObject(0));
    fireEvent.touchMove(content, createTouchEventObject(100));
    fireEvent.touchEnd(content);
    
    // Should not move when disabled
    expect(content.style.transform).toBe('translateX(0px)');
  });
  
  test('respects action auto-reset option', () => {
    // Create action with autoReset set to false
    const noResetAction = [
      {
        icon: <StarIcon />,
        onClick: jest.fn(),
        label: 'No Reset',
        autoReset: false
      }
    ];
    
    render(
      <SwipeableListItem
        leftActions={noResetAction}
      >
        <div>Test Content</div>
      </SwipeableListItem>
    );
    
    const content = document.querySelector('.content');
    
    // Swipe to reveal action
    fireEvent.touchStart(content, createTouchEventObject(0));
    fireEvent.touchMove(content, createTouchEventObject(100));
    fireEvent.touchEnd(content);
    
    // Click on the action
    fireEvent.click(screen.getByLabelText('No Reset'));
    expect(noResetAction[0].onClick).toHaveBeenCalled();
    
    // Should not reset position
    setTimeout(() => {
      expect(content.style.transform).not.toBe('translateX(0px)');
    }, 300);
  });
});