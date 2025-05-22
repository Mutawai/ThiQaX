import React from 'react';
import { render, screen, act } from '@testing-library/react';
import ScreenReaderAnnouncements from './ScreenReaderAnnouncements';

describe('ScreenReaderAnnouncements', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<ScreenReaderAnnouncements />);
    // Component should render without errors
  });

  it('renders the message in a visually hidden element', () => {
    const testMessage = 'Test announcement for screen readers';
    render(<ScreenReaderAnnouncements message={testMessage} />);
    
    const announcement = screen.getByRole('status');
    expect(announcement).toHaveTextContent(testMessage);
  });

  it('sets the correct aria-live value based on politeness prop', () => {
    const { rerender } = render(
      <ScreenReaderAnnouncements 
        message="Polite message" 
        politeness="polite" 
      />
    );
    
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    
    rerender(
      <ScreenReaderAnnouncements 
        message="Assertive message" 
        politeness="assertive" 
      />
    );
    
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'assertive');
  });

  it('clears the announcement after the specified time', () => {
    const testMessage = 'This will disappear';
    const clearTime = 1000;
    
    render(
      <ScreenReaderAnnouncements 
        message={testMessage} 
        clearAfter={clearTime} 
      />
    );
    
    expect(screen.getByRole('status')).toHaveTextContent(testMessage);
    
    // Advance timers
    act(() => {
      jest.advanceTimersByTime(clearTime + 100);
    });
    
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('updates the announcement when message prop changes', () => {
    const initialMessage = 'Initial announcement';
    const { rerender } = render(
      <ScreenReaderAnnouncements message={initialMessage} />
    );
    
    expect(screen.getByRole('status')).toHaveTextContent(initialMessage);
    
    const updatedMessage = 'Updated announcement';
    rerender(<ScreenReaderAnnouncements message={updatedMessage} />);
    
    expect(screen.getByRole('status')).toHaveTextContent(updatedMessage);
  });

  it('does not announce the same message twice when announceOnce is true', () => {
    const message = 'Repeated message';
    const { rerender } = render(
      <ScreenReaderAnnouncements 
        message={message} 
        announceOnce={true} 
      />
    );
    
    expect(screen.getByRole('status')).toHaveTextContent(message);
    
    // Clear the announcement
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(screen.getByRole('status')).toHaveTextContent('');
    
    // Try to announce the same message again
    rerender(
      <ScreenReaderAnnouncements 
        message={message} 
        announceOnce={true} 
      />
    );
    
    // The message should not be announced again
    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});