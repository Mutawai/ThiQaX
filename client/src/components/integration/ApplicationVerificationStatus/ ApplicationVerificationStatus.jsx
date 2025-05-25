// client/src/components/integration/ApplicationVerificationStatus/ApplicationVerificationStatus.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import integrationService from '../../../services/integrationService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import Button from '../../common/Button/Button';
import { CheckCircleIcon, ClockIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import styles from './ApplicationVerificationStatus.module.css';

/**
 * ApplicationVerificationStatus Component
 * Displays real-time verification status of application documents
 */
const ApplicationVerificationStatus = ({ 
  applicationId, 
  documents = [],
  allowStatusUpdate = false,
  onStatusUpdate,
  showTimeline = true,
  compact = false
}) => {
  const { user } = useSelector(state => state.auth);
  const [verificationData, setVerificationData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: '',
    rejectionReason: ''
  });

  useEffect(() => {
    if (documents.length > 0) {
      loadVerificationData();
    }
  }, [documents]);

  const loadVerificationData = async () => {
    setIsLoading(true);
    try {
      const statuses = await Promise.all(
        documents.map(async (doc) => {
          const response = await integrationService.checkKycStatus(doc.user || user.id);
          return { documentId: doc._id, ...response.data };
        })
      );
      
      const dataMap = statuses.reduce((acc, status) => {
        acc[status.documentId] = status;
        return acc;
      }, {});
      
      setVerificationData(dataMap);
    } catch (error) {
      console.error('Failed to load verification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircleIcon className={styles.iconVerified} />;
      case 'REJECTED':
        return <XCircleIcon className={styles.iconRejected} />;
      case 'PENDING':
        return <ClockIcon className={styles.iconPending} />;
      default:
        return <ExclamationTriangleIcon className={styles.iconUnknown} />;
    }
  };

  const getStatusClass = (status) => {
    return styles[`status${status?.toLowerCase()?.replace(/^\w/, c => c.toUpperCase())}`] || styles.statusDefault;
  };

  const getOverallStatus = () => {
    if (documents.length === 0) return 'NO_DOCUMENTS';
    
    const verified = documents.filter(doc => doc.verificationStatus === 'VERIFIED').length;
    const rejected = documents.filter(doc => doc.verificationStatus === 'REJECTED').length;
    const pending = documents.filter(doc => doc.verificationStatus === 'PENDING').length;

    if (rejected > 0) return 'ISSUES_FOUND';
    if (verified === documents.length) return 'FULLY_VERIFIED';
    if (pending > 0) return 'VERIFICATION_PENDING';
    return 'NOT_STARTED';
  };

  const handleStatusUpdate = async (documentId, newStatus) => {
    if (!allowStatusUpdate) return;

    setIsUpdating(true);
    try {
      const updateData = {
        verificationStatus: newStatus,
        verificationNotes: updateForm.notes,
        ...(newStatus === 'REJECTED' && { rejectionReason: updateForm.rejectionReason })
      };

      await integrationService.updateDocumentVerification(documentId, updateData);
      
      // Refresh verification data
      await loadVerificationData();
      
      // Close update form
      setSelectedDocument(null);
      setUpdateForm({ status: '', notes: '', rejectionReason: '' });
      
      onStatusUpdate && onStatusUpdate(documentId, newStatus);
    } catch (error) {
      console.error('Failed to update verification status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderTimeline = (document) => {
    const events = [
      { status: 'UPLOADED', date: document.createdAt, label: 'Document Uploaded' },
      ...(document.verifiedAt ? [{
        status: document.verificationStatus,
        date: document.verifiedAt,
        label: document.verificationStatus === 'VERIFIED' ? 'Document Verified' : 'Document Rejected'
      }] : [])
    ];

    return (
      <div className={styles.timeline}>
        {events.map((event, index) => (
          <div key={index} className={styles.timelineItem}>
            <div className={`${styles.timelineIcon} ${getStatusClass(event.status)}`}>
              {getStatusIcon(event.status)}
            </div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineLabel}>{event.label}</div>
              <div className={styles.timelineDate}>
                {new Date(event.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderUpdateForm = () => {
    if (!selectedDocument || !allowStatusUpdate) return null;

    return (
      <div className={styles.updateForm}>
        <h4>Update Verification Status</h4>
        <div className={styles.formGroup}>
          <label htmlFor="status">New Status:</label>
          <select
            id="status"
            value={updateForm.status}
            onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">Select Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING">Pending Review</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="notes">Verification Notes:</label>
          <textarea
            id="notes"
            value={updateForm.notes}
            onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add verification notes..."
            rows={3}
          />
        </div>

        {updateForm.status === 'REJECTED' && (
          <div className={styles.formGroup}>
            <label htmlFor="rejectionReason">Rejection Reason:</label>
            <textarea
              id="rejectionReason"
              value={updateForm.rejectionReason}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
              placeholder="Specify reason for rejection..."
              rows={2}
              required
            />
          </div>
        )}

        <div className={styles.formActions}>
          <Button
            variant="secondary"
            onClick={() => setSelectedDocument(null)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleStatusUpdate(selectedDocument._id, updateForm.status)}
            disabled={!updateForm.status || isUpdating}
            loading={isUpdating}
          >
            Update Status
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <LoadingSpinner size="small" />
        <span className={styles.loadingText}>Loading verification status...</span>
      </div>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Verification Status</h3>
        <div className={`${styles.overallStatus} ${getStatusClass(overallStatus)}`}>
          {getStatusIcon(overallStatus)}
          <span>{overallStatus.replace(/_/g, ' ')}</span>
        </div>
      </div>

      <div className={styles.documentsStatus}>
        {documents.map(document => (
          <div key={document._id} className={styles.documentStatus}>
            <div className={styles.documentHeader}>
              <div className={styles.documentInfo}>
                <span className={styles.documentTitle}>{document.title}</span>
                <span className={styles.documentType}>{document.type}</span>
              </div>
              <div className={`${styles.statusBadge} ${getStatusClass(document.verificationStatus)}`}>
                {getStatusIcon(document.verificationStatus)}
                <span>{document.verificationStatus}</span>
              </div>
            </div>

            {document.verificationNotes && (
              <div className={styles.verificationNotes}>
                <strong>Notes:</strong> {document.verificationNotes}
              </div>
            )}

            {document.rejectionReason && (
              <div className={styles.rejectionReason}>
                <strong>Rejection Reason:</strong> {document.rejectionReason}
              </div>
            )}

            {showTimeline && renderTimeline(document)}

            {allowStatusUpdate && (user.role === 'admin' || user.role === 'agent') && (
              <div className={styles.actions}>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => {
                    setSelectedDocument(document);
                    setUpdateForm(prev => ({ ...prev, status: document.verificationStatus }));
                  }}
                >
                  Update Status
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className={styles.emptyState}>
          <ExclamationTriangleIcon className={styles.emptyIcon} />
          <p>No documents to verify</p>
          <p className={styles.emptySubtext}>Upload documents to begin verification process</p>
        </div>
      )}

      {renderUpdateForm()}
    </div>
  );
};

export default ApplicationVerificationStatus;