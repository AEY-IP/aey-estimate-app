'use client'

import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import LeadRequestModal from '@/components/website/LeadRequestModal'
import Link from 'next/link'
import { useState } from 'react'
import { Check, Phone, Mail, ArrowRight } from 'lucide-react'

export default function PricingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <LeadRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Цены и услуги</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Прозрачное ценообразование и гибкие пакеты услуг
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
        </section>

        {/* Цены на дизайн */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Дизайн проект
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Базовый */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
                <h3 className="text-2xl font-bold mb-4 text-black">Базовый</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-pink-500">от 1500</span>
                  <span className="text-gray-600 ml-2">₽/м²</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Обмерный план</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Планировочное решение</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">3-4 визуализации</span>
                  </li>
                </ul>
                <Link
                  href="/app"
                  className="block w-full py-3 px-6 bg-gray-200 hover:bg-gray-300 text-black rounded-lg font-semibold text-center transition-colors duration-300"
                >
                  Выбрать
                </Link>
              </div>

              {/* Стандарт */}
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-8 shadow-2xl transform scale-105 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Популярный
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Стандарт</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">от 2500</span>
                  <span className="text-pink-100 ml-2">₽/м²</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-white">Все из базового</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-white">Рабочая документация</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-white">6-8 визуализаций</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-white">Спецификация материалов</span>
                  </li>
                </ul>
                <Link
                  href="/app"
                  className="block w-full py-3 px-6 bg-white hover:bg-gray-100 text-pink-500 rounded-lg font-semibold text-center transition-colors duration-300"
                >
                  Выбрать
                </Link>
              </div>

              {/* Премиум */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
                <h3 className="text-2xl font-bold mb-4 text-black">Премиум</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-pink-500">от 3500</span>
                  <span className="text-gray-600 ml-2">₽/м²</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Все из стандартного</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">10+ визуализаций</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Комплектация</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Авторский надзор</span>
                  </li>
                </ul>
                <Link
                  href="/app"
                  className="block w-full py-3 px-6 bg-gray-200 hover:bg-gray-300 text-black rounded-lg font-semibold text-center transition-colors duration-300"
                >
                  Выбрать
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Цены на ремонт */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-black">
              Ремонтные работы
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-4xl mx-auto leading-relaxed">
              В карточках по классам приведена стоимость выполнения работ без учета материалов. Стоимость материалов по статистике составляет от 30% до 50% от стоимости работ.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Эконом / Комфорт */}
              <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300 border-2 border-pink-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Популярный
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Эконом / Комфорт</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-pink-500">20-35</span>
                  <span className="text-gray-600 ml-2">тыс. ₽/м²</span>
                </div>
                <div className="space-y-3">
                  <p className="text-gray-700 font-semibold mb-2">Примерный ориентир:</p>
                  <ul className="space-y-2 text-gray-600 text-sm leading-relaxed">
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Полы из ламината или кварцвинила</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Натяжные потолки</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Стены под обои или под покраску (К3)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Керамогранит стандартного размера</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Простые решения</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Бизнес */}
              <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-2xl font-bold mb-4 text-black">Бизнес</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-pink-500">35-60</span>
                  <span className="text-gray-600 ml-2">тыс. ₽/м²</span>
                </div>
                <div className="space-y-3">
                  <p className="text-gray-700 font-semibold mb-2">Примерный ориентир:</p>
                  <ul className="space-y-2 text-gray-600 text-sm leading-relaxed">
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Полы из инженерной доски или паркет</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Потолок под покраску или из гипсокартона</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Стены под покраску (К4, проверка с лампой Ломова) или декоративная штукатурка</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Крупноформатный керамогранит</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Двери скрытого монтажа</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Более сложные решения</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Премьер */}
              <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-2xl font-bold mb-4 text-black">Премьер</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-pink-500">от 60</span>
                  <span className="text-gray-600 ml-2">тыс. ₽/м²</span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Отличается от бизнес-класса сложными техническими решениями реализации и дорогими материалами, что технически усложняет процесс производства работ.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Контакты */}
        <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Нужна консультация?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Свяжитесь с нами для точного расчета стоимости вашего проекта
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <a
                href="tel:+79932903098"
                className="flex items-center justify-center p-6 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20"
              >
                <Phone className="h-6 w-6 mr-3 text-pink-500" />
                <div className="text-left">
                  <div className="text-sm text-gray-400">Телефон</div>
                  <div className="font-semibold">+7 (993) 290-30-98</div>
                </div>
              </a>
              <a
                href="mailto:idealpodryad@gmail.com"
                className="flex items-center justify-center p-6 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20"
              >
                <Mail className="h-6 w-6 mr-3 text-pink-500" />
                <div className="text-left">
                  <div className="text-sm text-gray-400">Email</div>
                  <div className="font-semibold">idealpodryad@gmail.com</div>
                </div>
              </a>
            </div>
            <Link
              href="/app"
              className="inline-flex items-center px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-pink-500/50"
            >
              Перейти в личный кабинет
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}


