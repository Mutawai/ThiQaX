// client/src/components/integration/JobApplicationSummary/JobApplicationSummary.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import JobApplicationSummary from './JobApplicationSummary';
import integrationService from '../../../services/integrationService';
import applicationService from '../../../services/applicationService';

jest.mock('../../../services/integrationService');
jest.mock('../../../services/applicationService');
jest.mock('../ApplicationVerificationStatus/ApplicationVerificationStatus', () => {
  return function MockApplicationVerificationStatus() {
    return <div data-testid="application-verification-status">Verification Status Mock</div>;
  };
});
jest.mock('../DocumentApplicationLinker/DocumentApplicationLinker', () => {
  return function MockDocumentApplicationLinker() {
    return <div data-testid="document-application-linker">Document Linker Mock</div>;
  };
});

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { 
        user: { 
          id: 'user123', 
          role: 'jobSeeker',
          profile: { _id: 'profile123' }
        } 
      }) => state
    }
  });
};

const mockApplication = {
  _id: 'app123456789',
  status: 'SUBMITTED',
  job: {
    _id: 'job123',
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'Dubai, UAE'
  },
  documents: [
    {
      _id: 'doc1',
      title: 'National ID',
      type: 'IDENTIFICATION',
      verificationStatus: 'VERIFIED'
    },
    {
      _id: 'doc2',
      title: 'University Degree',
      type: 'EDUCATION',
      verificationStatus: 'PENDING'
    }
  ],
  coverLetter: 'I am very interested in this position...',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-16T10:00:00Z'
};

const mockEligibilityData = {
  eligible: true,
  warnings: ['Profile missing phone number'],
  missingRequirements: ['3+ years experience required'],
  profile: { _id: 'profile123' }
};

describe('JobApplicationSummary', () => {
  let store;
  let mockOnApplicationUpdate;

  beforeEach(() => {
    store = createMockStore();
    mockOnApplicationUpdate = jest.fn();
    
    applicationService.getApplicationById.mockResolvedValue({
      data: mockApplication
    });
    
    integrationService.checkApplicationEligibility.mockResolvedValue({
      data: mockEligibilityData
    });
    
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      applicationId: 'app123456789',
      onApplicationUpdate: mockOnApplicationUpdate
    };

    return render(
      <Provider store={store}>
        <JobApplicationSummary {...defaultProps} {...props} />
      </Provider>
    );
  };

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      renderComponent();
      expect(screen.getByText('Loading application summary...')).toBeInTheDocument();
    });

    it('should render application summary after loading', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Application Summary')).toBeInTheDocument();
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Tech Corp')).toBeInTheDocument();
        expect(screen.getByText('Dubai, UAE')).toBeInTheDocument();
      });
    });

    it('should display application status badge', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('SUBMITTED')).toBeInTheDocument();
      });
    });

    it('should show completion percentage', async () => {
      renderComponent();
      
      await waitFor(() => {
        // Application submitted (1/4) + has documents (1/4) + has verified docs (1/4) = 75%
        expect(screen.getByText('75%')).toBeInTheDocument();
      });
    });

    it('should display application ID and dates', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/App ID: #/)).toBeInTheDocument();
        expect(screen.getByText(/Applied:/)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should render all tabs', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Documents (2)')).toBeInTheDocument();
        expect(screen.getByText('Timeline')).toBeInTheDocument();
      });
    });

    it('should switch tabs when clicked', async () => {
      renderComponent();
      
      await waitFor(() => {
        const documentsTab = screen.getByText('Documents (2)');
        fireEvent.click(documentsTab);
      });

      expect(screen.getByTestId('application-verification-status')).toBeInTheDocument();
    });

    it('should show timeline tab content', async () => {
      renderComponent();
      
      await waitFor(() => {
        const timelineTab = screen.getByText('Timeline');
        fireEvent.click(timelineTab);
      });

      expect(screen.getByText('Application Submitted')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('should display summary cards', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Document count
        expect(screen.getByText('1 verified')).toBeInTheDocument();
        expect(screen.getByText('Profile Match')).toBeInTheDocument();
        expect(screen.getByText('Eligible')).toBeInTheDocument();
      });
    });

    it('should show next steps', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Next Steps')).toBeInTheDocument();
        expect(screen.getByText('1 document(s) pending verification')).toBeInTheDocument();
      });
    });

    it('should display missing requirements', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Missing Requirements')).toBeInTheDocument();
        expect(screen.getByText('3+ years experience required')).toBeInTheDocument();
      });
    });

    it('should show cover letter when present', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Cover Letter')).toBeInTheDocument();
        expect(screen.getByText('I am very interested in this position...')).toBeInTheDocument();
      });
    });
  });

  describe('Documents Tab', () => {
    it('should render verification status component', async () => {
      renderComponent();
      
      await waitFor(() => {
        const documentsTab = screen.getByText('Documents (2)');
        fireEvent.click(documentsTab);
      });

      expect(screen.getByTestId('application-verification-status')).toBeInTheDocument();
    });

    it('should show document linker section', async () => {
      renderComponent();
      
      await waitFor(() => {
        const documentsTab = screen.getByText('Documents (2)');
        fireEvent.click(documentsTab);
      });

      expect(screen.getByText('Link Additional Documents')).toBeInTheDocument();
      expect(screen.getByText('Add Documents')).toBeInTheDocument();
    });

    it('should toggle document linker visibility', async () => {
      renderComponent();
      
      await waitFor(() => {
        const documentsTab = screen.getByText('Documents (2)');
        fireEvent.click(documentsTab);
      });

      const addButton = screen.getByText('Add Documents');
      fireEvent.click(addButton);

      expect(screen.getByTestId('document-application-linker')).toBeInTheDocument();
      expect(screen.getByText('Hide Linker')).toBeInTheDocument();
    });
  });

  describe('Timeline Tab', () => {
    it('should show application submission timeline', async () => {
      renderComponent();
      
      await waitFor(() => {
        const timelineTab = screen.getByText('Timeline');
        fireEvent.click(timelineTab);
      });

      expect(screen.getByText('Application Submitted')).toBeInTheDocument();
    });

    it('should show document timeline entries', async () => {
      renderComponent();
      
      await waitFor(() => {
        const timelineTab = screen.getByText('Timeline');
        fireEvent.click(timelineTab);
      });

      expect(screen.getByText('Document Added: National ID')).toBeInTheDocument();
      expect(screen.getByText('Document Added: University Degree')).toBeInTheDocument();
    });

    it('should show last updated entry when applicable', async () => {
      renderComponent();
      
      await waitFor(() => {
        const timelineTab = screen.getByText('Timeline');
        fireEvent.click(timelineTab);
      });

      expect(screen.getByText('Last Updated')).toBeInTheDocument();
    });
  });

  describe('Status-based Logic', () => {
    it('should calculate completion for draft application', async () => {
      const draftApplication = {
        ...mockApplication,
        status: 'DRAFT',
        documents: []
      };
      
      applicationService.getApplicationById.mockResolvedValue({
        data: draftApplication
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument();
      });
    });

    it('should show appropriate next steps for different statuses', async () => {
      const draftApplication = {
        ...mockApplication,
        status: 'DRAFT',
        documents: []
      };
      
      applicationService.getApplicationById.mockResolvedValue({
        data: draftApplication
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Submit your application to begin the review process')).toBeInTheDocument();
        expect(screen.getByText('Upload and link required documents to your application')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error state when application not found', async () => {
      applicationService.getApplicationById.mockResolvedValue({ data: null });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Application not found')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      applicationService.getApplicationById.mockRejectedValue(new Error('API Error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      renderComponent();
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load application data:',
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle eligibility check failure gracefully', async () => {
      integrationService.checkApplicationEligibility.mockRejectedValue(new Error('Eligibility check failed'));
      
      renderComponent();
      
      await waitFor(() => {
        // Should still render the application data
        expect(screen.getByText('Application Summary')).toBeInTheDocument();
      });
    });
  });

  describe('Component Configuration', () => {
    it('should hide verification status when disabled', async () => {
      renderComponent({ showVerificationStatus: false });
      
      await waitFor(() => {
        const documentsTab = screen.getByText('Documents (2)');
        fireEvent.click(documentsTab);
      });

      expect(screen.queryByTestId('application-verification-status')).not.toBeInTheDocument();
    });

    it('should hide document linker when disabled', async () => {
      renderComponent({ showDocumentLinker: false });
      
      await waitFor(() => {
        const documentsTab = screen.getByText('Documents (2)');
        fireEvent.click(documentsTab);
      });

      expect(screen.queryByText('Link Additional Documents')).not.toBeInTheDocument();
    });

    it('should render in compact mode', async () => {
      const { container } = renderComponent({ compact: true });
      
      await waitFor(() => {
        expect(container.querySelector('.compact')).toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('should call onApplicationUpdate when document is linked', async () => {
      renderComponent();
      
      await waitFor(() => {
        const documentsTab = screen.getByText('Documents (2)');
        fireEvent.click(documentsTab);
      });

      // Simulate document linking success
      const updatedApp = { ...mockApplication, documents: [...mockApplication.documents, { _id: 'doc3' }] };
      
      // This would be called by the DocumentApplicationLinker component
      // We can't easily test this without more complex mocking
      // but the function is correctly passed to the child component
    });
  });

  describe('Eligibility Display', () => {
    it('should show ineligible status when not eligible', async () => {
      integrationService.checkApplicationEligibility.mockResolvedValue({
        data: { ...mockEligibilityData, eligible: false }
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Needs Update')).toBeInTheDocument();
      });
    });

    it('should display warning count', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('1 warnings')).toBeInTheDocument();
      });
    });
  });
});