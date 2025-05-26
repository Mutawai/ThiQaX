// client/src/components/integration/DocumentExpirationMonitor/DocumentExpirationMonitor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import integrationService from '../../../services/integrationService';
import documentService from '../../../services/documentService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import Button from '../../common/Button/Button';
import { 
  ExclamationTriangleIcon, 
  ClockIcon,
  DocumentIcon,
  BellIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import styles from './DocumentExpirationMonitor.module.css';

/**
 * DocumentExpirationMonitor Component
 * Tracks document expiration dates and provides renewal warnings
 */
const DocumentExpirationMonitor = ({ 
  userId,
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes
  showActions = true,
  compact = false,
  onExpirationFound
}) => {
  const { user } = useSelector(state => state.auth);
  const [documents, setDocuments] = useState([]);
  const [expiringDocuments, setExpiringDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const targetUserId = userId || user.id;

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await documentService.getUserDocuments(targetUserId);
      const docs = response.data || [];
      
      setDocuments(docs);
      analyzeExpirations(docs);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  const analyzeExpirations = (docs) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysFromNow = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));

    const expiring = docs.filter(doc => {
      if (!doc.expiryDate) return false;
      const expiryDate = new Date(doc.expiryDate);
      return expiryDate <= sixtyDaysFromNow;
    }).map(doc => {
      const expiryDate = new Date(doc.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      let urgency = 'low';
      if (daysUntilExpiry <= 0) urgency = 'expired';
      else if (daysUntilExpiry <= 7) urgency = 'critical';
      else if (daysUntilExpiry <= 30) urgency = 'high';
      else if (daysUntilExpiry <= 60) urgency = 'medium';

      return {
        ...doc,
        daysUntilExpiry,
        urgency,
        isExpired: daysUntilExpiry <= 0
      };
    }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    setExpiringDocuments(expiring);
    
    if (expiring.length > 0 && onExpirationFound) {
      onExpirationFound(expiring);
    }
  };

  const checkExpirations = async () => {
    setIsChecking(true);
    try {
      const response = await integrationService.checkDocumentExpirations();
      const { checked, notified } = response.data;
      
      setNotifications(prev => [
        ...prev,
        {
          id: Date.now(),
          message: `Checked ${checked} documents, sent ${notified} notifications`,
          timestamp: new Date(),
          type: 'info'
        }
      ]);

      toast.success(`Expiration check complete: ${notified} notifications sent`);
      
      // Refresh document list
      await loadDocuments();
    } catch (error) {
      console.error('Failed to check expirations:', error);
      toast.error('Failed to check document expirations');
    } finally {
      setIsChecking(false);
    }
  };

  const getUrgencyClass = (urgency) => {
    return styles[`urgency${urgency.charAt(0).toUpperCase() + urgency.slice(1)}`] || styles.urgencyLow;
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'expired':
      case 'critical':
        return <ExclamationTriangleIcon className={styles.urgencyIcon} />;
      case 'high':
        return <ClockIcon className={styles.urgencyIcon} />;
      case 'medium':
        return <BellIcon className={styles.urgencyIcon} />;
      default:
        return <DocumentIcon className={styles.urgencyIcon} />;
    }
  };

  const formatExpiryMessage = (doc) => {
    if (doc.isExpired) {
      return `Expired ${Math.abs(doc.daysUntilExpiry)} day(s) ago`;
    }
    return `Expires in ${doc.daysUntilExpiry} day(s)`;
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(loadDocuments, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadDocuments]);

  if (isLoading) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <LoadingSpinner size="small" />
        <span className={styles.loadingText}>Checking document expirations...</span>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>Document Expiration Monitor</h3>
          {expiringDocuments.length > 0 && (
            <div className={styles.alertBadge}>
              <ExclamationTriangleIcon className={styles.alertIcon} />
              <span>{expiringDocuments.length} document(s) need attention</span>
            </div>
          )}
        </div>

        <div className={styles.statusInfo}>
          <span className={styles.lastChecked}>
            Last checked: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
          </span>
          {showActions && (
            <Button
              variant="outline"
              size="small"
              onClick={checkExpirations}
              disabled={isChecking}
              loading={isChecking}
            >
              {isChecking ? 'Checking...' : 'Check Now'}
            </Button>
          )}
        </div>
      </div>

      {notifications.length > 0 && (
        <div className={styles.notifications}>
          {notifications.map(notification => (
            <div key={notification.id} className={styles.notification}>
              <CheckCircleIcon className={styles.notificationIcon} />
              <span className={styles.notificationMessage}>{notification.message}</span>
              <button 
                className={styles.dismissButton}
                onClick={() => dismissNotification(notification.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {expiringDocuments.length === 0 ? (
        <div className={styles.goodNews}>
          <CheckCircleIcon className={styles.goodNewsIcon} />
          <div className={styles.goodNewsContent}>
            <h4>All documents are up to date</h4>
            <p>No documents are expiring in the next 60 days.</p>
            <span className={styles.totalDocs}>
              Monitoring {documents.length} document(s)
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.expiringDocuments}>
          {expiringDocuments.map(doc => (
            <div 
              key={doc._id} 
              className={`${styles.documentCard} ${getUrgencyClass(doc.urgency)}`}
            >
              <div className={styles.documentHeader}>
                <div className={styles.documentInfo}>
                  {getUrgencyIcon(doc.urgency)}
                  <div>
                    <h4 className={styles.documentTitle}>{doc.title}</h4>
                    <span className={styles.documentType}>{doc.type}</span>
                  </div>
                </div>
                <div className={styles.expiryInfo}>
                  <span className={styles.expiryMessage}>
                    {formatExpiryMessage(doc)}
                  </span>
                  <span className={styles.expiryDate}>
                    {new Date(doc.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {doc.description && (
                <p className={styles.documentDescription}>{doc.description}</p>
              )}

              <div className={styles.documentActions}>
                <span className={styles.actionHint}>
                  {doc.urgency === 'expired' ? 'Renewal required' : 
                   doc.urgency === 'critical' ? 'Urgent renewal needed' :
                   'Consider renewing soon'}
                </span>
                
                {showActions && (
                  <div className={styles.actionButtons}>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                    >
                      View Document
                    </Button>
                    <Button
                      variant={doc.urgency === 'expired' || doc.urgency === 'critical' ? 'primary' : 'outline'}
                      size="small"
                      onClick={() => {
                        // Navigate to document upload/renewal page
                        // This would be implemented based on your routing setup
                        toast.info('Navigate to document renewal page');
                      }}
                    >
                      {doc.isExpired ? 'Replace' : 'Renew'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.summary}>
        <div className={styles.summaryStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{documents.length}</span>
            <span className={styles.statLabel}>Total Documents</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{expiringDocuments.filter(d => !d.isExpired).length}</span>
            <span className={styles.statLabel}>Expiring Soon</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{expiringDocuments.filter(d => d.isExpired).length}</span>
            <span className={styles.statLabel}>Expired</span>
          </div>
        </div>
        
        {autoRefresh && (
          <div className={styles.autoRefreshInfo}>
            <span>Auto-refresh every {Math.round(refreshInterval / 60000)} minutes</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentExpirationMonitor;