'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Edit2, User, Building2, Calendar, Package } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'
import { generateActWithSettings } from '@/lib/pdf-export'

interface Act {
  id: string
  title: string
  type: 'apartment' | 'rooms'
  category: string
  showToClient: boolean
  notes?: string
  totalWorksPrice: number
  totalMaterialsPrice: number
  totalPrice: number
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
  rooms: Array<{
    id: string
    name: string
    totalWorksPrice: number
    totalMaterialsPrice: number
    totalPrice: number
    works: Array<{
      id: string
      quantity: number
      price: number
      totalPrice: number
      description?: string
      blockTitle?: string
      workItem: {
        id: string
        name: string
        unit: string
        price: number
        block: {
          title: string
        }
      }
    }>
    materials: Array<{
      id: string
      name: string
      unit: string
      quantity: number
      price: number
      totalPrice: number
      description?: string
    }>
  }>
}

export default function ActViewPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useAuth()
  const { showToast } = useToast()
  const [act, setAct] = useState<Act | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [showActExportModal, setShowActExportModal] = useState(false)
  const [actExportSettings, setActExportSettings] = useState({
    actNumber: '',
    actDate: '',
    contractNumber: '',
    isManualContractNumber: false,
    contractDate: '',
    isManualContractDate: false,
    actType: 'simple' as 'simple' | 'additional'
  })

  const actId = params.id as string

  useEffect(() => {
    if (actId) {
      fetchAct()
    }
  }, [actId])

  const fetchAct = async () => {
    try {
      const response = await fetch(`/api/acts/${actId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Акт не найден')
          return
        }
        throw new Error('Ошибка загрузки акта')
      }
      
      const data = await response.json()
      setAct(data)
    } catch (error) {
      console.error('Ошибка загрузки акта:', error)
      setError('Ошибка загрузки акта')
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

  const handleExportClick = async () => {
    if (!act) return
    
    // Получаем данные клиента для предзаполнения
    try {
      const clientResponse = await fetch(`/api/clients/${act.client.id}`)
      const clientData = clientResponse.ok ? await clientResponse.json() : null
      
      // Предзаполняем настройки акта
      setActExportSettings({
        actNumber: '',
        actDate: new Date().toLocaleDateString('ru-RU'),
        contractNumber: clientData?.contractNumber || '',
        isManualContractNumber: false,
        contractDate: clientData?.contractDate || '',
        isManualContractDate: false,
        actType: 'simple'
      })
      
      setShowActExportModal(true)
    } catch (error) {
      console.error('Ошибка загрузки клиента для акта:', error)
      showToast('error', 'Ошибка при загрузке данных клиента')
    }
  }

  const handleActExport = async () => {
    if (!act) return
    
    // Валидация обязательных полей
    if (!actExportSettings.actNumber.trim()) {
      showToast('error', 'Заполните номер акта')
      return
    }
    
    if (!actExportSettings.actDate.trim()) {
      showToast('error', 'Заполните дату акта')
      return
    }
    
    const contractNumber = actExportSettings.isManualContractNumber 
      ? actExportSettings.contractNumber 
      : actExportSettings.contractNumber
    
    const contractDate = actExportSettings.isManualContractDate 
      ? actExportSettings.contractDate 
      : actExportSettings.contractDate
    
    if (!contractNumber.trim()) {
      showToast('error', 'Заполните номер договора')
      return
    }
    
    if (!contractDate.trim()) {
      showToast('error', 'Заполните дату договора')
      return
    }
    
    try {
      // Получаем данные клиента для экспорта
      const clientResponse = await fetch(`/api/clients/${act.client.id}`)
      const clientData = clientResponse.ok ? await clientResponse.json() : null
      
      // Вызываем новую функцию экспорта акта с настройками
      await generateActWithSettings(act, actExportSettings, clientData)
      showToast('success', 'PDF акта сгенерирован')
      
    } catch (error) {
      console.error('Ошибка экспорта акта:', error)
      showToast('error', 'Ошибка при экспорте PDF')
    }
    
    setShowActExportModal(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка акта...</p>
        </div>
      </div>
    )
  }

  if (error || !act) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Ошибка</div>
          <p className="text-gray-600 mb-4">{error || 'Акт не найден'}</p>
          <Link 
            href="/clients"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Назад к клиентам
          </Link>
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
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {act.title}
                </h1>
                <span className={`px-3 py-1 text-sm rounded-full ${getCategoryColor(act.category)}`}>
                  {getCategoryName(act.category)}
                </span>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  act.type === 'apartment' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {act.type === 'apartment' ? 'Квартира' : 'Комнаты'}
                </span>

              </div>
              
              <div className="flex items-center gap-6 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{act.client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{act.creator.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Создан: {new Date(act.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                {act.updatedAt !== act.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Обновлен: {new Date(act.updatedAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                )}
              </div>
              
              {act.notes && (
                <p className="text-gray-700 mb-4">{act.notes}</p>
              )}
            </div>
            
            <div className="flex gap-3">
              <Link
                href={`/acts/${act.id}/edit`}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Редактировать
              </Link>
              <button
                onClick={handleExportClick}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Скачать PDF
              </button>
            </div>
          </div>
        </div>

        {/* Итоговая стоимость */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Итоговая стоимость</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Стоимость работ</p>
              <p className="text-2xl font-bold text-blue-600">{formatPrice(act.totalWorksPrice)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Стоимость материалов</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(act.totalMaterialsPrice)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Общая стоимость</p>
              <p className="text-3xl font-bold text-purple-600">{formatPrice(act.totalPrice)}</p>
            </div>
          </div>
        </div>

        {/* Комнаты */}
        <div className="space-y-6">
          {act.rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">{room.name}</h3>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{formatPrice(room.totalPrice)}</p>
                    <p className="text-sm text-gray-500">
                      Работы: {formatPrice(room.totalWorksPrice)} | 
                      Материалы: {formatPrice(room.totalMaterialsPrice)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Работы */}
              {room.works.length > 0 && (
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Работы
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-sm font-medium text-gray-600">Наименование</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-600">Ед. изм.</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-600">Кол-во</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-600">Цена</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-600">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.works.map((work) => (
                          <tr key={work.id} className="border-b border-gray-100">
                            <td className="py-3">
                              <div>
                                <p className="font-medium text-gray-900">{work.workItem.name}</p>
                                {work.blockTitle && (
                                  <p className="text-sm text-gray-500">{work.blockTitle}</p>
                                )}
                                {work.description && (
                                  <p className="text-sm text-gray-500">{work.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-3 text-gray-600">{work.workItem.unit}</td>
                            <td className="text-right py-3 text-gray-900">{work.quantity}</td>
                            <td className="text-right py-3 text-gray-900">{formatPrice(work.price)}</td>
                            <td className="text-right py-3 font-medium text-gray-900">{formatPrice(work.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Материалы */}
              {room.materials.length > 0 && (
                <div className="p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Материалы
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-sm font-medium text-gray-600">Наименование</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-600">Ед. изм.</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-600">Кол-во</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-600">Цена</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-600">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.materials.map((material) => (
                          <tr key={material.id} className="border-b border-gray-100">
                            <td className="py-3">
                              <div>
                                <p className="font-medium text-gray-900">{material.name}</p>
                                {material.description && (
                                  <p className="text-sm text-gray-500">{material.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-3 text-gray-600">{material.unit}</td>
                            <td className="text-right py-3 text-gray-900">{material.quantity}</td>
                            <td className="text-right py-3 text-gray-900">{formatPrice(material.price)}</td>
                            <td className="text-right py-3 font-medium text-gray-900">{formatPrice(material.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно настроек акта */}
      {showActExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Настройки экспорта акта
            </h3>
            
            <div className="space-y-6">
              {/* Номер акта */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Номер акта *
                </label>
                <input
                  type="text"
                  value={actExportSettings.actNumber}
                  onChange={(e) => setActExportSettings(prev => ({
                    ...prev,
                    actNumber: e.target.value
                  }))}
                  placeholder="например: 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Дата акта */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата акта *
                </label>
                <input
                  type="text"
                  value={actExportSettings.actDate}
                  onChange={(e) => setActExportSettings(prev => ({
                    ...prev,
                    actDate: e.target.value
                  }))}
                  placeholder="например: 15.01.2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Номер договора */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={actExportSettings.isManualContractNumber}
                    onChange={(e) => setActExportSettings(prev => ({
                      ...prev,
                      isManualContractNumber: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Ручной ввод номера договора</span>
                </label>
                <input
                  type="text"
                  value={actExportSettings.contractNumber}
                  onChange={(e) => setActExportSettings(prev => ({
                    ...prev,
                    contractNumber: e.target.value
                  }))}
                  disabled={!actExportSettings.isManualContractNumber}
                  placeholder="Номер договора"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* Дата договора */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={actExportSettings.isManualContractDate}
                    onChange={(e) => setActExportSettings(prev => ({
                      ...prev,
                      isManualContractDate: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Ручной ввод даты договора</span>
                </label>
                <input
                  type="text"
                  value={actExportSettings.contractDate}
                  onChange={(e) => setActExportSettings(prev => ({
                    ...prev,
                    contractDate: e.target.value
                  }))}
                  disabled={!actExportSettings.isManualContractDate}
                  placeholder="например: 01.12.2023"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* Тип акта */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип акта *
                </label>
                <select
                  value={actExportSettings.actType}
                  onChange={(e) => setActExportSettings(prev => ({
                    ...prev,
                    actType: e.target.value as 'simple' | 'additional'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="simple">Простой акт</option>
                  <option value="additional">Акт дополнительных работ</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowActExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleActExport}
                disabled={!actExportSettings.actNumber || !actExportSettings.actDate}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Экспорт акта
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 