'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X, Building2, Phone, Mail, MapPin, FileText, User, Calendar } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'
import { Client } from '@/types/client'
import DateInput from '@/components/DateInput'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useAuth()
  const { showToast } = useToast()
  
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    contractNumber: '',
    notes: '',
    contractDate: ''
  })

  const clientId = params.id as string

  // Загрузка клиента
  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          contractNumber: data.contractNumber || '',
          notes: data.notes || '',
          contractDate: data.contractDate || ''
        })
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

  useEffect(() => {
    fetchClient()
  }, [clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showToast('error', 'Название клиента обязательно')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast('success', 'Клиент успешно обновлен')
        router.push(`/clients/${clientId}`)
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка сохранения')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
            href={`/clients/${clientId}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Редактирование клиента</h1>
            <p className="text-gray-600 mt-1">Изменение информации о клиенте</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href={`/clients/${clientId}`}
            className="btn-secondary flex items-center"
          >
            <X className="h-5 w-5 mr-2" />
            Отмена
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary flex items-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="card">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Основная информация</h2>
              <p className="text-sm text-gray-600">Обновите данные о клиенте</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Название */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Название клиента *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="input-field"
                placeholder="ООО Компания или Иванов Иван Иванович"
                required
              />
            </div>

            {/* Телефон */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-2" />
                Телефон
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="input-field"
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="input-field"
                placeholder="client@example.com"
              />
            </div>

            {/* Адрес */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-2" />
                Адрес
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="input-field"
                placeholder="г. Москва, ул. Примерная, д. 1"
              />
            </div>

            {/* Номер договора */}
            <div>
              <label htmlFor="contractNumber" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Номер договора
              </label>
              <input
                type="text"
                id="contractNumber"
                value={formData.contractNumber}
                onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                className="input-field"
                placeholder="Д-2024-001"
              />
            </div>

            {/* Дата договора */}
            <div>
              <label htmlFor="contractDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Дата договора
              </label>
              <DateInput
                id="contractDate"
                value={formData.contractDate}
                onChange={(value) => handleInputChange('contractDate', value)}
              />
            </div>

            {/* Примечания */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Примечания
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="input-field resize-none"
                placeholder="Дополнительная информация о клиенте..."
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 