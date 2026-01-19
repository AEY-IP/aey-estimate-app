'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  FileText, 
  Calculator, 
  Newspaper, 
  Calendar, 
  Camera, 
  Video, 
  Receipt,
  Star
} from 'lucide-react'

interface ClientData {
  id: string
  name: string
  username: string
}

export default function ClientDashboardPage() {
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchClientData()
  }, [])

  const fetchClientData = async () => {
    try {
      const response = await fetch('/api/auth/client-me')
      if (response.ok) {
        const data = await response.json()
        setClientData({
          id: data.client.id,
          name: data.client.name,
          username: data.user.username
        })
      } else {
        router.push('/client-login')
      }
    } catch (error) {
      console.error('Error fetching client data:', error)
      router.push('/client-login')
    } finally {
      setIsLoading(false)
    }
  }

  const menuItems = [
    {
      title: 'Информация о клиенте',
      description: 'Ваши контактные данные и информация о проекте',
      shortTitle: 'Профиль',
      icon: User,
      href: '/client-dashboard/profile',
      color: 'from-pink-500 to-pink-600'
    },
    {
      title: 'Документация',
      description: 'Проектная документация и договоры',
      shortTitle: 'Документы',
      icon: FileText,
      href: '/client-dashboard/documents',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Дизайн-проект',
      description: 'Дизайнерские проекты и визуализации',
      shortTitle: 'Дизайн',
      icon: Star,
      href: '/client-dashboard/design-project',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Сметы',
      description: 'Сметы на выполнение работ',
      shortTitle: 'Сметы',
      icon: Calculator,
      href: '/client-dashboard/estimates',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Новости с объекта',
      description: 'Актуальная информация о ходе работ',
      shortTitle: 'Новости',
      icon: Newspaper,
      href: '/client-dashboard/news',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'График производства работ',
      description: 'Планы и сроки выполнения этапов',
      shortTitle: 'График',
      icon: Calendar,
      href: '/client-dashboard/schedule',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Фотографии с объекта',
      description: 'Фотоотчеты о выполненных работах',
      shortTitle: 'Фото',
      icon: Camera,
      href: '/client-dashboard/photos',
      color: 'from-teal-500 to-teal-600'
    },
    {
      title: 'Видеонаблюдение за объектом',
      description: 'Онлайн наблюдение за объектом',
      shortTitle: 'Видео',
      icon: Video,
      href: '/client-dashboard/video',
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Чеки',
      description: 'Документы об оплате материалов и услуг',
      shortTitle: 'Чеки',
      icon: Receipt,
      href: '/client-dashboard/receipts',
      color: 'from-indigo-500 to-indigo-600'
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 pt-4 sm:pt-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Экран клиента
          </h1>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">
            Добро пожаловать, {clientData?.name}!
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Выберите раздел для просмотра информации по вашему проекту
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                href={item.href}
                className="group card hover:scale-105 transition-all duration-300 p-4 sm:p-6 h-full"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors leading-tight">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  {item.description}
                </p>
                <div className="mt-3 sm:mt-4 inline-flex items-center text-teal-500 font-medium text-xs sm:text-sm">
                  Открыть
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12 sm:mt-16">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-gray-900">Идеальный подрядчик</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2024 Идеальный подрядчик. Кабинет клиента.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 