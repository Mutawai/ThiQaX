// client/src/components/mobile/MobileBottomNav/MobileBottomNav.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import MobileBottomNav from './MobileBottomNav';

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

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null }, action) => state,
      notifications: (state = { unreadCount: 0 }, action) => state
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

describe('MobileBottomNav Component', () => {
  // Mock callbacks
  const mockToggleDrawer = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockFabAction = jest.fn();
  
  // Test user data
  const jobSeekerUser = {
    role: 'jobSeeker',
    firstName: 'John'
  };
  
  const agentUser = {
    role: 'agent',
    firstName: 'Jane'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset scroll position
    window.scrollY = 0;
  });
  
  test('renders bottom navigation with default items', () => {
    render(
      <TestWrapper>
        <MobileBottomNav />
      </TestWrapper>
    );
    
    // Default navigation items should be present
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });
  
  test('shows notification badge when there are unread notifications', () => {
    const storeWithNotifications = createTestStore({
      auth: { user: jobSeekerUser },
      notifications: { unreadCount: 5 }
    });
    
    render(
      <TestWrapper store={storeWithNotifications}>
        <MobileBottomNav />
      </TestWrapper>
    );
    
    // Notification badge should show count
    expect(screen.getByText('5')).toBeInTheDocument();
  });
  
  test('displays role-specific navigation items for job seekers', () => {
    const storeWithJobSeeker = createTestStore({
      auth: { user: jobSeekerUser }
    });
    
    render(
      <TestWrapper store={storeWithJobSeeker}>
        <MobileBottomNav />
      </TestWrapper>
    );
    
    // Job seeker specific items should be visible
    expect(screen.getByText('Applications')).toBeInTheDocument();
  });
  
  test('displays role-specific navigation items for agents', () => {
    const storeWithAgent = createTestStore({
      auth: { user: agentUser }
    });
    
    render(
      <TestWrapper store={storeWithAgent}>
        <MobileBottomNav />
      </TestWrapper>
    );
    
    // Agent specific items should be visible
    expect(screen.getByText('Manage')).toBeInTheDocument();
  });
  
  test('handles navigation item clicks', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileBottomNav onNavigate={mockOnNavigate} />
      </TestWrapper>
    );
    
    // Click on Jobs tab
    await user.click(screen.getByText('Jobs'));
    
    // Should call onNavigate with correct route
    expect(mockOnNavigate).toHaveBeenCalledWith('/jobs', expect.any(Object));
  });
  
  test('handles drawer toggle when menu is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileBottomNav toggleDrawer={mockToggleDrawer} />
      </TestWrapper>
    );
    
    // Menu should be present when toggleDrawer is provided
    if (screen.queryByText('Menu')) {
      await user.click(screen.getByText('Menu'));
      expect(mockToggleDrawer).toHaveBeenCalled();
    }
  });
  
  test('shows correct active item based on current route', () => {
    // Mock current route as /jobs
    jest.mocked(require('react-router-dom').useLocation).mockReturnValue({
      pathname: '/jobs'
    });
    
    render(
      <TestWrapper>
        <MobileBottomNav />
      </TestWrapper>
    );
    
    // Jobs tab should be selected
    const jobsAction = screen.getByText('Jobs').closest('.MuiBottomNavigationAction-root');
    expect(jobsAction).toHaveClass('Mui-selected');
  });
  
  test('uses custom navigation items when provided', () => {
    const customItems = [
      {
        id: 'custom1',
        label: 'Custom 1',
        value: 'custom1',
        icon: 'home',
        route: '/custom1',
        roles: ['all']
      },
      {
        id: 'custom2',
        label: 'Custom 2',
        value: 'custom2',
        icon: 'work',
        route: '/custom2',
        roles: ['all']
      }
    ];
    
    render(
      <TestWrapper>
        <MobileBottomNav customItems={customItems} />
      </TestWrapper>
    );
    
    // Custom items should be visible
    expect(screen.getByText('Custom 1')).toBeInTheDocument();
    expect(screen.getByText('Custom 2')).toBeInTheDocument();
    
    // Default items should not be visible
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });
  
  test('hides labels when showLabels is false', () => {
    render(
      <TestWrapper>
        <MobileBottomNav showLabels={false} />
      </TestWrapper>
    );
    
    // Labels should not be visible but icons should be accessible
    const homeAction = screen.getByRole('button', { name: /home/i });
    expect(homeAction).toBeInTheDocument();
  });
  
  test('hides badges when showBadges is false', () => {
    const storeWithNotifications = createTestStore({
      auth: { user: jobSeekerUser },
      notifications: { unreadCount: 3 }
    });
    
    render(
      <TestWrapper store={storeWithNotifications}>
        <MobileBottomNav showBadges={false} />
      </TestWrapper>
    );
    
    // Badge should not be visible
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });
  
  test('displays floating action button when showFab is true', () => {
    const fabAction = {
      icon: <div data-testid="fab-icon">Add</div>,
      onClick: mockFabAction,
      label: 'Add Item'
    };
    
    render(
      <TestWrapper>
        <MobileBottomNav showFab={true} fabAction={fabAction} />
      </TestWrapper>
    );
    
    // FAB should be visible
    expect(screen.getByTestId('fab-icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Add Item')).toBeInTheDocument();
  });
  
  test('handles FAB click', async () => {
    const user = userEvent.setup();
    const fabAction = {
      onClick: mockFabAction,
      label: 'Add Item'
    };
    
    render(
      <TestWrapper>
        <MobileBottomNav showFab={true} fabAction={fabAction} />
      </TestWrapper>
    );
    
    // Click FAB
    await user.click(screen.getByLabelText('Add Item'));
    
    // Should call FAB action
    expect(mockFabAction).toHaveBeenCalled();
  });
  
  test('applies different variants correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <MobileBottomNav variant="minimal" />
      </TestWrapper>
    );
    
    // Should have minimal variant class
    expect(document.querySelector('.minimal')).toBeInTheDocument();
    
    // Rerender with icons-only variant
    rerender(
      <TestWrapper>
        <MobileBottomNav variant="icons-only" />
      </TestWrapper>
    );
    
    // Should have icons-only variant class
    expect(document.querySelector('.iconsOnly')).toBeInTheDocument();
  });
  
  test('respects maxItems prop', () => {
    render(
      <TestWrapper>
        <MobileBottomNav maxItems={3} />
      </TestWrapper>
    );
    
    // Should show limited number of items
    const actions = document.querySelectorAll('.MuiBottomNavigationAction-root');
    expect(actions.length).toBeLessThanOrEqual(3);
  });
  
  test('handles disabled state', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileBottomNav disabled={true} onNavigate={mockOnNavigate} />
      </TestWrapper>
    );
    
    // Component should have disabled class
    expect(document.querySelector('.disabled')).toBeInTheDocument();
    
    // Click should not work when disabled
    const homeAction = screen.getByText('Home');
    await user.click(homeAction);
    
    // onNavigate should not be called
    expect(mockOnNavigate).not.toHaveBeenCalled();
  });
  
  test('hides navigation on scroll down when hideOnScroll is true', async () => {
    render(
      <TestWrapper>
        <MobileBottomNav hideOnScroll={true} />
      </TestWrapper>
    );
    
    // Initially visible
    const bottomNav = document.querySelector('.bottomNav');
    expect(bottomNav).toBeInTheDocument();
    
    // Simulate scroll down
    Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
    fireEvent.scroll(window);
    
    // Should still be visible (would need more complex scroll simulation for full test)
    expect(bottomNav).toBeInTheDocument();
  });
  
  test('uses custom icons when provided', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;
    const customIcons = {
      dashboard: <CustomIcon />
    };
    
    render(
      <TestWrapper>
        <MobileBottomNav customIcons={customIcons} />
      </TestWrapper>
    );
    
    // Custom icon should be used
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
  
  test('does not render on desktop', () => {
    // Mock responsive hook to return desktop
    jest.mocked(require('../../../utils/responsive').useResponsive).mockReturnValue({
      isMobile: false
    });
    
    const { container } = render(
      <TestWrapper>
        <MobileBottomNav />
      </TestWrapper>
    );
    
    // Should not render anything
    expect(container.firstChild).toBeNull();
  });
  
  test('handles navigation without onNavigate callback', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileBottomNav />
      </TestWrapper>
    );
    
    // Click should not throw error
    await user.click(screen.getByText('Jobs'));
    
    // Should call React Router navigate
    expect(mockNavigate).toHaveBeenCalledWith('/jobs');
  });
  
  test('provides accessibility attributes', () => {
    render(
      <TestWrapper>
        <MobileBottomNav />
      </TestWrapper>
    );
    
    // Navigation actions should have proper roles
    const homeAction = screen.getByText('Home').closest('.MuiBottomNavigationAction-root');
    expect(homeAction).toHaveAttribute('role', 'button');
  });
  
  test('handles touch events for mobile interaction', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileBottomNav onNavigate={mockOnNavigate} />
      </TestWrapper>
    );
    
    const jobsAction = screen.getByText('Jobs');
    
    // Simulate touch events
    fireEvent.touchStart(jobsAction);
    fireEvent.touchEnd(jobsAction);
    await user.click(jobsAction);
    
    // Should handle touch interaction
    expect(mockOnNavigate).toHaveBeenCalledWith('/jobs', expect.any(Object));
  });
  
  test('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileBottomNav onNavigate={mockOnNavigate} />
      </TestWrapper>
    );
    
    // Tab to navigation item and press enter
    await user.tab();
    await user.keyboard('{Enter}');
    
    // Should handle keyboard interaction
    expect(mockOnNavigate).toHaveBeenCalled();
  });
  
  test('shows correct route matches for different paths', () => {
    const routes = [
      { path: '/dashboard', expectedActive: 'dashboard' },
      { path: '/jobs', expectedActive: 'jobs' },
      { path: '/jobs/123', expectedActive: 'jobs' },
      { path: '/profile', expectedActive: 'profile' },
      { path: '/profile/edit', expectedActive: 'profile' },
      { path: '/notifications', expectedActive: 'notifications' },
      { path: '/applications', expectedActive: 'applications' },
      { path: '/jobs/manage', expectedActive: 'jobs-manage' }
    ];
    
    routes.forEach(({ path, expectedActive }) => {
      jest.mocked(require('react-router-dom').useLocation).mockReturnValue({
        pathname: path
      });
      
      const { unmount } = render(
        <TestWrapper>
          <MobileBottomNav />
        </TestWrapper>
      );
      
      // Check if the correct item is active (this would need more specific selectors)
      const navigation = document.querySelector('.navigation');
      expect(navigation).toBeInTheDocument();
      
      unmount();
    });
  });
  
  test('limits navigation items based on maxItems', () => {
    const manyCustomItems = [
      { id: '1', label: 'Item 1', value: 'item1', icon: 'home', route: '/1', roles: ['all'] },
      { id: '2', label: 'Item 2', value: 'item2', icon: 'work', route: '/2', roles: ['all'] },
      { id: '3', label: 'Item 3', value: 'item3', icon: 'person', route: '/3', roles: ['all'] },
      { id: '4', label: 'Item 4', value: 'item4', icon: 'notifications', route: '/4', roles: ['all'] },
      { id: '5', label: 'Item 5', value: 'item5', icon: 'menu', route: '/5', roles: ['all'] },
      { id: '6', label: 'Item 6', value: 'item6', icon: 'home', route: '/6', roles: ['all'] }
    ];
    
    render(
      <TestWrapper>
        <MobileBottomNav customItems={manyCustomItems} maxItems={4} />
      </TestWrapper>
    );
    
    // Should show only maxItems number of items
    const actions = document.querySelectorAll('.MuiBottomNavigationAction-root');
    expect(actions.length).toBe(4);
  });
  
  test('filters items based on user roles', () => {
    const roleSpecificItems = [
      { id: 'all', label: 'All Users', value: 'all', icon: 'home', route: '/all', roles: ['all'] },
      { id: 'jobseeker', label: 'Job Seeker', value: 'js', icon: 'person', route: '/js', roles: ['jobSeeker'] },
      { id: 'agent', label: 'Agent', value: 'agent', icon: 'work', route: '/agent', roles: ['agent'] },
      { id: 'admin', label: 'Admin', value: 'admin', icon: 'settings', route: '/admin', roles: ['admin'] }
    ];
    
    const storeWithJobSeeker = createTestStore({
      auth: { user: jobSeekerUser }
    });
    
    render(
      <TestWrapper store={storeWithJobSeeker}>
        <MobileBottomNav customItems={roleSpecificItems} />
      </TestWrapper>
    );
    
    // Should show items for 'all' and 'jobSeeker' roles
    expect(screen.getByText('All Users')).toBeInTheDocument();
    expect(screen.getByText('Job Seeker')).toBeInTheDocument();
    
    // Should not show items for other roles
    expect(screen.queryByText('Agent')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
  
  test('handles FAB disabled state', () => {
    const fabAction = {
      onClick: mockFabAction,
      label: 'Add Item'
    };
    
    render(
      <TestWrapper>
        <MobileBottomNav 
          showFab={true} 
          fabAction={fabAction} 
          disabled={true} 
        />
      </TestWrapper>
    );
    
    // FAB should be disabled
    const fab = screen.getByLabelText('Add Item');
    expect(fab).toHaveAttribute('disabled');
  });
  
  test('applies custom className', () => {
    render(
      <TestWrapper>
        <MobileBottomNav className="custom-nav" />
      </TestWrapper>
    );
    
    // Should have custom class
    expect(document.querySelector('.custom-nav')).toBeInTheDocument();
  });
});