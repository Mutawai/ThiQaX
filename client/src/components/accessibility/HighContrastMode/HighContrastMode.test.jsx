import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import HighContrastMode, {
  HighContrastProvider, 
  HighContrastToggle,
  useHighContrast
} from './HighContrastMode';

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] ?? null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Mock matchMedia
const mockMatchMedia = (matches) => {
  return jest.fn().mockImplementation(query => {
    return {
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };
  });
};

describe('HighContrastMode', () => {
  // Set up mocks
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    mockLocalStorage.clear();
    
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia(false),
      writable: true
    });
    
    // Mock classList on document.documentElement
    document.documentElement.classList = {
      add: jest.fn(),
      remove: jest.fn()
    };
  });

  it('renders children correctly', () => {
    render(
      <HighContrastMode>
        <div data-testid="test-child">Test Content</div>
      </HighContrastMode>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toHaveTextContent('Test Content');
  });

  it('does not show toggle by default', () => {
    render(
      <HighContrastMode>
        <div>Test Content</div>
      </HighContrastMode>
    );
    
    expect(screen.queryByText('High Contrast Mode')).not.toBeInTheDocument();
  });

  it('shows toggle when showToggle is true', () => {
    render(
      <HighContrastMode showToggle>
        <div>Test Content</div>
      </HighContrastMode>
    );
    
    expect(screen.getByText('High Contrast Mode')).toBeInTheDocument();
  });

  it('uses custom toggle label when provided', () => {
    render(
      <HighContrastMode showToggle toggleLabel="Custom Label">
        <div>Test Content</div>
      </HighContrastMode>
    );
    
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });
});

describe('HighContrastProvider', () => {
  it('initializes from localStorage if available', () => {
    // Set localStorage value
    localStorage.setItem('thiqax-high-contrast-mode', 'true');
    
    // Create a test component that uses the context
    const TestComponent = () => {
      const { highContrast } = useHighContrast();
      return <div data-testid="contrast-value">{highContrast.toString()}</div>;
    };
    
    render(
      <HighContrastProvider>
        <TestComponent />
      </HighContrastProvider>
    );
    
    expect(screen.getByTestId('contrast-value')).toHaveTextContent('true');
  });

  it('initializes from system preference if localStorage is not set', () => {
    // Set matchMedia to return true
    window.matchMedia = mockMatchMedia(true);
    
    // Create a test component that uses the context
    const TestComponent = () => {
      const { highContrast } = useHighContrast();
      return <div data-testid="contrast-value">{highContrast.toString()}</div>;
    };
    
    render(
      <HighContrastProvider>
        <TestComponent />
      </HighContrastProvider>
    );
    
    expect(screen.getByTestId('contrast-value')).toHaveTextContent('true');
  });

  it('adds high-contrast-mode class to document root when enabled', () => {
    // Set localStorage value
    localStorage.setItem('thiqax-high-contrast-mode', 'true');
    
    render(
      <HighContrastProvider>
        <div>Test Content</div>
      </HighContrastProvider>
    );
    
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('high-contrast-mode');
  });

  it('removes high-contrast-mode class from document root when disabled', () => {
    // Set localStorage value
    localStorage.setItem('thiqax-high-contrast-mode', 'false');
    
    render(
      <HighContrastProvider>
        <div>Test Content</div>
      </HighContrastProvider>
    );
    
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('high-contrast-mode');
  });

  it('saves preference to localStorage when changed', () => {
    // Create a test component that toggles the preference
    const TestComponent = () => {
      const { toggleHighContrast } = useHighContrast();
      return <button onClick={toggleHighContrast}>Toggle</button>;
    };
    
    render(
      <HighContrastProvider>
        <TestComponent />
      </HighContrastProvider>
    );
    
    // Click the toggle button
    fireEvent.click(screen.getByText('Toggle'));
    
    // Check that localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('thiqax-high-contrast-mode', 'true');
  });

  it('uses custom storageKey when provided', () => {
    // Create a test component that toggles the preference
    const TestComponent = () => {
      const { toggleHighContrast } = useHighContrast();
      return <button onClick={toggleHighContrast}>Toggle</button>;
    };
    
    render(
      <HighContrastProvider storageKey="custom-key">
        <TestComponent />
      </HighContrastProvider>
    );
    
    // Click the toggle button
    fireEvent.click(screen.getByText('Toggle'));
    
    // Check that localStorage was updated with the custom key
    expect(localStorage.setItem).toHaveBeenCalledWith('custom-key', 'true');
  });
});

describe('HighContrastToggle', () => {
  // Create a wrapper with the provider
  const renderWithProvider = (ui, providerProps = {}) => {
    return render(
      <HighContrastProvider {...providerProps}>
        {ui}
      </HighContrastProvider>
    );
  };

  it('displays the correct label', () => {
    renderWithProvider(<HighContrastToggle label="Custom Label" />);
    
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('toggles the high contrast mode when clicked', () => {
    renderWithProvider(<HighContrastToggle />);
    
    // Get the initial state
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    
    // Click the button
    fireEvent.click(button);
    
    // Check that the state changed
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies active class when high contrast is enabled', () => {
    // Set localStorage to true
    localStorage.setItem('thiqax-high-contrast-mode', 'true');
    
    renderWithProvider(<HighContrastToggle />);
    
    // The button should have the active class
    const button = screen.getByRole('button');
    expect(button.className).toContain('active');
  });

  it('applies custom classes when provided', () => {
    renderWithProvider(
      <HighContrastToggle 
        className="custom-container-class" 
        buttonClassName="custom-button-class" 
      />
    );
    
    // Check the container class
    const container = screen.getByRole('button').parentElement;
    expect(container.className).toContain('custom-container-class');
    
    // Check the button class
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-button-class');
  });
});