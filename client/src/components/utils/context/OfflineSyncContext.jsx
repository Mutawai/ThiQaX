// src/components/utils/context/OfflineSyncContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import config from '../../../config';

// Create the context
const OfflineSyncContext = createContext();

/**
 * Offline Sync Provider Component
 * Provides global offline synchronization functionality
 */
export const OfflineSyncProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [globalSyncQueue, setGlobalSyncQueue] = useState([]);
  const [entityQueues, setEntityQueues] = useState({});
  const [error, setError] = useState(null);
  const [lastSyncAttempt, setLastSyncAttempt] = useState(null);
  const [syncStats, setSyncStats] = useState({
    totalPending: 0,
    totalCompleted: 0,
    totalFailed: 0,
    lastSyncTime: null
  });
  
  const { token } = useSelector(state => state.auth);
  const syncInProgress = useRef(false);
  
  // Storage key for global sync queue
  const STORAGE_KEY = 'thiqax_offline_sync_queue';
  
  // Load queue from local storage on mount
  useEffect(() => {
    try {
      const storedQueue = localStorage.getItem(STORAGE_KEY);
      if (storedQueue) {
        const parsedQueue = JSON.parse(storedQueue);
        setGlobalSyncQueue(parsedQueue);
        
        // Organize queue items by entity type
        const entityMap = {};
        parsedQueue.forEach(item => {
          if (!entityMap[item.entityType]) {
            entityMap[item.entityType] = [];
          }
          entityMap[item.entityType].push(item);
        });
        
        setEntityQueues(entityMap);
        
        // Update stats
        setSyncStats(prev => ({
          ...prev,
          totalPending: parsedQueue.length
        }));
      }
    } catch (err) {
      console.error('Failed to load offline queue from storage:', err);
    }
  }, []);
  
  // Save queue to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalSyncQueue));
      
      // Update stats
      setSyncStats(prev => ({
        ...prev,
        totalPending: globalSyncQueue.length
      }));
      
      // Organize queue items by entity type
      const entityMap = {};
      globalSyncQueue.forEach(item => {
        if (!entityMap[item.entityType]) {
          entityMap[item.entityType] = [];
        }
        entityMap[item.entityType].push(item);
      });
      
      setEntityQueues(entityMap);
    } catch (err) {
      console.error('Failed to save offline queue to storage:', err);
    }
  }, [globalSyncQueue]);
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Attempt to sync when coming back online
      processGlobalQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      // Stop any active syncing
      syncInProgress.current = false;
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Add an item to the global sync queue
  const addToQueue = useCallback((entityType, action, data, priority = 'normal') => {
    const queueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityType,
      action,
      data,
      timestamp: Date.now(),
      attempts: 0,
      priority: priority, // 'high', 'normal', 'low'
      status: 'pending'
    };
    
    setGlobalSyncQueue(prev => {
      // Sort by priority and timestamp
      const newQueue = [...prev, queueItem].sort((a, b) => {
        // First sort by priority
        const priorityMap = { high: 0, normal: 1, low: 2 };
        const priorityDiff = priorityMap[a.priority] - priorityMap[b.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by timestamp (older first)
        return a.timestamp - b.timestamp;
      });
      
      return newQueue;
    });
    
    return queueItem.id;
  }, []);
  
  // Remove an item from the global sync queue
  const removeFromQueue = useCallback((itemId) => {
    setGlobalSyncQueue(prev => prev.filter(item => item.id !== itemId));
  }, []);
  
  // Update an item in the global sync queue
  const updateQueueItem = useCallback((itemId, updates) => {
    setGlobalSyncQueue(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  }, []);
  
  // Process the entire global sync queue
  const processGlobalQueue = useCallback(async (force = false) => {
    // Prevent multiple sync operations running concurrently
    if (syncInProgress.current && !force) return;
    if (!isOnline || !token) return;
    
    // Nothing to process
    if (globalSyncQueue.length === 0) return;
    
    syncInProgress.current = true;
    setIsSyncing(true);
    setError(null);
    setLastSyncAttempt(new Date());
    
    let completedCount = 0;
    let failedCount = 0;
    
    // Process queue items sequentially
    for (const item of globalSyncQueue) {
      try {
        // Update item status
        updateQueueItem(item.id, { status: 'processing' });
        
        // Get the appropriate action based on entity type and action
        await processQueueItem(item);
        
        // Successfully processed
        removeFromQueue(item.id);
        completedCount++;
      } catch (err) {
        console.error(`Failed to process queue item (${item.id}):`, err);
        
        // Increment attempts and update status
        updateQueueItem(item.id, {
          attempts: item.attempts + 1,
          lastAttempt: Date.now(),
          error: err.message,
          status: 'failed'
        });
        
        // Remove items that have failed too many times (5 attempts)
        if (item.attempts >= 4) {
          removeFromQueue(item.id);
        }
        
        failedCount++;
      }
    }
    
    // Update sync stats
    setSyncStats(prev => ({
      ...prev,
      totalCompleted: prev.totalCompleted + completedCount,
      totalFailed: prev.totalFailed + failedCount,
      lastSyncTime: new Date()
    }));
    
    // If there are still items in the queue, they are failed items
    if (globalSyncQueue.length > 0) {
      setError('Some items failed to sync. They will be retried automatically.');
    }
    
    syncInProgress.current = false;
    setIsSyncing(false);
  }, [isOnline, token, globalSyncQueue, updateQueueItem, removeFromQueue]);
  
  // Process a single queue item
  const processQueueItem = useCallback(async (item) => {
    const { entityType, action, data } = item;
    
    // Import the appropriate action creator based on entity type and action
    let actionCreator;
    let actionModule;
    
    switch (entityType) {
      case 'messages':
        actionModule = await import('../../../redux/actions/messageActions');
        actionCreator = action === 'send' ? actionModule.sendMessage : 
                        action === 'delete' ? actionModule.deleteMessage : null;
        break;
      case 'documents':
        actionModule = await import('../../../redux/actions/documentActions');
        actionCreator = action === 'upload' ? actionModule.uploadDocument : 
                        action === 'update' ? actionModule.updateDocumentStatus : null;
        break;
      case 'applications':
        actionModule = await import('../../../redux/actions/applicationActions');
        actionCreator = action === 'submit' ? actionModule.submitApplication : 
                        action === 'withdraw' ? actionModule.withdrawApplication : null;
        break;
      case 'profile':
        actionModule = await import('../../../redux/actions/profileActions');
        actionCreator = action === 'update' ? actionModule.updateProfile : null;
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    if (!actionCreator) {
      throw new Error(`No action creator found for ${entityType}/${action}`);
    }
    
    // For FormData objects, we need to reconstruct them
    let processedData = data;
    if (typeof data === 'object' && data._isFormData) {
      const formData = new FormData();
      for (const key in data.pairs) {
        formData.append(key, data.pairs[key]);
      }
      processedData = formData;
    }
    
    // Execute the action directly using axios
    const response = await actionCreator(...processedData);
    return response;
  }, []);
  
  // Register an entity-specific queue with the global sync system
  const registerEntityQueue = useCallback((entityType, queueItems) => {
    if (!queueItems || queueItems.length === 0) return;
    
    // Add all items to the global queue
    queueItems.forEach(item => {
      addToQueue(entityType, item.action, item.data, item.priority || 'normal');
    });
  }, [addToQueue]);
  
  // Sync a specific action, either immediately or queue for later
  const syncAction = useCallback((entityType, action, data, priority = 'normal') => {
    if (!isOnline) {
      // Queue for later
      return addToQueue(entityType, action, data, priority);
    }
    
    // If online, attempt immediate sync
    return processQueueItem({ entityType, action, data });
  }, [isOnline, addToQueue, processQueueItem]);
  
  // Get pending items for a specific entity type
  const getPendingItems = useCallback((entityType) => {
    return entityQueues[entityType] || [];
  }, [entityQueues]);
  
  // Check if there are pending items for a specific entity type
  const hasPendingItems = useCallback((entityType) => {
    return (entityQueues[entityType]?.length || 0) > 0;
  }, [entityQueues]);
  
  // Clear items for a specific entity type
  const clearEntityQueue = useCallback((entityType) => {
    setGlobalSyncQueue(prev => prev.filter(item => item.entityType !== entityType));
  }, []);
  
  // Clear the entire queue
  const clearAllQueues = useCallback(() => {
    setGlobalSyncQueue([]);
    setEntityQueues({});
    
    // Update stats
    setSyncStats(prev => ({
      ...prev,
      totalPending: 0
    }));
  }, []);
  
  // Context value
  const contextValue = {
    isOnline,
    isSyncing,
    globalSyncQueue,
    entityQueues,
    syncStats,
    error,
    lastSyncAttempt,
    addToQueue,
    removeFromQueue,
    updateQueueItem,
    processGlobalQueue,
    registerEntityQueue,
    syncAction,
    getPendingItems,
    hasPendingItems,
    clearEntityQueue,
    clearAllQueues
  };
  
  return (
    <OfflineSyncContext.Provider value={contextValue}>
      {children}
    </OfflineSyncContext.Provider>
  );
};

// Custom hook for using the offline sync context
export const useOfflineSyncContext = () => {
  const context = useContext(OfflineSyncContext);
  if (context === undefined) {
    throw new Error('useOfflineSyncContext must be used within an OfflineSyncProvider');
  }
  return context;
};

export default OfflineSyncContext;