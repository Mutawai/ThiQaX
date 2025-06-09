// client/src/components/integration/AdminAuditLogger/AdminAuditLogger.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAuditLogs, exportAuditLogs, clearAuditError } from '../../../redux/actions/auditActions';
import integrationService from '../../../services/integrationService';
import styles from './AdminAuditLogger.module.css';

/**
 * AdminAuditLogger Component
 * Displays and manages system audit logs for administrators
 */
const AdminAuditLogger = () => {
  // Redux state
  const dispatch = useDispatch();
  const { auditLogs, loading, error, pagination } = useSelector(state => state.audit);
  const { user: currentUser } = useSelector(state => state.auth);

  // Local state
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  // Audit action types for filtering
  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'USER_LOGIN', label: 'User Login' },
    { value: 'USER_LOGOUT', label: 'User Logout' },
    { value: 'ROLE_CHANGE', label: 'Role Change' },
    { value: 'PERMISSION_CHANGE', label: 'Permission Change' },
    { value: 'VERIFICATION_UPDATE', label: 'Verification Update' },
    { value: 'DOCUMENT_UPLOAD', label: 'Document Upload' },
    { value: 'JOB_CREATE', label: 'Job Created' },
    { value: 'APPLICATION_SUBMIT', label: 'Application Submitted' },
    { value: 'PAYMENT_PROCESS', label: 'Payment Processed' },
    { value: 'SYSTEM_CONFIG', label: 'System Configuration' },
    { value: 'DATA_EXPORT', label: 'Data Export' },
    { value: 'SECURITY_EVENT', label: 'Security Event' }
  ];

  // Load audit logs when filters or page changes
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchAuditLogs({
          page: currentPage,
          limit: 20,
          ...filters
        }));
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      }
    };

    loadData();
  }, [dispatch, currentPage, filters]);

  // Real-time log polling
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(async () => {
      try {
        await dispatch(fetchAuditLogs({
          page: 1,
          limit: 20,
          ...filters
        }));
      } catch (err) {
        console.error('Failed to refresh audit logs:', err);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [dispatch, filters, realTimeEnabled]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1);
  }, []);

  // Handle date range selection
  const handleDateRangeChange = useCallback((startDate, endDate) => {
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate
    }));
    setCurrentPage(1);
  }, []);

  // Handle quick date filters
  const handleQuickDateFilter = useCallback((period) => {
    const now = new Date();
    let startDate = '';

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString();
        break;
      default:
        startDate = '';
    }

    handleDateRangeChange(startDate, '');
  }, [handleDateRangeChange]);

  // Export audit logs
  const handleExport = useCallback(async (format = 'csv') => {
    setExportLoading(true);
    try {
      await dispatch(exportAuditLogs({
        format,
        ...filters
      }));

      // Log the export action
      await integrationService.logAuditEvent({
        action: 'DATA_EXPORT',
        details: {
          exportType: 'audit_logs',
          format,
          filters,
          exportedBy: currentUser.id
        }
      });

    } catch (err) {
      console.error('Failed to export audit logs:', err);
    } finally {
      setExportLoading(false);
    }
  }, [dispatch, filters, currentUser.id]);

  // View log details
  const handleViewDetails = useCallback((log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  }, []);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }, []);

  // Get action badge color
  const getActionBadgeColor = useCallback((action) => {
    const colorMap = {
      USER_LOGIN: '#10b981',
      USER_LOGOUT: '#6b7280',
      ROLE_CHANGE: '#f59e0b',
      PERMISSION_CHANGE: '#f59e0b',
      VERIFICATION_UPDATE: '#3b82f6',
      DOCUMENT_UPLOAD: '#8b5cf6',
      JOB_CREATE: '#10b981',
      APPLICATION_SUBMIT: '#06b6d4',
      PAYMENT_PROCESS: '#f59e0b',
      SYSTEM_CONFIG: '#ef4444',
      DATA_EXPORT: '#6366f1',
      SECURITY_EVENT: '#ef4444'
    };
    return colorMap[action] || '#6b7280';
  }, []);

  // Render action badge
  const renderActionBadge = (action) => (
    <span 
      className={styles.actionBadge}
      style={{ backgroundColor: getActionBadgeColor(action) }}
    >
      {action.replace(/_/g, ' ')}
    </span>
  );

  // Render log detail modal
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedLog) return null;

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3>Audit Log Details</h3>
            <button 
              onClick={() => setShowDetailModal(false)}
              className={styles.closeButton}
            >
              ×
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <div className={styles.detailSection}>
              <h4>Basic Information</h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>ID:</span>
                  <span className={styles.detailValue}>{selectedLog.id}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Action:</span>
                  <span className={styles.detailValue}>{renderActionBadge(selectedLog.action)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Timestamp:</span>
                  <span className={styles.detailValue}>{formatTimestamp(selectedLog.createdAt)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>User:</span>
                  <span className={styles.detailValue}>
                    {selectedLog.user?.name || 'System'} ({selectedLog.user?.email || 'N/A'})
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>IP Address:</span>
                  <span className={styles.detailValue}>{selectedLog.ipAddress || 'N/A'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>User Agent:</span>
                  <span className={styles.detailValue}>{selectedLog.userAgent || 'N/A'}</span>
                </div>
              </div>
            </div>

            {selectedLog.targetUser && (
              <div className={styles.detailSection}>
                <h4>Target User</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Name:</span>
                    <span className={styles.detailValue}>{selectedLog.targetUser.name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Email:</span>
                    <span className={styles.detailValue}>{selectedLog.targetUser.email}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedLog.details && (
              <div className={styles.detailSection}>
                <h4>Additional Details</h4>
                <pre className={styles.jsonDisplay}>
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <div className={styles.modalFooter}>
            <button 
              onClick={() => setShowDetailModal(false)}
              className={styles.closeModalButton}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearAuditError());
    };
  }, [dispatch]);

  if (loading && !auditLogs.length) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Audit Log Viewer</h2>
          <div className={styles.realTimeToggle}>
            <label>
              <input
                type="checkbox"
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
              />
              Real-time updates
            </label>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <button
            onClick={() => handleExport('csv')}
            disabled={exportLoading}
            className={styles.exportButton}
          >
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exportLoading}
            className={styles.exportButton}
          >
            Export JSON
          </button>
        </div>
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
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className={styles.filterSelect}
          >
            {actionTypes.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.startDate.split('T')[0] || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value ? `${e.target.value}T00:00:00.000Z` : '')}
            className={styles.dateInput}
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.endDate.split('T')[0] || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value ? `${e.target.value}T23:59:59.999Z` : '')}
            className={styles.dateInput}
            placeholder="End Date"
          />

          <input
            type="text"
            placeholder="Search logs..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Quick Date Filters */}
        <div className={styles.quickFilters}>
          <span className={styles.quickFilterLabel}>Quick filters:</span>
          <button onClick={() => handleQuickDateFilter('today')} className={styles.quickFilterButton}>
            Today
          </button>
          <button onClick={() => handleQuickDateFilter('week')} className={styles.quickFilterButton}>
            Last 7 days
          </button>
          <button onClick={() => handleQuickDateFilter('month')} className={styles.quickFilterButton}>
            Last 30 days
          </button>
          <button onClick={() => handleQuickDateFilter('quarter')} className={styles.quickFilterButton}>
            Last 90 days
          </button>
          <button onClick={() => handleQuickDateFilter('')} className={styles.quickFilterButton}>
            All time
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className={styles.tableContainer}>
        <table className={styles.logsTable}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>User</th>
              <th>Target</th>
              <th>IP Address</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id} className={styles.logRow}>
                <td className={styles.timestampCell}>
                  {formatTimestamp(log.createdAt)}
                </td>
                <td>{renderActionBadge(log.action)}</td>
                <td>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>
                      {log.user?.name || 'System'}
                    </span>
                    <span className={styles.userEmail}>
                      {log.user?.email || 'N/A'}
                    </span>
                  </div>
                </td>
                <td>
                  {log.targetUser ? (
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{log.targetUser.name}</span>
                      <span className={styles.userEmail}>{log.targetUser.email}</span>
                    </div>
                  ) : (
                    <span className={styles.noTarget}>-</span>
                  )}
                </td>
                <td className={styles.ipAddress}>{log.ipAddress || 'N/A'}</td>
                <td className={styles.detailsPreview}>
                  {log.details ? (
                    <span className={styles.hasDetails}>View details</span>
                  ) : (
                    <span className={styles.noDetails}>-</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => handleViewDetails(log)}
                    className={styles.viewButton}
                  >
                    View
                  </button>
                </td>
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
            Page {currentPage} of {pagination.pages} ({pagination.total} total)
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

      {/* Detail Modal */}
      {renderDetailModal()}
    </div>
  );
};

export default AdminAuditLogger;