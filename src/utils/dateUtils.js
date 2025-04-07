// src/utils/dateUtils.js

/**
 * Formats a date string to a readable format
 * @param {string|Date} dateString - The date string or Date object to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
};

/**
 * Formats a date string to include time
 * @param {string|Date} dateString - The date string or Date object to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Calculates the difference in days between two dates
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date (defaults to current date)
 * @returns {number} Number of days difference
 */
export const getDaysDifference = (date1, date2 = new Date()) => {
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  
  if (isNaN(firstDate.getTime()) || isNaN(secondDate.getTime())) {
    return null;
  }
  
  // Convert to UTC to avoid timezone issues
  const utc1 = Date.UTC(
    firstDate.getFullYear(),
    firstDate.getMonth(),
    firstDate.getDate()
  );
  
  const utc2 = Date.UTC(
    secondDate.getFullYear(),
    secondDate.getMonth(),
    secondDate.getDate()
  );
  
  // Calculate difference in days
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

/**
 * Checks if a date is in the past
 * @param {string|Date} dateString - The date to check
 * @returns {boolean} True if date is in the past
 */
export const isDatePast = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  
  if (isNaN(date.getTime())) return false;
  
  // Set both dates to start of day to compare just the date portion
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  return compareDate < today;
};

/**
 * Checks if a date is within the specified number of days from now
 * @param {string|Date} dateString - The date to check
 * @param {number} days - Number of days
 * @returns {boolean} True if date is within the specified days
 */
export const isDateWithinDays = (dateString, days) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  
  if (isNaN(date.getTime())) return false;
  
  const daysDifference = getDaysDifference(today, date);
  
  return daysDifference >= 0 && daysDifference <= days;
};

/**
 * Returns a formatted relative time string (e.g., "2 days ago", "in 3 months")
 * @param {string|Date} dateString - The date to format
 * @returns {string} Relative time string
 */
export const getRelativeTimeString = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // For future dates
  if (diffInSeconds < 0) {
    const absDiff = Math.abs(diffInSeconds);
    
    if (absDiff < 60) return 'in a few seconds';
    if (absDiff < 3600) return `in ${Math.floor(absDiff / 60)} minutes`;
    if (absDiff < 86400) return `in ${Math.floor(absDiff / 3600)} hours`;
    if (absDiff < 2592000) return `in ${Math.floor(absDiff / 86400)} days`;
    if (absDiff < 31536000) return `in ${Math.floor(absDiff / 2592000)} months`;
    return `in ${Math.floor(absDiff / 31536000)} years`;
  }
  
  // For past dates
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};
