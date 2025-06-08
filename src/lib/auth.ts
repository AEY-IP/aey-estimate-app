import { AuthSession } from '@/types/auth'

// Получение текущего пользователя на сервере (из headers)
export async function getCurrentUser(request: Request): Promise<AuthSession | null> {
  try {
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) return null
    
    const authCookie = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('auth-session='))
    
    if (!authCookie) return null
    
    const sessionData = authCookie.split('=')[1]
    const user = JSON.parse(decodeURIComponent(sessionData))
    
    return {
      user,
      isAuthenticated: true
    }
  } catch (error) {
    console.error('Ошибка получения пользователя:', error)
    return null
  }
}

// Проверка, является ли пользователь админом
export function isAdmin(session: AuthSession | null): boolean {
  return session?.user?.role === 'ADMIN'
}

// Проверка, является ли пользователь менеджером
export function isManager(session: AuthSession | null): boolean {
  return session?.user?.role === 'MANAGER'
}

// Получение пользователя на клиенте (через API)
export async function fetchCurrentUser(): Promise<AuthSession | null> {
  try {
    const response = await fetch('/api/auth/me')
    if (response.ok) {
      const data = await response.json()
      return data
    }
    return null
  } catch (error) {
    console.error('Ошибка получения текущего пользователя:', error)
    return null
  }
} 