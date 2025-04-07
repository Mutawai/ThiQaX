// src/components/documentation/DocumentationProvider.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';

// Create context
const DocumentationContext = createContext();

/**
 * Documentation Provider Component
 * Provides documentation content throughout the application
 * Handles loading, caching, and retrieving documentation items
 */
export const DocumentationProvider = ({ children }) => {
  // State for all documentation items, organized by category and ID
  const [documentationItems, setDocumentationItems] = useState({
    userGuides: {},
    help: {},
    faq: {},
    tooltips: {}
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load documentation from API on component mount
  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        setIsLoading(true);
        
        // Fetch different types of documentation
        const [userGuidesRes, helpRes, faqRes, tooltipsRes] = await Promise.all([
          axios.get(`${config.apiBaseUrl}/api/v1/documentation/user-guides`),
          axios.get(`${config.apiBaseUrl}/api/v1/documentation/help`),
          axios.get(`${config.apiBaseUrl}/api/v1/documentation/faq`),
          axios.get(`${config.apiBaseUrl}/api/v1/documentation/tooltips`)
        ]);
        
        // Process the responses into a normalized structure
        const guides = userGuidesRes.data.data.reduce((acc, guide) => {
          acc[guide.id] = guide;
          return acc;
        }, {});
        
        const help = helpRes.data.data.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {});
        
        const faq = faqRes.data.data.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {});
        
        const tooltips = tooltipsRes.data.data.reduce((acc, tooltip) => {
          acc[tooltip.id] = tooltip;
          return acc;
        }, {});
        
        setDocumentationItems({
          userGuides: guides,
          help,
          faq,
          tooltips
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching documentation:', err);
        setError('Failed to load documentation content');
        setIsLoading(false);
      }
    };
    
    fetchDocumentation();
  }, []);
  
  /**
   * Get a user guide by ID
   * @param {string} id - The ID of the user guide
   * @returns {Object|null} The user guide object or null if not found
   */
  const getUserGuide = (id) => {
    return documentationItems.userGuides[id] || null;
  };
  
  /**
   * Get user guides filtered by role
   * @param {string} role - The user role to filter by (jobSeeker, agent, sponsor)
   * @returns {Array} Array of user guides for the specified role
   */
  const getUserGuidesByRole = (role) => {
    return Object.values(documentationItems.userGuides)
      .filter(guide => guide.roles.includes(role));
  };
  
  /**
   * Get help content by ID
   * @param {string} id - The ID of the help content
   * @returns {Object|null} The help content object or null if not found
   */
  const getHelpContent = (id) => {
    return documentationItems.help[id] || null;
  };
  
  /**
   * Get help content by workflow
   * @param {string} workflow - The workflow to filter by
   * @returns {Array} Array of help content items for the specified workflow
   */
  const getHelpByWorkflow = (workflow) => {
    return Object.values(documentationItems.help)
      .filter(item => item.workflow === workflow);
  };
  
  /**
   * Get FAQ items by category
   * @param {string} category - The category to filter by
   * @returns {Array} Array of FAQ items for the specified category
   */
  const getFaqByCategory = (category) => {
    return Object.values(documentationItems.faq)
      .filter(item => item.category === category);
  };
  
  /**
   * Get a tooltip by component ID
   * @param {string} componentId - The ID of the UI component
   * @returns {Object|null} The tooltip object or null if not found
   */
  const getTooltip = (componentId) => {
    return documentationItems.tooltips[componentId] || null;
  };
  
  // Context value
  const value = {
    isLoading,
    error,
    getUserGuide,
    getUserGuidesByRole,
    getHelpContent,
    getHelpByWorkflow,
    getFaqByCategory,
    getTooltip,
    // Expose the full collections for advanced use cases
    allUserGuides: Object.values(documentationItems.userGuides),
    allHelp: Object.values(documentationItems.help),
    allFaq: Object.values(documentationItems.faq),
    allTooltips: Object.values(documentationItems.tooltips)
  };
  
  return (
    <DocumentationContext.Provider value={value}>
      {children}
    </DocumentationContext.Provider>
  );
};

// Custom hook for using the documentation context
export const useDocumentation = () => {
  const context = useContext(DocumentationContext);
  if (context === undefined) {
    throw new Error('useDocumentation must be used within a DocumentationProvider');
  }
  return context;
};

// src/components/documentation/Tooltip.js
import React from 'react';
import { Tooltip as MUITooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useDocumentation } from './DocumentationProvider';

/**
 * Smart Tooltip component that fetches content from the documentation system
 * @param {Object} props
 * @param {string} props.componentId - The ID of the component to show tooltip for
 * @param {React.ReactNode} props.children - The element to attach the tooltip to
 * @param {Object} props.tooltipProps - Additional props to pass to the MUI Tooltip
 */
export const Tooltip = ({ componentId, children, tooltipProps = {} }) => {
  const { getTooltip, isLoading } = useDocumentation();
  const tooltip = getTooltip(componentId);
  
  // If there's no tooltip content or we're still loading, just render children
  if (isLoading || !tooltip) {
    return children;
  }
  
  return (
    <MUITooltip
      title={tooltip.content}
      arrow
      placement="top"
      {...tooltipProps}
    >
      {children || <HelpOutlineIcon fontSize="small" color="action" />}
    </MUITooltip>
  );
};

// src/components/documentation/HelpPanel.js
import React from 'react';
import { Paper, Typography, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useDocumentation } from './DocumentationProvider';

/**
 * Help Panel Component
 * Shows help content for a specific workflow
 * @param {Object} props
 * @param {string} props.workflow - The workflow to show help for
 */
export const HelpPanel = ({ workflow }) => {
  const { getHelpByWorkflow, isLoading, error } = useDocumentation();
  
  if (isLoading) {
    return <Box p={2}><Typography>Loading help content...</Typography></Box>;
  }
  
  if (error) {
    return <Box p={2}><Typography color="error">{error}</Typography></Box>;
  }
  
  const helpItems = getHelpByWorkflow(workflow);
  
  if (!helpItems || helpItems.length === 0) {
    return <Box p={2}><Typography>No help content available for this workflow.</Typography></Box>;
  }
  
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Help & Guidance</Typography>
      
      {helpItems.map((item, index) => (
        <Accordion key={item.id || index} defaultExpanded={index === 0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{item.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography 
              component="div" 
              dangerouslySetInnerHTML={{ __html: item.content }} 
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
};

// src/components/documentation/FAQSection.js
import React, { useState } from 'react';
import { 
  Paper, Typography, Box, Accordion, AccordionSummary, 
  AccordionDetails, TextField, InputAdornment 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import { useDocumentation } from './DocumentationProvider';

/**
 * FAQ Section Component
 * Shows FAQ items filtered by category and searchable
 * @param {Object} props
 * @param {string} props.category - The category to filter by (optional)
 */
export const FAQSection = ({ category }) => {
  const { getFaqByCategory, allFaq, isLoading, error } = useDocumentation();
  const [searchTerm, setSearchTerm] = useState('');
  
  if (isLoading) {
    return <Box p={2}><Typography>Loading FAQ content...</Typography></Box>;
  }
  
  if (error) {
    return <Box p={2}><Typography color="error">{error}</Typography></Box>;
  }
  
  // Get FAQ items - either all or filtered by category
  const faqItems = category ? getFaqByCategory(category) : allFaq;
  
  // Filter by search term if provided
  const filteredItems = searchTerm 
    ? faqItems.filter(item => 
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : faqItems;
  
  if (!filteredItems || filteredItems.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Frequently Asked Questions</Typography>
        <Box mb={2}>
          <TextField
            fullWidth
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Typography>No FAQ items found. Try adjusting your search.</Typography>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Frequently Asked Questions</Typography>
      
      <Box mb={2}>
        <TextField
          fullWidth
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {filteredItems.map((item, index) => (
        <Accordion key={item.id || index}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="medium">{item.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography 
              component="div" 
              dangerouslySetInnerHTML={{ __html: item.answer }} 
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
};

// src/components/documentation/UserGuideContent.js
import React from 'react';
import { Paper, Typography, Box, Stepper, Step, StepLabel, StepContent, Divider } from '@mui/material';
import { useDocumentation } from './DocumentationProvider';

/**
 * User Guide Content Component
 * Shows a specific user guide by ID
 * @param {Object} props
 * @param {string} props.guideId - The ID of the user guide to show
 */
export const UserGuideContent = ({ guideId }) => {
  const { getUserGuide, isLoading, error } = useDocumentation();
  
  if (isLoading) {
    return <Box p={2}><Typography>Loading user guide...</Typography></Box>;
  }
  
  if (error) {
    return <Box p={2}><Typography color="error">{error}</Typography></Box>;
  }
  
  const guide = getUserGuide(guideId);
  
  if (!guide) {
    return <Box p={2}><Typography>User guide not found.</Typography></Box>;
  }
  
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h5" gutterBottom>{guide.title}</Typography>
      <Typography color="text.secondary" paragraph>{guide.description}</Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Box mt={3}>
        {guide.content && (
          <Typography 
            component="div" 
            dangerouslySetInnerHTML={{ __html: guide.content }} 
          />
        )}
        
        {guide.steps && guide.steps.length > 0 && (
          <Stepper orientation="vertical" sx={{ mt: 2 }}>
            {guide.steps.map((step, index) => (
              <Step key={index} active={true}>
                <StepLabel>{step.title}</StepLabel>
                <StepContent>
                  <Typography 
                    component="div" 
                    dangerouslySetInnerHTML={{ __html: step.content }} 
                  />
                </StepContent>
              </Step>
            ))}
          </Stepper>
        )}
      </Box>
    </Paper>
  );
};

// src/components/documentation/UserGuidesListing.js
import React from 'react';
import { 
  Paper, Typography, Box, List, ListItem, ListItemButton, 
  ListItemText, ListItemIcon, Chip, Divider 
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { useDocumentation } from './DocumentationProvider';
import { Link as RouterLink } from 'react-router-dom';

/**
 * User Guides Listing Component
 * Shows a list of user guides filtered by role
 * @param {Object} props
 * @param {string} props.role - The user role to filter by (optional)
 */
export const UserGuidesListing = ({ role }) => {
  const { getUserGuidesByRole, allUserGuides, isLoading, error } = useDocumentation();
  
  if (isLoading) {
    return <Box p={2}><Typography>Loading user guides...</Typography></Box>;
  }
  
  if (error) {
    return <Box p={2}><Typography color="error">{error}</Typography></Box>;
  }
  
  // Get user guides - either all or filtered by role
  const guides = role ? getUserGuidesByRole(role) : allUserGuides;
  
  if (!guides || guides.length === 0) {
    return <Box p={2}><Typography>No user guides available.</Typography></Box>;
  }
  
  // Group guides by category
  const categorizedGuides = guides.reduce((acc, guide) => {
    if (!acc[guide.category]) {
      acc[guide.category] = [];
    }
    acc[guide.category].push(guide);
    return acc;
  }, {});
  
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h5" gutterBottom>User Guides</Typography>
      
      {Object.entries(categorizedGuides).map(([category, guides], categoryIndex) => (
        <Box key={category} mt={categoryIndex > 0 ? 3 : 0}>
          <Typography variant="h6" color="primary" gutterBottom>{category}</Typography>
          <List>
            {guides.map((guide) => (
              <ListItem key={guide.id} disablePadding>
                <ListItemButton component={RouterLink} to={`/help/guides/${guide.id}`}>
                  <ListItemIcon>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={guide.title} 
                    secondary={guide.description} 
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                  {guide.roles && guide.roles.length > 0 && (
                    <Box>
                      {guide.roles.map(role => (
                        <Chip 
                          key={role} 
                          label={role} 
                          size="small" 
                          sx={{ ml: 0.5 }}
                          color={
                            role === 'jobSeeker' ? 'primary' :
                            role === 'agent' ? 'secondary' : 
                            role === 'sponsor' ? 'success' : 'default'
                          }
                        />
                      ))}
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {categoryIndex < Object.keys(categorizedGuides).length - 1 && <Divider />}
        </Box>
      ))}
    </Paper>
  );
};
