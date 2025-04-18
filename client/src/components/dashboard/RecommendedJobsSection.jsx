import React from 'react';
import { Link } from 'react-router-dom';
import JobCard from './JobCard';

const RecommendedJobsSection = ({ jobs }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recommended Jobs</h3>
      </div>
      <div className="px-4 py-3 sm:px-6">
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No recommended jobs at the moment.</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
        <div className="mt-4 text-center">
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Browse All Jobs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecommendedJobsSection;