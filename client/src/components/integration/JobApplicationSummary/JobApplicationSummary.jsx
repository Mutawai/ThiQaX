// client/src/components/integration/JobApplicationSummary/JobApplicationSummary.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import integrationService from '../../../services/integrationService';
import applicationService from '../../../services/applicationService';
import ApplicationVerificationStatus from '../ApplicationVerificationStatus/ApplicationVerificationStatus';
import DocumentApplicationLinker from '../DocumentApplicationLinker/DocumentApplicationLinker';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import Button from '../../common/Button/Button';
import { 
  DocumentIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import styles from './JobApplicationSummary.module.css';

/**
 * JobApplicationSummary Component
 * Comprehensive overview of job application with linked documents and status
 */
const JobApplicationSummary = ({ 
  applicationId, 
  showDocumentLinker = true,
  showVerificationStatus = true,
  onApplicationUpdate,
  compact = false
}) => {
  const { user } = useSelector(state => state.auth);
  const [application, setApplication] = useState(null);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showLinker, setShowLinker] = useState(false);

  useEffect(() => {
    if (applicationId) {
      loadApplicationData();
    }
  }, [applicationId]);

  const loadApplicationData = async () => {
    setIsLoading(true);
    try {
      const [appResponse, eligibilityResponse] = await Promise.all([
        applicationService.getApplicationById(applicationId),
        integrationService.checkApplicationEligibility(
          user.profile?._id || user.id,
          user.job?._id || applicationId
        ).catch(() => ({ data: null })) // Handle eligibility check gracefully
      ]);

      setApplication(appResponse.data);
      setEligibilityData(eligibilityResponse.data);
    } catch (error) {
      console.error('Failed to load application data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'PENDING':
        return <ClockIcon className={styles.statusIcon} />;
      case 'REVIEWED':
      case 'SHORTLISTED':
      case 'ACCEPTED':
        return <CheckCircleIcon className={styles.statusIcon} />;
      case 'REJECTED':
        return <ExclamationTriangleIcon className={styles.statusIcon} />;
      default:
        return <ClockIcon className={styles.statusIcon} />;
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'SUBMITTED': 'pending',
      'PENDING': 'pending',
      'REVIEWED': 'progress',
      'SHORTLISTED': 'progress',
      'ACCEPTED': 'success',
      'REJECTED': 'error'
    };
    return styles[`status${statusMap[status]?.charAt(0).toUpperCase() + statusMap[status]?.slice(1)}`] || styles.statusDefault;
  };

  const getCompletionPercentage = () => {
    if (!application) return 0;
    
    let completed = 0;
    const total = 4; // Basic application, documents, verification, review
    
    if (application.status !== 'DRAFT') completed += 1;
    if (application.documents?.length > 0) completed += 1;
    if (application.documents?.some(doc => doc.verificationStatus === 'VERIFIED')) completed += 1;
    if (['REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'].includes(application.status)) completed += 1;
    
    return Math.round((completed / total) * 100);
  };

  const getNextSteps = () => {
    if (!application) return [];
    
    const steps = [];
    const { status, documents = [] } = application;
    
    if (status === 'DRAFT') {
      steps.push('Submit your application to begin the review process');
    }
    
    if (documents.length === 0) {
      steps.push('Upload and link required documents to your application');
    }
    
    const unverifiedDocs = documents.filter(doc => doc.verificationStatus === 'PENDING');
    if (unverifiedDocs.length > 0) {
      steps.push(`${unverifiedDocs.length} document(s) pending verification`);
    }
    
    const rejectedDocs = documents.filter(doc => doc.verificationStatus === 'REJECTED');
    if (rejectedDocs.length > 0) {
      steps.push(`${rejectedDocs.length} document(s) rejected - re-upload required`);
    }
    
    if (status === 'SUBMITTED') {
      steps.push('Your application is under review');
    }
    
    if (steps.length === 0) {
      steps.push('Your application is complete and up to date');
    }
    
    return steps;
  };

  const handleDocumentLinked = (updatedApplication) => {
    setApplication(updatedApplication);
    onApplicationUpdate && onApplicationUpdate(updatedApplication);
  };

  const handleStatusUpdate = () => {
    loadApplicationData();
  };

  if (isLoading) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <LoadingSpinner size="large" />
        <p className={styles.loadingText}>Loading application summary...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.errorState}>
          <ExclamationTriangleIcon className={styles.errorIcon} />
          <p>Application not found</p>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();
  const nextSteps = getNextSteps();

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Application Summary</h2>
          <div className={`${styles.statusBadge} ${getStatusClass(application.status)}`}>
            {getStatusIcon(application.status)}
            <span>{application.status}</span>
          </div>
        </div>
        
        <div className={styles.progressSection}>
          <div className={styles.progressInfo}>
            <span className={styles.progressLabel}>Completion</span>
            <span className={styles.progressPercentage}>{completionPercentage}%</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className={styles.jobInfo}>
        <div className={styles.jobHeader}>
          <BuildingOfficeIcon className={styles.jobIcon} />
          <div>
            <h3 className={styles.jobTitle}>{application.job?.title}</h3>
            <p className={styles.jobCompany}>{application.job?.company || 'Company Name'}</p>
            <p className={styles.jobLocation}>{application.job?.location}</p>
          </div>
        </div>
        <div className={styles.applicationMeta}>
          <span className={styles.applicationId}>App ID: #{application._id.slice(-8)}</span>
          <span className={styles.submissionDate}>
            Applied: {new Date(application.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'documents' ? styles.active : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents ({application.documents?.length || 0})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'timeline' ? styles.active : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <DocumentIcon className={styles.cardIcon} />
                <div className={styles.cardContent}>
                  <h4>Documents</h4>
                  <p className={styles.cardValue}>{application.documents?.length || 0}</p>
                  <p className={styles.cardSubtext}>
                    {application.documents?.filter(doc => doc.verificationStatus === 'VERIFIED').length || 0} verified
                  </p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <UserIcon className={styles.cardIcon} />
                <div className={styles.cardContent}>
                  <h4>Profile Match</h4>
                  <p className={styles.cardValue}>
                    {eligibilityData?.eligible ? 'Eligible' : 'Needs Update'}
                  </p>
                  <p className={styles.cardSubtext}>
                    {eligibilityData?.warnings?.length || 0} warnings
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.nextStepsSection}>
              <h4>Next Steps</h4>
              <ul className={styles.nextStepsList}>
                {nextSteps.map((step, index) => (
                  <li key={index} className={styles.nextStepItem}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {eligibilityData?.missingRequirements?.length > 0 && (
              <div className={styles.requirementsSection}>
                <h4>Missing Requirements</h4>
                <ul className={styles.requirementsList}>
                  {eligibilityData.missingRequirements.map((req, index) => (
                    <li key={index} className={styles.requirementItem}>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {application.coverLetter && (
              <div className={styles.coverLetterSection}>
                <h4>Cover Letter</h4>
                <div className={styles.coverLetterContent}>
                  {application.coverLetter}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className={styles.documentsTab}>
            {showVerificationStatus && (
              <ApplicationVerificationStatus
                applicationId={applicationId}
                documents={application.documents || []}
                onStatusUpdate={handleStatusUpdate}
                compact={compact}
              />
            )}
            
            {showDocumentLinker && (
              <div className={styles.documentLinkerSection}>
                <div className={styles.sectionHeader}>
                  <h4>Link Additional Documents</h4>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setShowLinker(!showLinker)}
                  >
                    {showLinker ? 'Hide Linker' : 'Add Documents'}
                  </Button>
                </div>
                
                {showLinker && (
                  <DocumentApplicationLinker
                    applicationId={applicationId}
                    onSuccess={handleDocumentLinked}
                    compact={compact}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={styles.timelineIcon}>
                <CheckCircleIcon />
              </div>
              <div className={styles.timelineContent}>
                <h5>Application Submitted</h5>
                <p>{new Date(application.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            {application.documents?.map((doc, index) => (
              <div key={doc._id} className={styles.timelineItem}>
                <div className={styles.timelineIcon}>
                  <DocumentIcon />
                </div>
                <div className={styles.timelineContent}>
                  <h5>Document Added: {doc.title}</h5>
                  <p>Status: {doc.verificationStatus}</p>
                </div>
              </div>
            ))}

            {application.updatedAt !== application.createdAt && (
              <div className={styles.timelineItem}>
                <div className={styles.timelineIcon}>
                  <ClockIcon />
                </div>
                <div className={styles.timelineContent}>
                  <h5>Last Updated</h5>
                  <p>{new Date(application.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicationSummary;