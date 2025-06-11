'use client'

import { useState, useEffect } from 'react'
import { Plus, Eye, Edit2, Trash2, Building2, User, Phone, Mail, MapPin, FileText, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'
import { Client, CreateClientRequest } from '@/types/client'

export default function ClientsPage() {
  const { session } = useAuth()
  const { showToast } = useToast()
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  
  // Форма создания клиента
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    contractNumber: '',
    notes: ''
  })

  // Загрузка клиентов
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка загрузки клиентов')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Создание клиента
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast('success', 'Клиент создан')
        setIsCreating(false)
        setFormData({ name: '', phone: '', email: '', address: '', contractNumber: '', notes: '' })
        fetchClients()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка создания клиента')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  // Отмена создания
  const cancelCreate = () => {
    setIsCreating(false)
    setFormData({ name: '', phone: '', email: '', address: '', contractNumber: '', notes: '' })
  }

  // Удаление клиента
  const handleDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить клиента "${clientName}"?\n\nЭто действие нельзя отменить.`)) {
      return
    }

    setDeletingClientId(clientId)
    
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Клиент успешно удален')
        fetchClients() // Перезагружаем список
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка удаления клиента')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    } finally {
      setDeletingClientId(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Загрузка клиентов...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-gray-600 mt-2">Управление клиентами и их сметами</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center"
          disabled={isCreating}
        >
          <Plus className="h-5 w-5 mr-2" />
          Добавить клиента
        </button>
      </div>

      {/* Форма создания клиента */}
      {isCreating && (
        <div className="card mb-8">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Добавить нового клиента</h3>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название / ФИО *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                  placeholder="ООО Ромашка или Иванов Иван Иванович"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Номер договора
                </label>
                <input
                  type="text"
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                  className="input"
                  placeholder="№ 123/2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="client@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  placeholder="г. Москва, ул. Ленина, д. 1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Примечания
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input resize-none"
                  rows={3}
                  placeholder="Дополнительная информация о клиенте..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={cancelCreate}
                className="btn-secondary flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Отмена
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center"
              >
                <Check className="h-4 w-4 mr-2" />
                Создать клиента
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список клиентов */}
      {clients.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Клиентов пока нет</h3>
          <p className="text-gray-600 mb-6">Добавьте первого клиента, чтобы начать работу</p>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center mx-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Добавить клиента
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="card hover:shadow-lg transition-all duration-200 group hover:border-pink-200 relative"
            >
              {/* Кнопки действий */}
              <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100">
                <Link
                  href={`/clients/${client.id}/edit`}
                  className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                  title="Редактировать клиента"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit2 className="h-4 w-4" />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(client.id, client.name)
                  }}
                  disabled={deletingClientId === client.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Удалить клиента"
                >
                  {deletingClientId === client.id ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>

              <Link
                href={`/clients/${client.id}`}
                className="block cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4 pr-20">
                  <div className="flex items-center">
                                      <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mr-3 group-hover:bg-pink-200 transition-colors">
                    <Building2 className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                                              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-pink-900 transition-colors">{client.name}</h3>
                      {client.contractNumber && (
                        <p className="text-sm text-gray-500">№ {client.contractNumber}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {client.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {client.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {client.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Создан {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-pink-600 group-hover:text-pink-700 font-medium">
                      Открыть →
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 