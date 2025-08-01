'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  Calculator, 
  FileText, 
  Building2, 
  Download,
  ToggleLeft,
  ToggleRight,
  Calendar,
  User,
  Package
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'

interface Estimate {
  id: string
  title: string
  type: 'apartment' | 'rooms'
  category: string
  showToClient: boolean
  isAct?: boolean
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
  email?: string
  phone?: string
}

export default function ClientEstimatesPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useAuth()
  const { showToast } = useToast()
  
  const [client, setClient] = useState<Client | null>(null)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clientId = params.id as string

  useEffect(() => {
    if (clientId) {
      loadData()
    }
  }, [clientId])

  const loadData = async () => {
    try {
      // Загружаем данные клиента
      const clientResponse = await fetch(`/api/clients/${clientId}`)
      if (!clientResponse.ok) {
        throw new Error('Ошибка загрузки данных клиента')
      }
      const clientData = await clientResponse.json()
      setClient(clientData)

      // Загружаем сметы клиента
      const estimatesResponse = await fetch(`/api/estimates?clientId=${clientId}`)
      if (!estimatesResponse.ok) {
        throw new Error('Ошибка загрузки смет')
      }
      const estimatesData = await estimatesResponse.json()
      setEstimates(estimatesData.estimates || [])

    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const toggleClientVisibility = async (estimateId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/toggle-visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ showToClient: !currentValue })
      })

      if (!response.ok) {
        throw new Error('Ошибка изменения видимости')
      }

      // Обновляем локальное состояние
      setEstimates(prev => prev.map(estimate => 
        estimate.id === estimateId 
          ? { ...estimate, showToClient: !currentValue }
          : estimate
      ))

      showToast(
        'success',
        !currentValue ? 'Смета теперь видна клиенту' : 'Смета скрыта от клиента'
      )

    } catch (error) {
      console.error('Ошибка изменения видимости:', error)
      showToast('error', 'Ошибка изменения видимости сметы')
    }
  }

  const deleteEstimate = async (estimateId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту смету?')) {
      return
    }

    try {
      const response = await fetch(`/api/estimates/${estimateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Ошибка удаления сметы')
      }

      setEstimates(prev => prev.filter(estimate => estimate.id !== estimateId))
      showToast('success', 'Смета удалена')

    } catch (error) {
      console.error('Ошибка удаления сметы:', error)
      showToast('error', 'Ошибка удаления сметы')
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
          <p className="text-gray-600">Загрузка смет...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Ошибка</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Назад
          </button>
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
              href={`/clients/${clientId}`}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Назад к клиенту
            </Link>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Сметы и акты клиента: {client?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Управление сметами, актами и расчетами для клиента
              </p>
            </div>
            
            <div className="flex gap-3">
              <Link
                href={`/estimates/new?clientId=${clientId}`}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Создать смету
              </Link>
              
              <Link
                href={`/acts/new?clientId=${clientId}`}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Создать акт
              </Link>
            </div>
          </div>
        </div>

        {/* Список смет и актов */}
        {estimates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет смет и актов
            </h3>
            <p className="text-gray-600 mb-4">
              У этого клиента пока нет созданных смет и актов
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href={`/estimates/new?clientId=${clientId}`}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Создать смету
              </Link>
              
              <Link
                href={`/acts/new?clientId=${clientId}`}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Создать акт
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Сметы */}
            {estimates.filter(e => !e.isAct).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Сметы ({estimates.filter(e => !e.isAct).length})
                </h2>
                <div className="space-y-4">
                  {estimates.filter(e => !e.isAct).map((estimate) => (
                    <EstimateCard 
                      key={estimate.id}
                      estimate={estimate}
                      clientId={clientId}
                      onToggleVisibility={toggleClientVisibility}
                      onDelete={deleteEstimate}
                      getCategoryName={getCategoryName}
                      getCategoryColor={getCategoryColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Акты */}
            {estimates.filter(e => e.isAct).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-500" />
                  Акты ({estimates.filter(e => e.isAct).length})
                </h2>
                <div className="space-y-4">
                  {estimates.filter(e => e.isAct).map((estimate) => (
                    <EstimateCard 
                      key={estimate.id}
                      estimate={estimate}
                      clientId={clientId}
                      onToggleVisibility={toggleClientVisibility}
                      onDelete={deleteEstimate}
                      getCategoryName={getCategoryName}
                      getCategoryColor={getCategoryColor}
                      isAct={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Компонент карточки сметы/акта
interface EstimateCardProps {
  estimate: Estimate
  clientId: string
  onToggleVisibility: (id: string, current: boolean) => void
  onDelete: (id: string) => void
  getCategoryName: (category: string) => string
  getCategoryColor: (category: string) => string
  isAct?: boolean
}

function EstimateCard({ 
  estimate, 
  clientId, 
  onToggleVisibility, 
  onDelete, 
  getCategoryName, 
  getCategoryColor,
  isAct = false
}: EstimateCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${isAct ? 'border-green-500' : 'border-blue-500'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {estimate.title}
            </h3>
            {isAct && (
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                АКТ
              </span>
            )}
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
        
        <div className="flex items-center gap-2 ml-4">

          
          {/* Кнопки действий */}
          <Link
            href={isAct ? `/acts/${estimate.id}` : `/estimates/${estimate.id}`}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="Просмотр"
          >
            <Eye className="h-4 w-4" />
          </Link>
          
          <Link
            href={isAct 
              ? `/acts/${estimate.id}/edit?returnTo=${encodeURIComponent(`/clients/${clientId}/estimates`)}`
              : `/estimates/${estimate.id}/edit?returnTo=${encodeURIComponent(`/clients/${clientId}/estimates`)}`
            }
            className="p-2 text-gray-600 hover:text-green-600 transition-colors"
            title="Редактировать"
          >
            <Edit2 className="h-4 w-4" />
          </Link>
          
          <button
            onClick={() => onDelete(estimate.id)}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
            title="Удалить"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}