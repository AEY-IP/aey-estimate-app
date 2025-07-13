'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Calendar,
  User,
  Calculator,
  Eye,
  ArrowLeft,
  Package
} from 'lucide-react'

interface WorkBlock {
  id: string
  title: string
  items: Array<{
    id: string
    name: string
    unit: string
    quantity: number
    displayUnitPrice: number
    displayTotalPrice: number
  }>
  totalPrice: number
}

interface EstimateCache {
  worksData: WorkBlock[]
  materialsData: any[]
  totalWorksPrice: number
  totalMaterialsPrice: number
  grandTotal: number
  coefficientsInfo: {
    normal: number
    final: number
    global: number
    applied: any[]
  }
  estimate: {
    id: string
    title: string
    createdAt: string
    updatedAt: string
  }
}

interface ClientEstimate {
  id: string
  title: string
  type: 'apartment' | 'rooms'
  category: string
  showToClient: boolean
  isAct?: boolean
  totalPrice: number
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
  // Данные из кеша экспорта
  cache?: EstimateCache
}

interface ClientData {
  id: string
  name: string
}

export default function ClientEstimatesPage() {
  const [estimates, setEstimates] = useState<ClientEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchClientData()
  }, [])

  useEffect(() => {
    if (clientData) {
      fetchEstimates()
    }
  }, [clientData])

  const fetchClientData = async () => {
    try {
      const response = await fetch('/api/auth/client-me')
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/client-login')
          return
        }
        throw new Error('Ошибка загрузки данных клиента')
      }
      
      const data = await response.json()
      setClientData(data.client)
    } catch (error) {
      console.error('Ошибка загрузки данных клиента:', error)
      setError('Ошибка загрузки данных клиента')
    }
  }

  const fetchEstimates = async () => {
    if (!clientData) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/estimates?clientId=${clientData.id}`)
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки смет')
      }
      
      const data = await response.json()
      const estimateList = data.estimates || []
      
      // Кеш экспорта уже включен в основной ответ API
      setEstimates(estimateList)
    } catch (error) {
      console.error('Ошибка загрузки смет:', error)
      setError('Ошибка загрузки смет')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getCategoryBadgeColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'main': 'bg-blue-100 text-blue-800',
      'additional': 'bg-green-100 text-green-800',
      'optional': 'bg-yellow-100 text-yellow-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      'main': 'Основная',
      'additional': 'Дополнительная', 
      'optional': 'Опциональная',
    }
    return names[category] || category
  }



  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка смет...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-4"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* Навигация */}
      <div className="flex items-center mb-8">
        <Link href="/client-dashboard" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ваши сметы</h1>
          <p className="text-gray-600 mt-1">Просмотр и загрузка ваших смет</p>
        </div>
      </div>

      {/* Список смет */}
      {estimates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет смет</h3>
          <p className="text-gray-500">У вас пока нет доступных смет</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Сметы */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Сметы ({estimates.length})
            </h2>
              <div className="grid gap-6">
                {estimates.map((estimate) => {
                         const hasCache = estimate.cache
             const totalPrice = hasCache ? estimate.cache!.grandTotal : 0
             const worksPrice = hasCache ? estimate.cache!.totalWorksPrice : 0
             const materialsPrice = hasCache ? estimate.cache!.totalMaterialsPrice : 0
            
            return (
              <div key={estimate.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="h-6 w-6 text-primary-600" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {estimate.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeColor(estimate.category)}`}>
                            {getCategoryName(estimate.category)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {estimate.type === 'apartment' ? 'По квартире' : 'По помещениям'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {hasCache ? (
                      <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calculator className="h-4 w-4 mr-2" />
                            <span>Работы: {formatPrice(worksPrice)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Package className="h-4 w-4 mr-2" />
                            <span>Материалы: {formatPrice(materialsPrice)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            <span>Менеджер: {estimate.creator.name}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(estimate.updatedAt).toLocaleDateString('ru-RU')}</span>
                          </div>
                        </div>

                      </>
                    ) : (
                      <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Смета еще обрабатывается.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-primary-600">
                        Общая сумма: {formatPrice(estimate.totalPrice)}
                      </div>
                      
                      <div className="flex gap-2">
                        <Link
                          href={`/client-dashboard/estimates/${estimate.id}`}
                          className="btn-primary flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Просмотр
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
              </div>
            </div>
        </div>
      )}
    </div>
  )
} 