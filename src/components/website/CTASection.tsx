import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
      <div className="absolute top-10 left-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">
          Готовы начать свой проект?
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pricing"
            className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-xl shadow-pink-500/50"
          >
            Узнать стоимость
          </Link>
          <Link
            href="/app"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm transform hover:scale-110 hover:-translate-y-1"
          >
            Личный кабинет
          </Link>
        </div>
      </div>
    </section>
  )
}

