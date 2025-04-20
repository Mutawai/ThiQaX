// src/components/utils/context/MobileContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useMobileDetection from '../hooks/useMobileDetection';

// Create the context
const MobileContext = createContext();

/**
 * Mobile Provider Component
 * Provides mobile-specific state and utilities throughout the application
 */
export const MobileProvider = ({ children }) => {
  // Use the mobile detection hook
  const mobileDetection = useMobileDetection();
  
  // Additional mobile-specific state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('main');
  const [previousViews, setPreviousViews] = useState([]);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [bottomSheetContent, setBottomSheetContent] = useState(null);
  const [pullToRefreshEnabled, setPullToRefreshEnabled] = useState(true);
  
  // Deep link handling
  const [pendingDeepLink, setPendingDeepLink] = useState(null);
  
  // Mobile navigation history stack
  const [navigationStack, setNavigationStack] = useState([]);
  
  // Mobile gesture state
  const [gestureState, setGestureState] = useState({
    swipeDirection: null,
    isSwipeInProgress: false,
    touchStartX: 0,
    touchStartY: 0
  });
  
  // Handle back navigation
  const handleBackNavigation = useCallback(() => {
    if (previousViews.length > 0) {
      // Get the last view
      const previousView = previousViews[previousViews.length - 1];
      
      // Update state
      setActiveView(previousView);
      setPreviousViews(prev => prev.slice(0, -1));
      
      return true; // Indicate back navigation was handled
    }
    
    return false; // Not handled, let default back behavior occur
  }, [previousViews]);
  
  // Navigate to a view while preserving history
  const navigateTo = useCallback((view) => {
    // Save current view in history
    if (activeView !== view) {
      setPreviousViews(prev => [...prev, activeView]);
      setActiveView(view);
    }
  }, [activeView]);
  
  // Reset navigation history
  const resetNavigation = useCallback((initialView = 'main') => {
    setPreviousViews([]);
    setActiveView(initialView);
  }, []);
  
  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);
  
  // Close sidebar
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);
  
  // Open bottom sheet with content
  const openBottomSheet = useCallback((content) => {
    setBottomSheetContent(content);
    setBottomSheetOpen(true);
  }, []);
  
  // Close bottom sheet
  const closeBottomSheet = useCallback(() => {
    setBottomSheetOpen(false);
    // Clear content after animation completes
    setTimeout(() => {
      setBottomSheetContent(null);
    }, 300);
  }, []);
  
  // Handle touch start for gesture detection
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setGestureState({
      ...gestureState,
      touchStartX: touch.clientX,
      touchStartY: touch.clientY,
      isSwipeInProgress: true
    });
  }, [gestureState]);
  
  // Handle touch move for gesture detection
  const handleTouchMove = useCallback((e) => {
    if (!gestureState.isSwipeInProgress) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - gestureState.touchStartX;
    const deltaY = touch.clientY - gestureState.touchStartY;
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      setGestureState({
        ...gestureState,
        swipeDirection: deltaX > 0 ? 'right' : 'left'
      });
    } else {
      // Vertical swipe
      setGestureState({
        ...gestureState,
        swipeDirection: deltaY > 0 ? 'down' : 'up'
      });
    }
  }, [gestureState]);
  
  // Handle touch end for gesture detection
  const handleTouchEnd = useCallback((e) => {
    const { swipeDirection, isSwipeInProgress } = gestureState;
    
    if (isSwipeInProgress) {
      // Handle swipe actions
      if (swipeDirection === 'right' && previousViews.length > 0) {
        handleBackNavigation();
      } else if (swipeDirection === 'left' && sidebarOpen) {
        closeSidebar();
      } else if (swipeDirection === 'right' && !sidebarOpen) {
        toggleSidebar();
      } else if (swipeDirection === 'up' && bottomSheetOpen) {
        closeBottomSheet();
      }
      
      // Reset gesture state
      setGestureState({
        swipeDirection: null,
        isSwipeInProgress: false,
        touchStartX: 0,
        touchStartY: 0
      });
    }
  }, [gestureState, previousViews, handleBackNavigation, sidebarOpen, closeSidebar, toggleSidebar, bottomSheetOpen, closeBottomSheet]);
  
  // Process deep links
  const processDeepLink = useCallback((url) => {
    if (!url) return;
    
    // Parse the URL
    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      const params = Object.fromEntries(parsedUrl.searchParams.entries());
      
      // Handle different paths
      if (path.startsWith('/jobs/')) {
        const jobId = path.split('/').pop();
        navigateTo('jobDetail');
        // Store parameters for the view to use
        setPendingDeepLink({
          type: 'job',
          id: jobId,
          params
        });
      } else if (path.startsWith('/profiles/')) {
        const profileId = path.split('/').pop();
        navigateTo('profile');
        setPendingDeepLink({
          type: 'profile',
          id: profileId,
          params
        });
      } else if (path.startsWith('/messages/')) {
        const conversationId = path.split('/').pop();
        navigateTo('messages');
        setPendingDeepLink({
          type: 'message',
          id: conversationId,
          params
        });
      } else if (path.startsWith('/verify/')) {
        const verificationCode = path.split('/').pop();
        navigateTo('verification');
        setPendingDeepLink({
          type: 'verification',
          code: verificationCode,
          params
        });
      }
    } catch (err) {
      console.error('Error processing deep link:', err);
    }
  }, [navigateTo]);
  
  // Setup back button handler for mobile
  useEffect(() => {
    const handleBackButton = (e) => {
      if (mobileDetection.isMobile) {
        // Check if there's an open modal or drawer to close first
        if (bottomSheetOpen) {
          closeBottomSheet();
          e.preventDefault();
          return;
        }
        
        if (sidebarOpen) {
          closeSidebar();
          e.preventDefault();
          return;
        }
        
        // Then try to navigate back in our custom stack
        if (handleBackNavigation()) {
          e.preventDefault();
        }
      }
    };
    
    // Add event listener for back button (both browser and device)
    window.addEventListener('popstate', handleBackButton);
    
    // For Android physical back button
    if (typeof document !== 'undefined' && mobileDetection.isMobile) {
      document.addEventListener('backbutton', handleBackButton);
    }
    
    return () => {
      window.removeEventListener('popstate', handleBackButton);
      if (typeof document !== 'undefined') {
        document.removeEventListener('backbutton', handleBackButton);
      }
    };
  }, [mobileDetection.isMobile, bottomSheetOpen, closeBottomSheet, sidebarOpen, closeSidebar, handleBackNavigation]);
  
  // Add touch event listeners for gesture detection
  useEffect(() => {
    if (mobileDetection.isMobile && typeof document !== 'undefined') {
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [mobileDetection.isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  // Listen for deep links
  useEffect(() => {
    // Function to handle deep links
    const handleDeepLink = (event) => {
      const url = event.url || (event.data && event.data.url);
      processDeepLink(url);
    };
    
    // Set up listeners for deep links
    if (typeof window !== 'undefined') {
      // For web
      window.addEventListener('message', handleDeepLink);
      
      // Check for initial URL parameters that might be deep links
      const currentUrl = window.location.href;
      if (currentUrl.includes('?')) {
        processDeepLink(currentUrl);
      }
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', handleDeepLink);
      }
    };
  }, [processDeepLink]);
  
  // Context value
  const contextValue = {
    // Mobile detection values
    ...mobileDetection,
    
    // Mobile navigation state
    activeView,
    previousViews,
    navigateTo,
    handleBackNavigation,
    resetNavigation,
    navigationStack,
    
    // Sidebar state
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    
    // Bottom sheet state
    bottomSheetOpen,
    bottomSheetContent,
    openBottomSheet,
    closeBottomSheet,
    
    // Gesture state
    gestureState,
    
    // Deep linking
    pendingDeepLink,
    processDeepLink,
    clearPendingDeepLink: () => setPendingDeepLink(null),
    
    // Pull to refresh
    pullToRefreshEnabled,
    setPullToRefreshEnabled
  };
  
  return (
    <MobileContext.Provider value={contextValue}>
      {children}
    </MobileContext.Provider>
  );
};

// Custom hook for using the mobile context
export const useMobile = () => {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context;
};

export default MobileContext;