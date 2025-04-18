import React from 'react';
import { Link } from 'react-router-dom';

const ProfileCompletionCard = ({ completionPercentage }) => {
  return (
    <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Profile Completion</h3>
        <div className="mt-2">
          <div className="relative pt-1">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
              <div
                style={{ width: `${completionPercentage}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
              ></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold inline-block text-indigo-600">
                {completionPercentage}% Complete
              </span>
              {completionPercentage < 100 && (
                <Link
                  to="/profile/completion"
                  className="text-xs font-semibold inline-block text-indigo-600 hover:text-indigo-900"
                >
                  Complete Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionCard;