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

              {/* Проект водоснабжения отопления и канализации */}
              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <Droplet className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Проект водоснабжения отопления и канализации</h3>
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

        {/* Почему стоит заказать проект - детальная информация */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
              Почему стоит заказать проект?
            </h2>

            {/* Десктопная версия */}
            <div className="hidden lg:block space-y-8">
              {/* Проект электроснабжения */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h4 className="text-2xl font-bold text-pink-500 mb-6">Проект электроснабжения</h4>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h5 className="font-bold text-black mb-2">Что это?</h5>
                    <p className="text-gray-700">Подробная схема всей электрики в квартире: розетки, освещение, мощная техника, автоматы и нагрузки.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-bold text-black mb-2">Когда проект обязателен?</h5>
                      <ul className="text-gray-700 space-y-1 text-sm">
                        <li>• Большая площадь</li>
                        <li>• Много бытовой и встроенной техники</li>
                        <li>• Умный дом</li>
                        <li>• Увеличение выделенной мощности</li>
                        <li>• Требования управляющей компании</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-bold text-black mb-2">Когда можно без проекта?</h5>
                      <ul className="text-gray-700 space-y-1 text-sm">
                        <li>• Типовая квартира до ~60–70 м²</li>
                        <li>• Стандартный набор техники</li>
                        <li>• Простая замена проводки без усложнений</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2">Зачем делать проект?</h5>
                    <p className="text-gray-700">Проект позволяет заранее рассчитать нагрузки, избежать перегрева, выбивания автоматов и переделок после ремонта.</p>
                  </div>

                  <div className="bg-pink-50 rounded-xl p-4 border-l-4 border-pink-500">
                    <h5 className="font-bold text-black mb-2">Наше объективное мнение</h5>
                    <p className="text-gray-700">Для стандартных квартир мы обеспечиваем качество за счёт внутреннего контроля. Для сложных объектов проект — это разумное усиление надёжности и безопасности.</p>
                  </div>
                </div>
              </div>

              {/* Проект вентиляции и кондиционирования */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h4 className="text-2xl font-bold text-pink-500 mb-6">Проект вентиляции и кондиционирования</h4>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h5 className="font-bold text-black mb-2">Что это?</h5>
                    <p className="text-gray-700">Расчёт и схема системы, которая отвечает за свежий воздух, охлаждение и комфортный микроклимат.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-bold text-black mb-2">Когда проект обязателен?</h5>
                      <ul className="text-gray-700 space-y-1 text-sm">
                        <li>• Приточная вентиляция (бризер, приточная установка)</li>
                        <li>• Канальные кондиционеры</li>
                        <li>• Комбинированные системы вентиляции и охлаждения</li>
                        <li>• Требования УК к размещению наружных блоков</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-bold text-black mb-2">Когда можно без проекта?</h5>
                      <ul className="text-gray-700 space-y-1 text-sm">
                        <li>• Установка обычных настенных сплит-систем по комнатам</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2">Зачем делать проект?</h5>
                    <p className="text-gray-700">Без расчётов система может шуметь, плохо работать или не давать нужного объёма воздуха. Проект позволяет правильно подобрать оборудование и проложить трассы без конфликтов с другими инженерными системами.</p>
                  </div>

                  <div className="bg-pink-50 rounded-xl p-4 border-l-4 border-pink-500">
                    <h5 className="font-bold text-black mb-2">Наше объективное мнение</h5>
                    <p className="text-gray-700">Обычные кондиционеры — проект не нужен. Сложные системы — проект обязателен, иначе монтаж превращается в дорогое угадывание.</p>
                  </div>
                </div>
              </div>

              {/* Проект водоснабжения отопления и канализации */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h4 className="text-2xl font-bold text-pink-500 mb-6">Проект водоснабжения отопления и канализации</h4>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h5 className="font-bold text-black mb-2">Что это?</h5>
                    <p className="text-gray-700">Схема разводки воды и канализации: трубы, стояки, точки подключения и сантехника.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-bold text-black mb-2">Когда проект обязателен?</h5>
                      <ul className="text-gray-700 space-y-1 text-sm">
                        <li>• Несколько санузлов</li>
                        <li>• Душевые, ванны, инсталляции, скрытый монтаж</li>
                        <li>• Большая квартира или сложная планировка</li>
                        <li>• Перенос сантехнических точек</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-bold text-black mb-2">Когда можно без проекта?</h5>
                      <ul className="text-gray-700 space-y-1 text-sm">
                        <li>• Один санузел</li>
                        <li>• Типовая сантехника</li>
                        <li>• Простая и понятная разводка</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2">Зачем делать проект?</h5>
                    <p className="text-gray-700">Проект помогает избежать протечек, проблем с напором воды и ошибок, которые сложно исправить после отделки.</p>
                  </div>

                  <div className="bg-pink-50 rounded-xl p-4 border-l-4 border-pink-500">
                    <h5 className="font-bold text-black mb-2">Наше объективное мнение</h5>
                    <p className="text-gray-700">Для простых решений опыт мастеров достаточен. Для сложных систем проект снижает риск аварий и лишних затрат.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Мобильная версия */}
            <div className="lg:hidden space-y-6">
              {/* Проект электроснабжения - мобильная */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h4 className="text-xl font-bold text-pink-500 mb-4">Проект электроснабжения</h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Что это?</h5>
                    <p className="text-gray-700 text-sm">Подробная схема всей электрики в квартире: розетки, освещение, мощная техника, автоматы и нагрузки.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Когда проект обязателен?</h5>
                    <ul className="text-gray-700 space-y-1 text-xs">
                      <li>• Большая площадь</li>
                      <li>• Много бытовой и встроенной техники</li>
                      <li>• Умный дом</li>
                      <li>• Увеличение выделенной мощности</li>
                      <li>• Требования управляющей компании</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Когда можно без проекта?</h5>
                    <ul className="text-gray-700 space-y-1 text-xs">
                      <li>• Типовая квартира до ~60–70 м²</li>
                      <li>• Стандартный набор техники</li>
                      <li>• Простая замена проводки без усложнений</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Зачем делать проект?</h5>
                    <p className="text-gray-700 text-sm">Проект позволяет заранее рассчитать нагрузки, избежать перегрева, выбивания автоматов и переделок после ремонта.</p>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3 border-l-4 border-pink-500">
                    <h5 className="font-bold text-black mb-2 text-sm">Наше мнение</h5>
                    <p className="text-gray-700 text-sm">Для стандартных квартир мы обеспечиваем качество за счёт внутреннего контроля. Для сложных объектов проект — это разумное усиление надёжности и безопасности.</p>
                  </div>
                </div>
              </div>

              {/* Проект вентиляции - мобильная */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h4 className="text-xl font-bold text-pink-500 mb-4">Проект вентиляции и кондиционирования</h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Что это?</h5>
                    <p className="text-gray-700 text-sm">Расчёт и схема системы, которая отвечает за свежий воздух, охлаждение и комфортный микроклимат.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Когда проект обязателен?</h5>
                    <ul className="text-gray-700 space-y-1 text-xs">
                      <li>• Приточная вентиляция (бризер, приточная установка)</li>
                      <li>• Канальные кондиционеры</li>
                      <li>• Комбинированные системы вентиляции и охлаждения</li>
                      <li>• Требования УК к размещению наружных блоков</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Когда можно без проекта?</h5>
                    <ul className="text-gray-700 space-y-1 text-xs">
                      <li>• Установка обычных настенных сплит-систем по комнатам</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Зачем делать проект?</h5>
                    <p className="text-gray-700 text-sm">Без расчётов система может шуметь, плохо работать или не давать нужного объёма воздуха. Проект позволяет правильно подобрать оборудование и проложить трассы без конфликтов с другими инженерными системами.</p>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3 border-l-4 border-pink-500">
                    <h5 className="font-bold text-black mb-2 text-sm">Наше мнение</h5>
                    <p className="text-gray-700 text-sm">Обычные кондиционеры — проект не нужен. Сложные системы — проект обязателен, иначе монтаж превращается в дорогое угадывание.</p>
                  </div>
                </div>
              </div>

              {/* Проект водоснабжения отопления и канализации - мобильная */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h4 className="text-xl font-bold text-pink-500 mb-4">Проект водоснабжения отопления и канализации</h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Что это?</h5>
                    <p className="text-gray-700 text-sm">Схема разводки воды и канализации: трубы, стояки, точки подключения и сантехника.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Когда проект обязателен?</h5>
                    <ul className="text-gray-700 space-y-1 text-xs">
                      <li>• Несколько санузлов</li>
                      <li>• Душевые, ванны, инсталляции, скрытый монтаж</li>
                      <li>• Большая квартира или сложная планировка</li>
                      <li>• Перенос сантехнических точек</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Когда можно без проекта?</h5>
                    <ul className="text-gray-700 space-y-1 text-xs">
                      <li>• Один санузел</li>
                      <li>• Типовая сантехника</li>
                      <li>• Простая и понятная разводка</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold text-black mb-2 text-sm">Зачем делать проект?</h5>
                    <p className="text-gray-700 text-sm">Проект помогает избежать протечек, проблем с напором воды и ошибок, которые сложно исправить после отделки.</p>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3 border-l-4 border-pink-500">
                    <h5 className="font-bold text-black mb-2 text-sm">Наше мнение</h5>
                    <p className="text-gray-700 text-sm">Для простых решений опыт мастеров достаточен. Для сложных систем проект снижает риск аварий и лишних затрат.</p>
                  </div>
                </div>
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

