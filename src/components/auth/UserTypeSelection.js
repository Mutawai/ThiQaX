import React from 'react';
import { Link } from 'react-router-dom';

// User type card component
const UserTypeCard = ({ title, icon, description, value, selected, onClick }) => {
  return (
    <div
      className={`p-6 border rounded-lg cursor-pointer transition-all ${
        selected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
      }`}
      onClick={() => onClick(value)}
    >
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-full ${selected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
          {icon}
        </div>
        <h3 className="ml-4 text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

const UserTypeSelection = ({ selectedType, setSelectedType, onContinue }) => {
  // User type options
  const userTypes = [
    {
      value: 'jobSeeker',
      title: 'Job Seeker',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>,
      description: 'I am looking for job opportunities in the Middle East. I want to find legitimate offers and secure employment.',
    },
    {
      value: 'agent',
      title: 'Agent/Recruiter',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>,
      description: 'I connect job seekers with employers. I want to build trust with verified listings and transparent processes.',
    },
    {
      value: 'sponsor',
      title: 'Sponsor/Employer',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>,
      description: 'I am looking to hire qualified candidates. I want to find reliable workers through a secure and transparent platform.',
    },
  ];

  return (
    <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-2 text-2xl font-bold text-center text-gray-800">
        Choose your role
      </h2>
      <p className="mb-6 text-center text-gray-600">
        Select the option that best describes your role on ThiQaX
      </p>

      <div className="grid gap-4 mb-6 md:grid-cols-3">
        {userTypes.map((type) => (
          <UserTypeCard
            key={type.value}
            title={type.title}
            icon={type.icon}
            description={type.description}
            value={type.value}
            selected={selectedType === type.value}
            onClick={setSelectedType}
          />
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <Link
          to="/"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back to Home
        </Link>
        <button
          onClick={onContinue}
          disabled={!selectedType}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default UserTypeSelection;
