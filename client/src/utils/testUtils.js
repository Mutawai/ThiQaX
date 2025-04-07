// src/utils/testUtils.js
import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

export const createMockStore = (initialState) => {
  return mockStore(initialState);
};

export const renderWithProviders = (
  ui,
  {
    initialState = {},
    store = mockStore(initialState),
    ...renderOptions
  } = {}
) => {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

// Mock data for testing
export const mockUser = {
  id: '123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'jobSeeker',
  createdAt: '2023-01-01T00:00:00.000Z'
};

export const mockProfile = {
  id: '456',
  userId: '123',
  completionPercentage: 75,
  kycVerified: false,
  bio: 'Test bio',
  skills: ['JavaScript', 'React', 'Node.js'],
  experience: [
    {
      title: 'Developer',
      company: 'Test Company',
      startDate: '2020-01-01',
      endDate: '2023-01-01',
      description: 'Test description'
    }
  ]
};

export const mockApplications = [
  {
    id: '789',
    userId: '123',
    job: {
      id: '111',
      title: 'Frontend Developer',
      company: 'Test Company'
    },
    status: 'PENDING',
    createdAt: '2023-05-01T00:00:00.000Z'
  },
  {
    id: '790',
    userId: '123',
    job: {
      id: '112',
      title: 'Backend Developer',
      company: 'Another Company'
    },
    status: 'VERIFIED',
    createdAt: '2023-05-15T00:00:00.000Z'
  }
];

export const mockDocuments = [
  {
    id: '901',
    userId: '123',
    type: 'IDENTIFICATION',
    fileUrl: 'uploads/id.pdf',
    status: 'VERIFIED',
    createdAt: '2023-04-01T00:00:00.000Z'
  },
  {
    id: '902',
    userId: '123',
    type: 'RESUME',
    fileUrl: 'uploads/resume.pdf',
    status: 'PENDING',
    createdAt: '2023-04-15T00:00:00.000Z'
  }
];

export const mockAgentStats = {
  activeJobs: 5,
  totalCandidates: 12,
  verificationRate: 85,
  pendingVerifications: 3
};

export const mockJobPostings = [
  {
    id: '201',
    title: 'Senior React Developer',
    company: 'Tech Solutions',
    status: 'ACTIVE',
    applications: 24,
    views: 156
  },
  {
    id: '202',
    title: 'Backend Engineer',
    company: 'Data Systems',
    status: 'ACTIVE',
    applications: 18,
    views: 120
  }
];

export const mockCandidates = [
  {
    id: '301',
    fullName: 'Jane Smith',
    jobTitle: 'Frontend Developer',
    verificationStatus: 'PENDING'
  },
  {
    id: '302',
    fullName: 'Mike Johnson',
    jobTitle: 'UX Designer',
    verificationStatus: 'VERIFIED'
  }
];

export const mockSystemStats = {
  activeUsers: 320,
  jobsPosted: 87,
  verificationRate: 92,
  systemHealth: 'Good',
  usersTrend: {
    direction: 'up',
    value: 12
  },
  jobsTrend: {
    direction: 'up',
    value: 8
  }
};

export const mockPendingVerifications = [
  {
    id: '501',
    user: {
      id: '601',
      fullName: 'Sarah Williams'
    },
    documentType: 'PASSPORT',
    createdAt: '2023-06-01T00:00:00.000Z'
  },
  {
    id: '502',
    user: {
      id: '602',
      fullName: 'Robert Davis'
    },
    documentType: 'WORK_PERMIT',
    createdAt: '2023-06-02T00:00:00.000Z'
  }
];

export const mockRecentUsers = [
  {
    id: '701',
    fullName: 'Emma Wilson',
    email: 'emma@example.com',
    role: 'jobSeeker',
    active: true,
    createdAt: '2023-06-05T00:00:00.000Z'
  },
  {
    id: '702',
    fullName: 'Alex Taylor',
    email: 'alex@example.com',
    role: 'agent',
    active: true,
    createdAt: '2023-06-04T00:00:00.000Z'
  }
];

// src/pages/dashboard/__tests__/JobSeekerDashboard.test.js
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser, mockProfile, mockApplications, mockDocuments } from '../../../utils/testUtils';
import JobSeekerDashboard from '../JobSeekerDashboard';

// Mock the actions
jest.mock('../../../store/actions', () => ({
  fetchUserProfile: jest.fn(() => ({ type: 'FETCH_USER_PROFILE_SUCCESS', payload: {} })),
  fetchApplications: jest.fn(() => ({ type: 'FETCH_APPLICATIONS_SUCCESS', payload: {} })),
  fetchDocuments: jest.fn(() => ({ type: 'FETCH_DOCUMENTS_SUCCESS', payload: {} }))
}));

describe('JobSeekerDashboard Component', () => {
  const initialState = {
    auth: {
      user: mockUser
    },
    profile: {
      profile: mockProfile,
      loading: false
    },
    applications: {
      applications: mockApplications,
      loading: false
    },
    documents: {
      documents: mockDocuments,
      loading: false
    }
  };

  test('renders JobSeekerDashboard correctly', async () => {
    renderWithProviders(<JobSeekerDashboard />, { initialState });

    // Wait for dashboard to render
    await waitFor(() => {
      expect(screen.getByText(`Welcome, ${mockUser.firstName}`)).toBeInTheDocument();
    });

    // Check for stat cards
    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();

    // Check for profile completion section
    expect(screen.getByText('Profile Completion')).toBeInTheDocument();
    expect(screen.getByText(`${mockProfile.completionPercentage}% Complete`)).toBeInTheDocument();

    // Check for applications section
    expect(screen.getByText('Recent Applications')).toBeInTheDocument();
    expect(screen.getByText(mockApplications[0].job.title)).toBeInTheDocument();
  });

  test('shows loading state when data is loading', () => {
    const loadingState = {
      auth: {
        user: mockUser
      },
      profile: {
        profile: null,
        loading: true
      },
      applications: {
        applications: [],
        loading: true
      },
      documents: {
        documents: [],
        loading: true
      }
    };

    renderWithProviders(<JobSeekerDashboard />, { initialState: loadingState });
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  test('shows empty state when no applications exist', () => {
    const emptyState = {
      auth: {
        user: mockUser
      },
      profile: {
        profile: mockProfile,
        loading: false
      },
      applications: {
        applications: [],
        loading: false
      },
      documents: {
        documents: mockDocuments,
        loading: false
      }
    };

    renderWithProviders(<JobSeekerDashboard />, { initialState: emptyState });
    expect(screen.getByText('You haven\'t applied to any jobs yet.')).toBeInTheDocument();
    expect(screen.getByText('Browse Jobs')).toBeInTheDocument();
  });
});

// src/components/dashboard/__tests__/VerificationStatus.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import VerificationStatus from '../VerificationStatus';

describe('VerificationStatus Component', () => {
  test('renders pending status correctly', () => {
    render(<VerificationStatus status="PENDING" />);
    
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
    expect(screen.getByText('Pending Verification').parentElement).toHaveStyle('color: #FFA500');
  });

  test('renders verified status correctly', () => {
    render(<VerificationStatus status="VERIFIED" />);
    
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Verified').parentElement).toHaveStyle('color: #4CAF50');
  });

  test('renders rejected status correctly', () => {
    render(<VerificationStatus status="REJECTED" />);
    
    expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    expect(screen.getByText('Verification Failed').parentElement).toHaveStyle('color: #F44336');
  });

  test('renders expired status correctly', () => {
    render(<VerificationStatus status="EXPIRED" />);
    
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Expired').parentElement).toHaveStyle('color: #607D8B');
  });

  test('hides text when showText is false', () => {
    render(<VerificationStatus status="VERIFIED" showText={false} />);
    
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });
});

// src/components/dashboard/__tests__/StatCard.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from '../StatCard';

describe('StatCard Component', () => {
  test('renders basic stat card correctly', () => {
    render(
      <StatCard 
        title="Applications" 
        value={42} 
        icon="file-text" 
      />
    );
    
    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(document.querySelector('.icon-file-text')).toBeInTheDocument();
  });

  test('renders card with trend indicator', () => {
    render(
      <StatCard 
        title="Users" 
        value={500} 
        icon="users" 
        trend="up"
        trendValue={15}
      />
    );
    
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(document.querySelector('.stat-card__trend--up')).toBeInTheDocument();
  });

  test('renders card with custom color', () => {
    render(
      <StatCard 
        title="Alerts" 
        value={3} 
        icon="alert-triangle" 
        color="warning"
      />
    );
    
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(document.querySelector('.stat-card--warning')).toBeInTheDocument();
  });
});

// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/store/(.*)$': '<rootDir>/src/store/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js'
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70
    }
  }
};
