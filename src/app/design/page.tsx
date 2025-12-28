'use client'

import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import CTASection from '@/components/website/CTASection'
import LeadRequestModal from '@/components/website/LeadRequestModal'
import Link from 'next/link'
import { useState } from 'react'
import { Ruler, Palette, Eye, FileText, CheckCircle2, ArrowRight } from 'lucide-react'

export default function DesignPage() {
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
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Дизайн проект</h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
                Создаем уникальные интерьеры, отражающие вашу индивидуальность
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

        {/* Что входит */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Что входит в дизайн проект
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <Ruler className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">Обмерный план</h3>
                <p className="text-gray-600 leading-relaxed">
                  Точные замеры помещения с фиксацией всех особенностей и коммуникаций
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6">
                  <Palette className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">Планировочное решение</h3>
                <p className="text-gray-600 leading-relaxed">
                  Оптимальное размещение функциональных зон и мебели
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">3D визуализация</h3>
                <p className="text-gray-600 leading-relaxed">
                  Фотореалистичные изображения будущего интерьера
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">Рабочая документация</h3>
                <p className="text-gray-600 leading-relaxed">
                  Чертежи для строителей: планы полов, потолков, электрики, сантехники
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <Palette className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">Подбор материалов</h3>
                <p className="text-gray-600 leading-relaxed">
                  Спецификация всех отделочных материалов с артикулами
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">Авторский надзор</h3>
                <p className="text-gray-600 leading-relaxed">
                  Контроль качества реализации проекта на объекте
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Этапы работы */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Этапы работы над проектом
            </h2>
            <div className="space-y-8">
              {[
                { step: 1, title: 'Знакомство и замеры', desc: 'Встреча на объекте, обсуждение пожеланий, снятие точных размеров' },
                { step: 2, title: 'Концепция и планировка', desc: 'Разработка общей концепции дизайна и планировочных решений' },
                { step: 3, title: '3D визуализация', desc: 'Создание фотореалистичных изображений будущего интерьера' },
                { step: 4, title: 'Рабочая документация', desc: 'Подготовка всех чертежей и спецификаций для строителей' },
                { step: 5, title: 'Комплектация', desc: 'Подбор и заказ всех материалов, мебели и декора' },
                { step: 6, title: 'Авторский надзор', desc: 'Контроль реализации проекта на всех этапах строительства' }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-6 bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-black">{item.title}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </main>

      <Footer />
    </div>
  )
}


