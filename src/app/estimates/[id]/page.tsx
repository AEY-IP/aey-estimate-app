'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Edit, Download, Wrench, Package, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { generateEstimatePDF } from '@/lib/pdf-export'
import { Estimate } from '@/types/estimate'

export default function ViewEstimatePage({ params }: { params: { id: string } }) {
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadEstimate()
  }, [params.id])

  const loadEstimate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/estimates/${params.id}`)
      const data = await response.json()
      
      if (response.ok) {
        // Преобразуем строки дат в объекты Date
        const estimateWithDates = {
          ...data.estimate,
          createdAt: new Date(data.estimate.createdAt),
          updatedAt: new Date(data.estimate.updatedAt),
          client: {
            ...data.estimate.client,
            createdAt: new Date(data.estimate.client.createdAt)
          }
        }
        setEstimate(estimateWithDates)
      } else {
        setError(data.error || 'Ошибка загрузки сметы')
      }
    } catch (error) {
      console.error('Ошибка загрузки сметы:', error)
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Загрузка сметы...</p>
        </div>
      </div>
    )
  }

  if (error || !estimate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500">{error || 'Смета не найдена'}</p>
          <Link href="/estimates" className="btn-primary mt-4 inline-block">
            Вернуться к списку смет
          </Link>
        </div>
      </div>
    )
  }

  // Расчет общей суммы работ из всех блоков
  const totalWorksPrice = estimate.worksBlock.blocks.reduce((blockSum, block) => {
    const blockTotal = block.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0)
    return blockSum + blockTotal
  }, 0)
  
  const totalMaterialsPrice = estimate.materialsBlock.items.reduce((sum, item) => sum + item.totalPrice, 0)
  const grandTotal = totalWorksPrice + totalMaterialsPrice

  const handleExportPDF = () => {
    const estimateForExport = {
      ...estimate,
      totalWorksPrice,
      totalMaterialsPrice,
      totalPrice: grandTotal,
    }
    
    generateEstimatePDF(estimateForExport)
  }

  const statusLabels = {
    draft: 'Черновик',
    in_progress: 'В работе',
    completed: 'Завершено',
    cancelled: 'Отменено',
  }

  const statusColors = {
    draft: 'text-gray-700 bg-gray-100',
    in_progress: 'text-yellow-700 bg-yellow-100',
    completed: 'text-green-700 bg-green-100',
    cancelled: 'text-red-700 bg-red-100',
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href="/estimates" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{estimate.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[estimate.status]}`}>
                {statusLabels[estimate.status]}
              </span>
            </div>
            <p className="text-gray-600">Клиент: {estimate.client.name}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={handleExportPDF} className="btn-secondary flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Экспорт PDF
          </button>
          <Link href={`/estimates/${params.id}/edit`} className="btn-primary flex items-center">
            <Edit className="h-5 w-5 mr-2" />
            Редактировать
          </Link>
        </div>
      </div>

      {/* Информация о клиенте */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Информация о клиенте</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">ФИО:</span>
            <p className="text-gray-900">{estimate.client.name}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Телефон:</span>
            <p className="text-gray-900">{estimate.client.phone}</p>
          </div>
          {estimate.client.email && (
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-gray-900">{estimate.client.email}</p>
            </div>
          )}
          {estimate.client.address && (
            <div>
              <span className="text-sm font-medium text-gray-500">Адрес объекта:</span>
              <p className="text-gray-900">{estimate.client.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Работы */}
      <div className="card mb-8">
        <div className="flex items-center mb-6">
          <Wrench className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold">Работы</h2>
        </div>

        {estimate.worksBlock.blocks.length > 0 ? (
          <div className="space-y-4">
            {estimate.worksBlock.blocks.map((block, blockIndex) => (
              <div key={block.id} className="border border-gray-200 rounded-lg">
                {/* Заголовок блока */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleBlockCollapse(block.id)}
                      className="text-gray-600 hover:text-gray-800 p-1 mr-3"
                    >
                      {collapsedBlocks.has(block.id) ? 
                        <ChevronRight className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </button>
                    <div>
                      <h3 className="font-medium text-gray-900">{block.title}</h3>
                      {block.description && (
                        <p className="text-sm text-gray-600 mt-1">{block.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Работ: {block.items.length} | Сумма: {block.items.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString('ru-RU')} ₽
                  </div>
                </div>

                {/* Содержимое блока */}
                {!collapsedBlocks.has(block.id) && (
                  <div className="p-4">
                    {block.items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-sm">№</th>
                              <th className="text-left py-2 px-3 text-sm">Наименование</th>
                              <th className="text-left py-2 px-3 text-sm">Ед. изм.</th>
                              <th className="text-left py-2 px-3 text-sm">Кол-во</th>
                              <th className="text-left py-2 px-3 text-sm">Цена за ед.</th>
                              <th className="text-left py-2 px-3 text-sm">Сумма</th>
                            </tr>
                          </thead>
                          <tbody>
                            {block.items.map((item, itemIndex) => (
                              <tr key={item.id} className="border-b border-gray-100">
                                <td className="py-2 px-3 text-gray-600 text-sm">{itemIndex + 1}</td>
                                <td className="py-2 px-3 font-medium text-sm">{item.name}</td>
                                <td className="py-2 px-3 text-gray-600 text-sm">{item.unit}</td>
                                <td className="py-2 px-3 text-gray-600 text-sm">{item.quantity}</td>
                                <td className="py-2 px-3 text-gray-600 text-sm">{item.unitPrice.toLocaleString('ru-RU')} ₽</td>
                                <td className="py-2 px-3 font-semibold text-sm">{item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        В блоке нет работ
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Блоки работ не добавлены
          </div>
        )}
        
        <div className="mt-4 text-right">
          <span className="text-lg font-semibold">
            Итого по работам: {totalWorksPrice.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>

      {/* Материалы */}
      <div className="card mb-8">
        <div className="flex items-center mb-6">
          <Package className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold">Материалы</h2>
        </div>

        {estimate.materialsBlock.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">№</th>
                  <th className="text-left py-3 px-4">Наименование</th>
                  <th className="text-left py-3 px-4">Ед. изм.</th>
                  <th className="text-left py-3 px-4">Кол-во</th>
                  <th className="text-left py-3 px-4">Цена за ед.</th>
                  <th className="text-left py-3 px-4">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {estimate.materialsBlock.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-gray-600">{item.unit}</td>
                    <td className="py-3 px-4 text-gray-600">{item.quantity}</td>
                    <td className="py-3 px-4 text-gray-600">{item.unitPrice.toLocaleString('ru-RU')} ₽</td>
                    <td className="py-3 px-4 font-semibold">{item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Материалы не добавлены
          </div>
        )}
        
        <div className="mt-4 text-right">
          <span className="text-lg font-semibold">
            Итого по материалам: {totalMaterialsPrice.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>

      {/* Итоговая сумма */}
      <div className="card">
        <div className="text-right space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg">Работы:</span>
            <span className="text-lg font-semibold">{totalWorksPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg">Материалы:</span>
            <span className="text-lg font-semibold">{totalMaterialsPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
          <hr className="my-4" />
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">Общая сумма:</span>
            <span className="text-2xl font-bold text-primary-600">
              {grandTotal.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      </div>

      {/* Дополнительная информация */}
      <div className="mt-8 text-sm text-gray-500 text-center">
        <p>Создано: {estimate.createdAt.toLocaleDateString('ru-RU')} • 
           Обновлено: {estimate.updatedAt.toLocaleDateString('ru-RU')}</p>
      </div>
    </div>
  )
} 