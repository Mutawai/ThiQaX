// src/components/layout/ResponsiveGrid.jsx
import React from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import { useResponsive } from '../../utils/responsive';

/**
 * ResponsiveGrid Component
 * 
 * A wrapper around Material-UI Grid that provides better defaults for responsive layouts
 * and adjusts spacing based on screen size.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Grid items
 * @param {number|object} props.spacing - Grid spacing (can be responsive object)
 * @param {boolean} props.container - Whether this is a grid container
 * @param {'row'|'column'} props.direction - Grid direction
 * @param {'flex-start'|'center'|'flex-end'|'space-between'|'space-around'} props.justifyContent - Grid justifyContent
 * @param {'flex-start'|'center'|'flex-end'|'stretch'|'baseline'} props.alignItems - Grid alignItems
 * @param {Object} props.sx - Additional styles
 */
const ResponsiveGrid = ({
  children,
  spacing = { xs: 2, md: 3 },
  container = true,
  direction = 'row',
  justifyContent = 'flex-start',
  alignItems = 'stretch',
  sx = {},
  ...props
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Determine responsive direction if it's an array
  const getResponsiveDirection = () => {
    if (typeof direction === 'string') {
      return direction;
    }

    if (Array.isArray(direction)) {
      if (isMobile && direction[0]) return direction[0];
      if (isTablet && direction[1]) return direction[1];
      if (isDesktop && direction[2]) return direction[2];
      return direction[0]; // Default to first
    }

    if (typeof direction === 'object') {
      if (isMobile && direction.xs) return direction.xs;
      if (isTablet && direction.md) return direction.md;
      if (isDesktop && direction.lg) return direction.lg;
      return 'row'; // Default
    }

    return 'row';
  };

  // Determine responsive spacing
  const getResponsiveSpacing = () => {
    if (typeof spacing === 'number') {
      // Scale down spacing slightly for mobile
      return isMobile ? Math.max(1, spacing - 1) : spacing;
    }

    if (typeof spacing === 'object') {
      return spacing; // MUI handles responsive objects
    }

    return spacing;
  };

  return (
    <Grid
      container={container}
      direction={getResponsiveDirection()}
      justifyContent={justifyContent}
      alignItems={alignItems}
      spacing={getResponsiveSpacing()}
      sx={{
        width: '100%',
        ...sx
      }}
      {...props}
    >
      {/* Auto-wrap children in Grid items if they're not already */}
      {React.Children.map(children, (child) => {
        // Skip null or undefined children
        if (!child) return null;
        
        // Check if child is already a Grid item
        const isGridItem = child.type === Grid && (
          child.props.item || 
          (typeof child.props.xs !== 'undefined') ||
          (typeof child.props.sm !== 'undefined') ||
          (typeof child.props.md !== 'undefined') ||
          (typeof child.props.lg !== 'undefined') ||
          (typeof child.props.xl !== 'undefined')
        );

        // Return as is if already Grid item
        if (isGridItem) {
          return child;
        }

        // Auto xs=12 sizing for default responsive behavior
        return (
          <Grid item xs={12} sm={6} md={4} lg={3}>
            {child}
          </Grid>
        );
      })}
    </Grid>
  );
};

ResponsiveGrid.propTypes = {
  children: PropTypes.node,
  spacing: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.object,
  ]),
  container: PropTypes.bool,
  direction: PropTypes.oneOfType([
    PropTypes.oneOf(['row', 'column', 'row-reverse', 'column-reverse']),
    PropTypes.array,
    PropTypes.object,
  ]),
  justifyContent: PropTypes.oneOf([
    'flex-start', 
    'center', 
    'flex-end', 
    'space-between', 
    'space-around',
    'space-evenly',
  ]),
  alignItems: PropTypes.oneOf([
    'flex-start', 
    'center', 
    'flex-end', 
    'stretch', 
    'baseline',
  ]),
  sx: PropTypes.object,
};

export default ResponsiveGrid;