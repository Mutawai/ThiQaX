import React from 'react';

export const EmailSection = ({ config, handleChange }) => { return ( <div className="px-4 py-5 sm:px-6 border-b border-gray-200"> <h3 className="text-lg font-medium text-gray-900">Email Configuration</h3>

<div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
    <div className="sm:col-span-3">
      <label htmlFor="fromName" className="block text-sm font-medium text-gray-700">
        From Name
      </label>
      <input
        type="text"
        name="fromName"
        id="fromName"
        value={config.email.fromName}
        onChange={(e) => handleChange('email', null, 'fromName', e.target.value)}
        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
      />
    </div>
    
    <div className="sm:col-span-3">
      <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700">
        From Email
      </label>
      <input
        type="email"
        name="fromEmail"
        id="fromEmail"
        value={config.email.fromEmail}
        onChange={(e) => handleChange('email', null, 'fromEmail', e.target.value)}
        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
      />
    </div>
    
    {/* Additional Email fields */}
    {/* SMTP Server, Port, Username, Password, UseSSL checkbox */}
  </div>
</div>

); };

