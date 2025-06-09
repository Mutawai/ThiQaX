// client/src/components/kyc/KYCForm/KYCForm.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import KYCForm from './KYCForm';

// Mock Redux actions
jest.mock('../../../redux/actions/documentActions', () => ({
  uploadDocument: jest.fn(() => ({ type: 'UPLOAD_DOCUMENT' }))
}));

jest.mock('../../../redux/actions/profileActions', () => ({
  updateKYCStatus: jest.fn(() => ({ type: 'UPDATE_KYC_STATUS' })),
  submitKYCVerification: jest.fn(() => ({ type: 'SUBMIT_KYC_VERIFICATION' }))
}));

// Mock child component
jest.mock('../DocumentVerification/DocumentVerification', () => {
  return function MockDocumentVerification({ onUpload, uploadedDocuments }) {
    return (
      <div data-testid="document-verification">
        <button onClick={() => onUpload('idDocument', new File([''], 'id.jpg'))}>
          Upload ID
        </button>
        <button onClick={() => onUpload('addressProof', new File([''], 'address.jpg'))}>
          Upload Address
        </button>
        <button onClick={() => onUpload('selfie', new File([''], 'selfie.jpg'))}>
          Upload Selfie
        </button>
        {uploadedDocuments.idDocument && <div>ID Document Uploaded</div>}
        {uploadedDocuments.addressProof && <div>Address Proof Uploaded</div>}
        {uploadedDocuments.selfie && <div>Selfie Uploaded</div>}
      </div>
    );
  };
});

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = {
        user: { fullName: 'John Doe', phoneNumber: '+254700000000' },
        kycStatus: 'pending'
      }) => state,
      documents: (state = { uploadProgress: 0 }) => state
    },
    preloadedState: initialState
  });
};

describe('KYCForm Component', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();
  let store;
  
  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
  });
  
  const renderKYCForm = (props = {}) => {
    return render(
      <Provider store={store}>
        <KYCForm onComplete={mockOnComplete} onCancel={mockOnCancel} {...props} />
      </Provider>
    );
  };
  
  test('renders initial step with personal information form', () => {
    renderKYCForm();
    
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByLabelText('Nationality')).toBeInTheDocument();
    expect(screen.getByText('ID Type')).toBeInTheDocument();
    expect(screen.getByLabelText('ID Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
  });
  
  test('pre-fills form with user data from Redux store', () => {
    renderKYCForm();
    
    expect(screen.getByLabelText('Full Name')).toHaveValue('John Doe');
    expect(screen.getByLabelText('Phone Number')).toHaveValue('+254700000000');
  });
  
  test('validates personal information before proceeding', async () => {
    renderKYCForm();
    
    // Try to proceed without filling required fields
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
      expect(screen.getByText('Nationality is required')).toBeInTheDocument();
      expect(screen.getByText('ID number is required')).toBeInTheDocument();
    });
  });
  
  test('proceeds to address step after valid personal info', async () => {
    const user = userEvent.setup();
    renderKYCForm();
    
    // Fill personal information
    await user.type(screen.getByLabelText('Date of Birth'), '1990-01-01');
    await user.type(screen.getByLabelText('Nationality'), 'Kenyan');
    
    // Select ID Type
    fireEvent.mouseDown(screen.getByText('ID Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('National ID'));
    });
    
    await user.type(screen.getByLabelText('ID Number'), '12345678');
    
    // Click Next
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Address Details')).toBeInTheDocument();
      expect(screen.getByLabelText('Address Line 1')).toBeInTheDocument();
    });
  });
  
  test('validates address information before proceeding', async () => {
    const user = userEvent.setup();
    renderKYCForm();
    
    // Navigate to address step
    await user.type(screen.getByLabelText('Date of Birth'), '1990-01-01');
    await user.type(screen.getByLabelText('Nationality'), 'Kenyan');
    fireEvent.mouseDown(screen.getByText('ID Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('National ID'));
    });
    await user.type(screen.getByLabelText('ID Number'), '12345678');
    fireEvent.click(screen.getByText('Next'));
    
    // Try to proceed without filling address
    await waitFor(() => {
      fireEvent.click(screen.getByText('Next'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Address is required')).toBeInTheDocument();
      expect(screen.getByText('City is required')).toBeInTheDocument();
    });
  });
  
  test('allows going back to previous step', async () => {
    const user = userEvent.setup();
    renderKYCForm();
    
    // Navigate to address step
    await user.type(screen.getByLabelText('Date of Birth'), '1990-01-01');
    await user.type(screen.getByLabelText('Nationality'), 'Kenyan');
    fireEvent.mouseDown(screen.getByText('ID Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('National ID'));
    });
    await user.type(screen.getByLabelText('ID Number'), '12345678');
    fireEvent.click(screen.getByText('Next'));
    
    // Click Back
    await waitFor(() => {
      fireEvent.click(screen.getByText('Back'));
    });
    
    // Should be back at personal info
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toHaveValue('John Doe');
  });
  
  test('proceeds to document upload step', async () => {
    const user = userEvent.setup();
    renderKYCForm();
    
    // Fill personal info and navigate
    await user.type(screen.getByLabelText('Date of Birth'), '1990-01-01');
    await user.type(screen.getByLabelText('Nationality'), 'Kenyan');
    fireEvent.mouseDown(screen.getByText('ID Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('National ID'));
    });
    await user.type(screen.getByLabelText('ID Number'), '12345678');
    fireEvent.click(screen.getByText('Next'));
    
    // Fill address info
    await waitFor(async () => {
      await user.type(screen.getByLabelText('Address Line 1'), '123 Main St');
      await user.type(screen.getByLabelText('City'), 'Nairobi');
      await user.type(screen.getByLabelText('State/Province'), 'Nairobi');
      await user.type(screen.getByLabelText('Postal Code'), '00100');
      await user.type(screen.getByLabelText('Country'), 'Kenya');
    });
    
    fireEvent.click(screen.getByText('Next'));
    
    // Should show document upload
    await waitFor(() => {
      expect(screen.getByTestId('document-verification')).toBeInTheDocument();
    });
  });
  
  test('handles document uploads', async () => {
    const { uploadDocument } = require('../../../redux/actions/documentActions');
    uploadDocument.mockResolvedValue({ id: 'doc123', type: 'idDocument' });
    
    const user = userEvent.setup();
    renderKYCForm();
    
    // Navigate to document upload step
    await user.type(screen.getByLabelText('Date of Birth'), '1990-01-01');
    await user.type(screen.getByLabelText('Nationality'), 'Kenyan');
    fireEvent.mouseDown(screen.getByText('ID Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('National ID'));
    });
    await user.type(screen.getByLabelText('ID Number'), '12345678');
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(async () => {
      await user.type(screen.getByLabelText('Address Line 1'), '123 Main St');
      await user.type(screen.getByLabelText('City'), 'Nairobi');
      await user.type(screen.getByLabelText('State/Province'), 'Nairobi');
      await user.type(screen.getByLabelText('Postal Code'), '00100');
      await user.type(screen.getByLabelText('Country'), 'Kenya');
    });
    fireEvent.click(screen.getByText('Next'));
    
    // Upload documents
    await waitFor(() => {
      fireEvent.click(screen.getByText('Upload ID'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('ID Document Uploaded')).toBeInTheDocument();
    });
  });
  
  test('shows review step with all information', async () => {
    const user = userEvent.setup();
    renderKYCForm();
    
    // Fill all steps
    await user.type(screen.getByLabelText('Date of Birth'), '1990-01-01');
    await user.type(screen.getByLabelText('Nationality'), 'Kenyan');
    fireEvent.mouseDown(screen.getByText('ID Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('National ID'));
    });
    await user.type(screen.getByLabelText('ID Number'), '12345678');
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(async () => {
      await user.type(screen.getByLabelText('Address Line 1'), '123 Main St');
      await user.type(screen.getByLabelText('City'), 'Nairobi');
      await user.type(screen.getByLabelText('State/Province'), 'Nairobi');
      await user.type(screen.getByLabelText('Postal Code'), '00100');
      await user.type(screen.getByLabelText('Country'), 'Kenya');
    });
    fireEvent.click(screen.getByText('Next'));
    
    // Upload documents
    await waitFor(() => {
      fireEvent.click(screen.getByText('Upload ID'));
      fireEvent.click(screen.getByText('Upload Address'));
    });
    
    fireEvent.click(screen.getByText('Next'));
    
    // Should show review
    await waitFor(() => {
      expect(screen.getByText('Review Your Information')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });
  });
  
  test('submits KYC verification', async () => {
    const { submitKYCVerification } = require('../../../redux/actions/profileActions');
    submitKYCVerification.mockResolvedValue({ success: true });
    
    const user = userEvent.setup();
    renderKYCForm();
    
    // Complete all steps
    await user.type(screen.getByLabelText('Date of Birth'), '1990-01-01');
    await user.type(screen.getByLabelText('Nationality'), 'Kenyan');
    fireEvent.mouseDown(screen.getByText('ID Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('National ID'));
    });
    await user.type(screen.getByLabelText('ID Number'), '12345678');
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(async () => {
      await user.type(screen.getByLabelText('Address Line 1'), '123 Main St');
      await user.type(screen.getByLabelText('City'), 'Nairobi');
      await user.type(screen.getByLabelText('State/Province'), 'Nairobi');
      await user.type(screen.getByLabelText('Postal Code'), '00100');
      await user.type(screen.getByLabelText('Country'), 'Kenya');
    });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Upload ID'));
      fireEvent.click(screen.getByText('Upload Address'));
    });
    fireEvent.click(screen.getByText('Next'));
    
    // Submit
    await waitFor(() => {
      fireEvent.click(screen.getByText('Submit for Verification'));
    });
    
    await waitFor(() => {
      expect(submitKYCVerification).toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
  
  test('handles submission errors', async () => {
    const { submitKYCVerification } = require('../../../redux/actions/profileActions');
    submitKYCVerification.mockRejectedValue(new Error('Submission failed'));
    
    const user = userEvent.setup();
    renderKYCForm();
    
    // Complete all steps quickly
    await user.type(screen.getByLabelText('Date of Birth'), '1990-01-01');
    await user.type(screen.getByLabelText('Nationality'), 'Kenyan');
    fireEvent.mouseDown(screen.getByText('ID Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('National ID'));
    });
    await user.type(screen.getByLabelText('ID Number'), '12345678');
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(async () => {
      await user.type(screen.getByLabelText('Address Line 1'), '123 Main St');
      await user.type(screen.getByLabelText('City'), 'Nairobi');
      await user.type(screen.getByLabelText('State/Province'), 'Nairobi');
      await user.type(screen.getByLabelText('Postal Code'), '00100');
      await user.type(screen.getByLabelText('Country'), 'Kenya');
    });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Upload ID'));
      fireEvent.click(screen.getByText('Upload Address'));
    });
    fireEvent.click(screen.getByText('Next'));
    
    // Submit
    await waitFor(() => {
      fireEvent.click(screen.getByText('Submit for Verification'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Submission failed')).toBeInTheDocument();
    });
  });
  
  test('calls onCancel when cancel button is clicked', () => {
    renderKYCForm();
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});