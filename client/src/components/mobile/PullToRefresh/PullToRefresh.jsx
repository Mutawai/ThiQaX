// client/src/components/mobile/PullToRefresh/PullToRefresh.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  CircularProgress, 
  Typography,
  styled,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import styles from './PullToRefresh.module.css';

// Styled components
const StyledContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  height: '100%',
  width: '100%'
}));

const StyledContent = styled(Box)(() => ({
  height: '100%',
  overflow: 'auto',
  '-webkit-overflow-scrolling': 'touch',
  transition: 'transform 0.3s ease-out',
  willChange: 'transform'
}));

/**
 * PullToRefresh Component
 * 
 * A mobile-optimized pull-to-refresh component that detects pull-down gestures
 * and triggers refresh actions with smooth animations
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content that can be refreshed
 * @param {Function} props.onRefresh - Callback function triggered when refresh is initiated
 * @param {boolean} props.refreshing - Whether refresh is currently in progress
 * @param {number} props.threshold - Distance in pixels required to trigger refresh (default: 80)
 * @param {number} props.resistance - Resistance factor for pull distance (default: 2.5)
 * @param {string} props.refreshingText - Text to display while refreshing
 * @param {string} props.pullText - Text to display when pulling down
 * @param {string} props.releaseText - Text to display when ready to release
 * @param {string} props.completeText - Text to display when refresh is complete
 * @param {boolean} props.showIcon - Whether to show refresh icon
 * @param {boolean} props.showText - Whether to show status text
 * @param {string} props.className - Additional CSS class for container
 * @param {boolean} props.disabled - Whether pull-to-refresh is disabled
 * @param {number} props.maxPullDistance - Maximum pull distance allowed
 * @param {Function} props.onPullStart - Callback when pull gesture starts
 * @param {Function} props.onPullEnd - Callback when pull gesture ends
 * @param {Object} props.customLoader - Custom loader component
 */
const PullToRefresh = ({
  children,
  onRefresh,
  refreshing = false,
  threshold = 80,
  resistance = 2.5,
  refreshingText = 'Refreshing...',
  pullText = 'Pull down to refresh',
  releaseText = 'Release to refresh',
  completeText = 'Refresh complete',
  showIcon = true,
  showText = true,
  className = '',
  disabled = false,
  maxPullDistance = 120,
  onPullStart,
  onPullEnd,
  customLoader = null
}) => {
  const theme = useTheme();
  
  // State management
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);
  
  // Refs
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const touchStartTimeRef = useRef(0);
  const refreshTimeoutRef = useRef(null);
  
  // Get current status text
  const getStatusText = useCallback(() => {
    if (refreshing) return refreshingText;
    if (isComplete) return completeText;
    if (canRefresh) return releaseText;
    return pullText;
  }, [refreshing, isComplete, canRefresh, refreshingText, completeText, releaseText, pullText]);
  
  // Get current icon
  const getCurrentIcon = useCallback(() => {
    if (refreshing) {
      return customLoader || <CircularProgress size={24} className={styles.spinner} />;
    }
    if (isComplete) {
      return <CheckIcon className={styles.completeIcon} />;
    }
    if (canRefresh) {
      return <RefreshIcon className={styles.refreshIcon} />;
    }
    return <ArrowDownIcon className={styles.arrowIcon} />;
  }, [refreshing, isComplete, canRefresh, customLoader]);
  
  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    if (disabled || refreshing) return;
    
    const touch = e.touches[0];
    const scrollTop = contentRef.current?.scrollTop || 0;
    
    // Only start pull gesture if at the top of the scroll
    if (scrollTop <= 0) {
      setStartY(touch.clientY);
      setStartScrollTop(scrollTop);
      touchStartTimeRef.current = Date.now();
      
      if (onPullStart) {
        onPullStart();
      }
    }
  }, [disabled, refreshing, onPullStart]);
  
  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (disabled || refreshing || startY === 0) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - startY;
    const scrollTop = contentRef.current?.scrollTop || 0;
    
    // Only proceed if we're still at the top and pulling down
    if (scrollTop <= 0 && deltaY > 0) {
      e.preventDefault(); // Prevent default scroll behavior
      
      setIsPulling(true);
      
      // Calculate pull distance with resistance
      const resistedDistance = Math.min(
        deltaY / resistance,
        maxPullDistance
      );
      
      setPullDistance(resistedDistance);
      setCanRefresh(resistedDistance >= threshold);
    }
  }, [disabled, refreshing, startY, resistance, maxPullDistance, threshold]);
  
  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (disabled || refreshing) return;
    
    const endTime = Date.now();
    const touchDuration = endTime - touchStartTimeRef.current;
    
    // Reset start position
    setStartY(0);
    setStartScrollTop(0);
    
    if (isPulling) {
      if (canRefresh && onRefresh) {
        // Trigger refresh
        onRefresh();
      }
      
      // Reset pull state
      setIsPulling(false);
      setPullDistance(0);
      setCanRefresh(false);
      
      if (onPullEnd) {
        onPullEnd({
          distance: pullDistance,
          duration: touchDuration,
          triggered: canRefresh
        });
      }
    }
  }, [disabled, refreshing, isPulling, canRefresh, pullDistance, onRefresh, onPullEnd]);
  
  // Handle refresh completion
  useEffect(() => {
    if (!refreshing && isComplete) {
      // Show completion state briefly
      refreshTimeoutRef.current = setTimeout(() => {
        setIsComplete(false);
      }, 1000);
    } else if (refreshing) {
      setIsComplete(false);
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshing, isComplete]);
  
  // Set completion state when refreshing finishes
  useEffect(() => {
    if (!refreshing && (isPulling || pullDistance > 0)) {
      setIsComplete(true);
      setIsPulling(false);
      setPullDistance(0);
      setCanRefresh(false);
    }
  }, [refreshing, isPulling, pullDistance]);
  
  // Calculate refresh indicator position and opacity
  const getRefreshIndicatorStyle = () => {
    const isActive = isPulling || refreshing || isComplete;
    const progress = Math.min(pullDistance / threshold, 1);
    
    return {
      transform: `translateY(${isActive ? 0 : -60}px)`,
      opacity: isActive ? 1 : 0,
      transition: isPulling ? 'none' : 'all 0.3s ease-out'
    };
  };
  
  // Calculate content transform
  const getContentTransform = () => {
    if (refreshing || isComplete) {
      return 'translateY(60px)';
    }
    
    if (isPulling) {
      return `translateY(${Math.min(pullDistance, maxPullDistance)}px)`;
    }
    
    return 'translateY(0)';
  };
  
  // Calculate refresh icon rotation
  const getIconRotation = () => {
    if (refreshing) return 0;
    if (canRefresh) return 180;
    
    const progress = Math.min(pullDistance / threshold, 1);
    return progress * 180;
  };
  
  return (
    <StyledContainer 
      ref={containerRef}
      className={`${styles.container} ${className} ${disabled ? styles.disabled : ''}`}
    >
      {/* Refresh Indicator */}
      <Box 
        className={styles.refreshIndicator}
        style={getRefreshIndicatorStyle()}
        role="status"
        aria-live="polite"
        aria-label={getStatusText()}
      >
        <Box className={styles.indicatorContent}>
          {showIcon && (
            <Box 
              className={styles.iconContainer}
              style={{
                transform: `rotate(${getIconRotation()}deg)`,
                transition: isPulling ? 'none' : 'transform 0.3s ease-out'
              }}
            >
              {getCurrentIcon()}
            </Box>
          )}
          
          {showText && (
            <Typography 
              variant="body2" 
              className={styles.statusText}
              color="textSecondary"
            >
              {getStatusText()}
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* Content */}
      <StyledContent
        ref={contentRef}
        className={styles.content}
        style={{
          transform: getContentTransform(),
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </StyledContent>
      
      {/* Progress indicator for threshold */}
      {isPulling && (
        <Box 
          className={styles.progressIndicator}
          style={{
            width: `${Math.min((pullDistance / threshold) * 100, 100)}%`,
            opacity: pullDistance > 0 ? 1 : 0
          }}
        />
      )}
    </StyledContainer>
  );
};

PullToRefresh.propTypes = {
  children: PropTypes.node.isRequired,
  onRefresh: PropTypes.func,
  refreshing: PropTypes.bool,
  threshold: PropTypes.number,
  resistance: PropTypes.number,
  refreshingText: PropTypes.string,
  pullText: PropTypes.string,
  releaseText: PropTypes.string,
  completeText: PropTypes.string,
  showIcon: PropTypes.bool,
  showText: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  maxPullDistance: PropTypes.number,
  onPullStart: PropTypes.func,
  onPullEnd: PropTypes.func,
  customLoader: PropTypes.node
};

export default PullToRefresh;