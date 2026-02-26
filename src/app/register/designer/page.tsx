'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Building2, Phone, Link as LinkIcon, Lock, CheckCircle, AlertCircle } from 'lucide-react'

export default function DesignerRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [usernameCheck, setUsernameCheck] = useState<{
    checking: boolean
    available: boolean | null
    message: string
  }>({ checking: false, available: null, message: '' })
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: '',
    resourceLink1: '',
    resourceLink2: '',
    resourceLink3: ''
  })

  // Проверка логина с debounce
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameCheck({ checking: false, available: null, message: '' })
      return
    }

    setUsernameCheck({ checking: true, available: null, message: '' })

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(formData.username)}`)
        const data = await response.json()
        setUsernameCheck({
          checking: false,
          available: data.available,
          message: data.message
        })
      } catch (error) {
        console.error('Error checking username:', error)
        setUsernameCheck({ checking: false, available: null, message: '' })
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Валидация
    if (!formData.name || !formData.username || !formData.password || !formData.companyName || !formData.phone) {
      alert('Заполните все обязательные поля')
      return
    }

    // Проверка доступности логина
    if (usernameCheck.available === false) {
      alert('Логин уже занят. Выберите другой логин.')
      return
    }

    if (usernameCheck.checking) {
      alert('Подождите, идет проверка логина...')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Пароли не совпадают')
      return
    }

    if (formData.password.length < 6) {
      alert('Пароль должен быть не менее 6 символов')
      return
    }

    // Проверка на английские символы
    const englishOnlyRegex = /^[a-zA-Z0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?-]*$/
    if (!englishOnlyRegex.test(formData.password)) {
      alert('Пароль должен содержать только английские буквы, цифры и специальные символы')
      return
    }

    setLoading(true)

    try {
      const resourceLinks = [
        formData.resourceLink1,
        formData.resourceLink2,
        formData.resourceLink3
      ].filter(link => link.trim())

      const response = await fetch('/api/auth/register/designer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password,
          companyName: formData.companyName,
          phone: formData.phone,
          resourceLinks
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        alert(data.error || 'Ошибка регистрации')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Регистрация успешна!
          </h2>
          <p className="text-gray-600 mb-6">
            Ваш аккаунт создан. Перенаправляем на страницу входа...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="mb-8">
          <Link 
            href="/login" 
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к входу
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Регистрация дизайнера
          </h1>
          <p className="text-gray-600">
            Создайте профессиональный аккаунт для работы со сметами
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Личная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Личная информация
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Имя и фамилия <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Иван Иванов"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Контактный телефон <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="+7 (999) 123-45-67"
                required
              />
            </div>
          </div>

          {/* Компания */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Информация о компании
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Название компании/бренда <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="input-field"
                placeholder="Студия дизайна интерьера"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="h-4 w-4 inline mr-1" />
                Ссылки на ресурсы
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Например: сайт, Telegram канал, портфолио
              </p>
              <div className="space-y-2">
                <input
                  type="url"
                  value={formData.resourceLink1}
                  onChange={(e) => setFormData({ ...formData, resourceLink1: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com"
                />
                <input
                  type="url"
                  value={formData.resourceLink2}
                  onChange={(e) => setFormData({ ...formData, resourceLink2: e.target.value })}
                  className="input-field"
                  placeholder="https://t.me/channel"
                />
                <input
                  type="url"
                  value={formData.resourceLink3}
                  onChange={(e) => setFormData({ ...formData, resourceLink3: e.target.value })}
                  className="input-field"
                  placeholder="https://instagram.com/profile"
                />
              </div>
            </div>
          </div>

          {/* Учетные данные */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Данные для входа
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Логин <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    const value = e.target.value
                    const englishOnlyRegex = /^[a-zA-Z0-9_-]*$/
                    if (englishOnlyRegex.test(value) || value === '') {
                      setFormData({ ...formData, username: value })
                    }
                  }}
                  className={`input-field pr-10 ${
                    usernameCheck.available === false ? 'border-red-300 focus:ring-red-500' : 
                    usernameCheck.available === true ? 'border-green-300 focus:ring-green-500' : ''
                  }`}
                  placeholder="designer123"
                  required
                  autoComplete="username"
                />
                {(usernameCheck.checking || usernameCheck.available !== null) && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usernameCheck.checking && (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-purple-500"></div>
                    )}
                    {!usernameCheck.checking && usernameCheck.available === true && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {!usernameCheck.checking && usernameCheck.available === false && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {usernameCheck.message && (
                <p className={`text-xs mt-1 font-medium ${
                  usernameCheck.available === false ? 'text-red-600' : 
                  usernameCheck.available === true ? 'text-green-600' : 
                  'text-gray-500'
                }`}>
                  {usernameCheck.message}
                </p>
              )}
              {!usernameCheck.message && formData.username.length > 0 && formData.username.length < 3 && (
                <p className="text-xs mt-1 text-gray-500">
                  Минимум 3 символа
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="h-4 w-4 inline mr-1" />
                Пароль <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  const value = e.target.value
                  const englishOnlyRegex = /^[a-zA-Z0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?-]*$/
                  if (englishOnlyRegex.test(value) || value === '') {
                    setFormData({ ...formData, password: value })
                  }
                }}
                className="input-field"
                placeholder="Минимум 6 символов"
                required
                autoComplete="new-password"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Только английские буквы, цифры и спецсимволы
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="h-4 w-4 inline mr-1" />
                Подтверждение пароля <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  const value = e.target.value
                  const englishOnlyRegex = /^[a-zA-Z0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?-]*$/
                  if (englishOnlyRegex.test(value) || value === '') {
                    setFormData({ ...formData, confirmPassword: value })
                  }
                }}
                className="input-field"
                placeholder="Повторите пароль"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || usernameCheck.available === false || usernameCheck.checking}
              className="btn-primary flex-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Регистрация...
                </>
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600 mt-6">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
              Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
