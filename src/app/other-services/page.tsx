'use client'

import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import CTASection from '@/components/website/CTASection'
import LeadRequestModal from '@/components/website/LeadRequestModal'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Zap, Droplet, Wind, CheckCircle2 } from 'lucide-react'

export default function OtherServicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <LeadRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Прочие услуги</h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
                Профессиональная разработка проектной документации для согласований и качественной реализации
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl shadow-pink-500/50"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-semibold">Давайте начнем работать!</span>
                    <span className="text-sm font-normal opacity-80">(Оставить заявку)</span>
                  </div>
                  <ArrowRight className="h-5 w-5 flex-shrink-0" />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Услуги */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Наши услуги
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Проект электрики */}
              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Проект электрики</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Разработка полного проекта электроснабжения с расчетами нагрузок, схемами разводки и спецификацией оборудования.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Согласование с УК</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Расчет нагрузок</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Схемы и чертежи</span>
                  </li>
                </ul>
              </div>

              {/* Проект сантехники */}
              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <Droplet className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Проект сантехники</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Проектирование систем водоснабжения и канализации с учетом всех норм и требований.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Согласование с УК</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Схемы водоснабжения</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Схемы канализации</span>
                  </li>
                </ul>
              </div>

              {/* Проект вентиляции */}
              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <Wind className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Проект вентиляции</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Разработка систем вентиляции и кондиционирования с расчетом воздухообмена.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Согласование с УК</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Расчет воздухообмена</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Схемы и спецификации</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Преимущества */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Почему стоит заказать проект
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-black">Согласование с УК</h3>
                <p className="text-gray-600 leading-relaxed">
                  Профессионально выполненный проект значительно упрощает согласование с управляющей компанией и помогает избежать проблем при приемке работ.
                </p>
              </div>

              <div className="p-8 bg-white rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-black">Качество реализации</h3>
                <p className="text-gray-600 leading-relaxed">
                  Детальная проектная документация исключает ошибки при монтаже, экономит материалы и время, обеспечивает правильную работу всех систем.
                </p>
              </div>

              <div className="p-8 bg-white rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-black">Соответствие нормам</h3>
                <p className="text-gray-600 leading-relaxed">
                  Все проекты разрабатываются с учетом действующих СНиПов, ГОСТов и правил пожарной безопасности.
                </p>
              </div>

              <div className="p-8 bg-white rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-black">Экономия в будущем</h3>
                <p className="text-gray-600 leading-relaxed">
                  Правильно спроектированные системы работают эффективнее, требуют меньше обслуживания и служат дольше.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CTASection />
      </main>

      <Footer />
    </div>
  )
}

