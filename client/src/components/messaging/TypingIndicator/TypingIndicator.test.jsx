// client/src/components/messaging/TypingIndicator/TypingIndicator.test.jsx
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TypingIndicator from './TypingIndicator';

describe('TypingIndicator Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders when isTyping is true', () => {
    render(<TypingIndicator isTyping={true} />);
    
    const typingText = screen.getByText('Someone is typing');
    expect(typingText).toBeInTheDocument();
    
    const dotsContainer = document.querySelector('.dots');
    expect(dotsContainer).toBeInTheDocument();
  });

  test('does not render when isTyping is false', () => {
    render(<TypingIndicator isTyping={false} />);
    
    const typingText = screen.queryByText('Someone is typing');
    expect(typingText).not.toBeInTheDocument();
  });

  test('displays custom user name when provided', () => {
    render(<TypingIndicator isTyping={true} userName="John" />);
    
    const typingText = screen.getByText('John is typing');
    expect(typingText).toBeInTheDocument();
  });

  test('hides after timeout period', () => {
    render(<TypingIndicator isTyping={true} timeout={1000} />);
    
    // Initially visible
    expect(screen.getByText('Someone is typing')).toBeInTheDocument();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    
    // Should be hidden now
    expect(screen.queryByText('Someone is typing')).not.toBeInTheDocument();
  });

  test('restarts timer when isTyping changes', () => {
    const { rerender } = render(<TypingIndicator isTyping={true} timeout={2000} />);
    
    // Advance time but not enough to trigger timeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Should still be visible
    expect(screen.getByText('Someone is typing')).toBeInTheDocument();
    
    // Simulate new typing status update
    rerender(<TypingIndicator isTyping={true} timeout={2000} />);
    
    // Advance time again but not enough to trigger the new timeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Should still be visible because timer was reset
    expect(screen.getByText('Someone is typing')).toBeInTheDocument();
    
    // Advance time enough to trigger timeout
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    
    // Should be hidden now
    expect(screen.queryByText('Someone is typing')).not.toBeInTheDocument();
  });
});