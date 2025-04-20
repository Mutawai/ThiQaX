import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styles from './SystemConfigEditor.module.css';

const SystemConfigEditor = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [config, setConfig] = useState({});
  const [activeSection, setActiveSection] = useState('security');
  const [unsavedChanges, setUnsavedChanges] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showRestartWarning, setShowRestartWarning] = useState(false);
  
  const dispatch = useDispatch();
  
  // In a real implementation, this would come from Redux state
  const user = useSelector(state => state.auth?.user || {});
  
  // Define config sections and their fields
  const configSections = {
    security: {
      title: 'Security Settings',
      description: 'Configure security-related settings for the platform',
      fields: [
        {
          id: 'security.maxLoginAttempts',
          label: 'Maximum Login Attempts',
          type: 'number',
          description: 'Number of failed login attempts before account is locked',
          min: 1,
          max: 10,
          requiresRestart: false
        },
        {
          id: 'security.lockoutDuration',
          label: 'Account Lockout Duration (minutes)',
          type: 'number',
          description: 'Time period an account remains locked after exceeding max login attempts',
          min: 5,
          max: 1440,
          requiresRestart: false
        },
        {
          id: 'security.passwordExpiryDays',
          label: 'Password Expiry (days)',
          type: 'number',
          description: 'Number of days after which passwords must be changed',
          min: 30,
          max: 365,
          requiresRestart: false
        },
        {
          id: 'security.sessionTimeout',
          label: 'Session Timeout (minutes)',
          type: 'number',
          description: 'Time of inactivity after which users are automatically logged out',
          min: 5,
          max: 1440,
          requiresRestart: false
        },
        {
          id: 'security.enableMFA',
          label: 'Enable Multi-Factor Authentication',
          type: 'checkbox',
          description: 'Require two-factor authentication for all user logins',
          requiresRestart: true
        },
        {
          id: 'security.enforceStrongPasswords',
          label: 'Enforce Strong Passwords',
          type: 'checkbox',
          description: 'Require passwords to meet complexity requirements',
          requiresRestart: false
        }
      ]
    },
    email: {
      title: 'Email Configuration',
      description: 'Configure email service settings',
      fields: [
        {
          id: 'email.smtpServer',
          label: 'SMTP Server',
          type: 'text',
          description: 'SMTP server for sending emails',
          requiresRestart: true
        },
        {
          id: 'email.smtpPort',
          label: 'SMTP Port',
          type: 'number',
          description: 'Port for SMTP server',
          min: 1,
          max: 65535,
          requiresRestart: true
        },
        {
          id: 'email.smtpUsername',
          label: 'SMTP Username',
          type: 'text',
          description: 'Username for SMTP authentication',
          requiresRestart: true
        },
        {
          id: 'email.smtpPassword',
          label: 'SMTP Password',
          type: 'password',
          description: 'Password for SMTP authentication',
          requiresRestart: true
        },
        {
          id: 'email.fromAddress',
          label: 'From Email Address',
          type: 'email',
          description: 'Email address used as sender for all platform emails',
          requiresRestart: false
        },
        {
          id: 'email.enableSSL',
          label: 'Enable SSL/TLS',
          type: 'checkbox',
          description: 'Use SSL/TLS for SMTP connection',
          requiresRestart: true
        }
      ]
    },
    verification: {
      title: 'Verification Settings',
      description: 'Configure document verification workflow settings',
      fields: [
        {
          id: 'verification.requireAdminApproval',
          label: 'Require Admin Approval',
          type: 'checkbox',
          description: 'All verifications must be approved by an admin user',
          requiresRestart: false
        },
        {
          id: 'verification.enableAIVerification',
          label: 'Enable AI Verification',
          type: 'checkbox',
          description: 'Use AI to assist with document verification',
          requiresRestart: true
        },
        {
          id: 'verification.documentExpiryWarningDays',
          label: 'Document Expiry Warning (days)',
          type: 'number',
          description: 'Days before document expiry to send notification',
          min: 1,
          max: 90,
          requiresRestart: false
        },
        {
          id: 'verification.maxVerificationAttempts',
          label: 'Maximum Verification Attempts',
          type: 'number',
          description: 'Number of attempts allowed for document verification',
          min: 1,
          max: 10,
          requiresRestart: false
        },
        {
          id: 'verification.documentRetentionDays',
          label: 'Document Retention Period (days)',
          type: 'number',
          description: 'Number of days to retain documents after job completion',
          min: 30,
          max: 3650,
          requiresRestart: false
        }
      ]
    },
    payments: {
      title: 'Payment Settings',
      description: 'Configure payment processing and escrow settings',
      fields: [
        {
          id: 'payments.paymentGateway',
          label: 'Payment Gateway',
          type: 'select',
          options: [
            { value: 'stripe', label: 'Stripe' },
            { value: 'paypal', label: 'PayPal' },
            { value: 'mpesa', label: 'M-Pesa' }
          ],
          description: 'Payment processing service to use',
          requiresRestart: true
        },
        {
          id: 'payments.platformFeePercentage',
          label: 'Platform Fee (%)',
          type: 'number',
          description: 'Percentage fee charged by the platform for each transaction',
          min: 0,
          max: 20,
          step: 0.1,
          requiresRestart: false
        },
        {
          id: 'payments.minimumWithdrawalAmount',
          label: 'Minimum Withdrawal Amount',
          type: 'number',
          description: 'Minimum amount that can be withdrawn from the platform',
          min: 0,
          requiresRestart: false
        },
        {
          id: 'payments.escrowReleaseDays',
          label: 'Escrow Release Period (days)',
          type: 'number',
          description: 'Days after job completion to automatically release escrow payment',
          min: 1,
          max: 30,
          requiresRestart: false
        },
        {
          id: 'payments.enableAutomaticPayouts',
          label: 'Enable Automatic Payouts',
          type: 'checkbox',
          description: 'Automatically process payouts when conditions are met',
          requiresRestart: false
        }
      ]
    },
    system: {
      title: 'System Settings',
      description: 'Configure general system settings',
      fields: [
        {
          id: 'system.maintenanceMode',
          label: 'Maintenance Mode',
          type: 'checkbox',
          description: 'Put the system in maintenance mode (only admins can access)',
          requiresRestart: false
        },
        {
          id: 'system.debugMode',
          label: 'Debug Mode',
          type: 'checkbox',
          description: 'Enable detailed logging and debugging information',
          requiresRestart: true
        },
        {
          id: 'system.logRetentionDays',
          label: 'Log Retention Period (days)',
          type: 'number',
          description: 'Number of days to retain system logs',
          min: 7,
          max: 365,
          requiresRestart: false
        },
        {
          id: 'system.backupFrequency',
          label: 'Backup Frequency',
          type: 'select',
          options: [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' }
          ],
          description: 'How often to perform system backups',
          requiresRestart: false
        },
        {
          id: 'system.maxFileUploadSize',
          label: 'Maximum File Upload Size (MB)',
          type: 'number',
          description: 'Maximum size allowed for file uploads',
          min: 1,
          max: 50,
          requiresRestart: false
        }
      ]
    }
  };
  
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // In production, dispatch action to fetch config
        // Example: await dispatch(fetchSystemConfig());
        
        // Simulate API call with mock data
        setTimeout(() => {
          const mockConfig = {
            'security.maxLoginAttempts': 5,
            'security.lockoutDuration': 30,
            'security.passwordExpiryDays': 90,
            'security.sessionTimeout': 30,
            'security.enableMFA': true,
            'security.enforceStrongPasswords': true,
            
            'email.smtpServer': 'smtp.example.com',
            'email.smtpPort': 587,
            'email.smtpUsername': 'noreply@thiqax.com',
            'email.smtpPassword': '*********',
            'email.fromAddress': 'noreply@thiqax.com',
            'email.enableSSL': true,
            
            'verification.requireAdminApproval': true,
            'verification.enableAIVerification': true,
            'verification.documentExpiryWarningDays': 30,
            'verification.maxVerificationAttempts': 3,
            'verification.documentRetentionDays': 365,
            
            'payments.paymentGateway': 'mpesa',
            'payments.platformFeePercentage': 5,
            'payments.minimumWithdrawalAmount': 100,
            'payments.escrowReleaseDays': 14,
            'payments.enableAutomaticPayouts': true,
            
            'system.maintenanceMode': false,
            'system.debugMode': false,
            'system.logRetentionDays': 90,
            'system.backupFrequency': 'daily',
            'system.maxFileUploadSize': 10
          };
          
          setConfig(mockConfig);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError(err.message || 'Failed to load system configuration');
        setIsLoading(false);
      }
    };
    
    fetchConfig();
  }, [dispatch]);
  
  const handleInputChange = (fieldId, value) => {
    // Check if the field requires a restart
    const section = Object.values(configSections).find(section => 
      section.fields.some(field => field.id === fieldId)
    );
    
    const field = section?.fields.find(field => field.id === fieldId);
    
    if (field?.requiresRestart) {
      setShowRestartWarning(true);
    }
    
    setUnsavedChanges({
      ...unsavedChanges,
      [fieldId]: value
    });
  };
  
  const saveChanges = async () => {
    if (Object.keys(unsavedChanges).length === 0) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // In production, dispatch action to save config
      // Example: await dispatch(saveSystemConfig(unsavedChanges));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update config with unsaved changes
      setConfig({
        ...config,
        ...unsavedChanges
      });
      
      // Clear unsaved changes
      setUnsavedChanges({});
      
      // Show success message
      alert('Configuration saved successfully');
    } catch (err) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };
  
  const discardChanges = () => {
    setUnsavedChanges({});
    setShowRestartWarning(false);
  };
  
  const renderField = (field) => {
    const value = unsavedChanges[field.id] !== undefined 
      ? unsavedChanges[field.id] 
      : config[field.id];
    
    const hasChange = unsavedChanges[field.id] !== undefined;
    
    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={field.type}
            id={field.id}
            value={value || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border ${hasChange ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
        );
      case 'password':
        return (
          <input
            type="password"
            id={field.id}
            value={value || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border ${hasChange ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            id={field.id}
            value={value || ''}
            min={field.min}
            max={field.max}
            step={field.step || 1}
            onChange={(e) => handleInputChange(field.id, Number(e.target.value))}
            className={`w-full px-3 py-2 border ${hasChange ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            id={field.id}
            checked={value || false}
            onChange={(e) => handleInputChange(field.id, e.target.checked)}
            className={`h-4 w-4 ${hasChange ? 'text-indigo-400 border-indigo-300 bg-indigo-50' : 'text-indigo-600 border-gray-300'} rounded focus:ring-indigo-500`}
          />
        );
      case 'select':
        return (
          <select
            id={field.id}
            value={value || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border ${hasChange ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          >
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">System Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">
          Modify system settings and configuration parameters
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar navigation */}
          <div className="col-span-12 md:col-span-3">
            <nav className="space-y-1" aria-label="Configuration Sections">
              {Object.entries(configSections).map(([key, section]) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeSection === key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Config section content */}
          <div className="col-span-12 md:col-span-9">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {configSections[activeSection].title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {configSections[activeSection].description}
                </p>
                
                <div className="mt-6 space-y-6">
                  {configSections[activeSection].fields.map(field => (
                    <div key={field.id} className={field.type === 'checkbox' ? 'flex items-start' : ''}>
                      <div className={field.type === 'checkbox' ? 'flex items-center h-5' : 'mb-1'}>
                        {field.type === 'checkbox' && renderField(field)}
                      </div>
                      <div className={field.type === 'checkbox' ? 'ml-3' : ''}>
                        <label 
                          htmlFor={field.id} 
                          className="block text-sm font-medium text-gray-700"
                        >
                          {field.label}
                          {field.requiresRestart && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Requires Restart
                            </span>
                          )}
                        </label>
                        <p className="text-sm text-gray-500">{field.description}</p>
                        {field.type !== 'checkbox' && (
                          <div className="mt-1">
                            {renderField(field)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        {Object.keys(unsavedChanges).length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={discardChanges}
              className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={saveChanges}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}
        
        {/* Restart warning */}
        {showRestartWarning && (
          <div className="mt-6 rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Restart Required</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Some of the changes you are making will require a system restart to take effect.
                    The system will automatically restart after saving these changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemConfigEditor;