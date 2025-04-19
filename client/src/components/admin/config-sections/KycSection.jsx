import React from 'react';

export const KycSection = ({ config, handleChange }) => { return ( <div className="px-4 py-5 sm:px-6 border-b border-gray-200"> <h3 className="text-lg font-medium text-gray-900">KYC Configuration</h3>

<div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
    <div className="sm:col-span-3">
      <label htmlFor="kycProvider" className="block text-sm font-medium text-gray-700">
        Provider
      </label>
      <select
        id="kycProvider"
        name="kycProvider"
        value={config.kyc.provider}
        onChange={(e) => handleChange('kyc', null, 'provider', e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="veriff">Veriff</option>
        <option value="jumio">Jumio</option>
        <option value="onfido">Onfido</option>
        <option value="sumsub">SumSub</option>
      </select>
    </div>
    
    {/* Additional KYC fields */}
    {/* Verification Level, API Key, Required Documents */}
  </div>
</div>

); };

