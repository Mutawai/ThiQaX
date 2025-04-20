// src/components/documents/ExpirationNotice/ExpirationNotice.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpirationNotice from './ExpirationNotice';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a theme for testing
const theme = createTheme({
  palette: {
    error: {
      main: '#f44336',
      light: '#ffebee',
      lighter: '#ffebee',
      dark: '#d32f2f'
    },
    warning: {
      main: '#ff9800',
      light: '#fff3e0',
      lighter: '#fff3e0',
      dark: '#f57c00'
    },
    success: {
      main: '#4caf50',
      light: '#e8f5e9',
      lighter: '#e8f5e9'
    },
    primary: {
      main: '#2196f3',
      light: '#e3f2fd',
      lighter: '#e3f2fd'
    }
  }
});

// Helper function to wrap component with necessary providers
const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

// Helper to create date strings
const futureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const pastDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

describe('ExpirationNotice', () => {
  test('renders "Expired" notice for expired documents', () => {
    renderWithProviders(<ExpirationNotice expiryDate={pastDate(10)} />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  test('renders "Expired" notice for documents with EXPIRED status', () => {
    renderWithProviders(
      <ExpirationNotice expiryDate={futureDate(10)} verificationStatus="EXPIRED" />
    );
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  test('renders "Expiring Soon" notice for documents expiring within critical threshold', () => {
    renderWithProviders(
      <ExpirationNotice expiryDate={futureDate(5)} criticalThreshold={7} />
    );
    expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
  });

  test('renders "Expiration Approaching" notice for documents expiring within warning threshold', () => {
    renderWithProviders(
      <ExpirationNotice expiryDate={futureDate(20)} warningThreshold={30} criticalThreshold={7} />
    );
    expect(screen.getByText('Expiration Approaching')).toBeInTheDocument();
  });

  test('renders "Valid" notice for documents not expiring soon', () => {
    renderWithProviders(
      <ExpirationNotice expiryDate={futureDate(60)} warningThreshold={30} />
    );
    expect(screen.getByText('Valid')).toBeInTheDocument();
  });

  test('renders "No Expiry Date" notice when no expiry date is provided', () => {
    renderWithProviders(<ExpirationNotice showLabel={true} />);
    expect(screen.getByText('No Expiry Date')).toBeInTheDocument();
  });

  test('shows nothing when no expiry date and showLabel is false', () => {
    const { container } = renderWithProviders(
      <ExpirationNotice expiryDate={null} showLabel={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders banner variant correctly', () => {
    renderWithProviders(
      <ExpirationNotice expiryDate={pastDate(10)} variant="banner" />
    );
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText(/This document has expired/)).toBeInTheDocument();
  });

  test('renders compact variant correctly with tooltip', () => {
    renderWithProviders(
      <ExpirationNotice expiryDate={pastDate(10)} compact={true} />
    );
    // Tooltip is rendered but not in the document until hover
    expect(screen.queryByText('Expired')).not.toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    renderWithProviders(
      <ExpirationNotice expiryDate={pastDate(10)} onClick={handleClick} />
    );
    fireEvent.click(screen.getByText('Expired'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies custom class name', () => {
    const className = 'custom-class';
    const { container } = renderWithProviders(
      <ExpirationNotice expiryDate={pastDate(10)} className={className} />
    );
    expect(container.firstChild).toHaveClass(className);
  });
});