'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Search, 
  Calculator, 
  Calendar, 
  User,
  Copy,
  Building2,
  FileText
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'

interface EstimateForCopy {
  id: string
  title: string
  type: 'apartment' | 'rooms'
  category: string
  notes?: string
  createdAt: string
  updatedAt: string
  client: {
    id: string
    name: string
  }
  creator: {
    id: string
    name: string
  }
}

interface Client {
  id: string
  name: string
  estimates: EstimateForCopy[]
}

export default function CopyEstimatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { session } = useAuth()
  const { showToast } = useToast()
  
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateForCopy | null>(null)
  const [showNameModal, setShowNameModal] = useState(false)
  const [newEstimateName, setNewEstimateName] = useState('')
  const [copying, setCopying] = useState(false)

  const targetClientId = searchParams.get('clientId')

  useEffect(() => {
    loadEstimates()
  }, [])

  useEffect(() => {
    filterEstimates()
  }, [searchQuery, clients])

  const loadEstimates = async () => {
    try {
      const response = await fetch('/api/estimates/for-copy')
      if (!response.ok) {
        throw new Error('Ошибка загрузки смет')
      }
      
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Ошибка загрузки смет:', error)
      showToast('error', 'Ошибка загрузки смет')
    } finally {
      setLoading(false)
    }
  }

  const filterEstimates = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = clients.map(client => ({
      ...client,
      estimates: client.estimates.filter(estimate => 
        estimate.title.toLowerCase().includes(query) ||
        estimate.notes?.toLowerCase().includes(query)
      )
    })).filter(client => client.estimates.length > 0)

    setFilteredClients(filtered)
  }

  const handleEstimateSelect = (estimate: EstimateForCopy) => {
    setSelectedEstimate(estimate)
    setNewEstimateName(`Копия - ${estimate.title}`)
    setShowNameModal(true)
  }

  const handleCopyEstimate = async () => {
    if (!selectedEstimate || !newEstimateName.trim()) {
      showToast('error', 'Введите название новой сметы')
      return
    }

    setCopying(true)
    
    try {
      const response = await fetch(`/api/estimates/${selectedEstimate.id}/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newTitle: newEstimateName.trim(),
          targetClientId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка копирования сметы')
      }

      const result = await response.json()
      showToast('success', 'Смета успешно скопирована')
      
      // Перенаправляем на редактирование новой сметы
      router.push(`/estimates/${result.estimateId}/edit`)

    } catch (error) {
      console.error('Ошибка копирования сметы:', error)
      showToast('error', error instanceof Error ? error.message : 'Ошибка копирования сметы')
    } finally {
      setCopying(false)
    }
  }

  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      'main': 'Основная',
      'additional': 'Дополнительная',
      'optional': 'Опциональная'
    }
    return categories[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'main': 'bg-blue-100 text-blue-800',
      'additional': 'bg-green-100 text-green-800',
      'optional': 'bg-yellow-100 text-yellow-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка смет для копирования...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href={targetClientId ? `/clients/${targetClientId}/estimates` : '/estimates'}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Назад
            </Link>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Копировать смету
            </h1>
            <p className="text-gray-600 mt-1">
              Выберите смету для копирования
            </p>
          </div>
        </div>

        {/* Поиск */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию сметы..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Список смет по клиентам */}
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Сметы не найдены' : 'Нет доступных смет'}
            </h3>
            <p className="text-gray-600">
              {searchQuery 
                ? 'Попробуйте изменить поисковый запрос' 
                : 'У вас пока нет созданных смет для копирования'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredClients.map((client) => (
              <div key={client.id} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    {client.name} ({client.estimates.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {client.estimates.map((estimate) => (
                    <div key={estimate.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {estimate.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(estimate.category)}`}>
                              {getCategoryName(estimate.category)}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              estimate.type === 'apartment' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {estimate.type === 'apartment' ? 'Квартира' : 'Комнаты'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {estimate.creator.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(estimate.createdAt).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                          
                          {estimate.notes && (
                            <p className="text-gray-600 text-sm">
                              {estimate.notes}
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleEstimateSelect(estimate)}
                          className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Копировать
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно ввода названия */}
      {showNameModal && selectedEstimate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Название новой сметы
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Исходная смета: {selectedEstimate.title}
              </label>
              <input
                type="text"
                value={newEstimateName}
                onChange={(e) => setNewEstimateName(e.target.value)}
                placeholder="Введите название новой сметы"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNameModal(false)
                  setSelectedEstimate(null)
                  setNewEstimateName('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={copying}
              >
                Отмена
              </button>
              <button
                onClick={handleCopyEstimate}
                disabled={!newEstimateName.trim() || copying}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {copying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Копирование...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Создать копию
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
