'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  User, 
  Building2, 
  Calendar, 
  Eye, 
  EyeOff, 
  Edit, 
  ArrowLeft,
  Calculator,
  Trash2
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'

interface Client {
  id: string
  name: string
}

interface Act {
  id: string
  title: string
  type: 'apartment' | 'rooms'
  category: string
  totalPrice: number
  showToClient: boolean
  isAct: boolean
  createdAt: string
  updatedAt: string
  client: Client
  creator: {
    id: string
    name: string
  }
}

export default function ActsPage() {
  const { session } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  const [acts, setActs] = useState<Act[]>([])
  const [filteredActs, setFilteredActs] = useState<Act[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [showOnlyVisible, setShowOnlyVisible] = useState(false)

  useEffect(() => {
    // Внешние дизайнеры не имеют доступа к актам
    if (session?.user?.role === 'DESIGNER' && session?.user?.designerType === 'EXTERNAL') {
      showToast('error', 'Доступ запрещен')
      router.push('/dashboard')
      return
    }
    
    fetchActs()
  }, [session])

  useEffect(() => {
    filterActs()
  }, [acts, searchQuery, selectedClient, categoryFilter, showOnlyVisible])

  const fetchActs = async () => {
    try {
      const response = await fetch('/api/acts')
      if (!response.ok) {
        throw new Error('Ошибка загрузки актов')
      }
      
      const data = await response.json()
      setActs(data.acts || [])
    } catch (error) {
      console.error('Ошибка загрузки актов:', error)
      showToast('error', 'Ошибка загрузки актов')
    } finally {
      setLoading(false)
    }
  }

  const filterActs = () => {
    let filtered = acts

    if (searchQuery) {
      filtered = filtered.filter(act => 
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.client.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedClient) {
      filtered = filtered.filter(act => act.client.id === selectedClient)
    }

    if (categoryFilter) {
      filtered = filtered.filter(act => act.category === categoryFilter)
    }

    if (showOnlyVisible) {
      filtered = filtered.filter(act => act.showToClient)
    }

    setFilteredActs(filtered)
  }

  const toggleVisibility = async (actId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/acts/${actId}/toggle-visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showToClient: !currentVisibility })
      })

      if (response.ok) {
        setActs(prev => prev.map(act => 
          act.id === actId 
            ? { ...act, showToClient: !currentVisibility }
            : act
        ))
        showToast('success', currentVisibility ? 'Акт скрыт от клиента' : 'Акт открыт для клиента')
      } else {
        throw new Error('Ошибка изменения видимости')
      }
    } catch (error) {
      showToast('error', 'Ошибка изменения видимости акта')
    }
  }

  const deleteAct = async (actId: string, title: string) => {
    if (!confirm(`Удалить акт "${title}"?`)) return

    try {
      const response = await fetch(`/api/acts/${actId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setActs(prev => prev.filter(act => act.id !== actId))
        showToast('success', 'Акт удален')
      } else {
        throw new Error('Ошибка удаления')
      }
    } catch (error) {
      showToast('error', 'Ошибка удаления акта')
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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Ремонт': 'bg-blue-100 text-blue-800',
      'Строительство': 'bg-green-100 text-green-800',
      'Дизайн': 'bg-purple-100 text-purple-800',
      'Черновая отделка': 'bg-orange-100 text-orange-800',
      'Чистовая отделка': 'bg-pink-100 text-pink-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const uniqueClients = Array.from(
    new Map(acts.map(a => [a.client.id, a.client])).values()
  )

  const uniqueCategories = Array.from(
    new Set(acts.map(a => a.category))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка актов...</p>
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
              href="/dashboard"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Назад к дашборду
            </Link>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Акты выполненных работ
              </h1>
              <p className="text-gray-600">
                Управление всеми актами в системе
              </p>
            </div>
            
            <Link
              href="/acts/new"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Создать акт
            </Link>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Фильтр по категории */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Все категории</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Фильтр видимости */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyVisible}
                onChange={(e) => setShowOnlyVisible(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Только видимые клиенту</span>
            </label>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Всего актов</p>
                <p className="text-2xl font-bold text-gray-900">{acts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Видны клиентам</p>
                <p className="text-2xl font-bold text-gray-900">
                  {acts.filter(a => a.showToClient).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Клиентов</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueClients.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Общая стоимость</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(acts.reduce((sum, a) => sum + a.totalPrice, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Список актов */}
        {filteredActs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {acts.length === 0 ? 'Нет актов' : 'Ничего не найдено'}
            </h3>
            <p className="text-gray-600 mb-4">
              {acts.length === 0 
                ? 'В системе пока нет созданных актов'
                : 'Попробуйте изменить параметры поиска'
              }
            </p>
            {acts.length === 0 && (
              <Link
                href="/acts/new"
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Создать первый акт
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActs.map((act) => (
              <div key={act.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/acts/${act.id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-green-600 transition-colors"
                      >
                        {act.title}
                      </Link>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(act.category)}`}>
                        {act.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        act.type === 'apartment' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {act.type === 'apartment' ? 'По квартире' : 'По помещениям'}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span>{act.client.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{act.creator.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Создан: {new Date(act.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(act.totalPrice)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        act.showToClient 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {act.showToClient ? (
                          <>
                            <Eye className="h-3 w-3" />
                            Виден клиенту
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Скрыт
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleVisibility(act.id, act.showToClient)}
                      className={`p-2 rounded-lg transition-colors ${
                        act.showToClient
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={act.showToClient ? 'Скрыть от клиента' : 'Показать клиенту'}
                    >
                      {act.showToClient ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                    <Link
                      href={`/acts/${act.id}/edit`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => deleteAct(act.id, act.title)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-5 w-5" />
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