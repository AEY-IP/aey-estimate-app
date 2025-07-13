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
              <h1 className="text-3xl font-bold text-gray-900">Новости с объекта</h1>
              <p className="text-gray-600 mt-2">Актуальная информация о ходе работ</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* News Timeline */}
          <div className="space-y-6">
            {newsItems.map((item, index) => {
              const typeInfo = getNewsTypeInfo(item.type)
              return (
                <div key={item.id} className="card hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{typeInfo.icon}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.icon} {typeInfo.name}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {item.content}
                      </p>

                      {item.comment && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                          <div className="flex items-start">
                            <MessageCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-800 mb-1">Комментарий менеджера:</p>
                              <p className="text-blue-700 text-sm">{item.comment}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(item.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
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
            <div className="text-center py-12">
              <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Новостей пока нет
              </h3>
              <p className="text-gray-600">
                Новости о ходе работ появятся здесь
              </p>
            </div>
          )}

          {/* Info Block */}
          <div className="mt-12 card bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="flex items-start">
              <Newspaper className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">О новостях</h3>
                <p className="text-gray-700 leading-relaxed">
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