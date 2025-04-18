// dashboard/components/MetricsCards.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const MetricsCards = ({ metrics }) => {
  const metricsData = [
    {
      id: 'active-jobs',
      title: 'Active Jobs',
      value: metrics.activeJobs,
      link: '/sponsor/jobs',
      linkText: 'View all jobs'
    },
    {
      id: 'applications',
      title: 'Applications',
      value: metrics.applications,
      link: '/sponsor/applications',
      linkText: 'Review applications'
    },
    {
      id: 'hires',
      title: 'Active Hires',
      value: metrics.hires,
      link: '/sponsor/hires',
      linkText: 'Manage hired staff'
    },
    {
      id: 'profile-views',
      title: 'Profile Views',
      value: metrics.profileViews,
      link: '/sponsor/profile',
      linkText: 'Update company profile'
    }
  ];

  return (
    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {metricsData.map(metric => (
        <div key={metric.id} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {metric.title}
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {metric.value}
            </dd>
            <div className="mt-4">
              <Link
                to={metric.link}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
              >
                {metric.linkText} →
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;