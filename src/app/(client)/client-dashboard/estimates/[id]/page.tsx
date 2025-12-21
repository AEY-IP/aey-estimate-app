'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Download, Wrench, Package, ChevronDown, ChevronRight, User, Calculator, Info } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface WorkItem {
  id: string
  name: string
  unit: string
  quantity: number
  displayUnitPrice: number
  displayTotalPrice: number
}

interface WorkBlock {
  id: string
  title: string
  items: WorkItem[]
  totalPrice: number
}

interface MaterialItem {
  id: string
  name: string
  unit: string
  quantity: number
  displayUnitPrice: number
  displayTotalPrice: number
}

interface EstimateCache {
  worksData: WorkBlock[]
  materialsData: MaterialItem[]
  totalWorksPrice: number
  totalMaterialsPrice: number
  grandTotal: number
  coefficientsInfo: {
    normal: number
    final: number
    global: number
    applied: Array<{
      id: string
      name: string
      value: number
      type: string
    }>
  }
  estimate: {
    id: string
    title: string
    createdAt: string
    updatedAt: string
  }
}

interface ClientData {
  id: string
  name: string
}

export default function ClientViewEstimatePage({ params }: { params: { id: string } }) {
  const [estimateCache, setEstimateCache] = useState<EstimateCache | null>(null)
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set())
  const [showCoefficientsInfo, setShowCoefficientsInfo] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchClientData()
  }, [])

  useEffect(() => {
    if (clientData) {
      loadEstimateCache()
    }
  }, [clientData, params.id])

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

  const loadEstimateCache = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/estimates/${params.id}/export-cache`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Смета еще обрабатывается. Попробуйте позже.')
        } else if (response.status === 403) {
          setError('Смета недоступна')
        } else {
          setError('Ошибка загрузки сметы')
        }
        return
      }
      
      const data = await response.json()
      setEstimateCache(data)
    } catch (error) {
      console.error('Ошибка загрузки кеша сметы:', error)
      setError('Ошибка загрузки сметы')
    } finally {
      setLoading(false)
    }
  }

  const toggleBlockCollapse = (blockId: string) => {
    setCollapsedBlocks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(blockId)) {
        newSet.delete(blockId)
      } else {
        newSet.add(blockId)
      }
      return newSet
    })
  }

  const handleDownloadPDF = async () => {
    if (!estimateCache) return
    
    try {
      setDownloadingPdf(true)
      // TODO: Реализовать экспорт PDF из кеша
      console.log('Экспорт PDF из кеша:', estimateCache)
      alert('Экспорт PDF временно недоступен')
    } catch (error) {
      console.error('Ошибка экспорта PDF:', error)
      alert('Ошибка экспорта PDF')
    } finally {
      setDownloadingPdf(false)
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

  const getBlockIcon = (blockTitle: string) => {
    if (blockTitle.toLowerCase().includes('демонтаж')) {
      return <Wrench className="h-5 w-5 text-red-500" />
    }
    if (blockTitle.toLowerCase().includes('материал')) {
      return <Package className="h-5 w-5 text-green-500" />
    }
    return <Wrench className="h-5 w-5 text-blue-500" />
  }

  // Функция для сортировки блоков работ в правильном порядке (как в PDF)
  const getSortedWorksBlocks = (blocks: WorkBlock[]) => {
    const blockOrder = [
      'Демонтажные работы (Пол)',
      'Демонтажные работы (Стены)', 
      'Демонтажные работы (Потолок)',
      'Демонтажные работы (Двери)',
      'Демонтажные работы (Электрика)',
      'Демонтажные работы (Сантехника)',
      'Демонтажные работы (Прочее)',
      'Черновые работы (Пол)',
      'Черновые работы (Стены)',
      'Черновые работы (Потолок)',
      'Черновые работы (Двери)',
      'Черновые работы (Электрика)',
      'Черновые работы (Сантехника)',
      'Черновые работы (Прочее)',
      'Финишные работы (Пол)',
      'Финишные работы (Стены)',
      'Финишные работы (Потолок)',
      'Финишные работы (Двери)',
      'Финишные работы (Электрика)',
      'Финишные работы (Сантехника)',
      'Финишные работы (Прочее)',
      'Вентиляция',
      'Прочее'
    ]

    return blocks.sort((a, b) => {
      const aIndex = blockOrder.indexOf(a.title)
      const bIndex = blockOrder.indexOf(b.title)
      
      if (aIndex === -1 && bIndex === -1) return a.title.localeCompare(b.title)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      
      return aIndex - bIndex
    })
  }

  // Плавающий виджет аутентификации
  const AuthWidget = () => (
    <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg p-4 border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {clientData?.name}
          </p>
          <p className="text-xs text-gray-500">Клиент</p>
        </div>
        <button
          onClick={() => {
            fetch('/api/auth/client-logout', { method: 'POST' })
              .then(() => router.push('/client-login'))
          }}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Выйти
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthWidget />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Загрузка сметы...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !estimateCache) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthWidget />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error || 'Смета не найдена'}</p>
            <div className="flex gap-4 justify-center">
              <Link href="/client-dashboard/estimates" className="btn-secondary">
                Вернуться к списку
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const sortedWorksBlocks = getSortedWorksBlocks(estimateCache.worksData)

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthWidget />
      
      {/* Шапка */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href="/client-dashboard/estimates" 
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {estimateCache.estimate.title}
                </h1>
                <p className="text-gray-600 mt-1">
                  Детальный просмотр сметы
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloadingPdf ? 'Экспорт...' : 'Скачать PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Итоговые суммы */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <div className="flex items-center justify-center mb-3">
              <Calculator className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Работы</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatPrice(estimateCache.totalWorksPrice)}
            </p>
          </div>
          
          <div className="card text-center">
            <div className="flex items-center justify-center mb-3">
              <Package className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Материалы</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(estimateCache.totalMaterialsPrice)}
            </p>
          </div>
          
          <div className="card text-center bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
            <div className="flex items-center justify-center mb-3">
              <Calculator className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Общая сумма</h3>
            <p className="text-3xl font-bold text-primary-600">
              {formatPrice(estimateCache.grandTotal)}
            </p>
          </div>
        </div>

        {/* Блоки работ */}
        {sortedWorksBlocks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Работы по блокам</h2>
            <div className="space-y-4">
              {sortedWorksBlocks.map((block) => {
                const isCollapsed = collapsedBlocks.has(block.id)
                
                return (
                  <div key={block.id} className="card">
                    <button
                      onClick={() => toggleBlockCollapse(block.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        {getBlockIcon(block.title)}
                        <div className="ml-3 text-left">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {block.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {block.items.length} позиций
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900 mr-4">
                          {formatPrice(block.items.reduce((sum, item) => sum + item.displayTotalPrice, 0))}
                        </span>
                        {isCollapsed ? (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>
                    
                    {!isCollapsed && (
                      <div className="border-t border-gray-200">
                        <div className="p-4">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="text-left border-b border-gray-200">
                                  <th className="pb-3 text-sm font-medium text-gray-500">Наименование</th>
                                  <th className="pb-3 text-sm font-medium text-gray-500 text-center">Ед.изм.</th>
                                  <th className="pb-3 text-sm font-medium text-gray-500 text-center">Кол-во</th>
                                  <th className="pb-3 text-sm font-medium text-gray-500 text-right">Цена за ед.</th>
                                  <th className="pb-3 text-sm font-medium text-gray-500 text-right">Стоимость</th>
                                </tr>
                              </thead>
                              <tbody>
                                {block.items.map((item) => (
                                  <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                                    <td className="py-3">
                                      <span className="font-medium text-gray-900">{item.name}</span>
                                    </td>
                                    <td className="py-3 text-center text-gray-600">{item.unit}</td>
                                    <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                                    <td className="py-3 text-right font-medium text-gray-900">
                                      {formatPrice(item.displayUnitPrice)}
                                    </td>
                                    <td className="py-3 text-right font-bold text-gray-900">
                                      {formatPrice(item.displayTotalPrice)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Материалы */}
        {estimateCache.materialsData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Материалы</h2>
            <div className="card">
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-200">
                        <th className="pb-3 text-sm font-medium text-gray-500">Наименование</th>
                        <th className="pb-3 text-sm font-medium text-gray-500 text-center">Ед.изм.</th>
                        <th className="pb-3 text-sm font-medium text-gray-500 text-center">Кол-во</th>
                        <th className="pb-3 text-sm font-medium text-gray-500 text-right">Цена за ед.</th>
                        <th className="pb-3 text-sm font-medium text-gray-500 text-right">Стоимость</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estimateCache.materialsData.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                          <td className="py-3">
                            <span className="font-medium text-gray-900">{item.name}</span>
                          </td>
                          <td className="py-3 text-center text-gray-600">{item.unit}</td>
                          <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-3 text-right font-medium text-gray-900">
                            {formatPrice(item.displayUnitPrice)}
                          </td>
                          <td className="py-3 text-right font-bold text-gray-900">
                            {formatPrice(item.displayTotalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Информация о смете */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о смете</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Создано:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(estimateCache.estimate.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Обновлено:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(estimateCache.estimate.updatedAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric', 
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 