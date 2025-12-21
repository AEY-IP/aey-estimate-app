'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Template } from '@/types/template'

export default function TemplatesPage() {
  const { session } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateType, setNewTemplateType] = useState<'general' | 'room'>('general')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Проверка доступа
  useEffect(() => {
    if (!session?.isAuthenticated) {
      router.push('/')
      return
    }

    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      setTimeout(() => {
        showToast('error', 'У вас нет доступа к этой странице')
        router.push('/dashboard')
      }, 0)
      return
    }

    fetchTemplates()
  }, [session])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (!response.ok) {
        throw new Error('Ошибка загрузки шаблонов')
      }
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error)
      showToast('error', 'Ошибка загрузки шаблонов')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      showToast('error', 'Введите название шаблона')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          type: newTemplateType,
          description: newTemplateDescription.trim() || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка создания шаблона')
      }

      const newTemplate = await response.json()
      setTemplates(prev => [newTemplate, ...prev])
      
      // Очищаем форму и закрываем модальное окно
      setNewTemplateName('')
      setNewTemplateType('general')
      setNewTemplateDescription('')
      setShowCreateModal(false)
      
      showToast('success', 'Шаблон успешно создан')
    } catch (error: any) {
      console.error('Ошибка создания шаблона:', error)
      showToast('error', error.message || 'Ошибка создания шаблона')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      return
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка удаления шаблона')
      }

      setTemplates(prev => prev.filter(t => t.id !== templateId))
      showToast('success', 'Шаблон успешно удален')
    } catch (error: any) {
      console.error('Ошибка удаления шаблона:', error)
      showToast('error', error.message || 'Ошибка удаления шаблона')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const getWorksCount = (template: Template) => {
    return template.rooms.reduce((total, room) => total + room.works.length, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка шаблонов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок и кнопка создания */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Шаблоны смет</h1>
            <p className="text-gray-600 mt-2">
              Управление шаблонами для быстрого создания смет
            </p>
          </div>
          
          {session?.user.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + Создать шаблон
            </button>
          )}
        </div>

        {/* Список шаблонов */}
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Нет шаблонов</h3>
            <p className="text-gray-600 mb-6">
              Создайте первый шаблон для быстрого заполнения смет
            </p>
            {session?.user.role === 'ADMIN' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Создать шаблон
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.type === 'general' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {template.type === 'general' ? 'Общий' : 'Комната'}
                      </span>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Работ:</span>
                      <span className="font-medium">{getWorksCount(template)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Стоимость:</span>
                      <span className="font-medium">{formatPrice(template.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Создан:</span>
                      <span className="font-medium">
                        {new Date(template.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Автор:</span>
                      <span className="font-medium">{template.creator.name}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/templates/${template.id}/preview`)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Просмотр
                    </button>
                    
                    {session?.user.role === 'ADMIN' && (
                      <>
                        <button
                          onClick={() => router.push(`/templates/${template.id}/edit`)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Модальное окно создания шаблона */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Создать новый шаблон
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название шаблона *
                    </label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Например: Ремонт ванной комнаты"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип шаблона
                    </label>
                    <select
                      value={newTemplateType}
                      onChange={(e) => setNewTemplateType(e.target.value as 'general' | 'room')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">Общий</option>
                      <option value="room">Комната</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание (необязательно)
                    </label>
                    <textarea
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      placeholder="Краткое описание шаблона..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleCreateTemplate}
                    disabled={creating || !newTemplateName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Создание...' : 'Создать'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
