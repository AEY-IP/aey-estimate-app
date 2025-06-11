import Link from 'next/link'
import { FileText, Wrench, Calculator, TrendingUp, Users, Settings, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Создавайте сметы
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600"> быстро и точно</span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Профессиональная система для составления смет ремонтных работ с гибкими коэффициентами и автоматическими расчетами
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/clients" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center">
                <Users className="h-5 w-5 mr-2" />
                Управление клиентами
              </Link>
              <Link href="/works" className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center">
                <Wrench className="h-5 w-5 mr-2" />
                Справочник работ
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
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Управление клиентами</h4>
              <p className="text-gray-600 leading-relaxed">
                Ведите базу клиентов и создавайте сметы для каждого клиента с удобным интерфейсом
              </p>
              <Link href="/clients" className="inline-flex items-center hover:opacity-80 mt-4 font-medium" style={{color: '#FF006F'}}>
                Перейти к клиентам
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="card group hover:scale-105 transition-all duration-300 fade-in" style={{animationDelay: '0.1s'}}>
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Справочник работ</h4>
              <p className="text-gray-600 leading-relaxed">
                Обширная база данных работ с возможностью импорта из CSV и гибкой категоризацией
              </p>
              <Link href="/works" className="inline-flex items-center text-teal-500 hover:text-teal-600 mt-4 font-medium">
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
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Коэффициенты</h4>
              <p className="text-gray-600 leading-relaxed">
                Настройка коэффициентов для точного расчета стоимости работ с учетом региональных особенностей
              </p>
              <Link href="/coefficients" className="inline-flex items-center text-purple-500 hover:text-purple-600 mt-4 font-medium">
                Настроить коэффициенты
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Feature 4 */}
            <div className="card group hover:scale-105 transition-all duration-300 fade-in" style={{animationDelay: '0.3s'}}>
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Управление менеджерами</h4>
              <p className="text-gray-600 leading-relaxed">
                Создание и управление аккаунтами менеджеров, настройка прав доступа и контроль активности
              </p>
              <Link href="/admin/users" className="inline-flex items-center text-pink-500 hover:text-pink-600 mt-4 font-medium">
                Управлять пользователями
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
          <div className="card text-white text-center" style={{background: 'linear-gradient(to right, #FF006F, #9333ea)'}}>
            <h3 className="text-3xl font-bold mb-4">Готовы начать работу?</h3>
                          <p className="text-xl mb-8 text-pink-100">
              Создайте клиента и составьте для него смету прямо сейчас
            </p>
                          <Link href="/clients" className="bg-white hover:bg-gray-100 font-semibold py-3 px-8 rounded-xl transition-all duration-200 inline-flex items-center" style={{color: '#FF006F'}}>
              <Users className="h-5 w-5 mr-2" />
              Начать с клиентов
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Calculator className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Идеальный подрядчик</span>
          </div>
          <p className="text-gray-600">
            © 2024 Идеальный подрядчик. Система управления сметами ремонтных работ.
          </p>
        </div>
      </footer>
    </div>
  )
} 