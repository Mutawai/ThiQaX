import React from 'react';
import { Link } from 'react-router-dom';

const KYCVerificationCard = ({ status }) => {
  return (
    <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">KYC Verification</h3>
        <div className="mt-2">
          {status === 'verified' ? (
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 text-sm text-green-700">Verified</span>
            </div>
          ) : status === 'pending' ? (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-sm text-yellow-700">Pending Verification</span>
              </div>
              <Link
                to="/verification"
                className="text-xs font-semibold inline-block text-indigo-600 hover:text-indigo-900"
              >
                Start Verification
              </Link>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-sm text-red-700">Not Verified</span>
              </div>
              <Link
                to="/verification"
                className="text-xs font-semibold inline-block text-indigo-600 hover:text-indigo-900"
              >
                Complete Verification
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCVerificationCard;