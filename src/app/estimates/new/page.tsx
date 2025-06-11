'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, FileText, Home, Building, Building2, Star, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { EstimateType, EstimateCategory } from '@/types/estimate'
import { Client } from '@/types/client'
import { useToast } from '@/components/Toast'

export default function NewEstimatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [clientLoading, setClientLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)
  const [estimateType, setEstimateType] = useState<EstimateType>('apartment')
  const [estimateCategory, setEstimateCategory] = useState<EstimateCategory>('main')
  const [title, setTitle] = useState('')

  const clientId = searchParams.get('clientId')

  // Загрузка информации о клиенте
  useEffect(() => {
    if (!clientId) {
      showToast('error', 'Не указан клиент')
      router.push('/clients')
      return
    }

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
          router.push('/clients')
        }
      } catch (error) {
        showToast('error', 'Ошибка сети')
        router.push('/clients')
      } finally {
        setClientLoading(false)
      }
    }

    fetchClient()
  }, [clientId, router, showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      showToast('error', 'Введите название сметы')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          type: estimateType,
          category: estimateCategory,
          clientId,
          coefficients: []
        }),
      })

      const result = await response.json()

      if (response.ok) {
        showToast('success', 'Смета создана')
        // Перенаправляем на страницу редактирования созданной сметы
        router.push(`/estimates/${result.id}/edit`)
      } else {
        showToast('error', result.error || 'Ошибка создания сметы')
      }
    } catch (error) {
      console.error('Ошибка создания сметы:', error)
      showToast('error', 'Ошибка создания сметы')
    } finally {
      setLoading(false)
    }
  }

  if (clientLoading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Загрузка информации о клиенте...</p>
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
            Вернуться к списку клиентов
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex items-center mb-8">
        <Link 
          href={`/clients/${clientId}`} 
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Новая смета</h1>
          <p className="text-gray-600 mt-2">Создание сметы для клиента "{client.name}"</p>
        </div>
      </div>

      <div className="max-w-4xl">
        {/* Информация о клиенте */}
        <div className="card mb-8">
          <div className="flex items-center mb-6">
            <Building2 className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Клиент</h2>
          </div>
          
          <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">{client.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-blue-700">
                {client.phone && <span>{client.phone}</span>}
                {client.contractNumber && <span>№ {client.contractNumber}</span>}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Категория сметы */}
          <div className="card mb-8">
            <div className="flex items-center mb-6">
              <Star className="h-6 w-6 text-purple-600 mr-3" />
              <h2 className="text-xl font-semibold">Категория сметы</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Выберите тип работ для данной сметы:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <label className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${
                  estimateCategory === 'main' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="estimateCategory"
                    value="main"
                    checked={estimateCategory === 'main'}
                    onChange={(e) => setEstimateCategory(e.target.value as EstimateCategory)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <Star className={`h-6 w-6 mr-3 ${
                      estimateCategory === 'main' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <h3 className={`font-semibold ${
                        estimateCategory === 'main' ? 'text-purple-900' : 'text-gray-900'
                      }`}>
                        Основная смета
                      </h3>
                      <p className={`text-sm mt-1 ${
                        estimateCategory === 'main' ? 'text-purple-700' : 'text-gray-600'
                      }`}>
                        Основной объем ремонтных работ
                      </p>
                    </div>
                  </div>
                  {estimateCategory === 'main' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </label>

                                  <label 
                    className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${
                      estimateCategory === 'additional' 
                        ? 'text-white' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    style={estimateCategory === 'additional' ? {borderColor: '#FF006F', background: 'rgba(255, 0, 111, 0.1)'} : {}}
                  >
                  <input
                    type="radio"
                    name="estimateCategory"
                    value="additional"
                    checked={estimateCategory === 'additional'}
                    onChange={(e) => setEstimateCategory(e.target.value as EstimateCategory)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                                          <Plus 
                        className={`h-6 w-6 mr-3 ${estimateCategory === 'additional' ? '' : 'text-gray-400'}`}
                        style={estimateCategory === 'additional' ? {color: '#FF006F'} : {}}
                      />
                    <div>
                                              <h3 
                          className={`font-semibold ${estimateCategory === 'additional' ? '' : 'text-gray-900'}`}
                          style={estimateCategory === 'additional' ? {color: '#FF006F'} : {}}
                        >
                        Дополнительные работы
                      </h3>
                                              <p 
                          className={`text-sm mt-1 ${estimateCategory === 'additional' ? '' : 'text-gray-600'}`}
                          style={estimateCategory === 'additional' ? {color: '#FF006F'} : {}}
                        >
                        Доп. работы, не входящие в основную смету
                      </p>
                    </div>
                  </div>
                  {estimateCategory === 'additional' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{background: '#FF006F'}}>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Тип сметы */}
          <div className="card mb-8">
            <div className="flex items-center mb-6">
              <Building className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold">Тип сметы</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Выберите способ организации сметы:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <label className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${
                  estimateType === 'apartment' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="estimateType"
                    value="apartment"
                    checked={estimateType === 'apartment'}
                    onChange={(e) => setEstimateType(e.target.value as EstimateType)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <Home className={`h-6 w-6 mr-3 ${
                      estimateType === 'apartment' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <h3 className={`font-semibold ${
                        estimateType === 'apartment' ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        Смета для всей квартиры
                      </h3>
                      <p className={`text-sm mt-1 ${
                        estimateType === 'apartment' ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        Классический подход - все работы в одной смете
                      </p>
                    </div>
                  </div>
                  {estimateType === 'apartment' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </label>

                <label className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${
                  estimateType === 'rooms' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="estimateType"
                    value="rooms"
                    checked={estimateType === 'rooms'}
                    onChange={(e) => setEstimateType(e.target.value as EstimateType)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <Building className={`h-6 w-6 mr-3 ${
                      estimateType === 'rooms' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <h3 className={`font-semibold ${
                        estimateType === 'rooms' ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        Смета по помещениям
                      </h3>
                      <p className={`text-sm mt-1 ${
                        estimateType === 'rooms' ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        Отдельная смета для каждого помещения + сводная
                      </p>
                    </div>
                  </div>
                  {estimateType === 'rooms' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </label>
              </div>
              
              {/* Информация о выбранном типе */}
              {estimateType === 'apartment' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Смета для всей квартиры</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Все работы и материалы в одном месте</li>
                    <li>• Простое управление коэффициентами</li>
                    <li>• Подходит для небольших объектов</li>
                  </ul>
                </div>
              )}
              
              {estimateType === 'rooms' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Смета по помещениям</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Детализация по каждому помещению</li>
                    <li>• Автоматическая сводная смета</li>
                    <li>• Централизованное управление коэффициентами</li>
                    <li>• Подходит для больших квартир и домов</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Название сметы */}
          <div className="card mb-8">
            <div className="flex items-center mb-6">
              <FileText className="h-6 w-6 text-purple-600 mr-3" />
              <h2 className="text-xl font-semibold">Название сметы</h2>
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Название сметы *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder={`Например: Ремонт ${estimateType === 'apartment' ? 'квартиры' : 'по помещениям'} - ${client.name}`}
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Введите описательное название для этой сметы
              </p>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end space-x-4">
            <Link
              href={`/clients/${clientId}`}
              className="btn-secondary"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Создание...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Создать смету
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 