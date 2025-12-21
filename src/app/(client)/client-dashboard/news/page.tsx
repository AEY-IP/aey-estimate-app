'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Newspaper, Calendar, User, MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface NewsItem {
  id: string
  title: string
  content: string
  comment?: string
  type: string
  createdAt: string
}

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/client/news')
      
      if (response.ok) {
        const data = await response.json()
        setNewsItems(data.news || [])
      } else {
        setError('Ошибка загрузки новостей')
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setError('Ошибка сети')
    } finally {
      setIsLoading(false)
    }
  }

  // Получение информации о типе новости
  const getNewsTypeInfo = (type: string) => {
    switch (type) {
      case 'work':
        return { name: 'Работы', icon: '🔨', color: 'bg-blue-100 text-blue-800' }
      case 'materials':
        return { name: 'Материалы', icon: '📦', color: 'bg-green-100 text-green-800' }
      case 'admin':
        return { name: 'Административный процесс', icon: '📋', color: 'bg-purple-100 text-purple-800' }
      case 'other':
      default:
        return { name: 'Прочее', icon: '📝', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка новостей...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              href="/client-dashboard"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Назад в Экран клиента"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Новости с объекта</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Актуальная информация о ходе работ</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-red-700 text-sm sm:text-base">{error}</p>
            </div>
          )}

          {/* News Timeline */}
          <div className="space-y-4 sm:space-y-6">
            {newsItems.map((item, index) => {
              const typeInfo = getNewsTypeInfo(item.type)
              return (
                <div key={item.id} className="card hover:shadow-lg transition-shadow duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 self-start">
                      <span className="text-lg sm:text-xl">{typeInfo.icon}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                          {item.title}
                        </h3>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color} self-start sm:self-auto`}>
                          {typeInfo.icon} {typeInfo.name}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
                        {item.content}
                      </p>

                      {item.comment && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                            <MessageCircle className="h-4 w-4 text-blue-600 flex-shrink-0 sm:mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1">Комментарий менеджера:</p>
                              <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">{item.comment}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {formatDate(item.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Менеджер проекта
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty State */}
          {!isLoading && newsItems.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <Newspaper className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Новостей пока нет
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Новости о ходе работ появятся здесь
              </p>
            </div>
          )}

          {/* Info Block */}
          <div className="mt-8 sm:mt-12 card bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 sm:mt-1" />
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">О новостях</h3>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  Здесь ваш менеджер публикует актуальную информацию о ходе работ на объекте. 
                  Вы будете получать уведомления о важных этапах, доставке материалов и других 
                  значимых событиях проекта.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 