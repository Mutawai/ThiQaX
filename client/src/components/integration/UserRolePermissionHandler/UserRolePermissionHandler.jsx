// client/src/components/integration/UserRolePermissionHandler/UserRolePermissionHandler.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, updateUserRole, updateUserPermissions } from '../../../redux/actions/userActions';
import { useAuth } from '../../utils/context/AuthContext';
import integrationService from '../../../services/integrationService';
import styles from './UserRolePermissionHandler.module.css';

/**
 * UserRolePermissionHandler Component
 * Manages user roles and permissions for admin users
 */
const UserRolePermissionHandler = () => {
  // Redux state
  const dispatch = useDispatch();
  const { users, loading, error, pagination } = useSelector(state => state.users);
  const { user: currentUser } = useSelector(state => state.auth);

  // Local state
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [editingUser, setEditingUser] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionChanges, setPermissionChanges] = useState({});

  // Role definitions with permissions
  const roleDefinitions = {
    jobSeeker: {
      label: 'Job Seeker',
      permissions: ['profile.read', 'profile.update', 'applications.create', 'applications.read', 'jobs.read'],
      color: '#3b82f6'
    },
    agent: {
      label: 'Agent/Recruiter',
      permissions: [
        'profile.read', 'profile.update', 'jobs.create', 'jobs.read', 'jobs.update',
        'applications.read', 'applications.update', 'candidates.read', 'verification.read'
      ],
      color: '#10b981'
    },
    sponsor: {
      label: 'Sponsor/Employer',
      permissions: [
        'profile.read', 'profile.update', 'jobs.create', 'jobs.read', 'jobs.update', 'jobs.delete',
        'applications.read', 'applications.update', 'candidates.read', 'contracts.create'
      ],
      color: '#f59e0b'
    },
    admin: {
      label: 'Administrator',
      permissions: [
        'users.read', 'users.update', 'users.delete', 'verification.all', 'system.read',
        'system.update', 'analytics.read', 'audit.read', 'roles.manage'
      ],
      color: '#ef4444'
    }
  };

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'DEACTIVATED', label: 'Deactivated' }
  ];

  // Load users when filters or page changes
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchUsers({
          page: currentPage,
          limit: 10,
          ...filters
        }));
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    };

    loadData();
  }, [dispatch, currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1);
  }, []);

  // Handle role change
  const handleRoleChange = useCallback(async (userId, newRole, reason = '') => {
    if (processingIds.has(userId)) return;

    // Prevent self-demotion from admin
    if (currentUser.id === userId && currentUser.role === 'admin' && newRole !== 'admin') {
      alert('You cannot change your own admin role');
      return;
    }

    setProcessingIds(prev => new Set(prev).add(userId));

    try {
      await dispatch(updateUserRole(userId, { role: newRole, reason }));
      
      // Log the role change
      await integrationService.logAuditEvent({
        action: 'ROLE_CHANGE',
        targetUserId: userId,
        details: {
          previousRole: users.find(u => u.id === userId)?.role,
          newRole,
          reason,
          changedBy: currentUser.id
        }
      });

      // Send notification to user
      await integrationService.sendNotification(userId, {
        type: 'ROLE_CHANGE',
        title: 'Role Updated',
        message: `Your role has been changed to ${roleDefinitions[newRole].label}`,
        metadata: { newRole, changedBy: currentUser.name }
      });

    } catch (err) {
      console.error('Failed to update user role:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [dispatch, processingIds, currentUser, users, roleDefinitions]);

  // Handle permission update
  const handlePermissionUpdate = useCallback(async (userId, permissions) => {
    if (processingIds.has(userId)) return;

    setProcessingIds(prev => new Set(prev).add(userId));

    try {
      await dispatch(updateUserPermissions(userId, { permissions }));
      
      // Log permission change
      await integrationService.logAuditEvent({
        action: 'PERMISSION_CHANGE',
        targetUserId: userId,
        details: {
          permissions,
          changedBy: currentUser.id
        }
      });

      setShowPermissionModal(false);
      setEditingUser(null);
      setPermissionChanges({});

    } catch (err) {
      console.error('Failed to update permissions:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [dispatch, processingIds, currentUser]);

  // Handle bulk role change
  const handleBulkRoleChange = useCallback(async (newRole) => {
    if (selectedUsers.length === 0) return;

    // Check if trying to change own role from admin
    if (selectedUsers.includes(currentUser.id) && currentUser.role === 'admin' && newRole !== 'admin') {
      alert('Cannot change your own admin role');
      return;
    }

    const promises = selectedUsers.map(userId => 
      handleRoleChange(userId, newRole, 'Bulk role change')
    );

    try {
      await Promise.all(promises);
      setSelectedUsers([]);
    } catch (err) {
      console.error('Bulk role change failed:', err);
    }
  }, [selectedUsers, currentUser, handleRoleChange]);

  // Handle row selection
  const handleRowSelection = useCallback((userId, isSelected) => {
    setSelectedUsers(prev => {
      if (isSelected) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  }, [users]);

  // Open permission editor
  const openPermissionEditor = useCallback((user) => {
    setEditingUser(user);
    setPermissionChanges(user.customPermissions || {});
    setShowPermissionModal(true);
  }, []);

  // Handle permission toggle
  const handlePermissionToggle = useCallback((permission, isEnabled) => {
    setPermissionChanges(prev => ({
      ...prev,
      [permission]: isEnabled
    }));
  }, []);

  // Get effective permissions for a user
  const getEffectivePermissions = useCallback((user) => {
    const rolePermissions = roleDefinitions[user.role]?.permissions || [];
    const customPermissions = user.customPermissions || {};
    
    return rolePermissions.filter(permission => 
      customPermissions[permission] !== false
    ).concat(
      Object.keys(customPermissions).filter(permission => 
        customPermissions[permission] === true && !rolePermissions.includes(permission)
      )
    );
  }, [roleDefinitions]);

  // Render role badge
  const renderRoleBadge = (role) => {
    const roleData = roleDefinitions[role];
    if (!roleData) return null;

    return (
      <span 
        className={styles.roleBadge}
        style={{ backgroundColor: roleData.color }}
      >
        {roleData.label}
      </span>
    );
  };

  // Render permission modal
  const renderPermissionModal = () => {
    if (!showPermissionModal || !editingUser) return null;

    const rolePermissions = roleDefinitions[editingUser.role]?.permissions || [];
    const allPermissions = [
      ...new Set([
        ...rolePermissions,
        ...Object.keys(permissionChanges)
      ])
    ].sort();

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3>Manage Permissions - {editingUser.name}</h3>
            <button 
              onClick={() => setShowPermissionModal(false)}
              className={styles.closeButton}
            >
              ×
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <p className={styles.roleInfo}>
              Role: {renderRoleBadge(editingUser.role)}
            </p>
            
            <div className={styles.permissionsList}>
              {allPermissions.map(permission => {
                const isRolePermission = rolePermissions.includes(permission);
                const currentValue = permissionChanges[permission];
                const effectiveValue = currentValue !== undefined ? currentValue : isRolePermission;
                
                return (
                  <div key={permission} className={styles.permissionItem}>
                    <label className={styles.permissionLabel}>
                      <input
                        type="checkbox"
                        checked={effectiveValue}
                        onChange={(e) => handlePermissionToggle(permission, e.target.checked)}
                        disabled={isRolePermission && currentValue === undefined}
                      />
                      <span className={styles.permissionText}>
                        {permission}
                        {isRolePermission && (
                          <span className={styles.rolePermissionBadge}>Role Default</span>
                        )}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className={styles.modalFooter}>
            <button 
              onClick={() => setShowPermissionModal(false)}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button 
              onClick={() => handlePermissionUpdate(editingUser.id, permissionChanges)}
              disabled={processingIds.has(editingUser.id)}
              className={styles.saveButton}
            >
              {processingIds.has(editingUser.id) ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !users.length) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading users...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>User Role & Permission Management</h2>
        <div className={styles.statsContainer}>
          {Object.entries(roleDefinitions).map(([role, data]) => {
            const count = users.filter(u => u.role === role).length;
            return (
              <div key={role} className={styles.statItem}>
                <span className={styles.statLabel}>{data.label}</span>
                <span className={styles.statValue}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterRow}>
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Roles</option>
            {Object.entries(roleDefinitions).map(([role, data]) => (
              <option key={role} value={role}>{data.label}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.filterSelect}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.selectedCount}>
              {selectedUsers.length} selected
            </span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkRoleChange(e.target.value);
                  e.target.value = '';
                }
              }}
              className={styles.bulkRoleSelect}
            >
              <option value="">Change Role To...</option>
              {Object.entries(roleDefinitions).map(([role, data]) => (
                <option key={role} value={role}>{data.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.usersTable}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th>User</th>
              <th>Current Role</th>
              <th>Status</th>
              <th>Permissions</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={styles.userRow}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => handleRowSelection(user.id, e.target.checked)}
                  />
                </td>
                <td>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                </td>
                <td>{renderRoleBadge(user.role)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[`status${user.status}`]}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <span className={styles.permissionCount}>
                    {getEffectivePermissions(user).length} permissions
                  </span>
                </td>
                <td>{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <select
                      value={user.role}
                      onChange={(e) => {
                        if (e.target.value !== user.role) {
                          const reason = prompt('Reason for role change:');
                          if (reason !== null) {
                            handleRoleChange(user.id, e.target.value, reason);
                          }
                        }
                      }}
                      disabled={processingIds.has(user.id)}
                      className={styles.roleSelect}
                    >
                      {Object.entries(roleDefinitions).map(([role, data]) => (
                        <option key={role} value={role}>{data.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => openPermissionEditor(user)}
                      disabled={processingIds.has(user.id)}
                      className={styles.editPermissionsButton}
                    >
                      Edit Permissions
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            Previous
          </button>
          <span className={styles.paginationInfo}>
            Page {currentPage} of {pagination.pages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
            disabled={currentPage === pagination.pages}
            className={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}

      {/* Permission Modal */}
      {renderPermissionModal()}
    </div>
  );
};

export default UserRolePermissionHandler;