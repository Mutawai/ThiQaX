// client/src/components/mobile/MobileFilterMenu/MobileFilterMenu.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Chip,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Badge,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  Autocomplete,
  ClickAwayListener,
  Backdrop,
  useTheme,
  styled
} from '@mui/material';
import {
  Close as CloseIcon,
  Done as DoneIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Tune as TuneIcon,
  Check as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  RadioButtonChecked as CheckedIcon
} from '@mui/icons-material';
import styles from './MobileFilterMenu.module.css';
// Styled components
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '100%',
    maxWidth: '100vw',
    height: '100%',
    borderRadius: 0,
    [theme.breakpoints.up('sm')]: {
      width: 400,
      maxWidth: 400,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
    },
  },
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

/**
 * MobileFilterMenu Component
 * 
 * A mobile-optimized filter menu that supports multiple filter types
 * and provides an intuitive interface for complex filtering operations
 */
const MobileFilterMenu = ({
  open,
  onClose,
  onApply,
  filterGroups = [],
  selectedFilters = {},
  title = 'Filters',
  showSearch = true,
  showClearAll = true,
  showApplyButton = true,
  searchPlaceholder = 'Search filters...',
  onSearch,
  onReset,
  persistent = false,
  variant = 'drawer',
  maxHeight = '70vh',
  groupsCollapsible = true,
  customIcons = {},
  renderCustomFilter,
  showActiveCount = true
}) => {
  const theme = useTheme();
// Local state
  const [localFilters, setLocalFilters] = useState(selectedFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [filteredGroups, setFilteredGroups] = useState(filterGroups);
  
  // Refs
  const searchInputRef = useRef(null);
  
  // Initialize expanded groups
  useEffect(() => {
    if (groupsCollapsible) {
      const initialExpanded = {};
      filterGroups.forEach((group, index) => {
        initialExpanded[group.id || index] = group.expanded !== false;
      });
      setExpandedGroups(initialExpanded);
    }
  }, [filterGroups, groupsCollapsible]);
  
  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(selectedFilters);
  }, [selectedFilters]);
  
  // Filter groups based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGroups(filterGroups);
      return;
    }
    
    const filtered = filterGroups.map(group => ({
      ...group,
      filters: group.filters.filter(filter =>
        filter.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (filter.description && filter.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })).filter(group => group.filters.length > 0);
    
    setFilteredGroups(filtered);
  }, [searchTerm, filterGroups]);
// Get active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    Object.values(localFilters).forEach(value => {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (value !== null && value !== undefined && value !== '') {
        count += 1;
      }
    });
    return count;
  }, [localFilters]);
  
  // Handle filter change
  const handleFilterChange = useCallback((filterId, value, filterType) => {
    setLocalFilters(prev => {
      const newFilters = { ...prev };
      
      switch (filterType) {
        case 'checkbox':
          if (!newFilters[filterId]) {
            newFilters[filterId] = [];
          }
          if (newFilters[filterId].includes(value)) {
            newFilters[filterId] = newFilters[filterId].filter(v => v !== value);
          } else {
            newFilters[filterId] = [...newFilters[filterId], value];
          }
          break;
          
        case 'radio':
        case 'select':
        case 'range':
        case 'switch':
          newFilters[filterId] = value;
          break;
          
        case 'multi-select':
          newFilters[filterId] = value;
          break;
          
        default:
          newFilters[filterId] = value;
      }
      
      return newFilters;
    });
  }, []);
  
  // Handle search
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  }, [onSearch]);
  
  // Handle group expansion
  const handleGroupExpansion = useCallback((groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }, []);
  
  // Handle apply filters
  const handleApply = useCallback(() => {
    if (onApply) {
      onApply(localFilters);
    }
    if (!persistent) {
      onClose();
    }
  }, [localFilters, onApply, onClose, persistent]);
  
  // Handle reset filters
  const handleReset = useCallback(() => {
    const resetFilters = {};
    filterGroups.forEach(group => {
      group.filters.forEach(filter => {
        switch (filter.type) {
          case 'checkbox':
          case 'multi-select':
            resetFilters[filter.id] = [];
            break;
          case 'range':
            resetFilters[filter.id] = filter.defaultValue || [filter.min || 0, filter.max || 100];
            break;
          case 'switch':
            resetFilters[filter.id] = filter.defaultValue || false;
            break;
          default:
            resetFilters[filter.id] = filter.defaultValue || '';
        }
      });
    });
    
    setLocalFilters(resetFilters);
    
    if (onReset) {
      onReset();
    }
  }, [filterGroups, onReset]);
  
  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);
// Render checkbox filter
  const renderCheckboxFilter = useCallback((filter) => {
    const selectedValues = localFilters[filter.id] || [];
    
    return (
      <FormControl component="fieldset" className={styles.filterControl}>
        <FormLabel component="legend" className={styles.filterLabel}>
          {filter.label}
        </FormLabel>
        <FormGroup>
          {filter.options.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleFilterChange(filter.id, option.value, 'checkbox')}
                  size="small"
                />
              }
              label={
                <Box className={styles.optionLabel}>
                  <Typography variant="body2">{option.label}</Typography>
                  {option.count && (
                    <Chip 
                      label={option.count} 
                      size="small" 
                      variant="outlined"
                      className={styles.countChip}
                    />
                  )}
                </Box>
              }
              className={styles.filterOption}
            />
          ))}
        </FormGroup>
      </FormControl>
    );
  }, [localFilters, handleFilterChange]);
  
  // Render radio filter
  const renderRadioFilter = useCallback((filter) => {
    const selectedValue = localFilters[filter.id] || '';
    
    return (
      <FormControl component="fieldset" className={styles.filterControl}>
        <FormLabel component="legend" className={styles.filterLabel}>
          {filter.label}
        </FormLabel>
        <RadioGroup
          value={selectedValue}
          onChange={(e) => handleFilterChange(filter.id, e.target.value, 'radio')}
        >
          {filter.options.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio size="small" />}
              label={
                <Box className={styles.optionLabel}>
                  <Typography variant="body2">{option.label}</Typography>
                  {option.count && (
                    <Chip 
                      label={option.count} 
                      size="small" 
                      variant="outlined"
                      className={styles.countChip}
                    />
                  )}
                </Box>
              }
              className={styles.filterOption}
            />
          ))}
        </RadioGroup>
      </FormControl>
    );
  }, [localFilters, handleFilterChange]);
  
  // Render range filter
  const renderRangeFilter = useCallback((filter) => {
    const value = localFilters[filter.id] || [filter.min || 0, filter.max || 100];
    
    return (
      <FormControl className={styles.filterControl}>
        <FormLabel className={styles.filterLabel}>
          {filter.label}
        </FormLabel>
        <Box className={styles.rangeContainer}>
          <Typography variant="body2" className={styles.rangeValue}>
            {filter.prefix || ''}{value[0]}{filter.suffix || ''}
          </Typography>
          <Slider
            value={value}
            onChange={(e, newValue) => handleFilterChange(filter.id, newValue, 'range')}
            valueLabelDisplay="auto"
            min={filter.min || 0}
            max={filter.max || 100}
            step={filter.step || 1}
            className={styles.rangeSlider}
            valueLabelFormat={(val) => `${filter.prefix || ''}${val}${filter.suffix || ''}`}
          />
          <Typography variant="body2" className={styles.rangeValue}>
            {filter.prefix || ''}{value[1]}{filter.suffix || ''}
          </Typography>
        </Box>
      </FormControl>
    );
  }, [localFilters, handleFilterChange]);
  
  // Render switch filter
  const renderSwitchFilter = useCallback((filter) => {
    const checked = localFilters[filter.id] || false;
    
    return (
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            onChange={(e) => handleFilterChange(filter.id, e.target.checked, 'switch')}
            size="small"
          />
        }
        label={filter.label}
        className={styles.switchFilter}
      />
    );
  }, [localFilters, handleFilterChange]);
  
  // Render multi-select filter
  const renderMultiSelectFilter = useCallback((filter) => {
    const selectedValues = localFilters[filter.id] || [];
    
    return (
      <FormControl className={styles.filterControl}>
        <FormLabel className={styles.filterLabel}>
          {filter.label}
        </FormLabel>
        <Autocomplete
          multiple
          options={filter.options}
          getOptionLabel={(option) => option.label}
          value={filter.options.filter(option => selectedValues.includes(option.value))}
          onChange={(e, newValue) => {
            const values = newValue.map(option => option.value);
            handleFilterChange(filter.id, values, 'multi-select');
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={filter.placeholder || 'Select options...'}
              size="small"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option.label}
                size="small"
                {...getTagProps({ index })}
                key={option.value}
              />
            ))
          }
          className={styles.multiSelect}
        />
      </FormControl>
    );
  }, [localFilters, handleFilterChange]);
// Render filter based on type
  const renderFilter = useCallback((filter) => {
    // Check for custom renderer first
    if (renderCustomFilter) {
      const customFilter = renderCustomFilter(filter, localFilters[filter.id], 
        (value) => handleFilterChange(filter.id, value, filter.type));
      if (customFilter) {
        return customFilter;
      }
    }
    
    switch (filter.type) {
      case 'checkbox':
        return renderCheckboxFilter(filter);
      case 'radio':
        return renderRadioFilter(filter);
      case 'range':
        return renderRangeFilter(filter);
      case 'switch':
        return renderSwitchFilter(filter);
      case 'multi-select':
        return renderMultiSelectFilter(filter);
      default:
        return renderCheckboxFilter(filter);
    }
  }, [localFilters, handleFilterChange, renderCustomFilter, renderCheckboxFilter, 
      renderRadioFilter, renderRangeFilter, renderSwitchFilter, renderMultiSelectFilter]);
  
  // Render filter group
  const renderFilterGroup = useCallback((group, index) => {
    const groupId = group.id || index;
    const isExpanded = !groupsCollapsible || expandedGroups[groupId];
    
    if (groupsCollapsible) {
      return (
        <Accordion
          key={groupId}
          expanded={isExpanded}
          onChange={() => handleGroupExpansion(groupId)}
          className={styles.filterGroup}
          elevation={0}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            className={styles.groupHeader}
          >
            <Typography variant="subtitle1" className={styles.groupTitle}>
              {group.title}
            </Typography>
            {showActiveCount && (
              <Badge 
                badgeContent={getActiveFilterCount()} 
                color="primary"
                className={styles.groupBadge}
              />
            )}
          </AccordionSummary>
          <AccordionDetails className={styles.groupContent}>
            {group.filters.map((filter, filterIndex) => (
              <Box key={filter.id || filterIndex} className={styles.filterItem}>
                {renderFilter(filter)}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      );
    }
    
    return (
      <Box key={groupId} className={styles.filterGroup}>
        <Typography variant="subtitle1" className={styles.groupTitle}>
          {group.title}
        </Typography>
        <Box className={styles.groupContent}>
          {group.filters.map((filter, filterIndex) => (
            <Box key={filter.id || filterIndex} className={styles.filterItem}>
              {renderFilter(filter)}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }, [groupsCollapsible, expandedGroups, handleGroupExpansion, showActiveCount, 
      getActiveFilterCount, renderFilter]);
// Render content based on variant
  const renderContent = () => (
    <Box className={styles.filterMenu}>
      {/* Header */}
      <StyledAppBar position="sticky">
        <Toolbar className={styles.header}>
          <Typography variant="h6" className={styles.title}>
            {title}
            {showActiveCount && getActiveFilterCount() > 0 && (
              <Chip 
                label={getActiveFilterCount()} 
                size="small" 
                color="primary"
                className={styles.activeCountChip}
              />
            )}
          </Typography>
          <IconButton 
            edge="end" 
            onClick={onClose}
            className={styles.closeButton}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </StyledAppBar>
      
      {/* Search */}
      {showSearch && (
        <Box className={styles.searchContainer}>
          <TextField
            ref={searchInputRef}
            fullWidth
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            className={styles.searchField}
          />
        </Box>
      )}
      
      {/* Filter Content */}
      <Box 
        className={styles.filterContent}
        style={{ maxHeight: maxHeight }}
      >
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group, index) => renderFilterGroup(group, index))
        ) : (
          <Box className={styles.noResults}>
            <Typography variant="body2" color="textSecondary">
              No filters found matching "{searchTerm}"
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Actions */}
      <Box className={styles.actions}>
        {showClearAll && (
          <Button
            variant="outlined"
            onClick={handleReset}
            startIcon={<ClearIcon />}
            className={styles.resetButton}
          >
            Clear All
          </Button>
        )}
        {showApplyButton && (
          <Button
            variant="contained"
            onClick={handleApply}
            startIcon={<DoneIcon />}
            className={styles.applyButton}
          >
            Apply Filters
            {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
          </Button>
        )}
      </Box>
    </Box>
  );
// Render based on variant
  if (variant === 'modal') {
    return (
      <>
        <Backdrop open={open} onClick={onClose} className={styles.backdrop} />
        <Box
          className={`${styles.modal} ${open ? styles.modalOpen : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-menu-title"
        >
          {renderContent()}
        </Box>
      </>
    );
  }
  
  return (
    <StyledDrawer
      anchor={variant === 'bottom-sheet' ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      className={styles.drawer}
      ModalProps={{
        keepMounted: false,
      }}
    >
      {renderContent()}
    </StyledDrawer>
  );
};

MobileFilterMenu.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func,
  filterGroups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string.isRequired,
      expanded: PropTypes.bool,
      filters: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          type: PropTypes.oneOf(['checkbox', 'radio', 'range', 'switch', 'multi-select']).isRequired,
          label: PropTypes.string.isRequired,
          description: PropTypes.string,
          options: PropTypes.array,
          min: PropTypes.number,
          max: PropTypes.number,
          step: PropTypes.number,
          prefix: PropTypes.string,
          suffix: PropTypes.string,
          defaultValue: PropTypes.any,
          placeholder: PropTypes.string
        })
      ).isRequired
    })
  ).isRequired,
  selectedFilters: PropTypes.object,
  title: PropTypes.string,
  showSearch: PropTypes.bool,
  showClearAll: PropTypes.bool,
  showApplyButton: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  onSearch: PropTypes.func,
  onReset: PropTypes.func,
  persistent: PropTypes.bool,
  variant: PropTypes.oneOf(['drawer', 'modal', 'bottom-sheet']),
  maxHeight: PropTypes.string,
  groupsCollapsible: PropTypes.bool,
  customIcons: PropTypes.object,
  renderCustomFilter: PropTypes.func,
  showActiveCount: PropTypes.bool
};

export default MobileFilterMenu;