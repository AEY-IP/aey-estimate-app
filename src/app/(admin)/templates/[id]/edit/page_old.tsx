'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Template } from '@/types/template'
import NumericInput from '@/components/NumericInput'

interface Props {
  params: { id: string }
}

interface ApiWorkItem {
  id: string
  name: string
  unit: string
  basePrice: number
  category: string
  description?: string
  parameterId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  parameter?: any
}

export default function EditTemplatePage({ params }: Props) {
  const { session } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [template, setTemplate] = useState<Template | null>(null)
  const [availableWorks, setAvailableWorks] = useState<ApiWorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Состояния для добавления работ
  const [showAddWorkModal, setShowAddWorkModal] = useState(false)
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [workQuantity, setWorkQuantity] = useState('1')
  const [workDescription, setWorkDescription] = useState('')
  const [addingWork, setAddingWork] = useState(false)

  // Проверка доступа и загрузка данных
  useEffect(() => {
    if (!session?.isAuthenticated) {
      router.push('/')
      return
    }

    if (session.user.role !== 'ADMIN') {
      setTimeout(() => {
        showToast('error', 'У вас нет доступа к редактированию шаблонов')
        router.push('/templates')
      }, 0)
      return
    }

    fetchTemplate()
    fetchAvailableWorks()
  }, [session, params.id])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setTimeout(() => {
            showToast('error', 'Шаблон не найден')
            router.push('/templates')
          }, 0)
          return
        }
        throw new Error('Ошибка загрузки шаблона')
      }
      const data = await response.json()
      setTemplate(data)
    } catch (error) {
      console.error('Ошибка загрузки шаблона:', error)
      setTimeout(() => {
        showToast('error', 'Ошибка загрузки шаблона')
        router.push('/templates')
      }, 0)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableWorks = async () => {
    try {
      const response = await fetch('/api/works')
      if (response.ok) {
        const data = await response.json()
        setAvailableWorks(data.works || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки работ:', error)
      setAvailableWorks([])
    }
  }

  const handleAddWork = async () => {
    if (!selectedWorkId || !workQuantity) {
      showToast('error', 'Выберите работу и укажите количество')
      return
    }

    if (!template?.rooms[0]) {
      showToast('error', 'Ошибка: помещение не найдено')
      return
    }

    setAddingWork(true)
    try {
      const response = await fetch(`/api/templates/${params.id}/works`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: template.rooms[0].id,
          workItemId: selectedWorkId,
          quantity: parseFloat(workQuantity),
          description: workDescription.trim() || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка добавления работы')
      }

      // Перезагружаем шаблон
      await fetchTemplate()
      
      // Очищаем форму
      setSelectedWorkId('')
      setWorkQuantity('1')
      setWorkDescription('')
      setShowAddWorkModal(false)
      
      showToast('success', 'Работа успешно добавлена')
    } catch (error: any) {
      console.error('Ошибка добавления работы:', error)
      showToast('error', error.message || 'Ошибка добавления работы')
    } finally {
      setAddingWork(false)
    }
  }

  const handleDeleteWork = async (workId: string) => {
    if (!confirm('Удалить эту работу из шаблона?')) {
      return
    }

    try {
      const response = await fetch(`/api/templates/${params.id}/works/${workId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка удаления работы')
      }

      // Перезагружаем шаблон
      await fetchTemplate()
      showToast('success', 'Работа удалена')
    } catch (error: any) {
      console.error('Ошибка удаления работы:', error)
      showToast('error', error.message || 'Ошибка удаления работы')
    }
  }

  const handleUpdateWorkQuantity = async (workId: string, newQuantity: number) => {
    try {
      const response = await fetch(`/api/templates/${params.id}/works/${workId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quantity: newQuantity
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка обновления работы')
      }

      // Перезагружаем шаблон
      await fetchTemplate()
    } catch (error: any) {
      console.error('Ошибка обновления работы:', error)
      showToast('error', error.message || 'Ошибка обновления работы')
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

  // Группировка работ по блокам
  const getWorksByBlocks = () => {
    if (!template?.rooms[0]?.works) return {}
    
    const worksByBlocks: { [key: string]: any[] } = {}
    
    template.rooms[0].works.forEach(work => {
      const blockTitle = work.blockTitle || 'Дополнительные работы'
      if (!worksByBlocks[blockTitle]) {
        worksByBlocks[blockTitle] = []
      }
      worksByBlocks[blockTitle].push(work)
    })
    
    return worksByBlocks
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка шаблона...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Шаблон не найден</p>
        </div>
      </div>
    )
  }

  const worksByBlocks = getWorksByBlocks()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => router.push('/templates')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Назад к списку
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                template.type === 'general' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {template.type === 'general' ? 'Общий' : 'Комната'}
              </span>
              <span className="text-gray-500 text-sm">
                Общая стоимость: {formatPrice(template.totalPrice)}
              </span>
            </div>
            {template.description && (
              <p className="text-gray-600 mt-2">{template.description}</p>
            )}
          </div>

          <button
            onClick={() => setShowAddWorkModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Добавить работу
          </button>
        </div>

        {/* Список работ по блокам */}
        <div className="space-y-8">
          {Object.keys(worksByBlocks).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-400 text-6xl mb-4">🔧</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Нет работ в шаблоне</h3>
              <p className="text-gray-600 mb-6">
                Добавьте работы, чтобы заполнить шаблон
              </p>
              <button
                onClick={() => setShowAddWorkModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Добавить первую работу
              </button>
            </div>
          ) : (
            Object.entries(worksByBlocks).map(([blockTitle, works]) => (
              <div key={blockTitle} className="bg-white rounded-lg border border-gray-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">{blockTitle}</h2>
                  <p className="text-sm text-gray-600">
                    Работ: {works.length} • Стоимость: {formatPrice(works.reduce((sum, work) => sum + work.totalPrice, 0))}
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {works.map((work) => (
                      <div key={work.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {work.workItem?.name || work.manualWorkName}
                              </h3>
                              {work.description && (
                                <p className="text-sm text-gray-600 mt-1">{work.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>
                                  {formatPrice(work.price)} за {work.workItem?.unit || work.manualWorkUnit}
                                </span>
                                <span>•</span>
                                <div className="flex items-center gap-2">
                                  <span>Количество:</span>
                                  <NumericInput
                                    value={work.quantity}
                                    onChange={(newQuantity) => {
                                      if (newQuantity > 0) {
                                        handleUpdateWorkQuantity(work.id, newQuantity)
                                      }
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min={0}
                                    step={0.1}
                                    allowDecimals={true}
                                  />
                                  <span>{work.workItem?.unit || work.manualWorkUnit}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {formatPrice(work.totalPrice)}
                              </div>
                              <button
                                onClick={() => handleDeleteWork(work.id)}
                                className="text-red-600 hover:text-red-800 mt-2"
                                title="Удалить работу"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Модальное окно добавления работы */}
        {showAddWorkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Добавить работу в шаблон
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Выберите работу *
                    </label>
                    <select
                      value={selectedWorkId}
                      onChange={(e) => setSelectedWorkId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Выберите работу --</option>
                      {(() => {
                        const worksByCategory: { [key: string]: ApiWorkItem[] } = {}
                        if (Array.isArray(availableWorks)) {
                          availableWorks.forEach(work => {
                            const category = work.category
                            if (!worksByCategory[category]) {
                              worksByCategory[category] = []
                            }
                            worksByCategory[category].push(work)
                          })
                        }

                        return Object.entries(worksByCategory).map(([category, works]) => (
                          <optgroup key={category} label={category}>
                            {works.map(work => (
                              <option key={work.id} value={work.id}>
                                {work.name} ({formatPrice(work.basePrice)} за {work.unit})
                              </option>
                            ))}
                          </optgroup>
                        ))
                      })()}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Количество *
                    </label>
                    <input
                      type="number"
                      value={workQuantity}
                      onChange={(e) => setWorkQuantity(e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание (необязательно)
                    </label>
                    <textarea
                      value={workDescription}
                      onChange={(e) => setWorkDescription(e.target.value)}
                      placeholder="Дополнительные примечания..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddWorkModal(false)}
                    disabled={addingWork}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAddWork}
                    disabled={addingWork || !selectedWorkId || !workQuantity}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingWork ? 'Добавление...' : 'Добавить'}
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
