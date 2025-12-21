'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Video, Eye, EyeOff, Settings, Play, Pause } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface VideoStream {
  id: string
  name: string
  description: string
  url: string
  isActive: boolean
  isVisibleToClient: boolean
  createdAt: string
}

export default function ClientVideoPage() {
  const params = useParams()
  const { showToast } = useToast()
  
  const [streams, setStreams] = useState<VideoStream[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStream, setNewStream] = useState({
    name: '',
    description: '',
    url: ''
  })

  const clientId = params.id as string

  useEffect(() => {
    // Тестовые данные
    setTimeout(() => {
      setStreams([
        {
          id: '1',
          name: 'Главный вход',
          description: 'Камера у входа в здание',
          url: 'https://example.com/stream1',
          isActive: true,
          isVisibleToClient: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Рабочая зона',
          description: 'Обзор основной рабочей зоны',
          url: 'https://example.com/stream2',
          isActive: false,
          isVisibleToClient: false,
          createdAt: new Date().toISOString()
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const toggleVisibility = (streamId: string) => {
    setStreams(streams.map(stream => 
      stream.id === streamId 
        ? { ...stream, isVisibleToClient: !stream.isVisibleToClient }
        : stream
    ))
    showToast('success', 'Настройки видимости обновлены')
  }

  const handleAddStream = () => {
    if (!newStream.name.trim() || !newStream.url.trim()) {
      showToast('error', 'Заполните название и URL потока')
      return
    }

    const stream: VideoStream = {
      id: Date.now().toString(),
      name: newStream.name,
      description: newStream.description,
      url: newStream.url,
      isActive: true,
      isVisibleToClient: false,
      createdAt: new Date().toISOString()
    }

    setStreams([...streams, stream])
    setNewStream({ name: '', description: '', url: '' })
    setShowAddModal(false)
    showToast('success', 'Видеопоток добавлен')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка видеопотоков...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <h1 className="text-3xl font-bold text-gray-900">Видеонаблюдение</h1>
                <p className="text-gray-600 mt-1">Онлайн камеры с объекта</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Добавить камеру</span>
            </button>
          </div>
        </div>

        {streams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Камер пока нет</h3>
            <p className="text-gray-600 mb-6">Добавьте первую камеру видеонаблюдения</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Добавить камеру</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <div key={stream.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Превью видео */}
                <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                  <div className="text-white text-center">
                    <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Превью недоступно</p>
                  </div>
                  
                  {/* Статус активности */}
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                    stream.isActive
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {stream.isActive ? 'Онлайн' : 'Офлайн'}
                  </div>
                  
                  {/* Кнопка воспроизведения */}
                  <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all">
                    <Play className="h-16 w-16 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </button>
                </div>
                
                {/* Информация о камере */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{stream.name}</h3>
                      {stream.description && (
                        <p className="text-sm text-gray-600 mt-1">{stream.description}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleVisibility(stream.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        stream.isVisibleToClient
                          ? 'text-green-600 bg-green-50 hover:bg-green-100'
                          : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                      }`}
                      title={stream.isVisibleToClient ? 'Скрыть от клиента' : 'Показать клиенту'}
                    >
                      {stream.isVisibleToClient ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      Добавлена: {new Date(stream.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {stream.isVisibleToClient && (
                    <div className="mt-3 p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700">
                        ✓ Видна клиенту в кабинете
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Модальное окно добавления камеры */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Добавить камеру</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название камеры *
                  </label>
                  <input
                    type="text"
                    value={newStream.name}
                    onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Например: Главный вход"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <input
                    type="text"
                    value={newStream.description}
                    onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Краткое описание (необязательно)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL потока *
                  </label>
                  <input
                    type="url"
                    value={newStream.url}
                    onChange={(e) => setNewStream({ ...newStream, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="https://example.com/stream"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewStream({ name: '', description: '', url: '' })
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAddStream}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 