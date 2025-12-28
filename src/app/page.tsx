'use client'

import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import CTASection from '@/components/website/CTASection'
import Link from 'next/link'
import { ArrowRight, Palette, Shield, Monitor, Workflow, Ruler, Hammer, MessageSquare, FileText } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [cardsVisible, setCardsVisible] = useState(false)
  const [servicesVisible, setServicesVisible] = useState(false)
  const cardsRef = useRef<HTMLDivElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)
    
    // Fallback: показываем карточки через 2 секунды если observer не сработал
    const fallbackTimer = setTimeout(() => {
      setCardsVisible(true)
      setServicesVisible(true)
    }, 2000)

    return () => clearTimeout(fallbackTimer)
  }, [])

  useEffect(() => {
    const cardsElement = cardsRef.current
    const servicesElement = servicesRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === cardsElement) {
              setCardsVisible(true)
            } else if (entry.target === servicesElement) {
              setServicesVisible(true)
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    if (cardsElement) {
      observer.observe(cardsElement)
    }
    if (servicesElement) {
      observer.observe(servicesElement)
    }

    return () => {
      if (cardsElement) {
        observer.unobserve(cardsElement)
      }
      if (servicesElement) {
        observer.unobserve(servicesElement)
      }
    }
  }, [])

    return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero секция */}
        <section className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden">
          {/* Декоративные элементы */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center">
              <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
                Идеальный подрядчик для
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600 animate-gradient">
                  вашего дома мечты
                </span>
              </h1>
              
              {/* Анимированный лозунг */}
              <div className="text-2xl md:text-4xl lg:text-5xl font-bold mb-8 max-w-4xl mx-auto leading-relaxed">
                <div className="flex justify-center gap-3 md:gap-4">
                  <span className={`inline-block text-white transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '300ms' }}>
                    Быстро.
                  </span>
                  <span className={`inline-block text-white transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '600ms' }}>
                    Четко.
                  </span>
                  <span className={`inline-block text-white transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '900ms' }}>
                    Компонентно.
                  </span>
        </div>
      </div>
              <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '1200ms' }}>
                <Link
                  href="/design"
                  className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-xl shadow-pink-500/50 flex items-center justify-center group"
                >
                  Дизайн проект
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/renovation"
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm flex items-center justify-center transform hover:scale-110 hover:-translate-y-1"
                >
                  Ремонт под ключ
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Преимущества */}
        <section className="py-20 bg-white" ref={cardsRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black animate-fade-in">
              Почему выбирают нас
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Классный дизайн */}
              <div className={`p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-2 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: cardsVisible ? '100ms' : '0ms' }}>
                <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <Palette className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Классный дизайн</h3>
                <p className="text-gray-600 leading-relaxed">
                  Продумаем грамотный эргономичный дизайн, подберем все элементы — от цвета шва на плитке до модели телевизора. Все решения будут реальными, так как их провалидируют строители.
                </p>
              </div>

              {/* Качественный ремонт */}
              <div className={`p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-2 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: cardsVisible ? '250ms' : '0ms' }}>
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Качественный ремонт</h3>
                <p className="text-gray-600 leading-relaxed">
                  Выполним работы любой сложности с чувством, толком, с расстановкой, а еще дадим на них гарантию.
                </p>
              </div>

              {/* Единое окно */}
              <div className={`p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-2 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: cardsVisible ? '400ms' : '0ms' }}>
                <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <Monitor className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Единое окно</h3>
                <p className="text-gray-600 leading-relaxed">
                  Возможность следить за ходом ремонта с помощью нашей платформы.
                </p>
              </div>

              {/* Сквозные процессы */}
              <div className={`p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-2 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: cardsVisible ? '550ms' : '0ms' }}>
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6 transform transition-transform duration-500 hover:rotate-12 hover:scale-110">
                  <Workflow className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Сквозные процессы</h3>
                <p className="text-gray-600 leading-relaxed">
                  Сопроводим объект от вашей идеи до мебелировки.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Услуги */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100" ref={servicesRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black animate-fade-in">
              Наши услуги
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Консультации */}
              <Link
                href="/pricing"
                className={`group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-rotate-1 ${servicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: servicesVisible ? '100ms' : '0ms' }}
              >
                <div className="p-8 relative z-10">
                  <div className="flex items-center mb-4">
                    <MessageSquare className="h-10 w-10 text-pink-500 mr-4 transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-2xl font-bold text-black group-hover:text-pink-500 transition-colors duration-300">
                      Консультации
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Можем дать короткую консультацию по проекту, находящемуся в работе или до его старта (проконсультировать по смете от других строительных компаний).
                  </p>
                  <div className="flex items-center text-pink-500 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                    Подробнее
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
        </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-[3] transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-600/5 rounded-full -ml-12 -mb-12 group-hover:scale-[3] transition-transform duration-700" />
              </Link>

              {/* Дизайн проект */}
              <Link
                href="/design"
                className={`group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:rotate-1 ${servicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: servicesVisible ? '250ms' : '0ms' }}
              >
                <div className="p-8 relative z-10">
                  <div className="flex items-center mb-4">
                    <Ruler className="h-10 w-10 text-pink-500 mr-4 transform group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-2xl font-bold text-black group-hover:text-pink-500 transition-colors duration-300">
                      Дизайн проект
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Разработка индивидуального дизайн-проекта с 3D визуализацией, подбором материалов и мебели.
                  </p>
                  <div className="flex items-center text-pink-500 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                    Подробнее
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-[3] transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-600/5 rounded-full -ml-12 -mb-12 group-hover:scale-[3] transition-transform duration-700" />
              </Link>

              {/* Ремонт */}
              <Link
                href="/renovation"
                className={`group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-rotate-1 ${servicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: servicesVisible ? '400ms' : '0ms' }}
              >
                <div className="p-8 relative z-10">
                  <div className="flex items-center mb-4">
                    <Hammer className="h-10 w-10 text-pink-500 mr-4 transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-2xl font-bold text-black group-hover:text-pink-500 transition-colors duration-300">
                      Ремонт под ключ
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Полный спектр ремонтных работ — от косметического до капитального ремонта с авторским надзором.
                  </p>
                  <div className="flex items-center text-pink-500 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                    Подробнее
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-[3] transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-600/5 rounded-full -ml-12 -mb-12 group-hover:scale-[3] transition-transform duration-700" />
              </Link>

              {/* Разработка проектов */}
              <Link
                href="/other-services"
                className={`group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:rotate-1 ${servicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: servicesVisible ? '550ms' : '0ms' }}
              >
                <div className="p-8 relative z-10">
                  <div className="flex items-center mb-4">
                    <FileText className="h-10 w-10 text-pink-500 mr-4 transform group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-2xl font-bold text-black group-hover:text-pink-500 transition-colors duration-300">
                      Разработка проектов
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Поможем с разработкой проектов электрики, сантехники, вентиляции для согласований с УК или для повышения качества реализации объекта.
                  </p>
                  <div className="flex items-center text-pink-500 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                    Подробнее
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-[3] transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-600/5 rounded-full -ml-12 -mb-12 group-hover:scale-[3] transition-transform duration-700" />
              </Link>
            </div>
          </div>
        </section>

        <CTASection />
      </main>

      <Footer />
      </div>
    )
  }
