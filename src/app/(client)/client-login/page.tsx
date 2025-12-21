'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Lock, ArrowLeft, Calculator, Loader2 } from 'lucide-react'

export default function ClientLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Сначала очищаем старую авторизацию
      await fetch('/api/auth/client-logout', { method: 'POST' })
      
      // Небольшая пауза для очистки cookies
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Проверяем, есть ли активная клиентская сессия
      const response = await fetch('/api/auth/client-me', {
        credentials: 'include'
      })

      if (response.ok) {
        // Клиент уже авторизован, перенаправляем в клиентский дашборд
        console.log('👤 Client already authenticated, redirecting to client dashboard...')
        router.push('/client-dashboard')
        return
      }

      // Клиент не авторизован, показываем форму входа
      setIsChecking(false)

    } catch (error) {
      console.error('Error checking client auth status:', error)
      setIsChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/client-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        router.push('/client-dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Ошибка входа')
      }
    } catch (error) {
      setError('Ошибка подключения к серверу')
    } finally {
      setIsLoading(false)
    }
  }

  // Показываем загрузку пока проверяем авторизацию
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Кнопка назад */}
        <div className="mb-4">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к выбору входа
          </Link>
        </div>
        
        {/* Логотип/Заголовок */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Кабинет клиента
          </h1>
          <p className="text-gray-600">
            Введите данные для доступа к вашему кабинету
          </p>
        </div>

        {/* Форма входа */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Вход в систему
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Логин
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field w-full"
                placeholder="Введите логин"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                placeholder="Введите пароль"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Вход...
                </>
              ) : (
                <>
                  <User className="h-5 w-5 mr-2" />
                  Войти
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Нет доступа? Обратитесь к вашему менеджеру
            </p>
          </div>
        </div>

        {/* Футер */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2024 Идеальный подрядчик. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  )
} 