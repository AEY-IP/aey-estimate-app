'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Newspaper, Calendar, Edit2, Trash2, Save, X } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'

interface NewsItem {
  id: string
  title: string
  content: string
  comment?: string
  type: 'work' | 'materials' | 'admin' | 'other'
  createdAt: string
}

export default function ClientNewsPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useAuth()
  const { showToast } = useToast()
  
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingNews, setIsAddingNews] = useState(false)
  const [newNewsItem, setNewNewsItem] = useState({
    title: '',
    content: '',
    comment: '',
    type: 'other'
  })

  const clientId = params.id as string

  useEffect(() => {
    loadNews()
  }, [clientId])

  const loadNews = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/news`)
      if (response.ok) {
        const data = await response.json()
        setNews(data)
      } else {
        showToast('error', 'Ошибка загрузки новостей')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNews = async () => {
    if (!newNewsItem.title.trim() || !newNewsItem.content.trim()) {
      showToast('error', 'Заполните заголовок и содержание')
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNewsItem),
      })

      if (response.ok) {
        showToast('success', 'Новость добавлена')
        setNewNewsItem({ title: '', content: '', comment: '', type: 'other' })
        setIsAddingNews(false)
        loadNews()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка добавления новости')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  const handleDeleteNews = async (newsId: string, title: string) => {
    if (!confirm(`Удалить новость "${title}"?`)) return

    try {
      const response = await fetch(`/api/clients/${clientId}/news/${newsId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Новость удалена')
        loadNews()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка удаления новости')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка новостей...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Шапка */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href={`/clients/${clientId}`}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Новости с объекта</h1>
                <p className="text-gray-600 mt-1">Информирование клиента о ходе работ</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsAddingNews(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Добавить новость</span>
            </button>
          </div>
        </div>

        {/* Форма добавления новости */}
        {isAddingNews && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Добавить новость</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Заголовок *
                </label>
                <input
                  type="text"
                  value={newNewsItem.title}
                  onChange={(e) => setNewNewsItem({ ...newNewsItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Введите заголовок новости"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип новости
                </label>
                <select
                  value={newNewsItem.type}
                  onChange={(e) => setNewNewsItem({ ...newNewsItem, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="work">🔨 Работы</option>
                  <option value="materials">📦 Материалы</option>
                  <option value="admin">📋 Административный процесс</option>
                  <option value="other">📝 Прочее</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Содержание *
                </label>
                <textarea
                  value={newNewsItem.content}
                  onChange={(e) => setNewNewsItem({ ...newNewsItem, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={4}
                  placeholder="Опишите что происходит на объекте"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Комментарий (необязательно)
                </label>
                <input
                  type="text"
                  value={newNewsItem.comment}
                  onChange={(e) => setNewNewsItem({ ...newNewsItem, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Дополнительный комментарий"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleAddNews}
                className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Сохранить</span>
              </button>
              <button
                onClick={() => {
                  setIsAddingNews(false)
                  setNewNewsItem({ title: '', content: '', comment: '', type: 'other' })
                }}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Отмена</span>
              </button>
            </div>
          </div>
        )}

        {/* Список новостей */}
        {news.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Newspaper className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Новостей пока нет</h3>
            <p className="text-gray-600 mb-6">Добавьте первую новость о ходе работ</p>
            <button
              onClick={() => setIsAddingNews(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Добавить новость</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => {
              const typeInfo = getNewsTypeInfo(item.type)
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.icon} {typeInfo.name}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed">{item.content}</p>
                      
                      {item.comment && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <p className="text-gray-600 text-sm">
                            💬 {item.comment}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNews(item.id, item.title)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить новость"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 