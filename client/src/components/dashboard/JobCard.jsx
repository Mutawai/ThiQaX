import React from 'react';
import { Link } from 'react-router-dom';

const JobCard = ({ job }) => {
  return (
    <div className="py-4">
      <div className="flex justify-between">
        <div>
          <Link
            to={`/jobs/${job.id}`}
            className="text-base font-medium text-indigo-600 hover:text-indigo-900"
          >
            {job.title}
          </Link>
          <p className="mt-1 text-sm text-gray-500">
            {job.company} • {job.location}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {job.salary}
          </p>
        </div>
        <div className="flex items-start">
          <span className="text-xs text-gray-500">
            Posted {new Date(job.postedDate).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="mt-2 flex">
        <Link
          to={`/jobs/${job.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
        >
          View Details
        </Link>
        <span className="mx-2 text-gray-500">•</span>
        <Link
          to={`/jobs/${job.id}/apply`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
        >
          Apply Now
        </Link>
      </div>
    </div>
  );
};

export default JobCard;