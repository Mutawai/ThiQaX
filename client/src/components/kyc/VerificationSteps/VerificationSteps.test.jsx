// client/src/components/kyc/VerificationSteps/VerificationSteps.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import VerificationSteps from './VerificationSteps';

// Create mock store
const createMockStore = (kycProgress = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { kycProgress }) => state
    }
  });
};

// Mock window.matchMedia
const createMatchMedia = (matches) => {
  return (query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
};

describe('VerificationSteps Component', () => {
  beforeEach(() => {
    window.matchMedia = createMatchMedia(false); // Default to desktop
  });

  const renderComponent = (props = {}, storeState = {}) => {
    const store = createMockStore(storeState);
    return render(
      <Provider store={store}>
        <VerificationSteps {...props} />
      </Provider>
    );
  };

  test('renders all verification steps', () => {
    renderComponent();
    
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Address Details')).toBeInTheDocument();
    expect(screen.getByText('Document Upload')).toBeInTheDocument();
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
  });

  test('shows descriptions for each step', () => {
    renderComponent();
    
    expect(screen.getByText('Provide your basic personal details')).toBeInTheDocument();
    expect(screen.getByText('Confirm your residential address')).toBeInTheDocument();
    expect(screen.getByText('Upload verification documents')).toBeInTheDocument();
    expect(screen.getByText('Review and submit for verification')).toBeInTheDocument();
  });

  test('highlights current active step', () => {
    renderComponent({ currentStep: 1 });
    
    // The second step (Address Details) should be active
    const addressStep = screen.getByText('Address Details').closest('.MuiStep-root');
    expect(addressStep).toHaveClass('MuiStep-horizontal');
  });

  test('shows completed steps before current step', () => {
    renderComponent({ currentStep: 2 });
    
    // First two steps should be marked as completed
    const personalInfoStep = screen.getByText('Personal Information').closest('.MuiStep-root');
    const addressStep = screen.getByText('Address Details').closest('.MuiStep-root');
    
    expect(personalInfoStep.querySelector('.Mui-completed')).toBeInTheDocument();
    expect(addressStep.querySelector('.Mui-completed')).toBeInTheDocument();
  });

  test('shows step details when showDetails is true', () => {
    renderComponent({ showDetails: true, currentStep: 0 });
    
    expect(screen.getByText('Estimated time: 2 minutes')).toBeInTheDocument();
    expect(screen.getByText('Required fields:')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Date of Birth')).toBeInTheDocument();
  });

  test('hides step details when showDetails is false', () => {
    renderComponent({ showDetails: false });
    
    expect(screen.queryByText('Estimated time: 2 minutes')).not.toBeInTheDocument();
    expect(screen.queryByText('Required fields:')).not.toBeInTheDocument();
  });

  test('renders in compact mode', () => {
    renderComponent({ compact: true, currentStep: 1 });
    
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    expect(screen.getByText('Address Details')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows progress summary', () => {
    renderComponent({ currentStep: 2 });
    
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    expect(screen.getByText('50% Complete')).toBeInTheDocument();
  });

  test('handles step click when onStepClick is provided', () => {
    const mockOnStepClick = jest.fn();
    renderComponent({ currentStep: 2, onStepClick: mockOnStepClick });
    
    // Click on a completed step
    fireEvent.click(screen.getByText('Personal Information'));
    expect(mockOnStepClick).toHaveBeenCalledWith(0);
    
    // Click on active step
    fireEvent.click(screen.getByText('Document Upload'));
    expect(mockOnStepClick).toHaveBeenCalledWith(2);
  });

  test('does not allow clicking on future steps', () => {
    const mockOnStepClick = jest.fn();
    renderComponent({ currentStep: 1, onStepClick: mockOnStepClick });
    
    // Try clicking on a future step
    fireEvent.click(screen.getByText('Review & Submit'));
    expect(mockOnStepClick).not.toHaveBeenCalled();
  });

  test('switches to vertical orientation on mobile', () => {
    window.matchMedia = createMatchMedia(true); // Mobile view
    renderComponent({ orientation: 'horizontal' });
    
    // Even though horizontal was requested, it should be vertical on mobile
    const stepper = screen.getByRole('list').parentElement;
    expect(stepper).toHaveClass('MuiStepper-vertical');
  });

  test('shows completed date for finished steps', () => {
    const kycProgress = {
      personalInfo: 'completed',
      personalInfoCompletedAt: '2024-01-15T10:00:00Z'
    };
    
    renderComponent({ currentStep: 1 }, kycProgress);
    
    expect(screen.getByText(/Completed on/)).toBeInTheDocument();
  });

  test('shows all required fields for active step', () => {
    renderComponent({ currentStep: 1 });
    
    expect(screen.getByText('Street Address')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();
    expect(screen.getByText('State/Province')).toBeInTheDocument();
    expect(screen.getByText('Postal Code')).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  test('calculates progress correctly', () => {
    const { rerender } = renderComponent({ currentStep: 0 });
    expect(screen.getByText('0% Complete')).toBeInTheDocument();
    
    rerender(
      <Provider store={createMockStore()}>
        <VerificationSteps currentStep={1} />
      </Provider>
    );
    expect(screen.getByText('25% Complete')).toBeInTheDocument();
    
    rerender(
      <Provider store={createMockStore()}>
        <VerificationSteps currentStep={3} />
      </Provider>
    );
    expect(screen.getByText('75% Complete')).toBeInTheDocument();
  });

  test('does not show progress summary in compact mode', () => {
    renderComponent({ compact: true });
    
    expect(screen.queryByText('Overall Progress')).not.toBeInTheDocument();
  });

  test('renders horizontal orientation on desktop', () => {
    renderComponent({ orientation: 'horizontal' });
    
    const stepper = screen.getByRole('list').parentElement;
    expect(stepper).toHaveClass('MuiStepper-horizontal');
  });

  test('shows step descriptions in horizontal mode on desktop', () => {
    renderComponent({ orientation: 'horizontal' });
    
    // In horizontal mode, descriptions should be visible
    expect(screen.getByText('Provide your basic personal details')).toBeInTheDocument();
  });

  test('applies clickable styling to eligible steps', () => {
    const mockOnStepClick = jest.fn();
    renderComponent({ currentStep: 2, onStepClick: mockOnStepClick });
    
    const personalInfoStep = screen.getByText('Personal Information').parentElement;
    expect(personalInfoStep).toHaveClass('clickableStep');
    
    const futureStep = screen.getByText('Review & Submit').parentElement;
    expect(futureStep).not.toHaveClass('clickableStep');
  });
});