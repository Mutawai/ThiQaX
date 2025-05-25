// client/src/components/integration/DocumentApplicationLinker/DocumentApplicationLinker.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import integrationService from '../../../services/integrationService';
import documentService from '../../../services/documentService';
import applicationService from '../../../services/applicationService';
import Button from '../../common/Button/Button';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import styles from './DocumentApplicationLinker.module.css';

/**
 * DocumentApplicationLinker Component
 * Enables users to link their uploaded documents to specific job applications
 */
const DocumentApplicationLinker = ({ 
  applicationId, 
  onSuccess, 
  onError,
  preSelectedDocuments = [],
  allowMultipleSelection = true,
  title = "Link Documents to Application"
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [documents, setDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState(preSelectedDocuments);
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInitialData();
  }, [applicationId]);

  useEffect(() => {
    setSelectedDocuments(preSelectedDocuments);
  }, [preSelectedDocuments]);

  /**
   * Load application details and user documents
   */
  const loadInitialData = async () => {
    setDocumentsLoading(true);
    setErrors({});

    try {
      const [appResponse, docsResponse] = await Promise.all([
        applicationService.getApplicationById(applicationId),
        documentService.getUserDocuments()
      ]);

      setApplication(appResponse.data);
      
      // Filter out documents already linked to this application
      const linkedDocumentIds = appResponse.data.documents?.map(doc => doc._id) || [];
      const availableDocuments = docsResponse.data.filter(
        doc => !linkedDocumentIds.includes(doc._id)
      );
      
      setDocuments(availableDocuments);
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to load data';
      setErrors({ general: errorMessage });
      onError && onError(error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  /**
   * Handle document selection
   */
  const handleDocumentSelection = (documentId) => {
    if (!allowMultipleSelection) {
      setSelectedDocuments([documentId]);
      return;
    }

    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };

  /**
   * Validate selection before linking
   */
  const validateSelection = () => {
    const newErrors = {};

    if (selectedDocuments.length === 0) {
      newErrors.selection = 'Please select at least one document to link';
    }

    if (!applicationId) {
      newErrors.application = 'Application ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Link selected documents to application
   */
  const handleLinkDocuments = async () => {
    if (!validateSelection()) {
      return;
    }

    setIsLinking(true);
    setErrors({});

    try {
      const response = await integrationService.linkDocumentsToApplication(
        applicationId,
        selectedDocuments
      );

      toast.success(`Successfully linked ${selectedDocuments.length} document(s) to application`);
      
      // Update local state
      setSelectedDocuments([]);
      
      // Remove linked documents from available list
      setDocuments(prev => 
        prev.filter(doc => !selectedDocuments.includes(doc._id))
      );

      // Update application data
      setApplication(response.data);

      onSuccess && onSuccess(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to link documents';
      setErrors({ linking: errorMessage });
      toast.error(errorMessage);
      onError && onError(error);
    } finally {
      setIsLinking(false);
    }
  };

  /**
   * Get document type badge style
   */
  const getDocumentTypeBadge = (type) => {
    const badgeClasses = {
      'IDENTIFICATION': styles.badgeId,
      'EDUCATION': styles.badgeEducation,
      'EXPERIENCE': styles.badgeExperience,
      'MEDICAL': styles.badgeMedical,
      'OTHER': styles.badgeOther
    };

    return badgeClasses[type] || styles.badgeDefault;
  };

  /**
   * Get verification status indicator
   */
  const getVerificationStatus = (status) => {
    const statusClasses = {
      'VERIFIED': styles.statusVerified,
      'PENDING': styles.statusPending,
      'REJECTED': styles.statusRejected
    };

    return statusClasses[status] || styles.statusDefault;
  };

  if (documentsLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size="large" />
        <p className={styles.loadingText}>Loading documents...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {application && (
          <div className={styles.applicationInfo}>
            <span className={styles.jobTitle}>{application.job?.title}</span>
            <span className={styles.applicationId}>App #{application._id.slice(-6)}</span>
          </div>
        )}
      </div>

      {errors.general && (
        <div className={styles.errorMessage}>
          {errors.general}
        </div>
      )}

      {documents.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No documents available to link to this application.</p>
          <p className={styles.emptySubtext}>
            All your documents may already be linked or you haven't uploaded any documents yet.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.documentsGrid}>
            {documents.map(document => (
              <div
                key={document._id}
                className={`${styles.documentCard} ${
                  selectedDocuments.includes(document._id) ? styles.selected : ''
                }`}
                onClick={() => handleDocumentSelection(document._id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleDocumentSelection(document._id);
                  }
                }}
                aria-label={`Select ${document.title} document`}
              >
                <div className={styles.documentHeader}>
                  <input
                    type={allowMultipleSelection ? 'checkbox' : 'radio'}
                    checked={selectedDocuments.includes(document._id)}
                    onChange={() => handleDocumentSelection(document._id)}
                    className={styles.documentCheckbox}
                  />
                  <span className={`${styles.documentType} ${getDocumentTypeBadge(document.type)}`}>
                    {document.type}
                  </span>
                </div>
                
                <h4 className={styles.documentTitle}>{document.title}</h4>
                
                {document.description && (
                  <p className={styles.documentDescription}>
                    {document.description.length > 100 
                      ? `${document.description.substring(0, 100)}...`
                      : document.description
                    }
                  </p>
                )}
                
                <div className={styles.documentFooter}>
                  <span className={`${styles.verificationStatus} ${getVerificationStatus(document.verificationStatus)}`}>
                    {document.verificationStatus}
                  </span>
                  <span className={styles.uploadDate}>
                    {new Date(document.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {errors.selection && (
            <div className={styles.errorMessage}>
              {errors.selection}
            </div>
          )}

          {errors.linking && (
            <div className={styles.errorMessage}>
              {errors.linking}
            </div>
          )}

          <div className={styles.actions}>
            <div className={styles.selectionSummary}>
              {selectedDocuments.length > 0 && (
                <span>
                  {selectedDocuments.length} document(s) selected
                </span>
              )}
            </div>
            
            <div className={styles.actionButtons}>
              <Button
                variant="secondary"
                onClick={() => setSelectedDocuments([])}
                disabled={selectedDocuments.length === 0 || isLinking}
              >
                Clear Selection
              </Button>
              
              <Button
                variant="primary"
                onClick={handleLinkDocuments}
                disabled={selectedDocuments.length === 0 || isLinking}
                loading={isLinking}
              >
                {isLinking ? 'Linking...' : `Link ${selectedDocuments.length} Document(s)`}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentApplicationLinker;