import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './KeyboardNavigation.module.css';

/**
 * KeyboardNavigation - Component to enhance keyboard navigation for accessibility
 * 
 * This component provides:
 * 1. Focus trapping within modals or dialogs
 * 2. Skip navigation link for keyboard users
 * 3. Keyboard shortcut handling
 * 
 * @example
 * // For wrapping a modal with focus trap
 * <KeyboardNavigation trapFocus>
 *   <div role="dialog">Modal content</div>
 * </KeyboardNavigation>
 * 
 * @example
 * // For adding a skip link to main content
 * <KeyboardNavigation 
 *   showSkipLink 
 *   skipLinkTarget="#main-content"
 *   skipLinkText="Skip to main content" 
 * />
 */
const KeyboardNavigation = ({ 
  children, 
  trapFocus = false,
  showSkipLink = false,
  skipLinkTarget = '#main-content',
  skipLinkText = 'Skip to main content',
  shortcuts = {},
  wrapperRef = null
}) => {
  const containerRef = useRef(null);
  const skipLinkRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);
  
  // Get the ref to use for the container - either the provided wrapperRef or our internal containerRef
  const resolvedRef = wrapperRef || containerRef;

  // Handle keyboard shortcuts
  useEffect(() => {
    if (Object.keys(shortcuts).length === 0) return;

    const handleKeyDown = (e) => {
      // Check if key combination exists in shortcuts
      const key = e.key.toLowerCase();
      const metaPressed = e.metaKey || e.ctrlKey;
      const altPressed = e.altKey;
      const shiftPressed = e.shiftKey;

      for (const shortcutKey in shortcuts) {
        const shortcut = parseShortcut(shortcutKey);
        
        if (
          key === shortcut.key &&
          metaPressed === shortcut.meta &&
          altPressed === shortcut.alt &&
          shiftPressed === shortcut.shift
        ) {
          e.preventDefault();
          shortcuts[shortcutKey](e);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);

  // Focus trap implementation
  useEffect(() => {
    if (!trapFocus || !resolvedRef.current) return;

    // Find all focusable elements
    const focusableElements = resolvedRef.current.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    // Update refs
    firstFocusableRef.current = focusableElements[0];
    lastFocusableRef.current = focusableElements[focusableElements.length - 1];

    // Focus the first element when the component mounts
    firstFocusableRef.current.focus();

    const handleTabKey = (e) => {
      // Only handle tab key events
      if (e.key !== 'Tab') return;

      // Shift + Tab on first element goes to last element
      if (e.shiftKey && document.activeElement === firstFocusableRef.current) {
        e.preventDefault();
        lastFocusableRef.current.focus();
      } 
      // Tab on last element goes to first element
      else if (!e.shiftKey && document.activeElement === lastFocusableRef.current) {
        e.preventDefault();
        firstFocusableRef.current.focus();
      }
    };

    resolvedRef.current.addEventListener('keydown', handleTabKey);

    // Store the previously focused element to restore focus when unmounting
    const previouslyFocused = document.activeElement;

    return () => {
      resolvedRef.current?.removeEventListener('keydown', handleTabKey);
      // Restore focus
      previouslyFocused?.focus();
    };
  }, [trapFocus, resolvedRef]);

  // Handle initial focus for skip link
  useEffect(() => {
    if (!showSkipLink || !skipLinkRef.current) return;

    // Make skip link visible on focus
    const handleSkipLinkFocus = () => {
      skipLinkRef.current.classList.add(styles.skipLinkVisible);
    };

    // Hide skip link when blurred
    const handleSkipLinkBlur = () => {
      skipLinkRef.current.classList.remove(styles.skipLinkVisible);
    };

    skipLinkRef.current.addEventListener('focus', handleSkipLinkFocus);
    skipLinkRef.current.addEventListener('blur', handleSkipLinkBlur);

    return () => {
      skipLinkRef.current?.removeEventListener('focus', handleSkipLinkFocus);
      skipLinkRef.current?.removeEventListener('blur', handleSkipLinkBlur);
    };
  }, [showSkipLink]);

  // Helper function to parse shortcut notation (e.g., "ctrl+k", "shift+alt+f")
  const parseShortcut = (shortcutStr) => {
    const parts = shortcutStr.toLowerCase().split('+');
    return {
      key: parts[parts.length - 1],
      meta: parts.includes('ctrl') || parts.includes('cmd') || parts.includes('meta'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift')
    };
  };

  return (
    <>
      {showSkipLink && (
        <a 
          ref={skipLinkRef}
          href={skipLinkTarget}
          className={styles.skipLink}
          onClick={(e) => {
            // Prevent default behavior if the target doesn't exist
            const targetElement = document.querySelector(skipLinkTarget);
            if (!targetElement) {
              e.preventDefault();
              console.warn(`Skip link target "${skipLinkTarget}" not found in the document.`);
              return;
            }
            
            // Set tabindex to make the target focusable if it isn't already
            if (!targetElement.hasAttribute('tabindex')) {
              targetElement.setAttribute('tabindex', '-1');
            }
            
            // Focus the target
            targetElement.focus();
          }}
        >
          {skipLinkText}
        </a>
      )}

      {children ? (
        <div ref={resolvedRef}>
          {children}
        </div>
      ) : null}
    </>
  );
};

KeyboardNavigation.propTypes = {
  /** Child elements to be rendered inside the component */
  children: PropTypes.node,
  /** Whether to trap focus within the component */
  trapFocus: PropTypes.bool,
  /** Whether to show a skip navigation link */
  showSkipLink: PropTypes.bool,
  /** The target selector for the skip link */
  skipLinkTarget: PropTypes.string,
  /** The text to display for the skip link */
  skipLinkText: PropTypes.string,
  /** Object mapping keyboard shortcuts to handler functions */
  shortcuts: PropTypes.objectOf(PropTypes.func),
  /** Optional ref to use instead of the internal ref */
  wrapperRef: PropTypes.object
};

export default KeyboardNavigation;