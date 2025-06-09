// client/src/components/integration/SystemHealthMonitor/SystemHealthMonitor.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import SystemHealthMonitor from './SystemHealthMonitor';
import * as systemActions from '../../../redux/actions/systemActions';
import integrationService from '../../../services/integrationService';

// Mock dependencies
jest.mock('../../../redux/actions/systemActions');
jest.mock('../../../services/integrationService');

const mockStore = configureStore([thunk]);

// Mock system metrics data
const mockMetrics = [
  {
    type: 'cpu',
    label: 'CPU Usage',
    value: 45,
    lastUpdated: '2025-04-19T10:00:00Z',
    trend: { direction: 'up', percentage: 5 },
    history: [
      { timestamp: '2025-04-19T09:00:00Z', value: 40 },
      { timestamp: '2025-04-19T09:30:00Z', value: 42 },
      { timestamp: '2025-04-19T10:00:00Z', value: 45 }
    ]
  },
  {
    type: 'memory',
    label: 'Memory Usage',
    value: 78,
    lastUpdated: '2025-04-19T10:00:00Z',
    trend: { direction: 'stable', percentage: 0 }
  },
  {
    type: 'disk',
    label: 'Disk Usage',
    value: 92,
    lastUpdated: '2025-04-19T10:00:00Z',
    trend: { direction: 'up', percentage: 3 }
  },
  {
    type: 'responseTime',
    label: 'Response Time',
    value: 245,
    lastUpdated: '2025-04-19T10:00:00Z',
    trend: { direction: 'down', percentage: 8 }
  },
  {
    type: 'uptime',
    label: 'System Uptime',
    value: 2592000, // 30 days in seconds
    lastUpdated: '2025-04-19T10:00:00Z'
  },
  {
    type: 'activeUsers',
    label: 'Active Users',
    value: 127,
    lastUpdated: '2025-04-19T10:00:00Z'
  }
];

const mockAlerts = [
  {
    id: 'alert1',
    severity: 'critical',
    status: 'active',
    category: 'performance',
    title: 'High Disk Usage',
    description: 'Disk usage is above 90% threshold',
    recommendations: ['Clear temporary files', 'Archive old logs'],
    createdAt: '2025-04-19T09:45:00Z'
  },
  {
    id: 'alert2',
    severity: 'warning',
    status: 'acknowledged',
    category: 'memory',
    title: 'Memory Usage Warning',
    description: 'Memory usage approaching 80% threshold',
    recommendations: ['Monitor memory consumption', 'Consider scaling'],
    createdAt: '2025-04-19T09:30:00Z'
  }
];

// Initial store state
const initialState = {
  system: {
    metrics: mockMetrics,
    alerts: mockAlerts,
    loading: false,
    error: null,
    lastUpdated: '2025-04-19T10:00:00Z'
  },
  auth: {
    user: {
      id: 'admin1',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@example.com'
    },
    token: 'mock-token'
  }
};

// Wrapper component with providers
const renderWithProviders = (component, store = mockStore(initialState)) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('SystemHealthMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redux actions
    systemActions.fetchSystemMetrics = jest.fn().mockReturnValue(
      Promise.resolve({ type: 'FETCH_SYSTEM_METRICS_SUCCESS' })
    );
    systemActions.fetchSystemAlerts = jest.fn().mockReturnValue(
      Promise.resolve({ type: 'FETCH_SYSTEM_ALERTS_SUCCESS' })
    );
    systemActions.updateAlertStatus = jest.fn().mockReturnValue(
      Promise.resolve({ type: 'UPDATE_ALERT_STATUS_SUCCESS' })
    );

    // Mock integration service
    integrationService.logAuditEvent = jest.fn().mockResolvedValue({});

    // Mock timers for auto-refresh
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders system health monitor with title and overall status', () => {
      renderWithProviders(<SystemHealthMonitor />);

      expect(screen.getByText('System Health Monitor')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument(); // Overall status should be warning due to high disk
    });

    test('renders system overview with uptime and active users', () => {
      renderWithProviders(<SystemHealthMonitor />);

      expect(screen.getByText('System Overview')).toBeInTheDocument();
      expect(screen.getByText('30d 0h 0m')).toBeInTheDocument(); // Formatted uptime
      expect(screen.getByText('127')).toBeInTheDocument(); // Active users
    });

    test('renders performance metrics cards', () => {
      renderWithProviders(<SystemHealthMonitor />);

      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Disk Usage')).toBeInTheDocument();
      expect(screen.getByText('Response Time')).toBeInTheDocument();
    });

    test('displays loading state when loading is true', () => {
      const loadingState = {
        ...initialState,
        system: {
          ...initialState.system,
          loading: true,
          metrics: null
        }
      };

      renderWithProviders(<SystemHealthMonitor />, mockStore(loadingState));

      expect(screen.getByText('Loading system health data...')).toBeInTheDocument();
    });

    test('displays error message when error exists', () => {
      const errorState = {
        ...initialState,
        system: {
          ...initialState.system,
          error: 'Failed to load system metrics'
        }
      };

      renderWithProviders(<SystemHealthMonitor />, mockStore(errorState));

      expect(screen.getByText('Failed to load system metrics')).toBeInTheDocument();
    });
  });

  describe('Metric Status Calculation', () => {
    test('displays correct status for healthy metrics', () => {
      renderWithProviders(<SystemHealthMonitor />);

      // CPU at 45% should be healthy
      const cpuCard = screen.getByText('CPU Usage').closest('.metricCard');
      expect(cpuCard).toHaveClass('statusHealthy');
    });

    test('displays correct status for warning metrics', () => {
      renderWithProviders(<SystemHealthMonitor />);

      // Memory at 78% should be warning (threshold is 80%)
      const memoryCard = screen.getByText('Memory Usage').closest('.metricCard');
      expect(memoryCard).toHaveClass('statusWarning');
    });

    test('displays correct status for critical metrics', () => {
      renderWithProviders(<SystemHealthMonitor />);

      // Disk at 92% should be critical (threshold is 95%)
      const diskCard = screen.getByText('Disk Usage').closest('.metricCard');
      expect(diskCard).toHaveClass('statusCritical');
    });
  });

  describe('Auto-refresh Functionality', () => {
    test('enables auto-refresh by default', () => {
      renderWithProviders(<SystemHealthMonitor />);

      const autoRefreshCheckbox = screen.getByRole('checkbox');
      expect(autoRefreshCheckbox).toBeChecked();
    });

    test('refreshes data when auto-refresh is enabled', async () => {
      renderWithProviders(<SystemHealthMonitor />);

      // Fast-forward time to trigger auto-refresh
      jest.advanceTimersByTime(30000); // 30 seconds

      await waitFor(() => {
        expect(systemActions.fetchSystemMetrics).toHaveBeenCalledTimes(2); // Initial + auto-refresh
        expect(systemActions.fetchSystemAlerts).toHaveBeenCalledTimes(2);
      });
    });

    test('stops auto-refresh when checkbox is unchecked', async () => {
      renderWithProviders(<SystemHealthMonitor />);

      const autoRefreshCheckbox = screen.getByRole('checkbox');
      fireEvent.click(autoRefreshCheckbox);

      // Fast-forward time
      jest.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(systemActions.fetchSystemMetrics).toHaveBeenCalledTimes(1); // Only initial
      });
    });

    test('changes refresh interval when dropdown changes', () => {
      renderWithProviders(<SystemHealthMonitor />);

      const intervalSelect = screen.getByDisplayValue('30s');
      fireEvent.change(intervalSelect, { target: { value: '60' } });

      expect(intervalSelect.value).toBe('60');
    });
  });

  describe('Manual Refresh', () => {
    test('refreshes data when refresh button is clicked', async () => {
      renderWithProviders(<SystemHealthMonitor />);

      const refreshButton = screen.getByText('Refresh Now');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(systemActions.fetchSystemMetrics).toHaveBeenCalledTimes(2); // Initial + manual
        expect(systemActions.fetchSystemAlerts).toHaveBeenCalledTimes(2);
      });
    });

    test('shows loading state during manual refresh', async () => {
      const loadingState = {
        ...initialState,
        system: {
          ...initialState.system,
          loading: true
        }
      };

      renderWithProviders(<SystemHealthMonitor />, mockStore(loadingState));

      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });
  });

  describe('Alerts Panel', () => {
    test('shows alerts panel when alerts button is clicked', () => {
      renderWithProviders(<SystemHealthMonitor />);

      const alertsButton = screen.getByText('Alerts (2)');
      fireEvent.click(alertsButton);

      expect(screen.getByText('System Alerts')).toBeInTheDocument();
      expect(screen.getByText('High Disk Usage')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage Warning')).toBeInTheDocument();
    });

    test('filters alerts by severity', async () => {
      renderWithProviders(<SystemHealthMonitor />);

      const alertsButton = screen.getByText('Alerts (2)');
      fireEvent.click(alertsButton);

      const severitySelect = screen.getByDisplayValue('All Severities');
      fireEvent.change(severitySelect, { target: { value: 'critical' } });

      await waitFor(() => {
        expect(systemActions.fetchSystemAlerts).toHaveBeenCalledWith({
          severity: 'critical',
          status: 'active',
          category: ''
        });
      });
    });

    test('acknowledges alert when acknowledge button is clicked', async () => {
      renderWithProviders(<SystemHealthMonitor />);

      const alertsButton = screen.getByText('Alerts (2)');
      fireEvent.click(alertsButton);

      const acknowledgeButtons = screen.getAllByText('Acknowledge');
      fireEvent.click(acknowledgeButtons[0]);

      await waitFor(() => {
        expect(systemActions.updateAlertStatus).toHaveBeenCalledWith('alert1', 'acknowledged');
      });

      expect(integrationService.logAuditEvent).toHaveBeenCalledWith({
        action: 'ALERT_ACKNOWLEDGED',
        details: {
          alertId: 'alert1',
          acknowledgedBy: 'admin1'
        }
      });
    });

    test('dismisses alert when dismiss button is clicked', async () => {
      renderWithProviders(<SystemHealthMonitor />);

      const alertsButton = screen.getByText('Alerts (2)');
      fireEvent.click(alertsButton);

      const dismissButtons = screen.getAllByText('Dismiss');
      fireEvent.click(dismissButtons[0]);

      await waitFor(() => {
        expect(systemActions.updateAlertStatus).toHaveBeenCalledWith('alert1', 'dismissed');
      });

      expect(integrationService.logAuditEvent).toHaveBeenCalledWith({
        action: 'ALERT_DISMISSED',
        details: {
          alertId: 'alert1',
          dismissedBy: 'admin1'
        }
      });
    });
  });

  describe('Metric Detail Modal', () => {
    test('opens metric detail modal when metric card is clicked', () => {
      renderWithProviders(<SystemHealthMonitor />);

      const cpuCard = screen.getByText('CPU Usage').closest('.metricCard');
      fireEvent.click(cpuCard);

      expect(screen.getByText('CPU Usage Details')).toBeInTheDocument();
      expect(screen.getByText('Current Value:')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    test('displays metric history in modal when available', () => {
      renderWithProviders(<SystemHealthMonitor />);

      const cpuCard = screen.getByText('CPU Usage').closest('.metricCard');
      fireEvent.click(cpuCard);

      expect(screen.getByText('Recent History (Last 24h)')).toBeInTheDocument();
    });

    test('closes modal when close button is clicked', () => {
      renderWithProviders(<SystemHealthMonitor />);

      const cpuCard = screen.getByText('CPU Usage').closest('.metricCard');
      fireEvent.click(cpuCard);

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(screen.queryByText('CPU Usage Details')).not.toBeInTheDocument();
    });

    test('closes modal when close modal button is clicked', () => {
      renderWithProviders(<SystemHealthMonitor />);

      const cpuCard = screen.getByText('CPU Usage').closest('.metricCard');
      fireEvent.click(cpuCard);

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByText('CPU Usage Details')).not.toBeInTheDocument();
    });
  });

  describe('Overall Health Status', () => {
    test('shows critical status when any metric is critical', () => {
      renderWithProviders(<SystemHealthMonitor />);

      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    test('shows warning status when no critical but warning metrics exist', () => {
      const warningState = {
        ...initialState,
        system: {
          ...initialState.system,
          metrics: mockMetrics.map(m => 
            m.type === 'disk' ? { ...m, value: 75 } : m // Reduce disk to non-critical
          )
        }
      };

      renderWithProviders(<SystemHealthMonitor />, mockStore(warningState));

      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    test('shows healthy status when all metrics are healthy', () => {
      const healthyState = {
        ...initialState,
        system: {
          ...initialState.system,
          metrics: mockMetrics.map(m => ({
            ...m,
            value: m.type === 'disk' ? 60 : m.type === 'memory' ? 50 : m.value
          }))
        }
      };

      renderWithProviders(<SystemHealthMonitor />, mockStore(healthyState));

      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });
  });

  describe('Uptime Formatting', () => {
    test('formats uptime correctly for days', () => {
      renderWithProviders(<SystemHealthMonitor />);

      expect(screen.getByText('30d 0h 0m')).toBeInTheDocument();
    });

    test('formats uptime correctly for hours', () => {
      const hourState = {
        ...initialState,
        system: {
          ...initialState.system,
          metrics: mockMetrics.map(m => 
            m.type === 'uptime' ? { ...m, value: 7200 } : m // 2 hours
          )
        }
      };

      renderWithProviders(<SystemHealthMonitor />, mockStore(hourState));

      expect(screen.getByText('2h 0m')).toBeInTheDocument();
    });
  });

  describe('Trend Indicators', () => {
    test('displays trend indicators for metrics with trend data', () => {
      renderWithProviders(<SystemHealthMonitor />);

      // CPU has upward trend
      const cpuCard = screen.getByText('CPU Usage').closest('.metricCard');
      expect(within(cpuCard).getByText('↗5%')).toBeInTheDocument();

      // Response time has downward trend
      const responseCard = screen.getByText('Response Time').closest('.metricCard');
      expect(within(responseCard).getByText('↘8%')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles system data fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      systemActions.fetchSystemMetrics.mockRejectedValue(new Error('Fetch failed'));

      renderWithProviders(<SystemHealthMonitor />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load system data:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    test('handles alert acknowledgment error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      systemActions.updateAlertStatus.mockRejectedValue(new Error('Update failed'));

      renderWithProviders(<SystemHealthMonitor />);

      const alertsButton = screen.getByText('Alerts (2)');
      fireEvent.click(alertsButton);

      const acknowledgeButtons = screen.getAllByText('Acknowledge');
      fireEvent.click(acknowledgeButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to acknowledge alert:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Component Cleanup', () => {
    test('clears auto-refresh interval on unmount', () => {
      const { unmount } = renderWithProviders(<SystemHealthMonitor />);

      unmount();

      // Verify no more auto-refresh after unmount
      jest.advanceTimersByTime(60000);
      expect(systemActions.fetchSystemMetrics).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for form controls', () => {
      renderWithProviders(<SystemHealthMonitor />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });

    test('modal is properly accessible', () => {
      renderWithProviders(<SystemHealthMonitor />);

      const cpuCard = screen.getByText('CPU Usage').closest('.metricCard');
      fireEvent.click(cpuCard);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Last Updated Display', () => {
    test('displays last updated timestamp', () => {
      renderWithProviders(<SystemHealthMonitor />);

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Alert Count Badge', () => {
    test('shows correct alert count in button', () => {
      renderWithProviders(<SystemHealthMonitor />);

      expect(screen.getByText('Alerts (2)')).toBeInTheDocument();
    });

    test('updates alert count when filters change', async () => {
      renderWithProviders(<SystemHealthMonitor />);

      const alertsButton = screen.getByText('Alerts (2)');
      fireEvent.click(alertsButton);

      const statusSelect = screen.getByDisplayValue('All Statuses');
      fireEvent.change(statusSelect, { target: { value: 'active' } });

      // Should only show active alerts (1 alert)
      expect(screen.getByText('High Disk Usage')).toBeInTheDocument();
      expect(screen.queryByText('Memory Usage Warning')).not.toBeInTheDocument();
    });
  });
});