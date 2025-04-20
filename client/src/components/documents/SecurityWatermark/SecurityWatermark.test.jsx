// src/components/documents/SecurityWatermark/SecurityWatermark.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import SecurityWatermark from './SecurityWatermark';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a theme for testing
const theme = createTheme();

// Helper function to wrap component with necessary providers
const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('SecurityWatermark', () => {
  test('renders with VERIFIED status correctly', () => {
    renderWithProviders(<SecurityWatermark status="VERIFIED" />);
    expect(screen.getByText('VERIFIED')).toBeInTheDocument();
  });

  test('renders with PENDING status correctly', () => {
    renderWithProviders(<SecurityWatermark status="PENDING" />);
    expect(screen.getByText('PENDING VERIFICATION')).toBeInTheDocument();
  });

  test('renders with REJECTED status correctly', () => {
    renderWithProviders(<SecurityWatermark status="REJECTED" />);
    expect(screen.getByText('REJECTED')).toBeInTheDocument();
  });

  test('renders with EXPIRED status correctly', () => {
    renderWithProviders(<SecurityWatermark status="EXPIRED" />);
    expect(screen.getByText('EXPIRED')).toBeInTheDocument();
  });

  test('renders with UNDER_REVIEW status correctly', () => {
    renderWithProviders(<SecurityWatermark status="UNDER_REVIEW" />);
    expect(screen.getByText('UNDER REVIEW')).toBeInTheDocument();
  });

  test('renders with lowercase status values correctly', () => {
    renderWithProviders(<SecurityWatermark status="verified" />);
    expect(screen.getByText('VERIFIED')).toBeInTheDocument();
  });

  test('renders with custom text when provided', () => {
    const customText = 'CUSTOM STATUS';
    renderWithProviders(
      <SecurityWatermark status="VERIFIED" customText={customText} />
    );
    expect(screen.getByText(customText)).toBeInTheDocument();
  });

  test('does not show text when showText is false', () => {
    renderWithProviders(<SecurityWatermark status="VERIFIED" showText={false} />);
    expect(screen.queryByText('VERIFIED')).not.toBeInTheDocument();
  });

  test('applies custom scale properly', () => {
    const { container } = renderWithProviders(
      <SecurityWatermark status="VERIFIED" scale={2} />
    );
    const watermark = container.firstChild;
    expect(watermark).toHaveStyle('font-size: 12rem');
  });

  test('applies custom opacity properly', () => {
    const { container } = renderWithProviders(
      <SecurityWatermark status="VERIFIED" opacity={0.5} />
    );
    const watermark = container.firstChild;
    expect(watermark).toHaveStyle('opacity: 0.5');
  });

  test('applies custom className properly', () => {
    const customClass = 'test-class';
    const { container } = renderWithProviders(
      <SecurityWatermark status="VERIFIED" className={customClass} />
    );
    expect(container.firstChild).toHaveClass(customClass);
  });
});