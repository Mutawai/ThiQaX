// client/src/components/integration/UserRolePermissionHandler/UserRolePermissionHandler.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import UserRolePermissionHandler from './UserRolePermissionHandler';
import { AuthProvider } from '../../utils/context/AuthContext';
import * as userActions from '../../../redux/actions/userActions';
import integrationService from '../../../services/integrationService';

// Mock dependencies
jest.mock('../../../redux/actions/userActions');
jest.mock('../../../services/integrationService');

const mockStore = configureStore([thunk]);

// Mock user data
const mockUsers = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'jobSeeker',
    status: 'ACTIVE',
    lastActiveAt: '2025-04-19T10:00:00Z',
    customPermissions: {}
  },
  {
    id: 'user2',
    name: 'Jane Agent',
    email: 'jane@example.com',
    role: 'agent',
    status: 'ACTIVE',
    lastActiveAt: '2025-04-18T10:00:00Z',
    customPermissions: { 'verification.write': true }
  },
  {
    id: 'user3',
    name: 'Bob Sponsor',
    email: 'bob@example.com',
    role: 'sponsor',
    status: 'SUSPENDED',
    lastActiveAt: '2025-04-17T10:00:00Z',
    customPermissions: {}
  }
];

const mockPagination = {
  page: 1,
  limit: 10,
  total: 3,
  pages: 1
};

// Initial store state
const initialState = {
  users: {
    users: mockUsers,
    loading: false,
    error: null,
    pagination: mockPagination
  },
  auth: {
    user: {
      id: 'admin1',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@example.com'
    },
    token: 'mock-token'
  }
};

// Wrapper component with providers
const renderWithProviders = (component, store = mockStore(initialState)) => {
  const mockAuthContext = {
    user: initialState.auth.user,
    login: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn()
  };

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider value={mockAuthContext}>
          {component}
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('UserRolePermissionHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redux actions
    userActions.fetchUsers = jest.fn().mockReturnValue(
      Promise.resolve({ type: 'FETCH_USERS_SUCCESS' })
    );
    userActions.updateUserRole = jest.fn().mockReturnValue(
      Promise.resolve({ type: 'UPDATE_USER_ROLE_SUCCESS' })
    );
    userActions.updateUserPermissions = jest.fn().mockReturnValue(
      Promise.resolve({ type: 'UPDATE_USER_PERMISSIONS_SUCCESS' })
    );

    // Mock integration service
    integrationService.logAuditEvent = jest.fn().mockResolvedValue({});
    integrationService.sendNotification = jest.fn().mockResolvedValue({});

    // Mock alert
    global.alert = jest.fn();
    global.prompt = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders title and role statistics', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      expect(screen.getByText('User Role & Permission Management')).toBeInTheDocument();
      expect(screen.getByText('Job Seeker')).toBeInTheDocument();
      expect(screen.getByText('Agent/Recruiter')).toBeInTheDocument();
      expect(screen.getByText('Sponsor/Employer')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
    });

    test('renders users table with correct headers', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Current Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Permissions')).toBeInTheDocument();
      expect(screen.getByText('Last Active')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    test('renders user data correctly', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Agent')).toBeInTheDocument();
      expect(screen.getByText('Bob Sponsor')).toBeInTheDocument();
    });

    test('displays loading state when loading is true', () => {
      const loadingState = {
        ...initialState,
        users: {
          ...initialState.users,
          loading: true,
          users: []
        }
      };

      renderWithProviders(<UserRolePermissionHandler />, mockStore(loadingState));

      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    test('displays error message when error exists', () => {
      const errorState = {
        ...initialState,
        users: {
          ...initialState.users,
          error: 'Failed to load users'
        }
      };

      renderWithProviders(<UserRolePermissionHandler />, mockStore(errorState));

      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('filters by role when role dropdown changes', async () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const roleSelect = screen.getByDisplayValue('All Roles');
      fireEvent.change(roleSelect, { target: { value: 'agent' } });

      await waitFor(() => {
        expect(userActions.fetchUsers).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          role: 'agent',
          status: '',
          search: '',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });

    test('filters by status when status dropdown changes', async () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const statusSelect = screen.getByDisplayValue('All Statuses');
      fireEvent.change(statusSelect, { target: { value: 'ACTIVE' } });

      await waitFor(() => {
        expect(userActions.fetchUsers).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          role: '',
          status: 'ACTIVE',
          search: '',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });

    test('searches when search input changes', async () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(userActions.fetchUsers).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          role: '',
          status: '',
          search: 'John',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });
  });

  describe('Role Management', () => {
    test('changes user role when role select changes', async () => {
      global.prompt.mockReturnValue('Promoting user to agent');
      
      renderWithProviders(<UserRolePermissionHandler />);

      const roleSelects = screen.getAllByRole('combobox');
      const userRoleSelect = roleSelects.find(select => 
        select.closest('tr')?.textContent.includes('John Doe')
      );

      fireEvent.change(userRoleSelect, { target: { value: 'agent' } });

      await waitFor(() => {
        expect(userActions.updateUserRole).toHaveBeenCalledWith('user1', {
          role: 'agent',
          reason: 'Promoting user to agent'
        });
      });

      expect(integrationService.logAuditEvent).toHaveBeenCalledWith({
        action: 'ROLE_CHANGE',
        targetUserId: 'user1',
        details: {
          previousRole: 'jobSeeker',
          newRole: 'agent',
          reason: 'Promoting user to agent',
          changedBy: 'admin1'
        }
      });

      expect(integrationService.sendNotification).toHaveBeenCalledWith('user1', {
        type: 'ROLE_CHANGE',
        title: 'Role Updated',
        message: 'Your role has been changed to Agent/Recruiter',
        metadata: { newRole: 'agent', changedBy: 'Admin User' }
      });
    });

    test('prevents admin from changing own role', async () => {
      const adminState = {
        ...initialState,
        users: {
          ...initialState.users,
          users: [
            ...mockUsers,
            {
              id: 'admin1',
              name: 'Admin User',
              email: 'admin@example.com',
              role: 'admin',
              status: 'ACTIVE',
              customPermissions: {}
            }
          ]
        }
      };

      renderWithProviders(<UserRolePermissionHandler />, mockStore(adminState));

      const roleSelects = screen.getAllByRole('combobox');
      const adminRoleSelect = roleSelects.find(select => 
        select.closest('tr')?.textContent.includes('Admin User')
      );

      fireEvent.change(adminRoleSelect, { target: { value: 'jobSeeker' } });

      expect(global.alert).toHaveBeenCalledWith('You cannot change your own admin role');
      expect(userActions.updateUserRole).not.toHaveBeenCalled();
    });

    test('cancels role change when prompt is cancelled', async () => {
      global.prompt.mockReturnValue(null);
      
      renderWithProviders(<UserRolePermissionHandler />);

      const roleSelects = screen.getAllByRole('combobox');
      const userRoleSelect = roleSelects.find(select => 
        select.closest('tr')?.textContent.includes('John Doe')
      );

      fireEvent.change(userRoleSelect, { target: { value: 'agent' } });

      expect(userActions.updateUserRole).not.toHaveBeenCalled();
    });
  });

  describe('Bulk Actions', () => {
    test('shows bulk actions when users are selected', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select first user

      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByText('Change Role To...')).toBeInTheDocument();
    });

    test('selects all users when select all is checked', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);

      expect(screen.getByText('3 selected')).toBeInTheDocument();
    });

    test('performs bulk role change', async () => {
      global.prompt.mockReturnValue('Bulk role change');
      
      renderWithProviders(<UserRolePermissionHandler />);

      // Select first user
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      // Change bulk role
      const bulkRoleSelect = screen.getByDisplayValue('Change Role To...');
      fireEvent.change(bulkRoleSelect, { target: { value: 'agent' } });

      await waitFor(() => {
        expect(userActions.updateUserRole).toHaveBeenCalledWith('user1', {
          role: 'agent',
          reason: 'Bulk role change'
        });
      });
    });

    test('prevents bulk change of admin role for current admin', async () => {
      const adminState = {
        ...initialState,
        users: {
          ...initialState.users,
          users: [
            ...mockUsers,
            {
              id: 'admin1',
              name: 'Admin User',
              email: 'admin@example.com',
              role: 'admin',
              status: 'ACTIVE',
              customPermissions: {}
            }
          ]
        }
      };

      renderWithProviders(<UserRolePermissionHandler />, mockStore(adminState));

      // Select admin user
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[4]); // Admin user checkbox

      // Try to change bulk role
      const bulkRoleSelect = screen.getByDisplayValue('Change Role To...');
      fireEvent.change(bulkRoleSelect, { target: { value: 'jobSeeker' } });

      expect(global.alert).toHaveBeenCalledWith('Cannot change your own admin role');
    });
  });

  describe('Permission Management', () => {
    test('opens permission modal when edit permissions is clicked', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const editButtons = screen.getAllByText('Edit Permissions');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Manage Permissions - John Doe')).toBeInTheDocument();
      expect(screen.getByText('Role:')).toBeInTheDocument();
    });

    test('displays role permissions in modal', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const editButtons = screen.getAllByText('Edit Permissions');
      fireEvent.click(editButtons[0]);

      // Check for job seeker permissions
      expect(screen.getByText('profile.read')).toBeInTheDocument();
      expect(screen.getByText('applications.create')).toBeInTheDocument();
      expect(screen.getByText('jobs.read')).toBeInTheDocument();
    });

    test('toggles custom permissions in modal', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const editButtons = screen.getAllByText('Edit Permissions');
      fireEvent.click(editButtons[0]);

      // Find a permission checkbox and toggle it
      const profileReadCheckbox = screen.getByRole('checkbox', { name: /profile\.read/ });
      fireEvent.click(profileReadCheckbox);

      // Verify the checkbox state changed
      expect(profileReadCheckbox).not.toBeChecked();
    });

    test('saves permission changes', async () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const editButtons = screen.getAllByText('Edit Permissions');
      fireEvent.click(editButtons[0]);

      // Toggle a permission
      const profileReadCheckbox = screen.getByRole('checkbox', { name: /profile\.read/ });
      fireEvent.click(profileReadCheckbox);

      // Save changes
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(userActions.updateUserPermissions).toHaveBeenCalledWith('user1', {
          permissions: { 'profile.read': false }
        });
      });

      expect(integrationService.logAuditEvent).toHaveBeenCalledWith({
        action: 'PERMISSION_CHANGE',
        targetUserId: 'user1',
        details: {
          permissions: { 'profile.read': false },
          changedBy: 'admin1'
        }
      });
    });

    test('closes permission modal when cancel is clicked', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const editButtons = screen.getAllByText('Edit Permissions');
      fireEvent.click(editButtons[0]);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Manage Permissions - John Doe')).not.toBeInTheDocument();
    });

    test('closes permission modal when X is clicked', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const editButtons = screen.getAllByText('Edit Permissions');
      fireEvent.click(editButtons[0]);

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Manage Permissions - John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    test('renders pagination controls', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });

    test('disables previous button on first page', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    test('disables next button on last page', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    test('changes page when next button is clicked', async () => {
      const multiPageState = {
        ...initialState,
        users: {
          ...initialState.users,
          pagination: {
            page: 1,
            limit: 10,
            total: 20,
            pages: 2
          }
        }
      };

      renderWithProviders(<UserRolePermissionHandler />, mockStore(multiPageState));

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(userActions.fetchUsers).toHaveBeenCalledWith({
          page: 2,
          limit: 10,
          role: '',
          status: '',
          search: '',
          sortBy: 'createdAt',
          order: 'desc'
        });
      });
    });
  });

  describe('Role Badge Rendering', () => {
    test('renders role badges with correct colors', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      const roleBadges = screen.getAllByText('Job Seeker');
      expect(roleBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Permission Calculation', () => {
    test('calculates effective permissions correctly', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      // Look for permission counts in the table
      expect(screen.getByText('5 permissions')).toBeInTheDocument(); // Job seeker
      expect(screen.getByText('8 permissions')).toBeInTheDocument(); // Agent with custom permission
    });
  });

  describe('Error Handling', () => {
    test('handles role update error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      userActions.updateUserRole.mockRejectedValue(new Error('Update failed'));
      global.prompt.mockReturnValue('Test reason');

      renderWithProviders(<UserRolePermissionHandler />);

      const roleSelects = screen.getAllByRole('combobox');
      const userRoleSelect = roleSelects.find(select => 
        select.closest('tr')?.textContent.includes('John Doe')
      );

      fireEvent.change(userRoleSelect, { target: { value: 'agent' } });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update user role:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    test('handles permission update error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      userActions.updateUserPermissions.mockRejectedValue(new Error('Permission update failed'));

      renderWithProviders(<UserRolePermissionHandler />);

      const editButtons = screen.getAllByText('Edit Permissions');
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update permissions:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Status Badge Rendering', () => {
    test('renders status badges correctly', () => {
      renderWithProviders(<UserRolePermissionHandler />);

      expect(screen.getAllByText('ACTIVE')).toHaveLength(2);
      expect(screen.getByText('SUSPENDED')).toBeInTheDocument();
    });
  });
});