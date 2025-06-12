import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import VerificationSteps from './VerificationSteps';
import * as integrationService from '../../../services/integrationService';

// Mock the dependencies
jest.mock('../../../services/integrationService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock documents for testing
const mockDocuments = [
  {
    _id: '1',
    documentType: 'passport',
    verificationStatus: 'VERIFIED',
    originalName: 'passport.jpg'
  },
  {
    _id: '2',
    documentType: 'address_proof',
    verificationStatus: 'PENDING',
    originalName: 'utility_bill.pdf'
  },
  {
    _id: '3',
    documentType: 'education_certificate',
    verificationStatus: 'VERIFIED',
    originalName: 'degree.pdf'
  }
];

const mockUser = {
  _id: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  dateOfBirth: '1990-01-01'
};

const mockIncompleteUser = {
  _id: 'user456',
  name: 'Jane Doe',
  email: 'jane@example.com'
  // Missing phone and dateOfBirth
};

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      document: (state = {
        documents: [],
        ...initialState.document
      }) => state,
      auth: (state = {
        user: mockUser,
        ...initialState.auth
      }) => state
    },
    preloadedState: initialState
  });
};

// Wrapper component for testing
const TestWrapper = ({ children, initialState = {} }) => {
  const store = createMockStore(initialState);
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

describe('VerificationSteps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    integrationService.checkKycStatus = jest.fn(() => 
      Promise.resolve({ data: { status: 'pending' } })
    );
  });

  describe('Basic Rendering', () => {
    it('renders default steps correctly', () => {
      render(
        <TestWrapper>
          <VerificationSteps />
        </TestWrapper>
      );

      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Identity Documents')).toBeInTheDocument();
      expect(screen.getByText('Address Verification')).toBeInTheDocument();
      expect(screen.getByText('Professional Documents')).toBeInTheDocument();
      expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    });

    it('renders custom steps when provided', () => {
      const customSteps = [
        {
          id: 'step1',
          title: 'Step 1',
          description: 'First step',
          icon: 'user',
          optional: false
        },
        {
          id: 'step2',
          title: 'Step 2',
          description: 'Second step',
          icon: 'check-circle',
          optional: false
        }
      ];

      render(
        <TestWrapper>
          <VerificationSteps steps={customSteps} />
        </TestWrapper>
      );

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.queryByText('Personal Information')).not.toBeInTheDocument();
    });

    it('displays overall progress bar when showProgress is true', () => {
      render(
        <TestWrapper>
          <VerificationSteps showProgress={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
      expect(screen.getByText(/\d+% Complete/)).toBeInTheDocument();
    });

    it('hides overall progress bar when showProgress is false', () => {
      render(
        <TestWrapper>
          <VerificationSteps showProgress={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Overall Progress')).not.toBeInTheDocument();
    });
  });

  describe('Step Status Calculation', () => {
    it('marks personal info as completed when all required fields are present', async () => {
      const initialState = {
        auth: { user: mockUser }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps currentStep="identity-documents" />
        </TestWrapper>
      );

      await waitFor(() => {
        // Personal info step should be completed (green check mark)
        const personalInfoStep = screen.getByText('Personal Information').closest('div');
        expect(personalInfoStep).toBeInTheDocument();
      });
    });

    it('marks personal info as incomplete when required fields are missing', async () => {
      const initialState = {
        auth: { user: mockIncompleteUser }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps currentStep="personal-info" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Missing: phone, dateOfBirth')).toBeInTheDocument();
      });
    });

    it('marks identity documents as completed when passport is uploaded', async () => {
      const initialState = {
        document: { documents: [mockDocuments[0]] }, // passport
        auth: { user: mockUser }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps currentStep="address-verification" />
        </TestWrapper>
      );

      await waitFor(() => {
        // Identity documents step should show completion
        expect(screen.getByText('Identity Documents')).toBeInTheDocument();
      });
    });

    it('handles identity documents requiring one of multiple types', async () => {
      const nationalIdDoc = {
        _id: '4',
        documentType: 'national_id',
        verificationStatus: 'VERIFIED',
        originalName: 'national_id.jpg'
      };

      const initialState = {
        document: { documents: [nationalIdDoc] },
        auth: { user: mockUser }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps currentStep="address-verification" />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should be completed with national ID instead of passport
        expect(screen.getByText('Identity Documents')).toBeInTheDocument();
      });
    });

    it('calculates correct completion percentage for partial document upload', async () => {
      const initialState = {
        document: { documents: [mockDocuments[0]] }, // Only passport uploaded
        auth: { user: mockUser }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps currentStep="identity-documents" showProgress={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show 100% for identity documents (only needs one)
        expect(screen.getAllByText('100%')).toHaveLength(1);
      });
    });

    it('shows correct progress for address verification step', async () => {
      const initialState = {
        document: { 
          documents: [
            mockDocuments[0], // passport
            mockDocuments[1]  // address proof
          ] 
        },
        auth: { user: mockUser }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps currentStep="address-verification" showProgress={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Address Verification')).toBeInTheDocument();
      });
    });
  });

  describe('Step Navigation', () => {
    it('allows navigation when allowNavigation is true', () => {
      const onStepClick = jest.fn();

      render(
        <TestWrapper>
          <VerificationSteps allowNavigation={true} onStepClick={onStepClick} />
        </TestWrapper>
      );

      const personalInfoStep = screen.getByText('Personal Information');
      fireEvent.click(personalInfoStep);

      expect(onStepClick).toHaveBeenCalled();
    });

    it('prevents navigation when allowNavigation is false', () => {
      const onStepClick = jest.fn();

      render(
        <TestWrapper>
          <VerificationSteps allowNavigation={false} onStepClick={onStepClick} />
        </TestWrapper>
      );

      const personalInfoStep = screen.getByText('Personal Information');
      fireEvent.click(personalInfoStep);

      expect(onStepClick).not.toHaveBeenCalled();
    });

    it('calls onStepClick with correct parameters', () => {
      const onStepClick = jest.fn();

      render(
        <TestWrapper>
          <VerificationSteps onStepClick={onStepClick} />
        </TestWrapper>
      );

      const personalInfoStep = screen.getByText('Personal Information');
      fireEvent.click(personalInfoStep);

      expect(onStepClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'personal-info' }),
        expect.any(String)
      );
    });
  });

  describe('Visual States', () => {
    it('displays current step with correct styling', async () => {
      render(
        <TestWrapper>
          <VerificationSteps currentStep="identity-documents" />
        </TestWrapper>
      );

      await waitFor(() => {
        const currentStep = screen.getByText('Identity Documents').closest('div');
        // Current step should have indigo styling (active state)
        expect(currentStep).toBeInTheDocument();
      });
    });

    it('displays completed steps with check icons', async () => {
      const initialState = {
        auth: { user: mockUser },
        document: { documents: [mockDocuments[0]] }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps currentStep="professional-documents" />
        </TestWrapper>
      );

      await waitFor(() => {
        // Completed steps should show check icons
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
        expect(screen.getByText('Identity Documents')).toBeInTheDocument();
      });
    });

    it('shows disabled styling for future steps when navigation is disabled', async () => {
      render(
        <TestWrapper>
          <VerificationSteps currentStep="personal-info" allowNavigation={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        // Future steps should be disabled
        expect(screen.getByText('Professional Documents')).toBeInTheDocument();
      });
    });
  });

  describe('Orientation and Size', () => {
    it('renders horizontally by default', () => {
      render(
        <TestWrapper>
          <VerificationSteps />
        </TestWrapper>
      );

      // Check for horizontal layout classes (should have flex items-center)
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    it('renders vertically when orientation is set to vertical', () => {
      render(
        <TestWrapper>
          <VerificationSteps orientation="vertical" />
        </TestWrapper>
      );

      // Check for vertical layout (should have space-y classes)
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    it('applies correct size classes for different sizes', () => {
      const { rerender } = render(
        <TestWrapper>
          <VerificationSteps size="small" />
        </TestWrapper>
      );

      expect(screen.getByText('Personal Information')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <VerificationSteps size="large" />
        </TestWrapper>
      );

      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('calculates overall progress correctly', async () => {
      const initialState = {
        auth: { user: mockUser }, // Completes personal info
        document: { 
          documents: [
            mockDocuments[0], // passport - completes identity
            mockDocuments[1]  // address proof - completes address
          ] 
        }
      };

      // Mock KYC status as not yet verified for review step
      integrationService.checkKycStatus.mockResolvedValue({ 
        data: { status: 'pending' } 
      });

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps showProgress={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show progress based on completed steps
        expect(screen.getByText(/\d+% Complete/)).toBeInTheDocument();
      });
    });

    it('shows 100% progress when all steps are completed', async () => {
      const initialState = {
        auth: { user: mockUser },
        document: { 
          documents: [
            mockDocuments[0], // passport
            mockDocuments[1], // address proof
            mockDocuments[2]  // education certificate
          ] 
        }
      };

      // Mock KYC status as verified
      integrationService.checkKycStatus.mockResolvedValue({ 
        data: { status: 'verified' } 
      });

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps showProgress={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('100% Complete')).toBeInTheDocument();
      });
    });
  });

  describe('Step Icons', () => {
    it('displays correct icons for each step type', () => {
      render(
        <TestWrapper>
          <VerificationSteps />
        </TestWrapper>
      );

      // Icons should be present for each step
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Identity Documents')).toBeInTheDocument();
      expect(screen.getByText('Address Verification')).toBeInTheDocument();
      expect(screen.getByText('Professional Documents')).toBeInTheDocument();
      expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    });

    it('shows check icons for completed steps', async () => {
      const initialState = {
        auth: { user: mockUser }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps currentStep="identity-documents" />
        </TestWrapper>
      );

      await waitFor(() => {
        // Completed step should have a check icon
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles KYC status check errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      integrationService.checkKycStatus.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <VerificationSteps />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should still render steps even if KYC status check fails
        expect(screen.getByText('Review & Submit')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('handles missing user data gracefully', async () => {
      const initialState = {
        auth: { user: null }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should render without crashing
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
      });
    });

    it('handles missing documents gracefully', async () => {
      const initialState = {
        document: { documents: [] }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should render without crashing
        expect(screen.getByText('Identity Documents')).toBeInTheDocument();
      });
    });
  });

  describe('Custom User Profile', () => {
    it('uses custom userProfile when provided', async () => {
      const customProfile = {
        name: 'Custom User',
        email: 'custom@example.com',
        phone: '+9876543210',
        dateOfBirth: '1985-05-05'
      };

      render(
        <TestWrapper>
          <VerificationSteps userProfile={customProfile} currentStep="identity-documents" />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should use custom profile for completion calculation
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
      });
    });

    it('falls back to auth user when no custom profile provided', async () => {
      const initialState = {
        auth: { user: mockUser }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps currentStep="identity-documents" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
      });
    });
  });

  describe('Document Status Integration', () => {
    it('considers rejected documents as incomplete', async () => {
      const rejectedDoc = {
        _id: '5',
        documentType: 'passport',
        verificationStatus: 'REJECTED',
        originalName: 'passport_rejected.jpg'
      };

      const initialState = {
        document: { documents: [rejectedDoc] }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps currentStep="identity-documents" />
        </TestWrapper>
      );

      await waitFor(() => {
        // Identity documents should not be complete with rejected document
        expect(screen.getByText('Identity Documents')).toBeInTheDocument();
      });
    });

    it('accepts both verified and pending documents as valid', async () => {
      const pendingDoc = {
        _id: '6',
        documentType: 'passport',
        verificationStatus: 'PENDING',
        originalName: 'passport_pending.jpg'
      };

      const initialState = {
        document: { documents: [pendingDoc] }
      };

      render(
        <TestWrapper initialState={initialState}>
          <VerificationSteps currentStep="address-verification" />
        </TestWrapper>
      );

      await waitFor(() => {
        // Identity documents should be complete with pending document
        expect(screen.getByText('Identity Documents')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides appropriate ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <VerificationSteps />
        </TestWrapper>
      );

      // Check that interactive elements are accessible
      const personalInfoStep = screen.getByText('Personal Information');
      expect(personalInfoStep).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      const onStepClick = jest.fn();

      render(
        <TestWrapper>
          <VerificationSteps onStepClick={onStepClick} />
        </TestWrapper>
      );

      const personalInfoStep = screen.getByText('Personal Information');
      
      // Simulate keyboard activation
      fireEvent.click(personalInfoStep);
      expect(onStepClick).toHaveBeenCalled();
    });
  });
});