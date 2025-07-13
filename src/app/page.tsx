'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Calculator, User, Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [showAuthSelect, setShowAuthSelect] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [router])

  const checkAuthStatus = async () => {
    try {
      // Проверяем авторизацию профи
      const adminResponse = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      const isAdminAuth = adminResponse.ok

      // Проверяем авторизацию клиента
      const clientResponse = await fetch('/api/auth/client-me', {
        credentials: 'include'
      })
      const isClientAuth = clientResponse.ok

      // Если пользователь уже авторизован, перенаправляем в соответствующую среду
      if (isAdminAuth) {
        console.log('👤 Admin already authenticated, redirecting to dashboard...')
        router.replace('/dashboard')
        return
      }

      if (isClientAuth) {
        console.log('👤 Client already authenticated, redirecting to client dashboard...')
        router.replace('/client-dashboard')
        return
      }

      // Если никто не авторизован, показываем страницу выбора
      setIsChecking(false)
      setShowAuthSelect(true)

    } catch (error) {
      console.error('Error checking auth status:', error)
      setIsChecking(false)
      setShowAuthSelect(true)
    }
  }

  // Показываем загрузку пока проверяем авторизацию
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    )
  }

  // Показываем страницу выбора авторизации
  if (showAuthSelect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-pink-500 mb-2">
              Идеальный подрядчик
            </h1>
            <p className="text-gray-600">
              Выберите способ входа в систему
            </p>
          </div>

          {/* Варианты входа */}
          <div className="space-y-4">
            {/* Вход для профи */}
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-white border-2 border-pink-200 hover:border-pink-300 rounded-xl p-6 transition-all duration-200 hover:shadow-lg group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                  <Calculator className="h-6 w-6 text-pink-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Профессиональная среда
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Для администраторов и менеджеров
                  </p>
                </div>
              </div>
            </button>

            {/* Вход для клиентов */}
            <button
              onClick={() => router.push('/client-login')}
              className="w-full bg-white border-2 border-teal-200 hover:border-teal-300 rounded-xl p-6 transition-all duration-200 hover:shadow-lg group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <User className="h-6 w-6 text-teal-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Кабинет клиента
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Для клиентов компании
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Дополнительная информация */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Система управления сметами и проектами
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
} 