// src/components/documents/DocumentGrouping/DocumentGrouping.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  Paper
} from '@mui/material';
import {
  ExpandMore,
  Description,
  Assignment,
  School,
  Work,
  Badge as BadgeIcon,
  MoreVert,
  InfoOutlined,
  CheckCircle,
  Error,
  AccessTime,
  FilterList
} from '@mui/icons-material';
import styles from './DocumentGrouping.module.css';

/**
 * Component that organizes documents into collapsible groups
 */
const DocumentGrouping = ({
  documents = [],
  groupBy = 'type',
  initiallyExpanded = true,
  renderDocument,
  emptyMessage = 'No documents available',
  showGroupActions = true,
  className = '',
  onGroupActionClick,
  maxColumns = 3
}) => {
  const [expandedGroups, setExpandedGroups] = useState({});

  // Handle toggling expansion state for a group
  const handleToggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === undefined ? !initiallyExpanded : !prev[groupId]
    }));
  };

  // Check if a group is expanded
  const isGroupExpanded = (groupId) => {
    return expandedGroups[groupId] === undefined ? initiallyExpanded : expandedGroups[groupId];
  };

  // Get group by category configuration
  const getGroupConfig = (groupName) => {
    // Document type grouping
    if (groupBy === 'type') {
      switch (groupName) {
        case 'identity':
          return {
            icon: <BadgeIcon />,
            label: 'Identity Documents',
            color: 'primary'
          };
        case 'education':
          return {
            icon: <School />,
            label: 'Educational Documents',
            color: 'secondary'
          };
        case 'professional':
          return {
            icon: <Work />,
            label: 'Professional Documents',
            color: 'success'
          };
        case 'other':
          return {
            icon: <Description />,
            label: 'Other Documents',
            color: 'default'
          };
        default:
          return {
            icon: <Description />,
            label: groupName.charAt(0).toUpperCase() + groupName.slice(1),
            color: 'default'
          };
      }
    }

    // Status grouping
    if (groupBy === 'status') {
      switch (groupName) {
        case 'VERIFIED':
        case 'verified':
          return {
            icon: <CheckCircle />,
            label: 'Verified Documents',
            color: 'success'
          };
        case 'PENDING':
        case 'pending':
          return {
            icon: <AccessTime />,
            label: 'Pending Documents',
            color: 'warning'
          };
        case 'REJECTED':
        case 'rejected':
          return {
            icon: <Error />,
            label: 'Rejected Documents',
            color: 'error'
          };
        case 'EXPIRED':
        case 'expired':
          return {
            icon: <Error />,
            label: 'Expired Documents',
            color: 'error'
          };
        default:
          return {
            icon: <Assignment />,
            label: groupName.charAt(0).toUpperCase() + groupName.slice(1) + ' Documents',
            color: 'default'
          };
      }
    }

    // Default grouping
    return {
      icon: <FilterList />,
      label: groupName.charAt(0).toUpperCase() + groupName.slice(1),
      color: 'default'
    };
  };

  // Group documents by selected criteria
  const groupedDocuments = useMemo(() => {
    if (!documents || documents.length === 0) {
      return {};
    }

    return documents.reduce((groups, document) => {
      let groupKey;

      // Determine group key based on groupBy value
      if (groupBy === 'type') {
        groupKey = document.documentType || document.type || 'other';
      } else if (groupBy === 'status') {
        groupKey = document.status || 'pending';
      } else if (typeof groupBy === 'function') {
        groupKey = groupBy(document);
      } else {
        // Fallback to using the groupBy as object key
        groupKey = document[groupBy] || 'other';
      }

      // Ensure group exists
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      // Add document to group
      groups[groupKey].push(document);
      return groups;
    }, {});
  }, [documents, groupBy]);

  // If no documents
  if (!documents || documents.length === 0) {
    return (
      <Paper 
        elevation={0} 
        className={`${styles.emptyState} ${className}`}
        sx={{ 
          p: 3, 
          textAlign: 'center', 
          bgcolor: 'background.default',
          borderRadius: 2
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box className={`${styles.documentGroups} ${className}`}>
      {Object.entries(groupedDocuments).map(([groupName, groupDocs]) => {
        const { icon, label, color } = getGroupConfig(groupName);

        return (
          <Accordion 
            key={groupName}
            expanded={isGroupExpanded(groupName)}
            onChange={() => handleToggleGroup(groupName)}
            className={styles.groupAccordion}
            sx={{ mb: 2 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              className={styles.groupSummary}
              sx={{
                '&.Mui-expanded': {
                  minHeight: 48,
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Badge 
                    badgeContent={groupDocs.length} 
                    color={color} 
                    sx={{ mr: 2 }}
                  >
                    {icon}
                  </Badge>
                  <Typography variant="subtitle1">
                    {label}
                  </Typography>
                </Box>
                
                {showGroupActions && (
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                    <Tooltip title="Group Information">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGroupActionClick && onGroupActionClick('info', groupName, groupDocs);
                        }}
                      >
                        <InfoOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More Options">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGroupActionClick && onGroupActionClick('menu', groupName, groupDocs);
                        }}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </AccordionSummary>
            
            <AccordionDetails className={styles.groupDetails}>
              <Grid container spacing={2}>
                {groupDocs.map((document, index) => (
                  <Grid item xs={12} sm={6} md={12 / Math.min(maxColumns, groupDocs.length)} key={document._id || index}>
                    {renderDocument ? (
                      renderDocument(document, index)
                    ) : (
                      <Box 
                        sx={{ 
                          p: 2, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          borderRadius: 1
                        }}
                      >
                        <Typography variant="body2">
                          {document.documentName || document.fileName || `Document ${index + 1}`}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

DocumentGrouping.propTypes = {
  /** Array of document objects to group */
  documents: PropTypes.array,
  /** Property to group documents by ('type', 'status', or custom function) */
  groupBy: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func
  ]),
  /** Whether groups should be expanded by default */
  initiallyExpanded: PropTypes.bool,
  /** Custom renderer for document items */
  renderDocument: PropTypes.func,
  /** Message to display when no documents are available */
  emptyMessage: PropTypes.string,
  /** Whether to show action buttons for each group */
  showGroupActions: PropTypes.bool,
  /** Additional CSS class */
  className: PropTypes.string,
  /** Handler for group action button clicks */
  onGroupActionClick: PropTypes.func,
  /** Maximum number of columns in document grid */
  maxColumns: PropTypes.number
};

export default DocumentGrouping;