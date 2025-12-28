import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import CTASection from '@/components/website/CTASection'
import { Shield, Target, Zap, Sparkles } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero с тезисами */}
        <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Заголовок */}
            <h1 className="text-4xl md:text-6xl font-bold mb-16 text-center">О нас</h1>
            
            {/* Три тезиса */}
            <div className="max-w-6xl mx-auto space-y-12 mt-16">
              {/* Тезис 1 - слева */}
              <div className="relative">
                <div className="md:pr-16">
                  <div className="w-16 h-1 bg-pink-500 mb-4"></div>
                  <p className="text-base md:text-xl text-gray-200 leading-relaxed font-light">
                    Команда профильных специалистов, с экспертизой в строительстве и ИТ. В своей работе мы применяем <span className="text-pink-500 font-bold">лучшие практики</span> крупнейших застройщиков <span className="text-pink-500 font-bold">для розничных клиентов</span>
                  </p>
                </div>
                <div className="absolute -left-4 top-0 w-2 h-full bg-gradient-to-b from-pink-500/30 to-transparent hidden md:block"></div>
              </div>

              {/* Тезис 2 - справа */}
              <div className="relative">
                <div className="md:pl-16 md:ml-auto md:max-w-4xl">
                  <div className="w-16 h-1 bg-pink-500 mb-4 md:ml-auto"></div>
                  <p className="text-base md:text-xl text-gray-200 leading-relaxed font-light md:text-right">
                    В основе подхода лежит <span className="text-pink-500 font-bold">цифровая система планирования</span>, которая позволяет не только <span className="text-pink-500 font-bold">уложиться в срок</span>, но и спланировать ресурсы <span className="text-pink-500 font-bold">без потерь</span>
                  </p>
                </div>
                <div className="absolute -right-4 top-0 w-2 h-full bg-gradient-to-b from-pink-500/30 to-transparent hidden md:block"></div>
              </div>

              {/* Тезис 3 - слева */}
              <div className="relative">
                <div className="md:pr-16">
                  <div className="w-16 h-1 bg-pink-500 mb-4"></div>
                  <p className="text-base md:text-xl text-gray-200 leading-relaxed font-light">
                    Человеческий подход при помощи цифровых решений. Ремонт это не сложно, долго, страшно и непонятно, а <span className="text-pink-500 font-bold">быстро, четко, компонентно</span>
                  </p>
                </div>
                <div className="absolute -left-4 top-0 w-2 h-full bg-gradient-to-b from-pink-500/30 to-transparent hidden md:block"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Идеальный подрядчик - это */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Заголовок */}
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-black">
              Идеальный подрядчик - это:
            </h2>

            {/* Три блока */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Блок 1: Новый подход на рынке */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300">
                <h3 className="text-2xl font-bold mb-6 text-black">
                  Новый подход на рынке
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold text-xl flex-shrink-0 mt-1">&lt; / &gt;</span>
                    <p className="text-gray-700 leading-relaxed">
                      Просчитываем все сразу, а не кратно увеличиваем смету за счет доп. работ по ходу ремонта
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold text-xl flex-shrink-0 mt-1">&lt; / &gt;</span>
                    <p className="text-gray-700 leading-relaxed">
                      Мотивация бригады завязана не на конечной стоимости, а на скорости и качестве
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold text-xl flex-shrink-0 mt-1">&lt; / &gt;</span>
                    <p className="text-gray-700 leading-relaxed">
                      Постоянно улучшаем процессы. Используем принципы машинного обучения для оптимизации и улучшения работы
                    </p>
                  </div>
                </div>
              </div>

              {/* Блок 2: Работа с профессионалами */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300">
                <h3 className="text-2xl font-bold mb-6 text-black">
                  Работа с профессионалами
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold text-xl flex-shrink-0 mt-1">&lt; / &gt;</span>
                    <p className="text-gray-700 leading-relaxed">
                      Погружаем мастеров и прорабов в новые процессы
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold text-xl flex-shrink-0 mt-1">&lt; / &gt;</span>
                    <p className="text-gray-700 leading-relaxed">
                      Мы работаем над созданием продукта полного цикла. Постоянно расширяем список партнеров и услуг
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold text-xl flex-shrink-0 mt-1">&lt; / &gt;</span>
                    <p className="text-gray-700 leading-relaxed">
                      Мы придерживаемся клиентоцентричной модели ведения бизнеса
                    </p>
                  </div>
                </div>
              </div>

              {/* Блок 3: Мониторинг результатов */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300">
                <h3 className="text-2xl font-bold mb-6 text-black">
                  Мониторинг результатов
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold text-xl flex-shrink-0 mt-1">&lt; / &gt;</span>
                    <p className="text-gray-700 leading-relaxed">
                      Всегда стараемся отцифровывать результат и показывать его нашим клиентам
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold text-xl flex-shrink-0 mt-1">&lt; / &gt;</span>
                    <p className="text-gray-700 leading-relaxed">
                      Разработали и продолжаем беспрерывно улучшать собственный продукт по планированию ремонта
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold text-xl flex-shrink-0 mt-1">&lt; / &gt;</span>
                    <p className="text-gray-700 leading-relaxed">
                      Всегда будь в курсе о том, что происходит на объекте в личном кабинете клиента
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ценности */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Наши ценности
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-black">Честность</h3>
                <p className="text-gray-600 leading-relaxed">
                  Мы за прозрачную коммуникацию без скрытых условий и заведомых занижений стоимости. Считаем всё и сразу.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
                  <Target className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-black">Точность</h3>
                <p className="text-gray-600 leading-relaxed">
                  Мы очень любим грамотное планирование, потому разработали собственное решение, которое позволяет нам меньше ошибаться.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-black">Трудолюбие</h3>
                <p className="text-gray-600 leading-relaxed">
                  Двигаемся только вперед, каждый день дорабатываем решения, улучшаем процессы и придумываем что-то новое.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-black">Революционность</h3>
                <p className="text-gray-600 leading-relaxed">
                  Существующие решения признаем доисторическими, направленными на «дойку» клиентов. Нам это очень не нравится.
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

