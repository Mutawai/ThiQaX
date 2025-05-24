// client/src/components/mobile/MobileLayout/MobileLayout.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import MobileLayout from './MobileLayout';

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' })
}));

// Mock the responsive hook
jest.mock('../../../utils/responsive', () => ({
  useResponsive: () => ({ isMobile: true })
}));

// Mock child components
jest.mock('../MobileHeader/MobileHeader', () => {
  return function MockMobileHeader({ toggleDrawer }) {
    return (
      <div data-testid="mobile-header">
        <button onClick={toggleDrawer}>Toggle Drawer</button>
      </div>
    );
  };
});

jest.mock('../MobileBottomNav/MobileBottomNav', () => {
  return function MockMobileBottomNav({ toggleDrawer }) {
    return (
      <div data-testid="mobile-bottom-nav">
        <button onClick={toggleDrawer}>Toggle Drawer</button>
      </div>
    );
  };
});

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: { role: 'jobSeeker', firstName: 'John' } }, action) => state
    },
    preloadedState: initialState
  });
};

// Create a test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children, store = createTestStore() }) => (
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
);

describe('MobileLayout Component', () => {
  // Mock callbacks
  const mockOnNavigate = jest.fn();
  const mockOnLogout = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders layout with all components by default', () => {
    render(
      <TestWrapper>
        <MobileLayout>
          <div data-testid="test-content">Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Should render all main components
    expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
  
  test('renders children content correctly', () => {
    render(
      <TestWrapper>
        <MobileLayout>
          <div data-testid="child-content">
            <h1>Page Title</h1>
            <p>Page content goes here</p>
          </div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Children should be rendered in content area
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Page Title')).toBeInTheDocument();
    expect(screen.getByText('Page content goes here')).toBeInTheDocument();
  });
  
  test('opens and closes drawer correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Drawer should be closed initially
    expect(screen.queryByText('ThiQaX')).not.toBeInTheDocument();
    
    // Click toggle button to open drawer
    const toggleButton = screen.getAllByText('Toggle Drawer')[0];
    await user.click(toggleButton);
    
    // Drawer content should be visible
    await waitFor(() => {
      expect(screen.getByText('ThiQaX')).toBeInTheDocument();
    });
    
    // Navigation items should be visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Find Jobs')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });
  
  test('displays navigation items based on user role', () => {
    const jobSeekerStore = createTestStore({
      auth: { user: { role: 'jobSeeker', firstName: 'John' } }
    });
    
    render(
      <TestWrapper store={jobSeekerStore}>
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Job seeker specific items should be visible
    waitFor(() => {
      expect(screen.getByText('My Documents')).toBeInTheDocument();
      expect(screen.getByText('My Applications')).toBeInTheDocument();
    });
  });
  
  test('displays admin navigation items for admin users', () => {
    const adminStore = createTestStore({
      auth: { user: { role: 'admin', firstName: 'Admin' } }
    });
    
    render(
      <TestWrapper store={adminStore}>
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Admin specific items should be visible
    waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      expect(screen.getByText('Verification')).toBeInTheDocument();
    });
  });
  
  test('displays agent navigation items for agent users', () => {
    const agentStore = createTestStore({
      auth: { user: { role: 'agent', firstName: 'Agent' } }
    });
    
    render(
      <TestWrapper store={agentStore}>
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Agent specific items should be visible
    waitFor(() => {
      expect(screen.getByText('Manage Jobs')).toBeInTheDocument();
      expect(screen.getByText('Post a Job')).toBeInTheDocument();
    });
  });
  
  test('handles navigation item clicks', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileLayout onNavigate={mockOnNavigate}>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    await user.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Click on a navigation item
    await waitFor(() => {
      expect(screen.getByText('Find Jobs')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Find Jobs'));
    
    // Should call onNavigate with correct path
    expect(mockOnNavigate).toHaveBeenCalledWith('/jobs', expect.any(Object));
  });
  
  test('handles logout correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileLayout onLogout={mockOnLogout}>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    await user.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Click logout
    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Logout'));
    
    // Should call onLogout
    expect(mockOnLogout).toHaveBeenCalled();
  });
  
  test('hides header when showHeader is false', () => {
    render(
      <TestWrapper>
        <MobileLayout showHeader={false}>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Header should not be visible
    expect(screen.queryByTestId('mobile-header')).not.toBeInTheDocument();
  });
  
  test('hides bottom navigation when showBottomNav is false', () => {
    render(
      <TestWrapper>
        <MobileLayout showBottomNav={false}>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Bottom nav should not be visible
    expect(screen.queryByTestId('mobile-bottom-nav')).not.toBeInTheDocument();
  });
  
  test('hides drawer when showDrawer is false', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileLayout showDrawer={false}>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Try to open drawer
    const toggleButtons = screen.queryAllByText('Toggle Drawer');
    if (toggleButtons.length > 0) {
      await user.click(toggleButtons[0]);
    }
    
    // Drawer content should not be visible
    expect(screen.queryByText('ThiQaX')).not.toBeInTheDocument();
  });
  
  test('uses custom navigation items when provided', () => {
    const customItems = [
      {
        id: 'custom1',
        text: 'Custom Item 1',
        icon: <div>Icon1</div>,
        path: '/custom1',
        roles: ['all']
      },
      {
        id: 'custom2',
        text: 'Custom Item 2',
        icon: <div>Icon2</div>,
        path: '/custom2',
        roles: ['all']
      }
    ];
    
    render(
      <TestWrapper>
        <MobileLayout customNavigationItems={customItems}>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Custom items should be visible
    waitFor(() => {
      expect(screen.getByText('Custom Item 1')).toBeInTheDocument();
      expect(screen.getByText('Custom Item 2')).toBeInTheDocument();
      
      // Default items should not be visible
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });
  
  test('uses custom drawer title', () => {
    render(
      <TestWrapper>
        <MobileLayout drawerTitle="Custom App">
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Custom title should be visible
    waitFor(() => {
      expect(screen.getByText('Custom App')).toBeInTheDocument();
    });
  });
  
  test('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <MobileLayout className="custom-layout">
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Should have custom class
    expect(container.querySelector('.custom-layout')).toBeInTheDocument();
  });
  
  test('handles persistent drawer mode', () => {
    render(
      <TestWrapper>
        <MobileLayout persistent={true}>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Drawer should use persistent variant
    waitFor(() => {
      const drawer = document.querySelector('.MuiDrawer-root');
      expect(drawer).toBeInTheDocument();
    });
  });
  
  test('highlights active navigation item', () => {
    // Mock current location as /jobs
    jest.mocked(require('react-router-dom').useLocation).mockReturnValue({
      pathname: '/jobs'
    });
    
    render(
      <TestWrapper>
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Jobs nav item should be selected
    waitFor(() => {
      const jobsItem = screen.getByText('Find Jobs').closest('div');
      expect(jobsItem).toHaveClass('activeItem');
    });
  });
  
  test('closes drawer on navigation for mobile', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    await user.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Verify drawer is open
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    
    // Click on navigation item
    await user.click(screen.getByText('Dashboard'));
    
    // Drawer should close
    await waitFor(() => {
      expect(screen.queryByText('ThiQaX')).not.toBeInTheDocument();
    });
  });
  
  test('handles touch events for mobile interaction', () => {
    render(
      <TestWrapper>
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Simulate touch on navigation item
    waitFor(() => {
      const dashboardItem = screen.getByText('Dashboard');
      fireEvent.touchStart(dashboardItem);
      fireEvent.touchEnd(dashboardItem);
      fireEvent.click(dashboardItem);
      
      // Should handle touch interaction
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  test('provides accessibility attributes', () => {
    render(
      <TestWrapper>
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Navigation items should have proper attributes
    waitFor(() => {
      const dashboardItem = screen.getByText('Dashboard').closest('div');
      expect(dashboardItem).toHaveAttribute('role', 'button');
    });
  });
  
  test('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    await user.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Should be able to navigate with keyboard
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    
    // Tab to navigation item and press enter
    await user.tab();
    await user.keyboard('{Enter}');
    
    // Should handle keyboard navigation
    expect(mockNavigate).toHaveBeenCalled();
  });
  
  test('renders desktop layout when not mobile', () => {
    // Mock responsive hook to return desktop
    jest.mocked(require('../../../utils/responsive').useResponsive).mockReturnValue({
      isMobile: false
    });
    
    render(
      <TestWrapper>
        <MobileLayout>
          <div data-testid="desktop-content">Desktop Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Should render desktop layout
    expect(screen.getByTestId('desktop-content')).toBeInTheDocument();
    
    // Mobile components should not be rendered
    expect(screen.queryByTestId('mobile-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-bottom-nav')).not.toBeInTheDocument();
  });
  
  test('filters navigation items by user role', () => {
    const sponsorStore = createTestStore({
      auth: { user: { role: 'sponsor', firstName: 'Sponsor' } }
    });
    
    render(
      <TestWrapper store={sponsorStore}>
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getAllByText('Toggle Drawer')[0]);
    
    // Should show sponsor-specific items
    waitFor(() => {
      expect(screen.getByText('My Company')).toBeInTheDocument();
      
      // Should not show job seeker or agent items
      expect(screen.queryByText('My Documents')).not.toBeInTheDocument();
      expect(screen.queryByText('Manage Jobs')).not.toBeInTheDocument();
    });
  });
});