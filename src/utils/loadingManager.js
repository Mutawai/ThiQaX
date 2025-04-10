// src/utils/loadingManager.js

/**
 * ThiQaX Loading Manager
 * 
 * A global loading state manager that provides consistent loading behavior
 * across the application. Includes support for progress tracking, concurrent 
 * loading operations, and error handling.
 */

class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
    this.listeners = new Set();
    this.globalLoading = false;
    this.errorState = null;
  }

  /**
   * Start a loading operation with a unique key
   * @param {string} key - Unique identifier for this loading operation
   * @param {Object} options - Configuration options
   * @param {boolean} options.global - Whether this operation should trigger global loading state
   * @param {number} options.timeout - Auto-cancel after timeout (ms)
   * @param {string} options.message - Loading message to display
   * @returns {Function} Function to update progress
   */
  startLoading(key, options = {}) {
    const { global = false, timeout = 0, message = "Loading..." } = options;
    
    // Create loading state object
    const loadingState = {
      key,
      inProgress: true,
      progress: 0,
      global,
      message,
      startTime: Date.now(),
      updateTime: Date.now()
    };
    
    // Store in map
    this.loadingStates.set(key, loadingState);
    
    // Update global state if needed
    if (global) {
      this.globalLoading = true;
    }
    
    // Notify listeners
    this._notifyListeners();
    
    // Set timeout if specified
    if (timeout > 0) {
      setTimeout(() => {
        this.endLoading(key, { error: "Operation timed out" });
      }, timeout);
    }
    
    // Return progress updater function
    return (progress) => {
      this.updateProgress(key, progress);
    };
  }
  
  /**
   * Update progress for a loading operation
   * @param {string} key - Loading operation identifier
   * @param {number} progress - Progress value (0-100)
   */
  updateProgress(key, progress) {
    const loadingState = this.loadingStates.get(key);
    
    if (!loadingState) {
      console.warn(`Attempted to update progress for unknown loading operation: ${key}`);
      return;
    }
    
    // Update progress and timestamp
    loadingState.progress = Math.min(Math.max(0, progress), 100);
    loadingState.updateTime = Date.now();
    
    // Notify listeners
    this._notifyListeners();
  }
  
  /**
   * End a loading operation
   * @param {string} key - Loading operation identifier
   * @param {Object} options - End options
   * @param {Error|string} options.error - Error if operation failed
   */
  endLoading(key, options = {}) {
    const { error = null } = options;
    const loadingState = this.loadingStates.get(key);
    
    if (!loadingState) {
      console.warn(`Attempted to end unknown loading operation: ${key}`);
      return;
    }
    
    // Set error if provided
    if (error) {
      this.errorState = {
        key,
        error: typeof error === 'string' ? new Error(error) : error,
        time: Date.now()
      };
    }
    
    // Remove from map
    this.loadingStates.delete(key);
    
    // Update global state
    this._recalculateGlobalState();
    
    // Notify listeners
    this._notifyListeners();
  }
  
  /**
   * Register a listener for loading state changes
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    
    // Immediately call with current state
    listener(this.getState());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Get the current loading state
   * @returns {Object} Current loading state
   */
  getState() {
    return {
      isLoading: this.globalLoading,
      operations: Array.from(this.loadingStates.values()),
      error: this.errorState,
      activeCount: this.loadingStates.size
    };
  }
  
  /**
   * Check if any loading operations are in progress
   * @param {string} [key] - Optional specific key to check
   * @returns {boolean} Whether loading is in progress
   */
  isLoading(key) {
    if (key) {
      return this.loadingStates.has(key);
    }
    return this.globalLoading;
  }
  
  /**
   * Clear all loading states (emergency reset)
   */
  reset() {
    this.loadingStates.clear();
    this.globalLoading = false;
    this.errorState = null;
    this._notifyListeners();
  }
  
  /**
   * Get a batch loading handler for multiple concurrent operations
   * @param {string} groupKey - Key prefix for the batch operations
   * @param {Object} options - Batch options
   * @returns {Object} Batch loading handler
   */
  createBatch(groupKey, options = {}) {
    const operations = new Set();
    const batchKey = `batch_${groupKey}_${Date.now()}`;
    
    return {
      // Start a sub-operation in this batch
      start: (operationKey, subOptions = {}) => {
        const key = `${batchKey}_${operationKey}`;
        operations.add(key);
        return this.startLoading(key, { ...options, ...subOptions, global: false });
      },
      
      // End a sub-operation
      end: (operationKey, subOptions = {}) => {
        const key = `${batchKey}_${operationKey}`;
        operations.delete(key);
        this.endLoading(key, subOptions);
        
        // If all operations are done, end the batch
        if (operations.size === 0) {
          this.endLoading(batchKey, subOptions);
        }
      },
      
      // Start the overall batch (displayed to user)
      startBatch: () => {
        return this.startLoading(batchKey, { ...options, global: true });
      },
      
      // End the entire batch
      endBatch: (batchOptions = {}) => {
        // End all sub-operations
        operations.forEach(key => {
          this.endLoading(key, batchOptions);
        });
        operations.clear();
        
        // End the batch
        this.endLoading(batchKey, batchOptions);
      }
    };
  }
  
  // Private methods
  
  /**
   * Recalculate the global loading state
   * @private
   */
  _recalculateGlobalState() {
    // Check if any operations marked as global are still in progress
    for (const [_, state] of this.loadingStates) {
      if (state.global) {
        this.globalLoading = true;
        return;
      }
    }
    
    // If we get here, no global operations are in progress
    this.globalLoading = false;
  }
  
  /**
   * Notify all listeners of state changes
   * @private
   */
  _notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in loading state listener:', error);
      }
    });
  }
}

// Create singleton instance
const loadingManager = new LoadingManager();

export default loadingManager;

// Usage examples:

/**
 * Example 1: Basic usage in API service
 */
// src/services/api.js
import axios from 'axios';
import loadingManager from '../utils/loadingManager';

const API_URL = process.env.REACT_APP_API_URL || 'https://api.thiqax.com';

export const fetchJobs = async (filters = {}) => {
  // Start loading operation
  const updateProgress = loadingManager.startLoading('fetch_jobs', {
    global: true,
    message: 'Loading jobs...'
  });
  
  try {
    // Simulate progress updates (in real app would come from actual progress events)
    updateProgress(25);
    
    const response = await axios.get(`${API_URL}/api/jobs`, { params: filters });
    
    updateProgress(100);
    loadingManager.endLoading('fetch_jobs');
    
    return response.data.jobs;
  } catch (error) {
    loadingManager.endLoading('fetch_jobs', { error });
    throw error;
  }
};

/**
 * Example 2: File upload with progress tracking
 */
// src/services/documentService.js
import axios from 'axios';
import loadingManager from '../utils/loadingManager';

export const uploadDocument = async (file, metadata = {}) => {
  // Start loading operation
  const updateProgress = loadingManager.startLoading('upload_document', {
    global: true,
    message: 'Uploading document...',
    timeout: 120000 // 2 minutes timeout
  });
  
  const formData = new FormData();
  formData.append('file', file);
  
  // Add any metadata
  Object.keys(metadata).forEach(key => {
    formData.append(key, metadata[key]);
  });
  
  try {
    const response = await axios.post('/api/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        updateProgress(progress);
      }
    });
    
    loadingManager.endLoading('upload_document');
    return response.data;
  } catch (error) {
    loadingManager.endLoading('upload_document', { error });
    throw error;
  }
};

/**
 * Example 3: Using batch operations for complex workflows
 */
// src/services/applicationService.js
import axios from 'axios';
import loadingManager from '../utils/loadingManager';

export const submitJobApplication = async (jobId, application, documents) => {
  // Create batch for the whole application process
  const batch = loadingManager.createBatch('job_application', {
    message: 'Submitting application...'
  });
  
  // Start the overall batch
  batch.startBatch();
  
  try {
    // Step 1: Upload documents
    const documentsProgress = batch.start('documents', { 
      message: 'Uploading documents...' 
    });
    
    const documentIds = [];
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      documentsProgress((i / documents.length) * 100);
      
      const docResponse = await axios.post('/api/documents', document);
      documentIds.push(docResponse.data.document._id);
    }
    
    batch.end('documents');
    
    // Step 2: Create application
    const applicationProgress = batch.start('application', { 
      message: 'Creating application...' 
    });
    
    applicationProgress(50);
    
    const applicationResponse = await axios.post('/api/applications', {
      jobId,
      ...application,
      documents: documentIds
    });
    
    applicationProgress(100);
    batch.end('application');
    
    // Step 3: Send notifications
    const notifyProgress = batch.start('notifications', {
      message: 'Sending notifications...'
    });
    
    await axios.post('/api/notifications/application', {
      applicationId: applicationResponse.data.application._id
    });
    
    notifyProgress(100);
    batch.end('notifications');
    
    // End the batch successfully
    batch.endBatch();
    
    return applicationResponse.data;
  } catch (error) {
    // End batch with error
    batch.endBatch({ error });
    throw error;
  }
};

/**
 * Example 4: React hook for using the loading manager in components
 */
// src/hooks/useLoading.js
import { useState, useEffect } from 'react';
import loadingManager from '../utils/loadingManager';

export const useLoading = (key) => {
  const [loadingState, setLoadingState] = useState(loadingManager.getState());
  
  useEffect(() => {
    // Subscribe to loading state changes
    const unsubscribe = loadingManager.subscribe(setLoadingState);
    
    // Cleanup
    return unsubscribe;
  }, []);
  
  // If a specific key is provided, check that operation
  if (key) {
    const isLoading = loadingManager.isLoading(key);
    const operation = loadingState.operations.find(op => op.key === key);
    
    return {
      isLoading,
      progress: operation?.progress || 0,
      message: operation?.message || loadingState.operations[0]?.message || 'Loading...',
      error: loadingState.error?.key === key ? loadingState.error.error : null
    };
  }
  
  // Otherwise return the global state
  return {
    isLoading: loadingState.isLoading,
    progress: loadingState.operations[0]?.progress || 0,
    message: loadingState.operations[0]?.message || 'Loading...',
    operations: loadingState.operations,
    activeCount: loadingState.activeCount,
    error: loadingState.error?.error
  };
};

/**
 * Example 5: Loading component that uses the loading manager
 */
// src/components/common/GlobalLoader.js
import React from 'react';
import { useLoading } from '../../hooks/useLoading';

const GlobalLoader = () => {
  const { isLoading, message, progress } = useLoading();
  
  if (!isLoading) {
    return null;
  }
  
  return (
    <div className="global-loader">
      <div className="loader-overlay"></div>
      <div className="loader-content">
        <div className="spinner"></div>
        <p className="loader-message">{message}</p>
        {progress > 0 && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalLoader;
