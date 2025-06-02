'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileText, Calendar, User, DollarSign, Eye, Edit, Trash2, Search, ArrowLeft } from 'lucide-react'
import { Estimate } from '@/types/estimate'

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadEstimates()
  }, [])

  const loadEstimates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/estimates')
      const data = await response.json()
      
      if (response.ok) {
        // Преобразуем строки дат в объекты Date
        const estimatesWithDates = data.estimates.map((estimate: any) => ({
          ...estimate,
          createdAt: new Date(estimate.createdAt),
          updatedAt: new Date(estimate.updatedAt),
          client: {
            ...estimate.client,
            createdAt: new Date(estimate.client.createdAt)
          }
        }))
        setEstimates(estimatesWithDates)
      }
    } catch (error) {
      console.error('Ошибка загрузки смет:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteEstimate = async (id: string) => {
    if (!confirm('Удалить смету? Это действие нельзя отменить.')) return
    
    try {
      const response = await fetch(`/api/estimates/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setEstimates(prev => prev.filter(estimate => estimate.id !== id))
        alert('Смета успешно удалена')
      } else {
        const errorData = await response.json()
        console.error('Ошибка удаления сметы:', errorData)
        alert(`Ошибка удаления сметы: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Ошибка удаления сметы:', error)
      alert('Ошибка удаления сметы: проблема с сетью или сервером')
    }
  }

  const filteredEstimates = estimates.filter(estimate =>
    estimate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estimate.client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Черновик', color: 'bg-gray-100 text-gray-700' },
      active: { label: 'Активная', color: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Завершена', color: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Отменена', color: 'bg-red-100 text-red-700' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <span className={`status-badge ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="container mx-auto px-6 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Сметы</h1>
          </div>
        </div>
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Загрузка смет...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Сметы</h1>
                <p className="text-gray-600 mt-1">Управление сметами ремонтных работ</p>
              </div>
            </div>
            <Link href="/estimates/new" className="btn-primary flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Создать смету
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search and Stats */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по названию или клиенту..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-12 w-full"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="card p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего смет</p>
                <p className="text-2xl font-bold text-gray-900">{estimates.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Общая сумма</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estimates.reduce((sum, est) => sum + est.totalPrice, 0).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estimates Grid */}
        {filteredEstimates.length === 0 ? (
          <div className="card text-center py-16">
            <FileText className="h-16 w-16 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Сметы не найдены' : 'Нет созданных смет'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Попробуйте изменить поисковый запрос' 
                : 'Создайте свою первую смету для начала работы'
              }
            </p>
            {!searchTerm && (
              <Link href="/estimates/new" className="btn-primary inline-flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Создать первую смету
              </Link>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEstimates.map((estimate) => (
              <div key={estimate.id} className="card group hover:scale-105 transition-all duration-300 fade-in">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {estimate.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <User className="h-4 w-4 mr-1" />
                      {estimate.client.name}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {estimate.createdAt.toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  {getStatusBadge(estimate.status)}
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-1">Общая стоимость</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {estimate.totalPrice.toLocaleString('ru-RU')} ₽
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <span className="text-gray-600">Работы:</span>
                    <div className="font-medium">{estimate.totalWorksPrice.toLocaleString('ru-RU')} ₽</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Материалы:</span>
                    <div className="font-medium">{estimate.totalMaterialsPrice.toLocaleString('ru-RU')} ₽</div>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {estimate.type === 'rooms' ? 'Помещений:' : 'Блоков работ:'}
                    </span>
                    <div className="font-medium">
                      {estimate.type === 'rooms' 
                        ? estimate.rooms?.length || 0
                        : estimate.worksBlock?.blocks?.length || 0
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {estimate.type === 'rooms' ? 'Тип:' : 'Материалов:'}
                    </span>
                    <div className="font-medium">
                      {estimate.type === 'rooms' 
                        ? 'По помещениям'
                        : estimate.materialsBlock?.items?.length || 0
                      }
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Link
                    href={`/estimates/${estimate.id}`}
                    className="flex-1 btn-secondary text-center flex items-center justify-center text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Просмотр
                  </Link>
                  <Link
                    href={`/estimates/${estimate.id}/edit`}
                    className="flex-1 btn-primary text-center flex items-center justify-center text-sm"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Редактировать
                  </Link>
                  <button
                    onClick={() => deleteEstimate(estimate.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors"
                    title="Удалить смету"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {estimates.length > 0 && (
          <div className="mt-12">
            <div className="card bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center">
              <h3 className="text-xl font-bold mb-2">Готовы создать новую смету?</h3>
              <p className="text-blue-100 mb-6">
                Используйте наш удобный конструктор для быстрого создания профессиональных смет
              </p>
              <Link href="/estimates/new" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-xl transition-all duration-200 inline-flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Создать смету
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 