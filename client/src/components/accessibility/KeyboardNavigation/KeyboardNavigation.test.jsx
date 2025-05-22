import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import KeyboardNavigation from './KeyboardNavigation';

describe('KeyboardNavigation', () => {
  it('renders children correctly', () => {
    render(
      <KeyboardNavigation>
        <div data-testid="test-child">Test Content</div>
      </KeyboardNavigation>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toHaveTextContent('Test Content');
  });

  it('renders skip link when showSkipLink is true', () => {
    render(
      <KeyboardNavigation 
        showSkipLink 
        skipLinkText="Skip to content"
        skipLinkTarget="#main"
      />
    );
    
    const skipLink = screen.getByText('Skip to content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main');
  });
  
  it('does not render skip link when showSkipLink is false', () => {
    render(<KeyboardNavigation />);
    
    expect(screen.queryByText('Skip to main content')).not.toBeInTheDocument();
  });
  
  it('makes skip link visible on focus and hidden on blur', () => {
    render(
      <KeyboardNavigation 
        showSkipLink 
        skipLinkText="Skip to content"
      />
    );
    
    const skipLink = screen.getByText('Skip to content');
    
    // Initially, the skip link should not have the visible class
    expect(skipLink.classList.contains('skipLinkVisible')).toBe(false);
    
    // Focus the skip link
    act(() => {
      skipLink.focus();
    });
    
    // Now it should have the visible class
    expect(skipLink.classList.contains('skipLinkVisible')).toBe(true);
    
    // Blur the skip link
    act(() => {
      skipLink.blur();
    });
    
    // It should not have the visible class again
    expect(skipLink.classList.contains('skipLinkVisible')).toBe(false);
  });
  
  it('traps focus within the component when trapFocus is true', () => {
    // Mock console.warn to avoid warnings about not being able to focus elements in jsdom
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Create a focusable element outside the trap
    document.body.innerHTML = `
      <button data-testid="outside-button">Outside</button>
      <div id="app-root"></div>
    `;
    
    const appRoot = document.getElementById('app-root');
    
    // Render the component with focus trap
    const { unmount } = render(
      <KeyboardNavigation trapFocus>
        <div>
          <button data-testid="first-button">First</button>
          <input data-testid="middle-input" />
          <button data-testid="last-button">Last</button>
        </div>
      </KeyboardNavigation>,
      { container: appRoot }
    );
    
    // Check that the first element is focused initially
    expect(screen.getByTestId('first-button')).toHaveFocus();
    
    // Tab to the next element
    fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    expect(screen.getByTestId('middle-input')).toHaveFocus();
    
    // Tab to the last element
    fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    expect(screen.getByTestId('last-button')).toHaveFocus();
    
    // Tab again should cycle back to the first element
    fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    expect(screen.getByTestId('first-button')).toHaveFocus();
    
    // Shift+Tab should go to the last element
    fireEvent.keyDown(document.activeElement, { key: 'Tab', shiftKey: true });
    expect(screen.getByTestId('last-button')).toHaveFocus();
    
    // Clean up
    unmount();
    console.warn.mockRestore();
  });
  
  it('executes keyboard shortcuts when defined', () => {
    const mockShortcutHandler = jest.fn();
    
    render(
      <KeyboardNavigation
        shortcuts={{
          'ctrl+k': mockShortcutHandler,
          'shift+alt+f': jest.fn()
        }}
      >
        <div>Test Content</div>
      </KeyboardNavigation>
    );
    
    // Trigger the keyboard shortcut
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    
    // Check that the handler was called
    expect(mockShortcutHandler).toHaveBeenCalledTimes(1);
  });
  
  it('prevents default when a shortcut is triggered', () => {
    const mockShortcutHandler = jest.fn();
    
    render(
      <KeyboardNavigation
        shortcuts={{
          'ctrl+s': mockShortcutHandler
        }}
      >
        <div>Test Content</div>
      </KeyboardNavigation>
    );
    
    // Create an event with preventDefault spy
    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
    Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
    
    // Dispatch the event
    act(() => {
      document.dispatchEvent(event);
    });
    
    // Check that preventDefault was called
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });
  
  it('focuses target element when skip link is clicked', () => {
    // Create a target element
    document.body.innerHTML = `
      <div id="app-root"></div>
      <div id="main-content" data-testid="main-content"></div>
    `;
    
    const appRoot = document.getElementById('app-root');
    
    render(
      <KeyboardNavigation 
        showSkipLink 
        skipLinkTarget="#main-content"
      />,
      { container: appRoot }
    );
    
    // Get the target element and skip link
    const targetElement = screen.getByTestId('main-content');
    const skipLink = screen.getByText('Skip to main content');
    
    // Click the skip link
    fireEvent.click(skipLink);
    
    // Check that the target element has tabindex set
    expect(targetElement).toHaveAttribute('tabindex', '-1');
    
    // Check that the target element is focused
    expect(targetElement).toHaveFocus();
  });
  
  it('logs a warning when skip link target does not exist', () => {
    // Mock console.warn
    const originalWarn = console.warn;
    const mockWarn = jest.fn();
    console.warn = mockWarn;
    
    render(
      <KeyboardNavigation 
        showSkipLink 
        skipLinkTarget="#non-existent"
      />
    );
    
    // Click the skip link
    fireEvent.click(screen.getByText('Skip to main content'));
    
    // Check that a warning was logged
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('#non-existent')
    );
    
    // Restore console.warn
    console.warn = originalWarn;
  });
});