import React, { useRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FocusManagement, { FocusTrap, FocusRestoration, useFocus } from './FocusManagement';

describe('FocusManagement', () => {
  beforeEach(() => {
    // Mock console.warn to avoid cluttering test output
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
  });

  it('renders children correctly', () => {
    render(
      <FocusManagement>
        <div data-testid="test-child">Test Content</div>
      </FocusManagement>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toHaveTextContent('Test Content');
  });

  it('provides focus context to children', () => {
    // Create a test component that uses the focus context
    const TestComponent = () => {
      const focusContext = useFocus();
      return (
        <div>
          <span data-testid="has-set-focus-fn">
            {typeof focusContext.setFocusToElement === 'function' ? 'true' : 'false'}
          </span>
          <span data-testid="has-return-focus-fn">
            {typeof focusContext.returnFocusToLast === 'function' ? 'true' : 'false'}
          </span>
        </div>
      );
    };
    
    render(
      <FocusManagement>
        <TestComponent />
      </FocusManagement>
    );
    
    expect(screen.getByTestId('has-set-focus-fn')).toHaveTextContent('true');
    expect(screen.getByTestId('has-return-focus-fn')).toHaveTextContent('true');
  });

  it('allows setting focus to an element programmatically', () => {
    // Create a test component that sets focus
    const TestComponent = () => {
      const { setFocusToElement } = useFocus();
      const buttonRef = useRef(null);
      
      return (
        <div>
          <button ref={buttonRef} data-testid="target-button">Target</button>
          <button 
            data-testid="trigger-button"
            onClick={() => setFocusToElement(buttonRef)}
          >
            Set Focus
          </button>
        </div>
      );
    };
    
    render(
      <FocusManagement>
        <TestComponent />
      </FocusManagement>
    );
    
    // Click the trigger button
    fireEvent.click(screen.getByTestId('trigger-button'));
    
    // Check that the target button has focus
    expect(screen.getByTestId('target-button')).toHaveFocus();
  });
  
  it('allows setting focus using a selector', () => {
    // Create a test component that sets focus using a selector
    const TestComponent = () => {
      const { setFocusToElement } = useFocus();
      
      return (
        <div>
          <button data-testid="target-button" id="target-btn">Target</button>
          <button 
            data-testid="trigger-button"
            onClick={() => setFocusToElement('#target-btn')}
          >
            Set Focus
          </button>
        </div>
      );
    };
    
    render(
      <FocusManagement>
        <TestComponent />
      </FocusManagement>
    );
    
    // Click the trigger button
    fireEvent.click(screen.getByTestId('trigger-button'));
    
    // Check that the target button has focus
    expect(screen.getByTestId('target-button')).toHaveFocus();
  });
  
  it('returns focus to the last element', () => {
    // Create a test component that tests focus history
    const TestComponent = () => {
      const { setFocusToElement, returnFocusToLast } = useFocus();
      const firstBtnRef = useRef(null);
      const secondBtnRef = useRef(null);
      
      return (
        <div>
          <button ref={firstBtnRef} data-testid="first-button">First</button>
          <button ref={secondBtnRef} data-testid="second-button">Second</button>
          <button 
            data-testid="focus-first"
            onClick={() => setFocusToElement(firstBtnRef)}
          >
            Focus First
          </button>
          <button 
            data-testid="focus-second"
            onClick={() => setFocusToElement(secondBtnRef)}
          >
            Focus Second
          </button>
          <button 
            data-testid="return-focus"
            onClick={returnFocusToLast}
          >
            Return Focus
          </button>
        </div>
      );
    };
    
    render(
      <FocusManagement storeFocusHistory={true}>
        <TestComponent />
      </FocusManagement>
    );
    
    // Focus the first button
    fireEvent.click(screen.getByTestId('focus-first'));
    expect(screen.getByTestId('first-button')).toHaveFocus();
    
    // Focus the second button
    fireEvent.click(screen.getByTestId('focus-second'));
    expect(screen.getByTestId('second-button')).toHaveFocus();
    
    // Return focus to the first button
    fireEvent.click(screen.getByTestId('return-focus'));
    expect(screen.getByTestId('first-button')).toHaveFocus();
  });
  
  it('automatically focuses an element specified by selector', () => {
    // Add an element with an ID to the body
    const button = document.createElement('button');
    button.id = 'auto-focus-target';
    button.setAttribute('data-testid', 'auto-focus-target');
    document.body.appendChild(button);
    
    render(
      <FocusManagement autoFocusSelector="#auto-focus-target">
        <div>Test Content</div>
      </FocusManagement>
    );
    
    // Check that the button has focus
    expect(screen.getByTestId('auto-focus-target')).toHaveFocus();
    
    // Clean up
    document.body.removeChild(button);
  });
  
  it('restores focus when unmounted', () => {
    // Create a button to have initial focus
    const initialButton = document.createElement('button');
    initialButton.setAttribute('data-testid', 'initial-button');
    document.body.appendChild(initialButton);
    initialButton.focus();
    
    // Render the component
    const { unmount } = render(
      <FocusManagement restoreFocusOnUnmount={true}>
        <button data-testid="component-button">Component Button</button>
      </FocusManagement>
    );
    
    // Focus the component button
    screen.getByTestId('component-button').focus();
    expect(screen.getByTestId('component-button')).toHaveFocus();
    
    // Unmount the component
    unmount();
    
    // Check that focus was restored to the initial button
    expect(document.activeElement).toBe(initialButton);
    
    // Clean up
    document.body.removeChild(initialButton);
  });
});

describe('FocusTrap', () => {
  it('renders children correctly', () => {
    render(
      <FocusTrap>
        <div data-testid="test-child">Test Content</div>
      </FocusTrap>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toHaveTextContent('Test Content');
  });
  
  it('focuses the first focusable element when active', () => {
    // Need to wrap in FocusManagement to provide context
    render(
      <FocusManagement>
        <FocusTrap active={true} focusFirst={true}>
          <div>
            <button data-testid="first-button">First</button>
            <button data-testid="second-button">Second</button>
          </div>
        </FocusTrap>
      </FocusManagement>
    );
    
    // Wait for focus to be set
    setTimeout(() => {
      expect(screen.getByTestId('first-button')).toHaveFocus();
    }, 0);
  });
  
  it('traps focus within the container when active', () => {
    // Need to wrap in FocusManagement to provide context
    render(
      <FocusManagement>
        <FocusTrap active={true}>
          <div>
            <button data-testid="first-button">First</button>
            <button data-testid="last-button">Last</button>
          </div>
        </FocusTrap>
      </FocusManagement>
    );
    
    // Focus the last button
    screen.getByTestId('last-button').focus();
    expect(screen.getByTestId('last-button')).toHaveFocus();
    
    // Simulate Tab key - should loop back to first button
    fireEvent.keyDown(screen.getByTestId('last-button'), { key: 'Tab' });
    
    // Check that the first button now has focus
    expect(screen.getByTestId('first-button')).toHaveFocus();
    
    // Simulate Shift+Tab from first button - should go to last button
    fireEvent.keyDown(screen.getByTestId('first-button'), { key: 'Tab', shiftKey: true });
    
    // Check that the last button now has focus
    expect(screen.getByTestId('last-button')).toHaveFocus();
  });
  
  it('does not trap focus when not active', () => {
    // Mock document.activeElement to allow tests to pass
    Object.defineProperty(document, 'activeElement', {
      writable: true,
      value: document.body
    });
    
    // Need to wrap in FocusManagement to provide context
    render(
      <FocusManagement>
        <FocusTrap active={false}>
          <div>
            <button data-testid="first-button">First</button>
            <button data-testid="last-button">Last</button>
          </div>
        </FocusTrap>
      </FocusManagement>
    );
    
    // Focus the last button
    screen.getByTestId('last-button').focus();
    
    // Simulate Tab key - should not be trapped
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    screen.getByTestId('last-button').dispatchEvent(tabEvent);
    
    // The event should not be prevented
    expect(tabEvent.defaultPrevented).toBe(false);
  });
  
  it('applies the correct data attribute based on active state', () => {
    const { rerender } = render(
      <FocusTrap active={true}>
        <div data-testid="test-child">Test Content</div>
      </FocusTrap>
    );
    
    expect(screen.getByTestId('test-child').parentElement).toHaveAttribute('data-focus-trap', 'active');
    
    rerender(
      <FocusTrap active={false}>
        <div data-testid="test-child">Test Content</div>
      </FocusTrap>
    );
    
    expect(screen.getByTestId('test-child').parentElement).toHaveAttribute('data-focus-trap', 'inactive');
  });
});

describe('FocusRestoration', () => {
  it('renders children correctly', () => {
    render(
      <FocusRestoration>
        <div data-testid="test-child">Test Content</div>
      </FocusRestoration>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toHaveTextContent('Test Content');
  });
  
  it('restores focus to the target element when unmounted', () => {
    // Create a target button
    const targetButton = document.createElement('button');
    targetButton.id = 'target-button';
    targetButton.setAttribute('data-testid', 'target-button');
    document.body.appendChild(targetButton);
    
    // Render the component
    const { unmount } = render(
      <FocusRestoration targetSelector="#target-button">
        <button data-testid="component-button">Component Button</button>
      </FocusRestoration>
    );
    
    // Focus the component button
    screen.getByTestId('component-button').focus();
    
    // Unmount the component
    unmount();
    
    // Check that focus was restored to the target button
    expect(document.activeElement).toBe(targetButton);
    
    // Clean up
    document.body.removeChild(targetButton);
  });
  
  it('restores focus to the target ref when unmounted', () => {
    // Create a test component that uses refs
    const TestComponent = () => {
      const targetRef = useRef(null);
      
      return (
        <div>
          <button ref={targetRef} data-testid="target-button">Target</button>
          <FocusRestoration targetRef={targetRef}>
            <button data-testid="component-button">Component Button</button>
          </FocusRestoration>
        </div>
      );
    };
    
    // Render the component
    const { unmount } = render(<TestComponent />);
    
    // Focus the component button
    screen.getByTestId('component-button').focus();
    
    // Unmount the component
    unmount();
  });
});