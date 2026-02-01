import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* О компании */}
          <div>
            <div className="mb-4">
              <img 
                src="/images/icons/Main_logo.png?v=2" 
                alt="Идеальный подрядчик" 
                className="h-12 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Профессиональные услуги по дизайну интерьеров и ремонту помещений любой сложности
            </p>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-pink-500">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-pink-500 transition-colors">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/design" className="text-gray-400 hover:text-pink-500 transition-colors">
                  Дизайн-проект
                </Link>
              </li>
              <li>
                <Link href="/renovation" className="text-gray-400 hover:text-pink-500 transition-colors">
                  Ремонт
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-400 hover:text-pink-500 transition-colors">
                  Цены
                </Link>
              </li>
              <li>
                <Link href="/app" className="text-gray-400 hover:text-pink-500 transition-colors">
                  Личный кабинет
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-pink-500">Контакты</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-gray-400">
                <Phone className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                <a href="tel:+79932903098" className="hover:text-pink-500 transition-colors">
                  +7 (993) 290-30-98
                </a>
              </li>
              <li className="flex items-start space-x-3 text-gray-400">
                <Mail className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                <a href="mailto:idealpodryad@gmail.com" className="hover:text-pink-500 transition-colors">
                  idealpodryad@gmail.com
                </a>
              </li>
              <li className="flex items-start space-x-3 text-gray-400">
                <MapPin className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                <span>Москва, Россия</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Идеальный подрядчик. Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}

