'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Search,
  Calendar,
  User,
  Building2
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'

interface Estimate {
  id: string
  title: string
  type: 'apartment' | 'rooms'
  category: string
  totalPrice: number
  createdAt: string
  client: {
    id: string
    name: string
  }
  creator: {
    id: string
    name: string
  }
}

export default function NewActPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session } = useAuth()
  const { showToast } = useToast()
  
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<string>('')

  const clientId = searchParams.get('clientId')

  useEffect(() => {
    fetchEstimates()
  }, [])

  useEffect(() => {
    filterEstimates()
  }, [estimates, searchQuery, selectedClient])

  const fetchEstimates = async () => {
    try {
      // Добавляем параметр onlyEstimates=true чтобы получить только сметы, не акты
      const url = clientId 
        ? `/api/estimates?clientId=${clientId}&onlyEstimates=true` 
        : '/api/estimates?onlyEstimates=true'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки смет')
      }
      
      const data = await response.json()
      setEstimates(data.estimates || [])
    } catch (error) {
      console.error('Ошибка загрузки смет:', error)
      showToast('error', 'Ошибка загрузки смет')
    } finally {
      setLoading(false)
    }
  }

  const filterEstimates = () => {
    let filtered = estimates

    if (searchQuery) {
      filtered = filtered.filter(estimate => 
        estimate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        estimate.client.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedClient) {
      filtered = filtered.filter(estimate => estimate.client.id === selectedClient)
    }

    setFilteredEstimates(filtered)
  }

  const createActFromEstimate = async (estimateId: string) => {
    try {
      setCreating(estimateId)
      
      const response = await fetch('/api/acts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estimateId })
      })

      if (!response.ok) {
        throw new Error('Ошибка создания акта')
      }

      const data = await response.json()
      showToast('success', 'Акт успешно создан')
      
      // Перенаправляем на страницу редактирования акта
      router.push(`/acts/${data.act.id}/edit`)

    } catch (error) {
      console.error('Ошибка создания акта:', error)
      showToast('error', 'Ошибка создания акта')
    } finally {
      setCreating(null)
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Получаем уникальных клиентов для фильтра
  const uniqueClients = estimates.reduce((acc, estimate) => {
    if (!acc.find(client => client.id === estimate.client.id)) {
      acc.push(estimate.client)
    }
    return acc
  }, [] as Array<{ id: string; name: string }>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка смет...</p>
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
              href="/clients"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Назад к клиентам
            </Link>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Создание акта
            </h1>
            <p className="text-gray-600">
              Выберите смету для создания акта на ее основе
            </p>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Поиск */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Поиск по названию или клиенту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Фильтр по клиенту */}
            {!clientId && (
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Все клиенты</option>
                {uniqueClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Список смет */}
        {filteredEstimates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет доступных смет
            </h3>
            <p className="text-gray-600 mb-4">
              {estimates.length === 0 
                ? 'В системе пока нет созданных смет'
                : 'Нет смет, соответствующих вашему поиску'
              }
            </p>
            <Link
              href="/dashboard/clients"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Перейти к клиентам
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEstimates.map((estimate) => (
              <div key={estimate.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
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
                        <Building2 className="h-4 w-4" />
                        {estimate.client.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {estimate.creator.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(estimate.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    
                    <div className="text-lg font-semibold text-green-600">
                      {formatPrice(estimate.totalPrice)}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <button
                      onClick={() => createActFromEstimate(estimate.id)}
                      disabled={creating === estimate.id}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating === estimate.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Создание...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Создать акт
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 