// src/utils/responsive.js
import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Custom hook for responsive design
 * Returns boolean values for different breakpoints
 * @returns {Object} Object with boolean values for different screen sizes
 */
export const useResponsive = () => {
  const theme = useTheme();
  
  return {
    isMobile: useMediaQuery(theme.breakpoints.down('sm')),
    isTablet: useMediaQuery(theme.breakpoints.between('sm', 'md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('md')),
    isLargeDesktop: useMediaQuery(theme.breakpoints.up('lg')),
    isPortrait: useMediaQuery('(orientation: portrait)'),
    isLandscape: useMediaQuery('(orientation: landscape)'),
    // Specific breakpoints
    isXs: useMediaQuery(theme.breakpoints.only('xs')),
    isSm: useMediaQuery(theme.breakpoints.only('sm')),
    isMd: useMediaQuery(theme.breakpoints.only('md')),
    isLg: useMediaQuery(theme.breakpoints.only('lg')),
    isXl: useMediaQuery(theme.breakpoints.only('xl'))
  };
};

/**
 * Custom hook for responsive typography
 * Returns font sizes based on current screen size
 * @returns {Object} Object with font size values for different text types
 */
export const useResponsiveFontSizes = () => {
  const { isMobile, isTablet } = useResponsive();
  
  return {
    h1: {
      fontSize: isMobile ? '1.75rem' : isTablet ? '2.25rem' : '2.75rem',
      lineHeight: isMobile ? 1.2 : 1.1
    },
    h2: {
      fontSize: isMobile ? '1.5rem' : isTablet ? '1.75rem' : '2.25rem',
      lineHeight: isMobile ? 1.3 : 1.2
    },
    h3: {
      fontSize: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '1.75rem',
      lineHeight: 1.3
    },
    h4: {
      fontSize: isMobile ? '1.125rem' : isTablet ? '1.25rem' : '1.5rem',
      lineHeight: 1.4
    },
    h5: {
      fontSize: isMobile ? '1rem' : isTablet ? '1.125rem' : '1.25rem',
      lineHeight: 1.4
    },
    h6: {
      fontSize: isMobile ? '0.875rem' : '1rem',
      lineHeight: 1.5
    },
    subtitle1: {
      fontSize: isMobile ? '0.875rem' : '1rem',
      lineHeight: 1.5
    },
    subtitle2: {
      fontSize: isMobile ? '0.75rem' : '0.875rem',
      lineHeight: 1.5
    },
    body1: {
      fontSize: isMobile ? '0.875rem' : '1rem',
      lineHeight: 1.6
    },
    body2: {
      fontSize: isMobile ? '0.75rem' : '0.875rem',
      lineHeight: 1.6
    },
    caption: {
      fontSize: isMobile ? '0.7rem' : '0.75rem',
      lineHeight: 1.4
    },
    button: {
      fontSize: isMobile ? '0.8125rem' : '0.875rem',
      lineHeight: 1.75
    }
  };
};

/**
 * Custom hook for responsive spacing
 * Returns spacing values based on current screen size
 * @returns {Object} Object with spacing values
 */
export const useResponsiveSpacing = () => {
  const { isMobile, isTablet } = useResponsive();
  
  return {
    sectionPadding: isMobile ? 2 : isTablet ? 3 : 4,
    cardPadding: isMobile ? 2 : 3,
    gridSpacing: isMobile ? 2 : 3,
    listItemPadding: isMobile ? 1 : 2,
    buttonPadding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
    contentMargin: isMobile ? 2 : isTablet ? 3 : 4
  };
};

/**
 * Custom hook that provides responsive props for components
 * Returns an object with props for different components based on screen size
 * @returns {Object} Object with component props for responsive design
 */
export const useResponsiveProps = () => {
  const { isMobile, isTablet } = useResponsive();
  
  return {
    // Grid props
    gridContainer: {
      spacing: isMobile ? 2 : isTablet ? 3 : 4
    },
    // Dialog props
    dialog: {
      fullScreen: isMobile,
      maxWidth: isTablet ? 'md' : 'lg'
    },
    // Card props
    card: {
      elevation: isMobile ? 1 : 2,
      sx: { 
        p: isMobile ? 2 : 3 
      }
    },
    // Button props
    button: {
      size: isMobile ? 'small' : 'medium'
    },
    // Icon props
    icon: {
      fontSize: isMobile ? 'small' : 'medium'
    },
    // Table props
    table: {
      size: isMobile ? 'small' : 'medium'
    },
    // Form field props
    formField: {
      margin: isMobile ? 'dense' : 'normal',
      size: isMobile ? 'small' : 'medium'
    }
  };
};

// src/components/layout/ResponsiveContainer.js
import React from 'react';
import { Box, Container } from '@mui/material';
import { useResponsive } from '../../utils/responsive';

/**
 * Responsive container component with optimized padding and width
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Container content
 * @param {boolean} props.disableGutters Disable gutters (horizontal padding)
 * @param {Object} props.sx Additional sx props for styling
 * @param {string} props.maxWidth Maximum container width ('xs', 'sm', 'md', 'lg', 'xl')
 */
const ResponsiveContainer = ({
  children,
  disableGutters = false,
  sx = {},
  maxWidth = 'lg',
  ...props
}) => {
  const { isMobile } = useResponsive();
  
  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters}
      sx={{
        px: isMobile ? 2 : 3,
        ...sx
      }}
      {...props}
    >
      {children}
    </Container>
  );
};

export default ResponsiveContainer;

// src/components/layout/ResponsiveGrid.js
import React from 'react';
import { Grid } from '@mui/material';
import { useResponsive } from '../../utils/responsive';

/**
 * Responsive grid component with optimized spacing
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Grid content
 * @param {Object} props.sx Additional sx props for styling
 * @param {number} props.spacing Grid spacing (overrides responsive default)
 */
const ResponsiveGrid = ({
  children,
  sx = {},
  spacing = null,
  ...props
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  // Determine responsive spacing if not explicitly set
  const responsiveSpacing = spacing !== null 
    ? spacing 
    : isMobile ? 2 : isTablet ? 3 : 4;
  
  return (
    <Grid
      container
      spacing={responsiveSpacing}
      sx={sx}
      {...props}
    >
      {children}
    </Grid>
  );
};

export default ResponsiveGrid;

// src/theme/responsiveTheme.js
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Base theme with responsive features
let theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    // Base font sizes (will be adjusted by responsiveFontSizes)
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 400,
    },
    subtitle2: {
      fontWeight: 500,
    },
    body1: {
      fontWeight: 400,
    },
    body2: {
      fontWeight: 400,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none', // More modern approach
    },
  },
  components: {
    // Responsive adjustments for MUI components
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          // Padding will be adjusted based on screen size
          '@media (max-width:600px)': {
            padding: '6px 16px',
            fontSize: '0.8125rem',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          // Less elevation on mobile
          '@media (max-width:600px)': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          // More padding on mobile
          '@media (max-width:600px)': {
            paddingLeft: 16,
            paddingRight: 16,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          // Full width on mobile
          '@media (max-width:600px)': {
            margin: 16,
            width: 'calc(100% - 32px)',
            maxHeight: 'calc(100% - 32px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          // Smaller on mobile
          '@media (max-width:600px)': {
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          // Smaller padding on mobile
          '@media (max-width:600px)': {
            padding: '8px 16px',
          },
        },
      },
    },
  },
});

// Apply responsive font sizes
theme = responsiveFontSizes(theme, {
  breakpoints: ['xs', 'sm', 'md', 'lg', 'xl'],
  factor: 2, // Stronger factor for more noticeable difference
});

export default theme;

// src/hooks/useResponsiveDrawer.js
import { useState, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Custom hook for responsive drawer behavior
 * @param {boolean} defaultOpen Default open state for the drawer
 * @returns {Object} Object with drawer state and handlers
 */
export const useResponsiveDrawer = (defaultOpen = true) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // On mobile, drawer starts closed. On desktop, it uses the defaultOpen value
  const [open, setOpen] = useState(!isMobile && defaultOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Update state when screen size changes
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    } else {
      setOpen(defaultOpen);
      setMobileOpen(false);
    }
  }, [isMobile, defaultOpen]);
  
  // Toggle drawer
  const toggleDrawer = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setOpen(!open);
    }
  };
  
  return {
    open,
    setOpen,
    mobileOpen,
    setMobileOpen,
    toggleDrawer,
    isMobile
  };
};
