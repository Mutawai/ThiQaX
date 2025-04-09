import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const KYCVerification = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [identityDoc, setIdentityDoc] = useState(null);
  const [addressDoc, setAddressDoc] = useState(null);
  const navigate = useNavigate();
  const { updateProfile } = useAuth();

  // Document types for identity verification
  const identityDocTypes = [
    { value: 'passport', label: 'Passport' },
    { value: 'nationalId', label: 'National ID' },
    { value: 'driverLicense', label: 'Driver\'s License' }
  ];

  // Document types for address verification
  const addressDocTypes = [
    { value: 'utilityBill', label: 'Utility Bill' },
    { value: 'bankStatement', label: 'Bank Statement' },
    { value: 'rentalAgreement', label: 'Rental Agreement' }
  ];

  // Validation schema for step 1 (identity verification)
  const identityValidationSchema = Yup.object({
    docType: Yup.string()
      .required('Document type is required')
      .oneOf(identityDocTypes.map(type => type.value), 'Invalid document type'),
    docNumber: Yup.string()
      .required('Document number is required')
      .min(5, 'Document number is too short'),
    docFile: Yup.mixed()
      .required('Identity document is required')
  });

  // Validation schema for step 2 (address verification)
  const addressValidationSchema = Yup.object({
    docType: Yup.string()
      .required('Document type is required')
      .oneOf(addressDocTypes.map(type => type.value), 'Invalid document type'),
    docFile: Yup.mixed()
      .required('Address document is required')
  });

  // Handle identity document upload
  const handleIdentityDocUpload = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setIdentityDoc(file);
      setFieldValue('docFile', file);
    }
  };

  // Handle address document upload
  const handleAddressDocUpload = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setAddressDoc(file);
      setFieldValue('docFile', file);
    }
  };

  // Formik setup for step 1 (identity verification)
  const identityFormik = useFormik({
    initialValues: {
      docType: '',
      docNumber: '',
      docFile: null
    },
    validationSchema: identityValidationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // Create form data to handle file upload
        const formData = new FormData();
        formData.append('docType', values.docType);
        formData.append('docNumber', values.docNumber);
        formData.append('docFile', values.docFile);
        
        // Call API to upload identity document
        // This is a placeholder and should be replaced with actual API call
        // await kycService.uploadIdentityDocument(formData);
        
        // Move to next step
        setCurrentStep(2);
      } catch (err) {
        setError(err.message || 'Failed to upload identity document. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  // Formik setup for step 2 (address verification)
  const addressFormik = useFormik({
    initialValues: {
      docType: '',
      docFile: null
    },
    validationSchema: addressValidationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // Create form data to handle file upload
        const formData = new FormData();
        formData.append('docType', values.docType);
        formData.append('docFile', values.docFile);
        
        // Call API to upload address document
        // This is a placeholder and should be replaced with actual API call
        // await kycService.uploadAddressDocument(formData);
        
        // Update user profile to mark KYC as submitted (pending verification)
        await updateProfile({ kycSubmitted: true });
        
        // Move to completion step
        setCurrentStep(3);
      } catch (err) {
        setError(err.message || 'Failed to upload address document. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  // Handle final submission and navigation
  const handleCompletion = () => {
    navigate('/dashboard');
  };

  // Render progress steps
  const renderProgressSteps = () => {
    return (
      <div className="flex items-center w-full mb-8">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
          currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          1
        </div>
        <div className={`flex-1 h-1 ${
          currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
        }`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
          currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2
        </div>
        <div className={`flex-1 h-1 ${
          currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'
        }`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
          currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          3
        </div>
      </div>
    );
  };

  // Render identity verification form (step 1)
  const renderIdentityVerificationForm = () => {
    return (
      <form onSubmit={identityFormik.handleSubmit}>
        <h3 className="mb-4 text-lg font-medium text-gray-800">Identity Verification</h3>
        
        <div className="mb-4">
          <label 
            htmlFor="docType" 
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Document Type
          </label>
          <select
            id="docType"
            name="docType"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
              identityFormik.touched.docType && identityFormik.errors.docType
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            {...identityFormik.getFieldProps('docType')}
          >
            <option value="">Select document type</option>
            {identityDocTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {identityFormik.touched.docType && identityFormik.errors.docType && (
            <p className="mt-1 text-sm text-red-600">{identityFormik.errors.docType}</p>
          )}
        </div>

        <div className="mb-4">
          <label 
            htmlFor="docNumber" 
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Document Number
          </label>
          <input
            id="docNumber"
            name="docNumber"
            type="text"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
              identityFormik.touched.docNumber && identityFormik.errors.docNumber
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Enter document number"
            {...identityFormik.getFieldProps('docNumber')}
          />
          {identityFormik.touched.docNumber && identityFormik.errors.docNumber && (
            <p className="mt-1 text-sm text-red-600">{identityFormik.errors.docNumber}</p>
          )}
        </div>

        <div className="mb-6">
          <label 
            htmlFor="docFile" 
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Upload Document
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="docFile"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or PDF (MAX. 5MB)</p>
              </div>
              <input
                id="docFile"
                name="docFile"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(event) => handleIdentityDocUpload(event, identityFormik.setFieldValue)}
              />
            </label>
          </div>
          {identityFormik.touched.docFile && identityFormik.errors.docFile && (
            <p className="mt-1 text-sm text-red-600">{identityFormik.errors.docFile}</p>
          )}
          {identityDoc && (
            <p className="mt-2 text-sm text-green-600">
              File selected: {identityDoc.name}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Continue'}
          </button>
        </div>
      </form>
    );
  };

  // Render address verification form (step 2)
  const renderAddressVerificationForm = () => {
    return (
      <form onSubmit={addressFormik.handleSubmit}>
        <h3 className="mb-4 text-lg font-medium text-gray-800">Address Verification</h3>
        
        <div className="mb-4">
          <label 
            htmlFor="docType" 
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Document Type
          </label>
          <select
            id="docType"
            name="docType"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
              addressFormik.touched.docType && addressFormik.errors.docType
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            {...addressFormik.getFieldProps('docType')}
          >
            <option value="">Select document type</option>
            {addressDocTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {addressFormik.touched.docType && addressFormik.errors.docType && (
            <p className="mt-1 text-sm text-red-600">{addressFormik.errors.docType}</p>
          )}
        </div>

        <div className="mb-6">
          <label 
            htmlFor="docFile" 
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Upload Document
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="docFile"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or PDF (MAX. 5MB)</p>
              </div>
              <input
                id="docFile"
                name="docFile"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(event) => handleAddressDocUpload(event, addressFormik.setFieldValue)}
              />
            </label>
          </div>
          {addressFormik.touched.docFile && addressFormik.errors.docFile && (
            <p className="mt-1 text-sm text-red-600">{addressFormik.errors.docFile}</p>
          )}
          {addressDoc && (
            <p className="mt-2 text-sm text-green-600">
              File selected: {addressDoc.name}
            </p>
          )}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Submit'}
          </button>
        </div>
      </form>
    );
  };

  // Render completion message (step 3)
  const renderCompletionStep = () => {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-green-100">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-800">Verification Submitted</h3>
        <p className="mb-6 text-gray-600">
          Your documents have been submitted successfully. Our team will review your documents and update your verification status within 1-2 business days.
        </p>
        <button
          onClick={handleCompletion}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Return to Dashboard
        </button>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
        KYC Verification
      </h2>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {renderProgressSteps()}

      {currentStep === 1 && renderIdentityVerificationForm()}
      {currentStep === 2 && renderAddressVerificationForm()}
      {currentStep === 3 && renderCompletionStep()}
    </div>
  );
};

export default KYCVerification;
