'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Calculator, Users, Wrench, Percent, ChevronRight, Home, Menu, X, LogOut, User, Shield } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

const Navigation = () => {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { session, logout, loading } = useAuth()

  // Не показываем навигацию на странице входа или если данные загружаются
  if (pathname === '/login' || loading) return null

  const isHomePage = pathname === '/'

  // Определяем активную страницу
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  // Проверяем, является ли пользователь админом
  const isAdmin = session?.user?.role === 'ADMIN'

  // Генерируем breadcrumbs
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs: Array<{ name: string; href: string; icon?: any }> = [{ name: 'Главная', href: '/', icon: Home }]

    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      let name = segment
      let icon: any = undefined

      // Определяем название и иконку для каждого сегмента
      switch (segment) {
        case 'clients':
          name = 'Клиенты'
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
        default:
          if (pathSegments[index - 1] === 'clients' && segment !== 'new') {
            name = 'Клиент'
          }
      }

      breadcrumbs.push({ name, href: currentPath, icon })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Основная панель навигации */}
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Calculator className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-semibold text-gray-900">AEY Estimates</span>
              <p className="text-xs text-gray-500">Система управления сметами</p>
            </div>
            <div className="sm:hidden">
              <span className="text-lg font-semibold text-gray-900">AEY</span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link 
                href="/clients" 
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive('/clients') 
                    ? 'bg-blue-100 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Клиенты
              </Link>
              
              {/* Админские ссылки */}
              {isAdmin && (
                <>
                  <Link 
                    href="/works" 
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive('/works') 
                        ? 'bg-green-100 text-green-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Wrench className="h-4 w-4 inline mr-2" />
                    Работы
                  </Link>
                  <Link 
                    href="/coefficients" 
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive('/coefficients') 
                        ? 'bg-purple-100 text-purple-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Percent className="h-4 w-4 inline mr-2" />
                    Коэффициенты
                  </Link>
                  <Link 
                    href="/admin/users" 
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive('/admin') 
                        ? 'bg-orange-100 text-orange-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Shield className="h-4 w-4 inline mr-2" />
                    Админ
                  </Link>
                </>
              )}
            </div>

            {/* Пользователь и выход */}
            <div className="hidden md:flex items-center space-x-3">
              {session?.user && (
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                    <p className="text-xs text-gray-500">
                      {session.user.role === 'ADMIN' ? 'Администратор' : 'Менеджер'}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                    session.user.role === 'ADMIN' ? 'bg-red-500' : 'bg-blue-500'
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

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100">
            <div className="space-y-1">
              <Link 
                href="/clients" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive('/clients') 
                    ? 'bg-blue-100 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Users className="h-4 w-4 mr-3" />
                Клиенты
              </Link>
              
              {/* Админские ссылки для мобильного */}
              {isAdmin && (
                <>
                  <Link 
                    href="/works"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive('/works') 
                        ? 'bg-green-100 text-green-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Wrench className="h-4 w-4 mr-3" />
                    Работы
                  </Link>
                  <Link 
                    href="/coefficients"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive('/coefficients') 
                        ? 'bg-purple-100 text-purple-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Percent className="h-4 w-4 mr-3" />
                    Коэффициенты
                  </Link>
                  <Link 
                    href="/admin/users"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive('/admin') 
                        ? 'bg-orange-100 text-orange-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    Администрирование
                  </Link>
                </>
              )}
              
              {/* Пользователь и выход для мобильного */}
              <div className="border-t border-gray-200 mt-3 pt-3">
                {session?.user && (
                  <div className="px-3 py-2 text-sm">
                    <p className="font-medium text-gray-900">{session.user.name}</p>
                    <p className="text-gray-500">
                      {session.user.role === 'ADMIN' ? 'Администратор' : 'Менеджер'}
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
        {!isHomePage && breadcrumbs.length > 1 && (
          <div className="py-3 border-t border-gray-100">
            <ol className="flex items-center space-x-2 text-sm overflow-x-auto">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center flex-shrink-0">
                  {index > 0 && (
                    <ChevronRight className="h-3 w-3 text-gray-400 mx-2" />
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="flex items-center text-gray-900 font-medium">
                      {crumb.icon && <crumb.icon className="h-3 w-3 mr-1" />}
                      <span className="truncate">{crumb.name}</span>
                    </span>
                  ) : (
                    <Link 
                      href={crumb.href}
                      className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {crumb.icon && <crumb.icon className="h-3 w-3 mr-1" />}
                      <span className="truncate">{crumb.name}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation 