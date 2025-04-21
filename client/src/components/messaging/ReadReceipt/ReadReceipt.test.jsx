// client/src/components/messaging/ReadReceipt/ReadReceipt.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReadReceipt from './ReadReceipt';

describe('ReadReceipt Component', () => {
  // Sample timestamp for testing
  const testTimestamp = '2025-04-18T14:30:00.000Z';
  
  test('renders sending state correctly', () => {
    render(<ReadReceipt isSent={false} />);
    // Should show sending dots animation
    const dotsContainer = document.querySelector('.pending');
    expect(dotsContainer).toBeInTheDocument();
  });
  
  test('renders delivered state correctly', () => {
    render(<ReadReceipt isSent={true} isRead={false} />);
    // Should show single checkmark icon
    const icon = document.querySelector('.deliveredIcon');
    expect(icon).toBeInTheDocument();
  });
  
  test('renders read state correctly', () => {
    render(<ReadReceipt isRead={true} readAt={testTimestamp} />);
    // Should show double checkmark icon
    const icon = document.querySelector('.readIcon');
    expect(icon).toBeInTheDocument();
  });
  
  test('displays formatted timestamp when read', () => {
    render(<ReadReceipt isRead={true} readAt={testTimestamp} />);
    
    // Format the expected time based on local timezone
    const expectedTime = new Date(testTimestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const timestamp = document.querySelector('.timestamp');
    expect(timestamp).toBeInTheDocument();
    expect(timestamp).toHaveTextContent(expectedTime);
  });
  
  test('does not display timestamp when not read', () => {
    render(<ReadReceipt isRead={false} readAt={testTimestamp} />);
    const timestamp = document.querySelector('.timestamp');
    expect(timestamp).not.toBeInTheDocument();
  });
  
  test('aligns to the right when alignRight prop is true', () => {
    render(<ReadReceipt alignRight={true} />);
    const container = document.querySelector('.container');
    expect(container).toHaveClass('alignRight');
  });
});