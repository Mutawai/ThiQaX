import React from 'react';

export const NotificationsSection = ({ config, handleChange }) => { return ( <div className="px-4 py-5 sm:px-6 border-b border-gray-200"> <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>

<div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
    <div className="sm:col-span-6">
      <fieldset>
        <legend className="text-base font-medium text-gray-900">Job Alerts</legend>
        <div className="mt-4 space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="jobAlertsEnabled"
                name="jobAlertsEnabled"
                type="checkbox"
                checked={config.notifications.jobAlerts.enabled}
                onChange={(e) => handleChange('notifications', 'jobAlerts', 'enabled', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="jobAlertsEnabled" className="font-medium text-gray-700">Enable job alerts</label>
            </div>
          </div>
          
          {/* Frequency selector */}
          {/* ... job alerts frequency options */}
        </div>
      </fieldset>
    </div>
    
    {/* Additional Notification sections */}
    {/* Verification Alerts, System Alerts */}
  </div>
</div>

); };

