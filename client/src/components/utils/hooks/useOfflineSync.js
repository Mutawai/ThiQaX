// src/components/utils/hooks/useOfflineSync.js
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

/**
 * Custom hook for managing offline data synchronization
 * @param {string} entityType - Type of entity to sync (e.g., 'messages', 'documents')
 * @returns {Object} Offline sync utilities
 */
const useOfflineSync = (entityType) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncQueue, setSyncQueue] = useState([]);
  const [error, setError] = useState(null);
  
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  
  // Setup local storage key for this entity type
  const queueStorageKey = `thiqax_offline_${entityType}_queue`;
  
  // Load queue from local storage on mount
  useEffect(() => {
    try {
      const storedQueue = localStorage.getItem(queueStorageKey);
      if (storedQueue) {
        setSyncQueue(JSON.parse(storedQueue));
      }
    } catch (err) {
      console.error('Failed to load offline queue from storage:', err);
    }
  }, [queueStorageKey]);
  
  // Save queue to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(queueStorageKey, JSON.stringify(syncQueue));
    } catch (err) {
      console.error('Failed to save offline queue to storage:', err);
    }
  }, [syncQueue, queueStorageKey]);
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Add an item to the sync queue
  const queueForSync = useCallback((action, data) => {
    const queueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
      attempts: 0,
      entityType
    };
    
    setSyncQueue(prevQueue => [...prevQueue, queueItem]);
    return queueItem.id;
  }, [entityType]);
  
  // Remove an item from the sync queue
  const removeFromQueue = useCallback((itemId) => {
    setSyncQueue(prevQueue => prevQueue.filter(item => item.id !== itemId));
  }, []);
  
  // Update an item in the sync queue
  const updateQueueItem = useCallback((itemId, updates) => {
    setSyncQueue(prevQueue => 
      prevQueue.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  }, []);
  
  // Process the sync queue when online
  const processQueue = useCallback(async () => {
    if (!isOnline || isSyncing || syncQueue.length === 0 || !token) {
      return;
    }
    
    setIsSyncing(true);
    setError(null);
    
    // Process each item in queue
    const processItem = async (item) => {
      try {
        let actionCreator;
        
        // Import the appropriate action creator based on entity type and action
        switch (entityType) {
          case 'messages':
            if (item.action === 'send') {
              const { sendMessage } = require('../../../redux/actions/messageActions');
              actionCreator = sendMessage;
            } else if (item.action === 'delete') {
              const { deleteMessage } = require('../../../redux/actions/messageActions');
              actionCreator = deleteMessage;
            }
            break;
          case 'documents':
            if (item.action === 'upload') {
              const { uploadDocument } = require('../../../redux/actions/documentActions');
              actionCreator = uploadDocument;
            } else if (item.action === 'update') {
              const { updateDocumentStatus } = require('../../../redux/actions/documentActions');
              actionCreator = updateDocumentStatus;
            }
            break;
          case 'applications':
            if (item.action === 'submit') {
              const { submitApplication } = require('../../../redux/actions/applicationActions');
              actionCreator = submitApplication;
            } else if (item.action === 'withdraw') {
              const { withdrawApplication } = require('../../../redux/actions/applicationActions');
              actionCreator = withdrawApplication;
            }
            break;
          default:
            throw new Error(`Unknown entity type: ${entityType}`);
        }
        
        if (!actionCreator) {
          throw new Error(`No action creator found for ${entityType}/${item.action}`);
        }
        
        // Dispatch the action
        await dispatch(actionCreator(...item.data));
        
        // Remove from queue if successful
        removeFromQueue(item.id);
        
      } catch (err) {
        console.error(`Failed to process offline queue item (${item.id}):`, err);
        
        // Increment attempts and update timestamp
        updateQueueItem(item.id, {
          attempts: item.attempts + 1,
          lastAttempt: Date.now(),
          error: err.message
        });
        
        // Remove items that have failed too many times (5 attempts)
        if (item.attempts >= 4) {
          removeFromQueue(item.id);
        }
        
        // Set overall error
        setError(`Failed to sync some items: ${err.message}`);
      }
    };
    
    // Process all items in queue with a small delay between each
    for (const item of syncQueue) {
      await processItem(item);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
    
    setIsSyncing(false);
  }, [isOnline, isSyncing, syncQueue, token, entityType, dispatch, removeFromQueue, updateQueueItem]);
  
  // Try to process queue when coming back online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      processQueue();
    }
  }, [isOnline, syncQueue.length, processQueue]);
  
  // Add a message to the queue when offline
  const syncAction = useCallback((action, ...args) => {
    if (!isOnline) {
      return queueForSync(action, args);
    }
    
    // If online, perform the action immediately
    try {
      let actionCreator;
      
      switch (entityType) {
        case 'messages':
          if (action === 'send') {
            const { sendMessage } = require('../../../redux/actions/messageActions');
            actionCreator = sendMessage;
          } else if (action === 'delete') {
            const { deleteMessage } = require('../../../redux/actions/messageActions');
            actionCreator = deleteMessage;
          }
          break;
        case 'documents':
          if (action === 'upload') {
            const { uploadDocument } = require('../../../redux/actions/documentActions');
            actionCreator = uploadDocument;
          } else if (action === 'update') {
            const { updateDocumentStatus } = require('../../../redux/actions/documentActions');
            actionCreator = updateDocumentStatus;
          }
          break;
        case 'applications':
          if (action === 'submit') {
            const { submitApplication } = require('../../../redux/actions/applicationActions');
            actionCreator = submitApplication;
          } else if (action === 'withdraw') {
            const { withdrawApplication } = require('../../../redux/actions/applicationActions');
            actionCreator = withdrawApplication;
          }
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }
      
      if (!actionCreator) {
        throw new Error(`No action creator found for ${entityType}/${action}`);
      }
      
      // Dispatch the action
      return dispatch(actionCreator(...args));
    } catch (err) {
      setError(err.message);
      
      // If there's an error while online, queue it anyway as a fallback
      return queueForSync(action, args);
    }
  }, [isOnline, entityType, dispatch, queueForSync]);
  
  // Clear the entire queue
  const clearQueue = useCallback(() => {
    setSyncQueue([]);
  }, []);
  
  return {
    isOnline,
    isSyncing,
    syncQueue,
    queueForSync,
    removeFromQueue,
    processQueue,
    syncAction,
    clearQueue,
    error
  };
};

export default useOfflineSync;