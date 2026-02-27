'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Calculator, Users, Wrench, Percent, ChevronRight, Home, Menu, X, LogOut, User, Shield, FileText, Newspaper, Calendar, Camera, Video, Receipt, Settings } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

const Navigation = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { session, logout, loading } = useAuth()

  // Не показываем навигацию на страницах входа, главном дашборде или если данные загружаются
  if (pathname === '/login' || pathname === '/dashboard' || loading) return null

  const isHomePage = pathname === '/'

  // Определяем активную страницу
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    // Специальная логика для dashboard путей
    if (path === '/dashboard/clients' && pathname.startsWith('/clients')) return true
    return false
  }

  // Проверяем, является ли пользователь админом
  const isAdmin = session?.user?.role === 'ADMIN'

  // Определяем среду (профи или клиент) на основе URL
  const isClientEnvironment = pathname.startsWith('/client-')
  const isProfessionalEnvironment = !isClientEnvironment && session?.user

  // Дополнительная защита от ошибок - не показываем навигацию в проф среде без сессии
  if (!session && !loading && isProfessionalEnvironment) return null

  // Определяем главную страницу в зависимости от среды
  const getHomeUrl = () => {
    if (isClientEnvironment) {
      return '/client-dashboard'
    }
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER' || session?.user?.role === 'DESIGNER') {
      return '/dashboard'
    }
    return '/'
  }

  // Определяем логотип и подпись в зависимости от среды
  const getLogoConfig = () => {
    if (isClientEnvironment) {
      return {
        icon: User,
        title: 'Идеальный подрядчик',
        subtitle: 'Кабинет клиента',
        colors: 'from-teal-500 to-teal-600'
      }
    }
    return {
      icon: Calculator,
      title: 'Идеальный подрядчик',
      subtitle: 'Система управления сметами',
      colors: 'from-pink-500 to-pink-600'
    }
  }

  // Определяем пункты меню в зависимости от среды
  const getMenuItems = () => {
    if (isClientEnvironment) {
      // Клиентское меню
      return [
        {
          title: 'Профиль',
          href: '/client-dashboard/profile',
          icon: User,
          color: 'bg-pink-100 text-pink-700'
        },
        {
          title: 'Документы',
          href: '/client-dashboard/documents',
          icon: FileText,
          color: 'bg-blue-100 text-blue-700'
        },
        {
          title: 'Сметы',
          href: '/client-dashboard/estimates',
          icon: Calculator,
          color: 'bg-purple-100 text-purple-700'
        },
        {
          title: 'Новости',
          href: '/client-dashboard/news',
          icon: Newspaper,
          color: 'bg-green-100 text-green-700'
        },
        {
          title: 'График',
          href: '/client-dashboard/schedule',
          icon: Calendar,
          color: 'bg-orange-100 text-orange-700'
        },
        {
          title: 'Фото',
          href: '/client-dashboard/photos',
          icon: Camera,
          color: 'bg-teal-100 text-teal-700'
        },
        {
          title: 'Видео',
          href: '/client-dashboard/video',
          icon: Video,
          color: 'bg-red-100 text-red-700'
        },
        {
          title: 'Чеки',
          href: '/client-dashboard/receipts',
          icon: Receipt,
          color: 'bg-indigo-100 text-indigo-700'
        }
      ]
    } else if (isProfessionalEnvironment) {
      // Профессиональное меню
      const items = []
      const isDesigner = session?.user?.role === 'DESIGNER'
      
      // Внешние дизайнеры не имеют доступа к основным разделам
      const isExternalDesigner = session?.user?.role === 'DESIGNER' && session?.user?.designerType === 'EXTERNAL'

      // У дизайнеров всегда должен быть явный корневой раздел "Мои клиенты"
      if (isDesigner) {
        items.push({
          title: 'Мои клиенты',
          href: '/designer/clients',
          icon: Users,
          color: 'bg-purple-100 text-purple-700'
        })
      }
      
      if (!isExternalDesigner) {
        items.push(
          {
            title: 'Клиенты',
            href: '/dashboard/clients',
            icon: Users,
            color: 'bg-pink-100 text-pink-700'
          },
          {
            title: 'Акты',
            href: '/acts',
            icon: FileText,
            color: 'bg-green-100 text-green-700'
          },
          {
            title: 'Параметры помещений',
            href: '/room-parameters',
            icon: Settings,
            color: 'bg-gray-100 text-gray-700'
          }
        )
      }

      // Добавляем пункты только для админов
      if (isAdmin) {
        items.push(
          {
            title: 'Работы',
            href: '/works',
            icon: Wrench,
            color: 'bg-teal-100 text-teal-700'
          },
          {
            title: 'Коэффициенты',
            href: '/coefficients',
            icon: Percent,
            color: 'bg-purple-100 text-purple-700'
          },
          {
            title: 'Админ',
            href: '/admin',
            icon: Shield,
            color: 'bg-orange-100 text-orange-700'
          }
        )
      }

      return items
    }

    return []
  }

  // Генерируем breadcrumbs
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    
    // Для профессиональной среды начинаем с Dashboard
    const breadcrumbs: Array<{ name: string; href: string; icon?: any }> = [{ 
      name: isProfessionalEnvironment ? 'Dashboard' : 'Главная', 
      href: getHomeUrl(), 
      icon: Home 
    }]

    // Получаем параметр returnTo из URL
    const returnTo = searchParams.get('returnTo')

    // Для /designer/estimates/[id] восстанавливаем цепочку от клиента,
    // чтобы навигация оставалась "Dashboard > Клиенты > Клиент > Смета".
    if (pathname.startsWith('/designer/estimates/') && returnTo?.startsWith('/designer/clients/')) {
      breadcrumbs.push({ name: 'Клиенты дизайнера', href: '/designer/clients', icon: Users })
      breadcrumbs.push({ name: 'Клиент', href: returnTo, icon: User })
    }

    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      // Пропускаем технический сегмент "designer" из breadcrumbs
      if (segment === 'designer') {
        currentPath += `/${segment}`
        return
      }

      // Для /designer/estimates/[id] сегмент "estimates" не показываем отдельной
      // крошкой, если уже есть контекст returnTo (иначе "Сметы" визуально выпадает в начало).
      if (
        segment === 'estimates' &&
        pathname.startsWith('/designer/estimates/') &&
        returnTo?.startsWith('/designer/clients/')
      ) {
        currentPath += `/${segment}`
        return
      }
      
      currentPath += `/${segment}`
      
      let name = segment
      let icon: any = undefined
      let href = currentPath

      // Определяем название и иконку для каждого сегмента
      switch (segment) {
        case 'dashboard':
          name = 'Панель управления'
          icon = Settings
          break
        case 'clients':
          // Если это путь /designer/clients, показываем "Клиенты дизайнера"
          if (pathname.startsWith('/designer/clients')) {
            name = 'Клиенты дизайнера'
          } else {
            name = 'Клиенты'
          }
          icon = Users
          break
        case 'works':
          name = 'Справочник работ'
          icon = Wrench
          break
        case 'coefficients':
          name = 'Коэффициенты'
          icon = Percent
          break
        case 'room-parameters':
          name = 'Параметры помещений'
          break
        case 'admin':
          name = 'Администрирование'
          icon = Shield
          break
        case 'users':
          name = 'Пользователи'
          icon = User
          break
        case 'new':
          name = 'Создание'
          break
        case 'edit':
          name = 'Редактирование'
          break
        case 'client-dashboard':
          name = 'Кабинет клиента'
          icon = User
          break
        case 'profile':
          name = isClientEnvironment ? 'Профиль' : 'Профиль'
          icon = User
          break
        case 'documents':
          name = 'Документы'
          icon = FileText
          break
        case 'estimates':
          name = 'Сметы'
          icon = Calculator
          // Если есть returnTo параметр, используем его для ссылки на сметы
          if (returnTo && returnTo.includes('/estimates')) {
            href = returnTo
          }
          break
        case 'acts':
          name = 'Акты'
          icon = FileText
          break
        case 'news':
          name = 'Новости'
          icon = Newspaper
          break
        case 'schedule':
          name = 'График'
          icon = Calendar
          break
        case 'photos':
          name = 'Фото'
          icon = Camera
          break
        case 'video':
          name = 'Видео'
          icon = Video
          break
        case 'receipts':
          name = 'Чеки'
          icon = Receipt
          break
        default:
          // Если это ID клиента в пути /clients/[id] или /designer/clients/[id]
          const prevSegment = pathSegments[index - 1]
          if (prevSegment === 'clients' && segment !== 'new') {
            name = 'Клиент'
          }
          // Если это ID сметы
          if (prevSegment === 'estimates' && segment !== 'new') {
            name = 'Смета'
          }
      }

      breadcrumbs.push({ name, href, icon })
    })

    return breadcrumbs
  }

  const logoConfig = getLogoConfig()
  const menuItems = getMenuItems()
  const breadcrumbs = generateBreadcrumbs()

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Основная панель навигации */}
        <div className="flex items-center justify-between py-3">
          <Link href={getHomeUrl()} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className={`w-8 h-8 bg-gradient-to-br ${logoConfig.colors} rounded-lg flex items-center justify-center`}>
              <logoConfig.icon className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-semibold text-gray-900">{logoConfig.title}</span>
              <p className="text-xs text-gray-500">{logoConfig.subtitle}</p>
            </div>
            <div className="sm:hidden">
              <span className="text-lg font-semibold text-gray-900">
                {isClientEnvironment ? 'КК' : 'ИП'}
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Desktop Navigation - для обеих сред */}
            <div className="hidden md:flex items-center space-x-1">
              {menuItems.slice(0, isClientEnvironment ? 3 : 4).map((item, index) => {
                const Icon = item.icon
                return (
                  <Link 
                    key={index}
                    href={item.href} 
                    className={`px-2 lg:px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href) 
                        ? item.color + ' shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 inline mr-1 lg:mr-2" />
                    <span className="hidden lg:inline">{item.title}</span>
                  </Link>
                )
              })}
            </div>

            {/* Пользователь и выход */}
            <div className="hidden md:flex items-center space-x-3">
              {session?.user && (
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-32 lg:max-w-none">{session.user.name}</p>
                    <p className="text-xs text-gray-500">
                      {isClientEnvironment ? 'Клиент' : 
                       session.user.role === 'ADMIN' ? 'Администратор' : 
                       session.user.role === 'DESIGNER' ? 'Дизайнер' :
                       session.user.role === 'MANAGER' ? 'Менеджер' : 
                       'Пользователь'}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                    isClientEnvironment ? 'bg-teal-500' :
                    session.user.role === 'ADMIN' ? 'bg-red-500' : 
                    session.user.role === 'DESIGNER' ? 'bg-purple-500' :
                    'bg-pink-500'
                  }`}>
                    {session.user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Выйти"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile menu button - для обеих сред */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu - для обеих сред */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100">
            <div className="space-y-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <Link 
                    key={index}
                    href={item.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href) 
                        ? item.color + ' shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.title}
                  </Link>
                )
              })}
              
              {/* Пользователь и выход для мобильного */}
              <div className="border-t border-gray-200 mt-3 pt-3">
                {session?.user && (
                  <div className="px-3 py-2 text-sm">
                    <p className="font-medium text-gray-900">{session.user.name}</p>
                    <p className="text-gray-500">
                      {isClientEnvironment ? 'Клиент' : 
                       session.user.role === 'ADMIN' ? 'Администратор' : 
                       session.user.role === 'DESIGNER' ? 'Дизайнер' :
                       session.user.role === 'MANAGER' ? 'Менеджер' : 
                       'Пользователь'}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Выйти
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumbs - показываем только НЕ на главной */}
        {!isHomePage && (
          <div className="py-2 border-t border-gray-100">
            <div className="flex items-center space-x-1 sm:space-x-2 text-sm overflow-x-auto">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center flex-shrink-0">
                  {index > 0 && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mx-1 sm:mx-2" />}
                  <Link
                    href={crumb.href}
                    className={`flex items-center space-x-1 hover:text-gray-900 transition-colors whitespace-nowrap ${
                      index === breadcrumbs.length - 1 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-500'
                    }`}
                  >
                    {crumb.icon && <crumb.icon className="h-3 w-3 sm:h-4 sm:w-4" />}
                    <span className="text-xs sm:text-sm">{crumb.name}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation 