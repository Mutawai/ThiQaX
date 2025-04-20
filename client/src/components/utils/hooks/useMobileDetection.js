// src/components/utils/hooks/useMobileDetection.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for detecting mobile devices and responsive behaviors
 * @returns {Object} Mobile detection utilities
 */
const useMobileDetection = () => {
  // Breakpoints aligned with Tailwind's default breakpoints
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };
  
  // Initial detection of mobile device via user agent
  const detectMobileUserAgent = () => {
    if (typeof window === 'undefined' || !window.navigator) return false;
    
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Regular expression for mobile devices (phones and tablets)
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
    
    return mobileRegex.test(userAgent.toLowerCase());
  };
  
  // Initial detection based on screen size
  const detectMobileScreenSize = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoints.md;
  };
  
  // Combine user agent and screen size detection for better accuracy
  const detectMobile = () => {
    const isMobileUserAgent = detectMobileUserAgent();
    const isMobileScreenSize = detectMobileScreenSize();
    
    // Detect iOS devices specifically
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Determine touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return {
      isMobile: isMobileUserAgent || isMobileScreenSize,
      isMobileUserAgent,
      isMobileScreenSize,
      isIOS,
      hasTouch
    };
  };
  
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isMobileUserAgent: false,
    isMobileScreenSize: false,
    isIOS: false,
    hasTouch: false,
    orientation: 'portrait',
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    breakpoint: 'lg'
  });
  
  // Get current breakpoint based on screen width
  const getCurrentBreakpoint = useCallback((width) => {
    if (width < breakpoints.sm) return 'xs';
    if (width < breakpoints.md) return 'sm';
    if (width < breakpoints.lg) return 'md';
    if (width < breakpoints.xl) return 'lg';
    if (width < breakpoints['2xl']) return 'xl';
    return '2xl';
  }, []);
  
  // Update device info on resize
  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    const currentBreakpoint = getCurrentBreakpoint(width);
    
    const {
      isMobile,
      isMobileUserAgent,
      isMobileScreenSize,
      isIOS,
      hasTouch
    } = detectMobile();
    
    setDeviceInfo({
      isMobile,
      isMobileUserAgent,
      isMobileScreenSize,
      isIOS,
      hasTouch,
      orientation,
      screenWidth: width,
      screenHeight: height,
      breakpoint: currentBreakpoint
    });
  }, [getCurrentBreakpoint]);
  
  // Initialize on mount and add event listeners
  useEffect(() => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') return;
    
    // Initial detection
    handleResize();
    
    // Listen for resize and orientation change events
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);
  
  // Helper to check if width is below a specific breakpoint
  const isBelow = useCallback((breakpoint) => {
    const breakpointValue = breakpoints[breakpoint];
    if (!breakpointValue) return false;
    return deviceInfo.screenWidth < breakpointValue;
  }, [deviceInfo.screenWidth]);
  
  // Helper to check if width is above a specific breakpoint
  const isAbove = useCallback((breakpoint) => {
    const breakpointValue = breakpoints[breakpoint];
    if (!breakpointValue) return false;
    return deviceInfo.screenWidth >= breakpointValue;
  }, [deviceInfo.screenWidth]);
  
  // Helper to check if width is between two breakpoints
  const isBetween = useCallback((minBreakpoint, maxBreakpoint) => {
    const minValue = breakpoints[minBreakpoint];
    const maxValue = breakpoints[maxBreakpoint];
    
    if (!minValue || !maxValue) return false;
    
    return deviceInfo.screenWidth >= minValue && deviceInfo.screenWidth < maxValue;
  }, [deviceInfo.screenWidth]);
  
  return {
    ...deviceInfo,
    isBelow,
    isAbove,
    isBetween,
    breakpoints
  };
};

export default useMobileDetection;