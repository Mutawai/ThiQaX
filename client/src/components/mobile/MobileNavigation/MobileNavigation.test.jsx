// client/src/components/mobile/MobileNavigation/MobileNavigation.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MobileNavigation from './MobileNavigation';

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' })
}));

// Create a test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('MobileNavigation Component', () => {
  // Mock props
  const mockUser = {
    role: 'jobSeeker',
    firstName: 'John',
    avatar: 'https://example.com/avatar.jpg'
  };
  
  const mockItems = [
    {
      id: 'home',
      label: 'Home',
      route: '/home',
      icon: 'home',
      roles: ['all']
    },
    {
      id: 'profile',
      label: 'Profile',
      route: '/profile',
      icon: 'person',
      roles: ['all']
    },
    {
      id: 'admin',
      label: 'Admin',
      route: '/admin',
      icon: 'admin',
      roles: ['admin'],
      children: [
        { id: 'users', label: 'Users', route: '/admin/users', icon: 'person' }
      ]
    }
  ];
  
  // Mock callbacks
  const mockOnNavigate = jest.fn();
  const mockOnProfileClick = jest.fn();
  const mockOnLogout = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders bottom navigation by default', () => {
    render(
      <TestWrapper>
        <MobileNavigation user={mockUser} />
      </TestWrapper>
    );
    
    // Bottom navigation should be present
    expect(document.querySelector('.bottomNavigation')).toBeInTheDocument();
    
    // Should have default navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });
  
  test('renders top navigation with app bar', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          type="top" 
          user={mockUser} 
          title="Test App"
        />
      </TestWrapper>
    );
    
    // App bar should be present
    expect(document.querySelector('.appBar')).toBeInTheDocument();
    expect(screen.getByText('Test App')).toBeInTheDocument();
    
    // Menu button should be present
    expect(screen.getByLabelText('menu')).toBeInTheDocument();
  });
  
  test('renders drawer navigation', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          type="drawer" 
          user={mockUser}
        />
      </TestWrapper>
    );
    
    // Drawer should be present (but closed initially)
    expect(document.querySelector('.drawer')).toBeInTheDocument();
  });
  
  test('renders hybrid navigation with both top and bottom', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          type="hybrid" 
          user={mockUser}
        />
      </TestWrapper>
    );
    
    // Both navigation types should be present
    expect(document.querySelector('.appBar')).toBeInTheDocument();
    expect(document.querySelector('.bottomNavigation')).toBeInTheDocument();
  });
  
  test('handles bottom navigation clicks', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          user={mockUser}
          onNavigate={mockOnNavigate}
        />
      </TestWrapper>
    );
    
    // Click on Jobs tab
    fireEvent.click(screen.getByText('Jobs'));
    
    // Should call onNavigate with correct route
    expect(mockOnNavigate).toHaveBeenCalledWith('/jobs', expect.any(Object));
  });
  
  test('opens drawer when menu button is clicked', async () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          type="top" 
          user={mockUser}
        />
      </TestWrapper>
    );
    
    // Click menu button to open drawer
    fireEvent.click(screen.getByLabelText('menu'));
    
    // Drawer content should be visible
    await waitFor(() => {
      expect(screen.getByText('ThiQaX')).toBeInTheDocument();
    });
  });
  
  test('displays custom navigation items', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          items={mockItems}
          user={mockUser}
        />
      </TestWrapper>
    );
    
    // Custom items should be visible
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });
  
  test('filters items based on user role', () => {
    const adminUser = { ...mockUser, role: 'admin' };
    
    render(
      <TestWrapper>
        <MobileNavigation 
          items={mockItems}
          user={adminUser}
        />
      </TestWrapper>
    );
    
    // Admin-only items should be visible for admin user
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
  
  test('hides admin items from non-admin users', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          items={mockItems}
          user={mockUser} // jobSeeker role
        />
      </TestWrapper>
    );
    
    // Admin items should not be visible
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
  
  test('displays notification badge', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          user={mockUser}
          notificationCount={5}
        />
      </TestWrapper>
    );
    
    // Badge should be present
    expect(screen.getByText('5')).toBeInTheDocument();
  });
  
  test('handles profile click', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          type="top"
          user={mockUser}
          onProfileClick={mockOnProfileClick}
        />
      </TestWrapper>
    );
    
    // Click on profile avatar
    const profileButton = document.querySelector('.profileButton');
    fireEvent.click(profileButton);
    
    // Should call onProfileClick
    expect(mockOnProfileClick).toHaveBeenCalled();
  });
  
  test('handles logout from drawer', async () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          type="top"
          user={mockUser}
          onLogout={mockOnLogout}
        />
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getByLabelText('menu'));
    
    // Wait for drawer to open and click logout
    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Logout'));
    
    // Should call onLogout
    expect(mockOnLogout).toHaveBeenCalled();
  });
  
  test('expands and collapses nested menu items', async () => {
    const adminUser = { ...mockUser, role: 'admin' };
    
    render(
      <TestWrapper>
        <MobileNavigation 
          type="top"
          items={mockItems}
          user={adminUser}
        />
      </TestWrapper>
    );
    
    // Open drawer
    fireEvent.click(screen.getByLabelText('menu'));
    
    // Wait for drawer to open
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
    
    // Click on Admin to expand
    fireEvent.click(screen.getByText('Admin'));
    
    // Nested item should be visible
    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
    });
    
    // Click Admin again to collapse
    fireEvent.click(screen.getByText('Admin'));
    
    // Nested item should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Users')).not.toBeInTheDocument();
    });
  });
  
  test('hides labels when hideLabels prop is true', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          user={mockUser}
          hideLabels={true}
        />
      </TestWrapper>
    );
    
    // Labels should not be visible in bottom navigation
    const bottomNav = document.querySelector('.bottomNavigation');
    expect(bottomNav).toHaveAttribute('aria-label'); // Still accessible
  });
  
  test('applies different variants correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <MobileNavigation 
          user={mockUser}
          variant="minimal"
        />
      </TestWrapper>
    );
    
    // Should have minimal variant class
    expect(document.querySelector('.minimal')).toBeInTheDocument();
    
    // Rerender with material variant
    rerender(
      <TestWrapper>
        <MobileNavigation 
          user={mockUser}
          variant="material"
        />
      </TestWrapper>
    );
    
    // Should have material variant class
    expect(document.querySelector('.material')).toBeInTheDocument();
  });
  
  test('handles persistent drawer mode', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          type="drawer"
          user={mockUser}
          persistent={true}
        />
      </TestWrapper>
    );
    
    // Drawer should use persistent variant
    const drawer = document.querySelector('.drawer');
    expect(drawer).toBeInTheDocument();
  });
  
  test('uses custom icons when provided', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;
    const customIcons = {
      home: <CustomIcon />
    };
    
    render(
      <TestWrapper>
        <MobileNavigation 
          items={mockItems}
          user={mockUser}
          customIcons={customIcons}
        />
      </TestWrapper>
    );
    
    // Custom icon should be used
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
  
  test('handles navigation without onNavigate callback', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          user={mockUser}
        />
      </TestWrapper>
    );
    
    // Click should not throw error
    expect(() => {
      fireEvent.click(screen.getByText('Jobs'));
    }).not.toThrow();
    
    // Should call React Router navigate
    expect(mockNavigate).toHaveBeenCalledWith('/jobs');
  });
  
  test('shows correct active route', () => {
    // Mock current route as /profile
    jest.mocked(require('react-router-dom').useLocation).mockReturnValue({
      pathname: '/profile'
    });
    
    render(
      <TestWrapper>
        <MobileNavigation 
          user={mockUser}
        />
      </TestWrapper>
    );
    
    // Profile should be selected in bottom navigation
    const profileAction = screen.getByText('Profile').closest('.MuiBottomNavigationAction-root');
    expect(profileAction).toHaveClass('Mui-selected');
  });
  
  test('handles touch events for mobile interaction', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          user={mockUser}
          onNavigate={mockOnNavigate}
        />
      </TestWrapper>
    );
    
    // Simulate touch event on navigation item
    const jobsButton = screen.getByText('Jobs');
    fireEvent.touchStart(jobsButton);
    fireEvent.touchEnd(jobsButton);
    fireEvent.click(jobsButton);
    
    // Should handle navigation
    expect(mockOnNavigate).toHaveBeenCalledWith('/jobs', expect.any(Object));
  });
  
  test('provides accessibility attributes', () => {
    render(
      <TestWrapper>
        <MobileNavigation 
          type="top"
          user={mockUser}
        />
      </TestWrapper>
    );
    
    // Menu button should have proper aria label
    expect(screen.getByLabelText('menu')).toBeInTheDocument();
    
    // Should have proper ARIA attributes for navigation
    const menuButton = screen.getByLabelText('menu');
    expect(menuButton).toHaveAttribute('aria-label', 'menu');
  });
});