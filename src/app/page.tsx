import Link from 'next/link'
import { FileText, Wrench, Calculator, TrendingUp, Users, Settings } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AEY Estimates</h1>
                <p className="text-sm text-gray-500">Система управления сметами</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/estimates" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
                Сметы
              </Link>
              <Link href="/works" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
                Работы
              </Link>
              <Link href="/coefficients" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
                Коэффициенты
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Создавайте сметы
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600"> быстро и точно</span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Профессиональная система для составления смет ремонтных работ с гибкими коэффициентами и автоматическими расчетами
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/estimates/new" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center">
                <FileText className="h-5 w-5 mr-2" />
                Создать смету
              </Link>
              <Link href="/estimates" className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Мои сметы
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Возможности системы</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Все необходимые инструменты для профессионального составления смет
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card group hover:scale-105 transition-all duration-300 fade-in">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Управление сметами</h4>
              <p className="text-gray-600 leading-relaxed">
                Создавайте, редактируйте и управляйте сметами с удобным интерфейсом и автоматическими расчетами
              </p>
              <Link href="/estimates" className="inline-flex items-center text-blue-500 hover:text-blue-600 mt-4 font-medium">
                Перейти к сметам
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="card group hover:scale-105 transition-all duration-300 fade-in" style={{animationDelay: '0.1s'}}>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Справочник работ</h4>
              <p className="text-gray-600 leading-relaxed">
                Обширная база данных работ с возможностью импорта из CSV и гибкой категоризацией
              </p>
              <Link href="/works" className="inline-flex items-center text-green-500 hover:text-green-600 mt-4 font-medium">
                Открыть справочник
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="card group hover:scale-105 transition-all duration-300 fade-in" style={{animationDelay: '0.2s'}}>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Гибкие коэффициенты</h4>
              <p className="text-gray-600 leading-relaxed">
                Применяйте коэффициенты ко всей смете или к отдельным блокам работ для точного ценообразования
              </p>
              <Link href="/coefficients" className="inline-flex items-center text-purple-500 hover:text-purple-600 mt-4 font-medium">
                Управление коэффициентами
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Feature 4 */}
            <div className="card group hover:scale-105 transition-all duration-300 fade-in" style={{animationDelay: '0.3s'}}>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Управление клиентами</h4>
              <p className="text-gray-600 leading-relaxed">
                Ведите базу клиентов с контактной информацией и историей заказов
              </p>
              <div className="inline-flex items-center text-orange-500 mt-4 font-medium">
                В разработке
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="card group hover:scale-105 transition-all duration-300 fade-in" style={{animationDelay: '0.4s'}}>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Экспорт в PDF</h4>
              <p className="text-gray-600 leading-relaxed">
                Создавайте профессиональные PDF-документы для презентации клиентам
              </p>
              <div className="inline-flex items-center text-red-500 mt-4 font-medium">
                Готово к использованию
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="card group hover:scale-105 transition-all duration-300 fade-in" style={{animationDelay: '0.5s'}}>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Настройки системы</h4>
              <p className="text-gray-600 leading-relaxed">
                Гибкая настройка коэффициентов, категорий работ и других параметров системы
              </p>
              <Link href="/coefficients" className="inline-flex items-center text-indigo-500 hover:text-indigo-600 mt-4 font-medium">
                Настроить коэффициенты
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="card bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center">
            <h3 className="text-3xl font-bold mb-4">Готовы начать работу?</h3>
            <p className="text-xl mb-8 text-blue-100">
              Создайте свою первую смету прямо сейчас
            </p>
            <Link href="/estimates/new" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-xl transition-all duration-200 inline-flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Создать смету
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Calculator className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">AEY Estimates</span>
          </div>
          <p className="text-gray-600">
            © 2024 AEY Estimates. Система управления сметами ремонтных работ.
          </p>
        </div>
      </footer>
    </div>
  )
} 