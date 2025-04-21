// client/src/components/mobile/BottomSheet/BottomSheet.jsx
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Backdrop, 
  Paper, 
  IconButton, 
  Typography,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Remove as HandleIcon
} from '@mui/icons-material';
import styles from './BottomSheet.module.css';

/**
 * BottomSheet Component
 * 
 * A mobile-friendly bottom sheet that slides up from the bottom of the screen
 * with support for drag gestures
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the bottom sheet is open
 * @param {Function} props.onClose - Callback when the sheet is closed
 * @param {React.ReactNode} props.children - Content to display in the sheet
 * @param {string} props.title - Title to display in the header
 * @param {boolean} props.fullHeight - Whether the sheet should take full height
 * @param {boolean} props.disableDrag - Whether to disable drag gestures
 * @param {string} props.snapPoints - Comma-separated list of snap points (e.g. "25%,50%,90%")
 */
const BottomSheet = ({ 
  open, 
  onClose, 
  children, 
  title, 
  fullHeight = false,
  disableDrag = false,
  snapPoints = "50%,90%"
}) => {
  const [dragging, setDragging] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(fullHeight ? '90%' : getInitialSnapPoint());
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  
  // Parse snap points
  const getSnapPointsArray = () => {
    return snapPoints.split(',').map(point => point.trim());
  };
  
  // Get initial snap point
  function getInitialSnapPoint() {
    const points = getSnapPointsArray();
    return points.length > 0 ? points[0] : '50%';
  }
  
  // Reset to initial state when opening
  useEffect(() => {
    if (open) {
      setSheetHeight(fullHeight ? '90%' : getInitialSnapPoint());
    }
  }, [open, fullHeight]);
  
  // Handle touch start
  const handleTouchStart = (e) => {
    if (disableDrag) return;
    
    const touchY = e.touches[0].clientY;
    setStartY(touchY);
    setCurrentY(touchY);
    setDragging(true);
  };
  
  // Handle touch move
  const handleTouchMove = (e) => {
    if (!dragging) return;
    
    const touchY = e.touches[0].clientY;
    setCurrentY(touchY);
    
    const deltaY = touchY - startY;
    
    // Don't allow dragging down if already at the top
    if (sheetHeight === '90%' && deltaY < 0) {
      return;
    }
    
    // Calculate new height
    if (sheetRef.current) {
      const sheetRect = sheetRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Get current height in pixels
      let currentHeightPx;
      if (typeof sheetHeight === 'string' && sheetHeight.includes('%')) {
        const percentage = parseInt(sheetHeight, 10);
        currentHeightPx = (windowHeight * percentage) / 100;
      } else {
        currentHeightPx = parseInt(sheetHeight, 10);
      }
      
      // Calculate new height based on drag
      const newHeightPx = Math.max(100, currentHeightPx - deltaY);
      const newHeightPercent = Math.min(90, Math.max(25, (newHeightPx / windowHeight) * 100));
      
      sheetRef.current.style.height = `${newHeightPercent}%`;
    }
  };
  
  // Handle touch end
  const handleTouchEnd = () => {
    if (!dragging) return;
    
    setDragging(false);
    
    const deltaY = currentY - startY;
    
    // If dragged down more than 20% of the screen, close the sheet
    if (deltaY > window.innerHeight * 0.2) {
      onClose();
      return;
    }
    
    // Snap to closest point
    if (sheetRef.current) {
      const sheetRect = sheetRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const currentPercent = (sheetRect.height / windowHeight) * 100;
      
      // Find closest snap point
      const snapPoints = getSnapPointsArray().map(point => parseInt(point, 10));
      const closestPoint = snapPoints.reduce((prev, curr) => {
        return Math.abs(curr - currentPercent) < Math.abs(prev - currentPercent) ? curr : prev;
      });
      
      setSheetHeight(`${closestPoint}%`);
    }
  };
  
  // Handle close button click
  const handleClose = () => {
    onClose();
  };
  
  // Check if content is scrollable
  const isContentScrollable = () => {
    if (!contentRef.current) return false;
    
    return contentRef.current.scrollHeight > contentRef.current.clientHeight;
  };
  
  // Handle content scroll
  const handleContentScroll = (e) => {
    // Disable drag when content is scrolled
    if (e.target.scrollTop > 0) {
      // Don't handle drag events when scrolling content
    }
  };
  
  // Nothing to render if not open
  if (!open) return null;
  
  return (
    <>
      <Backdrop
        open={open}
        onClick={handleClose}
        className={styles.backdrop}
      />
      <Paper
        ref={sheetRef}
        className={styles.bottomSheet}
        elevation={4}
        style={{ 
          height: sheetHeight,
          transition: dragging ? 'none' : 'height 0.3s ease-out'
        }}
      >
        {/* Handle and Header */}
        <Box 
          className={styles.sheetHeader}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={styles.handle}>
            <HandleIcon className={styles.handleIcon} />
          </div>
          
          {title && (
            <Typography variant="h6" className={styles.title}>
              {title}
            </Typography>
          )}
          
          <IconButton 
            size="small" 
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider />
        
        {/* Content */}
        <Box 
          ref={contentRef}
          className={styles.content}
          onScroll={handleContentScroll}
        >
          {children}
        </Box>
      </Paper>
    </>
  );
};

BottomSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  fullHeight: PropTypes.bool,
  disableDrag: PropTypes.bool,
  snapPoints: PropTypes.string
};

export default BottomSheet;