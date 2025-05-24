// client/src/components/mobile/MobileHeader/MobileHeader.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import MobileHeader from './MobileHeader';

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

describe('MobileHeader Component', () => {
  // Mock callbacks
  const mockToggleDrawer = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockOnLogout = jest.fn();
  
  // Test user data
  const testUser = {
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://example.com/avatar.jpg'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders header with default title', () => {
    render(
      <TestWrapper>
        <MobileHeader />
      </TestWrapper>
    );
    
    // Default title should be "Dashboard" based on current route
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
  
  test('renders custom title when provided', () => {
    render(
      <TestWrapper>
        <MobileHeader title="Custom Title" />
      </TestWrapper>
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });
  
  test('shows menu button by default for main routes', () => {
    render(
      <TestWrapper>
        <MobileHeader toggleDrawer={mockToggleDrawer} />
      </TestWrapper>
    );
    
    // Menu button should be present
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    
    // Back button should not be present
    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument();
  });
  
  test('shows back button for non-main routes', () => {
    // Mock a different route
    jest.mocked(require('react-router-dom').useLocation).mockReturnValue({
      pathname: '/jobs/123'
    });
    
    render(
      <TestWrapper>
        <MobileHeader />
      </TestWrapper>
    );
    
    // Back button should be present
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
    
    // Menu button should not be present
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
  });
  
  test('handles menu button click', () => {
    render(
      <TestWrapper>
        <MobileHeader toggleDrawer={mockToggleDrawer} />
      </TestWrapper>
    );
    
    // Click menu button
    fireEvent.click(screen.getByLabelText('Open menu'));
    
    // Should call toggleDrawer
    expect(mockToggleDrawer).toHaveBeenCalled();
  });
  
  test('handles back button click', () => {
    // Mock a route that should show back button
    jest.mocked(require('react-router-dom').useLocation).mockReturnValue({
      pathname: '/settings'
    });
    
    render(
      <TestWrapper>
        <MobileHeader onNavigate={mockOnNavigate} />
      </TestWrapper>
    );
    
    // Click back button
    fireEvent.click(screen.getByLabelText('Go back'));
    
    // Should call onNavigate with -1
    expect(mockOnNavigate).toHaveBeenCalledWith(-1);
  });
  
  test('displays notification badge when there are unread notifications', () => {
    const storeWithNotifications = createTestStore({
      auth: { user: testUser },
      notifications: { unreadCount: 5 }
    });
    
    render(
      <TestWrapper store={storeWithNotifications}>
        <MobileHeader />
      </TestWrapper>
    );
    
    // Notification badge should show count
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Notification button should have proper aria-label
    expect(screen.getByLabelText('Notifications (5 unread)')).toBeInTheDocument();
  });
  
  test('handles notification button click', () => {
    const storeWithUser = createTestStore({
      auth: { user: testUser }
    });
    
    render(
      <TestWrapper store={storeWithUser}>
        <MobileHeader onNavigate={mockOnNavigate} />
      </TestWrapper>
    );
    
    // Click notification button
    fireEvent.click(screen.getByLabelText(/Notifications/));
    
    // Should navigate to notifications page
    expect(mockOnNavigate).toHaveBeenCalledWith('/notifications');
  });
  
  test('shows user avatar when user is logged in', () => {
    const storeWithUser = createTestStore({
      auth: { user: testUser }
    });
    
    render(
      <TestWrapper store={storeWithUser}>
        <MobileHeader />
      </TestWrapper>
    );
    
    // Profile button should be present
    expect(screen.getByLabelText('Open profile menu')).toBeInTheDocument();
    
    // Avatar should show first initial
    expect(screen.getByText('J')).toBeInTheDocument();
  });
  
  test('opens profile menu when avatar is clicked', async () => {
    const user = userEvent.setup();
    const storeWithUser = createTestStore({
      auth: { user: testUser }
    });
    
    render(
      <TestWrapper store={storeWithUser}>
        <MobileHeader />
      </TestWrapper>
    );
    
    // Click on profile button
    await user.click(screen.getByLabelText('Open profile menu'));
    
    // Profile menu items should be visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
  
  test('handles profile menu navigation', async () => {
    const user = userEvent.setup();
    const storeWithUser = createTestStore({
      auth: { user: testUser }
    });
    
    render(
      <TestWrapper store={storeWithUser}>
        <MobileHeader onNavigate={mockOnNavigate} />
      </TestWrapper>
    );
    
    // Open profile menu
    await user.click(screen.getByLabelText('Open profile menu'));
    
    // Click on "My Profile"
    await user.click(screen.getByText('My Profile'));
    
    // Should navigate to profile page
    expect(mockOnNavigate).toHaveBeenCalledWith('/profile');
  });
  
  test('handles logout from profile menu', async () => {
    const user = userEvent.setup();
    const storeWithUser = createTestStore({
      auth: { user: testUser }
    });
    
    render(
      <TestWrapper store={storeWithUser}>
        <MobileHeader onLogout={mockOnLogout} />
      </TestWrapper>
    );
    
    // Open profile menu
    await user.click(screen.getByLabelText('Open profile menu'));
    
    // Click logout
    await user.click(screen.getByText('Logout'));
    
    // Should call onLogout
    expect(mockOnLogout).toHaveBeenCalled();
  });
  
  test('hides notifications when showNotifications is false', () => {
    const storeWithUser = createTestStore({
      auth: { user: testUser },
      notifications: { unreadCount: 3 }
    });
    
    render(
      <TestWrapper store={storeWithUser}>
        <MobileHeader showNotifications={false} />
      </TestWrapper>
    );
    
    // Notification button should not be present
    expect(screen.queryByLabelText(/Notifications/)).not.toBeInTheDocument();
  });
  
  test('hides profile when showProfile is false', () => {
    const storeWithUser = createTestStore({
      auth: { user: testUser }
    });
    
    render(
      <TestWrapper store={storeWithUser}>
        <MobileHeader showProfile={false} />
      </TestWrapper>
    );
    
    // Profile button should not be present
    expect(screen.queryByLabelText('Open profile menu')).not.toBeInTheDocument();
  });
  
  test('displays custom actions', () => {
    const customActions = [
      {
        icon: <div data-testid="custom-icon">Custom</div>,
        onClick: jest.fn(),
        label: 'Custom Action'
      }
    ];
    
    render(
      <TestWrapper>
        <MobileHeader customActions={customActions} />
      </TestWrapper>
    );
    
    // Custom action should be present
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Custom Action')).toBeInTheDocument();
  });
  
  test('handles custom action click', () => {
    const mockCustomAction = jest.fn();
    const customActions = [
      {
        icon: <div>Custom</div>,
        onClick: mockCustomAction,
        label: 'Custom Action'
      }
    ];
    
    render(
      <TestWrapper>
        <MobileHeader customActions={customActions} />
      </TestWrapper>
    );
    
    // Click custom action
    fireEvent.click(screen.getByLabelText('Custom Action'));
    
    // Should call custom action
    expect(mockCustomAction).toHaveBeenCalled();
  });
  
  test('shows more actions menu when there are many custom actions', async () => {
    const user = userEvent.setup();
    const customActions = [
      { icon: <div>Action 1</div>, onClick: jest.fn(), label: 'Action 1' },
      { icon: <div>Action 2</div>, onClick: jest.fn(), label: 'Action 2' },
      { icon: <div>Action 3</div>, onClick: jest.fn(), label: 'Action 3' },
      { icon: <div>Action 4</div>, onClick: jest.fn(), label: 'Action 4' }
    ];
    
    render(
      <TestWrapper>
        <MobileHeader customActions={customActions} />
      </TestWrapper>
    );
    
    // More actions button should be present
    expect(screen.getByLabelText('More actions')).toBeInTheDocument();
    
    // Click more actions button
    await user.click(screen.getByLabelText('More actions'));
    
    // Additional actions should be visible in menu
    expect(screen.getByText('Action 3')).toBeInTheDocument();
    expect(screen.getByText('Action 4')).toBeInTheDocument();
  });
  
  test('applies different variants correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <MobileHeader variant="minimal" />
      </TestWrapper>
    );
    
    // Should have minimal variant class
    expect(document.querySelector('.minimal')).toBeInTheDocument();
    
    // Rerender with transparent variant
    rerender(
      <TestWrapper>
        <MobileHeader variant="transparent" />
      </TestWrapper>
    );
    
    // Should have transparent variant class
    expect(document.querySelector('.transparent')).toBeInTheDocument();
  });
  
  test('forces back button when showBackButton is true', () => {
    render(
      <TestWrapper>
        <MobileHeader showBackButton={true} />
      </TestWrapper>
    );
    
    // Back button should be present even on main route
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
    
    // Menu button should not be present
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
  });
  
  test('forces menu button when showMenuButton is true', () => {
    // Mock a route that normally shows back button
    jest.mocked(require('react-router-dom').useLocation).mockReturnValue({
      pathname: '/settings'
    });
    
    render(
      <TestWrapper>
        <MobileHeader showMenuButton={true} toggleDrawer={mockToggleDrawer} />
      </TestWrapper>
    );
    
    // Menu button should be present even on non-main route
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    
    // Back button should not be present
    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument();
  });
  
  test('determines correct page title based on route', () => {
    // Test different routes
    const routes = [
      { path: '/jobs', expectedTitle: 'Find Jobs' },
      { path: '/applications', expectedTitle: 'My Applications' },
      { path: '/profile', expectedTitle: 'My Profile' },
      { path: '/settings', expectedTitle: 'Settings' },
      { path: '/jobs/123', expectedTitle: 'Job Details' },
      { path: '/unknown', expectedTitle: 'ThiQaX' }
    ];
    
    routes.forEach(({ path, expectedTitle }) => {
      jest.mocked(require('react-router-dom').useLocation).mockReturnValue({
        pathname: path
      });
      
      const { unmount } = render(
        <TestWrapper>
          <MobileHeader />
        </TestWrapper>
      );
      
      expect(screen.getByText(expectedTitle)).toBeInTheDocument();
      unmount();
    });
  });
  
  test('does not render on desktop when variant is default', () => {
    // Mock responsive hook to return desktop
    jest.mocked(require('../../../utils/responsive').useResponsive).mockReturnValue({
      isMobile: false
    });
    
    const { container } = render(
      <TestWrapper>
        <MobileHeader />
      </TestWrapper>
    );
    
    // Should not render anything
    expect(container.firstChild).toBeNull();
  });
  
  test('renders on desktop when variant is minimal', () => {
    // Mock responsive hook to return desktop
    jest.mocked(require('../../../utils/responsive').useResponsive).mockReturnValue({
      isMobile: false
    });
    
    render(
      <TestWrapper>
        <MobileHeader variant="minimal" />
      </TestWrapper>
    );
    
    // Should render header
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
  
  test('handles touch events for mobile interaction', () => {
    const storeWithUser = createTestStore({
      auth: { user: testUser }
    });
    
    render(
      <TestWrapper store={storeWithUser}>
        <MobileHeader toggleDrawer={mockToggleDrawer} />
      </TestWrapper>
    );
    
    const menuButton = screen.getByLabelText('Open menu');
    
    // Simulate touch events
    fireEvent.touchStart(menuButton);
    fireEvent.touchEnd(menuButton);
    fireEvent.click(menuButton);
    
    // Should handle touch interaction
    expect(mockToggleDrawer).toHaveBeenCalled();
  });
  
  test('provides accessibility attributes', () => {
    const storeWithUser = createTestStore({
      auth: { user: testUser }
    });
    
    render(
      <TestWrapper store={storeWithUser}>
        <MobileHeader toggleDrawer={mockToggleDrawer} />
      </TestWrapper>
    );
    
    // Buttons should have proper aria labels
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    expect(screen.getByLabelText('Open profile menu')).toBeInTheDocument();
    expect(screen.getByLabelText(/Notifications/)).toBeInTheDocument();
  });
  
  test('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    const storeWithUser = createTestStore({
      auth: { user: testUser }
    });
    
    render(
      <TestWrapper store={storeWithUser}>
        <MobileHeader toggleDrawer={mockToggleDrawer} />
      </TestWrapper>
    );
    
    // Tab to menu button and press enter
    await user.tab();
    await user.keyboard('{Enter}');
    
    // Should handle keyboard interaction
    expect(mockToggleDrawer).toHaveBeenCalled();
  });
  
  test('closes profile menu when clicking outside', async () => {
    const user = userEvent.setup();
    const storeWithUser = createTestStore({
      auth: { user: testUser }
    });
    
    render(
      <div>
        <MobileHeader />
        <div data-testid="outside">Outside Element</div>
      </div>,
      { wrapper: ({ children }) => <TestWrapper store={storeWithUser}>{children}</TestWrapper> }
    );
    
    // Open profile menu
    await user.click(screen.getByLabelText('Open profile menu'));
    
    // Menu should be open
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    
    // Click outside
    await user.click(screen.getByTestId('outside'));
    
    // Menu should be closed
    await waitFor(() => {
      expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    });
  });
});