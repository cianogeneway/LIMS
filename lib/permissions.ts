// Role-based permissions system

export type UserRole = 
  | 'ADMIN'
  | 'DIRECTOR'
  | 'SENIOR_MEDICAL_SCIENTIST'
  | 'MEDICAL_SCIENTIST'
  | 'MEDICAL_TECHNOLOGIST'
  | 'ASSISTANT'

export interface Permission {
  resource: string
  actions: string[]
}

// Define permissions for each role
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    { resource: '*', actions: ['*'] }, // Full access
  ],
  DIRECTOR: [
    { resource: '*', actions: ['*'] }, // Full access
  ],
  SENIOR_MEDICAL_SCIENTIST: [
    { resource: '*', actions: ['*'] }, // Full access
  ],
  MEDICAL_SCIENTIST: [
    { resource: 'samples', actions: ['read', 'create', 'update'] },
    { resource: 'workflows', actions: ['read', 'create', 'update', 'approve'] },
    { resource: 'worklists', actions: ['read', 'create', 'update'] },
    { resource: 'results', actions: ['read', 'create', 'update', 'approve'] },
    { resource: 'qc', actions: ['read', 'create', 'update', 'approve'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'instruments', actions: ['read'] },
    { resource: 'stock', actions: ['read'] },
  ],
  MEDICAL_TECHNOLOGIST: [
    { resource: 'samples', actions: ['read', 'create', 'update'] },
    { resource: 'workflows', actions: ['read', 'create', 'update'] },
    { resource: 'worklists', actions: ['read', 'create', 'update'] },
    { resource: 'results', actions: ['read', 'create', 'update'] },
    { resource: 'qc', actions: ['read', 'create', 'update'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'instruments', actions: ['read'] },
    { resource: 'stock', actions: ['read'] },
  ],
  ASSISTANT: [
    { resource: 'samples', actions: ['read', 'create'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'stock', actions: ['read'] },
  ],
}

/**
 * Check if a user role has permission to perform an action on a resource
 */
export function hasPermission(
  role: string,
  resource: string,
  action: string
): boolean {
  const userRole = role.toUpperCase() as UserRole
  
  // Check if role exists
  if (!ROLE_PERMISSIONS[userRole]) {
    return false
  }

  const permissions = ROLE_PERMISSIONS[userRole]

  // Check for wildcard permissions (full access)
  const hasWildcard = permissions.some(
    p => p.resource === '*' && (p.actions.includes('*') || p.actions.includes(action))
  )
  if (hasWildcard) {
    return true
  }

  // Check specific resource permissions
  const resourcePerms = permissions.find(p => p.resource === resource)
  if (!resourcePerms) {
    return false
  }

  return resourcePerms.actions.includes('*') || resourcePerms.actions.includes(action)
}

/**
 * Require a specific permission, throw error if not authorized
 */
export function requirePermission(
  role: string,
  resource: string,
  action: string
): void {
  if (!hasPermission(role, resource, action)) {
    throw new Error(`Unauthorized: ${role} cannot ${action} on ${resource}`)
  }
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): Permission[] {
  const userRole = role.toUpperCase() as UserRole
  return ROLE_PERMISSIONS[userRole] || []
}

/**
 * Check if user can approve results
 */
export function canApproveResults(role: string): boolean {
  return hasPermission(role, 'results', 'approve') || hasPermission(role, 'workflows', 'approve')
}

/**
 * Check if user can delete resources
 */
export function canDelete(role: string, resource: string): boolean {
  return hasPermission(role, resource, 'delete') || hasPermission(role, '*', '*')
}

