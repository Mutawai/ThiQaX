import React from 'react';
import { Link } from 'react-router-dom';

const ApplicationStatusCard = ({ applicationsCount }) => {
  return (
    <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Applications</h3>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            {applicationsCount === 0
              ? 'No active applications'
              : `You have ${applicationsCount} active application(s)`}
          </p>
          <Link
            to="/applications"
            className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-900"
          >
            View All Applications
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatusCard;