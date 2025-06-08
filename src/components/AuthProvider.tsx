'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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

  const loadUser = async () => {
    try {
      const userSession = await fetchCurrentUser()
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
      await fetch('/api/auth/logout', { method: 'POST' })
      setSession(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Ошибка выхода:', error)
    }
  }

  const refreshUser = async () => {
    await loadUser()
  }

  useEffect(() => {
    loadUser()
  }, [])

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