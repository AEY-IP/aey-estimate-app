'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Calculator, User, Loader2, ArrowRight, Building2, UserCheck } from 'lucide-react'

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
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Профессиональная среда - левая половина */}
        <div 
          onClick={() => router.push('/login')}
          className="flex-1 relative overflow-hidden cursor-pointer group transition-all duration-700 ease-out min-h-[50vh] md:min-h-screen"
        >
          {/* Базовый фон */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-700 ease-out group-hover:from-black group-hover:to-gray-900" />
          
          {/* Контент */}
          <div className="relative h-full flex flex-col items-center justify-center p-6 md:p-8 text-center">
            {/* Иконка */}
            <div className="mb-6 md:mb-8 relative">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl transition-all duration-700 ease-out group-hover:bg-pink-500 group-hover:shadow-2xl group-hover:shadow-pink-500/30 group-hover:scale-110">
                <Calculator className="h-8 w-8 md:h-12 md:w-12 text-gray-700 transition-all duration-700 ease-out group-hover:text-white" />
              </div>
              {/* Декоративные элементы */}
              <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 bg-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-300 transform scale-0 group-hover:scale-100" />
              <div className="absolute -bottom-2 -left-2 md:-bottom-3 md:-left-3 w-3 h-3 md:w-4 md:h-4 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-500 transform scale-0 group-hover:scale-100" />
            </div>

            {/* Заголовок */}
            <h2 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 md:mb-4 transition-all duration-700 ease-out text-gray-900 group-hover:text-pink-400">
              Профессиональная
            </h2>
            <h3 className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 transition-all duration-700 ease-out text-gray-900 group-hover:text-pink-300">
              среда
            </h3>

            {/* Описание */}
            <p className="text-sm md:text-lg lg:text-xl text-gray-600 group-hover:text-pink-200 transition-all duration-700 ease-out mb-4 md:mb-8 max-w-xs md:max-w-md px-4">
              Управление проектами, сметами и клиентами для администраторов и менеджеров
            </p>

            {/* Особенности */}
            <div className="space-y-2 md:space-y-3 mb-4 md:mb-8 max-w-xs md:max-w-sm">
              <div className="flex items-center justify-center text-gray-600 group-hover:text-pink-200 transition-all duration-700 text-sm md:text-base">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
                <span>Полный контроль проектов</span>
              </div>
              <div className="flex items-center justify-center text-gray-600 group-hover:text-pink-200 transition-all duration-700 text-sm md:text-base">
                <Calculator className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
                <span>Управление сметами</span>
              </div>
              <div className="flex items-center justify-center text-gray-600 group-hover:text-pink-200 transition-all duration-700 text-sm md:text-base">
                <UserCheck className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
                <span>Клиентская база</span>
              </div>
            </div>

            {/* Кнопка входа */}
            <div className="flex items-center text-gray-700 group-hover:text-pink-300 transition-all duration-700 ease-out font-semibold text-base md:text-lg">
              <span className="mr-2">Войти в систему</span>
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 transform group-hover:translate-x-2 transition-transform duration-700" />
            </div>
          </div>

          {/* Декоративные элементы фона */}
          <div className="absolute top-10 left-5 md:top-20 md:left-10 w-16 h-16 md:w-32 md:h-32 bg-pink-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000 transform -translate-x-5 md:-translate-x-10 group-hover:translate-x-0" />
          <div className="absolute bottom-10 right-5 md:bottom-20 md:right-10 w-12 h-12 md:w-24 md:h-24 bg-pink-400/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-200 transform translate-x-5 md:translate-x-10 group-hover:translate-x-0" />
        </div>

        {/* Разделительная линия */}
        <div className="h-px md:h-auto md:w-px bg-gradient-to-r md:bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

        {/* Кабинет клиента - правая половина */}
        <div 
          onClick={() => router.push('/client-login')}
          className="flex-1 relative overflow-hidden cursor-pointer group transition-all duration-700 ease-out min-h-[50vh] md:min-h-screen"
        >
          {/* Базовый фон */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-700 ease-out group-hover:from-teal-500 group-hover:to-teal-600" />
          
          {/* Контент */}
          <div className="relative h-full flex flex-col items-center justify-center p-6 md:p-8 text-center">
            {/* Иконка */}
            <div className="mb-6 md:mb-8 relative">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl transition-all duration-700 ease-out group-hover:bg-black group-hover:shadow-2xl group-hover:shadow-black/30 group-hover:scale-110">
                <User className="h-8 w-8 md:h-12 md:w-12 text-gray-700 transition-all duration-700 ease-out group-hover:text-white" />
              </div>
              {/* Декоративные элементы */}
              <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-300 transform scale-0 group-hover:scale-100" />
              <div className="absolute -bottom-2 -left-2 md:-bottom-3 md:-left-3 w-3 h-3 md:w-4 md:h-4 bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 delay-500 transform scale-0 group-hover:scale-100" />
            </div>

            {/* Заголовок */}
            <h2 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 md:mb-4 transition-all duration-700 ease-out text-gray-900 group-hover:text-black">
              Кабинет
            </h2>
            <h3 className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 transition-all duration-700 ease-out text-gray-900 group-hover:text-gray-900">
              клиента
            </h3>

            {/* Описание */}
            <p className="text-sm md:text-lg lg:text-xl text-gray-600 group-hover:text-gray-900 transition-all duration-700 ease-out mb-4 md:mb-8 max-w-xs md:max-w-md px-4">
              Персональный доступ к документам, фотографиям и актуальной информации по проекту
            </p>

            {/* Особенности */}
            <div className="space-y-2 md:space-y-3 mb-4 md:mb-8 max-w-xs md:max-w-sm">
              <div className="flex items-center justify-center text-gray-600 group-hover:text-gray-900 transition-all duration-700 text-sm md:text-base">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
                <span>Статус проекта</span>
              </div>
              <div className="flex items-center justify-center text-gray-600 group-hover:text-gray-900 transition-all duration-700 text-sm md:text-base">
                <Calculator className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
                <span>Сметы и документы</span>
              </div>
              <div className="flex items-center justify-center text-gray-600 group-hover:text-gray-900 transition-all duration-700 text-sm md:text-base">
                <UserCheck className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
                <span>Фото с объекта</span>
              </div>
            </div>

            {/* Кнопка входа */}
            <div className="flex items-center text-gray-700 group-hover:text-gray-900 transition-all duration-700 ease-out font-semibold text-base md:text-lg">
              <span className="mr-2">Войти в кабинет</span>
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 transform group-hover:translate-x-2 transition-transform duration-700" />
            </div>
          </div>

          {/* Декоративные элементы фона */}
          <div className="absolute top-10 right-5 md:top-20 md:right-10 w-16 h-16 md:w-32 md:h-32 bg-black/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000 transform translate-x-5 md:translate-x-10 group-hover:translate-x-0" />
          <div className="absolute bottom-10 left-5 md:bottom-20 md:left-10 w-12 h-12 md:w-24 md:h-24 bg-gray-900/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-200 transform -translate-x-5 md:-translate-x-10 group-hover:translate-x-0" />
        </div>

        {/* Логотип компании внизу */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="text-xl md:text-3xl font-bold text-pink-500 mb-1 md:mb-2">
            Идеальный подрядчик
          </h1>
          <p className="text-gray-500 text-xs md:text-sm">
            Система управления сметами и проектами
          </p>
        </div>
      </div>
    )
  }

  return null
} 