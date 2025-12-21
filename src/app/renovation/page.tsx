import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import ProjectCard from '@/components/website/ProjectCard'
import Link from 'next/link'
import { ArrowRight, User, FileText, Calculator, Megaphone, CalendarClock, Camera, Video, Receipt } from 'lucide-react'

export default function RenovationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Ремонт под ключ</h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
                Качественный ремонт любой сложности с гарантией и в срок
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-pink-500/50"
              >
                Рассчитать стоимость
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Этапы работы */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Как мы работаем
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { num: '01', title: 'Замеры и расчеты', desc: 'Выезжаем на объект, снимаем размеры, обсуждаем детали реализации, считаем смету' },
                { num: '02', title: 'Договор', desc: 'Согласуем с вами детальную смету, заключаем договор' },
                { num: '03', title: 'Ремонт', desc: 'Мы выполняем ремонт, а Вы следите за ним в личном кабинете клиента' },
                { num: '04', title: 'Сдача объекта', desc: 'Проводим сдачу-приемку выполненных работ. Празднуем и пьем шампанское!' }
              ].map((step, index) => (
                <div key={index} className="relative p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-lg transition-shadow duration-300">
                  <div className="text-6xl font-bold text-pink-500/20 mb-4">{step.num}</div>
                  <h3 className="text-xl font-bold mb-3 text-black">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Что такое личный кабинет клиента */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-black">
              Что такое личный кабинет клиента?
            </h2>
            
            {/* Общее описание */}
            <p className="text-xl text-gray-600 text-center mb-16 max-w-4xl mx-auto leading-relaxed">
              Личный кабинет клиента — это бесшовный инструмент, благодаря которому вы всегда в курсе происходящего на объекте 
              из единого окна, а не тысячи чатов
            </p>

            {/* Функционал */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { 
                  num: '01', 
                  title: 'Профиль', 
                  desc: 'Ваша карточка с контактными данными и информацией по объекту',
                  icon: User,
                  color: 'bg-pink-500'
                },
                { 
                  num: '02', 
                  title: 'Документация', 
                  desc: 'Тут будут хранится все ключевые документы по объекту (проектная документация, договора и прочее)',
                  icon: FileText,
                  color: 'bg-black'
                },
                { 
                  num: '03', 
                  title: 'Сметы', 
                  desc: 'Здесь хранятся уже согласованные сметы или сметы к предстоящему согласованию',
                  icon: Calculator,
                  color: 'bg-pink-500'
                },
                { 
                  num: '04', 
                  title: 'Новости с объекта', 
                  desc: 'Здесь можно найти актуальную информацию о ходе работ, предстоящие события и прочее',
                  icon: Megaphone,
                  color: 'bg-black'
                },
                { 
                  num: '05', 
                  title: 'График производства работ', 
                  desc: 'Следите за ходом выполнения работ с помощью интерактивного графика',
                  icon: CalendarClock,
                  color: 'bg-pink-500'
                },
                { 
                  num: '06', 
                  title: 'Фотографии с объекта', 
                  desc: 'Сюда мы загружаем фотографии выполненных работ по мере реализации объекта',
                  icon: Camera,
                  color: 'bg-black'
                },
                { 
                  num: '07', 
                  title: 'Видеонаблюдение за объектом', 
                  desc: 'Будьте в курсе происходящего на объекте в режиме онлайн',
                  icon: Video,
                  color: 'bg-pink-500'
                },
                { 
                  num: '08', 
                  title: 'Чеки', 
                  desc: 'Отгружаем все чеки по различным транзакциям',
                  icon: Receipt,
                  color: 'bg-black'
                }
              ].map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="bg-white p-6 rounded-2xl hover:shadow-xl transition-all duration-300">
                    <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-black">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                )
              })}
            </div>

            {/* Кнопка демо доступа */}
            <div className="text-center">
              <button 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-pink-500/50"
              >
                Демо доступ в кабинет клиента
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Попробуйте все возможности личного кабинета прямо сейчас
              </p>
            </div>
          </div>
        </section>

        {/* Примеры выполненных работ */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
              Примеры выполненных работ
            </h2>
            <div className="space-y-12">
              {/* Морской бриз */}
              <ProjectCard
                cardId="breeze"
                title="Морской бриз"
                area={48}
                class="comfort"
                logoImage="/images/renovation/Breeze_logo.png"
                photos={[
                  '/images/renovation/breeze_1.png',
                  '/images/renovation/Breeze_2.png',
                  '/images/renovation/Breeze_3.png',
                  '/images/renovation/Breeze_4.png',
                  '/images/renovation/Breeze_5.png',
                  '/images/renovation/Breeze_6.png',
                ]}
              />

              {/* Oud Wood */}
              <ProjectCard
                cardId="oudwood"
                title="Oud Wood"
                area={61}
                class="comfort"
                logoImage="/images/renovation/Outwood_logo.png"
                photos={[
                  '/images/renovation/Outwood_1.png',
                  '/images/renovation/Outwood_2.png',
                  '/images/renovation/Outwood_3.png',
                  '/images/renovation/Outwood_4.png',
                  '/images/renovation/Outwood_5.png',
                  '/images/renovation/Outwood_6.png',
                ]}
              />

              {/* Blanc de Blancs */}
              <ProjectCard
                cardId="bdb"
                title="Blanc de Blancs"
                area={60}
                class="comfort"
                logoImage="/images/renovation/Bdb_logo.png"
                photos={[
                  '/images/renovation/Bdb_1.png',
                  '/images/renovation/Bdb_2.png',
                  '/images/renovation/Bdb_3.png',
                  '/images/renovation/Bdb_4.png',
                  '/images/renovation/Bdb_5.png',
                  '/images/renovation/Bdb_6.jpg',
                ]}
              />

              {/* Yellowstone */}
              <ProjectCard
                cardId="yellowstone"
                title="Yellowstone"
                area={60}
                class="business"
                logoImage="/images/renovation/Yellowstone_logo.png"
                photos={[
                  '/images/renovation/Yellowstone_1.png',
                  '/images/renovation/Yellowstone_2.png',
                  '/images/renovation/Yellowstone_3.png',
                  '/images/renovation/Yellowstone_4.png',
                  '/images/renovation/Yellowstone_5.png',
                  '/images/renovation/Yellowstone_6.png',
                ]}
              />

              {/* Graphite Noir */}
              <ProjectCard
                cardId="gn"
                title="Graphite Noir"
                area={86}
                class="business"
                logoImage="/images/renovation/GN_logo.png"
                photos={[
                  '/images/renovation/GN_1.png',
                  '/images/renovation/GN_2.png',
                  '/images/renovation/GN_3.png',
                  '/images/renovation/GN_4.png',
                  '/images/renovation/GN_5.png',
                  '/images/renovation/GN_6.png',
                  '/images/renovation/GN_7.png',
                ]}
              />

              {/* Лунное серебро */}
              <ProjectCard
                cardId="moon"
                title="Лунное серебро"
                area={43}
                class="comfort"
                logoImage="/images/renovation/Moon_logo.png"
                photos={[
                  '/images/renovation/Moon_1.png',
                  '/images/renovation/Moon_2.png',
                  '/images/renovation/Moon_3.png',
                  '/images/renovation/Moon_4.png',
                  '/images/renovation/Moon_5.png',
                  '/images/renovation/Moon_6.png',
                ]}
              />

              {/* Oliva Verde */}
              <ProjectCard
                cardId="oliva"
                title="Oliva Verde"
                area={76}
                class="comfort"
                logoImage="/images/renovation/Oliva_logo.png"
                logoScale={1.1}
                photos={[
                  '/images/renovation/Oliva_1.png',
                  '/images/renovation/Oliva_2.png',
                  '/images/renovation/Oliva_3.png',
                  '/images/renovation/Oliva_4.png',
                  '/images/renovation/Oliva_5.png',
                  '/images/renovation/Oliva_6.png',
                  '/images/renovation/Oliva_7.png',
                  '/images/renovation/Oliva_8.png',
                ]}
              />

              {/* Черничные поля */}
              <ProjectCard
                cardId="bb"
                title="Черничные поля"
                area={51}
                class="comfort"
                logoImage="/images/renovation/BB_logo.png"
                photos={[
                  '/images/renovation/BB_1.png',
                  '/images/renovation/BB_2.png',
                  '/images/renovation/BB_3.png',
                  '/images/renovation/BB_4.png',
                  '/images/renovation/BB_5.png',
                  '/images/renovation/BB_6.png',
                ]}
              />

              {/* Облачные вершины */}
              <ProjectCard
                cardId="cloud"
                title="Облачные вершины"
                area={39}
                class="comfort"
                logoImage="/images/renovation/Cloud_logo.png"
                photos={[
                  '/images/renovation/Cloud_1.png',
                  '/images/renovation/Cloud_2.png',
                  '/images/renovation/Cloud_3.png',
                  '/images/renovation/Cloud_4.png',
                  '/images/renovation/Cloud_5.png',
                ]}
              />

              {/* Танцующие тени */}
              <ProjectCard
                cardId="shadow"
                title="Танцующие тени"
                area={121}
                class="business"
                logoImage="/images/renovation/Shadow_logo.png"
                photos={[
                  '/images/renovation/Shadow_1.jpg',
                  '/images/renovation/Shadow_2.jpg',
                  '/images/renovation/Shadow_3.jpg',
                  '/images/renovation/Shadow_4.jpg',
                  '/images/renovation/Shadow_5.jpg',
                  '/images/renovation/Shadow_6.jpg',
                  '/images/renovation/Shadow_7.jpg',
                  '/images/renovation/Shadow_8.jpg',
                  '/images/renovation/Shadow_9.jpg',
                  '/images/renovation/Shadow_10.jpg',
                  '/images/renovation/Shadow_11.jpg',
                  '/images/renovation/Shadow_12.jpg',
                ]}
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Начните ремонт прямо сейчас
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Оставьте заявку и получите бесплатный расчет стоимости ремонта
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-pink-500/50"
            >
              Рассчитать стоимость
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

