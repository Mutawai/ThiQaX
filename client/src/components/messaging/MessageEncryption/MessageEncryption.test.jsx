// client/src/components/messaging/MessageEncryption/MessageEncryption.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageEncryption from './MessageEncryption';

describe('MessageEncryption Component', () => {
  test('renders e2e encryption status correctly', () => {
    render(
      <MessageEncryption 
        isEncrypted={true}
        encryptionType="e2e"
        verificationStatus={true}
      />
    );
    
    expect(screen.getByText('End-to-End Encrypted')).toBeInTheDocument();
    
    // Lock icon should be present
    const lockIcon = document.querySelector('.encryptedIcon');
    expect(lockIcon).toBeInTheDocument();
    
    // Verified icon should be present
    const verifiedIcon = document.querySelector('.verifiedIcon');
    expect(verifiedIcon).toBeInTheDocument();
  });
  
  test('renders tls encryption status correctly', () => {
    render(
      <MessageEncryption 
        isEncrypted={true}
        encryptionType="tls"
        verificationStatus={true}
      />
    );
    
    expect(screen.getByText('TLS Encrypted')).toBeInTheDocument();
  });
  
  test('renders unencrypted status correctly', () => {
    render(
      <MessageEncryption 
        isEncrypted={false}
      />
    );
    
    expect(screen.getByText('Not Encrypted')).toBeInTheDocument();
    
    // Unencrypted icon should have the appropriate class
    const unencryptedIcon = document.querySelector('.unencryptedIcon');
    expect(unencryptedIcon).toBeInTheDocument();
  });
  
  test('renders unverified status correctly', () => {
    render(
      <MessageEncryption 
        isEncrypted={true}
        encryptionType="e2e"
        verificationStatus={false}
      />
    );
    
    // Lock icon should be present
    const lockIcon = document.querySelector('.encryptedIcon');
    expect(lockIcon).toBeInTheDocument();
    
    // Unverified icon should be present
    const unverifiedIcon = document.querySelector('.unverifiedIcon');
    expect(unverifiedIcon).toBeInTheDocument();
  });
  
  test('expands and collapses when clicked', () => {
    render(
      <MessageEncryption 
        isEncrypted={true}
        encryptionType="e2e"
        verificationStatus={true}
        expandable={true}
      />
    );
    
    // Initially not expanded
    expect(screen.queryByText('End-to-End (AES-256)')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(screen.getByText('End-to-End Encrypted'));
    
    // Now the details should be visible
    expect(screen.getByText('End-to-End (AES-256)')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Diffie-Hellman')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(screen.getByLabelText('Show less'));
    
    // Details should be hidden
    expect(screen.queryByText('End-to-End (AES-256)')).not.toBeInTheDocument();
  });
  
  test('does not expand when expandable is false', () => {
    render(
      <MessageEncryption 
        isEncrypted={true}
        encryptionType="e2e"
        verificationStatus={true}
        expandable={false}
      />
    );
    
    // No expand button
    expect(screen.queryByLabelText('Show more')).not.toBeInTheDocument();
    
    // Click should not expand
    fireEvent.click(screen.getByText('End-to-End Encrypted'));
    
    // Details should remain hidden
    expect(screen.queryByText('End-to-End (AES-256)')).not.toBeInTheDocument();
  });
  
  test('shows appropriate info text based on encryption type', () => {
    const { rerender } = render(
      <MessageEncryption 
        isEncrypted={true}
        encryptionType="e2e"
        expandable={true}
      />
    );
    
    // Click to expand
    fireEvent.click(screen.getByText('End-to-End Encrypted'));
    
    // Check e2e info text
    expect(screen.getByText('Messages are encrypted on your device and can only be read by you and the recipient.')).toBeInTheDocument();
    
    // Rerender with TLS
    rerender(
      <MessageEncryption 
        isEncrypted={true}
        encryptionType="tls"
        expandable={true}
      />
    );
    
    // Click to expand
    fireEvent.click(screen.getByText('TLS Encrypted'));
    
    // Check TLS info text
    expect(screen.getByText('Messages are encrypted in transit but may be visible to the server.')).toBeInTheDocument();
  });
});