import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import Link from 'next/link'
import { ArrowRight, Sparkles, Ruler, Hammer, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero секция */}
        <section className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden">
          {/* Декоративные элементы */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Идеальный подрядчик для
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600">
                  вашего дома мечты
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Профессиональный дизайн интерьеров и качественный ремонт под ключ
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/design"
                  className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-pink-500/50 flex items-center justify-center group"
                >
                  Дизайн проект
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/renovation"
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm flex items-center justify-center"
                >
                  Ремонт под ключ
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Преимущества */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Почему выбирают нас
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Индивидуальный дизайн</h3>
                <p className="text-gray-600 leading-relaxed">
                  Создаем уникальные интерьеры, учитывая ваши пожелания и особенности помещения
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <Hammer className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Качественный ремонт</h3>
                <p className="text-gray-600 leading-relaxed">
                  Выполняем работы любой сложности с использованием современных материалов
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">Гарантия качества</h3>
                <p className="text-gray-600 leading-relaxed">
                  Предоставляем гарантию на все виды работ и используем проверенные материалы
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Услуги */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Наши услуги
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Дизайн проект */}
              <Link
                href="/design"
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <Ruler className="h-10 w-10 text-pink-500 mr-4" />
                    <h3 className="text-2xl font-bold text-black group-hover:text-pink-500 transition-colors">
                      Дизайн проект
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Разработка индивидуального дизайн-проекта с 3D визуализацией, подбором материалов и мебели
                  </p>
                  <div className="flex items-center text-pink-500 font-semibold group-hover:translate-x-2 transition-transform">
                    Подробнее
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              </Link>

              {/* Ремонт */}
              <Link
                href="/renovation"
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <Hammer className="h-10 w-10 text-pink-500 mr-4" />
                    <h3 className="text-2xl font-bold text-black group-hover:text-pink-500 transition-colors">
                      Ремонт под ключ
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Полный спектр ремонтных работ: от косметического до капитального ремонта с авторским надзором
                  </p>
                  <div className="flex items-center text-pink-500 font-semibold group-hover:translate-x-2 transition-transform">
                    Подробнее
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA секция */}
        <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Готовы начать свой проект?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Свяжитесь с нами для бесплатной консультации и расчета стоимости
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-pink-500/50"
              >
                Узнать стоимость
              </Link>
              <Link
                href="/app"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm"
              >
                Личный кабинет
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
