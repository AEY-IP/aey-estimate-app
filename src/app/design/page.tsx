'use client'

import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import CTASection from '@/components/website/CTASection'
import LeadRequestModal from '@/components/website/LeadRequestModal'
import DesignProjectCard from '@/components/website/DesignProjectCard'
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

        {/* Партнеры */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Совместно реализуем проекты с нашими партнерами
            </h2>
            <div className="flex justify-center items-center">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 max-w-md">
                <div className="flex items-center gap-6">
                  <img 
                    src="/images/icons/knot.png" 
                    alt="Knot" 
                    className="w-24 h-24 object-contain"
                  />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <span className="font-bold text-black">knot</span> - распутываем узлы мыслей наших клиентов
                  </p>
                </div>
              </div>
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
                  Оптимальное размещение функциональных зон и мебели. Разработка концепции с помощью AI по брифу от вас.
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
                <h3 className="text-xl font-bold mb-4 text-black">Разработка сметы проекта</h3>
                <p className="text-gray-600 leading-relaxed">
                  Спецификация всех отделочных материалов, мебели освещение и прочих элементов с артикулами
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">Авторский надзор</h3>
                <p className="text-gray-600 leading-relaxed">
                  Контроль качества реализации проекта на объекте, заказ материалов и прочей фурнитуры
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Примеры выполненных работ */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Примеры выполненных работ
            </h2>
            <div className="space-y-12">
              {/* Проект 1 - Knot */}
              <DesignProjectCard
                title="Название 1"
                description="Здесь будет размещено описание проекта. Расскажите о концепции, стиле, особенностях реализации и используемых решениях."
                photos={[
                  '/images/portfolio/knot_1.1.jpeg',
                  '/images/portfolio/knot_1.2.jpeg',
                  '/images/portfolio/knot_1.3.jpeg',
                  '/images/portfolio/knot_1.4.jpeg',
                  '/images/portfolio/knot_1.5.jpeg',
                  '/images/portfolio/knot_1.6.jpeg',
                  '/images/portfolio/knot_1.7.jpeg',
                  '/images/portfolio/knot_1.8.jpeg',
                  '/images/portfolio/knot_1.9.jpeg',
                  '/images/portfolio/knot_1.10.jpeg',
                  '/images/portfolio/knot_1.11.jpeg',
                  '/images/portfolio/knot_1.12.jpeg',
                  '/images/portfolio/knot_1.13.jpeg'
                ]}
              />

              {/* Проект 2 */}
              <DesignProjectCard
                title="Название 2"
                description="Здесь будет размещено описание второго проекта. Расскажите о концепции, стиле, особенностях реализации и используемых решениях."
                photos={[
                  '/images/portfolio/проект 2/photo_2026-01-19 16.57.36.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.57.39.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.57.43.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.57.46.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.57.50.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.57.54.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.57.57.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.58.02.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.58.05.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.58.09.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.58.13.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.58.18.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.58.22.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.58.26.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.58.29.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.58.34.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.58.38.jpeg',
                  '/images/portfolio/проект 2/photo_2026-01-19 16.58.41.jpeg'
                ]}
              />

              {/* Проект 3 */}
              <DesignProjectCard
                title="Название 3"
                description="Здесь будет размещено описание третьего проекта. Расскажите о концепции, стиле, особенностях реализации и используемых решениях."
                photos={[
                  '/images/portfolio/проект 3/1_Post.jpg',
                  '/images/portfolio/проект 3/2_Post.jpg',
                  '/images/portfolio/проект 3/3_Post.jpg',
                  '/images/portfolio/проект 3/4_Post.jpg',
                  '/images/portfolio/проект 3/5_Post.jpg',
                  '/images/portfolio/проект 3/6_Post.jpg',
                  '/images/portfolio/проект 3/7_Post.jpg',
                  '/images/portfolio/проект 3/8_Post.jpg',
                  '/images/portfolio/проект 3/9_Post.jpg',
                  '/images/portfolio/проект 3/10_Post.jpg',
                  '/images/portfolio/проект 3/11_Post.jpg',
                  '/images/portfolio/проект 3/12_Post.jpg',
                  '/images/portfolio/проект 3/13_Post.jpg',
                  '/images/portfolio/проект 3/14_Post.jpg',
                  '/images/portfolio/проект 3/15_Post.jpg',
                  '/images/portfolio/проект 3/16_Post.jpg',
                  '/images/portfolio/проект 3/18_Post.jpg',
                  '/images/portfolio/проект 3/photo_2026-01-19 17.13.17.jpeg',
                  '/images/portfolio/проект 3/photo_2026-01-19 17.13.27.jpeg',
                  '/images/portfolio/проект 3/photo_2026-01-19 17.13.30.jpeg',
                  '/images/portfolio/проект 3/photo_2026-01-19 17.13.33.jpeg',
                  '/images/portfolio/проект 3/photo_2026-01-19 17.13.36.jpeg'
                ]}
              />
            </div>
          </div>
        </section>

        <CTASection />
      </main>

      <Footer />
    </div>
  )
}


