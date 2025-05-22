import React, { useState, useEffect, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import styles from './HighContrastMode.module.css';

// Create context to manage high contrast preference
export const HighContrastContext = createContext({
  highContrast: false,
  toggleHighContrast: () => {},
  setHighContrast: () => {}
});

/**
 * Hook to use high contrast mode context
 * @returns {Object} The high contrast context
 */
export const useHighContrast = () => useContext(HighContrastContext);

/**
 * HighContrastMode Provider Component
 * 
 * Provides high contrast mode preference across the application
 * Automatically detects system preference and allows user toggle
 * 
 * @example
 * // Wrap your application with HighContrastMode provider
 * <HighContrastMode>
 *   <App />
 * </HighContrastMode>
 */
export const HighContrastProvider = ({ children, storageKey = 'thiqax-high-contrast-mode' }) => {
  // Initialize state from localStorage or system preference
  const [highContrast, setHighContrast] = useState(() => {
    // Check localStorage first
    const savedPreference = localStorage.getItem(storageKey);
    if (savedPreference !== null) {
      return savedPreference === 'true';
    }
    
    // Check system preference
    if (window.matchMedia) {
      return window.matchMedia('(prefers-contrast: more)').matches;
    }
    
    return false;
  });

  // Toggle high contrast mode
  const toggleHighContrast = () => {
    setHighContrast((prevState) => !prevState);
  };

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(storageKey, highContrast.toString());
    
    // Apply high-contrast class to document root for global styling
    if (highContrast) {
      document.documentElement.classList.add('high-contrast-mode');
    } else {
      document.documentElement.classList.remove('high-contrast-mode');
    }
  }, [highContrast, storageKey]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    
    const handleChange = (e) => {
      // Only update if user hasn't explicitly set a preference
      if (localStorage.getItem(storageKey) === null) {
        setHighContrast(e.matches);
      }
    };
    
    // Add event listener for preference changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [storageKey]);

  // Provide context to children
  return (
    <HighContrastContext.Provider value={{ highContrast, toggleHighContrast, setHighContrast }}>
      {children}
    </HighContrastContext.Provider>
  );
};

HighContrastProvider.propTypes = {
  /** Child elements */
  children: PropTypes.node.isRequired,
  /** Key to use for localStorage */
  storageKey: PropTypes.string
};

/**
 * HighContrastMode Toggle Component
 * 
 * A toggle button for enabling/disabling high contrast mode
 * 
 * @example
 * <HighContrastToggle 
 *   label="High Contrast" 
 *   showIcon={true} 
 * />
 */
export const HighContrastToggle = ({ 
  label = 'High Contrast Mode', 
  showIcon = true,
  className = '',
  buttonClassName = ''
}) => {
  const { highContrast, toggleHighContrast } = useHighContrast();

  return (
    <div className={`${styles.toggleContainer} ${className}`}>
      <button
        type="button"
        onClick={toggleHighContrast}
        className={`${styles.toggleButton} ${highContrast ? styles.active : ''} ${buttonClassName}`}
        aria-pressed={highContrast}
      >
        {showIcon && (
          <span className={styles.icon} aria-hidden="true">
            {highContrast ? (
              // High contrast enabled icon (simple SVG for visibility)
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M8 1v14" stroke="currentColor" strokeWidth="2" />
                <path d="M1 8h14" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              // High contrast disabled icon
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1Z" stroke="currentColor" strokeWidth="2" />
                <path d="M8 1v14" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </span>
        )}
        <span className={styles.label}>{label}</span>
      </button>
    </div>
  );
};

HighContrastToggle.propTypes = {
  /** Label for the toggle button */
  label: PropTypes.string,
  /** Whether to show the contrast icon */
  showIcon: PropTypes.bool,
  /** Additional class for the container */
  className: PropTypes.string,
  /** Additional class for the button */
  buttonClassName: PropTypes.string
};

/**
 * Main exported component - combines provider and UI components
 */
const HighContrastMode = ({ 
  children, 
  storageKey,
  showToggle = false,
  toggleLabel = 'High Contrast Mode',
  toggleClassName = '',
  toggleButtonClassName = ''
}) => {
  return (
    <HighContrastProvider storageKey={storageKey}>
      {showToggle && (
        <HighContrastToggle 
          label={toggleLabel} 
          className={toggleClassName}
          buttonClassName={toggleButtonClassName}
        />
      )}
      {children}
    </HighContrastProvider>
  );
};

HighContrastMode.propTypes = {
  /** Child elements */
  children: PropTypes.node,
  /** Key to use for localStorage */
  storageKey: PropTypes.string,
  /** Whether to show the toggle button */
  showToggle: PropTypes.bool,
  /** Label for the toggle button */
  toggleLabel: PropTypes.string,
  /** Additional class for the toggle container */
  toggleClassName: PropTypes.string,
  /** Additional class for the toggle button */
  toggleButtonClassName: PropTypes.string
};

export default HighContrastMode;