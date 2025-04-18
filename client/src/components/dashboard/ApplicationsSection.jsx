import React from 'react';
import { Link } from 'react-router-dom';
import ApplicationCard from './ApplicationCard';

const ApplicationsSection = ({ applications }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Your Applications</h3>
      </div>
      <div className="px-4 py-3 sm:px-6">
        {applications.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">You haven't applied to any jobs yet.</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {applications.map(application => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
        <div className="mt-4 text-center">
          <Link
            to="/applications"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View All Applications
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsSection;