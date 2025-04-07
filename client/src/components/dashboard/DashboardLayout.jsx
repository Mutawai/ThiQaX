// src/components/dashboard/DashboardLayout.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Sidebar, NotificationCenter, Header } from '../layout';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-content">
        <Sidebar />
        <main className="dashboard-main">
          {children}
        </main>
        <NotificationCenter />
      </div>
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired
};

export default DashboardLayout;

// src/components/dashboard/VerificationStatus.jsx
import React from 'react';
import PropTypes from 'prop-types';

const statusStyles = {
  PENDING: {
    color: '#FFA500',
    icon: 'clock',
    text: 'Pending Verification'
  },
  VERIFIED: {
    color: '#4CAF50',
    icon: 'check-circle',
    text: 'Verified'
  },
  REJECTED: {
    color: '#F44336',
    icon: 'x-circle',
    text: 'Verification Failed'
  },
  EXPIRED: {
    color: '#607D8B',
    icon: 'alert-circle',
    text: 'Expired'
  }
};

const VerificationStatus = ({ status, showText = true }) => {
  const currentStatus = statusStyles[status] || statusStyles.PENDING;
  
  return (
    <div className="verification-status" style={{ color: currentStatus.color }}>
      <i className={`icon-${currentStatus.icon}`}></i>
      {showText && <span className="status-text">{currentStatus.text}</span>}
    </div>
  );
};

VerificationStatus.propTypes = {
  status: PropTypes.oneOf(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED']).isRequired,
  showText: PropTypes.bool
};

export default VerificationStatus;

// src/components/dashboard/StatCard.jsx
import React from 'react';
import PropTypes from 'prop-types';

const StatCard = ({ title, value, icon, trend, trendValue, color = 'primary' }) => {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon">
        <i className={`icon-${icon}`}></i>
      </div>
      <div className="stat-card__content">
        <h3 className="stat-card__title">{title}</h3>
        <div className="stat-card__value">{value}</div>
        {trend && (
          <div className={`stat-card__trend stat-card__trend--${trend}`}>
            <i className={`icon-arrow-${trend === 'up' ? 'up' : 'down'}`}></i>
            <span>{trendValue}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(['up', 'down']),
  trendValue: PropTypes.number,
  color: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info'])
};

export default StatCard;

// src/components/dashboard/index.js
export { default as DashboardLayout } from './DashboardLayout';
export { default as VerificationStatus } from './VerificationStatus';
export { default as StatCard } from './StatCard';
