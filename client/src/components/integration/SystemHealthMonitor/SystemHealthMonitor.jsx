// client/src/components/integration/SystemHealthMonitor/SystemHealthMonitor.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSystemMetrics, fetchSystemAlerts, updateAlertStatus } from '../../../redux/actions/systemActions';
import integrationService from '../../../services/integrationService';
import styles from './SystemHealthMonitor.module.css';

/**
 * SystemHealthMonitor Component
 * Displays real-time system health metrics and alerts for administrators
 */
const SystemHealthMonitor = () => {
  // Redux state
  const dispatch = useDispatch();
  const { 
    metrics, 
    alerts, 
    loading, 
    error, 
    lastUpdated 
  } = useSelector(state => state.system);
  const { user: currentUser } = useSelector(state => state.auth);

  // Local state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [alertFilters, setAlertFilters] = useState({
    severity: '',
    status: 'active',
    category: ''
  });

  // System metrics thresholds
  const thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    responseTime: { warning: 500, critical: 1000 },
    errorRate: { warning: 5, critical: 10 }
  };

  // Load system metrics and alerts
  const loadSystemData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchSystemMetrics()),
        dispatch(fetchSystemAlerts(alertFilters))
      ]);
    } catch (err) {
      console.error('Failed to load system data:', err);
    }
  }, [dispatch, alertFilters]);

  // Initial load
  useEffect(() => {
    loadSystemData();
  }, [loadSystemData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadSystemData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadSystemData]);

  // Get health status based on metric value
  const getHealthStatus = useCallback((metricType, value) => {
    const threshold = thresholds[metricType];
    if (!threshold || value === null || value === undefined) return 'unknown';
    
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'healthy';
  }, [thresholds]);

  // Format uptime
  const formatUptime = useCallback((seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  // Handle alert dismissal
  const handleDismissAlert = useCallback(async (alertId) => {
    try {
      await dispatch(updateAlertStatus(alertId, 'dismissed'));
      
      // Log the dismissal
      await integrationService.logAuditEvent({
        action: 'ALERT_DISMISSED',
        details: {
          alertId,
          dismissedBy: currentUser.id
        }
      });
      
      await loadSystemData();
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  }, [dispatch, currentUser.id, loadSystemData]);

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = useCallback(async (alertId) => {
    try {
      await dispatch(updateAlertStatus(alertId, 'acknowledged'));
      
      await integrationService.logAuditEvent({
        action: 'ALERT_ACKNOWLEDGED',
        details: {
          alertId,
          acknowledgedBy: currentUser.id
        }
      });
      
      await loadSystemData();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  }, [dispatch, currentUser.id, loadSystemData]);

  // Render metric card
  const renderMetricCard = (metric) => {
    if (!metric) return null;

    const status = getHealthStatus(metric.type, metric.value);
    const isPercentage = ['cpu', 'memory', 'disk'].includes(metric.type);
    const displayValue = isPercentage ? `${metric.value}%` : metric.value;

    return (
      <div 
        key={metric.type}
        className={`${styles.metricCard} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}
        onClick={() => setSelectedMetric(metric)}
      >
        <div className={styles.metricHeader}>
          <h3 className={styles.metricTitle}>{metric.label}</h3>
          <span className={`${styles.statusIndicator} ${styles[status]}`}>
            {status === 'healthy' ? '●' : status === 'warning' ? '▲' : '●'}
          </span>
        </div>
        
        <div className={styles.metricValue}>
          {displayValue}
        </div>
        
        {metric.trend && (
          <div className={`${styles.metricTrend} ${styles[metric.trend.direction]}`}>
            {metric.trend.direction === 'up' ? '↗' : metric.trend.direction === 'down' ? '↘' : '→'}
            {metric.trend.percentage}%
          </div>
        )}
        
        <div className={styles.metricFooter}>
          <span className={styles.lastUpdated}>
            Updated: {new Date(metric.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  // Render alert item
  const renderAlert = (alert) => (
    <div key={alert.id} className={`${styles.alertItem} ${styles[`severity${alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}`]}`}>
      <div className={styles.alertHeader}>
        <div className={styles.alertTitle}>
          <span className={`${styles.severityBadge} ${styles[alert.severity]}`}>
            {alert.severity.toUpperCase()}
          </span>
          <span className={styles.alertMessage}>{alert.title}</span>
        </div>
        <div className={styles.alertTime}>
          {new Date(alert.createdAt).toLocaleString()}
        </div>
      </div>
      
      <div className={styles.alertDescription}>
        {alert.description}
      </div>
      
      {alert.recommendations && (
        <div className={styles.alertRecommendations}>
          <strong>Recommendations:</strong>
          <ul>
            {alert.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className={styles.alertActions}>
        {alert.status === 'active' && (
          <>
            <button
              onClick={() => handleAcknowledgeAlert(alert.id)}
              className={styles.acknowledgeButton}
            >
              Acknowledge
            </button>
            <button
              onClick={() => handleDismissAlert(alert.id)}
              className={styles.dismissButton}
            >
              Dismiss
            </button>
          </>
        )}
        {alert.status === 'acknowledged' && (
          <span className={styles.acknowledgedStatus}>Acknowledged</span>
        )}
      </div>
    </div>
  );

  // Render metric detail modal
  const renderMetricDetailModal = () => {
    if (!selectedMetric) return null;

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3>{selectedMetric.label} Details</h3>
            <button 
              onClick={() => setSelectedMetric(null)}
              className={styles.closeButton}
            >
              ×
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <div className={styles.metricDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Current Value:</span>
                <span className={styles.detailValue}>
                  {['cpu', 'memory', 'disk'].includes(selectedMetric.type) 
                    ? `${selectedMetric.value}%` 
                    : selectedMetric.value}
                </span>
              </div>
              
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={`${styles.detailValue} ${styles[getHealthStatus(selectedMetric.type, selectedMetric.value)]}`}>
                  {getHealthStatus(selectedMetric.type, selectedMetric.value).toUpperCase()}
                </span>
              </div>
              
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Last Updated:</span>
                <span className={styles.detailValue}>
                  {new Date(selectedMetric.lastUpdated).toLocaleString()}
                </span>
              </div>
              
              {selectedMetric.history && (
                <div className={styles.historySection}>
                  <h4>Recent History (Last 24h)</h4>
                  <div className={styles.historyChart}>
                    {selectedMetric.history.map((point, index) => (
                      <div 
                        key={index}
                        className={styles.historyPoint}
                        style={{ 
                          height: `${(point.value / 100) * 100}%`,
                          backgroundColor: getHealthStatus(selectedMetric.type, point.value) === 'critical' 
                            ? '#ef4444' : getHealthStatus(selectedMetric.type, point.value) === 'warning' 
                            ? '#f59e0b' : '#10b981'
                        }}
                        title={`${point.value}% at ${new Date(point.timestamp).toLocaleTimeString()}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.modalFooter}>
            <button 
              onClick={() => setSelectedMetric(null)}
              className={styles.closeModalButton}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Filter alerts based on current filters
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    
    return alerts.filter(alert => {
      if (alertFilters.severity && alert.severity !== alertFilters.severity) return false;
      if (alertFilters.status && alert.status !== alertFilters.status) return false;
      if (alertFilters.category && alert.category !== alertFilters.category) return false;
      return true;
    });
  }, [alerts, alertFilters]);

  // Overall system health
  const overallHealth = useMemo(() => {
    if (!metrics) return 'unknown';
    
    const criticalCount = metrics.filter(m => getHealthStatus(m.type, m.value) === 'critical').length;
    const warningCount = metrics.filter(m => getHealthStatus(m.type, m.value) === 'warning').length;
    
    if (criticalCount > 0) return 'critical';
    if (warningCount > 0) return 'warning';
    return 'healthy';
  }, [metrics, getHealthStatus]);

  if (loading && !metrics) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading system health data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>System Health Monitor</h2>
          <div className={`${styles.overallStatus} ${styles[overallHealth]}`}>
            <span className={styles.statusIcon}>
              {overallHealth === 'healthy' ? '✓' : overallHealth === 'warning' ? '⚠' : '✗'}
            </span>
            <span className={styles.statusText}>
              {overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}
            </span>
          </div>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.refreshControls}>
            <label className={styles.autoRefreshToggle}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              disabled={!autoRefresh}
              className={styles.intervalSelect}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
          
          <button
            onClick={loadSystemData}
            disabled={loading}
            className={styles.refreshButton}
          >
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
          
          <button
            onClick={() => setShowAlertsPanel(!showAlertsPanel)}
            className={`${styles.alertsButton} ${filteredAlerts.length > 0 ? styles.hasAlerts : ''}`}
          >
            Alerts ({filteredAlerts.length})
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className={styles.lastUpdated}>
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      {/* System Overview */}
      {metrics && (
        <div className={styles.overviewSection}>
          <h3>System Overview</h3>
          <div className={styles.overviewGrid}>
            <div className={styles.overviewItem}>
              <span className={styles.overviewLabel}>Uptime:</span>
              <span className={styles.overviewValue}>
                {metrics.find(m => m.type === 'uptime')?.value 
                  ? formatUptime(metrics.find(m => m.type === 'uptime').value)
                  : 'N/A'
                }
              </span>
            </div>
            <div className={styles.overviewItem}>
              <span className={styles.overviewLabel}>Active Users:</span>
              <span className={styles.overviewValue}>
                {metrics.find(m => m.type === 'activeUsers')?.value || '0'}
              </span>
            </div>
            <div className={styles.overviewItem}>
              <span className={styles.overviewLabel}>Request Rate:</span>
              <span className={styles.overviewValue}>
                {metrics.find(m => m.type === 'requestRate')?.value || '0'}/min
              </span>
            </div>
            <div className={styles.overviewItem}>
              <span className={styles.overviewLabel}>Database:</span>
              <span className={`${styles.overviewValue} ${styles[getHealthStatus('database', 1)]}`}>
                {metrics.find(m => m.type === 'database')?.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.mainContent}>
        {/* Metrics Grid */}
        <div className={styles.metricsSection}>
          <h3>Performance Metrics</h3>
          <div className={styles.metricsGrid}>
            {metrics && metrics
              .filter(m => ['cpu', 'memory', 'disk', 'responseTime', 'errorRate'].includes(m.type))
              .map(renderMetricCard)
            }
          </div>
        </div>

        {/* Alerts Panel */}
        {showAlertsPanel && (
          <div className={styles.alertsSection}>
            <div className={styles.alertsHeader}>
              <h3>System Alerts</h3>
              <div className={styles.alertFilters}>
                <select
                  value={alertFilters.severity}
                  onChange={(e) => setAlertFilters(prev => ({ ...prev, severity: e.target.value }))}
                  className={styles.filterSelect}
                >
                  <option value="">All Severities</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
                
                <select
                  value={alertFilters.status}
                  onChange={(e) => setAlertFilters(prev => ({ ...prev, status: e.target.value }))}
                  className={styles.filterSelect}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            </div>
            
            <div className={styles.alertsList}>
              {filteredAlerts.length === 0 ? (
                <div className={styles.noAlerts}>No alerts found</div>
              ) : (
                filteredAlerts.map(renderAlert)
              )}
            </div>
          </div>
        )}
      </div>

      {/* Metric Detail Modal */}
      {renderMetricDetailModal()}
    </div>
  );
};

export default SystemHealthMonitor;