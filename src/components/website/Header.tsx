'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Главная', href: '/' },
    { name: 'О нас', href: '/about' },
    { name: 'Дизайн проект', href: '/design' },
    { name: 'Ремонт', href: '/renovation' },
    { name: 'Цены', href: '/pricing' },
  ]

  return (
    <header className="bg-black text-white sticky top-0 z-50 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <Link href="/" className="flex items-center group">
            <img 
              src="/images/icons/Main_logo.png?v=2" 
              alt="Идеальный подрядчик" 
              className="h-12 w-auto transform group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Десктопная навигация */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  pathname === item.href
                    ? 'border-2 border-pink-500 text-pink-500'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/app"
              className="ml-4 px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-pink-500/50"
            >
              Личный кабинет
            </Link>
          </div>

          {/* Мобильная кнопка меню */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Мобильное меню */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-all duration-300 ${
                  pathname === item.href
                    ? 'border-2 border-pink-500 text-pink-500'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold text-center transition-all duration-300"
            >
              Личный кабинет
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}

