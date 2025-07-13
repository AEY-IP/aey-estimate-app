import { AuthSession } from '@/types/auth'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

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

export interface Session {
  id: string
  role: 'ADMIN' | 'MANAGER'
  username: string
  name?: string
  phone?: string
  isActive?: boolean
  createdAt?: Date
}

export interface ClientSession {
  clientUserId: string
  clientId: string
  username: string
  type: 'client'
}

export function checkAuth(request: NextRequest): Session | null {
  try {
    const sessionCookie = request.cookies.get('auth-session')
    if (!sessionCookie) {
      return null
    }

    let session: any
    try {
      // Сначала пробуем декодировать как base64
      const decodedValue = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      session = JSON.parse(decodedValue)
    } catch (base64Error) {
      try {
        // Если не получается, пробуем URL decode
        const urlDecoded = decodeURIComponent(sessionCookie.value)
        session = JSON.parse(urlDecoded)
      } catch (urlError) {
        console.error('Failed to parse session cookie as base64 or URL-encoded:', { base64Error, urlError })
        return null
      }
    }
    
    if (!session.id || !session.role || !session.username) {
      return null
    }
    
    return session as Session
  } catch (error) {
    console.error('Failed to parse session cookie:', error)
    return null
  }
}

export function checkClientAuth(request: NextRequest): ClientSession | null {
  try {
    const clientTokenCookie = request.cookies.get('client-token')
    if (!clientTokenCookie) {
      return null
    }

    const decoded = jwt.verify(clientTokenCookie.value, process.env.JWT_SECRET!) as any
    
    if (!decoded.clientUserId || !decoded.clientId || !decoded.username || decoded.type !== 'client') {
      return null
    }
    
    return {
      clientUserId: decoded.clientUserId,
      clientId: decoded.clientId,
      username: decoded.username,
      type: 'client'
    }
  } catch (error) {
    console.error('Failed to parse client token:', error)
    return null
  }
} 