import React, { useRef, useEffect, createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './FocusManagement.module.css';

// Create context for focus management
const FocusContext = createContext({
  setFocusToElement: () => {},
  returnFocusToLast: () => {},
  storeFocusHistory: true
});

/**
 * Custom hook for accessing focus management functionality
 * @returns {Object} Focus management functions and state
 */
export const useFocus = () => useContext(FocusContext);

/**
 * FocusManagement - Component for managing focus state and restoration
 * 
 * This component provides functionality for:
 * 1. Managing focus history stack
 * 2. Focusing specific elements programmatically
 * 3. Restoring focus when components unmount
 * 
 * @example
 * // Basic usage
 * <FocusManagement>
 *   <YourComponent />
 * </FocusManagement>
 * 
 * @example
 * // Using the hook to programmatically manage focus
 * function YourComponent() {
 *   const { setFocusToElement } = useFocus();
 *   const buttonRef = useRef(null);
 *   
 *   const handleAction = () => {
 *     // Do something, then focus the button
 *     setFocusToElement(buttonRef.current);
 *   };
 *   
 *   return <button ref={buttonRef}>Focus Me</button>;
 * }
 */
const FocusManagement = ({ 
  children, 
  storeFocusHistory = true,
  autoFocusSelector = null,
  restoreFocusOnUnmount = true
}) => {
  // Ref to track focus history
  const focusHistoryRef = useRef([]);
  // Ref to store element to focus on unmount
  const returnFocusToRef = useRef(null);
  
  // Focus a specific element by ref or selector
  const setFocusToElement = (elementRefOrSelector, { preventScroll = false, focusOptions = {} } = {}) => {
    if (!elementRefOrSelector) return;
    
    // Store the currently focused element before changing focus
    if (storeFocusHistory && document.activeElement) {
      focusHistoryRef.current.push(document.activeElement);
    }
    
    // Handle both ref object and selector string
    let elementToFocus;
    if (typeof elementRefOrSelector === 'string') {
      elementToFocus = document.querySelector(elementRefOrSelector);
    } else if (elementRefOrSelector.current) {
      elementToFocus = elementRefOrSelector.current;
    } else {
      elementToFocus = elementRefOrSelector;
    }
    
    // Focus the element if it exists and is focusable
    if (elementToFocus && typeof elementToFocus.focus === 'function') {
      try {
        elementToFocus.focus({ preventScroll, ...focusOptions });
      } catch (error) {
        console.warn('Error focusing element:', error);
      }
    }
  };
  
  // Return focus to the last focused element
  const returnFocusToLast = () => {
    if (!storeFocusHistory || focusHistoryRef.current.length === 0) return;
    
    const lastFocusedElement = focusHistoryRef.current.pop();
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      try {
        lastFocusedElement.focus();
      } catch (error) {
        console.warn('Error returning focus:', error);
      }
    }
  };

  // On initial mount, store the active element to return to on unmount
  useEffect(() => {
    if (restoreFocusOnUnmount) {
      returnFocusToRef.current = document.activeElement;
    }
    
    // Auto-focus the specified element if provided
    if (autoFocusSelector) {
      setFocusToElement(autoFocusSelector);
    }
    
    // Clean up function for unmounting
    return () => {
      if (restoreFocusOnUnmount && returnFocusToRef.current) {
        // Try to return focus to the stored element
        try {
          returnFocusToRef.current.focus();
        } catch (error) {
          console.warn('Error restoring focus on unmount:', error);
        }
      }
    };
  }, [restoreFocusOnUnmount, autoFocusSelector]);

  return (
    <FocusContext.Provider value={{ 
      setFocusToElement, 
      returnFocusToLast, 
      storeFocusHistory 
    }}>
      {children}
    </FocusContext.Provider>
  );
};

FocusManagement.propTypes = {
  /** Child elements */
  children: PropTypes.node,
  /** Whether to store focus history for restoration */
  storeFocusHistory: PropTypes.bool,
  /** CSS selector for element to auto-focus on mount */
  autoFocusSelector: PropTypes.string,
  /** Whether to restore focus to previous element on unmount */
  restoreFocusOnUnmount: PropTypes.bool
};

/**
 * FocusTrap - Component for trapping focus within a container
 * 
 * @example
 * <FocusTrap active={isModalOpen}>
 *   <div className="modal">
 *     <button>Close</button>
 *     <input type="text" />
 *   </div>
 * </FocusTrap>
 */
export const FocusTrap = ({ 
  children, 
  active = true, 
  focusFirst = true,
  returnFocusOnDeactivate = true,
  className = ''
}) => {
  const containerRef = useRef(null);
  const { setFocusToElement } = useFocus();
  const [previousFocus, setPreviousFocus] = useState(null);
  
  // Set up focus trap when the component becomes active
  useEffect(() => {
    if (!active || !containerRef.current) return;
    
    // Store the currently focused element to return to later
    if (returnFocusOnDeactivate) {
      setPreviousFocus(document.activeElement);
    }
    
    // Get all focusable elements in the container
    const focusableElements = containerRef.current.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    // Focus the first element if specified
    if (focusFirst) {
      setTimeout(() => {
        focusableElements[0].focus();
      }, 0);
    }
    
    // Handle tabbing within the container
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab' || !active) return;
      
      // If no focusable elements, do nothing
      if (focusableElements.length === 0) return;
      
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];
      
      // Shift + Tab from first element should circle to last
      if (e.shiftKey && document.activeElement === firstFocusableElement) {
        e.preventDefault();
        lastFocusableElement.focus();
      } 
      // Tab from last element should circle to first
      else if (!e.shiftKey && document.activeElement === lastFocusableElement) {
        e.preventDefault();
        firstFocusableElement.focus();
      }
    };
    
    // Add event listener to container
    containerRef.current.addEventListener('keydown', handleKeyDown);
    
    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, focusFirst]);
  
  // Return focus when component is deactivated
  useEffect(() => {
    if (!active && previousFocus && returnFocusOnDeactivate) {
      setTimeout(() => {
        if (previousFocus && typeof previousFocus.focus === 'function') {
          try {
            previousFocus.focus();
          } catch (e) {
            console.warn('Error returning focus:', e);
          }
        }
      }, 0);
    }
  }, [active, previousFocus, returnFocusOnDeactivate]);
  
  return (
    <div 
      ref={containerRef} 
      className={`${styles.focusTrap} ${className}`}
      data-focus-trap={active ? 'active' : 'inactive'}
    >
      {children}
    </div>
  );
};

FocusTrap.propTypes = {
  /** Child elements */
  children: PropTypes.node,
  /** Whether the focus trap is active */
  active: PropTypes.bool,
  /** Whether to focus the first focusable element when activated */
  focusFirst: PropTypes.bool,
  /** Whether to return focus to the previously focused element when deactivated */
  returnFocusOnDeactivate: PropTypes.bool,
  /** Additional class name */
  className: PropTypes.string
};

/**
 * FocusRestoration - Component that restores focus to a specific element when unmounted
 * 
 * @example
 * <FocusRestoration targetSelector="#back-button">
 *   <div>Some content that temporarily gets focus</div>
 * </FocusRestoration>
 */
export const FocusRestoration = ({ 
  children, 
  targetSelector = null,
  targetRef = null 
}) => {
  // Store the element to focus when unmounting
  const elementToFocusRef = useRef(null);
  
  // Set up the element to focus on unmount
  useEffect(() => {
    if (targetRef && targetRef.current) {
      elementToFocusRef.current = targetRef.current;
    } else if (targetSelector) {
      const element = document.querySelector(targetSelector);
      if (element) {
        elementToFocusRef.current = element;
      }
    }
    
    // Return focus when unmounting
    return () => {
      if (elementToFocusRef.current && typeof elementToFocusRef.current.focus === 'function') {
        try {
          elementToFocusRef.current.focus();
        } catch (e) {
          console.warn('Error restoring focus:', e);
        }
      }
    };
  }, [targetSelector, targetRef]);
  
  return <>{children}</>;
};

FocusRestoration.propTypes = {
  /** Child elements */
  children: PropTypes.node,
  /** CSS selector for the element to focus when unmounted */
  targetSelector: PropTypes.string,
  /** Ref to the element to focus when unmounted */
  targetRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) })
};

export default FocusManagement;