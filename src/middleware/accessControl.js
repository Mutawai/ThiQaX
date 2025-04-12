/**
 * @file Access Control Middleware
 * @description Implements Role-Based Access Control (RBAC) for ThiQaX platform
 * @module middleware/accessControl
 */

/**
 * Available roles in the system
 * @constant {Object}
 */
const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  RECRUITER: 'recruiter',
  CANDIDATE: 'candidate',
  GUEST: 'guest'
};

/**
 * Permission definitions
 * @constant {Object}
 */
const PERMISSIONS = {
  // User management
  CREATE_USER: 'create:user',
  READ_USER: 'read:user',
  UPDATE_USER: 'update:user',
  DELETE_USER: 'delete:user',
  
  // Document management
  CREATE_DOCUMENT: 'create:document',
  READ_DOCUMENT: 'read:document',
  UPDATE_DOCUMENT: 'update:document',
  DELETE_DOCUMENT: 'delete:document',
  VERIFY_DOCUMENT: 'verify:document',
  
  // Job management
  CREATE_JOB: 'create:job',
  READ_JOB: 'read:job',
  UPDATE_JOB: 'update:job',
  DELETE_JOB: 'delete:job',
  
  // Application management
  CREATE_APPLICATION: 'create:application',
  READ_APPLICATION: 'read:application',
  UPDATE_APPLICATION: 'update:application',
  DELETE_APPLICATION: 'delete:application',
  
  // System settings
  READ_SETTINGS: 'read:settings',
  UPDATE_SETTINGS: 'update:settings',
  
  // Reports
  READ_REPORTS: 'read:reports',
  CREATE_REPORTS: 'create:reports'
};

/**
 * Role-permission mapping
 * @constant {Object}
 */
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  
  [ROLES.MANAGER]: [
    // User permissions
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    
    // Document permissions
    PERMISSIONS.CREATE_DOCUMENT,
    PERMISSIONS.READ_DOCUMENT,
    PERMISSIONS.UPDATE_DOCUMENT,
    PERMISSIONS.VERIFY_DOCUMENT,
    
    // Job permissions
    PERMISSIONS.CREATE_JOB,
    PERMISSIONS.READ_JOB,
    PERMISSIONS.UPDATE_JOB,
    PERMISSIONS.DELETE_JOB,
    
    // Application permissions
    PERMISSIONS.READ_APPLICATION,
    PERMISSIONS.UPDATE_APPLICATION,
    
    // Settings permissions
    PERMISSIONS.READ_SETTINGS,
    
    // Report permissions
    PERMISSIONS.READ_REPORTS,
    PERMISSIONS.CREATE_REPORTS
  ],
  
  [ROLES.RECRUITER]: [
    // User permissions (limited)
    PERMISSIONS.READ_USER,
    
    // Document permissions
    PERMISSIONS.READ_DOCUMENT,
    
    // Job permissions
    PERMISSIONS.CREATE_JOB,
    PERMISSIONS.READ_JOB,
    PERMISSIONS.UPDATE_JOB,
    
    // Application permissions
    PERMISSIONS.READ_APPLICATION,
    PERMISSIONS.UPDATE_APPLICATION,
    
    // Report permissions
    PERMISSIONS.READ_REPORTS
  ],
  
  [ROLES.CANDIDATE]: [
    // User permissions (only self)
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    
    // Document permissions (only own)
    PERMISSIONS.CREATE_DOCUMENT,
    PERMISSIONS.READ_DOCUMENT,
    PERMISSIONS.UPDATE_DOCUMENT,
    PERMISSIONS.DELETE_DOCUMENT,
    
    // Job permissions (read only)
    PERMISSIONS.READ_JOB,
    
    // Application permissions (only own)
    PERMISSIONS.CREATE_APPLICATION,
    PERMISSIONS.READ_APPLICATION,
    PERMISSIONS.UPDATE_APPLICATION,
    PERMISSIONS.DELETE_APPLICATION
  ],
  
  [ROLES.GUEST]: [
    // Job permissions (read only)
    PERMISSIONS.READ_JOB
  ]
};

/**
 * Special resource ownership rules
 * @constant {Object}
 */
const OWNERSHIP_RULES = {
  [PERMISSIONS.READ_USER]: (user, resource) => {
    // Admins and managers can read any user
    if ([ROLES.ADMIN, ROLES.MANAGER].includes(user.role)) return true;
    
    // Users can read their own profile
    if (user.role === ROLES.CANDIDATE || user.role === ROLES.RECRUITER) {
      return resource && resource._id && resource._id.toString() === user._id.toString();
    }
    
    return false;
  },
  
  [PERMISSIONS.UPDATE_USER]: (user, resource) => {
    // Admins can update any user
    if (user.role === ROLES.ADMIN) return true;
    
    // Managers can update recruiters and candidates
    if (user.role === ROLES.MANAGER) {
      return resource && resource.role && 
        [ROLES.RECRUITER, ROLES.CANDIDATE].includes(resource.role);
    }
    
    // Users can update their own profile
    return resource && resource._id && resource._id.toString() === user._id.toString();
  },
  
  [PERMISSIONS.READ_DOCUMENT]: (user, resource) => {
    // Admins, managers, and recruiters can read any document
    if ([ROLES.ADMIN, ROLES.MANAGER, ROLES.RECRUITER].includes(user.role)) return true;
    
    // Candidates can only read their own documents
    if (user.role === ROLES.CANDIDATE) {
      return resource && resource.ownerId && resource.ownerId.toString() === user._id.toString();
    }
    
    return false;
  },
  
  [PERMISSIONS.UPDATE_DOCUMENT]: (user, resource) => {
    // Admins can update any document
    if (user.role === ROLES.ADMIN) return true;
    
    // Managers and recruiters can update documents they're assigned to
    if ([ROLES.MANAGER, ROLES.RECRUITER].includes(user.role)) {
      return resource && resource.assignedTo && 
        resource.assignedTo.toString() === user._id.toString();
    }
    
    // Candidates can only update their own documents if not yet verified
    if (user.role === ROLES.CANDIDATE) {
      return resource && 
        resource.ownerId && 
        resource.ownerId.toString() === user._id.toString() &&
        resource.status !== 'verified';
    }
    
    return false;
  }
};

/**
 * Check if user has permission
 * @param {string} permission - The permission to check
 * @returns {Function} - Express middleware function
 */
exports.hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required'
      });
    }
    
    const userRole = req.user.role || ROLES.GUEST;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    if (userPermissions.includes(permission)) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Insufficient permissions'
    });
  };
};

/**
 * Check if user has permission to access a specific resource
 * @param {string} permission - The permission to check
 * @param {Function} resourceFetcher - Function to fetch the resource
 * @returns {Function} - Express middleware function
 */
exports.hasResourcePermission = (permission, resourceFetcher) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required'
      });
    }
    
    const userRole = req.user.role || ROLES.GUEST;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    // First check if user has the permission at all
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient permissions'
      });
    }
    
    // Fetch the resource
    let resource;
    try {
      resource = await resourceFetcher(req);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching resource'
      });
    }
    
    // Resource not found
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    // Check ownership rules if they exist for this permission
    if (OWNERSHIP_RULES[permission]) {
      const hasAccess = OWNERSHIP_RULES[permission](req.user, resource);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden - You do not have access to this resource'
        });
      }
    }
    
    // Attach the resource to the request for later use
    req.resource = resource;
    return next();
  };
};

/**
 * Restrict access to specific roles
 * @param {...string} roles - Roles that are allowed access
 * @returns {Function} - Express middleware function
 */
exports.restrictToRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient role privileges'
      });
    }
    
    return next();
  };
};

/**
 * Export constants for use in other parts of the application
 */
exports.ROLES = ROLES;
exports.PERMISSIONS = PERMISSIONS;
