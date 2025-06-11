'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Eye, Edit2, Trash2, Calculator, FileText, Building2, Phone, Mail, MapPin, User, Calendar, Star } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'
import { Client } from '@/types/client'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useAuth()
  const { showToast } = useToast()
  
  const [client, setClient] = useState<Client | null>(null)
  const [estimates, setEstimates] = useState<any[]>([])
  const [coefficients, setCoefficients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [estimatesLoading, setEstimatesLoading] = useState(true)

  const clientId = params.id as string

  // Загрузка клиента
  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      } else if (response.status === 404) {
        showToast('error', 'Клиент не найден')
        router.push('/clients')
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка загрузки клиента')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  // Загрузка смет клиента
  const fetchEstimates = async () => {
    try {
      const response = await fetch(`/api/estimates?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setEstimates(data)
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка загрузки смет')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    } finally {
      setEstimatesLoading(false)
    }
  }

  // Загрузка коэффициентов
  const fetchCoefficients = async () => {
    try {
      const response = await fetch('/api/coefficients')
      if (response.ok) {
        const data = await response.json()
        setCoefficients(data.coefficients || []) // API возвращает объект с полем coefficients
      }
    } catch (error) {
      console.error('Ошибка загрузки коэффициентов:', error)
    }
  }

  useEffect(() => {
    fetchClient()
    fetchEstimates()
    fetchCoefficients()
  }, [clientId])

  // Удаление сметы
  const handleDeleteEstimate = async (estimateId: string, estimateTitle: string) => {
    if (!confirm(`Вы уверены, что хотите удалить смету "${estimateTitle}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/estimates/${estimateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Смета успешно удалена')
        // Перезагружаем список смет
        fetchEstimates()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка удаления сметы')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }



  const formatCategory = (category: string) => {
    const categoryMap = {
      main: { text: 'Основная', color: 'bg-purple-100 text-purple-700', icon: Star },
      additional: { text: 'Доп. работы', color: 'bg-orange-100 text-orange-700', icon: Plus }
    }
    return categoryMap[category as keyof typeof categoryMap] || categoryMap.main
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB', 
      minimumFractionDigits: 0 
    }).format(price)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Загрузка клиента...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="text-center py-20">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Клиент не найден</h3>
          <p className="text-gray-600 mb-6">Возможно, клиент был удален или у вас нет доступа</p>
          <Link href="/clients" className="btn-primary">
            Вернуться к списку
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link 
            href="/clients"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600 mt-1">Информация о клиенте и его сметы</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href={`/clients/${clientId}/edit`}
            className="btn-secondary flex items-center"
          >
            <Edit2 className="h-5 w-5 mr-2" />
            Редактировать
          </Link>
          <Link
            href={`/estimates/new?clientId=${clientId}`}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Создать смету
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Информация о клиенте */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mr-4">
            <Building2 className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Информация о клиенте</h2>
                {client.contractNumber && (
                  <p className="text-sm text-gray-500">№ {client.contractNumber}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {client.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Телефон</p>
                    <p className="text-gray-600">{client.phone}</p>
                  </div>
                </div>
              )}

              {client.email && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">{client.email}</p>
                  </div>
                </div>
              )}

              {client.address && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Адрес</p>
                    <p className="text-gray-600">{client.address}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Дата создания</p>
                  <p className="text-gray-600">
                    {new Date(client.createdAt).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {client.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="font-medium text-gray-900 mb-2">Примечания</p>
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                    {client.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Сметы клиента */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Calculator className="h-6 w-6 text-pink-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Сметы</h2>
              </div>
              <Link
                href={`/estimates/new?clientId=${clientId}`}
                className="btn-secondary flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Новая смета
              </Link>
            </div>

            {estimatesLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Загрузка смет...</p>
              </div>
            ) : estimates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Смет пока нет</h3>
                <p className="text-gray-600 mb-6">Создайте первую смету для этого клиента</p>
                <Link
                  href={`/estimates/new?clientId=${clientId}`}
                  className="btn-primary flex items-center mx-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Создать смету
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {estimates.map((estimate) => {
                  const category = formatCategory(estimate.category || 'main')
                  const CategoryIcon = category.icon
                  return (
                    <div
                      key={estimate.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">{estimate.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${category.color}`}>
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {category.text}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              {(() => {
                                if (estimate.type === 'rooms' && estimate.summaryWorksBlock && estimate.summaryMaterialsBlock && coefficients.length > 0) {
                                  // Для смет по помещениям пересчитываем с учетом коэффициентов
                                  const estimateCoefficients = estimate.coefficients || []
                                  const manualPrices = new Set(estimate.manualPrices || [])
                                  
                                  // Получаем данные коэффициентов из загруженного списка
                                  const normalCoeff = estimateCoefficients.reduce((acc: number, coeffId: string) => {
                                    const coeff = coefficients.find((c: any) => c.id === coeffId)
                                    if (coeff && (!coeff.type || coeff.type === 'normal')) {
                                      return acc * coeff.value
                                    }
                                    return acc
                                  }, 1)
                                  
                                  const finalCoeff = estimateCoefficients.reduce((acc: number, coeffId: string) => {
                                    const coeff = coefficients.find((c: any) => c.id === coeffId)
                                    if (coeff && coeff.type === 'final') {
                                      return acc * coeff.value
                                    }
                                    return acc
                                  }, 1)
                                  
                                  // Пересчитываем работы с коэффициентами
                                  const adjustedWorksPrice = estimate.summaryWorksBlock.blocks.reduce((blockSum: number, block: any) => {
                                    const blockTotal = block.items.reduce((itemSum: number, item: any) => {
                                      let adjustedTotalPrice: number
                                      
                                      if (manualPrices.has(item.id)) {
                                        // Для ручных цен применяем только конечные коэффициенты
                                        adjustedTotalPrice = item.unitPrice * finalCoeff * item.quantity
                                      } else {
                                        // Для автоматических цен применяем обычные × конечные
                                        adjustedTotalPrice = item.unitPrice * normalCoeff * finalCoeff * item.quantity
                                      }
                                      
                                      return itemSum + Math.round(adjustedTotalPrice)
                                    }, 0)
                                    
                                    return blockSum + blockTotal
                                  }, 0)
                                  
                                  // Материалы с глобальным коэффициентом
                                  const globalCoeff = normalCoeff * finalCoeff
                                  const adjustedMaterialsPrice = estimate.summaryMaterialsBlock.items.reduce((sum: number, item: any) => {
                                    return sum + Math.round(item.unitPrice * globalCoeff * item.quantity)
                                  }, 0)
                                  
                                  return formatPrice(adjustedWorksPrice + adjustedMaterialsPrice)
                                } else {
                                  return formatPrice(estimate.totalPrice)
                                }
                              })()}
                            </span>
                            <span>
                              Создано: {new Date(estimate.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                            <span>
                              Изменено: {new Date(estimate.updatedAt).toLocaleDateString('ru-RU')} в {new Date(estimate.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/estimates/${estimate.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Просмотреть смету"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/estimates/${estimate.id}/edit`}
                            className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteEstimate(estimate.id, estimate.title)
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Удалить смету"
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
      </div>
    </div>
  )
} 