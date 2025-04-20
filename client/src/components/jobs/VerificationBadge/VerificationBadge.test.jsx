// src/components/jobs/VerificationBadge/VerificationBadge.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import VerificationBadge from './VerificationBadge';

// Create a theme for testing
const theme = createTheme();

// Wrap component with ThemeProvider
const renderWithTheme = (ui) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('VerificationBadge', () => {
  test('renders verification icon by default', () => {
    renderWithTheme(<VerificationBadge />);
    
    // Check if the verification icon is rendered
    const icon = screen.getByTestId('VerifiedUserIcon');
    expect(icon).toBeInTheDocument();
  });
  
  test('renders with custom tooltip text', () => {
    renderWithTheme(<VerificationBadge tooltip="Custom verification tooltip" />);
    
    // Check if the tooltip is rendered with the custom text
    const tooltip = screen.getByTitle('Custom verification tooltip');
    expect(tooltip).toBeInTheDocument();
  });
  
  test('does not render tooltip when tooltip prop is false', () => {
    renderWithTheme(<VerificationBadge tooltip={false} />);
    
    // The icon should be rendered without a tooltip
    const icon = screen.getByTestId('VerifiedUserIcon');
    expect(icon).toBeInTheDocument();
    expect(icon).not.toHaveAttribute('title');
  });
  
  test('renders as standalone badge', () => {
    renderWithTheme(<VerificationBadge standalone />);
    
    // Check if the avatar (used for standalone badge) is rendered
    const avatar = screen.getByRole('img');
    expect(avatar).toBeInTheDocument();
  });
  
  test('renders different tooltip text based on type', () => {
    const { rerender } = renderWithTheme(<VerificationBadge type="job" />);
    
    // Job verification tooltip
    expect(screen.getByTitle('This job posting has been verified and is legitimate')).toBeInTheDocument();
    
    // Company verification tooltip
    rerender(<ThemeProvider theme={theme}><VerificationBadge type="company" /></ThemeProvider>);
    expect(screen.getByTitle('This company has been verified and is legitimate')).toBeInTheDocument();
    
    // Sponsor verification tooltip
    rerender(<ThemeProvider theme={theme}><VerificationBadge type="sponsor" /></ThemeProvider>);
    expect(screen.getByTitle('This sponsor has been verified and is legitimate')).toBeInTheDocument();
  });
  
  test('renders with children', () => {
    renderWithTheme(
      <VerificationBadge>
        <div data-testid="badge-child">Child Content</div>
      </VerificationBadge>
    );
    
    // Check if children are rendered
    const child = screen.getByTestId('badge-child');
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent('Child Content');
    
    // Check if badge component is rendered
    const badge = screen.getByRole('img');
    expect(badge).toBeInTheDocument();
  });
  
  test('renders with different sizes', () => {
    const { rerender } = renderWithTheme(<VerificationBadge standalone size="small" />);
    
    // Small size badge
    let avatar = screen.getByRole('img');
    expect(avatar).toHaveStyle({ width: '16px', height: '16px' });
    
    // Medium size badge
    rerender(<ThemeProvider theme={theme}><VerificationBadge standalone size="medium" /></ThemeProvider>);
    avatar = screen.getByRole('img');
    expect(avatar).toHaveStyle({ width: '20px', height: '20px' });
    
    // Large size badge
    rerender(<ThemeProvider theme={theme}><VerificationBadge standalone size="large" /></ThemeProvider>);
    avatar = screen.getByRole('img');
    expect(avatar).toHaveStyle({ width: '24px', height: '24px' });
  });
  
  test('applies custom color', () => {
    renderWithTheme(<VerificationBadge standalone color="#ff0000" />);
    
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveStyle({ backgroundColor: '#ff0000' });
  });
});