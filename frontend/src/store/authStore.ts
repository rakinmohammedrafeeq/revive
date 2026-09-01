import type { AuthResponse, User } from '@/types/auth'

const TOKEN_KEY = 'ledgera_token'
const USER_KEY = 'ledgera_user'
const AUTH_EVENT = 'ledgera:auth-changed'

export interface StoredAuthState {
  token: string
  user: User
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as User
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function getStoredAuthState(): StoredAuthState | null {
  const token = getStoredToken()
  const user = getStoredUser()

  if (!token || !user) {
    return null
  }

  return { token, user }
}

export function persistAuthState(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { type: 'login' } }))
}

export function clearAuthState(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { type: 'logout' } }))
}

export function onAuthStateChange(callback: () => void): () => void {
  const handler = () => callback()
  window.addEventListener(AUTH_EVENT, handler)
  return () => window.removeEventListener(AUTH_EVENT, handler)
}

export function toUser(auth: AuthResponse): User {
  return {
    id: auth.userId ?? 0,
    name: auth.name,
    email: auth.email,
    role: auth.role,
  }
}
