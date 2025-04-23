// client/src/components/mobile/SwipeableListItem/SwipeableListItem.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton } from '@mui/material';
import styles from './SwipeableListItem.module.css';

/**
 * SwipeableListItem Component
 * 
 * A mobile-friendly list item that supports swipe gestures to reveal actions
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content of the list item
 * @param {Array} props.leftActions - Array of action objects for left swipe
 * @param {Array} props.rightActions - Array of action objects for right swipe
 * @param {string} props.className - Additional CSS class for the container
 * @param {Object} props.style - Additional inline styles for the container
 * @param {Function} props.onSwipeStart - Callback when swipe starts
 * @param {Function} props.onSwipeEnd - Callback when swipe ends
 * @param {number} props.threshold - Distance required to trigger actions (in px)
 * @param {boolean} props.disabled - Whether swiping is disabled
 */
const SwipeableListItem = ({
  children,
  leftActions = [],
  rightActions = [],
  className = '',
  style = {},
  onSwipeStart,
  onSwipeEnd,
  threshold = 80,
  disabled = false
}) => {
  const [swiping, setSwiping] = useState(false);
  const [swipePosition, setSwipePosition] = useState(0);
  const [startX, setStartX] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const [settled, setSettled] = useState(true);
  
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Calculate max swipe distances based on actions
  const maxLeftSwipe = leftActions.length * threshold;
  const maxRightSwipe = rightActions.length * threshold;
  
  // Reset position on props change or component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [leftActions, rightActions]);
  
  // Reset on disable change
  useEffect(() => {
    if (disabled && swipePosition !== 0) {
      resetPosition();
    }
  }, [disabled]);
  
  // Handle touch start
  const handleTouchStart = (e) => {
    if (disabled) return;
    
    const touchX = e.touches[0].clientX;
    setStartX(touchX);
    setSwiping(true);
    setHasMoved(false);
    setSettled(false);
    
    if (onSwipeStart) {
      onSwipeStart();
    }
    
    // Clear any ongoing animation timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Prevent content scrolling while swiping
    if (containerRef.current) {
      containerRef.current.style.overflowX = 'hidden';
    }
  };
  
  // Handle touch move
  const handleTouchMove = (e) => {
    if (!swiping || disabled) return;
    
    const touchX = e.touches[0].clientX;
    const diff = touchX - startX;
    
    // Set moved flag for distinguishing swipes from taps
    if (Math.abs(diff) > 10) {
      setHasMoved(true);
    }
    
    // Calculate swipe position with resistance at edges
    let newPosition = diff;
    
    // Apply resistance when swiping beyond action limits
    if (diff > 0 && diff > maxLeftSwipe) {
      newPosition = maxLeftSwipe + (diff - maxLeftSwipe) * 0.2;
    } else if (diff < 0 && Math.abs(diff) > maxRightSwipe) {
      newPosition = -maxRightSwipe - (Math.abs(diff) - maxRightSwipe) * 0.2;
    }
    
    setSwipePosition(newPosition);
  };
  
  // Handle touch end
  const handleTouchEnd = () => {
    if (!swiping || disabled) return;
    
    setSwiping(false);
    
    const position = swipePosition;
    
    // Determine if we should snap to an action or reset
    if (position > 0) {
      // Left swipe (positive values)
      if (position >= threshold && leftActions.length > 0) {
        // Find the correct snap point based on how far the user swiped
        const actionIndex = Math.min(
          Math.floor(position / threshold),
          leftActions.length - 1
        );
        snapToPosition((actionIndex + 1) * threshold);
      } else {
        resetPosition();
      }
    } else if (position < 0) {
      // Right swipe (negative values)
      if (Math.abs(position) >= threshold && rightActions.length > 0) {
        // Find the correct snap point based on how far the user swiped
        const actionIndex = Math.min(
          Math.floor(Math.abs(position) / threshold),
          rightActions.length - 1
        );
        snapToPosition(-(actionIndex + 1) * threshold);
      } else {
        resetPosition();
      }
    } else {
      setSettled(true);
    }
    
    if (onSwipeEnd) {
      onSwipeEnd(position);
    }
  };
  
  // Reset the item to its original position
  const resetPosition = () => {
    setSwipePosition(0);
    
    // Add a small delay before setting settled to true to allow for animation
    timeoutRef.current = setTimeout(() => {
      setSettled(true);
    }, 300);
  };
  
  // Snap to a specific position
  const snapToPosition = (position) => {
    setSwipePosition(position);
    
    // Add a small delay before setting settled to true to allow for animation
    timeoutRef.current = setTimeout(() => {
      setSettled(true);
    }, 300);
  };
  
  // Handle click on an action
  const handleActionClick = (action) => {
    if (action.onClick) {
      action.onClick();
    }
    
    // Reset position after action click if autoReset is true
    if (action.autoReset !== false) {
      resetPosition();
    }
  };
  
  // Render the actions for a given side
  const renderActions = (actions, side) => {
    return (
      <Box 
        className={`${styles.actionsContainer} ${side === 'left' ? styles.leftActions : styles.rightActions}`}
        style={{
          width: actions.length * threshold,
          [side]: 0
        }}
      >
        {actions.map((action, index) => (
          <Box 
            key={index}
            className={styles.actionItem}
            style={{
              width: threshold,
              backgroundColor: action.color || (side === 'left' ? '#4caf50' : '#f44336')
            }}
          >
            <IconButton
              className={styles.actionButton}
              onClick={() => handleActionClick(action)}
              aria-label={action.label}
              size="small"
              color="inherit"
            >
              {action.icon}
            </IconButton>
          </Box>
        ))}
      </Box>
    );
  };
  
  return (
    <Box
      ref={containerRef}
      className={`${styles.container} ${className}`}
      style={style}
    >
      {/* Left actions */}
      {leftActions.length > 0 && renderActions(leftActions, 'left')}
      
      {/* Right actions */}
      {rightActions.length > 0 && renderActions(rightActions, 'right')}
      
      {/* Content */}
      <Box
        ref={contentRef}
        className={styles.content}
        style={{
          transform: `translateX(${swipePosition}px)`,
          transition: swiping ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </Box>
    </Box>
  );
};

SwipeableListItem.propTypes = {
  children: PropTypes.node.isRequired,
  leftActions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node.isRequired,
      onClick: PropTypes.func,
      color: PropTypes.string,
      label: PropTypes.string.isRequired,
      autoReset: PropTypes.bool
    })
  ),
  rightActions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node.isRequired,
      onClick: PropTypes.func,
      color: PropTypes.string,
      label: PropTypes.string.isRequired,
      autoReset: PropTypes.bool
    })
  ),
  className: PropTypes.string,
  style: PropTypes.object,
  onSwipeStart: PropTypes.func,
  onSwipeEnd: PropTypes.func,
  threshold: PropTypes.number,
  disabled: PropTypes.bool
};

export default SwipeableListItem;