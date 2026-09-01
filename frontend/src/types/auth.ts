export type Role = 'ADMIN' | 'ANALYST' | 'VIEWER'

export interface User {
  id: number
  email: string
  name: string
  role: Role
  createdAt?: string
}

export interface AuthResponse {
  token: string
  name: string
  email: string
  role: Role
  tokenType?: string
  userId?: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}
