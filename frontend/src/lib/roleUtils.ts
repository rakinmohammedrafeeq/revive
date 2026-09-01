import type { Role } from '@/types'

const ROLE_LABELS: Record<Role, string> = {
  VIEWER: 'Viewer',
  ANALYST: 'Analyst',
  ADMIN: 'Administrator',
}

export function getRoleLabel(role?: Role | null): string {
  if (!role) {
    return ROLE_LABELS.VIEWER
  }

  return ROLE_LABELS[role]
}

