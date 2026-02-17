'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Calculator, 
  FileText, 
  Settings, 
  BarChart3,
  LogOut,
  User,
  TrendingUp,
  Clock,
  Layout,
  MessageSquare
} from 'lucide-react'

interface UserData {
  id: string
  name: string
  username: string
  role: string
}

interface DashboardStats {
  totalClients: number
  totalWorks: number
  activeProjects: number
  newLeads?: number
}

export default function ProfessionalDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      // Сначала проверяем авторизацию
      const userResponse = await fetch('/api/auth/me')
      
      if (!userResponse.ok) {
        router.push('/login')
        return
      }
      
      const userData = await userResponse.json()
      setUserData(userData.user)
      
      // Затем загружаем статистику
      try {
        const statsResponse = await fetch('/api/dashboard/stats')
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData.stats)
        } else {
          // Устанавливаем заглушку если API недоступно
          setStats({
            totalClients: 0,
            totalWorks: 0,
            activeProjects: 0
          })
        }
      } catch (statsError) {
        console.error('Error fetching stats:', statsError)
        setStats({
          totalClients: 0,
          totalWorks: 0,
          activeProjects: 0
        })
      }
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getMenuItems = () => {
    if (userData?.role === 'DESIGNER') {
      // Для дизайнеров - только клиенты
      return [
        {
          title: 'Клиенты',
          description: 'Мои клиенты и проекты',
          icon: Users,
          href: '/dashboard/clients',
          color: 'from-blue-500 to-blue-600',
          count: stats?.totalClients
        }
      ]
    } else if (userData?.role === 'MANAGER') {
      // Для менеджеров - 4 кнопки
      return [
        {
          title: 'Клиенты',
          description: 'Управление клиентами и проектами',
          icon: Users,
          href: '/dashboard/clients',
          color: 'from-blue-500 to-blue-600',
          count: stats?.totalClients
        },
        {
          title: 'Шаблоны',
          description: 'Шаблоны для быстрого создания смет',
          icon: Layout,
          href: '/templates',
          color: 'from-indigo-500 to-indigo-600'
        },
        {
          title: 'Справочник работ',
          description: 'Просмотр каталога работ (только чтение)',
          icon: FileText,
          href: '/works?readonly=true',
          color: 'from-purple-500 to-purple-600',
          count: stats?.totalWorks
        },
        {
          title: 'Коэффициенты',
          description: 'Просмотр коэффициентов (только чтение)',
          icon: TrendingUp,
          href: '/coefficients?readonly=true',
          color: 'from-orange-500 to-orange-600'
        }
      ]
    } else {
      // Для админов - полный доступ
      return [
        {
          title: 'Клиенты',
          description: 'Управление клиентами и проектами',
          icon: Users,
          href: '/dashboard/clients',
          color: 'from-blue-500 to-blue-600',
          count: stats?.totalClients
        },
        {
          title: 'Заявки',
          description: 'Заявки с сайта на консультацию',
          icon: MessageSquare,
          href: '/dashboard/leads',
          color: 'from-green-500 to-green-600',
          count: stats?.newLeads,
          showBadge: (stats?.newLeads ?? 0) > 0
        },
        {
          title: 'Шаблоны',
          description: 'Создание и управление шаблонами смет',
          icon: Layout,
          href: '/templates',
          color: 'from-indigo-500 to-indigo-600'
        },
        {
          title: 'Справочник работ',
          description: 'Каталог работ и материалов',
          icon: FileText,
          href: '/works',
          color: 'from-purple-500 to-purple-600',
          count: stats?.totalWorks
        },
        {
          title: 'Коэффициенты',
          description: 'Настройка ценовых коэффициентов',
          icon: TrendingUp,
          href: '/coefficients',
          color: 'from-orange-500 to-orange-600'
        },
        {
          title: 'Учетные записи',
          description: 'Управление пользователями системы',
          icon: Settings,
          href: '/admin',
          color: 'from-red-500 to-red-600'
        }
      ]
    }
  }

  const filteredMenuItems = getMenuItems()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Calculator className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-semibold text-gray-900">Идеальный подрядчик</span>
                <p className="text-xs text-gray-500">Система управления сметами</p>
              </div>
            </Link>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {filteredMenuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <Link 
                    key={index}
                    href={item.href} 
                    className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative"
                  >
                    {item.showBadge && item.count !== undefined && item.count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{item.count}</span>
                      </span>
                    )}
                    <Icon className="h-4 w-4 inline mr-2" />
                    {item.title}
                  </Link>
                )
              })}
            </div>

            {/* Profile Authentication */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userData?.name}</p>
                <p className="text-xs text-gray-600">{userData?.role === 'ADMIN' ? 'Администратор' : 'Менеджер'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Выйти"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Экран профи
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Добро пожаловать, {userData?.name}!
          </h2>
          <p className="text-lg text-gray-600">
            Выберите раздел для работы с проектами и сметами
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Клиенты</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Работы</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalWorks}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Активные проекты</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <div className={`grid gap-6 ${
          userData?.role === 'MANAGER' 
            ? 'md:grid-cols-1 lg:grid-cols-3 max-w-4xl mx-auto'
            : 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4'
        }`}>
          {filteredMenuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                href={item.href}
                className="group card hover:scale-105 transition-all duration-300 p-6 h-full relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Notification Badge */}
                {item.showBadge && item.count !== undefined && item.count > 0 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-white text-sm font-bold">{item.count}</span>
                  </div>
                )}
                
                <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {item.description}
                </p>
                {item.count !== undefined && !item.showBadge && (
                  <div className="flex items-center text-blue-500 font-medium text-sm">
                    {item.count} записей
                  </div>
                )}
                <div className="mt-4 inline-flex items-center text-blue-500 font-medium text-sm">
                  Открыть
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>


      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Идеальный подрядчик</span>
            </div>
            <p className="text-gray-600">
              © 2024 Идеальный подрядчик. Профессиональная среда.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 