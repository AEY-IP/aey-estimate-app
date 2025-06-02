'use client'

import { useState } from 'react'
import { ArrowLeft, Save, User, FileText, Home, Building } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EstimateType } from '@/types/estimate'

export default function NewEstimatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [estimateType, setEstimateType] = useState<EstimateType>('apartment')
  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          type: estimateType,
          client: {
            name: formData.clientName,
            phone: formData.clientPhone,
            email: formData.clientEmail,
            address: formData.clientAddress,
          },
          coefficients: [] // Пустой массив коэффициентов
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Перенаправляем на страницу редактирования созданной сметы
        router.push(`/estimates/${result.estimate.id}/edit`)
      } else {
        alert(`Ошибка создания сметы: ${result.error}`)
      }
    } catch (error) {
      console.error('Ошибка создания сметы:', error)
      alert('Ошибка создания сметы')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/estimates" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Новая смета</h1>
          <p className="text-gray-600 mt-2">Создание новой сметы ремонтных работ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Тип сметы */}
        <div className="card mb-8">
          <div className="flex items-center mb-6">
            <Building className="h-6 w-6 text-primary-600 mr-3" />
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

        {/* Информация о смете */}
        <div className="card mb-8">
          <div className="flex items-center mb-6">
            <FileText className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold">Информация о смете</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Название сметы *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Например: Ремонт 2-комнатной квартиры"
                required
              />
            </div>
          </div>
        </div>

        {/* Информация о клиенте */}
        <div className="card mb-8">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold">Информация о клиенте</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                ФИО клиента *
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>
            
            <div>
              <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Телефон *
              </label>
              <input
                type="tel"
                id="clientPhone"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleInputChange}
                className="input-field"
                placeholder="+7 (999) 123-45-67"
                required
              />
            </div>
            
            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="clientEmail"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleInputChange}
                className="input-field"
                placeholder="client@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Адрес объекта
              </label>
              <input
                type="text"
                id="clientAddress"
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleInputChange}
                className="input-field"
                placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
              />
            </div>
          </div>
        </div>

        {/* Информационное сообщение */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Что дальше?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                {estimateType === 'apartment' ? (
                  <p>После создания сметы вы сможете добавить работы, материалы и настроить коэффициенты в режиме редактирования.</p>
                ) : (
                  <p>После создания сметы вы перейдете в сводную смету, где сможете добавить помещения и настроить коэффициенты для всего проекта.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Создание...' : 'Создать смету'}
          </button>
          
          <Link href="/estimates" className="btn-secondary flex items-center">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  )
} 