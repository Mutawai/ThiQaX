// src/components/jobs/ComparisonModal/ComparisonModal.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ComparisonModal from './ComparisonModal';
import { getJobDetails } from '../../../store/actions/jobActions';

// Mock the Redux store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Mock auth hook
jest.mock('../../auth/useAuth', () => ({
  __esModule: true,
  default: () => ({
    isAuthenticated: true,
    user: { _id: 'user123', role: 'jobSeeker' }
  })
}));

// Mock actions
jest.mock('../../../store/actions/jobActions', () => ({
  getJobDetails: jest.fn(),
  saveJob: jest.fn(() => ({ type: 'SAVE_JOB' })),
  unsaveJob: jest.fn(() => ({ type: 'UNSAVE_JOB' }))
}));

// Mock job data
const mockJobs = [
  {
    _id: 'job1',
    title: 'Software Engineer',
    company: { name: 'Tech Corp' },
    salaryMin: 80000,
    salaryMax: 120000,
    jobType: 'FULL_TIME',
    location: 'San Francisco, CA',
    createdAt: '2025-01-15T00:00:00.000Z',
    deadline: '2025-05-15T00:00:00.000Z',
    requirements: 'Requirement 1\nRequirement 2\nRequirement 3',
    skills: ['JavaScript', 'React', 'Node.js'],
    verified: true
  },
  {
    _id: 'job2',
    title: 'Product Manager',
    employer: { companyName: 'Product Inc' },
    salaryMin: 90000,
    salaryMax: 140000,
    jobType: 'FULL_TIME',
    location: 'New York, NY',
    createdAt: '2025-01-10T00:00:00.000Z',
    deadline: '2025-05-10T00:00:00.000Z',
    requirements: 'PM Requirement 1\nPM Requirement 2',
    skills: ['Product Management', 'Agile', 'Scrum'],
    verified: false
  }
];

describe('ComparisonModal', () => {
  let store;
  
  beforeEach(() => {
    // Initialize the mock store with initial state
    store = mockStore({
      jobs: {
        saved: ['job2']
      }
    });
    
    // Mock the getJobDetails action to return job data
    getJobDetails.mockImplementation((jobId) => {
      const job = mockJobs.find(j => j._id === jobId);
      return Promise.resolve({
        payload: job,
        error: job ? undefined : true
      });
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders loading state initially', () => {
    render(
      <Provider store={store}>
        <ComparisonModal
          open={true}
          onClose={jest.fn()}
          jobIds={['job1', 'job2']}
        />
      </Provider>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('renders job comparison after loading', async () => {
    render(
      <Provider store={store}>
        <ComparisonModal
          open={true}
          onClose={jest.fn()}
          jobIds={['job1', 'job2']}
        />
      </Provider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if job titles are rendered
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Product Manager')).toBeInTheDocument();
    
    // Check if company names are rendered
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Product Inc')).toBeInTheDocument();
    
    // Check if salary information is rendered
    expect(screen.getByText('$80,000 - $120,000')).toBeInTheDocument();
    expect(screen.getByText('$90,000 - $140,000')).toBeInTheDocument();
    
    // Check if locations are rendered
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
    
    // Check if job requirements are rendered
    expect(screen.getByText('Requirement 1')).toBeInTheDocument();
    expect(screen.getByText('PM Requirement 1')).toBeInTheDocument();
    
    // Check if VerificationBadge is rendered for verified job
    expect(screen.getByText('Verified Job')).toBeInTheDocument();
  });
  
  test('handles save/unsave job actions', async () => {
    render(
      <Provider store={store}>
        <ComparisonModal
          open={true}
          onClose={jest.fn()}
          jobIds={['job1', 'job2']}
        />
      </Provider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find save buttons (there should be 2, one for each job)
    const saveButtons = screen.getAllByRole('button', { name: /save|unsave/i });
    expect(saveButtons).toHaveLength(2);
    
    // Click save button for the first job
    fireEvent.click(saveButtons[0]);
    
    // Check if saveJob action was dispatched
    expect(store.getActions()).toContainEqual({ type: 'SAVE_JOB' });
    
    // Reset store actions
    store.clearActions();
    
    // Click save button for the second job (which is already saved)
    fireEvent.click(saveButtons[1]);
    
    // Check if unsaveJob action was dispatched
    expect(store.getActions()).toContainEqual({ type: 'UNSAVE_JOB' });
  });
  
  test('handles close action', async () => {
    const onCloseMock = jest.fn();
    
    render(
      <Provider store={store}>
        <ComparisonModal
          open={true}
          onClose={onCloseMock}
          jobIds={['job1', 'job2']}
        />
      </Provider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Check if onClose callback was called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
  
  test('renders error message when job fetch fails', async () => {
    // Mock getJobDetails to simulate an error
    getJobDetails.mockImplementation(() => {
      return Promise.resolve({
        error: true
      });
    });
    
    render(
      <Provider store={store}>
        <ComparisonModal
          open={true}
          onClose={jest.fn()}
          jobIds={['invalid-id']}
        />
      </Provider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if error message is rendered
    expect(screen.getByText(/failed to fetch job details/i)).toBeInTheDocument();
  });
  
  test('renders message when no jobs are selected', async () => {
    render(
      <Provider store={store}>
        <ComparisonModal
          open={true}
          onClose={jest.fn()}
          jobIds={[]}
        />
      </Provider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if no jobs message is rendered
    expect(screen.getByText(/no jobs selected for comparison/i)).toBeInTheDocument();
  });
});