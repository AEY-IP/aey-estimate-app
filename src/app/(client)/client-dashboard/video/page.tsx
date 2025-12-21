'use client'

import { ArrowLeft, Video, Settings, Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function VideoPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/client-dashboard"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Назад в Экран клиента"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Видеонаблюдение за объектом</h1>
              <p className="text-gray-600 mt-2">Онлайн наблюдение за объектом</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Development Card */}
          <div className="card text-center py-16 px-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            {/* Icon with Animation */}
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Video className="h-12 w-12 text-white" />
              </div>
              
              {/* Animated Settings Icon */}
              <div className="absolute -top-2 -right-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center animate-bounce">
                  <Settings className="h-4 w-4 text-white animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
              
              {/* Sparkles */}
              <div className="absolute -top-4 -left-4">
                <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -right-6">
                <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
            </div>

            {/* Content */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Раздел находится в разработке
            </h2>
            
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              Мы активно работаем над созданием современной системы видеонаблюдения для вашего объекта
            </p>

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6 mt-12 text-left">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Video className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">HD видео в реальном времени</h3>
                <p className="text-sm text-gray-600">
                  Качественная трансляция с возможностью просмотра в HD качестве
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Удаленное управление</h3>
                <p className="text-sm text-gray-600">
                  Возможность поворота камер и изменения ракурса просмотра
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Архив записей</h3>
                <p className="text-sm text-gray-600">
                  Сохранение важных моментов с возможностью просмотра истории
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-12">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                <Clock className="h-4 w-4 mr-2" />
                Ожидается запуск в ближайшее время
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 card bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Что будет доступно?</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  После завершения разработки вы сможете:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Наблюдать за ходом работ в режиме реального времени
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Просматривать записи за любой период времени
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Получать уведомления о важных этапах работ
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Общаться с рабочими через встроенный чат
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 