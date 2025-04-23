// client/src/components/mobile/TouchFriendlySelect/TouchFriendlySelect.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper, 
  ClickAwayListener,
  Zoom,
  FormHelperText,
  Backdrop
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import styles from './TouchFriendlySelect.module.css';

/**
 * TouchFriendlySelect Component
 * 
 * A mobile-optimized select component with large touch targets
 * 
 * @param {Object} props - Component props
 * @param {Array} props.options - Array of option objects with value and label
 * @param {any} props.value - Currently selected value
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.label - Label for the select
 * @param {boolean} props.disabled - Whether the select is disabled
 * @param {boolean} props.error - Whether the select has an error
 * @param {string} props.helperText - Helper text to display below the select
 * @param {string} props.placeholder - Placeholder text when no option is selected
 * @param {boolean} props.fullWidth - Whether the select should take up full width
 * @param {boolean} props.searchable - Whether to enable search functionality
 * @param {string} props.className - Additional CSS class for the container
 * @param {boolean} props.required - Whether the field is required
 */
const TouchFriendlySelect = ({
  options = [],
  value = '',
  onChange,
  label,
  disabled = false,
  error = false,
  helperText,
  placeholder = 'Select an option',
  fullWidth = false,
  searchable = false,
  className = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Get selected option label
  const getSelectedLabel = () => {
    const selected = options.find(option => option.value === value);
    return selected ? selected.label : '';
  };
  
  // Handle option selection
  const handleSelectOption = (option) => {
    if (onChange) {
      onChange(option.value);
    }
    
    setIsOpen(false);
    setSearchTerm('');
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    if (disabled) return;
    
    setIsOpen(prevState => !prevState);
    setSearchTerm('');
  };
  
  // Close dropdown
  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Clear search input
  const handleClearSearch = () => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [isOpen, searchable]);
  
  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;
  
  return (
    <Box 
      className={`${styles.container} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      ref={containerRef}
    >
      {/* Label */}
      {label && (
        <Typography 
          variant="body2" 
          component="label" 
          className={`${styles.label} ${error ? styles.errorLabel : ''}`}
        >
          {label}
          {required && <span className={styles.requiredStar}>*</span>}
        </Typography>
      )}
      
      {/* Select Field */}
      <Box
        className={`${styles.select} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}
        onClick={toggleDropdown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
      >
        <Typography 
          variant="body1" 
          className={`${styles.value} ${!value ? styles.placeholder : ''}`}
          noWrap
        >
          {value ? getSelectedLabel() : placeholder}
        </Typography>
        
        <IconButton 
          className={styles.iconButton}
          tabIndex={-1}
          size="small"
          disabled={disabled}
        >
          <ExpandMoreIcon className={`${styles.expandIcon} ${isOpen ? styles.expanded : ''}`} />
        </IconButton>
      </Box>
      
      {/* Helper Text */}
      {helperText && (
        <FormHelperText error={error} className={styles.helperText}>
          {helperText}
        </FormHelperText>
      )}
      
      {/* Dropdown */}
      {isOpen && (
        <ClickAwayListener onClickAway={handleClose}>
          <Box>
            <Backdrop
              open={isOpen}
              onClick={handleClose}
              className={styles.backdrop}
            />
            
            <Zoom in={isOpen}>
              <Paper 
                className={styles.dropdown}
                elevation={8}
              >
                {/* Search Input */}
                {searchable && (
                  <Box className={styles.searchContainer}>
                    <SearchIcon className={styles.searchIcon} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search options..."
                      className={styles.searchInput}
                    />
                    {searchTerm && (
                      <IconButton 
                        size="small" 
                        onClick={handleClearSearch}
                        className={styles.clearButton}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )}
                
                {/* Options List */}
                <Box 
                  className={styles.optionsList}
                  role="listbox"
                  aria-activedescendant={value ? `option-${value}` : undefined}
                >
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Box
                        key={option.value}
                        className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                        onClick={() => handleSelectOption(option)}
                        role="option"
                        id={`option-${option.value}`}
                        aria-selected={option.value === value}
                      >
                        <Typography variant="body1" noWrap className={styles.optionLabel}>
                          {option.label}
                        </Typography>
                        
                        {option.value === value && (
                          <CheckIcon className={styles.checkIcon} />
                        )}
                      </Box>
                    ))
                  ) : (
                    <Box className={styles.noOptions}>
                      <Typography variant="body2" color="textSecondary">
                        No options found
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Zoom>
          </Box>
        </ClickAwayListener>
      )}
    </Box>
  );
};

TouchFriendlySelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  placeholder: PropTypes.string,
  fullWidth: PropTypes.bool,
  searchable: PropTypes.bool,
  className: PropTypes.string,
  required: PropTypes.bool
};

export default TouchFriendlySelect;