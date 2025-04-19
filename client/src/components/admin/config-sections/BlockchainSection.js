import React from 'react';

export const BlockchainSection = ({ config, handleChange }) => { return ( <div className="px-4 py-5 sm:px-6 border-b border-gray-200"> <h3 className="text-lg font-medium text-gray-900">Blockchain Configuration</h3>

<div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
    <div className="sm:col-span-3">
      <label htmlFor="blockchainProvider" className="block text-sm font-medium text-gray-700">
        Provider
      </label>
      <select
        id="blockchainProvider"
        name="blockchainProvider"
        value={config.blockchain.provider}
        onChange={(e) => handleChange('blockchain', null, 'provider', e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="ethereum">Ethereum</option>
        <option value="hyperledger">Hyperledger</option>
        <option value="polygon">Polygon</option>
        <option value="binance">Binance Smart Chain</option>
      </select>
    </div>
    
    {/* Additional Blockchain fields */}
    {/* Network, Contract Address, API Key */}
  </div>
</div>

); };

