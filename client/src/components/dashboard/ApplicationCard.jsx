import React from 'react';
import { Link } from 'react-router-dom';

const ApplicationCard = ({ application }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'under_review':
        return 'Under Review';
      case 'shortlisted':
        return 'Shortlisted';
      case 'rejected':
        return 'Not Selected';
      default:
        return 'Applied';
    }
  };

  return (
    <div className="py-4">
      <div className="flex justify-between">
        <div>
          <Link
            to={`/jobs/${application.jobId}`}
            className="text-base font-medium text-indigo-600 hover:text-indigo-900"
          >
            {application.jobTitle}
          </Link>
          <p className="mt-1 text-sm text-gray-500">
            {application.company}
          </p>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(application.status)}`}>
              {getStatusText(application.status)}
            </span>
          </div>
        </div>
        <div className="flex items-start">
          <span className="text-xs text-gray-500">
            Applied {new Date(application.appliedDate).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="mt-2 flex">
        <Link
          to={`/applications/${application.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
        >
          View Application
        </Link>
      </div>
    </div>
  );
};

export default ApplicationCard;