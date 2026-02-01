'use client'

import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import LeadRequestModal from '@/components/website/LeadRequestModal'
import Link from 'next/link'
import { useState } from 'react'
import { Check, Phone, Mail, ArrowRight, Zap, Wind, Droplet } from 'lucide-react'

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

        {/* Таблица цен на дизайн-проект */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-black">
              Дизайн-проект
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
              Выберите удобный для вас формат сотрудничества
            </p>

            {/* Десктопная версия таблицы */}
            <div className="hidden lg:block overflow-x-auto">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-6 px-6 text-lg font-bold text-black">Услуга</th>
                      <th className="text-center py-6 px-6">
                        <div className="text-lg font-bold text-black mb-1">Отдельно</div>
                        <div className="text-sm text-gray-500 font-normal">отдельная услуга</div>
                      </th>
                      <th className="text-center py-6 px-6">
                        <div className="text-lg font-bold text-pink-500 mb-1">Комплексно</div>
                        <div className="text-sm text-gray-500 font-normal">несколько услуг</div>
                      </th>
                      <th className="text-center py-6 px-6">
                        <div className="text-lg font-bold text-black mb-1">С ремонтом</div>
                        <div className="text-sm text-gray-500 font-normal">дизайн + ремонт у нас</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Обмерный план */}
                    <tr className="border-b border-gray-200 hover:bg-white/50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-semibold text-black">Обмерный план</div>
                        <div className="text-sm text-gray-500 mt-1">Точные замеры квартиры для начала проекта.</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-2xl font-bold text-black">600</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6 bg-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-500">500</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-gray-400">—</div>
                      </td>
                    </tr>

                    {/* Планировочные решения */}
                    <tr className="border-b border-gray-200 hover:bg-white/50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-semibold text-black">Планировочные решения</div>
                        <div className="text-sm text-gray-500 mt-1">Варианты удобной планировки квартиры.</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-2xl font-bold text-black">600</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6 bg-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-500">500</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-gray-400">—</div>
                      </td>
                    </tr>

                    {/* Концепция */}
                    <tr className="border-b border-gray-200 hover:bg-white/50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-semibold text-black">Концепция</div>
                        <div className="text-sm text-gray-500 mt-1">Идея и стиль будущего интерьера.</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-2xl font-bold text-black">500</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6 bg-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-500">400</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-gray-400">—</div>
                      </td>
                    </tr>

                    {/* 3D визуализации */}
                    <tr className="border-b border-gray-200 hover:bg-white/50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-semibold text-black">3D визуализации</div>
                        <div className="text-sm text-gray-500 mt-1">Как будет выглядеть квартира после ремонта.</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-2xl font-bold text-black">1750</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6 bg-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-500">1600</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-gray-400">—</div>
                      </td>
                    </tr>

                    {/* Рабочая документация */}
                    <tr className="border-b border-gray-200 hover:bg-white/50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-semibold text-black">Рабочая документация</div>
                        <div className="text-sm text-gray-500 mt-1">Чертежи для строителей.</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-2xl font-bold text-black">1600</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6 bg-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-500">1500</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-gray-400">—</div>
                      </td>
                    </tr>

                    {/* Разработка сметы проекта */}
                    <tr className="border-b border-gray-200 hover:bg-white/50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-semibold text-black">Разработка сметы проекта</div>
                        <div className="text-sm text-gray-500 mt-1">Расчёт стоимости ремонта.</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-2xl font-bold text-black">800</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6 bg-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-500">600</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-gray-400">—</div>
                      </td>
                    </tr>

                    {/* Решение под ключ */}
                    <tr className="border-b border-gray-200 hover:bg-white/50 transition-colors">
                      <td className="py-5 px-6 font-semibold text-black">Решение под ключ<br/><span className="text-sm text-gray-500 font-normal">(все вышеперечисленные услуги)</span></td>
                      <td className="text-center py-5 px-6">
                        <div className="text-gray-400">—</div>
                      </td>
                      <td className="text-center py-5 px-6 bg-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-500">4500</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                      <td className="text-center py-5 px-6 bg-black/5 rounded-lg">
                        <div className="text-2xl font-bold text-black">4000</div>
                        <div className="text-sm text-gray-500">₽/м²</div>
                      </td>
                    </tr>

                    {/* Авторский надзор */}
                    <tr className="hover:bg-white/50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-semibold text-black">Авторский надзор</div>
                        <div className="text-sm text-gray-500 mt-1">Контроль выполнения ремонта в соответствии с дизайн-проектом.</div>
                      </td>
                      <td className="text-center py-5 px-6">
                        <div className="text-gray-400">—</div>
                      </td>
                      <td className="text-center py-5 px-6 bg-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-500">45 000</div>
                        <div className="text-sm text-gray-500">₽/месяц</div>
                      </td>
                      <td className="text-center py-5 px-6 bg-black/5 rounded-lg">
                        <div className="text-2xl font-bold text-black">40 000</div>
                        <div className="text-sm text-gray-500">₽/месяц</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Мобильная версия - карточки */}
            <div className="lg:hidden space-y-6">
              {/* Услуга 1 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="font-bold text-lg text-black mb-1">Обмерный план</h3>
                <p className="text-sm text-gray-500 mb-4">Точные замеры квартиры для начала проекта.</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Отдельно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">600 ₽/м²</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-pink-50 rounded-lg p-3">
                    <span className="text-gray-600 font-semibold">Комплексно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-pink-500">500 ₽/м²</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Услуга 2 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="font-bold text-lg text-black mb-1">Планировочные решения</h3>
                <p className="text-sm text-gray-500 mb-4">Варианты удобной планировки квартиры.</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Отдельно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">600 ₽/м²</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-pink-50 rounded-lg p-3">
                    <span className="text-gray-600 font-semibold">Комплексно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-pink-500">500 ₽/м²</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Услуга 3 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="font-bold text-lg text-black mb-1">Концепция</h3>
                <p className="text-sm text-gray-500 mb-4">Идея и стиль будущего интерьера.</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Отдельно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">500 ₽/м²</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-pink-50 rounded-lg p-3">
                    <span className="text-gray-600 font-semibold">Комплексно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-pink-500">400 ₽/м²</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Услуга 4 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="font-bold text-lg text-black mb-1">3D визуализации</h3>
                <p className="text-sm text-gray-500 mb-4">Как будет выглядеть квартира после ремонта.</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Отдельно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">1750 ₽/м²</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-pink-50 rounded-lg p-3">
                    <span className="text-gray-600 font-semibold">Комплексно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-pink-500">1600 ₽/м²</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Услуга 5 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="font-bold text-lg text-black mb-1">Рабочая документация</h3>
                <p className="text-sm text-gray-500 mb-4">Чертежи для строителей.</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Отдельно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">1600 ₽/м²</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-pink-50 rounded-lg p-3">
                    <span className="text-gray-600 font-semibold">Комплексно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-pink-500">1500 ₽/м²</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Услуга 6 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="font-bold text-lg text-black mb-1">Разработка сметы проекта</h3>
                <p className="text-sm text-gray-500 mb-4">Расчёт стоимости ремонта.</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Отдельно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">800 ₽/м²</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-pink-50 rounded-lg p-3">
                    <span className="text-gray-600 font-semibold">Комплексно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-pink-500">600 ₽/м²</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Услуга 7 - Решение под ключ */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="font-bold text-lg text-black mb-2">Решение под ключ</h3>
                <p className="text-sm text-gray-500 mb-4">(все вышеперечисленные услуги)</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-pink-50 rounded-lg p-3">
                    <span className="text-gray-600 font-semibold">Комплексно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-pink-500">4500 ₽/м²</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-black/5 rounded-lg p-3">
                    <span className="text-gray-600 font-semibold">С ремонтом</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">4000 ₽/м²</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Услуга 8 - Авторский надзор */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="font-bold text-lg text-black mb-1">Авторский надзор</h3>
                <p className="text-sm text-gray-500 mb-4">Контроль выполнения ремонта в соответствии с дизайн-проектом.</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-pink-50 rounded-lg p-3">
                    <span className="text-gray-600 font-semibold">Комплексно</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-pink-500">45 000 ₽/мес</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-black/5 rounded-lg p-3">
                    <span className="text-gray-600 font-semibold">С ремонтом</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">40 000 ₽/мес</div>
                    </div>
                  </div>
                </div>
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
                      <span>Полы ламинат или кварцвинил</span>
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
                      <span>Полы инженерная доска или паркет</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Потолок под покраску или из гипсокартона</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-500 mr-2 flex-shrink-0">•</span>
                      <span>Стены под покраску (К4, проверка с лампой Лосева) или декоративная штукатурка</span>
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


        {/* Прочие услуги - Проекты */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                Проектная документация
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Профессиональная разработка проектов для согласований и качественной реализации
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Проект электроснабжения */}
              <div className="group relative bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                {/* Градиентный фон при наведении */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative p-8 flex flex-col h-full">
                  {/* Иконка */}
                  <div className="mb-6 h-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Название */}
                  <h3 className="text-2xl font-bold text-black mb-3 group-hover:text-pink-500 transition-colors duration-300 h-16">
                    Проект электроснабжения
                  </h3>

                  {/* Описание */}
                  <p className="text-gray-600 mb-6 leading-relaxed h-12">
                    Схема электрики с расчетом нагрузок и спецификацией оборудования
                  </p>

                  {/* Цена */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-black group-hover:text-pink-500 transition-colors duration-300">80 000</span>
                      <span className="text-xl text-gray-500 ml-2">₽</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">за проект</div>
                  </div>

                  {/* Что входит */}
                  <ul className="space-y-2">
                    <li className="flex items-start text-sm text-gray-600">
                      <Check className="h-5 w-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Согласование с УК</span>
                    </li>
                    <li className="flex items-start text-sm text-gray-600">
                      <Check className="h-5 w-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Расчет нагрузок</span>
                    </li>
                    <li className="flex items-start text-sm text-gray-600">
                      <Check className="h-5 w-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Полный комплект чертежей</span>
                    </li>
                  </ul>
                </div>

                {/* Декоративный элемент */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              </div>

              {/* Проект вентиляции и кондиционирования */}
              <div className="group relative bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                {/* Градиентный фон при наведении */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-gray-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative p-8 flex flex-col h-full">
                  {/* Иконка */}
                  <div className="mb-6 h-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-900 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                      <Wind className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Название */}
                  <h3 className="text-2xl font-bold text-black mb-3 group-hover:text-pink-500 transition-colors duration-300 h-16">
                    Проект вентиляции
                  </h3>

                  {/* Описание */}
                  <p className="text-gray-600 mb-6 leading-relaxed h-12">
                    Система вентиляции и кондиционирования с расчетами
                  </p>

                  {/* Цена */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-black group-hover:text-pink-500 transition-colors duration-300">80 000</span>
                      <span className="text-xl text-gray-500 ml-2">₽</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">за проект</div>
                  </div>

                  {/* Что входит */}
                  <ul className="space-y-2">
                    <li className="flex items-start text-sm text-gray-600">
                      <Check className="h-5 w-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Согласование с УК</span>
                    </li>
                    <li className="flex items-start text-sm text-gray-600">
                      <Check className="h-5 w-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Расчет воздухообмена</span>
                    </li>
                    <li className="flex items-start text-sm text-gray-600">
                      <Check className="h-5 w-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Схемы и спецификации</span>
                    </li>
                  </ul>
                </div>

                {/* Декоративный элемент */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-900/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              </div>

              {/* Проект водоснабжения и канализации */}
              <div className="group relative bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                {/* Градиентный фон при наведении */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative p-8 flex flex-col h-full">
                  {/* Иконка */}
                  <div className="mb-6 h-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                      <Droplet className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Название */}
                  <h3 className="text-2xl font-bold text-black mb-3 group-hover:text-pink-500 transition-colors duration-300 h-16">
                    Проект водоснабжения
                  </h3>

                  {/* Описание */}
                  <p className="text-gray-600 mb-6 leading-relaxed h-12">
                    Разводка воды и канализации с точками подключения
                  </p>

                  {/* Цена */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-black group-hover:text-pink-500 transition-colors duration-300">80 000</span>
                      <span className="text-xl text-gray-500 ml-2">₽</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">за проект</div>
                  </div>

                  {/* Что входит */}
                  <ul className="space-y-2">
                    <li className="flex items-start text-sm text-gray-600">
                      <Check className="h-5 w-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Согласование с УК</span>
                    </li>
                    <li className="flex items-start text-sm text-gray-600">
                      <Check className="h-5 w-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Схемы водоснабжения</span>
                    </li>
                    <li className="flex items-start text-sm text-gray-600">
                      <Check className="h-5 w-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Схемы канализации</span>
                    </li>
                  </ul>
                </div>

                {/* Декоративный элемент */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-6">
                Подробнее о проектах и когда они нужны →{' '}
                <Link href="/other-services" className="text-pink-500 hover:text-pink-600 font-semibold transition-colors">
                  Прочие услуги
                </Link>
              </p>
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


