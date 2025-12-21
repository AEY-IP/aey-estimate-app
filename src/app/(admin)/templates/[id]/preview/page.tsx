'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Template } from '@/types/template'

interface Props {
  params: { id: string }
}

export default function TemplatePreviewPage({ params }: Props) {
  const { session } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  // Проверка доступа и загрузка данных
  useEffect(() => {
    if (!session?.isAuthenticated) {
      router.push('/')
      return
    }

    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      setTimeout(() => {
        showToast('error', 'У вас нет доступа к этой странице')
        router.push('/dashboard')
      }, 0)
      return
    }

    fetchTemplate()
  }, [session, params.id])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setTimeout(() => {
            showToast('error', 'Шаблон не найден')
            router.push('/templates')
          }, 0)
          return
        }
        throw new Error('Ошибка загрузки шаблона')
      }
      const data = await response.json()
      setTemplate(data)
    } catch (error) {
      console.error('Ошибка загрузки шаблона:', error)
      setTimeout(() => {
        showToast('error', 'Ошибка загрузки шаблона')
        router.push('/templates')
      }, 0)
    } finally {
      setLoading(false)
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

  // Группировка работ по блокам
  const getWorksByBlocks = () => {
    if (!template?.rooms[0]?.works) return {}
    
    const worksByBlocks: { [key: string]: any[] } = {}
    
    template.rooms[0].works.forEach(work => {
      const blockTitle = work.blockTitle || 'Дополнительные работы'
      if (!worksByBlocks[blockTitle]) {
        worksByBlocks[blockTitle] = []
      }
      worksByBlocks[blockTitle].push(work)
    })
    
    return worksByBlocks
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка шаблона...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Шаблон не найден</p>
        </div>
      </div>
    )
  }

  const worksByBlocks = getWorksByBlocks()
  const totalWorks = template.rooms[0]?.works.length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => router.push('/templates')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Назад к списку
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                template.type === 'general' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {template.type === 'general' ? 'Общий' : 'Комната'}
              </span>
              <span className="text-gray-500 text-sm">
                Автор: {template.creator.name}
              </span>
              <span className="text-gray-500 text-sm">
                Создан: {new Date(template.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
            {template.description && (
              <p className="text-gray-600 mt-2">{template.description}</p>
            )}
          </div>

          {session?.user.role === 'ADMIN' && (
            <button
              onClick={() => router.push(`/templates/${template.id}/edit`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Редактировать
            </button>
          )}
        </div>

        {/* Сводная информация */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600 mb-2">{totalWorks}</div>
            <div className="text-sm text-gray-600">Всего работ</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600 mb-2">{Object.keys(worksByBlocks).length}</div>
            <div className="text-sm text-gray-600">Блоков работ</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600 mb-2">{formatPrice(template.totalPrice)}</div>
            <div className="text-sm text-gray-600">Общая стоимость</div>
          </div>
        </div>

        {/* Список работ по блокам */}
        <div className="space-y-8">
          {Object.keys(worksByBlocks).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Шаблон пуст</h3>
              <p className="text-gray-600">
                В этом шаблоне пока нет работ
              </p>
            </div>
          ) : (
            Object.entries(worksByBlocks).map(([blockTitle, works]) => (
              <div key={blockTitle} className="bg-white rounded-lg border border-gray-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">{blockTitle}</h2>
                  <p className="text-sm text-gray-600">
                    Работ: {works.length} • Стоимость: {formatPrice(works.reduce((sum, work) => sum + work.totalPrice, 0))}
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          № п/п
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Наименование работ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ед. изм.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Кол-во
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Цена за ед.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Стоимость
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {works.map((work, index) => (
                        <tr key={work.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">
                                {work.workItem?.name || work.manualWorkName}
                              </div>
                              {work.description && (
                                <div className="text-gray-600 text-xs mt-1">
                                  {work.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {work.workItem?.unit || work.manualWorkUnit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {work.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(work.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(work.totalPrice)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-medium">
                        <td colSpan={5} className="px-6 py-4 text-sm text-gray-900 text-right">
                          Итого по блоку:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(works.reduce((sum, work) => sum + work.totalPrice, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}

          {/* Общий итог */}
          {Object.keys(worksByBlocks).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Общий итог по шаблону
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Всего работ: {totalWorks} • Блоков: {Object.keys(worksByBlocks).length}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">
                    {formatPrice(template.totalPrice)}
                  </div>
                  <div className="text-blue-700 text-sm">
                    Общая стоимость
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
