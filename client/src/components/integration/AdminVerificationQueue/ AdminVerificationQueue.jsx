// client/src/components/integration/AdminVerificationQueue/AdminVerificationQueue.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchVerifications, 
  verifyDocument, 
  assignVerificationToSelf,
  requestAdditionalDocuments,
  clearVerificationError 
} from '../../../redux/actions/verificationActions';
import { useVerification } from '../../utils/context/VerificationContext';
import integrationService from '../../../services/integrationService';
import styles from './AdminVerificationQueue.module.css';

/**
 * AdminVerificationQueue Component
 * Manages the admin interface for document verification workflows
 */
const AdminVerificationQueue = () => {
  // Redux state
  const dispatch = useDispatch();
  const { 
    verifications, 
    loading, 
    error, 
    pagination 
  } = useSelector(state => state.verification);
  const { user } = useSelector(state => state.auth);

  // Local state
  const [filters, setFilters] = useState({
    status: 'pending',
    documentType: '',
    search: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [selectedVerifications, setSelectedVerifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);

  // Verification context for real-time updates
  const { 
    loadVerifications, 
    verificationStats,
    updateVerificationStatus 
  } = useVerification();

  // Status options for filtering
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'assigned', label: 'Assigned to Me' }
  ];

  // Document type options for filtering
  const documentTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'NATIONAL_ID', label: 'National ID' },
    { value: 'DRIVERS_LICENSE', label: 'Driver\'s License' },
    { value: 'PROOF_OF_ADDRESS', label: 'Proof of Address' },
    { value: 'EDUCATION_CERTIFICATE', label: 'Education Certificate' },
    { value: 'WORK_EXPERIENCE', label: 'Work Experience' }
  ];

  // Load verifications when filters or page changes
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchVerifications({
          page: currentPage,
          limit: 10,
          ...filters
        }));
      } catch (err) {
        console.error('Failed to load verifications:', err);
      }
    };

    loadData();
  }, [dispatch, currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  // Handle search with debouncing
  const handleSearch = useCallback((searchTerm) => {
    handleFilterChange('search', searchTerm);
  }, [handleFilterChange]);

  // Handle verification status update
  const handleVerificationUpdate = useCallback(async (verificationId, status, notes = '', rejectionReason = '') => {
    if (processingIds.has(verificationId)) return;

    setProcessingIds(prev => new Set(prev).add(verificationId));

    try {
      const updateData = { status, notes };
      if (status === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      await dispatch(verifyDocument(verificationId, updateData));
      
      // Update verification stats in context
      await loadVerifications();
      
      // Send notification about status change
      await integrationService.sendJobStatusNotification(verificationId, {
        status,
        message: `Verification ${status}`,
        adminId: user.id
      });

    } catch (err) {
      console.error('Failed to update verification:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(verificationId);
        return newSet;
      });
    }
  }, [dispatch, processingIds, loadVerifications, user.id]);

  // Handle verification assignment
  const handleAssignVerification = useCallback(async (verificationId) => {
    if (processingIds.has(verificationId)) return;

    setProcessingIds(prev => new Set(prev).add(verificationId));

    try {
      await dispatch(assignVerificationToSelf(verificationId));
      await loadVerifications();
    } catch (err) {
      console.error('Failed to assign verification:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(verificationId);
        return newSet;
      });
    }
  }, [dispatch, processingIds, loadVerifications]);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action) => {
    if (selectedVerifications.length === 0) return;

    const promises = selectedVerifications.map(id => {
      switch (action) {
        case 'approve':
          return handleVerificationUpdate(id, 'approved', 'Bulk approval');
        case 'assign':
          return handleAssignVerification(id);
        default:
          return Promise.resolve();
      }
    });

    try {
      await Promise.all(promises);
      setSelectedVerifications([]);
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
  }, [selectedVerifications, handleVerificationUpdate, handleAssignVerification]);

  // Handle row selection
  const handleRowSelection = useCallback((verificationId, isSelected) => {
    setSelectedVerifications(prev => {
      if (isSelected) {
        return [...prev, verificationId];
      } else {
        return prev.filter(id => id !== verificationId);
      }
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedVerifications(verifications.map(v => v.id));
    } else {
      setSelectedVerifications([]);
    }
  }, [verifications]);

  // Memoized verification stats summary
  const statsSummary = useMemo(() => {
    if (!verificationStats) return null;

    return (
      <div className={styles.statsContainer}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Pending</span>
          <span className={styles.statValue}>{verificationStats.pending}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Verified</span>
          <span className={styles.statValue}>{verificationStats.verified}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Rejected</span>
          <span className={styles.statValue}>{verificationStats.rejected}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total</span>
          <span className={styles.statValue}>{verificationStats.total}</span>
        </div>
      </div>
    );
  }, [verificationStats]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearVerificationError());
    };
  }, [dispatch]);

  // Render verification status badge
  const renderStatusBadge = (status) => {
    const statusClasses = {
      pending: styles.statusPending,
      approved: styles.statusApproved,
      rejected: styles.statusRejected,
      assigned: styles.statusAssigned
    };

    return (
      <span className={`${styles.statusBadge} ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Render action buttons for each verification
  const renderActionButtons = (verification) => {
    const isProcessing = processingIds.has(verification.id);
    const canApprove = verification.status === 'pending' || verification.status === 'assigned';
    const canReject = verification.status === 'pending' || verification.status === 'assigned';
    const canAssign = verification.status === 'pending' && !verification.assignedTo;

    return (
      <div className={styles.actionButtons}>
        {canApprove && (
          <button
            onClick={() => handleVerificationUpdate(verification.id, 'approved')}
            disabled={isProcessing}
            className={`${styles.actionButton} ${styles.approveButton}`}
          >
            {isProcessing ? 'Processing...' : 'Approve'}
          </button>
        )}
        {canReject && (
          <button
            onClick={() => {
              setSelectedVerification(verification);
              setShowAssignModal(true);
            }}
            disabled={isProcessing}
            className={`${styles.actionButton} ${styles.rejectButton}`}
          >
            Reject
          </button>
        )}
        {canAssign && (
          <button
            onClick={() => handleAssignVerification(verification.id)}
            disabled={isProcessing}
            className={`${styles.actionButton} ${styles.assignButton}`}
          >
            Assign to Me
          </button>
        )}
      </div>
    );
  };

  if (loading && !verifications.length) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading verification queue...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Verification Queue</h2>
        {statsSummary}
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterRow}>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.filterSelect}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.documentType}
            onChange={(e) => handleFilterChange('documentType', e.target.value)}
            className={styles.filterSelect}
          >
            {documentTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search by user name or document..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Bulk Actions */}
        {selectedVerifications.length > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.selectedCount}>
              {selectedVerifications.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('approve')}
              className={`${styles.bulkButton} ${styles.bulkApprove}`}
            >
              Bulk Approve
            </button>
            <button
              onClick={() => handleBulkAction('assign')}
              className={`${styles.bulkButton} ${styles.bulkAssign}`}
            >
              Bulk Assign
            </button>
          </div>
        )}
      </div>

      {/* Verification Table */}
      <div className={styles.tableContainer}>
        <table className={styles.verificationTable}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedVerifications.length === verifications.length && verifications.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th>User</th>
              <th>Document Type</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map(verification => (
              <tr key={verification.id} className={styles.verificationRow}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedVerifications.includes(verification.id)}
                    onChange={(e) => handleRowSelection(verification.id, e.target.checked)}
                  />
                </td>
                <td>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{verification.user?.name}</span>
                    <span className={styles.userEmail}>{verification.user?.email}</span>
                  </div>
                </td>
                <td>{verification.document?.type}</td>
                <td>{renderStatusBadge(verification.status)}</td>
                <td>{new Date(verification.createdAt).toLocaleDateString()}</td>
                <td>
                  {verification.assignedTo ? (
                    <span className={styles.assignedAdmin}>
                      {verification.assignedTo.name}
                    </span>
                  ) : (
                    <span className={styles.unassigned}>Unassigned</span>
                  )}
                </td>
                <td>{renderActionButtons(verification)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            Previous
          </button>
          <span className={styles.paginationInfo}>
            Page {currentPage} of {pagination.pages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
            disabled={currentPage === pagination.pages}
            className={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminVerificationQueue;