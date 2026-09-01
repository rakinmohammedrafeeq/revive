import type { Role } from '@/types/auth'

export interface UserListItem {
  id: number
  name: string
  email: string
  role: Role
  active: boolean
  createdAt: string
}
