'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AuthSession } from '@/types/auth'
import { fetchCurrentUser } from '@/lib/auth'

interface AuthContextType {
  session: AuthSession | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  // Определяем, находимся ли мы в клиентской среде
  const isClientEnvironment = pathname.startsWith('/client-')

  const loadUser = async () => {
    try {
      let userSession: AuthSession | null = null

      if (isClientEnvironment) {
        // Загружаем данные клиента
        const response = await fetch('/api/auth/client-me')
        if (response.ok) {
          const data = await response.json()
          userSession = {
            user: data.user,
            isAuthenticated: data.isAuthenticated
          }
        }
      } else {
        // Загружаем данные профессионала
        userSession = await fetchCurrentUser()
      }

      setSession(userSession)
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (isClientEnvironment) {
        // Выход клиента
        await fetch('/api/auth/client-logout', { method: 'POST' })
      } else {
        // Выход профессионала
        await fetch('/api/auth/logout', { method: 'POST' })
      }
      window.location.href = '/'
    } catch (error) {
      console.error('Ошибка выхода:', error)
    }
  }

  const refreshUser = async () => {
    await loadUser()
  }

  useEffect(() => {
    loadUser()
  }, [pathname]) // Перезагружаем при смене пути

  return (
    <AuthContext.Provider value={{ session, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 