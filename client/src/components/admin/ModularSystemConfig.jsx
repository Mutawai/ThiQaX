// client/src/components/admin/ModularSystemConfig.jsx
import React, { useState, useEffect } from 'react';
import { SecuritySection } from './config-sections/SecuritySection';
import { EmailSection } from './config-sections/EmailSection';
import { BlockchainSection } from './config-sections/BlockchainSection';
import { KycSection } from './config-sections/KycSection';
import { NotificationsSection } from './config-sections/NotificationsSection';

const ModularSystemConfig = ({ initialConfig, isLoading, isSaving, error, success, onSave, onClearError }) => {
  const [config, setConfig] = useState({
    security: {
      sessionTimeout: 30,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventPasswordReuse: 5
      },
      twoFactorAuth: {
        enabled: true,
        requiredForAdmins: true,
        requiredForAgents: false
      },
      rateLimiting: {
        enabled: true,
        maxAttempts: 5,
        timeWindow: 15
      }
    },
    email: {
      fromName: 'ThiQaX Platform',
      fromEmail: 'notifications@thiqax.com',
      smtpServer: 'smtp.example.com',
      smtpPort: 587,
      smtpUsername: 'smtp-user',
      smtpPassword: '********',
      useSSL: true
    },
    notifications: {
      jobAlerts: {
        enabled: true,
        frequency: 'daily'
      },
      verificationAlerts: {
        enabled: true,
        priority: 'high'
      },
      systemAlerts: {
        enabled: true,
        recipients: 'admin@thiqax.com'
      }
    },
    blockchain: {
      provider: 'ethereum',
      network: 'testnet',
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      apiKey: '********'
    },
    kyc: {
      provider: 'veriff',
      apiKey: '********',
      verificationLevel: 'medium',
      requiredDocuments: ['passport', 'national_id', 'address_proof']
    }
  });
  
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);
  
  const handleChange = (section, subsection, field, value) => {
    if (subsection) {
      setConfig(prevConfig => ({
        ...prevConfig,
        [section]: {
          ...prevConfig[section],
          [subsection]: {
            ...prevConfig[section][subsection],
            [field]: value
          }
        }
      }));
    } else {
      setConfig(prevConfig => ({
        ...prevConfig,
        [section]: {
          ...prevConfig[section],
          [field]: value
        }
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    onSave(config);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">System Configuration</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure system-wide settings for the ThiQaX platform.
          </p>
        </div>
        
        {error && (
          <div className="px-4 py-3 sm:px-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="px-4 py-3 sm:px-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Modular Section Components */}
          <SecuritySection config={config} handleChange={handleChange} />
          <EmailSection config={config} handleChange={handleChange} />
          <BlockchainSection config={config} handleChange={handleChange} />
          <KycSection config={config} handleChange={handleChange} />
          <NotificationsSection config={config} handleChange={handleChange} />
          
          {/* Form Buttons */}
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModularSystemConfig;