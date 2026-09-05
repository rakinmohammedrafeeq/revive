import type { AuthResponse, User } from '@/types/auth'

const TOKEN_KEY = 'revive_token'
const USER_KEY = 'revive_user'
const AUTH_EVENT = 'revive:auth-changed'

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
    const user = JSON.parse(raw) as User
    if (user && user.email === 'rakinmohammedrafeeq@gmail.com' && (!user.name || user.name.trim().toLowerCase() === 'admin')) {
      user.name = 'Rakin Mohammed Rafeeq'
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
    return user
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
  const normalizedUser = {
    ...user,
    name: (user.email === 'rakinmohammedrafeeq@gmail.com' && (!user.name || user.name.trim().toLowerCase() === 'admin'))
      ? 'Rakin Mohammed Rafeeq'
      : user.name,
  }
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))
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
  const name = (auth.email === 'rakinmohammedrafeeq@gmail.com' && (!auth.name || auth.name.trim().toLowerCase() === 'admin'))
    ? 'Rakin Mohammed Rafeeq'
    : auth.name
  return {
    id: auth.userId ?? 0,
    name,
    email: auth.email,
    role: auth.role,
  }
}
