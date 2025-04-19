import React from 'react';

export const SecuritySection = ({ config, handleChange }) => { return ( <div className="px-4 py-5 sm:px-6 border-b border-gray-200"> <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>

<div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
    <div className="sm:col-span-2">
      <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
        Session Timeout (minutes)
      </label>
      <select
        id="sessionTimeout"
        name="sessionTimeout"
        value={config.security.sessionTimeout}
        onChange={(e) => handleChange('security', null, 'sessionTimeout', parseInt(e.target.value))}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value={15}>15 minutes</option>
        <option value={30}>30 minutes</option>
        <option value={60}>1 hour</option>
        <option value={120}>2 hours</option>
        <option value={240}>4 hours</option>
      </select>
    </div>
    
    <div className="sm:col-span-4"></div>
    
    {/* Password Policy Fieldset */}
    <div className="sm:col-span-6">
      <fieldset>
        <legend className="text-base font-medium text-gray-900">Password Policy</legend>
        <div className="mt-4 space-y-4">
          {/* Password Policy Options */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="requireUppercase"
                name="requireUppercase"
                type="checkbox"
                checked={config.security.passwordPolicy.requireUppercase}
                onChange={(e) => handleChange('security', 'passwordPolicy', 'requireUppercase', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="requireUppercase" className="font-medium text-gray-700">Require uppercase letters</label>
            </div>
          </div>
          
          {/* More password policy options */}
          {/* ... similar options for lowercase, numbers, special chars */}
        </div>
      </fieldset>
    </div>
    
    {/* Two-Factor Authentication Fieldset */}
    <div className="sm:col-span-6">
      <fieldset>
        <legend className="text-base font-medium text-gray-900">Two-Factor Authentication</legend>
        <div className="mt-4 space-y-4">
          {/* 2FA Options */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="twoFactorEnabled"
                name="twoFactorEnabled"
                type="checkbox"
                checked={config.security.twoFactorAuth.enabled}
                onChange={(e) => handleChange('security', 'twoFactorAuth', 'enabled', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="twoFactorEnabled" className="font-medium text-gray-700">Enable two-factor authentication</label>
            </div>
          </div>
          
          {/* More 2FA options */}
          {/* ... similar options for required for admins, required for agents */}
        </div>
      </fieldset>
    </div>
    
    {/* Rate Limiting Fieldset */}
    <div className="sm:col-span-6">
      <fieldset>
        <legend className="text-base font-medium text-gray-900">Rate Limiting</legend>
        <div className="mt-4 space-y-4">
          {/* Rate limiting options */}
          {/* ... options for rate limiting */}
        </div>
      </fieldset>
    </div>
  </div>
</div>

); };

