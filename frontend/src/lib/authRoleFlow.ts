import type { Role } from '@/types'

export type AuthRoleIntent = 'member' | 'admin'

const roleToIntent: Record<Role, AuthRoleIntent> = {
  VIEWER: 'member',
  ANALYST: 'member',
  ADMIN: 'admin',
}

export function getRoleFromIntent(intent?: string | null): Role | null {
  if (!intent) {
    return null
  }

  const normalizedIntent = intent.trim().toLowerCase()

  // Treat historical 'user' intent as VIEWER.
  if (normalizedIntent === 'member' || normalizedIntent === 'user' || normalizedIntent === 'viewer') {
    return 'VIEWER'
  }

  if (normalizedIntent === 'analyst') {
    return 'ANALYST'
  }

  if (normalizedIntent === 'admin' || normalizedIntent === 'administrator') {
    return 'ADMIN'
  }

  return null
}

export function getIntentFromRole(role: Role): AuthRoleIntent {
  return roleToIntent[role]
}

export function buildAuthRoute(path: '/login' | '/register', role: Role): string {
  return `${path}?role=${getIntentFromRole(role)}`
}

